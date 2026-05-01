"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Card number masking: XXXX XXXX XXXX XXXX
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

// Expiry masking: MM/YY
function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// CVC masking: max 3 digits
function formatCVC(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

// Haversine distance between two lat/lng pairs (in km)
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CheckoutPage() {
  const { items, totalPrice, withholdingTax, clearCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "courier" | "cargo">("pickup");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [finalTotal, setFinalTotal] = useState(0);
  const [finalTax, setFinalTax] = useState(0);

  // Location data
  const [buyerProfile, setBuyerProfile] = useState<any>(null);
  const [farmerLocations, setFarmerLocations] = useState<Record<string, { lat: number; lng: number }>>({});

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const loadLocations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get buyer profile
      const { data: prof } = await supabase.from("profiles").select("location_lat, location_lng, address").eq("id", user.id).single();
      setBuyerProfile(prof);

      // Get farmer locations for all items in the cart
      const farmerIds = [...new Set(items.map(i => i.farmer_id))];
      if (farmerIds.length > 0) {
        const { data: farmers } = await supabase.from("profiles").select("id, location_lat, location_lng").in("id", farmerIds);
        if (farmers) {
          const locs: Record<string, { lat: number; lng: number }> = {};
          farmers.forEach(f => {
            if (f.location_lat && f.location_lng) {
              locs[f.id] = { lat: Number(f.location_lat), lng: Number(f.location_lng) };
            }
          });
          setFarmerLocations(locs);
        }
      }
    };
    loadLocations();
  }, [items]);

  // Calculate max distance from buyer to any farmer in the cart
  const maxDistanceKm = useMemo(() => {
    if (!buyerProfile?.location_lat || !buyerProfile?.location_lng) return null;
    const buyerLat = Number(buyerProfile.location_lat);
    const buyerLng = Number(buyerProfile.location_lng);
    let maxDist = 0;
    Object.values(farmerLocations).forEach(loc => {
      const dist = haversineKm(buyerLat, buyerLng, loc.lat, loc.lng);
      if (dist > maxDist) maxDist = dist;
    });
    return maxDist > 0 ? maxDist : null;
  }, [buyerProfile, farmerLocations]);

  // Distance-based cargo fee: base ₺10 + ₺0.05/km
  const cargoFee = maxDistanceKm !== null ? Math.round(10 + maxDistanceKm * 0.05) : 20;
  // Cargo unavailable if >500km (roughly one day of shipping)
  const cargoBlocked = maxDistanceKm !== null && maxDistanceKm > 500;

  const shippingFee = deliveryMethod === "pickup" ? 0 : deliveryMethod === "courier" ? 25 : cargoFee;
  const grandTotal = totalPrice + shippingFee;

  // If cargo was selected but is now blocked, reset to pickup
  useEffect(() => {
    if (deliveryMethod === "cargo" && cargoBlocked) {
      setDeliveryMethod("pickup");
    }
  }, [cargoBlocked, deliveryMethod]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        status: "paid",
        total_amount: grandTotal,
        delivery_method: deliveryMethod,
        shipping_fee: shippingFee,
        withholding_tax: withholdingTax,
      })
      .select()
      .single();

    if (orderError || !order) {
      alert("Error creating order: " + (orderError?.message || "Unknown error"));
      setProcessing(false);
      return;
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      farmer_id: item.farmer_id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      alert("Error creating order items: " + itemsError.message);
      setProcessing(false);
      return;
    }

    setFinalTotal(grandTotal);
    setFinalTax(withholdingTax);
    setOrderId(order.id);
    setOrderComplete(true);
    setProcessing(false);
    clearCart();
  };

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-center px-6">
        <div className="text-7xl mb-6">🛒</div>
        <h1 className="text-3xl font-heading font-extrabold text-stone-900 mb-3">Nothing to checkout</h1>
        <Link href="/explore" className="text-emerald-600 font-semibold hover:underline">
          Go to Market
        </Link>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 className="text-4xl font-heading font-extrabold text-stone-900 mb-4">Order Confirmed! 🎉</h1>
        <p className="text-stone-500 text-lg max-w-md mb-2">
          Your order has been placed successfully. The farmer(s) will be notified.
        </p>
        <p className="text-sm text-stone-400 mb-8">Order ID: {orderId.substring(0, 8).toUpperCase()}</p>

        <div className="glass rounded-2xl p-6 max-w-sm w-full mb-8">
          <div className="flex justify-between text-stone-600 mb-2">
            <span>Total Paid</span>
            <span className="font-bold text-stone-900">₺{finalTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-amber-700 text-sm">
            <span>Withholding Tax (4%)</span>
            <span>₺{finalTax.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/dashboard" className="bg-emerald-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-emerald-700 transition-all">
            View Orders
          </Link>
          <Link href="/explore" className="bg-stone-200 text-stone-700 font-semibold px-8 py-3 rounded-xl hover:bg-stone-300 transition-all">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 w-full">
      <Link href="/cart" className="text-emerald-600 font-medium hover:underline mb-6 inline-block">&larr; Back to Cart</Link>
      <h1 className="text-4xl font-heading font-extrabold text-stone-900 mb-8">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Delivery Method */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h2 className="font-heading font-bold text-xl text-stone-900 mb-4">Delivery Method</h2>

            {/* Info about distance */}
            {maxDistanceKm !== null && (
              <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                <span>📍</span>
                <span>Farthest farmer is <strong>{Math.round(maxDistanceKm)} km</strong> away from your location.</span>
              </div>
            )}
            {maxDistanceKm === null && (
              <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>Set your location in <Link href="/dashboard" className="font-bold underline">Profile Settings</Link> for accurate shipping rates.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Pickup */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  deliveryMethod === "pickup" ? "border-emerald-500 bg-emerald-50" : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="text-2xl mb-2">📍</div>
                <div className="font-semibold text-stone-800">Farm Pickup</div>
                <div className="text-xs text-stone-500 mt-1">Collect from the farm</div>
                <div className="text-sm font-bold mt-2 text-emerald-600">Free</div>
              </button>

              {/* Courier */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("courier")}
                className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  deliveryMethod === "courier" ? "border-emerald-500 bg-emerald-50" : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="text-2xl mb-2">🚲</div>
                <div className="font-semibold text-stone-800">Kırsof Courier</div>
                <div className="text-xs text-stone-500 mt-1">Same-day local delivery</div>
                <div className="text-sm font-bold mt-2 text-stone-700">₺25</div>
              </button>

              {/* Cargo — dynamic price & availability */}
              <button
                type="button"
                onClick={() => { if (!cargoBlocked) setDeliveryMethod("cargo"); }}
                disabled={cargoBlocked}
                className={`p-5 rounded-xl border-2 text-left transition-all relative ${
                  cargoBlocked
                    ? "border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed"
                    : deliveryMethod === "cargo"
                      ? "border-emerald-500 bg-emerald-50 cursor-pointer"
                      : "border-stone-200 bg-white hover:border-stone-300 cursor-pointer"
                }`}
              >
                <div className="text-2xl mb-2">📦</div>
                <div className="font-semibold text-stone-800">Standard Cargo</div>
                {cargoBlocked ? (
                  <>
                    <div className="text-xs text-red-500 mt-1 font-semibold">Too far — over 500 km</div>
                    <div className="text-sm font-bold mt-2 text-red-400 line-through">Unavailable</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-stone-500 mt-1">
                      {maxDistanceKm !== null ? `~${Math.round(maxDistanceKm)} km · 1-3 business days` : "1-3 business days"}
                    </div>
                    <div className="text-sm font-bold mt-2 text-stone-700">₺{cargoFee}</div>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Payment (Simulated) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h2 className="font-heading font-bold text-xl text-stone-900 mb-1">Payment Details</h2>
            <p className="text-sm text-stone-400 mb-6">🔒 This is a simulated payment — no real charge will be made.</p>

            <div className="space-y-4">
              {/* Card Number with icon */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    required
                    className="w-full px-4 py-3 pr-14 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-stone-800 placeholder:text-stone-400 tracking-widest font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl select-none">💳</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-stone-800 placeholder:text-stone-400 font-mono tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">CVC</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="123"
                      value={cardCVC}
                      onChange={(e) => setCardCVC(formatCVC(e.target.value))}
                      maxLength={3}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      required
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-stone-800 placeholder:text-stone-400 font-mono tracking-widest"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 select-none">🔒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sticky top-28">
            <h3 className="font-heading font-bold text-xl text-stone-900 mb-4">Order Summary</h3>

            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="text-stone-600 truncate max-w-[60%]">{item.name} × {item.quantity}</span>
                  <span className="font-medium text-stone-800">₺{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr className="border-stone-200" />
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium">₺{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping ({deliveryMethod})</span>
                <span className="font-medium">{shippingFee === 0 ? "Free" : `₺${shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-amber-700 bg-amber-50 px-3 py-2 rounded-lg text-sm">
                <span>Withholding Tax (4%)</span>
                <span className="font-medium">₺{withholdingTax.toFixed(2)}</span>
              </div>
              <hr className="border-stone-200" />
              <div className="flex justify-between text-stone-900">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-extrabold">₺{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              {processing ? "Processing..." : `Pay ₺${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

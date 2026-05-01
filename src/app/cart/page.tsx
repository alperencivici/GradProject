"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, withholdingTax, totalItems } = useCart();

  const groupedByFarmer = items.reduce((groups: Record<string, typeof items>, item) => {
    const key = item.farmer_id;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-center px-6">
        <div className="text-7xl mb-6">🛒</div>
        <h1 className="text-3xl font-heading font-extrabold text-stone-900 mb-3">Your cart is empty</h1>
        <p className="text-stone-500 text-lg mb-8 max-w-md">
          Discover fresh, locally-sourced produce from our farmers and add items to your cart.
        </p>
        <Link
          href="/explore"
          className="bg-emerald-600 text-white font-semibold px-10 py-4 rounded-full hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
        >
          Explore Market
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 w-full">
      <h1 className="text-4xl font-heading font-extrabold text-stone-900 mb-2">Shopping Cart</h1>
      <p className="text-stone-500 mb-8">{totalItems} {totalItems === 1 ? "item" : "items"} in your cart</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedByFarmer).map(([farmerId, farmerItems]) => (
            <div key={farmerId} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="bg-stone-50 px-6 py-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {farmerItems[0].farmer_name.charAt(0)}
                  </div>
                  <span className="font-semibold text-stone-700 text-sm">{farmerItems[0].farmer_name}</span>
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                {farmerItems.map((item) => (
                  <div key={item.product_id} className="p-6 flex items-center gap-5">
                    <div className="w-20 h-20 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🥬</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-stone-800 truncate">{item.name}</h3>
                      <p className="text-emerald-600 font-bold mt-1">₺{item.price} / kg</p>
                    </div>
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="px-3 py-2 text-stone-500 hover:bg-stone-50 cursor-pointer font-bold"
                      >−</button>
                      <span className="px-3 py-2 font-semibold text-stone-800 min-w-[2.5rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="px-3 py-2 text-stone-500 hover:bg-stone-50 cursor-pointer font-bold"
                      >+</button>
                    </div>
                    <div className="text-right min-w-[5rem]">
                      <p className="font-bold text-stone-800">₺{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sticky top-28">
            <h3 className="font-heading font-bold text-xl text-stone-900 mb-6">Order Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium">₺{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className="font-medium text-emerald-600">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-amber-700 bg-amber-50 px-3 py-2 rounded-lg text-sm">
                <span>Withholding Tax (4%)</span>
                <span className="font-medium">₺{withholdingTax.toFixed(2)}</span>
              </div>
              <hr className="border-stone-200" />
              <div className="flex justify-between text-stone-900">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-extrabold">₺{totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-stone-400">* Tax is deducted from seller&apos;s revenue, not charged to buyer.</p>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-emerald-600 text-white text-center font-semibold py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/explore"
              className="block w-full text-center text-stone-500 font-medium mt-3 hover:text-emerald-600 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

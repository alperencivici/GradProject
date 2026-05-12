"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { formatTurkishPhone, extractPhoneDigits, phoneToDisplay } from "@/utils/turkey";
import AddressForm from "@/components/AddressForm";

const RETURN_REASONS = [
  { value: "rotten", label: "🍂 Rotten / Spoiled Product", desc: "Product arrived rotten or significantly spoiled" },
  { value: "wrong_item", label: "📦 Wrong Item Received", desc: "I received a different product than what I ordered" },
  { value: "damaged", label: "💔 Damaged in Transit", desc: "Product was damaged during delivery" },
  { value: "quality", label: "⚠️ Poor Quality", desc: "Product quality doesn't match the description" },
  { value: "unwanted", label: "🔄 Changed My Mind", desc: "I no longer want this product" },
  { value: "other", label: "💬 Other Reason", desc: "Please describe the issue below" },
];

export default function ConsumerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "profile" | "reviews">("orders");

  // Profile edit
  const [editProfile, setEditProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saving, setSaving] = useState(false);

  // Review write
  const [reviewingOrder, setReviewingOrder] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewProduct, setReviewProduct] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // My reviews
  const [myReviews, setMyReviews] = useState<any[]>([]);

  // Return mechanism
  const [returningOrder, setReturningOrder] = useState<any>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDetails, setReturnDetails] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  async function fetchAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUser(user);

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (prof) {
      if (prof.role === "farmer") { router.push("/dashboard/farmer"); return; }
      if (prof.role === "admin") { router.push("/dashboard/admin"); return; }
      setProfile(prof);
      setFullName(prof.full_name || "");
      setPhone(phoneToDisplay(prof.phone));
      setAddress(prof.address || "");
      setLat(prof.location_lat?.toString() || "");
      setLng(prof.location_lng?.toString() || "");
    }

    const { data: ords } = await supabase
      .from("orders")
      .select("*, order_items(*, products(id, name, image_url, farmer_id))")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(ords || []);

    const { data: revs } = await supabase
      .from("reviews")
      .select("*, products(name, image_url)")
      .eq("reviewer_id", user.id)
      .order("created_at", { ascending: false });
    setMyReviews(revs || []);

    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const phoneClean = phone ? extractPhoneDigits(phone) : null;
      const { error } = await supabase.from("profiles").update({ 
        full_name: fullName, 
        phone: phoneClean, 
        address,
        location_lat: parseFloat(lat) || null,
        location_lng: parseFloat(lng) || null
      }).eq("id", user.id);
      if (error) throw error;
      setProfile({ 
        ...profile, 
        full_name: fullName, 
        phone: phoneClean, 
        address,
        location_lat: parseFloat(lat) || null,
        location_lng: parseFloat(lng) || null
      });
      setEditProfile(false);
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewProduct || !reviewComment.trim()) return;
    setSubmittingReview(true);

    try {
      // Find farmer_id from the product
      const item = reviewingOrder?.order_items?.find((i: any) => i.products?.id === reviewProduct);
      const farmerId = item?.products?.farmer_id;

      if (!farmerId) throw new Error("Farmer ID not found for this product.");

      const { error } = await supabase.from("reviews").insert({
        reviewer_id: user.id,
        product_id: reviewProduct,
        farmer_id: farmerId,
        rating: reviewRating,
        comment: reviewComment,
      });
      if (error) throw error;

      toast.success("Review submitted!");
      setReviewingOrder(null);
      setReviewRating(5);
      setReviewComment("");
      setReviewProduct("");
      fetchAll(); // refresh reviews
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      setMyReviews(myReviews.filter((r) => r.id !== id));
      toast.success("Review deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review");
    }
  };

  const handleMarkReceived = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabase.from("orders").update({ status: "completed" }).eq("id", orderId);
      if (error) throw error;
      toast.success("Order marked as received! Thank you.");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSubmitReturn = async () => {
    if (!returnReason || !returningOrder) return;
    setSubmittingReturn(true);
    try {
      const fullReason = returnDetails.trim()
        ? `${returnReason}: ${returnDetails.trim()}`
        : returnReason;
      const { error } = await supabase.from("orders").update({
        status: "return_requested",
        return_reason: fullReason,
      }).eq("id", returningOrder.id);
      if (error) throw error;
      toast.success("Return request submitted. The farmer will review it.");
      setReturningOrder(null);
      setReturnReason("");
      setReturnDetails("");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-stone-100 text-stone-600",
      paid: "bg-blue-100 text-blue-700",
      shipped: "bg-amber-100 text-amber-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-600",
      canceled: "bg-red-100 text-red-600",
      return_requested: "bg-orange-100 text-orange-700",
      admin_review: "bg-indigo-100 text-indigo-700",
      returned: "bg-purple-100 text-purple-700",
    };
    return map[status] || "bg-stone-100 text-stone-600";
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Pending", paid: "Paid", shipped: "Shipped",
      completed: "Completed", cancelled: "Cancelled", canceled: "Cancelled",
      return_requested: "Return Requested", admin_review: "Admin Review", returned: "Returned",
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalSpent = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const completedOrders = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-stone-900">
            Welcome, {profile?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-stone-500 mt-1">{user?.email}</p>
        </div>
        <Link href="/explore" className="bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-sm text-sm">
          Browse Market →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
          <p className="text-sm text-stone-500">Total Orders</p>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
          <p className="text-sm text-stone-500">Completed</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{completedOrders}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
          <p className="text-sm text-stone-500">Total Spent</p>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">₺{totalSpent.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
          <p className="text-sm text-stone-500">My Reviews</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{myReviews.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-8 max-w-md">
        {(["orders", "reviews", "profile"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer capitalize ${
              tab === t
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {t === "orders" ? `Orders (${orders.length})` : t === "reviews" ? `Reviews (${myReviews.length})` : "Profile"}
          </button>
        ))}
      </div>

      {/* ─── ORDERS TAB ─── */}
      {tab === "orders" && (
        <div>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-100">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-heading font-bold text-stone-700 mb-2">No orders yet</h3>
              <p className="text-stone-500 mb-6">Discover fresh produce from local farmers!</p>
              <Link href="/explore" className="bg-emerald-600 text-white font-semibold px-8 py-3 rounded-xl">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                  {/* Order header */}
                  <div className="px-6 py-4 bg-stone-50/50 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-stone-400 font-medium">ORDER</p>
                        <p className="font-mono text-sm font-bold text-stone-700">#{order.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 font-medium">DATE</p>
                        <p className="text-sm text-stone-700">{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 font-medium">DELIVERY</p>
                        <p className="text-sm text-stone-700 capitalize">{order.delivery_method}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase ${statusBadge(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                      <p className="text-lg font-extrabold text-stone-900">₺{Number(order.total_amount).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-6 py-4">
                    <div className="space-y-3">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                            {item.products?.image_url ? (
                              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.products.image_url})` }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🥬</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-stone-800 text-sm">{item.products?.name || "Product"}</p>
                            <p className="text-xs text-stone-500">Qty: {item.quantity} × ₺{item.unit_price}</p>
                          </div>
                          <p className="font-bold text-stone-800 text-sm">₺{(item.unit_price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tax info */}
                    {Number(order.withholding_tax) > 0 && (
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-sm">
                        <span className="text-amber-700 font-medium">Withholding tax (4%)</span>
                        <span className="text-amber-700 font-semibold">₺{Number(order.withholding_tax).toFixed(2)}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap gap-2">
                      {/* Mark as received */}
                      {order.status === "shipped" && (
                        <button
                          onClick={() => handleMarkReceived(order.id)}
                          disabled={updatingOrderId === order.id}
                          className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {updatingOrderId === order.id ? "Updating..." : "✅ I Received the Order"}
                        </button>
                      )}

                      {/* Return product */}
                      {(order.status === "shipped" || order.status === "completed") && (
                        <button
                          onClick={() => { setReturningOrder(order); setReturnReason(""); setReturnDetails(""); }}
                          className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-orange-100 transition-colors cursor-pointer"
                        >
                          🔄 Return Product
                        </button>
                      )}

                      {/* Return status display */}
                      {order.status === "return_requested" && (
                        <div className="w-full flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5">
                          <span className="text-orange-500 text-lg">⏳</span>
                          <div>
                            <p className="text-sm font-semibold text-orange-700">Return request pending</p>
                            <p className="text-xs text-orange-600">Waiting for the farmer to review your return request.</p>
                          </div>
                        </div>
                      )}
                      {order.status === "returned" && (
                        <div className="w-full flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5">
                          <span className="text-purple-500 text-lg">✔️</span>
                          <div>
                            <p className="text-sm font-semibold text-purple-700">Return approved</p>
                            <p className="text-xs text-purple-600">Your return has been approved by the farmer.</p>
                          </div>
                        </div>
                      )}
                      {order.status === "admin_review" && (
                        <div className="w-full flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5">
                          <span className="text-indigo-500 text-lg">i</span>
                          <div>
                            <p className="text-sm font-semibold text-indigo-700">Return under admin review</p>
                            <p className="text-xs text-indigo-600">The farmer sent your return request to the admin for a final decision.</p>
                          </div>
                        </div>
                      )}

                      {/* Write review */}
                      {order.status === "completed" && (
                        <button
                          onClick={() => { setReviewingOrder(order); setReviewProduct(order.order_items?.[0]?.products?.id || ""); }}
                          className="flex items-center gap-2 text-sm text-emerald-600 font-semibold hover:underline cursor-pointer"
                        >
                          ✍️ Write a Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Return Modal ── */}
          {returningOrder && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setReturningOrder(null); }}>
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🔄</div>
                    <div>
                      <h3 className="text-lg font-heading font-bold">Request a Return</h3>
                      <p className="text-orange-100 text-sm">Order #{returningOrder.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-stone-500 text-sm mb-5">Please select a reason for your return. The farmer will review your request within 24–48 hours.</p>

                  {/* Reason selection */}
                  <div className="space-y-2 mb-5">
                    {RETURN_REASONS.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setReturnReason(r.value)}
                        className={`w-full text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                          returnReason === r.value
                            ? "border-orange-400 bg-orange-50"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        <p className={`font-semibold text-sm ${returnReason === r.value ? "text-orange-700" : "text-stone-700"}`}>{r.label}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Extra details */}
                  <div className="mb-6">
                    <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Additional Details <span className="text-stone-400 font-normal">(optional)</span></label>
                    <textarea
                      value={returnDetails}
                      onChange={e => setReturnDetails(e.target.value)}
                      placeholder="Describe the issue in more detail (e.g. the tomatoes were completely rotten on arrival)..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-800 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-stone-400 text-sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitReturn}
                      disabled={!returnReason || submittingReturn}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 cursor-pointer transition-opacity"
                    >
                      {submittingReturn ? "Submitting..." : "Submit Return Request"}
                    </button>
                    <button
                      onClick={() => setReturningOrder(null)}
                      className="px-6 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl cursor-pointer hover:bg-stone-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Modal */}
          {reviewingOrder && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                <h3 className="text-xl font-heading font-bold text-stone-900 mb-4">Write a Review</h3>

                <div className="mb-4">
                  <label className="text-sm font-semibold text-stone-700 mb-2 block">Product</label>
                  <select
                    value={reviewProduct}
                    onChange={(e) => setReviewProduct(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {reviewingOrder.order_items?.map((item: any) => (
                      <option key={item.products?.id} value={item.products?.id}>{item.products?.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-semibold text-stone-700 mb-2 block">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-3xl cursor-pointer transition-transform hover:scale-110"
                      >
                        {star <= reviewRating ? "⭐" : "☆"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-semibold text-stone-700 mb-2 block">Your Review</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-400"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !reviewComment.trim()}
                    className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                  <button
                    onClick={() => setReviewingOrder(null)}
                    className="px-6 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl cursor-pointer hover:bg-stone-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── REVIEWS TAB ─── */}
      {tab === "reviews" && (
        <div>
          {myReviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-100">
              <div className="text-6xl mb-4">✍️</div>
              <h3 className="text-xl font-heading font-bold text-stone-700 mb-2">No reviews written</h3>
              <p className="text-stone-500">After receiving an order, you can leave a review for the products.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                        {review.products?.image_url ? (
                          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${review.products.image_url})` }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🥬</div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-800">{review.products?.name || "Product"}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={`text-sm ${s <= review.rating ? "text-amber-400" : "text-stone-300"}`}>★</span>
                          ))}
                          <span className="text-xs text-stone-400 ml-1">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteReview(review.id)} className="text-xs text-red-500 font-medium hover:underline cursor-pointer">Delete</button>
                  </div>
                  <p className="text-stone-600 mt-3 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── PROFILE TAB ─── */}
      {tab === "profile" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            {/* Profile header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-bold border-2 border-white/30">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
              <div className="text-white">
                <p className="text-2xl font-heading font-bold">{profile?.full_name}</p>
                <p className="text-emerald-100">{user?.email}</p>
                <span className="inline-block mt-1 text-xs bg-white/20 px-3 py-0.5 rounded-full capitalize font-medium">{profile?.role}</span>
              </div>
            </div>

            {/* Profile body */}
            <div className="p-6">
              {editProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">Full Name</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">Phone</label>
                    <div className="relative">
                      <input value={phone} onChange={(e) => setPhone(formatTurkishPhone(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="+90 (5XX) XXX XX XX" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400">🇹🇷</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">Delivery Address</label>
                    <AddressForm 
                      initialAddress={profile?.address || ""}
                      initialCoords={{ lat: profile?.location_lat || null, lng: profile?.location_lng || null }}
                      onChange={(addr, coords) => {
                        setAddress(addr);
                        if (coords) {
                          setLat(coords.lat.toString());
                          setLng(coords.lng.toString());
                        }
                      }}
                      className="mt-1" 
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSaveProfile} disabled={saving} className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 cursor-pointer disabled:opacity-50">
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button onClick={() => setEditProfile(false)} className="px-6 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl cursor-pointer hover:bg-stone-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-stone-100">
                    <span className="text-stone-500 text-sm">Full Name</span>
                    <span className="text-stone-800 font-medium text-sm">{profile?.full_name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-stone-100">
                    <span className="text-stone-500 text-sm">Email</span>
                    <span className="text-stone-800 font-medium text-sm">{user?.email}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-stone-100">
                    <span className="text-stone-500 text-sm">Phone</span>
                    <span className="text-stone-800 font-medium text-sm">{profile?.phone || "Not set"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-stone-100">
                    <span className="text-stone-500 text-sm">Address</span>
                    <span className="text-stone-800 font-medium text-sm text-right max-w-[60%]">{profile?.address || "Not set"}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-stone-500 text-sm">Member Since</span>
                    <span className="text-stone-800 font-medium text-sm">{new Date(profile?.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
                  </div>
                  <button onClick={() => setEditProfile(true)} className="w-full mt-4 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200 cursor-pointer transition-colors">
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { formatTurkishPhone, extractPhoneDigits, phoneToDisplay } from "@/utils/turkey";
import AddressForm from "@/components/AddressForm";

const CATEGORIES = ["fruits", "vegetables", "dairy", "honey", "grains", "oils", "eggs", "other"];

export default function FarmerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "products" | "orders" | "add" | "profile">("overview");

  // Product form
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("");
  const [pCat, setPCat] = useState("fruits");
  const [pImg, setPImg] = useState("");
  const [pImgFile, setPImgFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Profile edit
  const [editProfile, setEditProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUser(user);

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!prof || prof.role !== "farmer") { router.push("/dashboard"); return; }
    setProfile(prof);
    setFullName(prof.full_name || "");
    setPhone(phoneToDisplay(prof.phone));
    setAddress(prof.address || "");
    setLat(prof.location_lat ? String(prof.location_lat) : "");
    setLng(prof.location_lng ? String(prof.location_lng) : "");

    const { data: prods } = await supabase.from("products").select("*").eq("farmer_id", user.id).order("created_at", { ascending: false });
    setProducts(prods || []);

    const { data: oi } = await supabase
      .from("order_items")
      .select("*, orders(id, status, return_reason, buyer_id, delivery_method, created_at, total_amount), products(name, image_url)")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false });
    setOrderItems(oi || []);

    const { data: revs } = await supabase
      .from("reviews")
      .select("*, profiles!reviews_reviewer_id_fkey(full_name), products(name)")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false });
    setReviews(revs || []);

    setLoading(false);
  };

  const resetForm = () => { setEditingProduct(null); setPName(""); setPDesc(""); setPPrice(""); setPStock(""); setPCat("fruits"); setPImg(""); setPImgFile(null); };

  const startEdit = (p: any) => {
    setEditingProduct(p); setPName(p.name); setPDesc(p.description || ""); setPPrice(String(p.price));
    setPStock(String(p.stock_quantity)); setPCat(p.category || "fruits"); setPImg(p.image_url || ""); setPImgFile(null); setTab("add");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setSaving(true);
    try {
      let finalImageUrl = pImg;

      if (pImgFile) {
        const fileExt = pImgFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `product_images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, pImgFile);
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      }

      const payload = { name: pName, description: pDesc, price: parseFloat(pPrice), stock_quantity: parseInt(pStock), category: pCat, image_url: finalImageUrl || null, farmer_id: user.id };
      
      if (editingProduct) { 
        const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id); 
        if (error) throw error;
        toast.success("Product updated successfully!");
      } else { 
        const { error } = await supabase.from("products").insert(payload); 
        if (error) throw error;
        toast.success("Product added successfully!");
      }
      
      resetForm(); setTab("products"); fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => { 
    if (!confirm("Delete this product permanently?")) return; 
    try {
      const { error } = await supabase.from("products").delete().eq("id", id); 
      if (error) {
        if (error.code === '23503') { // Foreign key constraint violation
          throw new Error("Cannot delete product because it has existing orders.");
        }
        throw error;
      }
      toast.success("Product deleted");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      toast.success("Order status updated");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update order status");
    }
  };

  const handleApproveReturn = async (orderId: string) => {
    if (!confirm("Approve this return request? The order will be marked as returned.")) return;
    try {
      const { error } = await supabase.from("orders").update({ status: "returned" }).eq("id", orderId);
      if (error) throw error;
      toast.success("Return approved. Order marked as returned.");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve return");
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const phoneClean = phone ? extractPhoneDigits(phone) : null;
      const { error } = await supabase.from("profiles").update({
        full_name: fullName, phone: phoneClean, address,
        location_lat: lat ? parseFloat(lat) : null,
        location_lng: lng ? parseFloat(lng) : null,
      }).eq("id", user.id);
      
      if (error) throw error;
      
      setProfile({ ...profile, full_name: fullName, phone: phoneClean, address, location_lat: lat ? parseFloat(lat) : null, location_lng: lng ? parseFloat(lng) : null });
      setEditProfile(false);
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return <div className="flex flex-1 items-center justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>;
  }

  const totalRev = orderItems.reduce((s, o) => s + o.unit_price * o.quantity, 0);
  const totalTax = totalRev * 0.04;
  const netIncome = totalRev - totalTax;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  // Group order items by order
  const orderMap: Record<string, { order: any; items: any[] }> = {};
  orderItems.forEach((oi) => {
    if (!oi.orders) return;
    if (!orderMap[oi.orders.id]) orderMap[oi.orders.id] = { order: oi.orders, items: [] };
    orderMap[oi.orders.id].items.push(oi);
  });
  const groupedOrders = Object.values(orderMap).sort((a, b) => new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime());

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-stone-900">Farmer Dashboard</h1>
          <p className="text-stone-500 mt-1">Manage your store, track orders, and grow your business</p>
        </div>
        <button onClick={() => { resetForm(); setTab("add"); }} className="bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-sm cursor-pointer text-sm">
          + Add Product
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-8 overflow-x-auto">
        {(["overview", "products", "orders", "add", "profile"] as const).map((t) => (
          <button key={t} onClick={() => { if (t === "add") resetForm(); setTab(t); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer capitalize whitespace-nowrap px-3 ${tab === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
            {t === "add" ? "Add Product" : t}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Products", val: products.length, color: "text-stone-900" },
              { label: "Orders", val: groupedOrders.length, color: "text-blue-600" },
              { label: "Revenue", val: `₺${totalRev.toFixed(0)}`, color: "text-emerald-600" },
              { label: "Tax (4%)", val: `₺${totalTax.toFixed(0)}`, color: "text-amber-600" },
              { label: "Net Income", val: `₺${netIncome.toFixed(0)}`, color: "text-emerald-700" },
              { label: "Avg Rating", val: avgRating, color: "text-amber-500" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
                <p className="text-xs text-stone-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <h3 className="font-heading font-bold text-lg text-stone-900 mb-4">Recent Orders</h3>
            {groupedOrders.length === 0 ? <p className="text-stone-500 text-sm">No orders yet. Once customers buy your products, they will appear here.</p> : (
              <div className="space-y-3">
                {groupedOrders.slice(0, 5).map(({ order, items }) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-stone-50 last:border-0">
                    <div>
                      <p className="font-medium text-stone-800 text-sm">{items.map(i => i.products?.name).join(", ")}</p>
                      <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleDateString()} · {order.delivery_method}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className="font-bold text-stone-800 text-sm">₺{items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0).toFixed(2)}</p>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        order.status === "paid" ? "bg-blue-100 text-blue-700" : order.status === "shipped" ? "bg-amber-100 text-amber-700" : order.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <h3 className="font-heading font-bold text-lg text-stone-900 mb-4">Latest Reviews</h3>
            {reviews.length === 0 ? <p className="text-stone-500 text-sm">No reviews yet.</p> : (
              <div className="space-y-3">
                {reviews.slice(0, 4).map((r) => (
                  <div key={r.id} className="py-3 border-b border-stone-50 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-stone-800 text-sm">{r.profiles?.full_name || "Customer"} on <span className="text-emerald-600">{r.products?.name}</span></p>
                      <div className="flex">{[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= r.rating ? "text-amber-400" : "text-stone-300"}`}>★</span>)}</div>
                    </div>
                    <p className="text-stone-600 text-sm">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PRODUCTS ─── */}
      {tab === "products" && (
        <div>
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-100">
              <div className="text-6xl mb-4">🌱</div>
              <h3 className="text-xl font-heading font-bold text-stone-700 mb-2">No products yet</h3>
              <p className="text-stone-500 mb-6">List your first product to start receiving orders!</p>
              <button onClick={() => { resetForm(); setTab("add"); }} className="bg-emerald-600 text-white font-semibold px-8 py-3 rounded-xl cursor-pointer">+ Add Product</button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Table-like header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1 text-right">Price</div>
                <div className="col-span-1 text-right">Stock</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-stone-100 shadow-sm p-4 md:grid md:grid-cols-12 md:gap-4 md:items-center">
                  {/* Product info */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                      {p.image_url ? <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${p.image_url})` }} /> : <div className="w-full h-full flex items-center justify-center text-2xl">🥬</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-800 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-stone-500 truncate">{p.description?.substring(0, 50)}...</p>
                    </div>
                  </div>
                  <div className="col-span-2 mt-2 md:mt-0">
                    <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full capitalize font-medium">{p.category}</span>
                  </div>
                  <div className="col-span-1 text-right font-bold text-emerald-600 text-sm mt-2 md:mt-0">₺{p.price}</div>
                  <div className="col-span-1 text-right mt-2 md:mt-0">
                    <span className={`text-sm font-semibold ${p.stock_quantity <= 5 ? "text-red-500" : "text-stone-700"}`}>{p.stock_quantity}</span>
                  </div>
                  <div className="col-span-3 flex gap-2 justify-end mt-3 md:mt-0">
                    <button onClick={() => startEdit(p)} className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer">Edit</button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="px-4 py-2 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ORDERS ─── */}
      {tab === "orders" && (
        <div>
          {groupedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-100">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-heading font-bold text-stone-700 mb-2">No orders yet</h3>
              <p className="text-stone-500">When customers purchase your products, their orders appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedOrders.map(({ order, items }) => {
                const orderTotal = items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0);
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-stone-50/50 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div><p className="text-[10px] text-stone-400 font-medium uppercase">Order</p><p className="font-mono font-bold text-stone-700">#{order.id.substring(0, 8).toUpperCase()}</p></div>
                        <div><p className="text-[10px] text-stone-400 font-medium uppercase">Date</p><p className="text-stone-700">{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p></div>
                        <div><p className="text-[10px] text-stone-400 font-medium uppercase">Delivery</p><p className="text-stone-700 capitalize">{order.delivery_method}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase ${
                          order.status === "paid" ? "bg-blue-100 text-blue-700" 
                          : order.status === "shipped" ? "bg-amber-100 text-amber-700" 
                          : order.status === "completed" ? "bg-emerald-100 text-emerald-700" 
                          : order.status === "return_requested" ? "bg-orange-100 text-orange-700" 
                          : order.status === "returned" ? "bg-purple-100 text-purple-700" 
                          : "bg-stone-100 text-stone-600"
                        }`}>{order.status === "return_requested" ? "Return Req." : order.status}</span>
                        <p className="text-lg font-extrabold text-stone-900">₺{orderTotal.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      {items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 py-2">
                          <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                            {item.products?.image_url ? <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.products.image_url})` }} /> : <div className="w-full h-full flex items-center justify-center text-xl">🥬</div>}
                          </div>
                          <div className="flex-1"><p className="font-semibold text-stone-800 text-sm">{item.products?.name}</p><p className="text-xs text-stone-500">{item.quantity} × ₺{item.unit_price}</p></div>
                          <p className="font-bold text-stone-800 text-sm">₺{(item.unit_price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                      {/* Tax info */}
                      <div className="mt-3 pt-3 border-t border-stone-100 text-sm flex justify-between text-amber-700">
                        <span>Tax withheld (4%)</span><span className="font-semibold">−₺{(orderTotal * 0.04).toFixed(2)}</span>
                      </div>
                      <div className="text-sm flex justify-between text-emerald-700 font-semibold mt-1">
                        <span>You receive</span><span>₺{(orderTotal * 0.96).toFixed(2)}</span>
                      </div>
                      {/* Order actions */}
                      <div className="mt-4 pt-3 border-t border-stone-100 flex gap-2 flex-wrap">
                        {/* Return request banner */}
                        {order.status === "return_requested" && (
                          <div className="w-full bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-2">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl flex-shrink-0">🔄</span>
                              <div className="flex-1">
                                <p className="font-bold text-orange-800 text-sm">Return Requested by Customer</p>
                                <p className="text-orange-700 text-xs mt-1">
                                  <span className="font-semibold">Reason:</span>{" "}
                                  {order.return_reason || "No reason provided"}
                                </p>
                                <p className="text-orange-600 text-xs mt-1">Please review and approve or contact the customer.</p>
                              </div>
                              <button
                                onClick={() => handleApproveReturn(order.id)}
                                className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold px-4 py-2 rounded-lg text-xs cursor-pointer hover:opacity-90 transition-opacity"
                              >
                                ✅ Approve Return
                              </button>
                            </div>
                          </div>
                        )}
                        {order.status === "returned" && (
                          <div className="w-full flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5">
                            <span className="text-purple-500">✔️</span>
                            <p className="text-sm font-semibold text-purple-700">Return approved — order returned</p>
                          </div>
                        )}
                        {order.status === "paid" && (
                          <button onClick={() => handleUpdateOrderStatus(order.id, "shipped")} className="bg-amber-100 text-amber-800 font-semibold px-5 py-2 rounded-lg text-sm cursor-pointer hover:bg-amber-200 transition-colors">📦 Mark as Shipped</button>
                        )}
                        {order.status === "shipped" && (
                          <button onClick={() => handleUpdateOrderStatus(order.id, "completed")} className="bg-emerald-100 text-emerald-800 font-semibold px-5 py-2 rounded-lg text-sm cursor-pointer hover:bg-emerald-200 transition-colors">✅ Mark as Completed</button>
                        )}
                        {(order.status === "paid" || order.status === "shipped") && (
                          <button onClick={() => { if (confirm("Cancel this order?")) handleUpdateOrderStatus(order.id, "canceled"); }} className="bg-red-50 text-red-600 font-semibold px-5 py-2 rounded-lg text-sm cursor-pointer hover:bg-red-100 transition-colors">Cancel Order</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── ADD/EDIT PRODUCT ─── */}
      {tab === "add" && (
        <form onSubmit={handleSaveProduct} className="max-w-2xl bg-white rounded-2xl p-8 border border-stone-100 shadow-sm space-y-5">
          <h2 className="font-heading font-bold text-2xl text-stone-900">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Product Name*</label><input value={pName} onChange={(e) => setPName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Organic Tomatoes" /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Description</label><textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Describe your product in detail..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Price (₺/kg)*</label><input type="number" step="0.01" min="0" value={pPrice} onChange={(e) => setPPrice(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="25.00" /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Stock Quantity*</label><input type="number" min="0" value={pStock} onChange={(e) => setPStock(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="100" /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Category*</label><select value={pCat} onChange={(e) => setPCat(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500">{CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</select></div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Product Image</label>
            <input type="file" accept="image/*" onChange={(e) => { 
              if (e.target.files?.[0]) { 
                setPImgFile(e.target.files[0]); 
                setPImg(URL.createObjectURL(e.target.files[0])); 
              } 
            }} className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
            {pImg && <div className="mt-3 w-32 h-32 rounded-xl bg-stone-100 bg-cover bg-center border border-stone-200" style={{ backgroundImage: `url(${pImg})` }} />}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 cursor-pointer disabled:opacity-50">{saving ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}</button>
            <button type="button" onClick={() => { resetForm(); setTab("products"); }} className="px-6 py-3.5 bg-stone-100 text-stone-700 font-semibold rounded-xl cursor-pointer hover:bg-stone-200">Cancel</button>
          </div>
        </form>
      )}

      {/* ─── PROFILE ─── */}
      {tab === "profile" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-bold border-2 border-white/30">{profile?.full_name?.charAt(0)}</div>
              <div className="text-white">
                <p className="text-2xl font-heading font-bold">{profile?.full_name}</p>
                <p className="text-emerald-100">{user?.email}</p>
                <span className="inline-block mt-1 text-xs bg-white/20 px-3 py-0.5 rounded-full font-medium">🌾 Verified Farmer</span>
              </div>
            </div>
            <div className="p-6">
              {editProfile ? (
                <div className="space-y-4">
                  <div><label className="text-sm font-semibold text-stone-700 block mb-1">Full Name</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">Phone</label>
                    <div className="relative">
                      <input value={phone} onChange={(e) => setPhone(formatTurkishPhone(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="+90 (5XX) XXX XX XX" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400">🇹🇷</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-1">Farm Address</label>
                    <AddressForm onChange={setAddress} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-semibold text-stone-700 block mb-1">Latitude <span className="text-stone-400 font-normal">(for map)</span></label><input value={lat} onChange={(e) => setLat(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="39.9334" /></div>
                    <div><label className="text-sm font-semibold text-stone-700 block mb-1">Longitude <span className="text-stone-400 font-normal">(for map)</span></label><input value={lng} onChange={(e) => setLng(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="32.8597" /></div>
                  </div>
                  <p className="text-xs text-stone-400">💡 Tip: Find your coordinates on Google Maps by right-clicking your farm location.</p>
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSaveProfile} disabled={profileSaving} className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 cursor-pointer disabled:opacity-50">{profileSaving ? "Saving..." : "Save Changes"}</button>
                    <button onClick={() => setEditProfile(false)} className="px-6 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl cursor-pointer hover:bg-stone-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Full Name", value: profile?.full_name },
                    { label: "Email", value: user?.email },
                    { label: "Phone", value: profile?.phone || "Not set" },
                    { label: "Farm Address", value: profile?.address || "Not set" },
                    { label: "Map Coordinates", value: profile?.location_lat ? `${profile.location_lat}, ${profile.location_lng}` : "Not set — your farm won't appear on the map" },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between py-3 border-b border-stone-100 last:border-0">
                      <span className="text-stone-500 text-sm">{row.label}</span>
                      <span className="text-stone-800 font-medium text-sm text-right max-w-[60%]">{row.value}</span>
                    </div>
                  ))}
                  <button onClick={() => setEditProfile(true)} className="w-full mt-4 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200 cursor-pointer">Edit Profile</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

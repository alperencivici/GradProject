"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "users" | "products" | "orders" | "reviews">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [adminImgFile, setAdminImgFile] = useState<File | null>(null);
  const [adminImgPreview, setAdminImgPreview] = useState<string>("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUser(user);

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!prof || prof.role !== "admin") { router.push("/dashboard"); return; }
    setProfile(prof);

    const { data: allUsers } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(allUsers || []);

    const { data: allProducts } = await supabase.from("products").select("*, profiles!products_farmer_id_fkey(full_name)").order("created_at", { ascending: false });
    setProducts(allProducts || []);

    const { data: allOrders } = await supabase.from("orders").select("*, profiles!orders_buyer_id_fkey(full_name), order_items(quantity, unit_price)").order("created_at", { ascending: false });
    setOrders(allOrders || []);

    const { data: allReviews } = await supabase.from("reviews").select("*, profiles!reviews_reviewer_id_fkey(full_name), products(name)").order("created_at", { ascending: false });
    setReviews(allReviews || []);

    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter(p => p.id !== id));
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    setReviews(reviews.filter(r => r.id !== id));
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = { 
      full_name: formData.get("full_name"), 
      phone: formData.get("phone"), 
      address: formData.get("address"),
      location_lat: formData.get("location_lat") ? parseFloat(formData.get("location_lat") as string) : null,
      location_lng: formData.get("location_lng") ? parseFloat(formData.get("location_lng") as string) : null,
      role: formData.get("role") 
    };
    await supabase.from("profiles").update(updates).eq("id", editingUser.id);
    setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updates } : u));
    setEditingUser(null);
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let imageUrl = editingProduct.image_url;

    // Upload new image if selected
    if (adminImgFile) {
      const fileExt = adminImgFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product_images/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, adminImgFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
    }

    const updates = { 
      name: formData.get("name"), 
      description: formData.get("description"),
      price: parseFloat(formData.get("price") as string), 
      stock_quantity: parseInt(formData.get("stock") as string),
      category: formData.get("category"),
      image_url: imageUrl,
    };
    await supabase.from("products").update(updates).eq("id", editingProduct.id);
    setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...updates } : p));
    setEditingProduct(null);
    setAdminImgFile(null);
    setAdminImgPreview("");
  };

  if (loading) {
    return <div className="flex flex-1 items-center justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>;
  }

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalTax = orders.reduce((s, o) => s + Number(o.withholding_tax || 0), 0);
  const farmerCount = users.filter(u => u.role === "farmer").length;
  const consumerCount = users.filter(u => u.role === "consumer").length;

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch)
  );

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { pending: "bg-stone-100 text-stone-600", paid: "bg-blue-100 text-blue-700", shipped: "bg-amber-100 text-amber-700", completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-600" };
    return m[s] || m.pending;
  };

  const roleBadge = (r: string) => {
    const m: Record<string, string> = { admin: "bg-purple-100 text-purple-700", farmer: "bg-emerald-100 text-emerald-700", consumer: "bg-blue-100 text-blue-700" };
    return m[r] || "bg-stone-100 text-stone-600";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-sm">A</div>
          <h1 className="text-3xl font-heading font-extrabold text-stone-900">Admin Panel</h1>
        </div>
        <p className="text-stone-500">Platform overview and management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-8 overflow-x-auto">
        {(["overview", "users", "products", "orders", "reviews"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer capitalize whitespace-nowrap px-3 ${tab === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Users", val: users.length, color: "text-stone-900" },
              { label: "Farmers", val: farmerCount, color: "text-emerald-600" },
              { label: "Consumers", val: consumerCount, color: "text-blue-600" },
              { label: "Products", val: products.length, color: "text-stone-900" },
              { label: "Orders", val: orders.length, color: "text-amber-600" },
              { label: "Revenue", val: `₺${totalRevenue.toFixed(0)}`, color: "text-emerald-600" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
                <p className="text-xs text-stone-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
              <h3 className="font-heading font-bold text-lg text-stone-900 mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-stone-100"><span className="text-stone-600">Gross Revenue</span><span className="font-bold text-stone-900">₺{totalRevenue.toFixed(2)}</span></div>
                <div className="flex justify-between py-2 border-b border-stone-100"><span className="text-amber-700">Total Tax Collected (4%)</span><span className="font-bold text-amber-700">₺{totalTax.toFixed(2)}</span></div>
                <div className="flex justify-between py-2"><span className="text-emerald-700">Paid to Farmers</span><span className="font-bold text-emerald-700">₺{(totalRevenue - totalTax).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
              <h3 className="font-heading font-bold text-lg text-stone-900 mb-4">Order Status Breakdown</h3>
              <div className="space-y-2">
                {["pending", "paid", "shipped", "completed", "cancelled"].map(s => {
                  const count = orders.filter(o => o.status === s).length;
                  const pct = orders.length > 0 ? (count / orders.length * 100) : 0;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase w-24 text-center ${statusBadge(s)}`}>{s}</span>
                      <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-stone-700 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <h3 className="font-heading font-bold text-lg text-stone-900 mb-4">Recent Reviews</h3>
            {reviews.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-start justify-between py-3 border-b border-stone-50 last:border-0">
                <div>
                  <p className="text-sm"><span className="font-semibold text-stone-800">{r.profiles?.full_name}</span> on <span className="text-emerald-600">{r.products?.name}</span></p>
                  <p className="text-xs text-stone-500 mt-0.5">{r.comment?.substring(0, 80)}...</p>
                </div>
                <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= r.rating ? "text-amber-400" : "text-stone-300"}`}>★</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── USERS ─── */}
      {tab === "users" && (
        <div>
          <div className="mb-6 max-w-sm">
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm placeholder:text-stone-400" />
          </div>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-stone-50 text-xs font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
              <div className="col-span-4">User</div><div className="col-span-2">Role</div><div className="col-span-3">Phone</div><div className="col-span-3">Joined</div>
            </div>
            {filteredUsers.map(u => (
              <div key={u.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-stone-50 last:border-0 items-center">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center text-white font-bold flex-shrink-0">{u.full_name?.charAt(0)}</div>
                  <div className="min-w-0"><p className="font-semibold text-stone-800 text-sm truncate">{u.full_name}</p><p className="text-xs text-stone-400 truncate">{u.address || "No address"}</p></div>
                </div>
                <div className="col-span-2"><span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${roleBadge(u.role)}`}>{u.role}</span></div>
                <div className="col-span-3 text-sm text-stone-600">{u.phone || "—"}</div>
                <div className="col-span-3 text-sm text-stone-500 flex justify-between items-center">
                  {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  <button onClick={() => setEditingUser(u)} className="text-xs text-blue-600 font-semibold hover:underline px-2 py-1 bg-blue-50 rounded-lg">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── PRODUCTS ─── */}
      {tab === "products" && (
        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            <div className="col-span-4">Product</div><div className="col-span-2">Farmer</div><div className="col-span-2">Category</div><div className="col-span-1 text-right">Price</div><div className="col-span-1 text-right">Stock</div><div className="col-span-2 text-right">Action</div>
          </div>
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-stone-100 shadow-sm p-4 md:grid md:grid-cols-12 md:gap-4 md:items-center">
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">{p.image_url ? <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${p.image_url})` }} /> : <div className="w-full h-full flex items-center justify-center text-xl">🥬</div>}</div>
                <p className="font-semibold text-stone-800 text-sm truncate">{p.name}</p>
              </div>
              <div className="col-span-2 text-sm text-stone-600">{p.profiles?.full_name}</div>
              <div className="col-span-2"><span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full capitalize">{p.category}</span></div>
              <div className="col-span-1 text-right font-bold text-emerald-600 text-sm">₺{p.price}</div>
              <div className="col-span-1 text-right text-sm font-semibold text-stone-700">{p.stock_quantity}</div>
              <div className="col-span-2 flex justify-end gap-2">
                <button onClick={() => setEditingProduct(p)} className="text-xs text-blue-600 font-semibold hover:underline px-2 py-1 bg-blue-50 rounded-lg">Edit</button>
                <button onClick={() => handleDeleteProduct(p.id)} className="text-xs text-red-600 font-semibold hover:underline px-2 py-1 bg-red-50 rounded-lg">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ORDERS ─── */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border border-stone-100 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-mono text-sm font-bold text-stone-700">#{o.id.substring(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-stone-500">{o.profiles?.full_name} · {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="capitalize text-sm text-stone-600">{o.delivery_method}</span>
                <select value={o.status} onChange={e => handleUpdateOrderStatus(o.id, e.target.value)} className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase cursor-pointer border-0 ${statusBadge(o.status)}`}>
                  {["pending", "paid", "shipped", "completed", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="text-lg font-extrabold text-stone-900 ml-2">₺{Number(o.total_amount).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── REVIEWS ─── */}
      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-stone-100 shadow-sm p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-stone-800 text-sm">{r.profiles?.full_name}</p>
                  <span className="text-stone-400 text-xs">on</span>
                  <p className="text-emerald-600 text-sm font-medium">{r.products?.name}</p>
                  <div className="flex ml-2">{[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= r.rating ? "text-amber-400" : "text-stone-300"}`}>★</span>)}</div>
                </div>
                <p className="text-stone-600 text-sm">{r.comment}</p>
                <p className="text-xs text-stone-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDeleteReview(r.id)} className="text-xs text-red-500 font-semibold hover:underline cursor-pointer flex-shrink-0">Delete</button>
            </div>
          ))}
        </div>
      )}
      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveUser} className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative">
            <button type="button" onClick={() => setEditingUser(null)} className="absolute top-6 right-6 text-stone-400 hover:text-stone-600 transition-colors">✕</button>
            <h3 className="text-2xl font-heading font-extrabold text-stone-900 mb-6">Edit User Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Full Name</label>
                <input name="full_name" defaultValue={editingUser.full_name} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" required />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Phone Number</label>
                <input name="phone" defaultValue={editingUser.phone} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Role</label>
                <select name="role" defaultValue={editingUser.role} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer font-medium">
                  <option value="consumer">Consumer</option>
                  <option value="farmer">Farmer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Address</label>
                <textarea name="address" rows={2} defaultValue={editingUser.address} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium resize-none" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Latitude <span className="text-stone-400 font-normal normal-case">(optional)</span></label>
                <input name="location_lat" type="number" step="0.00000001" defaultValue={editingUser.location_lat} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Longitude <span className="text-stone-400 font-normal normal-case">(optional)</span></label>
                <input name="location_lng" type="number" step="0.00000001" defaultValue={editingUser.location_lng} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3 border-t border-stone-100 pt-6">
              <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-3 bg-stone-100/80 text-stone-700 hover:bg-stone-200 rounded-xl font-bold transition-all cursor-pointer">Cancel</button>
              <button type="submit" className="px-6 py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProduct} className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative">
            <button type="button" onClick={() => setEditingProduct(null)} className="absolute top-6 right-6 text-stone-400 hover:text-stone-600 transition-colors">✕</button>
            <h3 className="text-2xl font-heading font-extrabold text-stone-900 mb-6 flex items-center gap-4">
              Edit Product
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{editingProduct.id.substring(0,8)}</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Product Name</label>
                <input name="name" defaultValue={editingProduct.name} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" required />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Description</label>
                <textarea name="description" rows={3} defaultValue={editingProduct.description} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium resize-none" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Price (₺)</label>
                <input type="number" step="0.01" name="price" defaultValue={editingProduct.price} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" required />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Stock Quantity</label>
                <input type="number" name="stock" defaultValue={editingProduct.stock_quantity} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" required />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Category</label>
                <select name="category" defaultValue={editingProduct.category} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer font-medium">
                  {["fruits", "vegetables", "dairy", "honey", "grains", "oils", "eggs", "other"].map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Product Image</label>
                <div className="flex items-start gap-4">
                  {(adminImgPreview || editingProduct.image_url) && (
                    <div className="w-24 h-24 rounded-xl bg-stone-100 bg-cover bg-center border border-stone-200 flex-shrink-0" style={{ backgroundImage: `url(${adminImgPreview || editingProduct.image_url})` }} />
                  )}
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setAdminImgFile(e.target.files[0]);
                        setAdminImgPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" />
                    <p className="text-xs text-stone-400 mt-1">Select a new image to replace the current one</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-stone-100 pt-6">
              <button type="button" onClick={() => { setEditingProduct(null); setAdminImgFile(null); setAdminImgPreview(""); }} className="px-6 py-3 bg-stone-100/80 text-stone-700 hover:bg-stone-200 rounded-xl font-bold transition-all cursor-pointer">Cancel</button>
              <button type="submit" className="px-6 py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

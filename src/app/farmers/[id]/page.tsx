"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function FarmerStorePage() {
  const { id } = useParams();
  const [farmer, setFarmer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { addItem } = useCart();

  async function fetchFarmer() {
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", id).single();
    setFarmer(prof);

    const { data: prods } = await supabase.from("products").select("*").eq("farmer_id", id).order("created_at", { ascending: false });
    setProducts(prods || []);

    const { data: revs } = await supabase
      .from("reviews")
      .select("*, profiles!reviews_reviewer_id_fkey(full_name)")
      .eq("farmer_id", id)
      .order("created_at", { ascending: false });
    setReviews(revs || []);

    setLoading(false);
  }

  useEffect(() => {
    fetchFarmer();
  }, [id]);

  const handleQuickAdd = (product: any) => {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url || "",
      farmer_id: product.farmer_id,
      farmer_name: farmer?.full_name || "Farmer",
    });
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-heading font-bold text-stone-700 mb-2">Farmer not found</h2>
        <Link href="/farmers" className="text-emerald-600 font-medium hover:underline">Back to Farmers</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 w-full">
      <Link href="/farmers" className="text-emerald-600 font-medium hover:underline mb-6 inline-block">&larr; All Farmers</Link>

      {/* Farmer Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl p-8 md:p-12 text-white mb-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-bold border-2 border-white/30">
            {farmer.full_name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold">{farmer.full_name}</h1>
            <p className="text-emerald-100 mt-1">📍 {farmer.address || "Registered Producer"}</p>
            {avgRating && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-amber-300">★</span>
                <span className="font-bold">{avgRating}</span>
                <span className="text-emerald-200">({reviews.length} reviews)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-2xl font-heading font-bold text-stone-900 mb-6">Products ({products.length})</h2>
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-stone-100 mb-10">
          <p className="text-stone-500">No products listed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 group">
              <Link href={`/product/${product.id}`}>
                <div className="h-44 overflow-hidden bg-stone-100">
                  {product.image_url ? (
                    <div className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url(${product.image_url})` }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🥬</div>
                  )}
                </div>
              </Link>
              <div className="p-5">
                <Link href={`/product/${product.id}`}>
                  <h3 className="font-bold text-stone-800 group-hover:text-emerald-600 transition-colors">{product.name}</h3>
                </Link>
                <p className="text-sm text-stone-500 line-clamp-2 mt-1">{product.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-bold text-emerald-600">₺{product.price}</span>
                  {product.stock_quantity > 0 ? (
                    <button
                      onClick={() => handleQuickAdd(product)}
                      className="bg-emerald-50 text-emerald-700 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer text-sm"
                    >
                      + Add
                    </button>
                  ) : (
                    <span className="text-xs text-red-500 font-medium">Out of Stock</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews */}
      <h2 className="text-2xl font-heading font-bold text-stone-900 mb-6">Reviews ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-stone-100">
          <p className="text-stone-500">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-600">
                    {r.profiles?.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800">{r.profiles?.full_name || "User"}</p>
                    <p className="text-xs text-stone-400">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= r.rating ? "text-amber-400" : "text-stone-300"}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-stone-600">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

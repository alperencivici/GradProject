"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "🍎 Fruits", value: "fruits" },
  { label: "🥦 Vegetables", value: "vegetables" },
  { label: "🧀 Dairy", value: "dairy" },
  { label: "🍯 Honey & Jams", value: "honey" },
  { label: "🌾 Grains", value: "grains" },
  { label: "🫒 Oils", value: "oils" },
  { label: "🥚 Eggs & Poultry", value: "eggs" },
];

export default function ExploreContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("newest");
  const supabase = createClient();

  async function fetchProducts() {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("*, profiles!products_farmer_id_fkey(full_name, avatar_url)");

    if (category) {
      query = query.eq("category", category);
    }

    if (sortBy === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (sortBy === "price_desc") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, [category, sortBy]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-stone-900 mb-3">
          Explore Market
        </h1>
        <p className="text-stone-500 text-lg max-w-2xl">
          Browse fresh, locally sourced produce from verified farmers across Turkey.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search products, farmers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-stone-800 placeholder:text-stone-400 shadow-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3.5 rounded-2xl border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              category === cat.value
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                : "bg-white text-stone-600 border border-stone-200 hover:border-emerald-400 hover:text-emerald-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-2xl font-heading font-bold text-stone-700 mb-2">No products found</h3>
          <p className="text-stone-500 max-w-md">
            {search
              ? `No results for "${search}". Try a different search term.`
              : "There are no products in this category yet. Check back soon!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group border border-stone-100"
            >
              <div className="h-52 overflow-hidden bg-stone-100 relative">
                {product.image_url ? (
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundImage: `url(${product.image_url})` }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🥬</div>
                )}
                {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                  <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Only {product.stock_quantity} left
                  </div>
                )}
                {product.stock_quantity === 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {product.profiles?.full_name?.charAt(0) || "F"}
                  </div>
                  <span className="text-xs text-stone-500 font-medium">{product.profiles?.full_name || "Farmer"}</span>
                </div>
                <h3 className="font-heading font-bold text-stone-800 text-lg mb-1 group-hover:text-emerald-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-stone-500 text-sm line-clamp-2 mb-3">{product.description}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold text-emerald-600">₺{product.price}</span>
                    <span className="text-stone-400 text-sm ml-1">/ kg</span>
                  </div>
                  {product.category && (
                    <span className="text-xs bg-stone-100 text-stone-500 px-3 py-1 rounded-full capitalize">
                      {product.category}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

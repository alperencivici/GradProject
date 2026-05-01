"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const CATEGORIES = [
  { label: "Fruits", emoji: "🍎", cat: "fruits", color: "bg-red-50 text-red-700 hover:bg-red-100" },
  { label: "Vegetables", emoji: "🥦", cat: "vegetables", color: "bg-green-50 text-green-700 hover:bg-green-100" },
  { label: "Dairy", emoji: "🧀", cat: "dairy", color: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" },
  { label: "Honey", emoji: "🍯", cat: "honey", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { label: "Grains", emoji: "🌾", cat: "grains", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
  { label: "Oils", emoji: "🫒", cat: "oils", color: "bg-lime-50 text-lime-700 hover:bg-lime-100" },
  { label: "Eggs", emoji: "🥚", cat: "eggs", color: "bg-stone-100 text-stone-700 hover:bg-stone-200" },
];

export default function Home() {
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      // Fetch 8 newest products to display on the homepage
      const { data } = await supabase
        .from("products")
        .select("*, profiles!products_farmer_id_fkey(full_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(8);
      
      setTrendingProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col flex-1 w-full bg-stone-50 pb-20">
      
      {/* Promotional Hero Banner Layout */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[480px]">
          
          {/* Main Hero Slider Area */}
          <div className="md:col-span-2 relative rounded-3xl overflow-hidden bg-stone-900 shadow-xl group">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=2070')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
            
            <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 z-10">
              <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-full w-max mb-4">
                Spring Harvest
              </span>
              <h1 className="text-4xl md:text-6xl font-heading font-black text-white leading-[1.1] mb-4">
                Fresh From <br/>The Farm To <br/>Your Doorstep
              </h1>
              <p className="text-stone-300 text-lg md:text-xl max-w-md mb-8 hidden md:block">
                Skip the middleman. Buy highly-rated, chemical-free local produce exactly as nature intended directly from independent farmers.
              </p>
              <Link href="/explore" className="bg-white text-stone-900 font-bold px-8 py-4 rounded-full w-max hover:bg-emerald-50 transition-colors shadow-lg">
                Shop Now →
              </Link>
            </div>
          </div>

          {/* Right Side Promo Blocks */}
          <div className="flex flex-col gap-4 h-[400px] md:h-full">
            {/* Promo 1 */}
            <Link href="/explore?category=honey" className="flex-1 relative rounded-3xl overflow-hidden group shadow-md block">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-5 left-5 right-5 z-10">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block mb-1">Raw & Organic</span>
                <h3 className="text-white font-heading font-extrabold text-2xl">Mountain Honey</h3>
              </div>
            </Link>
            {/* Promo 2 */}
            <Link href="/map" className="flex-1 relative rounded-3xl overflow-hidden group shadow-md block bg-emerald-700 p-6 flex flex-col justify-between">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
              <div className="z-10 bg-white/20 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">📍</span>
              </div>
              <div className="z-10">
                <h3 className="text-white font-heading font-extrabold text-2xl mb-1">Discover Local</h3>
                <p className="text-emerald-100 text-sm font-medium">Find farmers on our interactive map.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 mb-16">
        <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.cat}
              href={`/explore?category=${cat.cat}`}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${cat.color}`}
            >
              <span className="text-lg">{cat.emoji}</span>
              {cat.label}
            </Link>
          ))}
          <Link
            href="/explore"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm bg-white border border-stone-200 text-stone-700 hover:border-emerald-500 hover:text-emerald-600"
          >
            Show All
          </Link>
        </div>
      </section>

      {/* Fresh Arrivals / Trending DB Grid */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-3xl font-heading font-extrabold text-stone-900">Fresh Arrivals 🔥</h2>
          <Link href="/explore" className="text-emerald-600 font-bold hover:underline mb-1">
            See all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 border border-stone-100 shadow-sm p-3">
                <div className="w-full h-40 bg-stone-200 rounded-xl mb-4"></div>
                <div className="w-2/3 h-4 bg-stone-200 rounded mb-2"></div>
                <div className="w-1/2 h-4 bg-stone-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : trendingProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
            <span className="text-6xl mb-4 block">🌾</span>
            <h3 className="text-xl font-heading font-bold text-stone-500">No products available right now</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingProducts.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="bg-white rounded-2xl p-3 border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                <div className="relative w-full h-48 rounded-xl bg-stone-100 overflow-hidden mb-4">
                  {p.image_url ? (
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url(${p.image_url})` }}></div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🥬</div>
                  )}
                  {p.stock_quantity <= 5 && p.stock_quantity > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                      Only {p.stock_quantity} left
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md capitalize font-semibold tracking-wide">
                      {p.category}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium truncate">
                      by {p.profiles?.full_name || "Farmer"}
                    </span>
                  </div>
                  
                  <h3 className="font-heading font-bold text-stone-800 text-lg leading-tight mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {p.name}
                  </h3>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-emerald-600 tracking-tight">₺{p.price}</span>
                      <span className="text-stone-400 text-xs font-semibold ml-1">/kg</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Banner / Value Proposition */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-20">
        <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
          <div className="relative z-10 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-heading font-black text-white mb-3">Sell on Kırsof</h2>
            <p className="text-emerald-100 max-w-lg text-lg">
              Join our network of independent farmers. Take home 96% of every sale directly. Zero upfront costs.
            </p>
          </div>
          <Link href="/signup?role=farmer" className="bg-white text-emerald-700 font-extrabold px-10 py-5 rounded-full text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform relative z-10 w-full md:w-auto text-center">
            Register Your Farm
          </Link>
        </div>
      </section>

    </div>
  );
}

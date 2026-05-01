"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchFarmers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "farmer")
        .order("created_at", { ascending: false });
      setFarmers(data || []);
      setLoading(false);
    };
    fetchFarmers();
  }, []);

  const filtered = farmers.filter((f) =>
    f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.address?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 w-full">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-stone-900 mb-3">Our Farmers</h1>
        <p className="text-stone-500 text-lg max-w-2xl">
          Meet the passionate producers behind your food. Every farmer on Kırsof is independently verified.
        </p>
      </div>

      <div className="mb-8">
        <div className="relative max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search farmers by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-stone-800 placeholder:text-stone-400"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🌾</div>
          <h3 className="text-2xl font-heading font-bold text-stone-700 mb-2">No farmers found</h3>
          <p className="text-stone-500">Try a different search or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((farmer) => (
            <Link
              key={farmer.id}
              href={`/farmers/${farmer.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="h-36 bg-gradient-to-br from-emerald-400 to-green-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cpath%20d%3D%22M0%20100%20Q50%2030%20100%20100%22%20fill%3D%22rgba(255%2C255%2C255%2C0.1)%22%2F%3E%3C%2Fsvg%3E')] bg-cover opacity-50"></div>
                <div className="absolute bottom-0 left-6 translate-y-1/2">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-emerald-600 border-4 border-white">
                    {farmer.full_name?.charAt(0) || "F"}
                  </div>
                </div>
              </div>
              <div className="p-6 pt-14">
                <h3 className="text-xl font-heading font-bold text-stone-900 group-hover:text-emerald-600 transition-colors">{farmer.full_name}</h3>
                <p className="text-sm text-stone-500 mt-1 flex items-center gap-1">
                  📍 {farmer.address || "Turkey"}
                </p>
                {farmer.phone && (
                  <p className="text-sm text-stone-400 mt-1">📞 {farmer.phone}</p>
                )}
                <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                  <span className="text-sm text-stone-500">View store →</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">Verified Farmer</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import dynamic from "next/dynamic";

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MapSection = dynamic(() => import("@/components/MapSection"), { ssr: false });

type FarmerProfile = {
  id: string;
  full_name?: string | null;
  address?: string | null;
  location_lat?: number | string | null;
  location_lng?: number | string | null;
  phone?: string | null;
  avatar_url?: string | null;
};

export default function MapPage() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [allFarmers, setAllFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  // User location comes from the saved profile. GPS capture happens in the profile form.
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterByRadius, setFilterByRadius] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // Get current user to highlight them and use their saved location as center
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (sessionUser) {
        setCurrentUserId(sessionUser.id);
        const { data: prof } = await supabase.from("profiles").select("role, location_lat, location_lng").eq("id", sessionUser.id).single();
        setCurrentUserRole(prof?.role || null);
        if (prof?.role !== "admin" && prof?.location_lat && prof?.location_lng) {
          const loc = { lat: Number(prof.location_lat), lng: Number(prof.location_lng) };
          setUserLocation(loc);
          setFilterByRadius(true);
        }
      }

      const { data: all } = await supabase
        .from("profiles")
        .select("id, full_name, address, location_lat, location_lng, phone, avatar_url")
        .eq("role", "farmer")
        .order("full_name", { ascending: true });

      const farmerList = (all || []) as FarmerProfile[];
      setAllFarmers(farmerList);
      setFarmers(farmerList.filter((f) => f.location_lat && f.location_lng));

      const { data: products } = await supabase.from("products").select("farmer_id");
      if (products) {
        const counts: Record<string, number> = {};
        products.forEach((p: { farmer_id: string }) => { counts[p.farmer_id] = (counts[p.farmer_id] || 0) + 1; });
        setProductCounts(counts);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Farmers within 500km of user (only if location is set)
  const farmerWithDistance = allFarmers.map((f) => {
    if (!userLocation || !f.location_lat || !f.location_lng) return { ...f, distanceKm: null };
    const d = haversineKm(userLocation.lat, userLocation.lng, Number(f.location_lat), Number(f.location_lng));
    return { ...f, distanceKm: Math.round(d) };
  });

  // Filter by search and optionally by 500km radius
  const filtered = farmerWithDistance.filter((f) => {
    const matchesSearch =
      f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.address?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (currentUserRole !== "admin" && filterByRadius && userLocation && f.distanceKm !== null) return f.distanceKm <= 500;
    return true;
  });

  // For map: only farmers with coordinates; if filtering, only within radius
  // UNLESS it's the current user (farmer should always see themselves)
  const mapFarmers = farmers.filter((f) => {
    if (f.id === currentUserId) return true; // Always show me
    if (currentUserRole === "admin") return true;
    if (!filterByRadius || !userLocation) return true;
    if (!f.location_lat || !f.location_lng) return false;
    return haversineKm(userLocation.lat, userLocation.lng, Number(f.location_lat), Number(f.location_lng)) <= 500;
  });

  const inRangeCount = userLocation
    ? farmerWithDistance.filter(f => f.distanceKm !== null && f.distanceKm <= 500).length
    : 0;

  return (
    <div className="flex flex-col flex-1 bg-stone-100/50 px-4 md:px-8 pt-6 pb-12">
      <div className="flex flex-1 overflow-hidden w-full max-w-screen-2xl mx-auto shadow-2xl rounded-3xl border border-stone-200/60 bg-white min-h-[600px]">
        {/* ─── Left Sidebar ─── */}
        <aside className="w-[340px] lg:w-[380px] flex-shrink-0 bg-white flex flex-col border-r border-stone-200/80 z-10 rounded-l-3xl">
          {/* Header */}
          <div className="px-5 pt-6 pb-4">
            <h1 className="text-xl font-heading font-extrabold text-stone-900 leading-tight">
              Discover Farms
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              {allFarmers.length} producer{allFarmers.length !== 1 ? "s" : ""} registered
            </p>
          </div>

          {/* Geolocation panel */}
          <div className="px-5 pb-3">
            {currentUserRole === "admin" ? (
              <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-purple-800">Admin Map View</p>
                <p className="text-xs text-purple-600 mt-0.5">Showing all farms without location filtering</p>
              </div>
            ) : !userLocation ? (
              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-all"
              >
                <span>📍</span>
                Set location in profile
              </Link>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                   <div>
                    <p className="text-sm font-semibold text-emerald-800">🏠 Profile Location Active</p>
                    <p className="text-xs text-emerald-600 mt-0.5">{inRangeCount} farms within 500km</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterByRadius(v => !v)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        filterByRadius
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-stone-200 text-stone-600 hover:border-emerald-400"
                      }`}
                    >
                      {filterByRadius ? "500km On" : "500km Off"}
                    </button>
                    <Link href="/dashboard" className="text-xs text-stone-500 hover:text-emerald-600 cursor-pointer">Edit</Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="px-5 pb-4">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="7" cy="7" r="5" /><path d="m13 13-3-3" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-stone-700 placeholder:text-stone-400 transition-all"
              />
            </div>
          </div>

          {/* Farmer List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-7 h-7 border-[3px] border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-stone-500 text-sm font-medium">No farmers match your search</p>
              </div>
            ) : (
              <ul>
                {filtered.map((farmer) => {
                  const hasCoords = farmer.location_lat && farmer.location_lng;
                  const isSelected = selectedFarmer === farmer.id;
                  const count = productCounts[farmer.id] || 0;
                  const inRange = farmer.distanceKm !== null && farmer.distanceKm <= 500;
                  const outOfRange = userLocation && farmer.distanceKm !== null && farmer.distanceKm > 500;

                  return (
                    <li
                      key={farmer.id}
                      onClick={() => { if (hasCoords) setSelectedFarmer(farmer.id); }}
                      className={`relative flex items-start gap-3.5 px-5 py-4 cursor-pointer transition-all border-b border-stone-100 ${
                        outOfRange ? "opacity-40" : isSelected ? "bg-emerald-50/80" : "hover:bg-stone-50/60"
                      }`}
                    >
                      {isSelected && <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-emerald-500" />}

                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm ${
                        isSelected ? "bg-gradient-to-br from-emerald-500 to-green-600" : "bg-gradient-to-br from-stone-400 to-stone-500"
                      }`}>
                        {farmer.full_name?.charAt(0) || "F"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 text-sm leading-snug truncate">{farmer.full_name}</p>
                        <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1 truncate">
                          <span>📍</span> {farmer.address || "Location not set"}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {count > 0 && (
                            <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                              {count} product{count > 1 ? "s" : ""}
                            </span>
                          )}
                          {hasCoords ? (
                            <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">On Map</span>
                          ) : (
                            <span className="text-[11px] bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full font-semibold">No pin</span>
                          )}
                          {farmer.distanceKm !== null && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                              inRange ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                            }`}>
                              {farmer.distanceKm} km
                            </span>
                          )}
                        </div>
                      </div>

                      <Link href={`/farmers/${farmer.id}`} onClick={(e) => e.stopPropagation()}
                        className="mt-1 text-xs text-emerald-600 font-semibold hover:underline flex-shrink-0">
                        Store&nbsp;→
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ─── Map ─── */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          ) : farmers.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 px-8 text-center">
              <div className="text-7xl mb-6">🗺️</div>
              <h3 className="text-2xl font-heading font-bold text-stone-700 mb-2">No farms pinned yet</h3>
              <p className="text-stone-500 max-w-sm">Farmers can set their GPS coordinates from their dashboard to appear on this map.</p>
            </div>
          ) : (
            <MapSection
              farmers={mapFarmers}
              selectedFarmerId={selectedFarmer}
              userLocation={userLocation}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const MapClickHandler = dynamic(() => import("@/components/MapClickHandler"), { ssr: false });

import "leaflet/dist/leaflet.css";

interface AddressFormProps {
  initialAddress?: string;
  initialCoords?: { lat: number | null; lng: number | null };
  onChange: (address: string, coords?: { lat: number; lng: number }) => void;
  className?: string;
}

interface AddressState {
  il: string;
  ilce: string;
  semt: string;
  mahalle: string;
  sokak: string;
  bina: string;
  daire: string;
  extra: string;
}

const EMPTY: AddressState = {
  il: "",
  ilce: "",
  semt: "",
  mahalle: "",
  sokak: "",
  bina: "",
  daire: "",
  extra: "",
};

function buildAddressString(a: AddressState): string {
  const parts: string[] = [];
  if (a.il) parts.push(a.il);
  if (a.ilce) parts.push(a.ilce);
  if (a.semt) parts.push(a.semt);
  if (a.mahalle) parts.push(a.mahalle);
  if (a.sokak) parts.push(`Street: ${a.sokak}`);
  if (a.bina) parts.push(`Building No: ${a.bina}`);
  if (a.daire) parts.push(`Apartment/Door No: ${a.daire}`);
  if (a.extra) parts.push(a.extra);
  return parts.join(", ");
}

function parseAddressString(address?: string): AddressState {
  if (!address) return { ...EMPTY };
  const next = { ...EMPTY };
  const freeParts: string[] = [];

  address.split(",").map(part => part.trim()).filter(Boolean).forEach((part, index) => {
    const [rawKey, ...rawValue] = part.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.join(":").trim();

    if ((key === "street" || key === "sokak") && value) next.sokak = value;
    else if ((key === "building no" || key === "bina") && value) next.bina = value;
    else if ((key === "apartment/door no" || key === "door no" || key === "apartment no" || key === "daire") && value) next.daire = value;
    else if (index === 0) next.il = part;
    else if (index === 1) next.ilce = part;
    else if (index === 2) next.semt = part;
    else if (index === 3) next.mahalle = part;
    else freeParts.push(part);
  });

  next.extra = freeParts.join(", ");
  return next;
}

export default function AddressForm({ initialAddress, initialCoords, onChange, className }: AddressFormProps) {
  const supabase = createClient();

  const [addr, setAddr] = useState<AddressState>(() => parseAddressString(initialAddress));
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: initialCoords?.lat ?? null,
    lng: initialCoords?.lng ?? null,
  });

  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [semts, setSemts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);

  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSemts, setLoadingSemts] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [pickedLocationIcon, setPickedLocationIcon] = useState<any>(null);

  useEffect(() => {
    setAddr(parseAddressString(initialAddress));
    setCoords({
      lat: initialCoords?.lat ?? null,
      lng: initialCoords?.lng ?? null,
    });
  }, [initialAddress, initialCoords?.lat, initialCoords?.lng]);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setPickedLocationIcon(leaflet.divIcon({
        html: `<div style="
          width: 24px; height: 24px;
          background: #059669;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 10px rgba(5, 150, 105, 0.35);
        "><div style="
          width: 7px; height: 7px;
          background: white;
          border-radius: 50%;
          margin: 5.5px auto;
        "></div></div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      }));
    });
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingCities(true);
      const { data } = await supabase.rpc("get_distinct_cities");
      if (data) setCities(data.map((r: any) => r.il));
      setLoadingCities(false);
    })();
  }, []);

  useEffect(() => {
    if (!addr.il) {
      setDistricts([]);
      setSemts([]);
      setNeighborhoods([]);
      return;
    }

    (async () => {
      setLoadingDistricts(true);
      const { data } = await supabase.rpc("get_distinct_districts", { p_il: addr.il });
      if (data) setDistricts(data.map((r: any) => r.ilce));
      setLoadingDistricts(false);
    })();
  }, [addr.il]);

  useEffect(() => {
    if (!addr.ilce) {
      setSemts([]);
      setNeighborhoods([]);
      return;
    }

    (async () => {
      setLoadingSemts(true);
      const { data } = await supabase.rpc("get_distinct_semts", { p_il: addr.il, p_ilce: addr.ilce });
      if (data) setSemts(data.map((r: any) => r.semt).filter(Boolean));
      setLoadingSemts(false);
    })();
  }, [addr.il, addr.ilce]);

  useEffect(() => {
    if (!addr.il || !addr.ilce || !addr.semt) {
      setNeighborhoods([]);
      return;
    }

    (async () => {
      setLoadingNeighborhoods(true);
      const { data } = await supabase
        .from("address_lookup")
        .select("mahalle")
        .eq("il", addr.il)
        .eq("ilce", addr.ilce)
        .eq("semt", addr.semt)
        .order("mahalle", { ascending: true });

      if (data) {
        const unique = Array.from(new Set(data.map((r: any) => r.mahalle).filter(Boolean))) as string[];
        setNeighborhoods(unique);
      }
      setLoadingNeighborhoods(false);
    })();
  }, [addr.il, addr.ilce, addr.semt]);

  useEffect(() => {
    const finalCoords = coords.lat !== null && coords.lng !== null
      ? { lat: coords.lat, lng: coords.lng }
      : undefined;
    onChange(buildAddressString(addr), finalCoords);
  }, [addr, coords]);

  useEffect(() => {
    if (!addr.il) return;

    const queryParts = [addr.mahalle, addr.ilce, addr.il].filter(Boolean);
    const query = `${queryParts.join(", ")}, Turkey`;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [addr.il, addr.ilce, addr.mahalle]);

  const set = (key: keyof AddressState, value: string) => {
    setAddr(prev => {
      const next = { ...prev, [key]: value };
      if (key === "il") { next.ilce = ""; next.semt = ""; next.mahalle = ""; }
      if (key === "ilce") { next.semt = ""; next.mahalle = ""; }
      if (key === "semt") { next.mahalle = ""; }
      return next;
    });
  };

  const useGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoadingGPS(false);
      },
      () => {
        alert("Could not get your location. Please allow GPS access.");
        setLoadingGPS(false);
      }
    );
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm placeholder:text-stone-400";
  const selectCls = `${inputCls} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`;
  const labelCls = "text-sm font-semibold text-stone-700 block mb-1.5";

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      <button
        type="button"
        onClick={useGPS}
        disabled={loadingGPS}
        className="w-full flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm px-4 py-3 rounded-xl hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-60"
      >
        {loadingGPS ? (
          <span className="w-4 h-4 border-2 border-emerald-400 border-t-emerald-700 rounded-full animate-spin" />
        ) : "Pin"}
        {loadingGPS ? "Acquiring GPS..." : "Auto-set Coordinates from My Current Location"}
      </button>

      {coords.lat ? (
        <div className="text-[11px] text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100 inline-flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          GPS Coordinates Ready: {coords.lat.toFixed(4)}, {coords.lng?.toFixed(4)}
        </div>
      ) : (
        <div className="text-[11px] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 flex items-start gap-2">
          <span className="mt-0.5">!</span>
          <span>Coordinates not set. Use the button above or tap the map below to set your location.</span>
        </div>
      )}

      <div className="w-full h-48 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 relative z-0">
        {typeof window !== "undefined" && (
          <MapContainer
            center={[coords.lat || 39.9334, coords.lng || 32.8597]}
            zoom={coords.lat ? 13 : 5}
            style={{ width: "100%", height: "100%" }}
            className="z-0"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler onPick={setCoords} />
            {coords.lat && coords.lng && pickedLocationIcon && (
              <Marker position={[coords.lat, coords.lng]} icon={pickedLocationIcon} />
            )}
          </MapContainer>
        )}
        <div className="absolute bottom-2 right-2 z-10 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-stone-500 shadow-sm pointer-events-none">
          Click map to set location manually
        </div>
      </div>

      <div>
        <label className={labelCls}>
          City (Il)
          {loadingCities && <span className="ml-2 text-xs text-stone-400 font-normal">Loading 81 cities...</span>}
        </label>
        <select value={addr.il} onChange={e => set("il", e.target.value)} disabled={loadingCities} className={selectCls}>
          <option value="">-- Select city --</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>
          District (Ilce)
          {loadingDistricts && <span className="ml-2 text-xs text-stone-400 font-normal">Loading districts...</span>}
        </label>
        <select value={addr.ilce} onChange={e => set("ilce", e.target.value)} disabled={!addr.il || loadingDistricts} className={selectCls}>
          <option value="">-- Select district --</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>
          Semt / Subdistrict
          {loadingSemts && <span className="ml-2 text-xs text-stone-400 font-normal">Loading subdistricts...</span>}
        </label>
        <select value={addr.semt} onChange={e => set("semt", e.target.value)} disabled={!addr.ilce || loadingSemts} className={selectCls}>
          <option value="">-- Select semt --</option>
          {semts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>
          Mahalle / Neighborhood
          {loadingNeighborhoods && <span className="ml-2 text-xs text-stone-400 font-normal">Loading neighborhoods...</span>}
        </label>
        <select value={addr.mahalle} onChange={e => set("mahalle", e.target.value)} disabled={!addr.semt || loadingNeighborhoods} className={selectCls}>
          <option value="">-- Select mahalle --</option>
          {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Street Name</label>
        <input
          type="text"
          value={addr.sokak}
          onChange={e => set("sokak", e.target.value)}
          placeholder="Example: Ataturk Cd. or 1402 Sokak"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Building No</label>
          <input type="text" value={addr.bina} onChange={e => set("bina", e.target.value)} placeholder="Example: 12" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Apartment / Door No</label>
          <input type="text" value={addr.daire} onChange={e => set("daire", e.target.value)} placeholder="Example: 3" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Extra Details <span className="text-stone-400 font-normal">(optional)</span></label>
        <textarea value={addr.extra} onChange={e => set("extra", e.target.value)} placeholder="Floor, door code, nearby landmark..." rows={2} className={`${inputCls} resize-none`} />
      </div>

      {buildAddressString(addr) && (
        <div className="mt-1 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
          <span className="mt-0.5 flex-shrink-0">Pin</span>
          <span className="leading-relaxed">{buildAddressString(addr)}</span>
        </div>
      )}
    </div>
  );
}

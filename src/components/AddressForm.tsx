"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface AddressFormProps {
  /** Current concatenated address string to parse & pre-fill */
  initialAddress?: string;
  /** Called with the concatenated address string on submit */
  onChange: (address: string) => void;
  /** Optional extra className for the wrapper */
  className?: string;
}

interface AddressState {
  il: string;       // City (province)
  ilce: string;     // District
  semt: string;     // Neighborhood / Subdistrict
  bina: string;     // Building number (manual)
  daire: string;    // Door / Apartment number (manual)
  extra: string;    // Additional details (manual)
}

const EMPTY: AddressState = { il: "", ilce: "", semt: "", bina: "", daire: "", extra: "" };

function buildAddressString(a: AddressState): string {
  const parts: string[] = [];
  if (a.il) parts.push(a.il);
  if (a.ilce) parts.push(a.ilce);
  if (a.semt) parts.push(a.semt);
  if (a.bina) parts.push(`Bina: ${a.bina}`);
  if (a.daire) parts.push(`Daire: ${a.daire}`);
  if (a.extra) parts.push(a.extra);
  return parts.join(", ");
}

export default function AddressForm({ initialAddress, onChange, className }: AddressFormProps) {
  const supabase = createClient();

  const [addr, setAddr] = useState<AddressState>(EMPTY);

  // Available options loaded from Supabase
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [semts, setSemts] = useState<string[]>([]);

  // Loading states for each cascade level
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSemts, setLoadingSemts] = useState(false);

  // Load distinct cities on mount
  useEffect(() => {
    (async () => {
      setLoadingCities(true);
      const { data } = await supabase
        .from("address_lookup")
        .select("il")
        .order("il");
      if (data) {
        const unique = [...new Set(data.map((r: any) => r.il))];
        setCities(unique);
      }
      setLoadingCities(false);
    })();
  }, []);

  // Load distinct districts when city changes
  useEffect(() => {
    if (!addr.il) { setDistricts([]); setSemts([]); return; }
    (async () => {
      setLoadingDistricts(true);
      const { data } = await supabase
        .from("address_lookup")
        .select("ilce")
        .eq("il", addr.il)
        .order("ilce");
      if (data) {
        const unique = [...new Set(data.map((r: any) => r.ilce))];
        setDistricts(unique);
      }
      setLoadingDistricts(false);
    })();
  }, [addr.il]);

  // Load distinct semts when district changes
  useEffect(() => {
    if (!addr.ilce) { setSemts([]); return; }
    (async () => {
      setLoadingSemts(true);
      const { data } = await supabase
        .from("address_lookup")
        .select("semt")
        .eq("il", addr.il)
        .eq("ilce", addr.ilce)
        .order("semt");
      if (data) {
        const unique = [...new Set(data.map((r: any) => r.semt).filter(Boolean))];
        setSemts(unique);
      }
      setLoadingSemts(false);
    })();
  }, [addr.ilce]);

  // Notify parent whenever address changes
  useEffect(() => {
    onChange(buildAddressString(addr));
  }, [addr]);

  const set = (key: keyof AddressState, value: string) => {
    setAddr(prev => {
      const next = { ...prev, [key]: value };
      // Reset downstream when parent changes
      if (key === "il") { next.ilce = ""; next.semt = ""; }
      if (key === "ilce") { next.semt = ""; }
      return next;
    });
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm placeholder:text-stone-400";
  const selectCls = `${inputCls} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`;
  const labelCls = "text-sm font-semibold text-stone-700 block mb-1.5";

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {/* Row 1: City */}
      <div>
        <label className={labelCls}>
          Şehir (İl)
          {loadingCities && <span className="ml-2 text-xs text-stone-400 font-normal">Loading...</span>}
        </label>
        <select
          value={addr.il}
          onChange={e => set("il", e.target.value)}
          disabled={loadingCities}
          className={selectCls}
        >
          <option value="">-- Şehir Seçin --</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Row 2: District */}
      <div>
        <label className={labelCls}>
          İlçe
          {loadingDistricts && <span className="ml-2 text-xs text-stone-400 font-normal">Loading...</span>}
        </label>
        <select
          value={addr.ilce}
          onChange={e => set("ilce", e.target.value)}
          disabled={!addr.il || loadingDistricts}
          className={selectCls}
        >
          <option value="">-- İlçe Seçin --</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Row 3: Semt / Neighborhood */}
      <div>
        <label className={labelCls}>
          Semt / Mahalle
          {loadingSemts && <span className="ml-2 text-xs text-stone-400 font-normal">Loading...</span>}
        </label>
        <select
          value={addr.semt}
          onChange={e => set("semt", e.target.value)}
          disabled={!addr.ilce || loadingSemts}
          className={selectCls}
        >
          <option value="">-- Semt Seçin --</option>
          {semts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Row 4: Building & Door (manual) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Bina No</label>
          <input
            type="text"
            value={addr.bina}
            onChange={e => set("bina", e.target.value)}
            placeholder="Örn: 12"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Daire No</label>
          <input
            type="text"
            value={addr.daire}
            onChange={e => set("daire", e.target.value)}
            placeholder="Örn: 3"
            className={inputCls}
          />
        </div>
      </div>

      {/* Row 5: Extra details (manual) */}
      <div>
        <label className={labelCls}>Ek Açıklama <span className="text-stone-400 font-normal">(opsiyonel)</span></label>
        <textarea
          value={addr.extra}
          onChange={e => set("extra", e.target.value)}
          placeholder="Kapı kodu, kat, yanındaki işyeri vb..."
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Preview */}
      {buildAddressString(addr) && (
        <div className="mt-1 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
          <span className="mt-0.5 flex-shrink-0">📍</span>
          <span className="leading-relaxed">{buildAddressString(addr)}</span>
        </div>
      )}
    </div>
  );
}

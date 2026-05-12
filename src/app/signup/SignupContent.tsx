"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AddressForm from "@/components/AddressForm";

// Format phone input as +90 (5XX) XXX XX XX
function formatTurkishPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  let clean = digits;
  if (clean.startsWith("90")) clean = clean.slice(2);
  else if (clean.startsWith("0")) clean = clean.slice(1);
  clean = clean.slice(0, 10);
  if (clean.length === 0) return "";
  if (clean.length <= 3) return `+90 (${clean}`;
  if (clean.length <= 6) return `+90 (${clean.slice(0, 3)}) ${clean.slice(3)}`;
  if (clean.length <= 8) return `+90 (${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6)}`;
  return `+90 (${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8)}`;
}

function extractPhoneDigits(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+90${digits}`;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function SignupContent() {
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "farmer" ? "farmer" : "consumer";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"consumer" | "farmer">(defaultRole);
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTurkishPhone(e.target.value);
    setPhoneDisplay(formatted);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!address) {
      setError("Please provide your address.");
      setLoading(false);
      return;
    }

    const phoneClean = phoneDisplay ? extractPhoneDigits(phoneDisplay) : null;

    // Sign up with metadata — the DB trigger will create the profile
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phoneClean,
          address,
          location_lat: coords?.lat?.toString() || "",
          location_lng: coords?.lng?.toString() || "",
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Direct profile upsert to ensure address and coordinates are saved
    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        full_name: fullName,
        role: role,
        phone: phoneClean,
        address: address,
        location_lat: coords?.lat,
        location_lng: coords?.lng,
      }, { onConflict: "id" });
      if (profileError) {
        setError(`Account created, but profile address was not saved: ${profileError.message}`);
        setLoading(false);
        return;
      }
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="glass rounded-3xl p-10 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-2xl font-heading font-bold text-stone-900 mb-2">Account Created!</h2>
          <p className="text-stone-500 mb-6">Please check your email to verify your account, then log in.</p>
          <Link href="/login" className="inline-block bg-emerald-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-emerald-700 transition-all">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 relative">
      <div className="absolute top-0 right-0 w-[30vw] h-[30vw] bg-emerald-200/30 rounded-full filter blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-[25vw] h-[25vw] bg-amber-100/40 rounded-full filter blur-[100px]"></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-extrabold text-stone-900 mb-2">Join Kırsof</h1>
          <p className="text-stone-500 text-lg">Create your account and start discovering local produce</p>
        </div>

        <form onSubmit={handleSignup} className="glass rounded-3xl p-8 shadow-xl space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-shake">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-3 text-center">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRole("consumer")}
                className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${role === "consumer" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white hover:border-stone-300 text-stone-600"}`}>
                <div className="text-2xl mb-1">🛒</div>
                <div className="font-semibold">Consumer</div>
                <div className="text-xs mt-1 opacity-70">Buy fresh produce</div>
              </button>
              <button type="button" onClick={() => setRole("farmer")}
                className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${role === "farmer" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white hover:border-stone-300 text-stone-600"}`}>
                <div className="text-2xl mb-1">🌾</div>
                <div className="font-semibold">Farmer</div>
                <div className="text-xs mt-1 opacity-70">Sell your harvest</div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-stone-800 placeholder:text-stone-400" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-stone-800 placeholder:text-stone-400" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-stone-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-stone-800 placeholder:text-stone-400"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer" tabIndex={-1}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Phone</label>
              <div className="relative">
                <input type="tel" value={phoneDisplay} onChange={handlePhoneChange} placeholder="+90 (5XX) XXX XX XX"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-stone-800 placeholder:text-stone-400" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400">🇹🇷 TR</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-stone-700 mb-3">Address & Location</label>
              <AddressForm 
                onChange={(addr, coords) => {
                  setAddress(addr);
                  setCoords(coords);
                }} 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer mt-4">
            {loading ? "Creating account..." : "Complete Registration"}
          </button>

          <p className="text-center text-stone-500 text-sm pb-2">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 font-bold hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

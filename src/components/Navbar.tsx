"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // 1. Initial Fetch
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
      } else {
        setUser(null);
        setProfile(null);
      }
    };
    getUser();

    // 2. Setup Real-time Auth Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      }
    });

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      authListener.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getDashboardLink = () => {
    if (!profile) return "/dashboard";
    if (profile.role === "admin") return "/dashboard/admin";
    if (profile.role === "farmer") return "/dashboard/farmer";
    return "/dashboard";
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-stone-200/50 py-3" : "bg-white/80 py-4"}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-heading font-black text-xl shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
            K
          </div>
          <span className="text-2xl font-heading font-extrabold tracking-tight text-stone-800">
            Kırsof
          </span>
        </Link>

        {/* Desktop Nav Based on Role */}
        <nav className="hidden md:flex items-center gap-8 font-semibold text-stone-600 text-sm tracking-wide">
          {(!profile || profile.role === "consumer") && (
            <>
              <Link href="/explore" className="hover:text-emerald-600 transition-colors">Marketplace</Link>
              <Link href="/map" className="hover:text-emerald-600 transition-colors">Farm Map</Link>
              <Link href="/about" className="hover:text-emerald-600 transition-colors">Our Story</Link>
            </>
          )}

          {profile?.role === "farmer" && (
            <>
              <Link href="/dashboard/farmer" className="hover:text-emerald-600 transition-colors">My Market</Link>
              <Link href="/explore" className="hover:text-emerald-600 transition-colors">Explore</Link>
            </>
          )}

          {profile?.role === "admin" && (
            <>
              <Link href="/dashboard/admin" className="hover:text-purple-600 transition-colors">Admin Panel</Link>
            </>
          )}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {(!profile || profile.role === "consumer") && (
                <Link href="/cart" className="relative p-2.5 bg-stone-100 rounded-full text-stone-600 hover:text-emerald-600 hover:bg-stone-200 transition-colors shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                </Link>
              )}
              
              <Link
                href={getDashboardLink()}
                className="flex items-center gap-2 bg-white border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 pl-1.5 pr-4 py-1.5 rounded-full transition-all shadow-sm"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  profile?.role === "admin" ? "bg-purple-500" : 
                  profile?.role === "farmer" ? "bg-amber-500" : 
                  "bg-gradient-to-br from-emerald-400 to-green-600"
                }`}>
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-stone-800 leading-tight max-w-[120px] truncate">
                    {profile?.full_name || "My Account"}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase leading-none mt-0.5">
                    {profile?.role || "consumer"}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-stone-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
              >
                Log Out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-stone-600 font-semibold text-sm hover:text-emerald-600 transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300">
                Join Kırsof
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-stone-700 cursor-pointer">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-stone-200 shadow-xl py-6 px-6 flex flex-col gap-5">
          {(!profile || profile.role === "consumer") && (
            <>
              <Link href="/explore" className="text-lg font-semibold text-stone-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>Marketplace</Link>
              <Link href="/map" className="text-lg font-semibold text-stone-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>Farm Map</Link>
            </>
          )}
          {profile?.role === "farmer" && (
            <Link href="/dashboard/farmer" className="text-lg font-semibold text-amber-600" onClick={() => setMenuOpen(false)}>My Seller Dashboard</Link>
          )}
          {profile?.role === "admin" && (
            <Link href="/dashboard/admin" className="text-lg font-semibold text-purple-600" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
          )}

          <hr className="border-stone-100" />

          {user ? (
            <>
              <Link href={getDashboardLink()} className="text-lg font-semibold text-stone-700" onClick={() => setMenuOpen(false)}>Profile & Settings</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-lg font-semibold text-red-500 text-left">Log Out</button>
            </>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <Link href="/login" className="bg-stone-100 text-stone-800 py-3 rounded-xl font-bold text-center" onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link href="/signup" className="bg-emerald-600 text-white py-3 rounded-xl font-bold text-center" onClick={() => setMenuOpen(false)}>Join Kırsof</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

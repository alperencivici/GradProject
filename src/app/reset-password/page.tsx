"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Listen for the PASSWORD_RECOVERY event from supabase auth
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via the password reset link — they're now in the recovery state
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/dashboard"), 2500);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 relative">
      <div className="absolute top-0 left-0 w-[30vw] h-[30vw] bg-emerald-200/30 rounded-full filter blur-[120px]"></div>
      <div className="absolute bottom-0 right-0 w-[25vw] h-[25vw] bg-amber-200/30 rounded-full filter blur-[100px]"></div>

      <div className="w-full max-w-md relative z-10">
        {success ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-stone-900 mb-3">Password Updated!</h1>
            <p className="text-stone-500 text-lg mb-6">Redirecting you to your dashboard...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-heading font-extrabold text-stone-900 mb-2">Set new password</h1>
              <p className="text-stone-500 text-lg">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleReset} className="glass rounded-3xl p-8 shadow-xl space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-stone-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-stone-800 placeholder:text-stone-400"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer" tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-stone-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-stone-800 placeholder:text-stone-400"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer" tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Updating..." : "Reset Password"}
              </button>

              <p className="text-center text-stone-500 text-sm">
                <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
                  ← Back to Sign In
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

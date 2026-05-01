"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 relative">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[30vw] h-[30vw] bg-emerald-200/30 rounded-full filter blur-[120px]"></div>
      <div className="absolute bottom-0 right-0 w-[25vw] h-[25vw] bg-amber-200/30 rounded-full filter blur-[100px]"></div>

      <div className="w-full max-w-md relative z-10">
        {sent ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-stone-900 mb-3">Check your email</h1>
            <p className="text-stone-500 text-lg mb-2">
              We&apos;ve sent a password reset link to
            </p>
            <p className="font-bold text-stone-800 mb-8">{email}</p>
            <p className="text-stone-400 text-sm mb-6">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="bg-stone-100 text-stone-700 font-semibold py-3 rounded-xl hover:bg-stone-200 transition-all cursor-pointer"
              >
                Try a different email
              </button>
              <Link href="/login" className="text-emerald-600 font-semibold hover:underline text-center py-2">
                ← Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-heading font-extrabold text-stone-900 mb-2">Forgot password?</h1>
              <p className="text-stone-500 text-lg">No worries, we&apos;ll send you reset instructions.</p>
            </div>

            <form onSubmit={handleReset} className="glass rounded-3xl p-8 shadow-xl space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-stone-800 placeholder:text-stone-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <p className="text-center text-stone-500 text-sm">
                Remember your password?{" "}
                <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getMagic } from "@/lib/magic";

export default function LoginPage() {
  const { user, loading, login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthPending, setOauthPending] = useState(false);

  // Redirect to dashboard when already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Complete OAuth redirect flow when returning from Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("provider")) return;

    setOauthPending(true);
    getMagic()
      .then((magic) => {
        if (!magic) {
          setOauthPending(false);
          return;
        }
        return magic.oauth.getRedirectResult();
      })
      .then(() => {
        router.replace("/dashboard");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "OAuth login failed.");
        setOauthPending(false);
      })
      .finally(() => {});
  }, [router]);

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed.");
    }
  }

  if (loading || oauthPending) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#F59E0B]" />
      </div>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col px-6 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">
        TrustLink escrow
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
        Sign in to continue
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Access your USDC escrow deals on Arbitrum. No seed phrase required.
      </p>

      <div className="mt-10 rounded-[28px] border border-white/10 bg-[#0F1629] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        {/* Google social login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#F59E0B]/40 hover:bg-white/5"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-xs text-slate-500">or</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {/* Email OTP login */}
        <form onSubmit={handleEmailLogin} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/10 bg-[#080D1A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F59E0B]/50 focus:ring-2 focus:ring-[#F59E0B]/20"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#F59E0B] text-sm font-semibold text-[#080D1A] transition hover:bg-[#f7b733] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending code…" : "Continue with email"}
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Powered by Magic passkey wallet · No browser extension needed
      </p>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

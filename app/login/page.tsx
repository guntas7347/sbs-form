"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { getSSOUrl } from "@/lib/auth/sso";

function LoginForm() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error") || "";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-white dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Ambient decorative gradient auras */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-100/70 dark:bg-orange-950/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-100/70 dark:bg-emerald-950/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-50/40 dark:bg-stone-900/30 blur-3xl"
      />

      {/* Top Bar with Brand & Theme Toggle */}
      <header className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-5xl mx-auto z-10">
        <BrandLogo size="md" href="/" showSubtitle={true} />
        <div className="flex items-center gap-3">
          <ThemeToggle showLabel={false} />
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-[440px] z-10 pt-16 sm:pt-0">
        <div className="relative rounded-3xl bg-white/95 dark:bg-[#131920]/95 backdrop-blur-xl border border-orange-100/80 dark:border-stone-800 shadow-xl shadow-orange-500/5 dark:shadow-none p-8 sm:p-10 transition-all text-center">
          {/* Top accent gradient bar */}
          <div className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400 opacity-90" />

          {/* Heading Section */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 mb-3.5">
              <Sparkles className="w-3 h-3 text-orange-500" />
              <span>University SSO Authentication</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
              Welcome to SBS FORMS
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Sign in with your official university account using SBS Single
              Sign-On. Manual credentials have been disabled for security.
            </p>
          </div>

          {/* Error Message from URL if any */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 text-left"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Single Sign-On Button */}
          <div className="space-y-4">
            <a
              href={getSSOUrl()}
              className="group relative w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-orange-500 via-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span>Sign in with SBS SSO</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>

            <p className="text-[11px] text-stone-400 dark:text-stone-500 leading-relaxed">
              You will be securely redirected to the SBS SSO portal to verify
              your identity and university role.
            </p>
          </div>

          {/* Security & Info Footer */}
          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-center gap-2 text-[11px] text-stone-400 dark:text-stone-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600/80 dark:text-emerald-400/80" />
            <span>Secured via SBS SSO & JWT Authorization</span>
          </div>
        </div>

        {/* Minimal Copyright / Trademark */}
        <p className="mt-6 text-center text-xs text-stone-400 dark:text-stone-600">
          SBS FORMS &bull; Campus Form Platform
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0c1014]">
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span>Loading SBS Forms...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

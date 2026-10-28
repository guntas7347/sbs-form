"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@/hooks/useForm";
import { useTheme } from "@/hooks/useTheme";
import { loginOrRegister } from "@/lib/actions/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  User,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  // Use the requested custom hooks
  const { form, handleChange, error, checkError, setCheckError } = useForm({
    name: "",
    email: "",
  });
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successUser, setSuccessUser] = useState<{ name: string; email: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setCheckError(true);

    const cleanEmail = form.email?.trim();
    const cleanName = form.name?.trim();

    // Check basic presence
    if (!cleanEmail || !cleanName) {
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginOrRegister({
        name: cleanName,
        email: cleanEmail,
      });

      if (!response.success || !response.user) {
        setErrorMessage(response.error || "Authentication failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success
      setIsSuccess(true);
      setSuccessUser({
        name: response.user.name,
        email: response.user.email,
      });

      // Smooth redirect
      setTimeout(() => {
        router.push(redirectTarget);
        router.refresh();
      }, 700);
    } catch (err: any) {
      console.error("Login submission error:", err);
      setErrorMessage(err?.message || "Something went wrong. Please check your connection.");
      setIsLoading(false);
    }
  };

  const hasNameError = checkError && error.name;
  const hasEmailError = checkError && error.email;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-white dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Minimal ambient light-orange and light-green gradient auras */}
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
      <main className="w-full max-w-[430px] z-10 pt-16 sm:pt-0">
        <div className="relative rounded-3xl bg-white/95 dark:bg-[#131920]/95 backdrop-blur-xl border border-orange-100/80 dark:border-stone-800 shadow-xl shadow-orange-500/5 dark:shadow-none p-8 sm:p-9 transition-all">
          {/* Subtle top hairline with light-orange to light-green gradient */}
          <div className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400 opacity-90" />

          {/* Heading Section */}
          <div className="mb-7 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 mb-3.5">
              <Sparkles className="w-3 h-3 text-orange-500" />
              <span>Passwordless Access</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
              Welcome to SBS FORMS
            </h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Enter your details to sign in. Existing accounts proceed instantly, new users are registered automatically.
            </p>
          </div>

          {/* Inline Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1"
            >
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Inline Success State */}
          {isSuccess && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Authenticated as <strong>{successUser?.name || "User"}</strong>. Redirecting...
              </span>
            </div>
          )}

          {/* Form Element */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400 dark:text-stone-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Alex Morgan"
                  disabled={isLoading || isSuccess}
                  value={form.name || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-stone-50/80 dark:bg-stone-900/60 border transition-all duration-150 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:bg-white dark:focus:bg-stone-900 ${
                    hasNameError
                      ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                      : "border-stone-200/90 dark:border-stone-800 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 hover:border-orange-200 dark:hover:border-stone-700"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                />
              </div>
              {hasNameError && (
                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 pl-1">
                  Name is required
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400 dark:text-stone-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  required
                  autoComplete="username"
                  placeholder="alex@domain.com"
                  disabled={isLoading || isSuccess}
                  value={form.email || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-stone-50/80 dark:bg-stone-900/60 border transition-all duration-150 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:bg-white dark:focus:bg-stone-900 ${
                    hasEmailError
                      ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                      : "border-stone-200/90 dark:border-stone-800 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 hover:border-emerald-200 dark:hover:border-stone-700"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                />
              </div>
              {hasEmailError && (
                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 pl-1">
                  Valid email is required
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className="group relative w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-orange-500 via-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 active:scale-[0.99] shadow-md shadow-orange-500/20 dark:shadow-none transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Welcome! Entering...</span>
                  </>
                ) : (
                  <>
                    <span>Enter SBS Forms</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Minimal Security & Info Footer inside card */}
          <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-center gap-2 text-[11px] text-stone-400 dark:text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600/80 dark:text-emerald-400/80" />
            <span>Secured with JWT Cookie Authentication</span>
          </div>
        </div>

        {/* Minimal Copyright / Trademark */}
        <p className="mt-6 text-center text-xs text-stone-400 dark:text-stone-600">
          SBS FORMS &bull; Minimal Form Platform
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

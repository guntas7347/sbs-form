import { getCurrentUser } from "@/lib/actions/auth";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export const instant = false;

import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Zap,
} from "lucide-react";
import Footer from "@/components/Footer";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar user={user} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden">
        {/* Minimal ambient light-orange and light-green gradient aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-orange-100/60 dark:bg-orange-950/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-100/60 dark:bg-emerald-950/20 blur-3xl"
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/70 dark:border-orange-800/40 mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SBS FORMS</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 dark:text-white leading-[1.15]">
            University{" "}
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
              Forms & Submissions{" "}
            </span>
            Portal
          </h1>

          <p className="mt-5 text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
            Access university forms, submit required information, and manage
            your submissions through a centralized digital platform.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-medium text-sm text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-medium text-sm text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/support"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-medium text-sm text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 shadow-xs transition-all"
                >
                  <span>Support</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { getCurrentUser } from "@/lib/actions/auth";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { FAQSection } from "./FAQSection"; // Import the client component
import Footer from "@/components/Footer";

// // export const instant = false;

export default async function SupportPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors duration-200 overflow-hidden relative">
      <Navbar user={user} />

      {/* Minimal ambient light-orange and light-green gradient aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-orange-100/40 dark:bg-orange-950/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-100/40 dark:bg-emerald-950/10 blur-3xl"
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 mb-6 border border-orange-200/70 dark:border-orange-800/40 shadow-xs">
            <LifeBuoy className="w-7 h-7" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white mb-5">
            How can we help?
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
            Search our comprehensive knowledge base or browse the frequently
            asked questions below.
          </p>
        </div>

        {/* Interactive Client Component */}
        <FAQSection />

        {/* Footer Actions */}
        <div className="mt-16 pt-8 border-t border-orange-100/70 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Still stuck? Contact the IT Service Desk.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 shadow-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

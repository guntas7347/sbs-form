"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { logout } from "@/lib/actions/auth";
import { LogOut, User, PlusCircle } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-orange-100/60 dark:border-stone-800 bg-white/80 dark:bg-[#0c1014]/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <BrandLogo size="md" href="/" />

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 pl-3 py-1 pr-3 rounded-full bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 text-xs">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-orange-400 to-emerald-400 flex items-center justify-center text-white font-bold text-[10px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-stone-700 dark:text-stone-300">
                  {user.name}
                </span>
              </div>

              <ThemeToggle />

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Sign out"
                title="Sign out of SBS Forms"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-stone-200/80 dark:border-stone-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 shadow-sm shadow-orange-500/10 transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createForm } from "@/lib/actions/forms";
import { PlusCircle, Loader2 } from "lucide-react";

interface CreateFormButtonProps {
  className?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
  label?: string;
}

export function CreateFormButton({
  className = "",
  size = "md",
  variant = "primary",
  label = "Create New Form",
}: CreateFormButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await createForm({ title: "Untitled Form" });
      if (res.success && res.form) {
        router.push(`/dashboard/create/${res.form.id}`);
      } else {
        alert(res.error || "Failed to create form");
        setLoading(false);
      }
    } catch (e: any) {
      alert(e?.message || "Failed to create form");
      setLoading(false);
    }
  };

  if (variant === "secondary") {
    return (
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/50 hover:bg-orange-100/60 transition-colors disabled:opacity-50 cursor-pointer ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Creating...</span>
          </>
        ) : (
          <>
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{label}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 shadow-md shadow-orange-500/15 disabled:opacity-60 transition-all cursor-pointer ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Creating...</span>
        </>
      ) : (
        <>
          <PlusCircle className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

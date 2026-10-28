"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Globe,
  Lock,
  Copy,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Trash2,
  Users,
  Loader2,
  Table,
  Calendar,
  Clock,
} from "lucide-react";
import { deleteForm, type UserFormItem } from "@/lib/actions/forms";

export function FormCard({ form }: { form: UserFormItem }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/f/${form.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete "${form.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteForm(form.id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete form.");
        setIsDeleting(false);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete form.");
      setIsDeleting(false);
    }
  };

  const fieldsCount = Array.isArray(form.fields) ? form.fields.length : 0;
  const updatedDate = new Date(
    form.updatedAt || form.createdAt,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isPastDeadline = form.deadline
    ? new Date() > new Date(form.deadline)
    : false;

  return (
    <div className="relative rounded-2xl bg-white dark:bg-[#131920] border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs hover:border-orange-200 dark:hover:border-stone-700 hover:shadow-sm transition-all flex flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Live / Published Status */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                form.status === "published"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  form.status === "published"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-stone-400"
                }`}
              />
              <span>{form.status === "published" ? "Live" : "Draft"}</span>
            </span>

            {/* Access Setting: isPublic (No Login) vs Private (Login Required) */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                form.isPublic
                  ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
              }`}
            >
              {form.isPublic ? (
                <Globe className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              <span>{form.isPublic ? "No Login Needed" : "Login Required"}</span>
            </span>

            {isPastDeadline && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                Closed
              </span>
            )}
          </div>

          {/* Submissions count pill that links directly to /dashboard/submissions/[id] */}
          <Link
            href={`/dashboard/submissions/${form.id}`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 transition-colors text-xs font-semibold shrink-0 cursor-pointer"
            title="View submissions"
          >
            <Table className="w-3.5 h-3.5 text-orange-500" />
            <span>{form.submissionCount}</span>
          </Link>
        </div>

        {/* Title & Description */}
        <Link
          href={`/dashboard/create/${form.id}`}
          className="block group focus:outline-none"
        >
          <h3 className="font-bold text-base text-stone-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
            {form.title || "Untitled Form"}
          </h3>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 line-clamp-2 min-h-[2rem]">
            {form.description || "No description provided."}
          </p>
        </Link>
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
        <span className="text-[11px] text-stone-400">
          {fieldsCount} {fieldsCount === 1 ? "question" : "questions"} &bull;{" "}
          Updated {updatedDate}
        </span>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/dashboard/submissions/${form.id}`}
            className="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-stone-800 transition-colors"
            title="View submissions table"
          >
            <Table className="w-4 h-4" />
          </Link>

          {form.isPublic && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Copy public link"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}

          {form.isPublic && (
            <Link
              href={`/f/${form.id}`}
              target="_blank"
              className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-stone-800 transition-colors"
              title="View public form"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}

          <Link
            href={`/dashboard/create/${form.id}`}
            className="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-stone-800 transition-colors"
            title="Edit form"
          >
            <Edit3 className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
            title="Delete form"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  ExternalLink,
  Table as TableIcon,
  Trash2,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  Loader2,
  AlertCircle,
  Inbox,
  CheckCircle2,
} from "lucide-react";
import { deleteForm } from "@/lib/actions/forms";
import { type AdminFormItem } from "@/lib/actions/admin";

interface AdminAllFormsTableProps {
  initialForms: AdminFormItem[];
}

export function AdminAllFormsTable({
  initialForms,
}: AdminAllFormsTableProps) {
  const router = useRouter();
  const [formsList, setFormsList] = useState<AdminFormItem[]>(initialForms);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDelete = (form: AdminFormItem) => {
    const confirmPrompt = `Are you sure you want to PERMANENTLY delete form "${form.title}" created by ${
      form.creator?.name || "a user"
    }? All responses and submissions will be deleted. This cannot be undone.`;

    if (!window.confirm(confirmPrompt)) return;

    setDeletingId(form.id);
    startTransition(async () => {
      try {
        const res = await deleteForm(form.id);
        if (res.success) {
          setFormsList((prev) => prev.filter((f) => f.id !== form.id));
          showMessage("success", `Form "${form.title}" has been deleted.`);
          router.refresh();
        } else {
          showMessage("error", res.error || "Failed to delete form.");
        }
      } catch (err: any) {
        showMessage("error", err?.message || "An unexpected error occurred.");
      } finally {
        setDeletingId(null);
      }
    });
  };

  const filteredForms = formsList.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      f.title.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q)) ||
      (f.creator?.name && f.creator.name.toLowerCase().includes(q)) ||
      (f.creator?.email && f.creator.email.toLowerCase().includes(q)) ||
      (f.creator?.degree && f.creator.degree.toLowerCase().includes(q)) ||
      (f.creator?.specialization && f.creator.specialization.toLowerCase().includes(q));

    const isPastDeadline = f.deadline ? new Date() > new Date(f.deadline) : false;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && f.status === "published" && !isPastDeadline) ||
      (statusFilter === "draft" && f.status === "draft") ||
      (statusFilter === "expired" && isPastDeadline);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {actionMessage && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 transition-all shadow-sm ${
            actionMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#131920] border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search forms by title, creator, degree, or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 text-stone-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="all">All Form Status</option>
            <option value="published">Live / Published</option>
            <option value="draft">Drafts</option>
            <option value="expired">Expired / Closed</option>
          </select>
        </div>
      </div>

      {/* Forms Table */}
      <div className="rounded-2xl bg-white dark:bg-[#131920] border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 dark:bg-stone-900/60 border-b border-stone-200/80 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Form</th>
                <th className="py-3.5 px-4">Created By</th>
                <th className="py-3.5 px-4">Status & Deadline</th>
                <th className="py-3.5 px-4">Responses</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-stone-400">
                    No forms found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredForms.map((f) => {
                  const isPastDeadline = f.deadline
                    ? new Date() > new Date(f.deadline)
                    : false;
                  const isDeletingThis = isPending && deletingId === f.id;

                  return (
                    <tr
                      key={f.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
                    >
                      {/* Form Title & ID */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-[180px] max-w-[260px]">
                          <div className="font-semibold text-stone-900 dark:text-white truncate">
                            {f.title || "Untitled Form"}
                          </div>
                          {f.description && (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                              {f.description}
                            </p>
                          )}
                          <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                            ID: {f.id}
                          </span>
                        </div>
                      </td>

                      {/* Creator Details */}
                      <td className="py-3.5 px-4">
                        {f.creator ? (
                          <div className="flex items-center gap-2">
                            {f.creator.photo ? (
                              <img
                                src={f.creator.photo}
                                alt={f.creator.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-400 to-emerald-400 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                                {f.creator.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                                  {f.creator.name}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                                  {f.creator.role}
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-400 truncate block">
                                {f.creator.email}
                                {f.creator.degree && ` • ${f.creator.degree}${f.creator.specialization ? ` (${f.creator.specialization})` : ""}`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">
                            Deleted User
                          </span>
                        )}
                      </td>

                      {/* Status & Deadline */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isPastDeadline
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60"
                                : f.status === "published"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60"
                                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPastDeadline
                                  ? "bg-rose-500"
                                  : f.status === "published"
                                  ? "bg-emerald-500"
                                  : "bg-stone-400"
                              }`}
                            />
                            <span>
                              {isPastDeadline
                                ? "Expired"
                                : f.status === "published"
                                ? "Live"
                                : "Draft"}
                            </span>
                          </span>

                          {f.deadline && (
                            <div className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(f.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Submissions Count */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                          <Inbox className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{f.submissionCount} responses</span>
                        </div>
                      </td>

                      {/* Actions: View Form (at /f/[id]), View Submissions, Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. View at /f/[id] (no edit, only view) */}
                          <Link
                            href={`/f/${f.id}`}
                            target="_blank"
                            title="View public form (/f/[id])"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 text-stone-500" />
                            <span>View Form</span>
                          </Link>

                          {/* 2. View Submissions */}
                          <Link
                            href={`/dashboard/submissions/${f.id}`}
                            title="See all responses for this form"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200/60 dark:border-orange-800/40 transition-colors"
                          >
                            <TableIcon className="w-3 h-3 text-orange-500" />
                            <span>Submissions</span>
                          </Link>

                          {/* 3. Delete Form (allow deleting any form) */}
                          <button
                            type="button"
                            onClick={() => handleDelete(f)}
                            disabled={isDeletingThis}
                            title="Delete this form from platform"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isDeletingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

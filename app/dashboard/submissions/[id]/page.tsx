"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  Calendar,
  User,
  Building2,
  Mail,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit3,
  Copy,
  CheckCircle2,
  Inbox,
  FileSpreadsheet,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getFormSubmissions,
  getAllSubmissionsForExport,
  type SubmissionWithUser,
} from "@/lib/actions/forms";
import { type Form } from "@/lib/drizzle/schema";

interface FormFieldItem {
  id: string;
  label?: string;
  type: string;
}

function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return "";
  let str = "";
  if (Array.isArray(value)) {
    str = value.join(", ");
  } else if (typeof value === "object") {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  // If string contains comma, double-quote, or newline, escape quotes and wrap in quotes
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function SubmissionsViewerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = (params?.id as string) || "";
  const router = useRouter();

  const currentPage = parseInt(searchParams?.get("page") || "1", 10) || 1;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!formId) return;
      setLoading(true);
      setError("");

      try {
        const user = await getCurrentUser();
        if (!active) return;

        if (!user) {
          router.push(`/login?redirect=/dashboard/submissions/${formId}`);
          return;
        }
        setCurrentUser(user);

        const res = await getFormSubmissions(formId, currentPage, 100);
        if (!active) return;

        if (res.success && res.form) {
          setForm(res.form);
          setSubmissions(res.submissions || []);
          setTotalCount(res.totalCount || 0);
          setTotalPages(res.totalPages || 1);
        } else {
          setError(res.error || "Failed to load form submissions.");
        }
      } catch (err: any) {
        console.error("Error loading submissions:", err);
        if (active) setError(err?.message || "Failed to load submissions.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [formId, currentPage, router]);

  // CSV Export Function
  const handleExportCsv = async () => {
    if (!form || isExporting) return;
    setIsExporting(true);

    try {
      const res = await getAllSubmissionsForExport(formId);
      if (!res.success || !res.submissions) {
        alert(res.error || "Failed to export submissions.");
        return;
      }

      const allSubs = res.submissions;
      const questionFields: FormFieldItem[] = Array.isArray(form.fields)
        ? (form.fields as FormFieldItem[]).filter(
            (f) => !["text box", "image"].includes(f.type),
          )
        : [];

      // Build CSV headers
      const headers = [
        "Submission ID",
        "Submitted At (UTC)",
        "Respondent Name",
        "Respondent Email",
        "Respondent Degree",
        "Respondent Branch",
        ...questionFields.map((f) => f.label || `Question (${f.id})`),
      ];

      const rows: string[] = [];
      rows.push(headers.map(escapeCsvCell).join(","));

      // Build data rows
      for (const sub of allSubs) {
        const row = [
          sub.id,
          new Date(sub.submittedAt).toISOString(),
          sub.submitter?.name || "Anonymous",
          sub.submitter?.email || "",
          sub.submitter?.degree || "",
          sub.submitter?.specialization || "",
          ...questionFields.map((f) => {
            const answer = sub.answers?.[f.id];
            return answer !== undefined ? answer : "";
          }),
        ];
        rows.push(row.map(escapeCsvCell).join(","));
      }

      const csvContent = rows.join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = (form.title || "form")
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, "_");
      link.href = url;
      link.setAttribute("download", `${safeTitle}_submissions.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export error:", err);
      alert(err?.message || "Failed to export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0c1014] text-stone-500">
        <div className="flex items-center gap-3 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span>Loading submissions...</span>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-[#0c1014] text-stone-900 dark:text-stone-100">
        <Navbar user={currentUser} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131920] p-8 rounded-3xl border border-rose-200 dark:border-rose-900/50 max-w-md w-full text-center shadow-sm">
            <h2 className="text-lg font-bold text-rose-600 mb-2">Error</h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-6">
              {error || "Unable to load form submissions."}
            </p>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-orange-500 hover:bg-orange-600 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const questionFields: FormFieldItem[] = Array.isArray(form.fields)
    ? (form.fields as FormFieldItem[]).filter(
        (f) => !["text box", "image"].includes(f.type),
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/70 dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header Card */}
        <div className="relative rounded-3xl bg-white dark:bg-[#131920] border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-xs">
          <div className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href="/dashboard"
                  className="text-xs font-medium text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <span className="text-stone-300 dark:text-stone-700">/</span>
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                  Submissions
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
                {form.title || "Untitled Form"}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 font-semibold">
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>
                    {totalCount} {totalCount === 1 ? "submission" : "submissions"} total
                  </span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  <span>{questionFields.length} questions</span>
                </span>

                <span className="text-stone-400">
                  Pagination: 100 per page (Page {currentPage} of {totalPages})
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Copy Link */}
              <button
                type="button"
                onClick={copyPublicLink}
                className="px-3.5 py-2 text-xs font-medium rounded-xl border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                title="Copy public form link"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    <span>Copy Form Link</span>
                  </>
                )}
              </button>

              {/* View Public Form */}
              <Link
                href={`/f/${form.id}`}
                target="_blank"
                className="px-3.5 py-2 text-xs font-medium rounded-xl border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Live View</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              </Link>

              {/* Edit Form - Only for form owner */}
              {currentUser && form.createdBy === currentUser.id && (
                <Link
                  href={`/dashboard/create/${form.id}`}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                  <span>Edit Form</span>
                </Link>
              )}

              {/* Export to CSV Button */}
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting || totalCount === 0}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating CSV...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export to CSV</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submissions Table / Empty State */}
        {submissions.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-[#131920] border border-dashed border-stone-200 dark:border-stone-800 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center mb-4 shadow-xs">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
              No submissions recorded yet
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-6 leading-relaxed">
              Share your public form link with respondents to begin collecting
              responses. Responses will appear here in real-time.
            </p>
            <button
              type="button"
              onClick={copyPublicLink}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Public Link</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl bg-white dark:bg-[#131920] border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50/80 dark:bg-stone-900/80 border-b border-stone-200/80 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-semibold tracking-wide uppercase text-[10px]">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4 min-w-[140px]">Submitted At</th>
                      <th className="py-3 px-4 min-w-[180px]">Respondent</th>
                      <th className="py-3 px-4 min-w-[140px]">Degree & Branch</th>
                      {questionFields.map((field) => (
                        <th
                          key={field.id}
                          className="py-3 px-4 min-w-[180px] max-w-[280px]"
                        >
                          <div className="truncate" title={field.label}>
                            {field.label || `Question (${field.id})`}
                          </div>
                          <span className="text-[9px] font-normal text-stone-400 capitalize">
                            {field.type}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                    {submissions.map((sub, idx) => {
                      const rowNumber = (currentPage - 1) * 100 + idx + 1;
                      const dateStr = new Date(sub.submittedAt).toLocaleString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      );

                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-orange-50/20 dark:hover:bg-stone-900/50 transition-colors"
                        >
                          {/* Row Number */}
                          <td className="py-3 px-4 text-center text-stone-400 font-mono">
                            {rowNumber}
                          </td>

                          {/* Submission Date */}
                          <td className="py-3 px-4 whitespace-nowrap text-stone-600 dark:text-stone-300 font-mono text-[11px]">
                            {dateStr}
                          </td>

                          {/* Respondent Info */}
                          <td className="py-3 px-4">
                            {sub.submitter ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                                  <User className="w-3 h-3 text-emerald-500" />
                                  <span>{sub.submitter.name}</span>
                                </div>
                                <div className="text-[11px] text-stone-400 font-mono truncate">
                                  {sub.submitter.email}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 text-[11px]">
                                Anonymous
                              </span>
                            )}
                          </td>

                          {/* Degree & Specialization */}
                          <td className="py-3 px-4 text-stone-600 dark:text-stone-300">
                            {sub.submitter?.degree || sub.submitter?.specialization ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 text-[11px]">
                                <Building2 className="w-3 h-3 text-emerald-500" />
                                <span>
                                  {[sub.submitter.degree, sub.submitter.specialization]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </span>
                              </span>
                            ) : (
                              <span className="text-stone-300 dark:text-stone-700">
                                —
                              </span>
                            )}
                          </td>

                          {/* Question Answers */}
                          {questionFields.map((field) => {
                            const val = sub.answers?.[field.id];
                            let displayVal = "—";

                            if (val !== undefined && val !== null && val !== "") {
                              if (Array.isArray(val)) {
                                displayVal = val.join(", ");
                              } else if (typeof val === "boolean") {
                                displayVal = val ? "Yes" : "No";
                              } else {
                                displayVal = String(val);
                              }
                            }

                            return (
                              <td
                                key={field.id}
                                className="py-3 px-4 text-stone-700 dark:text-stone-300 text-xs max-w-[280px]"
                              >
                                <div
                                  className="line-clamp-3 leading-relaxed"
                                  title={displayVal !== "—" ? displayVal : ""}
                                >
                                  {displayVal}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls (100 per page) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#131920] border border-stone-200/80 dark:border-stone-800 text-xs">
              <span className="text-stone-500 dark:text-stone-400">
                Showing{" "}
                <strong className="text-stone-800 dark:text-stone-200">
                  {(currentPage - 1) * 100 + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-stone-800 dark:text-stone-200">
                  {Math.min(currentPage * 100, totalCount)}
                </strong>{" "}
                of{" "}
                <strong className="text-stone-800 dark:text-stone-200">
                  {totalCount}
                </strong>{" "}
                submissions
              </span>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/submissions/${formId}?page=${Math.max(1, currentPage - 1)}`}
                  className={`p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 inline-flex items-center gap-1 ${
                    currentPage <= 1
                      ? "opacity-40 pointer-events-none"
                      : "cursor-pointer"
                  }`}
                  aria-disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Link>

                <span className="px-3 py-1.5 rounded-xl font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40">
                  Page {currentPage} of {totalPages}
                </span>

                <Link
                  href={`/dashboard/submissions/${formId}?page=${Math.min(totalPages, currentPage + 1)}`}
                  className={`p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 inline-flex items-center gap-1 ${
                    currentPage >= totalPages
                      ? "opacity-40 pointer-events-none"
                      : "cursor-pointer"
                  }`}
                  aria-disabled={currentPage >= totalPages}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SubmissionsViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0c1014] text-stone-500">
          <div className="flex items-center gap-3 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span>Loading submissions viewer...</span>
          </div>
        </div>
      }
    >
      <SubmissionsViewerContent />
    </Suspense>
  );
}

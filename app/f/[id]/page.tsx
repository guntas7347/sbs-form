"use client";

import React, { useEffect, useState, Suspense } from "react";
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Lock,
  Calendar,
  Clock,
  ExternalLink,
  User,
  Building2,
  Sparkles,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getForm,
  submitForm,
  type FormCreatorInfo,
} from "@/lib/actions/forms";
import { getCurrentUser } from "@/lib/actions/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  type PostSubmissionSettings,
  type PostSubmissionLink,
} from "@/lib/drizzle/schema";

interface FormField {
  id: string;
  label?: string;
  type: string;
  required?: boolean;
  content?: string;
  options?: string[];
}

function FormPageContent() {
  const params = useParams();
  const formId = (params?.id as string) || "";
  const router = useRouter();

  const [form, setForm] = useState<any | null>(null);
  const [creator, setCreator] = useState<FormCreatorInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPostSettings, setSubmittedPostSettings] =
    useState<PostSubmissionSettings | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    let active = true;

    async function load() {
      if (!formId) return;

      try {
        const [user, formRes] = await Promise.all([
          getCurrentUser(),
          getForm(formId),
        ]);

        if (!active) return;
        setCurrentUser(user);

        if (!formRes.success || !formRes.form) {
          if (formRes.isDraft) {
            setIsDraft(true);
          }
          if (formRes.isExpired) {
            setIsExpired(true);
          }
          if (formRes.requiresAuth) {
            setRequiresAuth(true);
          }
          if (formRes.creator) {
            setCreator(formRes.creator);
          }
          setError(formRes.error || "Form not found or inaccessible.");
          setLoading(false);
          return;
        }

        setForm(formRes.form);
        setCreator(formRes.creator || null);
        setIsOwner(!!formRes.isOwner);
        if (formRes.isExpired) {
          setIsExpired(true);
        }
      } catch (err: any) {
        console.error("Form load error:", err);
        if (active) setError(err?.message || "Failed to load form.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [formId]);

  const handleChange = (fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleCheckboxToggle = (fieldId: string, option: string) => {
    const current = (answers[fieldId] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    handleChange(fieldId, updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || isSubmitting) return;

    // Validate required fields
    const fields: FormField[] = Array.isArray(form.fields) ? form.fields : [];
    const errors: Record<string, string> = {};

    for (const field of fields) {
      if (["text box", "image"].includes(field.type)) continue;

      if (field.required) {
        const val = answers[field.id];
        if (
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0)
        ) {
          errors[field.id] = `This field is required`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to first error on mobile/desktop
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitForm(formId, answers);
      if (res.success) {
        setSubmittedPostSettings(res.postSubmission || null);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(res.error || "Failed to submit response.");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(err?.message || "Failed to submit response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0c1014] text-stone-500">
        <div className="flex items-center gap-3 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span>Loading form...</span>
        </div>
      </div>
    );
  }

  // Error / Closed / Sign-In Required Views
  if (error || !form) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors">
        <header className="p-4 sm:p-6 flex items-center justify-between max-w-3xl mx-auto w-full">
          <BrandLogo size="md" href="/" />
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131920] p-6 sm:p-10 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 max-w-md w-full text-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                requiresAuth
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200/60 dark:border-amber-900/40"
                  : isExpired
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200/60 dark:border-rose-900/40"
                    : isDraft
                      ? "bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-900/40"
              }`}
            >
              {requiresAuth ? (
                <Lock className="w-7 h-7" />
              ) : isExpired ? (
                <Calendar className="w-7 h-7" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold mb-2">
              {requiresAuth
                ? "Sign In Required"
                : isExpired
                  ? "Submission Deadline Passed"
                  : isDraft
                    ? "Form Not Live (Draft)"
                    : "Form Unavailable"}
            </h1>

            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
              {requiresAuth
                ? "The creator of this form requires respondents to be signed into SBS FORMS to submit. Please log in with your email to continue."
                : isExpired
                  ? "The deadline for this form has passed. New submissions are no longer being accepted by the form creator."
                  : isDraft
                    ? "This form is currently in draft mode and is not live for public responses. Please check back later."
                    : error || "This form could not be found or has been removed."}
            </p>

            {creator && (
              <div className="mb-6 p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 flex items-center justify-center gap-2">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  Created by <strong>{creator.name}</strong>
                  {creator.department && ` (${creator.department})`}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {requiresAuth && (
                <Link
                  href={`/login?redirect=/f/${formId}`}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 transition-all shadow-xs"
                >
                  Sign In to Submit
                </Link>
              )}
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition-colors"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Post Submission Success Screen (Mobile friendly + custom text + links + image)
  if (submitted) {
    const postSettings: PostSubmissionSettings =
      submittedPostSettings || form.postSubmission || {};
    const successMessage =
      postSettings.message ||
      "Thank you! Your response has been recorded.";
    const links: PostSubmissionLink[] = Array.isArray(postSettings.links)
      ? postSettings.links
      : [];
    const imageUrl = postSettings.imageUrl;

    return (
      <div className="min-h-screen flex flex-col bg-stone-50/70 dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors py-6 px-4">
        <header className="p-4 sm:p-6 flex items-center justify-between max-w-2xl mx-auto w-full">
          <BrandLogo size="md" href="/" />
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-[#131920] p-6 sm:p-10 rounded-3xl shadow-sm border border-emerald-100/90 dark:border-stone-800 max-w-lg w-full text-center relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400" />

            {/* Checkmark Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            {/* Title & Success Text */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
                Response Submitted!
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line px-2">
                {successMessage}
              </p>
            </div>

            {/* Creator Attribution */}
            {creator && (
              <div className="inline-flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-stone-900/60 px-3 py-1 rounded-full border border-stone-100 dark:border-stone-800">
                <User className="w-3 h-3 text-orange-400" />
                <span>
                  Form by <strong>{creator.name}</strong>
                  {creator.department && ` • ${creator.department}`}
                </span>
              </div>
            )}

            {/* Links Below Text */}
            {links.length > 0 && (
              <div className="space-y-2.5 pt-2 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block px-1">
                  Next Steps & Resources
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {links.map((link, idx) => {
                    if (!link.url) return null;
                    const href = link.url.startsWith("http")
                      ? link.url
                      : `https://${link.url}`;
                    return (
                      <a
                        key={idx}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/60 dark:bg-stone-900 border border-orange-200/70 dark:border-stone-800 hover:border-orange-300 dark:hover:border-orange-900/60 hover:bg-orange-100/50 transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-100 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400">
                            {link.name || link.url}
                          </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-orange-500 shrink-0 transition-colors" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Image Preview Below Links */}
            {imageUrl && (
              <div className="pt-2">
                <div className="rounded-2xl overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-xs bg-black/5">
                  <img
                    src={imageUrl}
                    alt="Post submission banner"
                    className="w-full h-auto max-h-64 object-cover rounded-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Submission Receipt Info */}
            <div className="bg-stone-50 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
              <div className="flex justify-between items-center">
                <span>Submitted by:</span>
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {currentUser
                    ? `${currentUser.name} (${currentUser.email})`
                    : "Anonymous Respondent"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Timestamp:</span>
                <span className="font-mono text-stone-600 dark:text-stone-400">
                  {new Date().toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Submit Another Response</span>
              </button>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 transition-all shadow-xs min-h-[44px]"
              >
                <span>Back to Home</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const fields: FormField[] = Array.isArray(form.fields) ? form.fields : [];
  const deadlineDate = form.deadline ? new Date(form.deadline) : null;
  const formattedDeadline = deadlineDate
    ? deadlineDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/70 dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors py-6 sm:py-10 px-4">
      {/* Top Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between mb-6">
        <BrandLogo size="md" href="/" />
        <div className="flex items-center gap-3">
          {currentUser ? (
            <span className="text-xs text-stone-500 hidden sm:inline">
              Signed in as{" "}
              <strong className="text-stone-700 dark:text-stone-300">
                {currentUser.name}
              </strong>
            </span>
          ) : (
            <span className="text-xs text-stone-400 hidden sm:inline">
              Anonymous submission allowed
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full space-y-6">
        {/* Creator Info & Form Header Card */}
        <div className="relative rounded-3xl bg-white dark:bg-[#131920] border border-orange-100/90 dark:border-stone-800 p-6 sm:p-8 shadow-xs overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400" />

          {/* Creator Attribution & Department Banner */}
          {creator && (
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 font-medium">
                <User className="w-3.5 h-3.5 text-orange-500" />
                <span>
                  Created by <strong>{creator.name}</strong>
                </span>
              </span>

              {creator.department && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{creator.department} Department</span>
                </span>
              )}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            {form.title || "Untitled Form"}
          </h1>

          {form.description && (
            <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
              {form.description}
            </p>
          )}

          {/* Form Metadata Badges: Deadline & Login requirement */}
          <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
            {formattedDeadline && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-200/60 dark:border-stone-800">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>Deadline: {formattedDeadline}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-200/60 dark:border-stone-800">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              <span>
                {form.isPublic
                  ? "Public Form (No sign-in required)"
                  : "Authenticated Form"}
              </span>
            </span>

            <span className="text-[11px] text-stone-400">
              * Indicates required question
            </span>
          </div>
        </div>

        {/* Form Body Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {fields.map((field) => {
            const hasError = !!validationErrors[field.id];

            // 1. Text Box (Notice/Instruction)
            if (field.type === "text box") {
              return (
                <div
                  key={field.id}
                  className="rounded-2xl bg-amber-50/60 dark:bg-[#151a21] border border-amber-200/70 dark:border-amber-900/40 p-4 sm:p-5"
                >
                  {field.label && (
                    <h3 className="font-bold text-sm text-amber-950 dark:text-amber-200 mb-1">
                      {field.label}
                    </h3>
                  )}
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                    {field.content}
                  </p>
                </div>
              );
            }

            // 2. Image Banner
            if (field.type === "image") {
              return (
                <div
                  key={field.id}
                  className="rounded-2xl bg-white dark:bg-[#131920] border border-stone-200/80 dark:border-stone-800 p-3 sm:p-4 overflow-hidden"
                >
                  {field.label && (
                    <p className="font-semibold text-xs text-stone-500 mb-2">
                      {field.label}
                    </p>
                  )}
                  {field.content && (
                    <img
                      src={field.content}
                      alt={field.label || "Banner"}
                      className="rounded-xl w-full max-h-72 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
              );
            }

            // Standard Question Fields
            return (
              <div
                key={field.id}
                id={`field-${field.id}`}
                className={`rounded-2xl bg-white dark:bg-[#131920] border p-5 sm:p-6 shadow-xs transition-all ${
                  hasError
                    ? "border-rose-400 dark:border-rose-800 bg-rose-50/10"
                    : "border-stone-200/80 dark:border-stone-800 hover:border-orange-200 dark:hover:border-stone-700"
                }`}
              >
                <label className="block mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      {field.label || "Untitled Question"}
                      {field.required && (
                        <span
                          className="text-orange-500 ml-1 font-bold"
                          title="Required"
                        >
                          *
                        </span>
                      )}
                    </span>
                  </div>
                </label>

                {/* Input Controls */}
                <div>
                  {field.type === "text" && (
                    <input
                      type="text"
                      value={answers[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder="Your answer..."
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/40 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 transition-colors min-h-[46px]"
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      rows={3}
                      value={answers[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/40 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 transition-colors resize-y"
                    />
                  )}

                  {field.type === "multiple choice" && (
                    <div className="space-y-2 pt-1">
                      {(field.options || []).map((opt, i) => (
                        <label
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer min-h-[46px] select-none ${
                            answers[field.id] === opt
                              ? "border-orange-400 bg-orange-50/50 dark:bg-orange-950/30 text-stone-900 dark:text-white"
                              : "border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`radio-${field.id}`}
                            value={opt}
                            checked={answers[field.id] === opt}
                            onChange={() => handleChange(field.id, opt)}
                            className="w-4 h-4 text-orange-500 accent-orange-500 cursor-pointer"
                          />
                          <span className="text-xs sm:text-sm font-medium">
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === "checkboxes" && (
                    <div className="space-y-2 pt-1">
                      {(field.options || []).map((opt, i) => {
                        const checked = (
                          (answers[field.id] as string[]) || []
                        ).includes(opt);
                        return (
                          <label
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer min-h-[46px] select-none ${
                              checked
                                ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 text-stone-900 dark:text-white"
                                : "border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                handleCheckboxToggle(field.id, opt)
                              }
                              className="w-4 h-4 text-emerald-500 rounded accent-emerald-500 cursor-pointer"
                            />
                            <span className="text-xs sm:text-sm font-medium">
                              {opt}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {field.type === "date" && (
                    <input
                      type="date"
                      value={answers[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className="w-full sm:w-auto text-xs sm:text-sm p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/40 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 transition-colors min-h-[46px]"
                    />
                  )}

                  {field.type === "time" && (
                    <input
                      type="time"
                      value={answers[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className="w-full sm:w-auto text-xs sm:text-sm p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/40 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-orange-500 transition-colors min-h-[46px]"
                    />
                  )}
                </div>

                {/* Validation error message */}
                {hasError && (
                  <p className="mt-2 text-xs font-semibold text-rose-500 inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{validationErrors[field.id]}</span>
                  </p>
                )}
              </div>
            );
          })}

          {/* Form Actions (Submit Bar) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-stone-400">
              Never submit passwords or sensitive credentials through web forms.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 rounded-xl shadow-md shadow-orange-500/15 disabled:opacity-60 transition-all cursor-pointer inline-flex items-center justify-center gap-2 min-h-[48px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Response...</span>
                </>
              ) : (
                <>
                  <span>Submit Response</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function FormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0c1014] text-stone-500">
          <div className="flex items-center gap-3 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span>Loading form...</span>
          </div>
        </div>
      }
    >
      <FormPageContent />
    </Suspense>
  );
}

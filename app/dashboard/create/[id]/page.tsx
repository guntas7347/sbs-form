"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import {
  MoveUp,
  MoveDown,
  Trash2,
  Plus,
  Save,
  Globe,
  Lock,
  Copy,
  ExternalLink,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Sparkles,
  Calendar,
  Clock,
  Link2,
  ImageIcon,
  Table,
  Check,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/actions/auth";
import { getForm, createForm, updateForm } from "@/lib/actions/forms";
import { Navbar } from "@/components/Navbar";
import {
  type PostSubmissionSettings,
  type PostSubmissionLink,
} from "@/lib/drizzle/schema";
import { AIFormGeneratorModal } from "@/components/AIFormGeneratorModal";

export interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  content?: string;
  options?: string[];
}

export interface FormBuilderState {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  status: string;
  isPublic: boolean;
  deadline: string; // ISO slice (YYYY-MM-DDTHH:mm)
  postSubmission: PostSubmissionSettings;
}

const FieldOptions = ({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) => {
  return (
    <div className="mt-3 space-y-2 ml-2 sm:ml-4">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-3">
          <span className="text-orange-400 font-bold text-sm">•</span>
          <input
            type="text"
            className="border-b border-stone-200 dark:border-stone-700 focus:border-orange-500 focus:outline-none p-1.5 text-sm flex-1 bg-transparent text-stone-900 dark:text-stone-100"
            value={opt}
            placeholder={`Option ${i + 1}`}
            onChange={(e) => {
              const newOpts = [...options];
              newOpts[i] = e.target.value;
              onChange(newOpts);
            }}
          />
          {options.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const newOpts = options.filter((_, idx) => idx !== i);
                onChange(newOpts);
              }}
              className="text-stone-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
              title="Remove option"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={() => onChange([...options, `Option ${options.length + 1}`])}
          className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 inline-flex items-center gap-1 cursor-pointer pt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add option</span>
        </button>
      </div>
    </div>
  );
};

const FieldItem = ({
  field,
  updateField,
  removeField,
  moveUp,
  moveDown,
  isFirst,
  isLast,
}: {
  field: FormField;
  updateField: (field: FormField) => void;
  removeField: () => void;
  moveUp: () => void;
  moveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  return (
    <div className="bg-white dark:bg-[#131920] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-orange-200/80 dark:hover:border-stone-700 transition-all space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input
          type="text"
          value={field.label}
          onChange={(e) => updateField({ ...field, label: e.target.value })}
          placeholder="Enter question or prompt..."
          className="font-medium text-sm sm:text-base border-b border-stone-200 dark:border-stone-700 focus:border-orange-500 focus:outline-none p-1 flex-1 bg-transparent text-stone-900 dark:text-white"
        />

        <div className="flex items-center gap-2">
          <select
            value={field.type}
            onChange={(e) => {
              const newType = e.target.value;
              const opts =
                newType === "multiple choice" || newType === "checkboxes"
                  ? field.options?.length
                    ? field.options
                    : ["Option 1", "Option 2"]
                  : undefined;
              updateField({ ...field, type: newType, options: opts });
            }}
            className="border border-stone-200 dark:border-stone-800 rounded-xl px-2.5 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:border-orange-400 cursor-pointer"
          >
            <option value="text">Short Answer</option>
            <option value="textarea">Paragraph</option>
            <option value="multiple choice">Multiple Choice</option>
            <option value="checkboxes">Checkboxes</option>
            <option value="date">Date</option>
            <option value="time">Time</option>
            <option value="text box">Instruction Note</option>
            <option value="image">Image Banner</option>
          </select>
        </div>
      </div>

      <div>
        {field.type === "text" && (
          <div className="border border-dashed border-stone-200 dark:border-stone-800 rounded-xl p-3 text-xs text-stone-400 dark:text-stone-500 bg-stone-50/50 dark:bg-stone-900/30">
            Short text response input
          </div>
        )}
        {field.type === "textarea" && (
          <div className="border border-dashed border-stone-200 dark:border-stone-800 rounded-xl p-4 text-xs text-stone-400 dark:text-stone-500 bg-stone-50/50 dark:bg-stone-900/30">
            Long paragraph text response input
          </div>
        )}
        {field.type === "multiple choice" && (
          <FieldOptions
            options={field.options || ["Option 1"]}
            onChange={(opts) => updateField({ ...field, options: opts })}
          />
        )}
        {field.type === "checkboxes" && (
          <FieldOptions
            options={field.options || ["Option 1"]}
            onChange={(opts) => updateField({ ...field, options: opts })}
          />
        )}
        {field.type === "date" && (
          <div className="border border-dashed border-stone-200 dark:border-stone-800 rounded-xl p-3 text-xs text-stone-400 dark:text-stone-500 bg-stone-50/50 dark:bg-stone-900/30">
            Date picker input (YYYY-MM-DD)
          </div>
        )}
        {field.type === "time" && (
          <div className="border border-dashed border-stone-200 dark:border-stone-800 rounded-xl p-3 text-xs text-stone-400 dark:text-stone-500 bg-stone-50/50 dark:bg-stone-900/30">
            Time picker input (HH:MM)
          </div>
        )}
        {field.type === "text box" && (
          <textarea
            value={field.content || ""}
            onChange={(e) => updateField({ ...field, content: e.target.value })}
            placeholder="Type instructions, guidelines, or notice content for respondents..."
            rows={2}
            className="border border-stone-200 dark:border-stone-800 rounded-xl p-3 w-full text-xs sm:text-sm bg-stone-50/50 dark:bg-stone-900/40 text-stone-700 dark:text-stone-300 focus:outline-none focus:border-orange-400"
          />
        )}
        {field.type === "image" && (
          <div className="flex flex-col gap-2">
            <input
              type="url"
              value={field.content || ""}
              onChange={(e) =>
                updateField({ ...field, content: e.target.value })
              }
              placeholder="Paste public image URL (e.g. https://...)"
              className="border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 w-full text-xs sm:text-sm bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none focus:border-orange-400"
            />
            {field.content && (
              <div className="mt-2 p-2 bg-stone-50 dark:bg-stone-900 rounded-xl max-w-xs">
                <img
                  src={field.content}
                  alt={field.label || "Preview"}
                  className="rounded-lg max-h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-stone-100 dark:border-stone-800/80 text-xs">
        <div className="flex items-center gap-1">
          {!isFirst && (
            <button
              type="button"
              onClick={moveUp}
              className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              title="Move up"
            >
              <MoveUp className="w-4 h-4" />
            </button>
          )}
          {!isLast && (
            <button
              type="button"
              onClick={moveDown}
              className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              title="Move down"
            >
              <MoveDown className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!["text box", "image"].includes(field.type) && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={field.required !== false}
                onChange={(e) =>
                  updateField({ ...field, required: e.target.checked })
                }
                className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
              />
              <span className="text-stone-600 dark:text-stone-300 font-medium">
                Required
              </span>
            </label>
          )}

          <button
            type="button"
            onClick={removeField}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            title="Delete question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

function FormBuilderContent() {
  const params = useParams();
  const formId = (params?.id as string) || "";
  const router = useRouter();

  const [form, setForm] = useState<FormBuilderState | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrefillSuccess, setAiPrefillSuccess] = useState(false);

  // Authenticate user & load/create form
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!active) return;

        if (!currentUser) {
          router.push(`/login?redirect=/dashboard/create/${formId}`);
          return;
        }

        setUser(currentUser);

        // Fetch form from database
        const formRes = await getForm(formId);
        if (!active) return;

        if (formRes.success && formRes.form) {
          const rawDeadline = formRes.form.deadline;
          const deadlineIso = rawDeadline
            ? new Date(rawDeadline).toISOString().slice(0, 16)
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 16);

          const postSub =
            (formRes.form.postSubmission as PostSubmissionSettings) || {};

          setForm({
            id: formRes.form.id,
            title: formRes.form.title,
            description: formRes.form.description || "",
            fields: Array.isArray(formRes.form.fields)
              ? (formRes.form.fields as FormField[])
              : [],
            status: formRes.form.status,
            isPublic: formRes.form.isPublic,
            deadline: deadlineIso,
            postSubmission: {
              message:
                postSub.message ??
                "Thank you! Your response has been recorded.",
              links: Array.isArray(postSub.links) ? postSub.links : [],
              imageUrl: postSub.imageUrl ?? "",
            },
          });
        } else {
          // If accessing 'new', create a new form using nanoid and redirect to its unique URL
          if (formId === "new") {
            const createRes = await createForm({ title: "Untitled Form" });
            if (!active) return;

            if (createRes.success && createRes.form) {
              router.replace(`/dashboard/create/${createRes.form.id}`);
            } else {
              setErrorMessage(createRes.error || "Unable to initialize form.");
            }
          } else {
            setErrorMessage(
              formRes.error ||
                "Form not found or you do not have permission to edit it.",
            );
          }
        }
      } catch (err: any) {
        console.error("Initialization error:", err);
        setErrorMessage(err?.message || "Error loading form builder.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [formId, router]);

  const updateFormLocally = (updated: FormBuilderState) => {
    setForm(updated);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const adjustDescriptionHeight = () => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = "auto";
      descriptionRef.current.style.height = `${Math.max(48, descriptionRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustDescriptionHeight();
  }, [form?.description]);

  // Split deadline parts for manual editing
  const deadlineDatePart = form?.deadline ? form.deadline.split("T")[0] || "" : "";
  const deadlineTimePart = form?.deadline && form.deadline.includes("T")
    ? form.deadline.split("T")[1].slice(0, 5) || "23:59"
    : "23:59";

  const handleManualDateChange = (newDate: string) => {
    if (!form) return;
    const time = deadlineTimePart || "23:59";
    const combined = newDate ? `${newDate}T${time}` : "";
    updateFormLocally({ ...form, deadline: combined });
  };

  const handleManualTimeChange = (newTime: string) => {
    if (!form) return;
    const date = deadlineDatePart || new Date().toISOString().slice(0, 10);
    const combined = `${date}T${newTime || "23:59"}`;
    updateFormLocally({ ...form, deadline: combined });
  };

  const handleManualTextChange = (rawText: string) => {
    if (!form) return;
    const normalized = rawText.replace(" ", "T");
    updateFormLocally({ ...form, deadline: normalized });
  };

  const handleAiPrefill = (prefilled: Partial<FormBuilderState>) => {
    if (!form) return;
    const updated: FormBuilderState = {
      ...form,
      title: prefilled.title !== undefined ? prefilled.title : form.title,
      description:
        prefilled.description !== undefined
          ? prefilled.description
          : form.description,
      fields: prefilled.fields !== undefined ? prefilled.fields : form.fields,
      postSubmission:
        prefilled.postSubmission !== undefined
          ? prefilled.postSubmission
          : form.postSubmission,
    };
    // Crucial: Only prefill form data locally, do NOT save or publish it
    updateFormLocally(updated);
    setAiPrefillSuccess(true);
    setTimeout(() => setAiPrefillSuccess(false), 6000);
  };

  const handleSave = async (overrides?: Partial<FormBuilderState>) => {
    if (!form || isSaving) return;
    setIsSaving(true);
    setErrorMessage("");

    const dataToSave = {
      title: overrides?.title !== undefined ? overrides.title : form.title,
      description:
        overrides?.description !== undefined
          ? overrides.description
          : form.description,
      fields: overrides?.fields !== undefined ? overrides.fields : form.fields,
      status: overrides?.status !== undefined ? overrides.status : form.status,
      isPublic:
        overrides?.isPublic !== undefined ? overrides.isPublic : form.isPublic,
      deadline:
        overrides?.deadline !== undefined ? overrides.deadline : form.deadline,
      postSubmission:
        overrides?.postSubmission !== undefined
          ? overrides.postSubmission
          : form.postSubmission,
    };

    try {
      const res = await updateForm(form.id, {
        ...dataToSave,
        deadline: dataToSave.deadline ? new Date(dataToSave.deadline) : undefined,
      });

      if (res.success && res.form) {
        const rawDeadline = res.form.deadline;
        const deadlineIso = rawDeadline
          ? new Date(rawDeadline).toISOString().slice(0, 16)
          : form.deadline;

        const postSub =
          (res.form.postSubmission as PostSubmissionSettings) || {};

        setForm({
          id: res.form.id,
          title: res.form.title,
          description: res.form.description || "",
          fields: Array.isArray(res.form.fields)
            ? (res.form.fields as FormField[])
            : [],
          status: res.form.status,
          isPublic: res.form.isPublic,
          deadline: deadlineIso,
          postSubmission: {
            message:
              postSub.message ??
              "Thank you! Your response has been recorded.",
            links: Array.isArray(postSub.links) ? postSub.links : [],
            imageUrl: postSub.imageUrl ?? "",
          },
        });
        setHasChanges(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(res.error || "Failed to save form.");
      }
    } catch (err: any) {
      console.error("Error saving form:", err);
      setErrorMessage(err?.message || "Failed to save form.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublished = async () => {
    if (!form) return;
    const nextStatus = form.status === "published" ? "draft" : "published";
    const updated = { ...form, status: nextStatus };
    setForm(updated);
    await handleSave(updated);
  };

  const togglePublicAccess = async () => {
    if (!form) return;
    const nextPublic = !form.isPublic;
    const updated = { ...form, isPublic: nextPublic };
    setForm(updated);
    await handleSave(updated);
  };

  const setDeadlinePreset = (days: number) => {
    if (!form) return;
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const deadlineIso = date.toISOString().slice(0, 16);
    updateFormLocally({ ...form, deadline: deadlineIso });
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const addField = () => {
    if (!form) return;
    const newField: FormField = {
      id: nanoid(8),
      type: "text",
      label: "",
      required: true, // checked by default as requested
    };
    updateFormLocally({ ...form, fields: [...form.fields, newField] });
  };

  const updateField = (id: string, updated: FormField) => {
    if (!form) return;
    const fields = form.fields.map((f) => (f.id === id ? updated : f));
    updateFormLocally({ ...form, fields });
  };

  const removeField = (id: string) => {
    if (!form) return;
    const fields = form.fields.filter((f) => f.id !== id);
    updateFormLocally({ ...form, fields });
  };

  const moveFieldUp = (index: number) => {
    if (!form || index === 0) return;
    const newFields = [...form.fields];
    const temp = newFields[index - 1];
    newFields[index - 1] = newFields[index];
    newFields[index] = temp;
    updateFormLocally({ ...form, fields: newFields });
  };

  const moveFieldDown = (index: number) => {
    if (!form || index === form.fields.length - 1) return;
    const newFields = [...form.fields];
    const temp = newFields[index + 1];
    newFields[index + 1] = newFields[index];
    newFields[index] = temp;
    updateFormLocally({ ...form, fields: newFields });
  };

  // Post Submission Links helpers
  const addPostSubmissionLink = () => {
    if (!form) return;
    const currentLinks = form.postSubmission.links || [];
    updateFormLocally({
      ...form,
      postSubmission: {
        ...form.postSubmission,
        links: [...currentLinks, { name: "", url: "" }],
      },
    });
  };

  const updatePostSubmissionLink = (
    index: number,
    field: "name" | "url",
    value: string,
  ) => {
    if (!form) return;
    const currentLinks = [...(form.postSubmission.links || [])];
    currentLinks[index] = { ...currentLinks[index], [field]: value };
    updateFormLocally({
      ...form,
      postSubmission: {
        ...form.postSubmission,
        links: currentLinks,
      },
    });
  };

  const removePostSubmissionLink = (index: number) => {
    if (!form) return;
    const currentLinks = (form.postSubmission.links || []).filter(
      (_, i) => i !== index,
    );
    updateFormLocally({
      ...form,
      postSubmission: {
        ...form.postSubmission,
        links: currentLinks,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0c1014] text-stone-500">
        <div className="flex items-center gap-3 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span>Loading form editor...</span>
        </div>
      </div>
    );
  }

  if (errorMessage && !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-[#0c1014] p-4 text-center">
        <div className="max-w-md w-full bg-white dark:bg-[#131920] border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-semibold text-rose-600 mb-2">Error</p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
            {errorMessage}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const isLive = form.status === "published";
  const deadlineDate = form.deadline ? new Date(form.deadline) : null;
  const isPastDeadline = deadlineDate ? new Date() > deadlineDate : false;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/70 dark:bg-[#0c1014] text-stone-900 dark:text-stone-100 transition-colors">
      <Navbar user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* 1. Form Header Card: Context & Status Badges */}
        <div className="bg-white dark:bg-[#131920] p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl border border-stone-200/80 dark:border-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg text-stone-900 dark:text-white leading-tight truncate">
                {form.title || "Untitled Form"}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-stone-400 flex-wrap">
                <span>{form.fields.length} questions</span>
                <span>&bull;</span>

                {/* Live / Draft status indicator */}
                <span
                  className={
                    isLive
                      ? "text-emerald-700 dark:text-emerald-300 font-semibold inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md"
                      : "text-stone-500 dark:text-stone-400 font-medium inline-flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md"
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`}
                  />
                  {isLive ? "Live" : "Draft"}
                </span>

                <span>&bull;</span>

                {/* Login requirement indicator */}
                <span
                  className={
                    form.isPublic
                      ? "text-teal-700 dark:text-teal-300 font-medium inline-flex items-center gap-1"
                      : "text-amber-700 dark:text-amber-300 font-medium inline-flex items-center gap-1"
                  }
                >
                  {form.isPublic ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  {form.isPublic ? "Public" : "Login Req"}
                </span>

                {hasChanges && (
                  <>
                    <span>&bull;</span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      Unsaved
                    </span>
                  </>
                )}
                {saveSuccess && (
                  <>
                    <span>&bull;</span>
                    <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Separate Action Toolbar Card: Minimal Text & Clean Controls */}
        <div className="bg-white dark:bg-[#131920] p-3 sm:p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
          {/* Left Action Group: AI & Submissions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/50 hover:bg-orange-100/70 dark:hover:bg-orange-900/60 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Generate form with AI JSON"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>AI</span>
            </button>

            <Link
              href={`/dashboard/submissions/${form.id}`}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5"
              title="View all submissions table"
            >
              <Table className="w-3.5 h-3.5 text-orange-500" />
              <span>Responses</span>
            </Link>
          </div>

          {/* Right Action Group: Share, Preview, Live toggle, Save */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              type="button"
              onClick={copyPublicLink}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy public link"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <Link
              href={`/f/${form.id}`}
              target="_blank"
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5"
              title="Preview form in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              <span>Preview</span>
            </Link>

            <button
              type="button"
              onClick={togglePublished}
              disabled={isSaving}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                isLive
                  ? "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60"
                  : "border-orange-200 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100/60"
              }`}
              title={isLive ? "Click to unpublish" : "Click to go live"}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500" : "bg-orange-500"}`}
              />
              <span>{isLive ? "Live" : "Publish"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={!hasChanges || isSaving}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
              title="Save all changes"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Form Settings Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Access & Login Requirement Panel */}
          <div className="bg-white dark:bg-[#131920] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${form.isPublic ? "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400" : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"}`}
              >
                {form.isPublic ? (
                  <Globe className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                  Access:{" "}
                  {form.isPublic
                    ? "Public (No Login Required)"
                    : "Private (Login Required)"}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  {form.isPublic
                    ? "Anyone with the link can submit responses anonymously without logging in."
                    : "Respondents must log into SBS FORMS to submit. Their name and email will be saved with their response."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={togglePublicAccess}
              disabled={isSaving}
              className={`w-full py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                form.isPublic
                  ? "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
              }`}
            >
              {form.isPublic
                ? "Switch to: Login Required"
                : "Switch to: No Login Required"}
            </button>
          </div>

          {/* Form Deadline Panel */}
          <div className="bg-white dark:bg-[#131920] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${isPastDeadline ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500" : "bg-orange-50 dark:bg-orange-950/40 text-orange-500"}`}
              >
                <Calendar className="w-4 h-4" />
              </div>
              <div className="w-full min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                    Form Deadline
                  </h2>
                  {isPastDeadline ? (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md shrink-0">
                      Submissions Closed
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md shrink-0">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  Submissions automatically close after this date & time. Edit manually below or pick presets.
                </p>

                {/* Manual Editing Inputs */}
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 block mb-1">
                        Date
                      </span>
                      <input
                        type="date"
                        value={deadlineDatePart}
                        onChange={(e) => handleManualDateChange(e.target.value)}
                        className="w-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 block mb-1">
                        Time (24h)
                      </span>
                      <input
                        type="time"
                        value={deadlineTimePart}
                        onChange={(e) => handleManualTimeChange(e.target.value)}
                        className="w-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900 rounded-xl px-3 py-2 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 block mb-1">
                      Direct Manual Input (YYYY-MM-DD HH:MM)
                    </span>
                    <input
                      type="text"
                      value={form.deadline?.replace("T", " ") || ""}
                      onChange={(e) => handleManualTextChange(e.target.value)}
                      placeholder="e.g. 2027-10-28 23:59"
                      className="w-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900 rounded-xl px-3 py-1.5 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Deadline Quick Presets */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800/80 text-[11px] flex-wrap">
              <span className="text-stone-400 font-medium">Presets:</span>
              <button
                type="button"
                onClick={() => setDeadlinePreset(1)}
                className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => setDeadlinePreset(7)}
                className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                +1 Week
              </button>
              <button
                type="button"
                onClick={() => setDeadlinePreset(30)}
                className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                +1 Month
              </button>
              <button
                type="button"
                onClick={() => setDeadlinePreset(365)}
                className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 cursor-pointer font-medium"
              >
                +1 Year (Default)
              </button>
            </div>
          </div>
        </div>

        {/* Error notice if saving fails */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Form Title & Description Card */}
        <div className="relative rounded-3xl bg-white dark:bg-[#131920] border border-orange-100/90 dark:border-stone-800 p-6 sm:p-8 shadow-xs">
          <div className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400" />

          <div className="space-y-4">
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                updateFormLocally({ ...form, title: e.target.value })
              }
              placeholder="Untitled Form"
              className="text-2xl sm:text-3xl font-extrabold w-full border-b border-stone-200 dark:border-stone-700 focus:border-orange-500 focus:outline-none pb-2 bg-transparent text-stone-900 dark:text-white"
            />
            <textarea
              ref={descriptionRef}
              value={form.description}
              onChange={(e) => {
                updateFormLocally({ ...form, description: e.target.value });
                adjustDescriptionHeight();
              }}
              placeholder="Add form description or welcome instructions (expands dynamically)..."
              style={{ fieldSizing: "content" } as any}
              className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 w-full border-b border-stone-100 dark:border-stone-800 focus:border-orange-500 focus:outline-none pb-2 bg-transparent resize-none overflow-hidden min-h-[48px] leading-relaxed transition-[height] duration-75"
            />
          </div>
        </div>

        {/* AI Prefill Notification Banner */}
        {aiPrefillSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Form prefilled from AI!</strong> Questions, options, and settings have been populated. Review them and click <strong>Save</strong> when you are ready to persist your changes.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAiPrefillSuccess(false)}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Questions / Fields List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              Form Questions ({form.fields.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/50 hover:bg-orange-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-orange-500" />
                <span>AI Prefill</span>
              </button>

              <button
                type="button"
                onClick={addField}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {form.fields.length === 0 ? (
            <div className="p-8 sm:p-12 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-[#131920]">
              <Sparkles className="w-8 h-8 text-orange-400 mx-auto mb-2 opacity-70" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                No questions added yet
              </p>
              <p className="text-xs text-stone-400 mt-1 mb-4">
                Add questions manually or use AI to generate your entire form structure in seconds.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={addField}
                  className="px-4 py-2 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-4 py-2 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 hover:bg-orange-100 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Generate with AI</span>
                </button>
              </div>
            </div>
          ) : (
            form.fields.map((f, i) => (
              <FieldItem
                key={f.id}
                field={f}
                updateField={(updated) => updateField(f.id, updated)}
                removeField={() => removeField(f.id)}
                moveUp={() => moveFieldUp(i)}
                moveDown={() => moveFieldDown(i)}
                isFirst={i === 0}
                isLast={i === form.fields.length - 1}
              />
            ))
          )}
        </div>

        {/* Post-Submission Settings Section */}
        <div className="bg-white dark:bg-[#131920] rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-stone-100 dark:border-stone-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  Post-Submission Experience
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Configure what respondents see immediately after submitting
                  their response (custom success text, helpful links, and an
                  image banner).
                </p>
              </div>
            </div>
          </div>

          {/* 1. Success Text Message */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
              Success Message
            </label>
            <textarea
              rows={3}
              value={form.postSubmission.message || ""}
              onChange={(e) =>
                updateFormLocally({
                  ...form,
                  postSubmission: {
                    ...form.postSubmission,
                    message: e.target.value,
                  },
                })
              }
              placeholder="Thank you! Your response has been recorded."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* 2. Custom Links Array */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-orange-500" />
                  <span>Next Steps / Helpful Links</span>
                </label>
                <p className="text-[11px] text-stone-400">
                  These links appear below the success message and open in a new
                  tab.
                </p>
              </div>

              <button
                type="button"
                onClick={addPostSubmissionLink}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Link</span>
              </button>
            </div>

            {(!form.postSubmission.links ||
              form.postSubmission.links.length === 0) && (
              <div className="p-4 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-400">
                No links added yet. Click &quot;Add Link&quot; to include
                resource or follow-up links.
              </div>
            )}

            {form.postSubmission.links?.map((link, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800"
              >
                <div className="w-full sm:w-1/3">
                  <input
                    type="text"
                    value={link.name}
                    onChange={(e) =>
                      updatePostSubmissionLink(idx, "name", e.target.value)
                    }
                    placeholder="Link Name (e.g. Documentation)"
                    className="w-full text-xs p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="w-full sm:flex-1">
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) =>
                      updatePostSubmissionLink(idx, "url", e.target.value)
                    }
                    placeholder="URL (e.g. https://...)"
                    className="w-full text-xs p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePostSubmissionLink(idx)}
                  className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                  title="Remove link"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* 3. Image URL & Preview */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
                <span>Post-Submission Image Banner</span>
              </label>
              <p className="text-[11px] text-stone-400">
                Shown below the links on the success screen.
              </p>
            </div>

            <input
              type="url"
              value={form.postSubmission.imageUrl || ""}
              onChange={(e) =>
                updateFormLocally({
                  ...form,
                  postSubmission: {
                    ...form.postSubmission,
                    imageUrl: e.target.value,
                  },
                })
              }
              placeholder="Paste public image URL (e.g. https://images.unsplash.com/...)"
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-orange-500 font-mono"
            />

            {form.postSubmission.imageUrl && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-200/80 dark:border-stone-800">
                <p className="text-[11px] font-semibold text-stone-500 mb-2">
                  Image Preview:
                </p>
                <div className="relative rounded-xl overflow-hidden max-h-48 border border-stone-200 dark:border-stone-700 bg-black/5 flex items-center justify-center">
                  <img
                    src={form.postSubmission.imageUrl}
                    alt="Post submission preview"
                    className="w-full h-auto max-h-48 object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/dashboard"
            className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={!hasChanges || isSaving}
            className="px-6 py-2.5 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/10 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Form...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>

        <AIFormGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onPrefill={handleAiPrefill}
        />
      </main>
    </div>
  );
}

export default function FormBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0c1014] text-stone-500">
          <div className="flex items-center gap-3 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span>Loading form builder...</span>
          </div>
        </div>
      }
    >
      <FormBuilderContent />
    </Suspense>
  );
}

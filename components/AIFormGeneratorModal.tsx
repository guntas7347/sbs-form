"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Wand2,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import { nanoid } from "nanoid";
import { type FormBuilderState, type FormField } from "@/app/dashboard/create/[id]/page";
import { type PostSubmissionSettings } from "@/lib/drizzle/schema";

interface AIFormGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrefill: (prefilled: Partial<FormBuilderState>) => void;
}

const STRICT_PROMPT_TEMPLATE = `Generate a form configuration for SBS FORMS in STRICT RAW JSON format.
DO NOT wrap the output in markdown codeblocks (no \`\`\`json or \`\`\`).
DO NOT include any commentary, explanations, or conversational filler. Output ONLY valid JSON.

JSON Schema Specification:
{
  "title": "string (clear, descriptive title for the form)",
  "description": "string (instructions or context for respondents)",
  "fields": [
    {
      "label": "string (question prompt or note heading)",
      "type": "text" | "textarea" | "multiple choice" | "checkboxes" | "date" | "time" | "text box" | "image",
      "required": boolean (MUST be true for all questions by default),
      "options": ["Option 1", "Option 2"] (array of strings, ONLY required when type is "multiple choice" or "checkboxes"),
      "content": "string" (ONLY used when type is "text box" for descriptive note text, or "image" for image URL)
    }
  ],
  "postSubmission": {
    "message": "string (custom thank you or follow-up instructions)",
    "links": [
      {
        "name": "string (link title)",
        "url": "string (https://... URL)"
      }
    ],
    "imageUrl": "string (optional banner image URL, or leave empty \\"\\")"
  }
}

Field Type Guidelines:
- "text": Short single-line text input (e.g. Full Name, Email, Phone number)
- "textarea": Multi-line paragraph input (e.g. Detailed feedback, Project description)
- "multiple choice": Single select radio list (provide 3-5 realistic options)
- "checkboxes": Multi-select checkboxes (provide 3-5 realistic options)
- "date": Date picker
- "time": Time picker
- "text box": Static instruction/information note shown to the respondent
- "image": Static image banner URL

User Form Requirements:
[USER_PROMPT]`;

function cleanAndExtractJson(raw: string): string {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  // Find outermost curly braces to ignore any chat greetings/trailers
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

export function AIFormGeneratorModal({
  isOpen,
  onClose,
  onPrefill,
}: AIFormGeneratorModalProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [jsonInput, setJsonInput] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [parseError, setParseError] = useState("");

  if (!isOpen) return null;

  const buildStrictPrompt = (promptText: string) => {
    const topic = promptText.trim()
      ? promptText.trim()
      : "General information collection form with contact info and feedback questions";
    return STRICT_PROMPT_TEMPLATE.replace("[USER_PROMPT]", topic);
  };

  const handleNextStep = async () => {
    const fullPrompt = buildStrictPrompt(userPrompt);
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch (e) {
      console.warn("Clipboard write failed, will proceed to step 2", e);
    }
    setStep(2);
  };

  const handleCopyAgain = async () => {
    const fullPrompt = buildStrictPrompt(userPrompt);
    await navigator.clipboard.writeText(fullPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleApplyJson = () => {
    setParseError("");

    if (!jsonInput.trim()) {
      setParseError("Please paste the JSON code output from ChatGPT or Gemini.");
      return;
    }

    try {
      const cleaned = cleanAndExtractJson(jsonInput);
      const parsed = JSON.parse(cleaned);

      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("JSON must be a valid object.");
      }

      // Validate & normalize fields
      const rawFields = Array.isArray(parsed.fields) ? parsed.fields : [];
      const normalizedFields: FormField[] = rawFields.map((f: any) => {
        const allowedTypes = [
          "text",
          "textarea",
          "multiple choice",
          "checkboxes",
          "date",
          "time",
          "text box",
          "image",
        ];

        const rawType = String(f?.type || "text").toLowerCase().trim();
        const type = allowedTypes.includes(rawType) ? rawType : "text";

        return {
          id: nanoid(8),
          label: String(f?.label || "Untitled Question").trim(),
          type,
          required: f?.required !== false, // Checked by default
          content: f?.content ? String(f.content) : undefined,
          options:
            Array.isArray(f?.options) && f.options.length > 0
              ? f.options.map((opt: any) => String(opt).trim())
              : type === "multiple choice" || type === "checkboxes"
                ? ["Option 1", "Option 2"]
                : undefined,
        };
      });

      // Normalize postSubmission settings
      const rawPost = parsed.postSubmission || {};
      const normalizedPost: PostSubmissionSettings = {
        message:
          typeof rawPost.message === "string" && rawPost.message.trim()
            ? rawPost.message.trim()
            : "Thank you! Your response has been recorded.",
        links: Array.isArray(rawPost.links)
          ? rawPost.links
              .filter((l: any) => l && typeof l === "object" && (l.url || l.name))
              .map((l: any) => ({
                name: String(l.name || "Link").trim(),
                url: String(l.url || "").trim(),
              }))
          : [],
        imageUrl:
          typeof rawPost.imageUrl === "string" ? rawPost.imageUrl.trim() : "",
      };

      // Prefill form locally in builder without saving or publishing
      onPrefill({
        title: parsed.title ? String(parsed.title).trim() : undefined,
        description: parsed.description
          ? String(parsed.description).trim()
          : undefined,
        fields: normalizedFields,
        postSubmission: normalizedPost,
      });

      // Reset state and close modal
      setStep(1);
      setUserPrompt("");
      setJsonInput("");
      onClose();
    } catch (err: any) {
      console.error("JSON parse error:", err);
      setParseError(
        err?.message
          ? `Invalid JSON: ${err.message}`
          : "Invalid JSON format. Please ensure ChatGPT/Gemini output valid JSON.",
      );
    }
  };

  const handleModalClose = () => {
    setStep(1);
    setParseError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#131920] border border-orange-100 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <span>Create Form with AI</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                  {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {step === 1
                  ? "Describe the form you want to generate."
                  : "Paste the generated JSON output from ChatGPT or Gemini."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {step === 1 ? (
            /* STEP 1: Big User Prompt Box */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                  What kind of form do you want to create?
                </label>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                  Type your prompt in detail below. Describe questions, choices,
                  or instructions you want included.
                </p>
              </div>

              {/* Big Prompt Box */}
              <textarea
                rows={6}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="e.g. Create a job application form for a Senior Frontend Engineer. Include questions for full name, email, phone number, portfolio URL, years of React experience, a multiple choice question for preferred work arrangement (Remote, Hybrid, Onsite), a checkboxes question for skills (Next.js, TypeScript, Tailwind, CSS), a paragraph for their biggest engineering achievement, and post-submission links to our career page."
                className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-orange-500 leading-relaxed resize-none"
                autoFocus
              />

              <div className="p-3 rounded-xl bg-orange-50/60 dark:bg-stone-900/60 border border-orange-200/60 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                💡 Clicking <strong>Next</strong> will automatically package your
                request into an optimized, strict schema prompt and copy it
                directly to your clipboard ready for ChatGPT or Gemini.
              </div>
            </div>
          ) : (
            /* STEP 2: Copied Alert & JSON Paste Area */
            <div className="space-y-4">
              {/* Notification Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Prompt copied to your clipboard!</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                  Please paste it into <strong>ChatGPT</strong> or{" "}
                  <strong>Gemini</strong>, copy the generated JSON code, and paste
                  it in the box below.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAgain}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPrompt ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Copied again!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy prompt again</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[10px] text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Edit form description
                  </button>
                </div>
              </div>

              {/* Paste JSON Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Paste the JSON output below:
                </label>
                <textarea
                  rows={8}
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    if (parseError) setParseError("");
                  }}
                  placeholder={`{\n  "title": "...",\n  "description": "...",\n  "fields": [\n    {\n      "label": "...",\n      "type": "text",\n      "required": true\n    }\n  ]\n}`}
                  className="w-full text-xs font-mono p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-orange-500 leading-relaxed"
                  autoFocus
                />

                {parseError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 flex items-center justify-between gap-3">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 shadow-md shadow-orange-500/15 transition-all inline-flex items-center gap-2 cursor-pointer ml-auto"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplyJson}
              disabled={!jsonInput.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/15 transition-all inline-flex items-center gap-2 cursor-pointer ml-auto"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Prefill Form</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { type Form } from "../../../lib/firebase/form-builder";
import { getCurrentUser, subscribeToAuth } from "../../../lib/firebase/auth";
import type { User } from "firebase/auth";
import {
  loadFormForSubmission,
  submitFormResponse,
} from "../../../lib/firebase/form-light";

export default function FormPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const currentUser = getCurrentUser();
  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
      if (!u) {
        navigate(`/login?redirect=/${formId}`);
      }
    });
    return unsub;
  }, [formId, navigate]);

  useEffect(() => {
    if (!formId || !user) return;

    const loadForm = async () => {
      try {
        const { form: formData, error: loadingError } =
          await loadFormForSubmission(formId, user.uid);

        if (loadingError) {
          setError(loadingError);
        } else if (formData) {
          setForm(formData);
        }
      } catch (err) {
        console.error("Error loading form:", err);
        setError("Error loading form");
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId, user]);

  const handleChange = (fieldId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (
    fieldId: string,
    option: string,
    checked: boolean,
  ) => {
    setAnswers((prev) => {
      const current = (prev[fieldId] as string[]) || [];
      if (checked) {
        return { ...prev, [fieldId]: [...current, option] };
      } else {
        return { ...prev, [fieldId]: current.filter((o) => o !== option) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !formId || !user) return;

    const confirm = window.confirm("Are you sure you want to submit?");
    if (!confirm) return;

    // Validation Check
    for (const field of form.fields) {
      if (
        field.required &&
        !["text box", "image", "html"].includes(field.type)
      ) {
        const ans = answers[field.id];
        if (!ans || (Array.isArray(ans) && ans.length === 0)) {
          alert(
            `Please fill out the required field: ${field.label || "Untitled"}`,
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      await submitFormResponse(
        formId,
        form.ownerId || "",
        user.uid,
        user.email || "Anonymous",
        answers,
      );
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to submit response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  function linkify(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  }

  const formatDate = (ts: any) => {
    if (!ts) return "N/A";

    let date: Date;

    if (ts.toMillis) {
      date = new Date(ts.toMillis());
    } else if (ts.seconds) {
      date = new Date(ts.seconds * 1000);
    } else {
      return "N/A";
    }

    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-[#f0ebf8] min-h-screen">
        <div className="flex items-center gap-3 text-primary font-bold">
          <Loader2 className="animate-spin w-6 h-6" />
          Loading form...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-[#f0ebf8] p-4">
        <div className="bg-white p-8 rounded-xl shadow border-t-[10px] border-red-500 max-w-2xl w-full text-center">
          <h2 className="text-2xl font-bold mb-2">{error}</h2>
          <p className="text-gray-600 mb-6">
            You may not have access or this form has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <>
        <div className="bg-white flex justify-center items-center max-h-20 gap-2">
          <img
            src="/sbssu-logo.png"
            alt="SBS Logo"
            className="w-10 h-10 object-contain"
          />
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            SBSSU FORM
          </h2>
        </div>
        <div className="flex items-center justify-center bg-[#f0ebf8] p-4">
          <div className="bg-white p-8 rounded-xl shadow border-t-[10px] border-green-500 max-w-2xl w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Response submitted</h2>
            <p className="text-gray-600 mb-6">
              {linkify(form?.submitMessage || "Thank you for your response!")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex items-center gap-1.5 break-all sm:pr-4">
                <span className="font-semibold text-gray-700">Form ID:</span>
                {formId || "Unknown"}
              </div>{" "}
              <div className="flex items-center gap-1.5 break-all sm:pr-4">
                <span className="font-semibold text-gray-700">User:</span>
                {currentUser?.email || "Unknown"}
              </div>{" "}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-700">
                  Submitted At:
                </span>
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!form) return null;

  return (
    <div className="bg-[#f0ebf8] min-h-screen py-8 px-4 font-sans text-gray-800">
      <div className="bg-white max-w-3xl mx-auto p-4 flex items-center justify-center gap-4 rounded-xl shadow-sm mb-6 border-b border-gray-200">
        <img
          src="/sbssu-logo.png"
          alt="SBS Logo"
          className="w-10 h-10 object-contain"
        />
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          SBSSU FORM
        </h2>
      </div>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Form Header */}
        <div className="bg-white p-8 rounded-xl shadow-sm border-t-[10px] border-blue-600">
          <h1 className="text-3xl font-normal mb-4 text-gray-900">
            {form.title || "Untitled Form"}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="flex items-center gap-1.5 break-all sm:pr-4">
              <span className="font-semibold text-gray-700">Form ID:</span>
              {formId || "Unknown"}
            </div>{" "}
            <div className="flex items-center gap-1.5 break-all sm:pr-4">
              <span className="font-semibold text-gray-700">Creator:</span>
              {form.ownerEmail || "Unknown"}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-700">Deadline:</span>
              {formatDate(form.deadline)}
            </div>
            <div className="flex items-center gap-1.5 break-all sm:pr-4">
              <span className="font-semibold text-gray-700">User:</span>
              {currentUser?.email || "Unknown"}
            </div>{" "}
          </div>

          {form.description && (
            <p className="text-gray-600 whitespace-pre-wrap">
              {form.description}
            </p>
          )}
          <hr className="my-6 border-gray-200" />
          <div className="text-sm text-gray-500 font-medium">
            <span className="text-red-500">*</span> Indicates required question
          </div>
        </div>

        {/* Dynamic Fields */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.fields.map((field) => (
            <div
              key={field.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col"
            >
              <label className="text-base font-medium mb-4">
                {field.label ||
                  (["text box", "image", "html"].includes(field.type)
                    ? ""
                    : "Untitled Question")}
                {field.required &&
                  !["text box", "image", "html"].includes(field.type) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
              </label>

              {field.type === "text" && (
                <input
                  type="text"
                  placeholder="Your answer"
                  className="w-full md:w-1/2 outline-none border-b border-gray-300 focus:border-blue-600 pb-1 text-sm transition-colors bg-transparent"
                  value={(answers[field.id] as string) || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  required={field.required}
                />
              )}

              {field.type === "number" && (
                <input
                  type="tel"
                  placeholder="Your answer"
                  pattern="[0-9]*"
                  className="w-full md:w-1/2 outline-none border-b border-gray-300 focus:border-blue-600 pb-1 text-sm transition-colors bg-transparent"
                  value={(answers[field.id] as string) || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[0-9]+$/.test(val)) {
                      handleChange(field.id, val);
                    }
                  }}
                  required={field.required}
                />
              )}

              {field.type === "text box" && field.content && (
                <div className="text-gray-700 whitespace-pre-wrap text-sm">
                  {field.content}
                </div>
              )}

              {field.type === "image" && field.content && (
                <div className="flex flex-col gap-2 my-2">
                  <img
                    src={field.content}
                    alt={field.label || "Image"}
                    className="max-w-full rounded-lg shadow-sm"
                  />
                </div>
              )}

              {field.type === "html" && field.content && (
                <div dangerouslySetInnerHTML={{ __html: field.content }} />
              )}

              {field.type === "paragraph" && (
                <textarea
                  placeholder="Your answer"
                  rows={3}
                  className="w-full outline-none border-b border-gray-300 focus:border-blue-600 pb-1 text-sm transition-colors bg-transparent resize-y"
                  value={(answers[field.id] as string) || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  required={field.required}
                />
              )}

              {field.type === "mcq" && (
                <div className="space-y-3">
                  {field.options?.map((opt, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={answers[field.id] === opt}
                        onChange={() => handleChange(field.id, opt)}
                        required={field.required && !answers[field.id]}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === "checkbox" && (
                <div className="space-y-3">
                  {field.options?.map((opt, i) => {
                    const isChecked = (
                      (answers[field.id] as string[]) || []
                    ).includes(opt);
                    return (
                      <label
                        key={i}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          value={opt}
                          checked={isChecked}
                          onChange={(e) =>
                            handleCheckboxChange(
                              field.id,
                              opt,
                              e.target.checked,
                            )
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {field.type === "dropdown" && (
                <div className="relative w-full md:w-1/2">
                  <select
                    value={(answers[field.id] as string) || ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    required={field.required}
                    className="w-full appearance-none outline-none border border-gray-300 bg-white rounded-md px-4 py-3 text-sm focus:border-blue-600 transition-colors"
                  >
                    <option value="" disabled>
                      Choose
                    </option>
                    {field.options?.map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => setAnswers({})}
              className="text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
            >
              Clear form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

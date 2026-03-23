import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  createFormWithId,
  updateFormById,
  type Form,
  type FormField,
  type FieldType,
} from "../../../lib/firebase/form-builder";
import {
  subscribeToAuth,
  getCurrentUser,
  getFormById,
} from "../../../lib/firebase/forms";
import Header from "../../components/Header";
import { MoveUp, MoveDown } from "lucide-react";
import { Timestamp } from "firebase/firestore";

const FieldOptions = ({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) => {
  return (
    <div className="mt-3 space-y-2 ml-4">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-gray-400 text-lg">•</span>
          <input
            type="text"
            className="border-b focus:border-blue-500 focus:outline-none p-1 text-sm flex-1 bg-transparent"
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
              onClick={() => {
                const newOpts = options.filter((_, idx) => idx !== i);
                onChange(newOpts);
              }}
              className="text-gray-400 hover:text-red-500 p-1"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-gray-400 text-lg">•</span>
        <button
          onClick={() => onChange([...options, `Option ${options.length + 1}`])}
          className="text-sm text-blue-600 hover:underline"
        >
          Add option
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
  updateField: (f: FormField) => void;
  removeField: () => void;
  moveUp: () => void;
  moveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  return (
    <div className="border border-gray-200 p-6 mb-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={field.label}
          onChange={(e) => updateField({ ...field, label: e.target.value })}
          placeholder={
            ["text box", "html"].includes(field.type)
              ? "Title (Optional)"
              : field.type === "image"
                ? "Image Alt Text / Title"
                : "Question"
          }
          className="font-medium text-base bg-gray-50 border-b border-gray-300 focus:border-blue-600 focus:bg-gray-100 p-3 flex-1 rounded-t transition-colors"
        />
        <select
          value={field.type}
          onChange={(e) =>
            updateField({
              ...field,
              type: e.target.value as FieldType,
              options: [
                "text",
                "paragraph",
                "number",
                "text box",
                "image",
                "html",
              ].includes(e.target.value)
                ? []
                : field.options?.length
                  ? field.options
                  : ["Option 1"],
            })
          }
          className="border border-gray-300 rounded p-3 bg-white text-sm min-w-[150px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
        >
          <option value="text">Short answer</option>
          <option value="paragraph">Paragraph</option>
          <option value="mcq">Multiple choice</option>
          <option value="checkbox">Checkboxes</option>
          <option value="dropdown">Dropdown</option>
          <option value="number">Number</option>
          <option value="text box">Text Box (Read Only)</option>
          <option value="image">Image (Read Only)</option>
          <option value="html">HTML (Read Only)</option>
        </select>
      </div>

      <div className="mb-6">
        {field.type === "text" && (
          <input
            disabled
            type="text"
            placeholder="Short answer text"
            className="border-b border-gray-300 border-dotted w-1/2 p-2 bg-transparent text-gray-400 text-sm"
          />
        )}
        {field.type === "number" && (
          <input
            disabled
            type="number"
            placeholder="Number answer"
            className="border-b border-gray-300 border-dotted w-1/2 p-2 bg-transparent text-gray-400 text-sm"
          />
        )}
        {field.type === "paragraph" && (
          <textarea
            disabled
            placeholder="Long answer text"
            className="border-b border-gray-300 border-dotted w-3/4 p-2 bg-transparent text-gray-400 text-sm resize-none"
            rows={2}
          />
        )}
        {["mcq", "checkbox", "dropdown"].includes(field.type) && (
          <FieldOptions
            options={field.options || []}
            onChange={(options) => updateField({ ...field, options })}
          />
        )}
        {field.type === "text box" && (
          <textarea
            value={field.content || ""}
            onChange={(e) => updateField({ ...field, content: e.target.value })}
            placeholder="Enter read-only text to display..."
            className="border border-gray-300 rounded w-full p-2 text-sm bg-transparent"
            rows={3}
          />
        )}
        {field.type === "html" && (
          <textarea
            value={field.content || ""}
            onChange={(e) => updateField({ ...field, content: e.target.value })}
            placeholder="Enter HTML (with Tailwind classes)..."
            className="border border-gray-300 rounded w-full p-2 text-sm bg-transparent font-mono"
            rows={3}
          />
        )}
        {field.type === "image" && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={field.content || ""}
              onChange={(e) =>
                updateField({ ...field, content: e.target.value })
              }
              placeholder="Image URL"
              className="border-b border-gray-300 focus:border-blue-600 focus:outline-none p-2 w-full text-sm bg-transparent"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-sm">
        <div className="flex justify-start gap-2">
          {!isFirst && (
            <button
              onClick={moveUp}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
              title="Move up"
            >
              <MoveUp className="w-5 h-5" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={moveDown}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
              title="Move down"
            >
              <MoveDown className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex justify-end gap-6 items-center">
          {!["text box", "image", "html"].includes(field.type) && (
            <>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateField({ ...field, required: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span className="font-medium text-gray-700">Required</span>
              </label>
              <div className="w-[1px] h-6 bg-gray-200"></div>
            </>
          )}
          <button
            onClick={removeField}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
            title="Delete Question"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FormBuilderPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(getCurrentUser());
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
      if (!u) setLoading(false);
    });

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      navigate("/dashboard");
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      unsub();
    };
  }, [navigate]);

  useEffect(() => {
    if (!formId || !user) return;

    const loadForm = async () => {
      try {
        const existingForm = await getFormById(formId);
        console.log(existingForm);
        if (existingForm) {
          setForm(existingForm);
        } else {
          const newForm = await createFormWithId(
            formId,
            user.uid,
            user.email || "",
          );
          setForm(newForm);
        }
      } catch (err) {
        console.error("Error loading form:", err);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId, user]);

  const updateFormLocally = (updatedForm: Form) => {
    setForm(updatedForm);
    setHasChanges(true);
  };

  const toDatetimeLocal = (ts: Timestamp) => {
    const date = ts.toDate();

    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleSave = async () => {
    if (!formId || !form) return;
    setIsSaving(true);
    try {
      await updateFormById(formId, {
        title: form.title,
        description: form.description,
        fields: form.fields,
        isPublic: form.isPublic,
        submitMessage: form.submitMessage || "",
        allowMultipleResponses: form.allowMultipleResponses || false,
        deadline: form.deadline || "",
      });
      setHasChanges(false);
    } catch (err) {
      console.error("Error saving form:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!formId || !form) return;
    if (
      !window.confirm(
        "Are you sure you want to publish this form? Once published, anyone with the link can view and submit responses.",
      )
    ) {
      return;
    }
    setIsPublishing(true);
    try {
      await updateFormById(formId, { isPublic: true });
      setForm({ ...form, isPublic: true });
    } catch (err) {
      console.error("Error publishing form:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="  bg-gray-50 flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="  bg-gray-50 flex items-center justify-center text-gray-500">
        Please log in to use the form builder.
      </div>
    );
  }

  if (!form) {
    return (
      <div className="  bg-gray-50 flex items-center justify-center text-red-500">
        Error loading form.
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    updateFormLocally({ ...form, title: e.target.value });

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    updateFormLocally({ ...form, description: e.target.value });

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: "text",
      label: "",
      required: false,
    };
    updateFormLocally({ ...form, fields: [...form.fields, newField] });
  };

  const updateField = (id: string, updated: FormField) => {
    const fields = form.fields.map((f) => (f.id === id ? updated : f));
    updateFormLocally({ ...form, fields });
  };

  const removeField = (id: string) => {
    const fields = form.fields.filter((f) => f.id !== id);
    updateFormLocally({ ...form, fields });
  };

  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...form.fields];
    const temp = newFields[index - 1];
    newFields[index - 1] = newFields[index];
    newFields[index] = temp;
    updateFormLocally({ ...form, fields: newFields });
  };

  const moveFieldDown = (index: number) => {
    if (index === form.fields.length - 1) return;
    const newFields = [...form.fields];
    const temp = newFields[index + 1];
    newFields[index + 1] = newFields[index];
    newFields[index] = temp;
    updateFormLocally({ ...form, fields: newFields });
  };

  return (
    <div className="bg-[#f0ebf8] py-8 px-4 font-sans text-gray-800">
      <Header setLoading={setLoading} />

      <div className="max-w-3xl pt-20 mx-auto space-y-4">
        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm mb-6 gap-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold hidden md:block text-gray-700 text-lg">
              Form Builder
            </span>
            {hasChanges && (
              <span className="text-sm text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {form.isPublic && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/${formId}`,
                  );
                  alert("Public link copied to clipboard!");
                }}
                className="px-5 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 font-bold rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center gap-2"
                title="Copy public link"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Copy Link
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-5 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handlePublish}
              disabled={hasChanges || isPublishing || form.isPublic}
              className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {form.isPublic
                ? "Published"
                : isPublishing
                  ? "Publishing..."
                  : "Publish"}
            </button>
          </div>
        </div>

        {/* Form Settings Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-[10px] border-blue-600 mb-6 gap-6 grid grid-cols-1 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Deadline Date
            </label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(form.deadline)}
              onChange={(e) =>
                updateFormLocally({
                  ...form,
                  deadline: Timestamp.fromDate(new Date(e.target.value)),
                })
              }
            />
          </div>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={!!form.allowMultipleResponses}
                onChange={(e) =>
                  updateFormLocally({
                    ...form,
                    allowMultipleResponses: e.target.checked,
                  })
                }
              />
              <span className="text-sm font-semibold text-gray-700">
                Allow multiple responses
              </span>
            </label>
          </div>{" "}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Success Message
            </label>
            <textarea
              className="w-full text-sm resize-none outline-none border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
              placeholder="e.g. Response recorded."
              rows={2}
              value={form.submitMessage || ""}
              onChange={(e) =>
                updateFormLocally({ ...form, submitMessage: e.target.value })
              }
            />
          </div>
        </div>

        {/* Form Title & Desc Header */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <input
            type="text"
            value={form.title}
            onChange={handleTitleChange}
            placeholder="Form title"
            className="text-4xl font-normal w-full border-b border-gray-200 pb-2 mb-4 focus:outline-none focus:border-blue-600 transition-colors bg-transparent"
          />
          <textarea
            value={form.description}
            onChange={handleDescChange}
            placeholder="Form description"
            className="w-full text-sm resize-none focus:outline-none border-b border-transparent focus:border-gray-300 pb-1 bg-transparent text-gray-600"
            rows={2}
          />
        </div>

        {/* Fields */}
        {form.fields.map((field, index) => (
          <FieldItem
            key={field.id}
            field={field}
            updateField={(f) => updateField(field.id, f)}
            removeField={() => removeField(field.id)}
            moveUp={() => moveFieldUp(index)}
            moveDown={() => moveFieldDown(index)}
            isFirst={index === 0}
            isLast={index === form.fields.length - 1}
          />
        ))}

        {/* Add Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={addField}
            className="bg-white border text-gray-600 font-medium rounded-full shadow-sm px-6 py-3 hover:bg-gray-50 hover:shadow flex items-center gap-2 transition-all active:scale-95"
          >
            <span className="text-xl font-light leading-none">+</span> Add
            Question
          </button>
        </div>
      </div>
    </div>
  );
}

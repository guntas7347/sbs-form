"use client";

import { useRef, useState } from "react";
import { uploadFile } from "@/lib/uploader";
import { Upload, File, X, Loader2, CheckCircle2, FileText } from "lucide-react";

interface FileUploaderProps {
  value?: string | null;
  onChange: (path: string | null) => void;
  accept?: string;
  maxSize?: number; // MB
  disabled?: boolean;
}

export default function FileUploader({
  value,
  onChange,
  accept,
  maxSize = 10,
  disabled = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = (file?: File) => {
    if (!file) return;

    setError("");

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File must be smaller than ${maxSize} MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const result = await uploadFile(formData);

      if (!result.success || !result.path) {
        setError(result.error || "Upload failed.");
        return;
      }

      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";

      onChange(result.path);
    } catch {
      setError("Something went wrong while uploading.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    setSelectedFile(null);
    setError("");

    if (inputRef.current) inputRef.current.value = "";

    onChange(null);
  };

  const formatSize = (size: number) => {
    return size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full space-y-3">
      {!selectedFile && !value && (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-orange-500 dark:hover:border-orange-500 bg-stone-50/50 dark:bg-stone-900/50 transition-colors disabled:opacity-50"
        >
          <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-950/40">
            <Upload className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              Click to select a file
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Maximum file size: {maxSize} MB
            </p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled || uploading}
        className="hidden"
        onChange={(e) => handleSelect(e.target.files?.[0])}
      />

      {selectedFile && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900">
          <File className="w-5 h-5 text-orange-500 shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-stone-500">
              {formatSize(selectedFile.size)}
            </p>
          </div>

          <button
            type="button"
            disabled={uploading || disabled}
            onClick={() => {
              setSelectedFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="p-2 text-stone-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {value && !selectedFile && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
              File uploaded
            </p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-600 hover:underline truncate block"
            >
              View uploaded file
            </a>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={handleDelete}
            className="p-2 text-stone-400 hover:text-red-500"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedFile && (
        <button
          type="button"
          disabled={uploading || disabled}
          onClick={handleUpload}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload File
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

interface ImageFieldProps {
  field: {
    id: string;
    label?: string;
    content?: string;
  };
}

export default function ImageField({ field }: ImageFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
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
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="relative block w-full text-left cursor-zoom-in group"
            aria-label="Tap to preview image"
          >
            <img
              src={field.content}
              alt={field.label || "Banner"}
              className="rounded-xl w-full max-h-72 object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />

            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-sm px-2.5 py-1.5 text-[10px] font-medium text-white opacity-80 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-3.5 h-3.5" />
              Tap to preview
            </span>
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>

          <img
            src={field.content}
            alt={field.label || "Image preview"}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState } from "react";
import { Check, Code2, Copy, X } from "lucide-react";
import type { AttachmentItem, QuestionConfig } from "@/lib/decisions/types";
import {
  generateCurlSnippet,
  generatePythonSnippet,
  generateTypeScriptSnippet,
} from "@/lib/decisions/code-generator";

type CodeExportModalProps = {
  open: boolean;
  onClose: () => void;
  inputText: string;
  questions: QuestionConfig[];
  attachments: AttachmentItem[];
};

export function CodeExportModal({
  open,
  onClose,
  inputText,
  questions,
  attachments,
}: CodeExportModalProps) {
  const [lang, setLang] = useState<"typescript" | "python" | "curl">("typescript");
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const code =
    lang === "typescript"
      ? generateTypeScriptSnippet(inputText, questions, attachments)
      : lang === "python"
        ? generatePythonSnippet(inputText, questions, attachments)
        : generateCurlSnippet(inputText, questions, attachments);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-t-2xl border border-slate-800 bg-slate-900 shadow-2xl sm:max-h-[85vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <Code2 className="h-4 w-4 shrink-0 text-sky-400" />
            <h3 className="truncate text-sm font-semibold text-slate-100">
              Export Decisions API Request (<code className="text-sky-300">v1beta</code>)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/50 px-4 py-2.5 sm:px-5">
          <div className="flex gap-1.5">
            {(["typescript", "python", "curl"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLang(tab)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                  lang === tab
                    ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {tab === "curl" ? "REST (cURL)" : tab}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">
            {code}
          </pre>
        </div>
      </div>
    </div>
  );
}

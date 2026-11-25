"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, X } from "lucide-react";

type ApiKeyModalProps = {
  open: boolean;
  onClose: () => void;
  hasServerKey: boolean;
  sessionKey: string;
  forceSimulate: boolean;
  onSave: (nextKey: string, nextSimulate: boolean) => void;
};

export function ApiKeyModal({
  open,
  onClose,
  hasServerKey,
  sessionKey,
  forceSimulate,
  onSave,
}: ApiKeyModalProps) {
  const [draftKey, setDraftKey] = useState(sessionKey);
  const [draftSim, setDraftSim] = useState(forceSimulate);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-900 shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Gemini Decisions API Connection
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2 font-medium text-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Server Environment Status
            </div>
            <p className="mt-1 text-slate-400">
              {hasServerKey
                ? "GEMINI_API_KEY is configured on the Next.js server (.env.local)."
                : "GEMINI_API_KEY is not set in .env.local. You can add it to .env.local and restart the server, or enter a session key below."}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block font-medium text-slate-200">
              Session API Key Override (Optional, stored in browser localStorage)
            </label>
            <input
              type="password"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="AIza..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Forwarded server-side via <code>/api/decisions</code> to{" "}
              <code>gemini-decision-1</code> (<code>v1beta</code>).
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div>
              <div className="font-medium text-slate-200">Force Simulator Mode</div>
              <div className="text-[11px] text-slate-400">
                Test rules and thresholds offline with zero API calls
              </div>
            </div>
            <input
              type="checkbox"
              checked={draftSim}
              onChange={(e) => setDraftSim(e.target.checked)}
              className="h-4 w-4 accent-sky-500"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draftKey.trim(), draftSim);
              onClose();
            }}
            className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

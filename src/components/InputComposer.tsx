"use client";

import React, { useRef, useState } from "react";
import {
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  Music,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import type {
  AttachmentItem,
  DecisionMediaKind,
  InputSamplePreset,
  MediaResolution,
} from "@/lib/decisions/types";

type InputComposerProps = {
  inputText: string;
  onChangeText: (val: string) => void;
  attachments: AttachmentItem[];
  onAddAttachment: (att: AttachmentItem) => void;
  onRemoveAttachment: (id: string) => void;
  onUpdateResolution: (id: string, resolution: MediaResolution) => void;
  samples: InputSamplePreset[];
  activeSampleId: string | null;
  onSelectSample: (sample: InputSamplePreset) => void;
};

function inferMediaKind(mime: string): DecisionMediaKind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "document";
  return null;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function InputComposer({
  inputText,
  onChangeText,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  onUpdateResolution,
  samples,
  activeSampleId,
  onSelectSample,
}: InputComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [urlKind, setUrlKind] = useState<DecisionMediaKind>("image");
  const [urlMime, setUrlMime] = useState("image/jpeg");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(inputText);
      onChangeText(JSON.stringify(parsed, null, 2));
      setUploadError(null);
    } catch {
      setUploadError("Current text is not valid JSON (plain text is still valid for the API).");
    }
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    Array.from(files).forEach((file) => {
      const kind = inferMediaKind(file.type);
      if (!kind) {
        setUploadError(
          `Unsupported MIME type "${file.type || file.name}". Use PNG/JPEG/WEBP, PDF, audio, or MP4/WEBM video.`,
        );
        return;
      }

      const maxBytes = kind === "document" ? 50 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxBytes) {
        setUploadError(`File "${file.name}" exceeds inline upload limit (${formatBytes(maxBytes)}).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? "");
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        onAddAttachment({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          kind,
          mimeType: file.type,
          sizeBytes: file.size,
          dataBase64: base64,
          previewUrl: kind === "image" || kind === "audio" || kind === "video" ? result : undefined,
          resolution: kind === "image" || kind === "video" ? "medium" : undefined,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlValue.trim();
    if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
      setUploadError("Provide a valid public or signed HTTPS URL (gs:// and YouTube URLs are not supported).");
      return;
    }
    setUploadError(null);
    onAddAttachment({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed.split("/").pop() || trimmed,
      kind: urlKind,
      mimeType: urlMime,
      uri: trimmed,
      resolution: urlKind === "image" || urlKind === "video" ? "low" : undefined,
    });
    setUrlValue("");
    setShowUrlForm(false);
  };

  const approxTokens = Math.max(1, Math.ceil(inputText.length / 4));

  return (
    <section className="flex flex-col rounded-xl border border-slate-800/90 bg-slate-900/65 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-100">1. Shared Multimodal Input</h2>
          <p className="truncate text-xs text-slate-400">
            Sent once across all questions (~{approxTokens} text tokens)
          </p>
        </div>
        <button
          type="button"
          onClick={handleFormatJson}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
        >
          <Wand2 className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden xs:inline sm:inline">Format JSON</span>
          <span className="xs:hidden sm:hidden">JSON</span>
        </button>
      </div>

      {samples.length > 0 && (
        <div className="border-b border-slate-800/80 bg-slate-950/40 px-3 py-2.5 sm:px-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Quick Input Samples
          </div>
          <div className="flex flex-wrap gap-1.5">
            {samples.map((sample) => {
              const active = activeSampleId === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => onSelectSample(sample)}
                  title={sample.description}
                  className={`rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition ${
                    active
                      ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/50"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {sample.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <textarea
          value={inputText}
          onChange={(e) => onChangeText(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder="Enter plain text, serialized JSON payload, courier notes, or prompt text..."
          className="min-h-[160px] w-full resize-y rounded-lg border border-slate-800 bg-slate-950/80 p-3 font-mono text-xs leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/40 sm:min-h-[200px]"
        />

        {/* Multimodal Upload Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            processFiles(e.dataTransfer.files);
          }}
          className={`rounded-lg border border-dashed p-3 transition ${
            isDragging
              ? "border-sky-400 bg-sky-500/10"
              : "border-slate-700/80 bg-slate-950/40 hover:border-slate-600"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Upload className="h-4 w-4 text-slate-400" />
              <span>Drop Image, PDF, Audio, or Video</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Browse File
              </button>
              <button
                type="button"
                onClick={() => setShowUrlForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
              >
                <Link2 className="h-3 w-3" />
                HTTPS URL
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,audio/*,video/*"
            className="hidden"
            onChange={(e) => {
              processFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {showUrlForm && (
            <form onSubmit={handleAddUrl} className="mt-3 grid gap-2 border-t border-slate-800 pt-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select
                  value={urlKind}
                  onChange={(e) => {
                    const k = e.target.value as DecisionMediaKind;
                    setUrlKind(k);
                    if (k === "image") setUrlMime("image/jpeg");
                    if (k === "audio") setUrlMime("audio/wav");
                    if (k === "video") setUrlMime("video/mp4");
                    if (k === "document") setUrlMime("application/pdf");
                  }}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                >
                  <option value="image">Image</option>
                  <option value="document">PDF Document</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
                <input
                  type="text"
                  value={urlMime}
                  onChange={(e) => setUrlMime(e.target.value)}
                  placeholder="MIME type (e.g. image/png)"
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://storage.googleapis.com/..."
                  className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
                >
                  Attach
                </button>
              </div>
            </form>
          )}
        </div>

        {uploadError && (
          <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {uploadError}
          </p>
        )}

        {/* Attached Media Blocks */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {att.kind === "image" && <ImageIcon className="h-4 w-4 shrink-0 text-sky-400" />}
                    {att.kind === "document" && (
                      <FileText className="h-4 w-4 shrink-0 text-amber-400" />
                    )}
                    {att.kind === "audio" && <Music className="h-4 w-4 shrink-0 text-emerald-400" />}
                    {att.kind === "video" && <Film className="h-4 w-4 shrink-0 text-violet-400" />}
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-slate-200">{att.name}</div>
                      <div className="truncate text-[11px] text-slate-500">
                        {att.mimeType}
                        {att.sizeBytes ? ` • ${formatBytes(att.sizeBytes)}` : ""}
                        {att.uri ? " • HTTPS URI" : " • Inline Base64"}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {(att.kind === "image" || att.kind === "video") && (
                      <select
                        value={att.resolution ?? "medium"}
                        onChange={(e) =>
                          onUpdateResolution(att.id, e.target.value as MediaResolution)
                        }
                        title="Media resolution"
                        className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[11px] text-slate-300"
                      >
                        <option value="low">res: low</option>
                        <option value="medium">res: medium</option>
                        <option value="high">res: high</option>
                        {att.kind === "image" && <option value="ultra_high">res: ultra_high</option>}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(att.id)}
                      className="rounded p-1 text-slate-500 transition hover:bg-slate-800 hover:text-rose-400"
                      title="Remove attachment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {att.kind === "image" && att.previewUrl && (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="max-h-40 w-full rounded-md border border-slate-800 object-contain bg-slate-900"
                  />
                )}
                {att.kind === "audio" && (att.previewUrl || att.uri) && (
                  <audio controls src={att.previewUrl ?? att.uri} className="h-8 w-full" />
                )}
                {att.kind === "video" && (att.previewUrl || att.uri) && (
                  <video
                    controls
                    src={att.previewUrl ?? att.uri}
                    className="max-h-40 w-full rounded-md border border-slate-800 bg-black"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

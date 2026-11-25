"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Code2,
  KeyRound,
  Layers,
  Loader2,
  Play,
  Sparkles,
} from "lucide-react";
import { DECISION_TEMPLATES } from "@/lib/decisions/templates";
import { validateDecisionRequest } from "@/lib/decisions/validation";
import { evaluateRoutingRules } from "@/lib/decisions/rule-engine";
import { generateSamplePngBase64 } from "@/lib/decisions/sample-media";
import type {
  AttachmentItem,
  DecisionEvaluateResponse,
  DecisionInputBlock,
  DecisionTemplate,
  InputSamplePreset,
  MediaResolution,
  QuestionConfig,
  RoutingRule,
  RunHistoryEntry,
} from "@/lib/decisions/types";
import { InputComposer } from "@/components/InputComposer";
import { QuestionBuilder } from "@/components/QuestionBuilder";
import { RuleBuilder } from "@/components/RuleBuilder";
import { ResultsPanel } from "@/components/ResultsPanel";
import { CodeExportModal } from "@/components/CodeExportModal";
import { ApiKeyModal } from "@/components/ApiKeyModal";

const STORAGE_KEY_API = "gemini_decisions_session_key";

type MobileSection = "all" | "input" | "questions" | "rules" | "results";

export default function DecisionsStudioPage() {
  const initialTemplate = DECISION_TEMPLATES[0];

  const [mobileSection, setMobileSection] = useState<MobileSection>("all");

  const [activeTemplateId, setActiveTemplateId] = useState<string>(initialTemplate.id);
  const [inputText, setInputText] = useState<string>(initialTemplate.samples[0].text);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(
    initialTemplate.samples[0].id,
  );
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [questions, setQuestions] = useState<QuestionConfig[]>(initialTemplate.questions);
  const [rules, setRules] = useState<RoutingRule[]>(initialTemplate.rules);
  const [fallbackAction, setFallbackAction] = useState<string>(initialTemplate.fallbackAction);

  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [sessionKey, setSessionKey] = useState<string>("");
  const [forceSimulate, setForceSimulate] = useState<boolean>(false);

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DecisionEvaluateResponse | null>(null);
  const [history, setHistory] = useState<RunHistoryEntry[]>([]);

  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  useEffect(() => {
    const savedKey = window.localStorage.getItem(STORAGE_KEY_API) ?? "";
    if (savedKey) setSessionKey(savedKey);

    fetch("/api/decisions")
      .then((res) => res.json())
      .then((data: { hasServerApiKey?: boolean }) => {
        setHasServerKey(Boolean(data.hasServerApiKey));
      })
      .catch(() => {
        setHasServerKey(false);
      });
  }, []);

  const activeTemplate = useMemo(
    () => DECISION_TEMPLATES.find((t) => t.id === activeTemplateId) ?? DECISION_TEMPLATES[0],
    [activeTemplateId],
  );

  const inputBlocks = useMemo<DecisionInputBlock[]>(() => {
    const blocks: DecisionInputBlock[] = [];
    if (inputText.trim()) {
      blocks.push({ type: "text", text: inputText });
    }
    for (const att of attachments) {
      blocks.push({
        type: att.kind,
        ...(att.uri ? { uri: att.uri } : { data: att.dataBase64 }),
        mime_type: att.mimeType,
        ...(att.resolution && (att.kind === "image" || att.kind === "video")
          ? { resolution: att.resolution }
          : {}),
      });
    }
    return blocks;
  }, [inputText, attachments]);

  const validation = useMemo(
    () => validateDecisionRequest(inputBlocks, questions),
    [inputBlocks, questions],
  );

  const liveRouting = useMemo(() => {
    if (!result) return null;
    return evaluateRoutingRules(rules, result.answers, fallbackAction);
  }, [result, rules, fallbackAction]);

  const applySample = (sample: InputSamplePreset) => {
    setInputText(sample.text);
    setActiveSampleId(sample.id);
    if (sample.sampleImageKind) {
      const generated = generateSamplePngBase64(sample.sampleImageKind);
      if (generated.base64) {
        setAttachments([
          {
            id: `sample-${sample.id}`,
            name: generated.filename,
            kind: "image",
            mimeType: "image/png",
            dataBase64: generated.base64,
            previewUrl: generated.previewUrl,
            resolution: "medium",
          },
        ]);
      }
    } else {
      setAttachments([]);
    }
  };

  const selectTemplate = (tpl: DecisionTemplate) => {
    setActiveTemplateId(tpl.id);
    setQuestions(structuredClone(tpl.questions));
    setRules(structuredClone(tpl.rules));
    setFallbackAction(tpl.fallbackAction);
    setResult(null);
    setErrorMessage(null);
    if (tpl.samples[0]) {
      applySample(tpl.samples[0]);
    } else {
      setInputText("");
      setActiveSampleId(null);
      setAttachments([]);
    }
  };

  const handleEvaluate = async () => {
    if (!validation.valid) {
      setErrorMessage(validation.errors[0]);
      return;
    }

    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionKey ? { "x-gemini-api-key": sessionKey } : {}),
        },
        body: JSON.stringify({
          inputBlocks,
          questions,
          forceSimulate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || `Request failed with status ${res.status}`);
        setIsEvaluating(false);
        return;
      }

      const typedResult = data as DecisionEvaluateResponse;
      setResult(typedResult);
      if (mobileSection !== "all") {
        setMobileSection("results");
      }

      const evaluatedRouting = evaluateRoutingRules(rules, typedResult.answers, fallbackAction);
      const preview =
        inputText.trim().slice(0, 72) ||
        attachments.map((a) => `[${a.kind}: ${a.name}]`).join(", ");

      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          templateName: activeTemplate.name,
          inputPreview: preview,
          result: typedResult,
          routing: evaluatedRouting,
        },
        ...prev.slice(0, 14),
      ]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Network error calling /api/decisions.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const isLiveReady = (hasServerKey || Boolean(sessionKey)) && !forceSimulate;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      {/* Top Studio Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#070b14]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1720px] flex-col gap-2.5 px-3 py-2.5 sm:px-6 sm:py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 sm:h-9 sm:w-9">
                <Sparkles className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
                    Gemini Decisions Studio
                  </h1>
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-sky-300 sm:px-2 sm:text-[11px]">
                    gemini-decision-1
                  </span>
                  <span className="hidden rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 md:inline">
                    v1beta • 0 output tokens
                  </span>
                </div>
                <p className="hidden truncate text-xs text-slate-400 sm:block">
                  Calibrated binary, choice &amp; rubric decisions with deterministic policy routing
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition sm:flex-initial sm:px-3 ${
                isLiveReady
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {isLiveReady ? "Live API Connected" : "Simulator Mode"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800 sm:flex-initial sm:px-3"
            >
              <Code2 className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              <span>Export Code</span>
            </button>

            <button
              type="button"
              disabled={isEvaluating || !validation.valid}
              onClick={handleEvaluate}
              className="hidden items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex"
            >
              {isEvaluating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              {isEvaluating ? "Evaluating..." : "Evaluate Decisions"}
            </button>
          </div>
        </div>

        {/* Template Selector Strip */}
        <div className="border-t border-slate-800/70 bg-slate-950/60">
          <div className="mx-auto flex max-w-[1720px] snap-x items-center gap-1.5 overflow-x-auto px-3 py-2 sm:gap-2 sm:px-6">
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Layers className="h-3.5 w-3.5" /> Workflows:
            </span>
            {DECISION_TEMPLATES.map((tpl) => {
              const active = tpl.id === activeTemplateId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => selectTemplate(tpl)}
                  className={`inline-flex shrink-0 snap-start items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:gap-2 sm:px-3 ${
                    active
                      ? "bg-slate-800 text-white ring-1 ring-sky-500/50"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <span>{tpl.name}</span>
                  <span className="hidden rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">
                    {tpl.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Section Switcher (< md) */}
        <div className="border-t border-slate-800/70 bg-slate-900/70 md:hidden">
          <div className="flex items-center gap-1 overflow-x-auto px-3 py-1.5">
            {(
              [
                { id: "all", label: "All" },
                { id: "input", label: "1. Input" },
                { id: "questions", label: `2. Questions (${questions.length})` },
                { id: "rules", label: `3. Rules (${rules.length})` },
                { id: "results", label: result ? "4. Results ●" : "4. Results" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileSection(tab.id)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  mobileSection === tab.id
                    ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Responsive Workbench: 1-col Mobile -> 2-col Tablet (7/5) -> 3-col Desktop/Ultrawide (4/4/4) */}
      <main className="mx-auto max-w-[1720px] px-3 py-4 pb-24 sm:px-6 sm:py-5 md:pb-8">
        {(errorMessage || validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="mb-4 space-y-2">
            {(errorMessage || validation.errors[0]) && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage || validation.errors[0]}</span>
              </div>
            )}
            {validation.warnings.map((warn, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-12 md:items-start">
          {/* Left + Center Wrapper on Tablet, Split into 4 + 4 on XL Desktop */}
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 md:col-span-7 xl:col-span-8 xl:grid-cols-12">
            {/* Multimodal Input */}
            <div
              className={`min-w-0 space-y-5 xl:col-span-6 ${
                mobileSection === "all" || mobileSection === "input" ? "block" : "hidden md:block"
              }`}
            >
              <InputComposer
                inputText={inputText}
                onChangeText={(val) => {
                  setInputText(val);
                  setActiveSampleId(null);
                }}
                attachments={attachments}
                onAddAttachment={(att) => setAttachments((prev) => [...prev, att])}
                onRemoveAttachment={(id) =>
                  setAttachments((prev) => prev.filter((item) => item.id !== id))
                }
                onUpdateResolution={(id: string, resolution: MediaResolution) =>
                  setAttachments((prev) =>
                    prev.map((item) => (item.id === id ? { ...item, resolution } : item)),
                  )
                }
                samples={activeTemplate.samples}
                activeSampleId={activeSampleId}
                onSelectSample={applySample}
              />
            </div>

            {/* Question Bank + Deterministic Routing Rules */}
            <div className="min-w-0 space-y-4 sm:space-y-5 xl:col-span-6">
              <div
                className={
                  mobileSection === "all" || mobileSection === "questions"
                    ? "block"
                    : "hidden md:block"
                }
              >
                <QuestionBuilder questions={questions} onChange={setQuestions} />
              </div>
              <div
                className={
                  mobileSection === "all" || mobileSection === "rules"
                    ? "block"
                    : "hidden md:block"
                }
              >
                <RuleBuilder
                  rules={rules}
                  fallbackAction={fallbackAction}
                  questions={questions}
                  evaluation={liveRouting}
                  onChangeRules={setRules}
                  onChangeFallback={setFallbackAction}
                />
              </div>
            </div>
          </div>

          {/* Right: Calibrated Probabilities & Telemetry (Sticky on Tablet & Desktop) */}
          <div
            className={`min-w-0 md:sticky md:top-32 md:col-span-5 md:max-h-[calc(100vh-9rem)] md:overflow-y-auto md:pr-1 xl:col-span-4 ${
              mobileSection === "all" || mobileSection === "results" ? "block" : "hidden md:block"
            }`}
          >
            <ResultsPanel
              result={result}
              routing={liveRouting}
              questions={questions}
              history={history}
              onSelectHistory={(entry) => {
                setResult(entry.result);
              }}
            />
          </div>
        </div>
      </main>

      {/* Sticky Mobile Action Bar (< md) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-[#070b14]/95 px-3 py-2.5 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isEvaluating || !validation.valid}
            onClick={handleEvaluate}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEvaluating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            {isEvaluating ? "Evaluating..." : "Evaluate Decisions"}
          </button>
          {liveRouting && (
            <button
              type="button"
              onClick={() => setMobileSection("results")}
              className="max-w-[44%] truncate rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2.5 font-mono text-[11px] font-semibold text-emerald-300"
            >
              {liveRouting.finalAction}
            </button>
          )}
        </div>
      </div>

      <CodeExportModal
        open={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        inputText={inputText}
        questions={questions}
        attachments={attachments}
      />

      <ApiKeyModal
        open={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        hasServerKey={hasServerKey}
        sessionKey={sessionKey}
        forceSimulate={forceSimulate}
        onSave={(nextKey, nextSim) => {
          setSessionKey(nextKey);
          setForceSimulate(nextSim);
          if (nextKey) {
            window.localStorage.setItem(STORAGE_KEY_API, nextKey);
          } else {
            window.localStorage.removeItem(STORAGE_KEY_API);
          }
        }}
      />
    </div>
  );
}

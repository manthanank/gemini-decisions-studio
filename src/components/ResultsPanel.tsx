"use client";

import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Cpu,
  History,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import type {
  DecisionAnswerResult,
  DecisionEvaluateResponse,
  QuestionConfig,
  RuleEvaluationResult,
  RunHistoryEntry,
} from "@/lib/decisions/types";

type ResultsPanelProps = {
  result: DecisionEvaluateResponse | null;
  routing: RuleEvaluationResult | null;
  questions: QuestionConfig[];
  history: RunHistoryEntry[];
  onSelectHistory: (entry: RunHistoryEntry) => void;
};

function confidenceBadgeClass(conf: number): string {
  if (conf >= 0.85) return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
  if (conf >= 0.65) return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
  return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30";
}

function AnswerCard({
  questionId,
  answer,
}: {
  questionId: string;
  answer: DecisionAnswerResult;
}) {
  const confPct = Math.round(answer.confidence * 100);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/75 p-3.5">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-xs font-semibold text-slate-100">
            {questionId}
          </span>
          <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-400">
            {answer.type}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${confidenceBadgeClass(
            answer.confidence,
          )}`}
        >
          confidence {confPct}%
        </span>
      </div>

      {answer.type === "noul" && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-400">
              Calibrated <code className="text-emerald-300">P(yes)</code>
            </span>
            <span className="font-mono text-sm font-bold text-slate-100">
              {(answer.noul * 100).toFixed(1)}%{" "}
              <span className="text-xs font-normal text-slate-500">({answer.noul.toFixed(2)})</span>
            </span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              style={{ width: `${Math.round(answer.noul * 100)}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title={`P(yes) = ${answer.noul}`}
            />
            <div
              style={{ width: `${Math.round((1 - answer.noul) * 100)}%` }}
              className="bg-rose-500/70 transition-all duration-300"
              title={`P(no) = ${(1 - answer.noul).toFixed(2)}`}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-slate-500">
            <span>YES {(answer.noul * 100).toFixed(1)}%</span>
            <span>NO {((1 - answer.noul) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      {answer.type === "choice" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Top choice</span>
            <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-sky-300 ring-1 ring-sky-500/30">
              {answer.choice}
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {Object.entries(answer.probabilities)
              .sort(([, a], [, b]) => b - a)
              .map(([optKey, prob]) => {
                const isWinner = optKey === answer.choice;
                const pct = Math.round(prob * 1000) / 10;
                return (
                  <div key={optKey} className="space-y-0.5">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className={isWinner ? "font-semibold text-sky-300" : "text-slate-400"}>
                        {optKey}
                      </span>
                      <span className="text-slate-300">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/90">
                      <div
                        style={{ width: `${Math.max(1, pct)}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isWinner ? "bg-sky-400" : "bg-slate-600"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {answer.type === "score" && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Weighted expected score</span>
            <span className="font-mono text-base font-bold text-violet-300">
              {answer.score.toFixed(2)}{" "}
              <span className="text-xs font-normal text-slate-500">
                / {Math.max(1, Object.keys(answer.legend).length - 1)}
              </span>
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {Object.entries(answer.legend)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([lvlIdx, desc]) => {
                const prob = answer.probabilities[lvlIdx] ?? 0;
                const pct = Math.round(prob * 1000) / 10;
                return (
                  <div key={lvlIdx} className="space-y-0.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="min-w-0 flex-1 truncate text-slate-300" title={desc}>
                        <span className="mr-1.5 font-mono font-semibold text-violet-300">
                          [{lvlIdx}]
                        </span>
                        {desc}
                      </span>
                      <span className="shrink-0 font-mono text-slate-300">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/90">
                      <div
                        style={{ width: `${Math.max(1, pct)}%` }}
                        className="h-full rounded-full bg-violet-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ResultsPanel({
  result,
  routing,
  questions,
  history,
  onSelectHistory,
}: ResultsPanelProps) {
  const [showRawJson, setShowRawJson] = useState(false);

  if (!result) {
    return (
      <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
        <div className="mb-3 rounded-full bg-sky-500/10 p-3 text-sky-400 ring-1 ring-sky-500/30">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Ready to Evaluate Decisions</h3>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
          Click <strong className="text-sky-300">Evaluate Decisions</strong> to run all{" "}
          {questions.length} question{questions.length === 1 ? "" : "s"} in one forward pass with{" "}
          <code className="text-emerald-300">0 output tokens</code>.
        </p>
      </section>
    );
  }

  const toneBadge =
    routing?.tone === "emerald"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
      : routing?.tone === "rose"
        ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
        : routing?.tone === "amber"
          ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
          : routing?.tone === "indigo"
            ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200"
            : "border-slate-700 bg-slate-800/80 text-slate-200";

  return (
    <section className="space-y-4">
      {/* Telemetry Strip */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-900/65 p-3.5 shadow-lg shadow-black/20">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-200">Run Telemetry</span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              result.mode === "live"
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
            }`}
          >
            {result.mode === "live" ? "Live gemini-decision-1" : "Simulator Mode"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/60 p-2">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="h-3 w-3 shrink-0 text-sky-400" /> Latency
            </div>
            <div className="mt-0.5 truncate font-mono text-xs font-bold text-slate-100 sm:text-sm">
              {result.latencyMs} ms
            </div>
          </div>
          <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/60 p-2">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Zap className="h-3 w-3 shrink-0 text-emerald-400" /> Output Tokens
            </div>
            <div className="mt-0.5 truncate font-mono text-xs font-bold text-emerald-300 sm:text-sm">
              {result.usage.total_output_tokens}
            </div>
          </div>
          <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/60 p-2">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Cpu className="h-3 w-3 shrink-0 text-violet-400" /> Input Tokens
            </div>
            <div className="mt-0.5 truncate font-mono text-xs font-bold text-slate-100 sm:text-sm">
              {result.usage.total_input_tokens}
            </div>
          </div>
          <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/60 p-2">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Coins className="h-3 w-3 shrink-0 text-amber-400" /> Paid Est.
            </div>
            <div className="mt-0.5 truncate font-mono text-xs font-bold text-slate-100 sm:text-sm">
              ${result.estimatedPaidCostUsd.toFixed(6)}
            </div>
          </div>
        </div>

        {result.usage.input_tokens_by_modality.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.usage.input_tokens_by_modality.map((m) => (
              <span
                key={m.modality}
                className="rounded bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-slate-400 ring-1 ring-slate-800"
              >
                {m.modality}: {m.tokens} tok
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Deterministic Routing Outcome */}
      {routing && (
        <div className={`rounded-xl border p-4 shadow-lg shadow-black/20 ${toneBadge}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {routing.matchedRuleId ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">
                  Deterministic Action • {routing.matchedRuleName}
                </div>
                <div className="mt-0.5 font-mono text-base font-bold">{routing.finalAction}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calibrated Answers */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-900/65 p-4 shadow-lg shadow-black/20">
        <h3 className="mb-3 text-sm font-semibold text-slate-100">
          3. Calibrated Answers ({Object.keys(result.answers).length})
        </h3>
        <div className="space-y-3">
          {Object.entries(result.answers).map(([qId, answer]) => (
            <AnswerCard key={qId} questionId={qId} answer={answer} />
          ))}
        </div>

        <div className="mt-3 border-t border-slate-800 pt-2">
          <button
            type="button"
            onClick={() => setShowRawJson((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            {showRawJson ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showRawJson ? "Hide Raw API Response" : "Inspect Raw API JSON"}
          </button>
          {showRawJson && (
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Run History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/65 p-4 shadow-lg shadow-black/20">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-slate-200">
            <History className="h-3.5 w-3.5 text-slate-400" />
            Recent Evaluations ({history.length})
          </div>
          <div className="space-y-1.5">
            {history.slice(0, 5).map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectHistory(entry)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-800/90 bg-slate-950/60 px-2.5 py-2 text-left text-xs transition hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-200">{entry.inputPreview}</div>
                  <div className="text-[10px] text-slate-500">
                    {entry.timestamp} • {entry.result.latencyMs}ms •{" "}
                    {entry.result.mode === "live" ? "Live" : "Sim"}
                  </div>
                </div>
                <span className="shrink-0 rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-sky-300">
                  {entry.routing.finalAction}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

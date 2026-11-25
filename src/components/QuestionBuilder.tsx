"use client";

import React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckSquare,
  ListChecks,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { QuestionConfig } from "@/lib/decisions/types";

type QuestionBuilderProps = {
  questions: QuestionConfig[];
  onChange: (next: QuestionConfig[]) => void;
};

const KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
  const addQuestion = (type: QuestionConfig["type"]) => {
    const idx = questions.length + 1;
    if (type === "noul") {
      onChange([
        ...questions,
        {
          id: `check_${idx}`,
          type: "noul",
          instructions: "Does the input satisfy this binary condition?",
          criteria: { true_description: "", false_description: "" },
        },
      ]);
    } else if (type === "choice") {
      onChange([
        ...questions,
        {
          id: `category_${idx}`,
          type: "choice",
          instructions: "Which category best matches the input?",
          criteria: {
            primary_option: "Matches the primary expected criteria.",
            secondary_option: "Matches the secondary criteria.",
            other: "Anything outside the defined categories.",
          },
        },
      ]);
    } else {
      onChange([
        ...questions,
        {
          id: `rating_${idx}`,
          type: "score",
          instructions: "Rate the input along this ordered rubric.",
          criteria: [
            "Low: minimal signal or severity.",
            "Medium: moderate signal or partial match.",
            "High: strong signal or maximum severity.",
          ],
        },
      ]);
    }
  };

  const updateQuestion = (index: number, updated: QuestionConfig) => {
    const next = [...questions];
    next[index] = updated;
    onChange(next);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const switchType = (index: number, newType: QuestionConfig["type"]) => {
    const current = questions[index];
    if (current.type === newType) return;
    if (newType === "noul") {
      updateQuestion(index, {
        id: current.id,
        type: "noul",
        instructions: current.instructions,
        criteria: { true_description: "", false_description: "" },
      });
    } else if (newType === "choice") {
      updateQuestion(index, {
        id: current.id,
        type: "choice",
        instructions: current.instructions,
        criteria: {
          option_a: "First category description.",
          option_b: "Second category description.",
          other: "Outside these options.",
        },
      });
    } else {
      updateQuestion(index, {
        id: current.id,
        type: "score",
        instructions: current.instructions,
        criteria: ["Lowest level", "Middle level", "Highest level"],
      });
    }
  };

  return (
    <section className="flex flex-col rounded-xl border border-slate-800/90 bg-slate-900/65 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-100">
            2. Decision Questions ({questions.length} / 1,000)
          </h2>
          <p className="text-xs text-slate-400">
            Evaluated independently in parallel • 0 output tokens
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => addQuestion("noul")}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <Plus className="h-3 w-3" />
            noul
          </button>
          <button
            type="button"
            onClick={() => addQuestion("choice")}
            className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-500/20"
          >
            <Plus className="h-3 w-3" />
            choice
          </button>
          <button
            type="button"
            onClick={() => addQuestion("score")}
            className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20"
          >
            <Plus className="h-3 w-3" />
            score
          </button>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        {questions.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-xs text-slate-400">
            No questions yet. Add a <code className="text-emerald-300">noul</code>,{" "}
            <code className="text-sky-300">choice</code>, or{" "}
            <code className="text-violet-300">score</code> question above.
          </div>
        )}

        {questions.map((q, index) => {
          const validKey = KEY_PATTERN.test(q.id);
          const duplicateKey = questions.filter((other) => other.id === q.id).length > 1;

          return (
            <div
              key={`${index}-${q.type}`}
              className="rounded-lg border border-slate-800 bg-slate-950/65 p-3.5 transition hover:border-slate-700"
            >
              {/* Header Row */}
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {q.type === "noul" && <CheckSquare className="h-4 w-4 shrink-0 text-emerald-400" />}
                  {q.type === "choice" && <ListChecks className="h-4 w-4 shrink-0 text-sky-400" />}
                  {q.type === "score" && (
                    <SlidersHorizontal className="h-4 w-4 shrink-0 text-violet-400" />
                  )}

                  <input
                    type="text"
                    value={q.id}
                    onChange={(e) => updateQuestion(index, { ...q, id: e.target.value })}
                    aria-label="Question Key"
                    className={`min-w-0 flex-1 rounded-md border bg-slate-900 px-2 py-1 font-mono text-xs font-medium focus:outline-none sm:w-40 sm:flex-initial ${
                      !validKey || duplicateKey
                        ? "border-rose-500 text-rose-300"
                        : "border-slate-700 text-slate-100 focus:border-sky-500"
                    }`}
                  />

                  <select
                    value={q.type}
                    onChange={(e) =>
                      switchType(index, e.target.value as QuestionConfig["type"])
                    }
                    className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-200"
                  >
                    <option value="noul">noul (Yes/No)</option>
                    <option value="choice">choice (Single-Select)</option>
                    <option value="score">score (Rubric)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="shrink-0 rounded p-1 text-slate-500 transition hover:bg-slate-800 hover:text-rose-400"
                  title="Delete question"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {(!validKey || duplicateKey) && (
                <p className="mb-2 text-[11px] text-rose-400">
                  {duplicateKey
                    ? "Duplicate question key. Each key must be unique."
                    : "Key must be 1–64 ASCII characters matching [A-Za-z0-9_-]+."}
                </p>
              )}

              {/* Instructions */}
              <div className="mb-3">
                <label className="mb-1 block text-[11px] font-medium text-slate-400">
                  Instructions (the model only sees this text, never the key)
                </label>
                <textarea
                  rows={2}
                  value={q.instructions}
                  onChange={(e) => updateQuestion(index, { ...q, instructions: e.target.value })}
                  className="w-full resize-y rounded-md border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:outline-none"
                  placeholder="Write a clear, positive-phrased question..."
                />
              </div>

              {/* Type-specific Criteria */}
              {q.type === "noul" && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-emerald-400/90">
                      True criteria (optional)
                    </label>
                    <input
                      type="text"
                      value={q.criteria?.true_description ?? ""}
                      onChange={(e) =>
                        updateQuestion(index, {
                          ...q,
                          criteria: { ...q.criteria, true_description: e.target.value },
                        })
                      }
                      placeholder="When answer should be Yes..."
                      className="w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-rose-400/90">
                      False criteria (optional)
                    </label>
                    <input
                      type="text"
                      value={q.criteria?.false_description ?? ""}
                      onChange={(e) =>
                        updateQuestion(index, {
                          ...q,
                          criteria: { ...q.criteria, false_description: e.target.value },
                        })
                      }
                      placeholder="When answer should be No..."
                      className="w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              {q.type === "choice" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      Options Map (sorted alphabetically by UTF-8 key on evaluation)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newKey = `option_${Object.keys(q.criteria).length + 1}`;
                        updateQuestion(index, {
                          ...q,
                          criteria: { ...q.criteria, [newKey]: "" },
                        });
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300"
                    >
                      <Plus className="h-3 w-3" /> Add Option
                    </button>
                  </div>

                  {Object.entries(q.criteria).map(([optKey, optDesc], optIdx) => (
                    <div
                      key={optIdx}
                      className="flex flex-col gap-1.5 rounded-md border border-slate-800/70 bg-slate-900/40 p-1.5 sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
                    >
                      <input
                        type="text"
                        value={optKey}
                        onChange={(e) => {
                          const entries = Object.entries(q.criteria);
                          entries[optIdx] = [e.target.value, optDesc];
                          updateQuestion(index, {
                            ...q,
                            criteria: Object.fromEntries(entries),
                          });
                        }}
                        className="w-full shrink-0 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-sky-300 sm:w-36"
                        placeholder="option_key"
                      />
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <input
                          type="text"
                          value={optDesc}
                          onChange={(e) => {
                            const entries = Object.entries(q.criteria);
                            entries[optIdx] = [optKey, e.target.value];
                            updateQuestion(index, {
                              ...q,
                              criteria: Object.fromEntries(entries),
                            });
                          }}
                          className="min-w-0 flex-1 rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600"
                          placeholder="Short description (or empty if self-explanatory)"
                        />
                        {Object.keys(q.criteria).length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const entries = Object.entries(q.criteria).filter(
                                (_, i) => i !== optIdx,
                              );
                              updateQuestion(index, {
                                ...q,
                                criteria: Object.fromEntries(entries),
                              });
                            }}
                            className="shrink-0 rounded p-1 text-slate-500 hover:text-rose-400"
                            title="Remove option"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {Object.keys(q.criteria).some((k) => k.startsWith("none_")) && (
                    <div className="flex items-start gap-1.5 rounded bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        Prefer a non-positional key like <code>other</code> instead of{" "}
                        <code>none_of_the_above</code> since option keys are sorted alphabetically.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {q.type === "score" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      Ordered Rubric Levels (index 0 = lowest → {q.criteria.length - 1} = highest)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(index, {
                          ...q,
                          criteria: [...q.criteria, `Level ${q.criteria.length} description`],
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300"
                    >
                      <Plus className="h-3 w-3" /> Add Level
                    </button>
                  </div>

                  {q.criteria.map((levelDesc, lvlIdx) => (
                    <div key={lvlIdx} className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-violet-500/15 font-mono text-[11px] font-semibold text-violet-300">
                        {lvlIdx}
                      </span>
                      <input
                        type="text"
                        value={levelDesc}
                        onChange={(e) => {
                          const next = [...q.criteria];
                          next[lvlIdx] = e.target.value;
                          updateQuestion(index, { ...q, criteria: next });
                        }}
                        className="min-w-0 flex-1 rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                      />
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={lvlIdx === 0}
                          onClick={() => {
                            const next = [...q.criteria];
                            [next[lvlIdx - 1], next[lvlIdx]] = [next[lvlIdx], next[lvlIdx - 1]];
                            updateQuestion(index, { ...q, criteria: next });
                          }}
                          className="rounded p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={lvlIdx === q.criteria.length - 1}
                          onClick={() => {
                            const next = [...q.criteria];
                            [next[lvlIdx + 1], next[lvlIdx]] = [next[lvlIdx], next[lvlIdx + 1]];
                            updateQuestion(index, { ...q, criteria: next });
                          }}
                          className="rounded p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        {q.criteria.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestion(index, {
                                ...q,
                                criteria: q.criteria.filter((_, i) => i !== lvlIdx),
                              })
                            }
                            className="rounded p-1 text-slate-500 hover:text-rose-400"
                            title="Remove level"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import React from "react";
import { GitBranch, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type {
  QuestionConfig,
  RuleCondition,
  RuleEvaluationResult,
  RuleMetric,
  RuleOperator,
  RoutingRule,
} from "@/lib/decisions/types";

type RuleBuilderProps = {
  rules: RoutingRule[];
  fallbackAction: string;
  questions: QuestionConfig[];
  evaluation: RuleEvaluationResult | null;
  onChangeRules: (rules: RoutingRule[]) => void;
  onChangeFallback: (action: string) => void;
};

export function RuleBuilder({
  rules,
  fallbackAction,
  questions,
  evaluation,
  onChangeRules,
  onChangeFallback,
}: RuleBuilderProps) {
  const firstQuestionId = questions[0]?.id ?? "question_1";

  const addRule = () => {
    onChangeRules([
      ...rules,
      {
        id: `rule-${Date.now()}`,
        name: `Routing Rule ${rules.length + 1}`,
        action: "auto_execute",
        tone: "indigo",
        matchMode: "all",
        conditions: [
          {
            id: `cond-${Date.now()}`,
            questionId: firstQuestionId,
            metric: "confidence",
            operator: ">=",
            value: 0.75,
          },
        ],
      },
    ]);
  };

  const updateRule = (idx: number, nextRule: RoutingRule) => {
    const next = [...rules];
    next[idx] = nextRule;
    onChangeRules(next);
  };

  const addCondition = (ruleIdx: number) => {
    const rule = rules[ruleIdx];
    updateRule(ruleIdx, {
      ...rule,
      conditions: [
        ...rule.conditions,
        {
          id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          questionId: firstQuestionId,
          metric: "confidence",
          operator: ">=",
          value: 0.7,
        },
      ],
    });
  };

  return (
    <div className="rounded-xl border border-slate-800/90 bg-slate-900/65 p-3 shadow-lg shadow-black/20 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <GitBranch className="h-4 w-4 shrink-0 text-sky-400" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100">
              Deterministic Policy Composition
            </h3>
            <p className="text-[11px] text-slate-400">
              Combine calibrated probabilities &amp; confidence thresholds in code (first match wins)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={addRule}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
        >
          <Plus className="h-3 w-3" /> Add Rule
        </button>
      </div>

      <div className="space-y-2.5">
        {rules.map((rule, rIdx) => {
          const trace = evaluation?.ruleTraces.find((t) => t.ruleId === rule.id);
          const isWinner = evaluation?.matchedRuleId === rule.id;

          return (
            <div
              key={rule.id}
              className={`rounded-lg border p-3 transition ${
                isWinner
                  ? "border-emerald-500/60 bg-emerald-500/10"
                  : "border-slate-800 bg-slate-950/60"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    #{rIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={rule.name}
                    onChange={(e) => updateRule(rIdx, { ...rule, name: e.target.value })}
                    className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-semibold text-slate-100 hover:border-slate-700 focus:border-sky-500 focus:bg-slate-900 focus:outline-none sm:w-44 sm:flex-initial"
                  />
                  {isWinner && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      <ShieldCheck className="h-3 w-3" /> MATCHED
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={rule.matchMode}
                    onChange={(e) =>
                      updateRule(rIdx, { ...rule, matchMode: e.target.value as "all" | "any" })
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[11px] text-slate-300"
                  >
                    <option value="all">ALL conditions (AND)</option>
                    <option value="any">ANY condition (OR)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onChangeRules(rules.filter((_, i) => i !== rIdx))}
                    className="rounded p-1 text-slate-500 hover:text-rose-400"
                    title="Delete rule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {rule.conditions.map((cond, cIdx) => {
                  const condTrace = trace?.conditionResults.find(
                    (ct) => ct.conditionId === cond.id,
                  );

                  return (
                    <div
                      key={cond.id}
                      className="grid grid-cols-2 gap-1.5 rounded-md border border-slate-800/70 bg-slate-900/30 p-1.5 text-xs sm:flex sm:flex-wrap sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
                    >
                      <select
                        value={cond.questionId}
                        onChange={(e) => {
                          const nextConds = [...rule.conditions];
                          nextConds[cIdx] = { ...cond, questionId: e.target.value };
                          updateRule(rIdx, { ...rule, conditions: nextConds });
                        }}
                        className="min-w-0 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-sky-300"
                      >
                        {questions.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.id}
                          </option>
                        ))}
                      </select>

                      <select
                        value={cond.metric}
                        onChange={(e) => {
                          const nextConds = [...rule.conditions];
                          nextConds[cIdx] = { ...cond, metric: e.target.value as RuleMetric };
                          updateRule(rIdx, { ...rule, conditions: nextConds });
                        }}
                        className="min-w-0 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-200"
                      >
                        <option value="noul">.noul (P yes)</option>
                        <option value="confidence">.confidence</option>
                        <option value="score">.score</option>
                        <option value="choice">.choice</option>
                      </select>

                      <select
                        value={cond.operator}
                        onChange={(e) => {
                          const nextConds = [...rule.conditions];
                          nextConds[cIdx] = {
                            ...cond,
                            operator: e.target.value as RuleOperator,
                          };
                          updateRule(rIdx, { ...rule, conditions: nextConds });
                        }}
                        className="rounded border border-slate-700 bg-slate-900 px-1.5 py-1 font-mono text-[11px] text-slate-200"
                      >
                        <option value=">=">&gt;=</option>
                        <option value=">">&gt;</option>
                        <option value="<=">&lt;=</option>
                        <option value="<">&lt;</option>
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                      </select>

                      <input
                        type={cond.metric === "choice" ? "text" : "number"}
                        step="0.05"
                        value={cond.value}
                        onChange={(e) => {
                          const nextConds = [...rule.conditions];
                          const val: RuleCondition["value"] =
                            cond.metric === "choice"
                              ? e.target.value
                              : Number(e.target.value);
                          nextConds[cIdx] = { ...cond, value: val };
                          updateRule(rIdx, { ...rule, conditions: nextConds });
                        }}
                        className="min-w-0 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-100 sm:w-24"
                      />

                      {(condTrace || rule.conditions.length > 1) && (
                        <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1">
                          {condTrace && (
                            <span
                              className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                                condTrace.passed
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              got {condTrace.actual} {condTrace.passed ? "✓" : "✗"}
                            </span>
                          )}

                          {rule.conditions.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                updateRule(rIdx, {
                                  ...rule,
                                  conditions: rule.conditions.filter((_, i) => i !== cIdx),
                                })
                              }
                              className="rounded p-1 text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                <button
                  type="button"
                  onClick={() => addCondition(rIdx)}
                  className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
                >
                  + Add condition
                </button>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] text-slate-400">Then execute:</span>
                  {rule.useWinningChoiceAsAction ? (
                    <span className="rounded bg-sky-500/15 px-2 py-0.5 font-mono text-[11px] text-sky-300">
                      answers[{rule.choiceQuestionId}].choice
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={rule.action}
                      onChange={(e) => updateRule(rIdx, { ...rule, action: e.target.value })}
                      className="w-36 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-emerald-300 sm:w-40"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="text-slate-400">Fallback Action (if no rule passes threshold)</span>
          <input
            type="text"
            value={fallbackAction}
            onChange={(e) => onChangeFallback(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-amber-300 sm:w-44"
          />
        </div>
      </div>
    </div>
  );
}

import type {
  DecisionAnswerResult,
  RuleCondition,
  RuleEvaluationResult,
  RoutingRule,
} from "./types";

function compareNumbers(actual: number, op: RuleCondition["operator"], target: number): boolean {
  switch (op) {
    case ">=":
      return actual >= target;
    case ">":
      return actual > target;
    case "<=":
      return actual <= target;
    case "<":
      return actual < target;
    case "==":
      return Math.abs(actual - target) < 1e-6;
    case "!=":
      return Math.abs(actual - target) >= 1e-6;
  }
}

function evaluateCondition(
  cond: RuleCondition,
  answers: Record<string, DecisionAnswerResult>,
): { label: string; actual: string; passed: boolean } {
  const answer = answers[cond.questionId];
  const baseLabel = `${cond.questionId}.${cond.metric} ${cond.operator} ${cond.value}`;

  if (!answer) {
    return { label: baseLabel, actual: "missing", passed: false };
  }

  if (cond.metric === "confidence") {
    const target = Number(cond.value);
    const passed = Number.isFinite(target) && compareNumbers(answer.confidence, cond.operator, target);
    return {
      label: baseLabel,
      actual: answer.confidence.toFixed(2),
      passed,
    };
  }

  if (cond.metric === "noul") {
    if (answer.type !== "noul") {
      return { label: baseLabel, actual: `type:${answer.type}`, passed: false };
    }
    const target = Number(cond.value);
    const passed = Number.isFinite(target) && compareNumbers(answer.noul, cond.operator, target);
    return {
      label: baseLabel,
      actual: answer.noul.toFixed(2),
      passed,
    };
  }

  if (cond.metric === "score") {
    if (answer.type !== "score") {
      return { label: baseLabel, actual: `type:${answer.type}`, passed: false };
    }
    const target = Number(cond.value);
    const passed = Number.isFinite(target) && compareNumbers(answer.score, cond.operator, target);
    return {
      label: baseLabel,
      actual: answer.score.toFixed(2),
      passed,
    };
  }

  // metric === "choice"
  if (answer.type !== "choice") {
    return { label: baseLabel, actual: `type:${answer.type}`, passed: false };
  }

  const targetStr = String(cond.value);
  const passed =
    cond.operator === "=="
      ? answer.choice === targetStr
      : cond.operator === "!="
        ? answer.choice !== targetStr
        : false;

  return {
    label: baseLabel,
    actual: answer.choice,
    passed,
  };
}

/**
 * Evaluates deterministic routing rules sequentially against calibrated API answers.
 * Mirrors the recommended "atomic checks, composed in code" pattern.
 */
export function evaluateRoutingRules(
  rules: RoutingRule[],
  answers: Record<string, DecisionAnswerResult>,
  fallbackAction = "human_escalation",
): RuleEvaluationResult {
  let matchedRule: RoutingRule | null = null;

  const ruleTraces = rules.map((rule) => {
    const conditionResults = rule.conditions.map((cond) => ({
      conditionId: cond.id,
      ...evaluateCondition(cond, answers),
    }));

    const matched =
      conditionResults.length > 0 &&
      (rule.matchMode === "all"
        ? conditionResults.every((c) => c.passed)
        : conditionResults.some((c) => c.passed));

    if (matched && !matchedRule) {
      matchedRule = rule;
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      conditionResults,
    };
  });

  if (!matchedRule) {
    return {
      matchedRuleId: null,
      matchedRuleName: "Fallback Guardrail",
      finalAction: fallbackAction,
      tone: "slate",
      ruleTraces,
    };
  }

  const resolvedRule: RoutingRule = matchedRule;
  let finalAction = resolvedRule.action;

  if (resolvedRule.useWinningChoiceAsAction && resolvedRule.choiceQuestionId) {
    const choiceAnswer = answers[resolvedRule.choiceQuestionId];
    if (choiceAnswer?.type === "choice" && choiceAnswer.choice) {
      finalAction = choiceAnswer.choice;
    }
  }

  return {
    matchedRuleId: resolvedRule.id,
    matchedRuleName: resolvedRule.name,
    finalAction,
    tone: resolvedRule.tone,
    ruleTraces,
  };
}

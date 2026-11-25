import type { DecisionInputBlock, QuestionConfig } from "./types";

const QUESTION_KEY_REGEX = /^[A-Za-z0-9_-]{1,64}$/;

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Validates option keys according to Gemini Decisions API rules:
 * 1..128 chars, <= 512 UTF-8 bytes, no leading/trailing ASCII spaces,
 * no control chars, no non-ASCII whitespace.
 */
export function isValidOptionKey(key: string): { valid: boolean; reason?: string } {
  if (!key || key.length === 0) {
    return { valid: false, reason: "Option key cannot be empty." };
  }
  if (key.length > 128) {
    return { valid: false, reason: "Option key exceeds 128 characters." };
  }
  if (new TextEncoder().encode(key).length > 512) {
    return { valid: false, reason: "Option key exceeds 512 UTF-8 bytes." };
  }
  if (key !== key.trim()) {
    return { valid: false, reason: "Option key cannot have leading or trailing spaces." };
  }
  if (/[\u0000-\u001F\u007F]/.test(key)) {
    return { valid: false, reason: "Option key cannot contain control characters." };
  }
  // Reject non-ASCII whitespace while allowing internal ASCII spaces
  if (/[^\S ]/.test(key)) {
    return { valid: false, reason: "Option key cannot contain tabs, newlines, or non-ASCII whitespace." };
  }
  return { valid: true };
}

/**
 * Validates the full Decisions API payload before dispatching to Google GenAI SDK.
 */
export function validateDecisionRequest(
  inputBlocks: DecisionInputBlock[],
  questions: QuestionConfig[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const hasContent = inputBlocks.some((block) => {
    if (block.type === "text") return block.text.trim().length > 0;
    return Boolean(block.data || block.uri);
  });

  if (!hasContent) {
    errors.push("Shared input cannot be empty. Provide text, JSON, or a media attachment.");
  }

  if (questions.length === 0) {
    errors.push("At least 1 decision question is required.");
  }
  if (questions.length > 1000) {
    errors.push("A single request supports at most 1,000 questions.");
  }

  const seenKeys = new Set<string>();

  for (const q of questions) {
    if (!QUESTION_KEY_REGEX.test(q.id)) {
      errors.push(
        `Question key "${q.id}" must be 1–64 ASCII characters matching [A-Za-z0-9_-]+.`,
      );
    }
    if (seenKeys.has(q.id)) {
      errors.push(`Duplicate question key "${q.id}". Keys must be unique.`);
    }
    seenKeys.add(q.id);

    if (!q.instructions.trim()) {
      errors.push(`Question "${q.id}" is missing instructions.`);
    }

    if (q.type === "choice") {
      const optionKeys = Object.keys(q.criteria);
      if (optionKeys.length < 2 || optionKeys.length > 255) {
        errors.push(`Choice question "${q.id}" must have between 2 and 255 options.`);
      }
      for (const optKey of optionKeys) {
        const keyCheck = isValidOptionKey(optKey);
        if (!keyCheck.valid) {
          errors.push(`Question "${q.id}" option "${optKey}": ${keyCheck.reason}`);
        }
        if (optKey === "none_of_the_above" || optKey.startsWith("none_")) {
          warnings.push(
            `Question "${q.id}" uses "${optKey}". Choice option keys are sorted alphabetically by UTF-8 byte order; prefer a non-positional key like "other".`,
          );
        }
      }
    } else if (q.type === "score") {
      if (q.criteria.length < 2 || q.criteria.length > 255) {
        errors.push(`Score question "${q.id}" must have between 2 and 255 rubric levels.`);
      }
      if (q.criteria.length > 10) {
        warnings.push(
          `Score question "${q.id}" has ${q.criteria.length} levels; 2–10 levels are recommended for crisp calibration.`,
        );
      }
      q.criteria.forEach((level, idx) => {
        if (!level.trim()) {
          errors.push(`Score question "${q.id}" level ${idx} cannot be empty.`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

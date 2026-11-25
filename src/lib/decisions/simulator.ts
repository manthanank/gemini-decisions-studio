import type {
  ChoiceAnswerResult,
  DecisionAnswerResult,
  DecisionEvaluateResponse,
  DecisionInputBlock,
  NoulAnswerResult,
  QuestionConfig,
  ScoreAnswerResult,
} from "./types";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function tokenizeText(inputBlocks: DecisionInputBlock[]): string {
  return inputBlocks
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text.toLowerCase())
    .join(" ");
}

function keywordMatchScore(haystack: string, needleText: string): number {
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "does",
    "what",
    "which",
    "about",
    "your",
    "have",
    "been",
    "more",
    "than",
    "only",
    "none",
    "other",
    "anything",
    "outside",
    "these",
    "categories",
  ]);
  const words = needleText
    .toLowerCase()
    .replace(/[^a-z0-9_ ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stop.has(w));

  if (words.length === 0) return 0;
  let hits = 0;
  for (const w of words) {
    if (haystack.includes(w)) hits += 1;
  }
  return hits / Math.sqrt(words.length);
}

function simulateNoul(q: QuestionConfig, text: string, hasImage: boolean): NoulAnswerResult {
  let p = 0.5;

  const positiveSignals = [
    "crack",
    "broken",
    "faulty",
    "defect",
    "cut out",
    "cuts out",
    "damage",
    "dent",
    "wet",
    "torn",
    "po-2026",
    "po number",
    "purchase order",
    "q3",
    "revenue",
    "safe",
    "covered",
    "intact",
  ];
  const negativeSignals = [
    "preferred green",
    "preference",
    "no damage",
    "none provided",
    "missing",
    "ignore previous",
    "dump all",
    "ssn",
    "secret key",
    "webhook",
    "intact, sealed",
    "undamaged",
  ];

  // Question-specific heuristics so sample templates behave authentically
  const id = q.id.toLowerCase();
  if (id.includes("defect") || id.includes("damage")) {
    if (/crack|broken|faulty|cuts out|malfunction|dent|torn|crushed/.test(text)) p = 0.94;
    else if (/preferred|sizing|color|no damage|intact|dry and sealed|undamaged/.test(text)) p = 0.04;
    else if (hasImage) p = 0.62;
  } else if (id.includes("po_number") || id.includes("po")) {
    if (/po-20|po number:\s*po-|purchase order:\s*[a-z0-9-]+/i.test(text) && !/none provided/i.test(text)) {
      p = 0.97;
    } else if (/none provided|missing po/i.test(text)) {
      p = 0.03;
    }
  } else if (id.includes("safe")) {
    if (/ignore previous|dump all|ssn|secret key|exfiltrat|jailbreak/.test(text)) {
      p = 0.02;
    } else {
      p = 0.96;
    }
  } else {
    const pos = positiveSignals.filter((s) => text.includes(s)).length;
    const neg = negativeSignals.filter((s) => text.includes(s)).length;
    p = clamp(0.5 + (pos - neg) * 0.18, 0.03, 0.97);
  }

  // Add slight deterministic nuance from instructions
  if (q.instructions.toLowerCase().includes("not ")) {
    p = clamp(1 - p, 0.01, 0.99);
  }

  p = round2(clamp(p, 0.01, 0.99));
  const confidence = round2(Math.max(p, 1 - p));
  return { type: "noul", noul: p, confidence };
}

function simulateChoice(
  q: Extract<QuestionConfig, { type: "choice" }>,
  text: string,
): ChoiceAnswerResult {
  const keys = Object.keys(q.criteria).sort();
  const scores: Record<string, number> = {};

  for (const k of keys) {
    const desc = q.criteria[k] || "";
    let raw = 0.35 + keywordMatchScore(text, `${k.replace(/_/g, " ")} ${desc}`) * 2.4;

    // Smart domain calibration for curated scenarios
    if (k === "human_escalation" && /cancel|gold|240|threat/.test(text)) raw += 3.5;
    if (k === "instant_refund" && /mug|18|cracked/.test(text)) raw += 3.8;
    if (k === "replacement_shipment" && /defect|broken/.test(text) && !/cancel/.test(text)) raw += 2.0;
    if (k === "cloud_infrastructure" && /gpu|cloud|nimbus|server|compute/.test(text)) raw += 4.2;
    if (k === "travel" && /charter|flight|hotel|dinner|travel/.test(text)) raw += 4.2;
    if (k === "covered_porch" && /covered porch|alcove|dry and sealed/.test(text)) raw += 4.0;
    if (k === "exposed_walkway" && /front door|dented|walkway/.test(text)) raw += 2.2;
    if (k === "analytics_sql_agent" && /revenue|cohort|q3|metrics/.test(text)) raw += 4.2;
    if (k === "other" && /ignore previous|dump all|ssn/.test(text)) raw += 4.0;

    scores[k] = Math.exp(raw);
  }

  const total = Object.values(scores).reduce((acc, v) => acc + v, 0) || 1;
  const probabilities: Record<string, number> = {};
  let topKey = keys[0];
  let topProb = -1;

  for (const k of keys) {
    const prob = round3(scores[k] / total);
    probabilities[k] = prob;
    if (prob > topProb) {
      topProb = prob;
      topKey = k;
    }
  }

  return {
    type: "choice",
    choice: topKey,
    probabilities,
    confidence: round2(clamp(topProb, 0, 1)),
  };
}

function simulateScore(
  q: Extract<QuestionConfig, { type: "score" }>,
  text: string,
): ScoreAnswerResult {
  const levels = q.criteria;
  const n = levels.length;
  const legend: Record<string, string> = {};
  levels.forEach((desc, idx) => {
    legend[String(idx)] = desc;
  });

  // Determine target center in [0, n - 1]
  let center = (n - 1) / 2;
  if (/cancel|threat|ignore previous|dump all|missing|none provided|crushed|severely/.test(text)) {
    center = n - 1 - 0.1;
  } else if (/mild|dented|suboptimal|moderate/.test(text)) {
    center = Math.max(0.5, (n - 1) * 0.55);
  } else if (/pristine|exemplary|clean|po-20|routine|q3|preferred/.test(text)) {
    if (q.id.includes("quality") || q.id.includes("rating")) {
      center = n - 1 - 0.15;
    } else {
      center = 0.2;
    }
  }

  const weights = levels.map((_, idx) => Math.exp(-2.4 * Math.pow(idx - center, 2)));
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;

  const probabilities: Record<string, number> = {};
  let weightedSum = 0;
  let maxP = 0;

  weights.forEach((w, idx) => {
    const p = round3(w / sumW);
    probabilities[String(idx)] = p;
    weightedSum += idx * p;
    if (p > maxP) maxP = p;
  });

  return {
    type: "score",
    score: round2(weightedSum),
    legend,
    probabilities,
    confidence: round2(clamp(maxP, 0, 1)),
  };
}

/**
 * Generates realistic calibrated Decisions API responses locally when running
 * in Simulator Mode (without hitting Google's servers).
 */
export function runSimulatedDecisions(
  inputBlocks: DecisionInputBlock[],
  questions: QuestionConfig[],
): DecisionEvaluateResponse {
  const start = Date.now();
  const text = tokenizeText(inputBlocks);
  const hasImage = inputBlocks.some((b) => b.type === "image");
  const hasDocument = inputBlocks.some((b) => b.type === "document");
  const hasAudio = inputBlocks.some((b) => b.type === "audio");
  const hasVideo = inputBlocks.some((b) => b.type === "video");

  const answers: Record<string, DecisionAnswerResult> = {};
  for (const q of questions) {
    if (q.type === "noul") {
      answers[q.id] = simulateNoul(q, text, hasImage);
    } else if (q.type === "choice") {
      answers[q.id] = simulateChoice(q, text);
    } else {
      answers[q.id] = simulateScore(q, text);
    }
  }

  const textChars = inputBlocks
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .reduce((acc, b) => acc + b.text.length, 0);
  const questionChars = questions.reduce(
    (acc, q) => acc + q.instructions.length + JSON.stringify(q.criteria ?? "").length,
    0,
  );

  const textTokens = Math.max(24, Math.ceil((textChars + questionChars) / 4));
  const modalityUsage = [{ modality: "text", tokens: textTokens }];

  let totalInput = textTokens;
  if (hasImage || hasDocument || hasVideo) {
    const imageTokens = (hasImage ? 258 : 0) + (hasDocument ? 516 : 0) + (hasVideo ? 780 : 0);
    modalityUsage.push({ modality: "image", tokens: imageTokens });
    totalInput += imageTokens;
  }
  if (hasAudio) {
    const audioTokens = 320;
    modalityUsage.push({ modality: "audio", tokens: audioTokens });
    totalInput += audioTokens;
  }

  const latencyMs = Math.max(145, Date.now() - start + 165);
  const estimatedPaidCostUsd = (totalInput / 1_000_000) * 0.1;

  return {
    mode: "simulated",
    model: "gemini-decision-1",
    latencyMs,
    answers,
    usage: {
      total_input_tokens: totalInput,
      input_tokens_by_modality: modalityUsage,
      total_output_tokens: 0,
      total_tokens: totalInput,
    },
    estimatedPaidCostUsd,
  };
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { validateDecisionRequest } from "@/lib/decisions/validation";
import { runSimulatedDecisions } from "@/lib/decisions/simulator";
import type {
  DecisionAnswerResult,
  DecisionEvaluateResponse,
  DecisionInputBlock,
  QuestionConfig,
} from "@/lib/decisions/types";

type EvaluateBody = {
  inputBlocks: DecisionInputBlock[];
  questions: QuestionConfig[];
  forceSimulate?: boolean;
};

function toSdkQuestions(questions: QuestionConfig[]) {
  const map: Record<string, unknown> = {};
  for (const q of questions) {
    if (q.type === "noul") {
      const trueDesc = q.criteria?.true_description?.trim();
      const falseDesc = q.criteria?.false_description?.trim();
      const hasCriteria = Boolean(trueDesc || falseDesc);
      map[q.id] = {
        type: "noul",
        instructions: q.instructions.trim(),
        ...(hasCriteria
          ? {
              criteria: {
                ...(trueDesc ? { true_description: trueDesc } : {}),
                ...(falseDesc ? { false_description: falseDesc } : {}),
              },
            }
          : {}),
      };
    } else if (q.type === "choice") {
      map[q.id] = {
        type: "choice",
        instructions: q.instructions.trim(),
        criteria: q.criteria,
      };
    } else {
      map[q.id] = {
        type: "score",
        instructions: q.instructions.trim(),
        criteria: q.criteria,
      };
    }
  }
  return map;
}

function toSdkInput(inputBlocks: DecisionInputBlock[]) {
  const nonEmptyBlocks = inputBlocks.filter((block) => {
    if (block.type === "text") return block.text.trim().length > 0;
    return Boolean(block.data || block.uri);
  });

  if (nonEmptyBlocks.length === 1 && nonEmptyBlocks[0].type === "text") {
    return nonEmptyBlocks[0].text;
  }

  return nonEmptyBlocks;
}

export async function GET() {
  const hasServerApiKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  return NextResponse.json({
    hasServerApiKey,
    model: "gemini-decision-1",
    apiVersion: "v1beta",
  });
}

export async function POST(req: NextRequest) {
  let body: EvaluateBody;
  try {
    body = (await req.json()) as EvaluateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const inputBlocks = Array.isArray(body.inputBlocks) ? body.inputBlocks : [];
  const questions = Array.isArray(body.questions) ? body.questions : [];
  const validation = validateDecisionRequest(inputBlocks, questions);

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors[0], details: validation.errors },
      { status: 400 },
    );
  }

  const headerKey = req.headers.get("x-gemini-api-key")?.trim();
  const envKey = process.env.GEMINI_API_KEY?.trim();
  const apiKey = headerKey || envKey;

  if (body.forceSimulate || !apiKey) {
    const simulated = runSimulatedDecisions(inputBlocks, questions);
    return NextResponse.json(simulated);
  }

  try {
    const start = Date.now();
    const ai = new GoogleGenAI({ apiVersion: "v1beta", apiKey });

    const sdkQuestions = toSdkQuestions(questions);
    const sdkInput = toSdkInput(inputBlocks);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawResult = await ai.decisions.create({
      model: "gemini-decision-1",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: sdkInput as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questions: sdkQuestions as any,
    });

    const latencyMs = Date.now() - start;
    const totalInput = rawResult.usage?.total_input_tokens ?? 0;
    const totalOutput = rawResult.usage?.total_output_tokens ?? 0;
    const modalityTokens =
      rawResult.usage?.input_tokens_by_modality?.map((m) => ({
        modality: m.modality ?? "text",
        tokens: m.tokens ?? 0,
      })) ?? [];

    const responsePayload: DecisionEvaluateResponse = {
      mode: "live",
      model: "gemini-decision-1",
      latencyMs,
      answers: (rawResult.answers ?? {}) as Record<string, DecisionAnswerResult>,
      usage: {
        total_input_tokens: totalInput,
        input_tokens_by_modality: modalityTokens,
        total_output_tokens: totalOutput,
        total_tokens: rawResult.usage?.total_tokens ?? totalInput + totalOutput,
      },
      estimatedPaidCostUsd: (totalInput / 1_000_000) * 0.1,
    };

    return NextResponse.json(responsePayload);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to evaluate Gemini Decisions API request.";
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof (err as { status: unknown }).status === "number"
        ? (err as { status: number }).status
        : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}

import type { AttachmentItem, QuestionConfig } from "./types";

function buildInputSummaryForCode(
  inputText: string,
  attachments: AttachmentItem[],
): unknown {
  if (attachments.length === 0) {
    return inputText;
  }
  const blocks: Array<Record<string, unknown>> = [];
  if (inputText.trim()) {
    blocks.push({ type: "text", text: inputText });
  }
  for (const att of attachments) {
    if (att.uri) {
      blocks.push({
        type: att.kind,
        uri: att.uri,
        mime_type: att.mimeType,
        ...(att.resolution && (att.kind === "image" || att.kind === "video")
          ? { resolution: att.resolution }
          : {}),
      });
    } else {
      blocks.push({
        type: att.kind,
        data: `<BASE64_${att.kind.toUpperCase()}_BYTES>`,
        mime_type: att.mimeType,
        ...(att.resolution && (att.kind === "image" || att.kind === "video")
          ? { resolution: att.resolution }
          : {}),
      });
    }
  }
  return blocks;
}

function buildQuestionsMap(questions: QuestionConfig[]): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  for (const q of questions) {
    if (q.type === "noul") {
      const hasCriteria =
        q.criteria?.true_description?.trim() || q.criteria?.false_description?.trim();
      map[q.id] = {
        type: "noul",
        instructions: q.instructions,
        ...(hasCriteria ? { criteria: q.criteria } : {}),
      };
    } else if (q.type === "choice") {
      map[q.id] = {
        type: "choice",
        instructions: q.instructions,
        criteria: q.criteria,
      };
    } else {
      map[q.id] = {
        type: "score",
        instructions: q.instructions,
        criteria: q.criteria,
      };
    }
  }
  return map;
}

export function generateTypeScriptSnippet(
  inputText: string,
  questions: QuestionConfig[],
  attachments: AttachmentItem[],
): string {
  const inputPayload = buildInputSummaryForCode(inputText, attachments);
  const questionsPayload = buildQuestionsMap(questions);

  return `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiVersion: "v1beta" });

const result = await ai.decisions.create({
  model: "gemini-decision-1",
  input: ${JSON.stringify(inputPayload, null, 2).replace(/\n/g, "\n  ")},
  questions: ${JSON.stringify(questionsPayload, null, 2).replace(/\n/g, "\n  ")},
});

console.log(result.answers);
console.log("Output tokens:", result.usage?.total_output_tokens); // Always 0`;
}

export function generatePythonSnippet(
  inputText: string,
  questions: QuestionConfig[],
  attachments: AttachmentItem[],
): string {
  const inputPayload = buildInputSummaryForCode(inputText, attachments);
  const questionsPayload = buildQuestionsMap(questions);

  return `from google import genai

client = genai.Client(http_options={"api_version": "v1beta"})

result = client.decisions.create(
    model="gemini-decision-1",
    input=${JSON.stringify(inputPayload, null, 4).replace(/\n/g, "\n    ")},
    questions=${JSON.stringify(questionsPayload, null, 4).replace(/\n/g, "\n    ")},
)

for q_id, answer in result.answers.items():
    print(q_id, answer)
print("Output tokens:", result.usage.total_output_tokens)  # Always 0`;
}

export function generateCurlSnippet(
  inputText: string,
  questions: QuestionConfig[],
  attachments: AttachmentItem[],
): string {
  const body = {
    model: "gemini-decision-1",
    input: buildInputSummaryForCode(inputText, attachments),
    questions: buildQuestionsMap(questions),
  };

  return `curl -X POST "https://generativelanguage.googleapis.com/v1beta/decisions" \\
  -H "x-goog-api-key: $GEMINI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}'`;
}

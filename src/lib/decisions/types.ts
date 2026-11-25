export type MediaResolution = "low" | "medium" | "high" | "ultra_high";

export type DecisionTextBlock = {
  type: "text";
  text: string;
};

export type DecisionMediaKind = "image" | "audio" | "video" | "document";

export type DecisionMediaBlock = {
  type: DecisionMediaKind;
  data?: string;
  uri?: string;
  mime_type: string;
  resolution?: MediaResolution;
};

export type DecisionInputBlock = DecisionTextBlock | DecisionMediaBlock;

export type NoulQuestionConfig = {
  id: string;
  type: "noul";
  instructions: string;
  criteria?: {
    true_description?: string;
    false_description?: string;
  };
};

export type ChoiceQuestionConfig = {
  id: string;
  type: "choice";
  instructions: string;
  criteria: Record<string, string>;
};

export type ScoreQuestionConfig = {
  id: string;
  type: "score";
  instructions: string;
  criteria: string[];
};

export type QuestionConfig =
  | NoulQuestionConfig
  | ChoiceQuestionConfig
  | ScoreQuestionConfig;

export type NoulAnswerResult = {
  type: "noul";
  noul: number;
  confidence: number;
};

export type ChoiceAnswerResult = {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};

export type ScoreAnswerResult = {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
};

export type DecisionAnswerResult =
  | NoulAnswerResult
  | ChoiceAnswerResult
  | ScoreAnswerResult;

export type ModalityTokenUsage = {
  modality: string;
  tokens: number;
};

export type DecisionUsage = {
  total_input_tokens: number;
  input_tokens_by_modality: ModalityTokenUsage[];
  total_output_tokens: number;
  total_tokens: number;
};

export type RuleMetric = "noul" | "confidence" | "score" | "choice";
export type RuleOperator = ">=" | ">" | "<=" | "<" | "==" | "!=";

export type RuleCondition = {
  id: string;
  questionId: string;
  metric: RuleMetric;
  operator: RuleOperator;
  value: string | number;
};

export type RoutingRule = {
  id: string;
  name: string;
  action: string;
  tone: "emerald" | "amber" | "rose" | "indigo";
  matchMode: "all" | "any";
  conditions: RuleCondition[];
  useWinningChoiceAsAction?: boolean;
  choiceQuestionId?: string;
};

export type RuleEvaluationResult = {
  matchedRuleId: string | null;
  matchedRuleName: string;
  finalAction: string;
  tone: "emerald" | "amber" | "rose" | "indigo" | "slate";
  ruleTraces: Array<{
    ruleId: string;
    ruleName: string;
    matched: boolean;
    conditionResults: Array<{
      conditionId: string;
      label: string;
      actual: string;
      passed: boolean;
    }>;
  }>;
};

export type DecisionRunMode = "live" | "simulated";

export type DecisionEvaluateResponse = {
  mode: DecisionRunMode;
  model: "gemini-decision-1";
  latencyMs: number;
  answers: Record<string, DecisionAnswerResult>;
  usage: DecisionUsage;
  estimatedPaidCostUsd: number;
};

export type AttachmentItem = {
  id: string;
  name: string;
  kind: DecisionMediaKind;
  mimeType: string;
  sizeBytes?: number;
  dataBase64?: string;
  uri?: string;
  resolution?: MediaResolution;
  previewUrl?: string;
};

export type InputSamplePreset = {
  id: string;
  label: string;
  description: string;
  text: string;
  sampleImageKind?: "cracked_parcel" | "clean_parcel" | "invoice_badge";
};

export type DecisionTemplate = {
  id: string;
  name: string;
  badge: string;
  description: string;
  samples: InputSamplePreset[];
  questions: QuestionConfig[];
  rules: RoutingRule[];
  fallbackAction: string;
};

export type RunHistoryEntry = {
  id: string;
  timestamp: string;
  templateName: string;
  inputPreview: string;
  result: DecisionEvaluateResponse;
  routing: RuleEvaluationResult;
};

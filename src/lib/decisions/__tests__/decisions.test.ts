import { describe, expect, it } from "vitest";
import { validateDecisionRequest, isValidOptionKey } from "../validation";
import { evaluateRoutingRules } from "../rule-engine";
import { runSimulatedDecisions } from "../simulator";
import { DECISION_TEMPLATES } from "../templates";

describe("Decisions API validation", () => {
  it("validates valid question keys and rejects invalid ones", () => {
    const res = validateDecisionRequest(
      [{ type: "text", text: "Cracked mug" }],
      [
        {
          id: "is_damaged",
          type: "noul",
          instructions: "Did the item arrive damaged?",
        },
      ],
    );
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);

    const badKey = validateDecisionRequest(
      [{ type: "text", text: "Cracked mug" }],
      [
        {
          id: "bad key with spaces",
          type: "noul",
          instructions: "Did the item arrive damaged?",
        },
      ],
    );
    expect(badKey.valid).toBe(false);
    expect(badKey.errors[0]).toContain("[A-Za-z0-9_-]+");
  });

  it("warns on positional choice keys like none_of_the_above", () => {
    const res = validateDecisionRequest(
      [{ type: "text", text: "Order inquiry" }],
      [
        {
          id: "dept",
          type: "choice",
          instructions: "Which department?",
          criteria: {
            billing: "Payments",
            none_of_the_above: "Fallback",
          },
        },
      ],
    );
    expect(res.valid).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it("rejects leading/trailing spaces in option keys", () => {
    expect(isValidOptionKey("valid option").valid).toBe(true);
    expect(isValidOptionKey(" padded").valid).toBe(false);
    expect(isValidOptionKey("tab\tkey").valid).toBe(false);
  });
});

describe("Deterministic routing rule engine", () => {
  it("routes VIP churn threat to human_escalation", () => {
    const tpl = DECISION_TEMPLATES[0];
    const sim = runSimulatedDecisions(
      [{ type: "text", text: tpl.samples[0].text }],
      tpl.questions,
    );
    expect(sim.usage.total_output_tokens).toBe(0);

    const routing = evaluateRoutingRules(tpl.rules, sim.answers, tpl.fallbackAction);
    expect(routing.finalAction).toBe("human_escalation");
  });

  it("routes non-defect preference return to standard_return_portal", () => {
    const tpl = DECISION_TEMPLATES[0];
    const sim = runSimulatedDecisions(
      [{ type: "text", text: tpl.samples[2].text }],
      tpl.questions,
    );

    const routing = evaluateRoutingRules(tpl.rules, sim.answers, tpl.fallbackAction);
    expect(routing.finalAction).toBe("standard_return_portal");
  });
});

import { describe, expect, it } from "vitest";
import { isActionVisible, toUserStatus } from "./contractAdapter";

describe("contract adapter presentation rules", () => {
  it("maps retryable state into recoverable product language", () => {
    expect(toUserStatus("RETRYABLE")).toEqual({
      label: "Retryable",
      tone: "warning",
      nextStep: "Fix the evidence issue or cancel safely."
    });
  });

  it("shows provider evidence action only while the workflow is open", () => {
    expect(
      isActionVisible({
        role: "provider",
        status: "OPEN",
        action: "submitEvidence"
      })
    ).toBe(true);
    expect(
      isActionVisible({
        role: "provider",
        status: "EVIDENCE_LOCKED",
        action: "submitEvidence"
      })
    ).toBe(false);
  });

  it("hides sponsor review action after settlement", () => {
    expect(
      isActionVisible({
        role: "sponsor",
        status: "SETTLED",
        action: "requestReview"
      })
    ).toBe(false);
  });
});

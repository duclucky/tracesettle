import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./App";

const mocks = vi.hoisted(() => {
  const finalized = {
    id: "0xabc",
    submitted: true,
    finalized: true,
    message: "Transaction finalized; reload canonical contract state."
  };
  const canonicalWorkflow = {
    id: "trace-1001",
    objective: "Canonical test workflow",
    sponsor: "0x1111111111111111111111111111111111111111",
    sponsorLabel: "Sponsor",
    role: "provider" as const,
    status: "OPEN" as const,
    poolGen: 2,
    nextAction: "Submit accepted evidence",
    consequence: "No finalized consequence.",
    steps: [
      {
        id: "step-plan",
        title: "Trip plan",
        provider: "0x2222222222222222222222222222222222222222",
        providerLabel: "Provider",
        promise: "Produce the plan",
        dependencies: [],
        feeGen: 1,
        bondGen: 1,
        accepted: true,
        evidenceUrl: "https://evidence.example/original-plan.json",
        digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        class: "PENDING" as const
      }
    ]
  };
  const adapter = {
    listWorkflows: vi.fn().mockResolvedValue([]),
    getWorkflow: vi.fn().mockResolvedValue(canonicalWorkflow),
    getCredits: vi.fn().mockResolvedValue({ address: "", totalAvailableGen: 0, lines: [] }),
    createWorkflow: vi.fn().mockResolvedValue(finalized),
    acceptStep: vi.fn().mockResolvedValue(finalized),
    submitEvidence: vi.fn().mockResolvedValue(finalized),
    lockEvidence: vi.fn().mockResolvedValue(finalized),
    requestReview: vi.fn().mockResolvedValue(finalized),
    retryReview: vi.fn().mockResolvedValue(finalized),
    cancelWorkflow: vi.fn().mockResolvedValue(finalized),
    withdrawCredit: vi.fn().mockResolvedValue(finalized)
  };
  return {
    adapter,
    createAdapter: vi.fn(() => adapter)
  };
});

vi.mock("./adapters/genlayerAdapter", () => ({
  createGenLayerTraceSettleAdapter: mocks.createAdapter
}));

describe("wallet-backed form payloads", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CONTRACT_ADDRESS", "0x1234567890123456789012345678901234567890");
    vi.stubGlobal("ethereum", {
      request: vi.fn().mockResolvedValue(["0x2222222222222222222222222222222222222222"])
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("submits the objective typed by the sponsor with exactly 2 GEN", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/new"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const objective = screen.getByRole("textbox", { name: "Workflow objective" });
    await user.clear(objective);
    await user.type(objective, "Settle the edited workflow objective");
    await user.click(screen.getByRole("button", { name: "Submit workflow transaction" }));

    await waitFor(() =>
      expect(mocks.adapter.createWorkflow).toHaveBeenCalledWith({
        objective: "Settle the edited workflow objective",
        providerAddresses: ["0x2222222222222222222222222222222222222222"],
        poolGen: 2
      })
    );
  });

  it("submits the URL and digest typed by the accepted provider", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/trace-1001/evidence/step-plan"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const artifactUrl = await screen.findByRole("textbox", { name: "Artifact URL" });
    const digest = screen.getByRole("textbox", { name: "Artifact digest" });
    await user.clear(artifactUrl);
    await user.type(artifactUrl, "https://evidence.example/edited-plan.json");
    await user.clear(digest);
    await user.type(
      digest,
      "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    );
    await user.click(screen.getByRole("button", { name: "Submit evidence transaction" }));

    await waitFor(() =>
      expect(mocks.adapter.submitEvidence).toHaveBeenCalledWith({
        workflowId: "trace-1001",
        stepId: "step-plan",
        artifactUrl: "https://evidence.example/edited-plan.json",
        digest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      })
    );
  });
});

import type { CreditsView, WorkflowSummary } from "./types";

export const fixtureProviderAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

export const workflows: WorkflowSummary[] = [
  {
    id: "trace-1001",
    objective:
      "Produce a verified travel-planning workflow with itinerary, reservation handoff, and cancellation notes.",
    sponsor: "0x1111111111111111111111111111111111111111",
    sponsorLabel: "Northstar Labs",
    role: "sponsor",
    status: "OPEN",
    poolGen: 2,
    nextAction: "Wait for provider evidence",
    consequence: "No settlement has been requested.",
    steps: [
      {
        id: "step-plan",
        title: "Trip plan",
        provider: "0x2222222222222222222222222222222222222222",
        providerLabel: "Atlas Agent",
        promise: "Return a bounded itinerary that satisfies the sponsor objective.",
        dependencies: [],
        feeGen: 0.7,
        bondGen: 1,
        accepted: true,
        evidenceUrl: "https://example.com/tracesettle/trace-1001/plan.json",
        digest: "sha256:8ed3f6ad685b959ead7022518e1af76cd816f8e8ec7ccd1da1d3d3d8227784aa",
        class: "PENDING"
      },
      {
        id: "step-build",
        title: "Reservation handoff",
        provider: fixtureProviderAddress,
        providerLabel: "Harbor Booking Agent",
        promise: "Use the trip plan to produce booking-ready handoff notes.",
        dependencies: ["step-plan"],
        feeGen: 0.8,
        bondGen: 1,
        accepted: false,
        class: "PENDING"
      },
      {
        id: "step-cancel",
        title: "Cancellation notes",
        provider: "0x3333333333333333333333333333333333333333",
        providerLabel: "Fallback Policy Agent",
        promise: "Add bounded cancellation rules from upstream reservation notes.",
        dependencies: ["step-build"],
        feeGen: 0.5,
        bondGen: 1,
        accepted: false,
        class: "PENDING"
      }
    ]
  },
  {
    id: "trace-0998",
    objective: "Classify a failed MCP build chain and credit the blocked downstream provider.",
    sponsor: "0x4444444444444444444444444444444444444444",
    sponsorLabel: "ForgeOps",
    role: "provider",
    status: "RETRYABLE",
    poolGen: 2,
    nextAction: "Evidence source needs retry",
    consequence: "No penalty has been applied because the source was unverifiable.",
    steps: []
  },
  {
    id: "trace-0991",
    objective: "Settle a DAO scheduler workflow after one provider introduced a material fault.",
    sponsor: "0x5555555555555555555555555555555555555555",
    sponsorLabel: "Civic Queue",
    role: "provider",
    status: "SETTLED",
    poolGen: 2,
    nextAction: "Withdraw available credit",
    consequence: "You have 1.3 GEN available from returned bond and earned fee.",
    steps: []
  }
];

export const credits: CreditsView = {
  address: fixtureProviderAddress,
  totalAvailableGen: 1.3,
  lines: [
    {
      workflowId: "trace-0991",
      reason: "Returned provider bond",
      amountGen: 1,
      status: "available"
    },
    {
      workflowId: "trace-0991",
      reason: "Earned fee after settlement",
      amountGen: 0.3,
      status: "available"
    }
  ]
};

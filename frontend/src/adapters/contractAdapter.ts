import type {
  ActionName,
  ActionVisibilityInput,
  TraceSettleAdapter,
  UserStatus,
  WorkflowStatus
} from "../domain/types";

const statusCopy: Record<WorkflowStatus, UserStatus> = {
  DRAFT: {
    label: "Draft setup",
    tone: "neutral",
    nextStep: "Finish the workflow terms and activate it."
  },
  OPEN: {
    label: "Waiting for evidence",
    tone: "info",
    nextStep: "Providers can accept their steps and submit artifacts."
  },
  EVIDENCE_LOCKED: {
    label: "Evidence locked",
    tone: "info",
    nextStep: "Request review when you are ready for validator judgment."
  },
  REVIEW_PENDING: {
    label: "Review in progress",
    tone: "info",
    nextStep: "Wait for the accepted or finalized result."
  },
  RETRYABLE: {
    label: "Retryable",
    tone: "warning",
    nextStep: "Fix the evidence issue or cancel safely."
  },
  SETTLED: {
    label: "Settled",
    tone: "success",
    nextStep: "Withdraw any available credit."
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "neutral",
    nextStep: "Unsettled funds and bonds return to their owners."
  }
};

const legalStatuses: Record<ActionName, WorkflowStatus[]> = {
  createWorkflow: ["DRAFT"],
  addStep: ["DRAFT"],
  activateWorkflow: ["DRAFT"],
  acceptStep: ["OPEN"],
  submitEvidence: ["OPEN"],
  lockEvidence: ["OPEN"],
  requestReview: ["EVIDENCE_LOCKED", "RETRYABLE"],
  retryReview: ["RETRYABLE"],
  cancelWorkflow: ["DRAFT", "OPEN", "RETRYABLE"],
  withdrawCredit: ["SETTLED", "CANCELLED"]
};

const roleActions: Record<string, ActionName[]> = {
  sponsor: [
    "createWorkflow",
    "addStep",
    "activateWorkflow",
    "lockEvidence",
    "requestReview",
    "retryReview",
    "cancelWorkflow"
  ],
  provider: ["acceptStep", "submitEvidence", "withdrawCredit"],
  observer: []
};

export function toUserStatus(status: WorkflowStatus): UserStatus {
  return statusCopy[status];
}

export function isActionVisible(input: ActionVisibilityInput): boolean {
  if (!roleActions[input.role].includes(input.action)) {
    return false;
  }
  if (!legalStatuses[input.action].includes(input.status)) {
    return false;
  }
  if (input.action === "withdrawCredit") {
    return input.hasCredit === true;
  }
  if (input.action === "submitEvidence") {
    return input.acceptedStep !== false;
  }
  return true;
}

export function unavailableAdapter(message: string): TraceSettleAdapter {
  async function reject(): Promise<never> {
    throw new Error(message);
  }
  return {
    listWorkflows: reject,
    getWorkflow: reject,
    getCredits: reject,
    createWorkflow: reject,
    acceptStep: reject,
    submitEvidence: reject,
    lockEvidence: reject,
    requestReview: reject,
    retryReview: reject,
    cancelWorkflow: reject,
    withdrawCredit: reject
  };
}

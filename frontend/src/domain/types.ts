export type WorkflowStatus =
  | "DRAFT"
  | "OPEN"
  | "EVIDENCE_LOCKED"
  | "REVIEW_PENDING"
  | "RETRYABLE"
  | "SETTLED"
  | "CANCELLED";

export type StepClass =
  | "PENDING"
  | "SATISFIED"
  | "MATERIAL_FAULT"
  | "DOWNSTREAM_BLOCKED"
  | "UNVERIFIABLE";

export type UserRole = "sponsor" | "provider" | "observer";

export type ActionName =
  | "createWorkflow"
  | "addStep"
  | "activateWorkflow"
  | "acceptStep"
  | "submitEvidence"
  | "lockEvidence"
  | "requestReview"
  | "retryReview"
  | "cancelWorkflow"
  | "withdrawCredit";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export interface UserStatus {
  label: string;
  tone: Tone;
  nextStep: string;
}

export interface ActionVisibilityInput {
  role: UserRole;
  status: WorkflowStatus;
  action: ActionName;
  hasCredit?: boolean;
  acceptedStep?: boolean;
}

export interface StepSummary {
  id: string;
  title: string;
  provider: string;
  providerLabel: string;
  promise: string;
  dependencies: string[];
  feeGen: number;
  bondGen: number;
  accepted: boolean;
  evidenceUrl?: string;
  digest?: string;
  class: StepClass;
}

export interface WorkflowSummary {
  id: string;
  objective: string;
  sponsor: string;
  sponsorLabel: string;
  role: UserRole;
  status: WorkflowStatus;
  poolGen: number;
  nextAction: string;
  consequence: string;
  steps: StepSummary[];
}

export interface CreditLine {
  workflowId: string;
  reason: string;
  amountGen: number;
  status: "available" | "pending" | "withdrawn";
}

export interface CreditsView {
  address: string;
  totalAvailableGen: number;
  lines: CreditLine[];
}

export interface CreateWorkflowInput {
  objective: string;
  poolGen: 2;
}

export interface StepActionInput {
  workflowId: string;
  stepId: string;
}

export interface AddStepInput extends StepActionInput {
  provider: string;
  promise: string;
  dependencies: string[];
  feeWeight: number;
}

export interface SubmitEvidenceInput extends StepActionInput {
  artifactUrl: string;
  digest: string;
}

export interface TransactionResult {
  id: string;
  submitted: boolean;
  finalized: boolean;
  message: string;
}

export interface TraceSettleAdapter {
  listWorkflows(address: string): Promise<WorkflowSummary[]>;
  getWorkflow(id: string): Promise<WorkflowSummary | undefined>;
  getCredits(address: string): Promise<CreditsView>;
  createWorkflow(input: CreateWorkflowInput): Promise<TransactionResult>;
  addStep(input: AddStepInput): Promise<TransactionResult>;
  activateWorkflow(id: string): Promise<TransactionResult>;
  acceptStep(input: StepActionInput): Promise<TransactionResult>;
  submitEvidence(input: SubmitEvidenceInput): Promise<TransactionResult>;
  lockEvidence(id: string): Promise<TransactionResult>;
  requestReview(id: string): Promise<TransactionResult>;
  retryReview(id: string): Promise<TransactionResult>;
  cancelWorkflow(id: string): Promise<TransactionResult>;
  withdrawCredit(address: string): Promise<TransactionResult>;
}

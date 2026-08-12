import { credits, workflows } from "../domain/fixtures";
import type {
  CreateWorkflowInput,
  StepActionInput,
  SubmitEvidenceInput,
  TraceSettleAdapter,
  TransactionResult
} from "../domain/types";

function result(message: string): TransactionResult {
  return {
    id: "fixture-transaction",
    submitted: false,
    finalized: false,
    message
  };
}

export function createFixtureAdapter(): TraceSettleAdapter {
  return {
    async listWorkflows() {
      return workflows;
    },
    async getWorkflow(id: string) {
      return workflows.find((workflow) => workflow.id === id);
    },
    async getCredits() {
      return credits;
    },
    async createWorkflow(input: CreateWorkflowInput) {
      return result(`Workflow draft ready for ${input.poolGen} GEN funding.`);
    },
    async acceptStep(input: StepActionInput) {
      return result(`Step ${input.stepId} requires a real wallet transaction.`);
    },
    async submitEvidence(input: SubmitEvidenceInput) {
      return result(`Evidence ${input.artifactUrl} requires a real wallet transaction.`);
    },
    async lockEvidence(id: string) {
      return result(`Workflow ${id} evidence lock requires a real wallet transaction.`);
    },
    async requestReview(id: string) {
      return result(`Workflow ${id} review requires a real wallet transaction.`);
    },
    async retryReview(id: string) {
      return result(`Workflow ${id} retry requires a real wallet transaction.`);
    },
    async cancelWorkflow(id: string) {
      return result(`Workflow ${id} cancellation requires a real wallet transaction.`);
    },
    async withdrawCredit(address: string) {
      return result(`Credit withdrawal for ${address} requires a real wallet transaction.`);
    }
  };
}

import { chains, createClient } from "genlayer-js";
import type {
  CreateWorkflowInput,
  CreditsView,
  StepActionInput,
  SubmitEvidenceInput,
  TraceSettleAdapter,
  TransactionResult,
  WorkflowStatus,
  WorkflowSummary
} from "../domain/types";
import type { Eip1193Provider } from "./wallet";

export const GEN = 10n ** 18n;

type ContractRead = Record<string, unknown>;

interface GenLayerClientLike {
  readContract(args: Record<string, unknown>): Promise<unknown>;
  writeContract(args: Record<string, unknown>): Promise<`0x${string}` | string>;
  waitForTransactionReceipt(args: Record<string, unknown>): Promise<Record<string, unknown>>;
}

interface AdapterOptions {
  address: `0x${string}`;
  account: `0x${string}`;
  provider?: Eip1193Provider;
  client?: GenLayerClientLike;
}

function createSdkClient(options: AdapterOptions): GenLayerClientLike {
  return createClient({
    chain: chains.studionet,
    account: options.account,
    provider: options.provider as never
  }) as unknown as GenLayerClientLike;
}

function asRecord(value: unknown): ContractRead {
  return typeof value === "object" && value !== null ? (value as ContractRead) : {};
}

function genFromBaseUnits(value: unknown): number {
  if (typeof value !== "string" || value.length === 0) {
    return 0;
  }
  return Number(BigInt(value) / GEN);
}

function toWorkflowSummary(id: string, raw: ContractRead): WorkflowSummary | undefined {
  if (Object.keys(raw).length === 0) {
    return undefined;
  }
  return {
    id,
    objective: String(raw.objective ?? ""),
    sponsor: String(raw.sponsor ?? ""),
    sponsorLabel: "Sponsor",
    role: "observer",
    status: String(raw.status ?? "DRAFT") as WorkflowStatus,
    poolGen: genFromBaseUnits(raw.pool),
    nextAction: "Reload canonical contract state after every finalized transaction.",
    consequence:
      raw.settled === true
        ? "Workflow has settled onchain."
        : "No finalized settlement consequence is shown yet.",
    steps: []
  };
}

function statusName(receipt: Record<string, unknown>): string {
  return String(receipt.statusName ?? receipt.status ?? "").toUpperCase();
}

async function waitForFinality(
  client: GenLayerClientLike,
  hash: `0x${string}` | string
): Promise<TransactionResult> {
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: "FINALIZED"
  });
  const finalized = statusName(receipt) === "FINALIZED";
  return {
    id: hash,
    submitted: true,
    finalized,
    message: finalized
      ? "Transaction finalized; reload canonical contract state."
      : "Transaction accepted; wait for finality before relying on state."
  };
}

export function createGenLayerTraceSettleAdapter(options: AdapterOptions): TraceSettleAdapter {
  const client = options.client ?? createSdkClient(options);

  async function readWorkflow(id: string) {
    return asRecord(
      await client.readContract({
        address: options.address,
        functionName: "get_workflow",
        args: [id],
        jsonSafeReturn: true
      })
    );
  }

  async function write(functionName: string, args: unknown[], value = 0n) {
    const hash = await client.writeContract({
      address: options.address,
      functionName,
      args,
      value
    });
    return waitForFinality(client, hash);
  }

  return {
    async listWorkflows() {
      const ids = await client.readContract({
        address: options.address,
        functionName: "list_workflows",
        args: [0, 100],
        jsonSafeReturn: true
      });
      if (!Array.isArray(ids)) {
        return [];
      }
      const workflows = await Promise.all(ids.map((id) => this.getWorkflow(String(id))));
      return workflows.filter((workflow): workflow is WorkflowSummary => workflow !== undefined);
    },
    async getWorkflow(id: string) {
      return toWorkflowSummary(id, await readWorkflow(id));
    },
    async getCredits(address: string): Promise<CreditsView> {
      const raw = asRecord(
        await client.readContract({
          address: options.address,
          functionName: "get_credit",
          args: [address],
          jsonSafeReturn: true
        })
      );
      const amountGen = genFromBaseUnits(raw.amount);
      return {
        address,
        totalAvailableGen: amountGen,
        lines:
          amountGen > 0
            ? [
                {
                  workflowId: "canonical-credit-ledger",
                  reason: "Canonical contract credit",
                  amountGen,
                  status: "available"
                }
              ]
            : []
      };
    },
    createWorkflow(input: CreateWorkflowInput) {
      const workflowId = `trace-${Date.now().toString(36)}`;
      return write("create_workflow", [workflowId, input.objective], BigInt(input.poolGen) * GEN);
    },
    acceptStep(input: StepActionInput) {
      return write("accept_step", [input.workflowId, input.stepId], GEN);
    },
    submitEvidence(input: SubmitEvidenceInput) {
      return write("submit_evidence", [
        input.workflowId,
        input.stepId,
        input.artifactUrl,
        input.digest
      ]);
    },
    lockEvidence(id: string) {
      return write("lock_evidence", [id]);
    },
    requestReview(id: string) {
      return write("request_review", [id]);
    },
    retryReview(id: string) {
      return write("retry_review", [id]);
    },
    cancelWorkflow(id: string) {
      return write("cancel_workflow", [id]);
    },
    withdrawCredit() {
      return write("withdraw_credit", []);
    }
  };
}

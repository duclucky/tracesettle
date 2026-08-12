import { describe, expect, it, vi } from "vitest";
import { GEN, createGenLayerTraceSettleAdapter } from "./genlayerAdapter";

function createClientStub() {
  return {
    readContract: vi.fn(),
    writeContract: vi.fn(),
    waitForTransactionReceipt: vi.fn()
  };
}

describe("GenLayer TraceSettle adapter", () => {
  it("reads canonical workflow state from the configured contract", async () => {
    const client = createClientStub();
    client.readContract
      .mockResolvedValueOnce({
        objective: "Ship a bounded workflow",
        sponsor: "0x1111111111111111111111111111111111111111",
        status: "OPEN",
        pool: "2000000000000000000",
        settled: false,
        cancelled: false
      })
      .mockResolvedValueOnce("step-plan,step-build")
      .mockResolvedValueOnce({
        provider: "0x3333333333333333333333333333333333333333",
        promise: "Plan the workflow",
        dependencies: "",
        bond: "1000000000000000000",
        accepted: true,
        evidence_url: "https://example.com/plan.json",
        digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        step_class: "SATISFIED"
      })
      .mockResolvedValueOnce({
        provider: "0x4444444444444444444444444444444444444444",
        promise: "Build the workflow",
        dependencies: "step-plan",
        bond: "0",
        accepted: false,
        evidence_url: "",
        digest: "",
        step_class: "PENDING"
      });
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await expect(adapter.getWorkflow("trace-1")).resolves.toMatchObject({
      id: "trace-1",
      objective: "Ship a bounded workflow",
      status: "OPEN",
      poolGen: 2
    });
    expect(client.readContract).toHaveBeenNthCalledWith(1, {
      address: "0x1234567890123456789012345678901234567890",
      functionName: "get_workflow",
      args: ["trace-1"],
      jsonSafeReturn: true
    });
    expect(client.readContract).toHaveBeenNthCalledWith(2, {
      address: "0x1234567890123456789012345678901234567890",
      functionName: "get_workflow_step_ids",
      args: ["trace-1"],
      jsonSafeReturn: true
    });
    expect(client.readContract).toHaveBeenNthCalledWith(3, {
      address: "0x1234567890123456789012345678901234567890",
      functionName: "get_step",
      args: ["trace-1", "step-plan"],
      jsonSafeReturn: true
    });
  });

  it("submits create workflow with exactly 2 GEN and waits for finality", async () => {
    const client = createClientStub();
    client.writeContract.mockResolvedValue("0xabc");
    client.waitForTransactionReceipt.mockResolvedValue({ statusName: "FINALIZED" });
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await expect(
      adapter.createWorkflow({
        objective: "Ship a bounded workflow",
        providerAddresses: ["0x3333333333333333333333333333333333333333"],
        poolGen: 2
      })
    ).resolves.toEqual({
      id: "0xabc",
      submitted: true,
      finalized: true,
      message: "Transaction finalized; reload canonical contract state."
    });
    expect(client.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: "0x1234567890123456789012345678901234567890",
        functionName: "create_workflow",
        value: 2n * GEN
      })
    );
    expect(client.waitForTransactionReceipt).toHaveBeenCalledWith({
      hash: "0xabc",
      status: "FINALIZED"
    });
  });

  it("keeps accepted-but-not-finalized transactions visibly incomplete", async () => {
    const client = createClientStub();
    client.writeContract.mockResolvedValue("0xdef");
    client.waitForTransactionReceipt.mockResolvedValue({ statusName: "ACCEPTED" });
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await expect(adapter.lockEvidence("trace-1")).resolves.toEqual({
      id: "0xdef",
      submitted: true,
      finalized: false,
      message: "Transaction accepted; wait for finality before relying on state."
    });
  });

  it("uses 1 GEN for provider bond acceptance", async () => {
    const client = createClientStub();
    client.writeContract.mockResolvedValue("0x123");
    client.waitForTransactionReceipt.mockResolvedValue({ statusName: "FINALIZED" });
    const adapter = createGenLayerTraceSettleAdapter({
      address: "0x1234567890123456789012345678901234567890",
      account: "0x2222222222222222222222222222222222222222",
      client
    });

    await adapter.acceptStep({ workflowId: "trace-1", stepId: "step-build" });

    expect(client.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "accept_step",
        args: ["trace-1", "step-build"],
        value: GEN
      })
    );
  });
});

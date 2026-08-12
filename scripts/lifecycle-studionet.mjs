import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createAccount, createClient } from "genlayer-js";
import { CalldataAddress } from "genlayer-js/types";
import { studionet } from "genlayer-js/chains";
import { deploymentPath, discoverEnv, projectRoot } from "./deploy-common.mjs";
import { summarizeReceipt } from "./receipt-parser.mjs";

const GEN = 10n ** 18n;
const workflowId = "trace-live-20260812-c";
const lifecyclePath = resolve(projectRoot, "docs", "evidence", "studionet", "lifecycle.json");

const evidence = {
  "step-plan": {
    url: "https://gist.githubusercontent.com/duclucky/a50b8d34dfe2e57f3e603910a7f17d72/raw/bbebb23e63c818c5b920d4212a1d1448dcf5ac36/tracesettle-step-plan.txt",
    digest: "sha256:8a423d978dcee3b4a6fdb6bc1d75981101b14281058e9b7b227d1fada02756bf"
  },
  "step-build": {
    url: "https://gist.githubusercontent.com/duclucky/a50b8d34dfe2e57f3e603910a7f17d72/raw/85edad93c9eb26cedfa10da2dc62c68d86923edf/tracesettle-step-build.txt",
    digest: "sha256:d63d0e3b1fc6675d36627563f2c7b75c44fbc22e01142747731cf53e79c3070c"
  }
};

let lastRpcAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttleRpc() {
  const now = Date.now();
  const waitMs = Math.max(0, 2500 - (now - lastRpcAt));
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastRpcAt = Date.now();
}

async function rpc(label, fn) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await throttleRpc();
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("Rate limit exceeded") || attempt === 2) {
        throw error;
      }
      console.log(JSON.stringify({ label: "rate limit backoff", operation: label, wait_seconds: 65 }));
      await sleep(65000);
    }
  }
  throw new Error(`RPC retry exhausted: ${label}`);
}

function key(name) {
  const { env } = discoverEnv();
  const raw = env[name];
  if (!raw) {
    throw new Error(`${name} is missing or empty`);
  }
  return raw.startsWith("0x") ? raw : `0x${raw}`;
}

function readDeployment() {
  if (!existsSync(deploymentPath)) {
    throw new Error("Missing deployment.json; run npm run deploy:studionet first");
  }
  return JSON.parse(readFileSync(deploymentPath, "utf8"));
}

function readExistingLifecycle(contractAddress) {
  if (!existsSync(lifecyclePath)) {
    return null;
  }
  const existing = JSON.parse(readFileSync(lifecyclePath, "utf8"));
  if (existing.contract_address === contractAddress && existing.lifecycle_result === "SUCCESS") {
    return existing;
  }
  return null;
}

function genString(baseUnits) {
  return `${Number(BigInt(baseUnits) / GEN)} GEN`;
}

function calldataAddress(address) {
  const hex = address.startsWith("0x") ? address.slice(2) : address;
  const bytes = Uint8Array.from(hex.match(/.{1,2}/g).map((item) => Number.parseInt(item, 16)));
  return new CalldataAddress(bytes);
}

async function wait(client, hash) {
  const receipt = await rpc(`wait accepted ${hash}`, () =>
    client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED",
      interval: 7000,
      retries: 120
    })
  );
  return summarizeReceipt({ ...receipt, transactionHash: hash });
}

async function finalizeAndSummarize(client, hash) {
  const accepted = await wait(client, hash);
  try {
    await rpc(`finalize ${hash}`, () => client.finalizeTransaction({ txId: hash }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("FINALIZED") && !message.includes("finalized")) {
      console.log(JSON.stringify({ label: "finalize notice", tx_hash: hash, message: message.slice(0, 180) }));
    }
  }
  try {
    const finalized = await rpc(`wait finalized ${hash}`, () =>
      client.waitForTransactionReceipt({
        hash,
        status: "FINALIZED",
        interval: 7000,
        retries: 24
      })
    );
    return summarizeReceipt({ ...finalized, transactionHash: hash });
  } catch {
    return accepted;
  }
}

async function writeStep(records, client, address, label, functionName, args, value = 0n) {
  const hash = await rpc(`write ${functionName}`, () =>
    client.writeContract({
      address,
      functionName,
      args,
      value
    })
  );
  console.log(JSON.stringify({ label: `${label} submitted`, functionName, tx_hash: hash, value_gen: value === 0n ? "0 GEN" : `${value / GEN} GEN` }));
  const receipt = await finalizeAndSummarize(client, hash);
  const record = {
    label,
    functionName,
    tx_hash: receipt.tx_hash,
    status: receipt.status,
    consensus_result: receipt.result,
    value_gen: value === 0n ? "0 GEN" : `${value / GEN} GEN`
  };
  records.push(record);
  console.log(JSON.stringify(record));
  return record;
}

async function read(client, address, functionName, args) {
  return rpc(`read ${functionName}`, () =>
    client.readContract({
      address,
      functionName,
      args,
      jsonSafeReturn: true
    })
  );
}

const deployment = readDeployment();
const contractAddress = deployment.contract_address;
const existing = readExistingLifecycle(contractAddress);

const sponsor = createAccount(key("STUDIONET_PRIVATE_KEY"));
const provider = createAccount(key("STUDIONET_INTEGRATOR_PRIVATE_KEY"));
const sponsorClient = createClient({ chain: studionet, account: sponsor });
const providerClient = createClient({ chain: studionet, account: provider });
const records = existing?.records ? [...existing.records] : [];

console.log(
  JSON.stringify({
    lifecycle: "TraceSettle studionet",
    contract_address: contractAddress,
    workflow_id: workflowId,
    sponsor: sponsor.address,
    provider: provider.address
  })
);

let workflow = await read(sponsorClient, contractAddress, "get_workflow", [workflowId]);
if (!workflow || Object.keys(workflow).length === 0) {
  await writeStep(
    records,
    sponsorClient,
    contractAddress,
    "create funded workflow",
    "create_workflow",
    [workflowId, "Settle a two-step travel planning workflow from public evidence."],
    2n * GEN
  );
  workflow = await read(sponsorClient, contractAddress, "get_workflow", [workflowId]);
}

let plan = await read(sponsorClient, contractAddress, "get_step", [workflowId, "step-plan"]);
if (!plan || Object.keys(plan).length === 0) {
  await writeStep(records, sponsorClient, contractAddress, "add plan step", "add_step", [
    workflowId,
    "step-plan",
    calldataAddress(provider.address),
    "Produce a bounded itinerary that satisfies the sponsor objective.",
    "none",
    1
  ]);
}

let build = await read(sponsorClient, contractAddress, "get_step", [workflowId, "step-build"]);
if (!build || Object.keys(build).length === 0) {
  await writeStep(records, sponsorClient, contractAddress, "add build step", "add_step", [
    workflowId,
    "step-build",
    calldataAddress(provider.address),
    "Use the trip plan to produce booking-ready handoff notes.",
    "step-plan",
    1
  ]);
}

workflow = await read(sponsorClient, contractAddress, "get_workflow", [workflowId]);
if (workflow.status === "DRAFT") {
  await writeStep(records, sponsorClient, contractAddress, "activate workflow", "activate_workflow", [
    workflowId
  ]);
}

for (const stepId of ["step-plan", "step-build"]) {
  const step = await read(providerClient, contractAddress, "get_step", [workflowId, stepId]);
  if (!step.accepted) {
    await writeStep(records, providerClient, contractAddress, `accept ${stepId}`, "accept_step", [
      workflowId,
      stepId
    ], GEN);
  }
}

for (const stepId of ["step-plan", "step-build"]) {
  const step = await read(providerClient, contractAddress, "get_step", [workflowId, stepId]);
  if (step.digest !== evidence[stepId].digest) {
    await writeStep(records, providerClient, contractAddress, `submit evidence ${stepId}`, "submit_evidence", [
      workflowId,
      stepId,
      evidence[stepId].url,
      evidence[stepId].digest
    ]);
  }
}

workflow = await read(sponsorClient, contractAddress, "get_workflow", [workflowId]);
if (workflow.status === "OPEN") {
  await writeStep(records, sponsorClient, contractAddress, "lock evidence", "lock_evidence", [workflowId]);
}

workflow = await read(sponsorClient, contractAddress, "get_workflow", [workflowId]);
if (workflow.status === "EVIDENCE_LOCKED" || workflow.status === "RETRYABLE") {
  await writeStep(records, sponsorClient, contractAddress, "request review", "request_review", [workflowId]);
}

workflow = await read(sponsorClient, contractAddress, "get_workflow", [workflowId]);
const attempt = await read(sponsorClient, contractAddress, "get_attempt", [workflowId]);
const finalStepIdsRaw = await read(sponsorClient, contractAddress, "get_workflow_step_ids", [workflowId]);
const finalStepIds = String(finalStepIdsRaw ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const finalSteps = {};
for (const stepId of finalStepIds) {
  finalSteps[stepId] = await read(sponsorClient, contractAddress, "get_step", [workflowId, stepId]);
}
const providerCreditBefore = await read(providerClient, contractAddress, "get_credit", [
  calldataAddress(provider.address)
]);

let providerCreditAfter = providerCreditBefore;
if (workflow.status === "SETTLED" && BigInt(providerCreditBefore.amount ?? "0") > 0n) {
  await writeStep(records, providerClient, contractAddress, "withdraw provider credit", "withdraw_credit", []);
  providerCreditAfter = await read(providerClient, contractAddress, "get_credit", [
    calldataAddress(provider.address)
  ]);
}

const lifecycle = {
  network: "studionet",
  contract_address: contractAddress,
  workflow_id: workflowId,
  sponsor: sponsor.address,
  provider: provider.address,
  evidence,
  records,
  final_workflow: workflow,
  final_attempt: attempt,
  final_step_ids: finalStepIds,
  final_steps: finalSteps,
  provider_credit_before_withdraw_gen:
    existing?.provider_credit_before_withdraw_gen ?? genString(providerCreditBefore.amount ?? "0"),
  provider_credit_after_withdraw_gen: genString(providerCreditAfter.amount ?? "0"),
  lifecycle_result:
    workflow.status === "SETTLED" && BigInt(providerCreditAfter.amount ?? "0") === 0n
      ? "SUCCESS"
      : "NEEDS_ATTENTION",
  captured_at: new Date().toISOString(),
  evidence_limit: "allowlisted lifecycle fields only; full receipts intentionally not stored"
};

mkdirSync(dirname(lifecyclePath), { recursive: true });
writeFileSync(lifecyclePath, `${JSON.stringify(lifecycle, null, 2)}\n`);
console.log(
  JSON.stringify({
    lifecycle_result: lifecycle.lifecycle_result,
    final_status: workflow.status,
    verdict: attempt.verdict,
    provider_credit_before_withdraw_gen: lifecycle.provider_credit_before_withdraw_gen,
    provider_credit_after_withdraw_gen: lifecycle.provider_credit_after_withdraw_gen
  })
);

if (lifecycle.lifecycle_result !== "SUCCESS") {
  throw new Error("Lifecycle did not settle and withdraw successfully");
}

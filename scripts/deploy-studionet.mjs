import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import {
  authorizedAccount,
  contractIdentity,
  contractPath,
  deploymentPath,
  gitIdentity,
  publicPreflight
} from "./deploy-common.mjs";
import { assertPublicReceiptSummary, summarizeReceipt } from "./receipt-parser.mjs";

function readExisting() {
  if (!existsSync(deploymentPath)) {
    return null;
  }
  return JSON.parse(readFileSync(deploymentPath, "utf8"));
}

const preflight = publicPreflight();
console.log(JSON.stringify({ preflight }, null, 2));

const git = gitIdentity();
if (!git.clean && process.env.ALLOW_DIRTY_DEPLOY !== "1") {
  throw new Error("Refusing to deploy a dirty worktree. Commit or set ALLOW_DIRTY_DEPLOY=1 for diagnostics.");
}

const contract = contractIdentity();
const existing = readExisting();
if (
  existing &&
  existing.network === "studionet" &&
  existing.commit === git.commit &&
  existing.contract?.source_sha256 === contract.source_sha256 &&
  existing.status === "FINALIZED" &&
  existing.result === "SUCCESS" &&
  existing.contract_address
) {
  console.log(
    JSON.stringify(
      {
        reused: true,
        contract_address: existing.contract_address,
        tx_hash: existing.tx_hash
      },
      null,
      2
    )
  );
  process.exit(0);
}

const { account } = authorizedAccount();
const code = readFileSync(contractPath, "utf8");
const client = createClient({ chain: studionet, account });

const txHash = await client.deployContract({ code });
const receipt = await client.waitForTransactionReceipt({
  hash: txHash,
  status: "FINALIZED",
  interval: 5000,
  retries: 120
});
const summary = assertPublicReceiptSummary(summarizeReceipt({ ...receipt, transactionHash: txHash }));

const record = {
  network: "studionet",
  commit: git.commit,
  deployer: account.address,
  contract,
  tx_hash: summary.tx_hash,
  status: summary.status,
  result: summary.result,
  contract_address: summary.contract_address,
  captured_at: new Date().toISOString(),
  evidence_limit: "allowlisted deployment identity only; full receipt intentionally not stored"
};

mkdirSync(dirname(deploymentPath), { recursive: true });
writeFileSync(deploymentPath, `${JSON.stringify(record, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      deployed: true,
      tx_hash: record.tx_hash,
      status: record.status,
      result: record.result,
      contract_address: record.contract_address
    },
    null,
    2
  )
);

if (record.status !== "FINALIZED" || record.result !== "SUCCESS" || !record.contract_address) {
  throw new Error("Deployment did not produce a finalized successful contract address");
}

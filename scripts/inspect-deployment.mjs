import { existsSync, readFileSync } from "node:fs";
import { deploymentPath, publicPreflight } from "./deploy-common.mjs";

const preflight = publicPreflight();
let existing = null;
if (existsSync(deploymentPath)) {
  existing = JSON.parse(readFileSync(deploymentPath, "utf8"));
}

console.log(
  JSON.stringify(
    {
      preflight,
      existing: existing
        ? {
            network: existing.network,
            commit: existing.commit,
            contract_address: existing.contract_address,
            status: existing.status,
            consensus_result: existing.consensus_result,
            deployment_result: existing.deployment_result,
            schema_verified: existing.schema_verified
          }
        : null
    },
    null,
    2
  )
);

export function findFirstKey(value, keys) {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  for (const key of keys) {
    if (typeof value[key] === "string" && value[key].length > 0) {
      return value[key];
    }
  }
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findFirstKey(item, keys);
        if (found) {
          return found;
        }
      }
    } else if (child && typeof child === "object") {
      const found = findFirstKey(child, keys);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

export function summarizeReceipt(receipt) {
  const txHash = findFirstKey(receipt, [
    "transaction_hash",
    "transactionHash",
    "hash",
    "tx_hash",
    "txHash"
  ]);
  const status = findFirstKey(receipt, ["statusName", "status_name", "status"]);
  const result = findFirstKey(receipt, ["resultName", "result_name", "result"]);
  const contractAddress = findFirstKey(receipt, [
    "contract_address",
    "contractAddress",
    "deployed_contract_address",
    "deployedContractAddress"
  ]);

  return {
    tx_hash: txHash,
    status,
    result,
    contract_address: contractAddress
  };
}

export function assertPublicReceiptSummary(summary) {
  if (!summary.tx_hash) {
    throw new Error("receipt summary missing transaction hash");
  }
  if (!summary.status) {
    throw new Error("receipt summary missing status");
  }
  return summary;
}

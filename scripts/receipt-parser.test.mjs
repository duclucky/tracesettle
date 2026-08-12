import test from "node:test";
import assert from "node:assert/strict";
import { assertPublicReceiptSummary, summarizeReceipt } from "./receipt-parser.mjs";

test("summarizes raw Studio receipt shape without copying private payload fields", () => {
  const raw = {
    transaction_hash: "0xraw",
    status: "FINALIZED",
    consensus_data: {
      leader_receipt: [
        {
          execution_result: {
            result: "SUCCESS",
            contract_address: "0x1234567890123456789012345678901234567890",
            stdout: "do not copy",
            internal_payload: { private: true }
          }
        }
      ]
    }
  };

  assert.deepEqual(assertPublicReceiptSummary(summarizeReceipt(raw)), {
    tx_hash: "0xraw",
    status: "FINALIZED",
    result: "SUCCESS",
    contract_address: "0x1234567890123456789012345678901234567890"
  });
});

test("summarizes normalized SDK receipt shape", () => {
  const normalized = {
    transactionHash: "0xsdk",
    statusName: "FINALIZED",
    resultName: "SUCCESS",
    data: {
      deployedContractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    }
  };

  assert.deepEqual(assertPublicReceiptSummary(summarizeReceipt(normalized)), {
    tx_hash: "0xsdk",
    status: "FINALIZED",
    result: "SUCCESS",
    contract_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
  });
});

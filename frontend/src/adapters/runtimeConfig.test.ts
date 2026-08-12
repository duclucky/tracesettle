import { describe, expect, it } from "vitest";
import { resolveRuntimeConfig } from "./runtimeConfig";

describe("runtime config", () => {
  it("marks the frontend as preview-only until a deployed contract address is configured", () => {
    expect(resolveRuntimeConfig({})).toEqual({
      contractAddress: undefined,
      mode: "preview",
      reason: "Missing VITE_CONTRACT_ADDRESS"
    });
  });

  it("accepts a configured contract address for live mode", () => {
    expect(
      resolveRuntimeConfig({
        VITE_CONTRACT_ADDRESS: "0x1234567890123456789012345678901234567890"
      })
    ).toEqual({
      contractAddress: "0x1234567890123456789012345678901234567890",
      mode: "live",
      reason: undefined
    });
  });

  it("rejects malformed contract addresses instead of silently using fixture state", () => {
    expect(resolveRuntimeConfig({ VITE_CONTRACT_ADDRESS: "trace-1001" })).toEqual({
      contractAddress: undefined,
      mode: "preview",
      reason: "Invalid VITE_CONTRACT_ADDRESS"
    });
  });
});

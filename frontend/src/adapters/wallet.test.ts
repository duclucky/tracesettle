import { describe, expect, it, vi } from "vitest";
import { connectInjectedWallet, detectInjectedWallet, shortenAddress } from "./wallet";

describe("wallet adapter", () => {
  it("reports missing browser wallet honestly", () => {
    expect(detectInjectedWallet({})).toEqual({
      status: "missing",
      provider: undefined,
      label: "No browser wallet detected"
    });
  });

  it("detects an injected EIP-1193 wallet provider", () => {
    const provider = { request: vi.fn() };

    expect(detectInjectedWallet({ ethereum: provider })).toEqual({
      status: "available",
      provider,
      label: "Browser wallet available"
    });
  });

  it("requests accounts from the selected wallet", async () => {
    const request = vi.fn().mockResolvedValue(["0x1234567890123456789012345678901234567890"]);

    await expect(connectInjectedWallet({ request })).resolves.toEqual({
      address: "0x1234567890123456789012345678901234567890",
      status: "connected"
    });
    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
  });

  it("does not accept an empty wallet response as a connected state", async () => {
    const request = vi.fn().mockResolvedValue([]);

    await expect(connectInjectedWallet({ request })).resolves.toEqual({
      address: undefined,
      status: "rejected"
    });
  });

  it("shortens addresses only for display", () => {
    expect(shortenAddress("0x1234567890123456789012345678901234567890")).toBe("0x1234...7890");
  });
});

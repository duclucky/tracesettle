import { describe, expect, it, vi } from "vitest";
import {
  connectInjectedWallet,
  detectInjectedWallet,
  discoverInjectedWallet,
  shortenAddress,
  type WalletEnvironment
} from "./wallet";

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

  it("discovers a provider announced through EIP-6963", async () => {
    const provider = { request: vi.fn() };
    const target = new EventTarget();
    target.addEventListener("eip6963:requestProvider", () => {
      target.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: { info: { name: "OKX Wallet" }, provider }
        })
      );
    });

    await expect(
      discoverInjectedWallet(target as WalletEnvironment, 0)
    ).resolves.toEqual({
      status: "available",
      provider,
      label: "OKX Wallet available"
    });
  });

  it("uses a valid multi-provider fallback", async () => {
    const provider = { request: vi.fn() };

    await expect(
      discoverInjectedWallet({ ethereum: { providers: [{}, provider] } }, 0)
    ).resolves.toEqual({
      status: "available",
      provider,
      label: "Browser wallet available"
    });
  });

  it("uses a wallet-specific nested EIP-1193 provider", async () => {
    const provider = { request: vi.fn() };

    await expect(
      discoverInjectedWallet({ okxwallet: { ethereum: provider } }, 0)
    ).resolves.toEqual({
      status: "available",
      provider,
      label: "OKX Wallet available"
    });
  });

  it("ignores invalid announced and legacy candidates", async () => {
    const target = new EventTarget() as WalletEnvironment;
    target.ethereum = {};
    target.phantom = { ethereum: {} };
    target.addEventListener?.("eip6963:requestProvider", () => {
      target.dispatchEvent?.(
        new CustomEvent("eip6963:announceProvider", {
          detail: { info: { name: "Fake Wallet" }, provider: {} }
        })
      );
    });

    await expect(discoverInjectedWallet(target, 0)).resolves.toEqual({
      status: "missing",
      provider: undefined,
      label: "No browser wallet detected"
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

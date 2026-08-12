import { useMemo, useState } from "react";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import {
  connectInjectedWallet,
  detectInjectedWallet,
  shortenAddress,
  type Eip1193Provider
} from "../adapters/wallet";

export function WalletStatus() {
  const runtime = resolveRuntimeConfig(import.meta.env);
  const detection = useMemo(
    () =>
      detectInjectedWallet(
        typeof window === "undefined" ? {} : (window as Window & { ethereum?: unknown })
      ),
    []
  );
  const [provider] = useState<Eip1193Provider | undefined>(detection.provider);
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | undefined>();

  async function connectWallet() {
    if (!provider) {
      setError("No browser wallet detected");
      return;
    }
    try {
      const result = await connectInjectedWallet(provider);
      setAddress(result.address);
      setError(result.status === "rejected" ? "Wallet did not return an account" : undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wallet request failed");
    }
  }

  return (
    <div className="wallet-status" aria-label="Wallet and network status">
      <span className="status-dot" aria-hidden="true" />
      <span>Studionet</span>
      {address ? (
        <span className="mono">{shortenAddress(address)}</span>
      ) : (
        <button className="link-button" type="button" onClick={connectWallet}>
          Connect wallet
        </button>
      )}
      {runtime.mode === "preview" && <span>{runtime.reason}</span>}
      {detection.status === "missing" && <span>{detection.label}</span>}
      {error && <span>{error}</span>}
    </div>
  );
}

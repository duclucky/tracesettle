import { useEffect, useMemo, useState } from "react";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import {
  connectInjectedWallet,
  detectInjectedWallet,
  discoverInjectedWallet,
  shortenAddress,
  type WalletEnvironment
} from "../adapters/wallet";

export function WalletStatus() {
  const runtime = resolveRuntimeConfig(import.meta.env);
  const environment = useMemo<WalletEnvironment>(
    () => (typeof window === "undefined" ? {} : (window as unknown as WalletEnvironment)),
    []
  );
  const initialDetection = useMemo(() => detectInjectedWallet(environment), [environment]);
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [statusMessage, setStatusMessage] = useState(initialDetection.label);

  useEffect(() => {
    let active = true;
    void discoverInjectedWallet(environment).then((result) => {
      if (active) {
        setStatusMessage(result.label);
      }
    });
    return () => {
      active = false;
    };
  }, [environment]);

  async function connectWallet() {
    const detection = await discoverInjectedWallet(environment);
    setStatusMessage(detection.label);
    if (!detection.provider) {
      return;
    }
    try {
      const result = await connectInjectedWallet(detection.provider);
      setAddress(result.address);
      setStatusMessage(
        result.status === "connected" ? "Wallet connected" : "Wallet did not return an account"
      );
    } catch (cause) {
      setStatusMessage(cause instanceof Error ? cause.message : "Wallet request failed");
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
      <span aria-live="polite">{statusMessage}</span>
    </div>
  );
}

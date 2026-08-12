import { useEffect, useMemo, useState } from "react";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import {
  connectInjectedWallet,
  detectInjectedWallet,
  discoverInjectedWallet,
  readAuthorizedWallet,
  shortenAddress,
  type WalletEnvironment,
  walletRequestErrorMessage
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
    void discoverInjectedWallet(environment).then(async (result) => {
      if (!active) {
        return;
      }
      setStatusMessage(result.label);
      if (!result.provider) {
        return;
      }
      try {
        const connection = await readAuthorizedWallet(result.provider);
        if (!active || !connection.address) {
          return;
        }
        setAddress(connection.address);
        setStatusMessage("Wallet connected");
      } catch {
        if (active) {
          setAddress(undefined);
        }
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
      setStatusMessage(walletRequestErrorMessage(cause));
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

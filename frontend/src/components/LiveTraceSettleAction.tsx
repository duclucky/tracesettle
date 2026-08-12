import { useState } from "react";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import {
  connectInjectedWallet,
  discoverInjectedWallet,
  type WalletEnvironment
} from "../adapters/wallet";
import type { TraceSettleAdapter, TransactionResult } from "../domain/types";
import { TransactionState, type TransactionStage } from "./TransactionState";

interface LiveTraceSettleActionProps {
  children: string;
  className: string;
  disabled?: boolean;
  action(adapter: TraceSettleAdapter, account: `0x${string}`): Promise<TransactionResult>;
  onCanonicalReload?: () => Promise<void> | void;
}

function classifyResult(result: TransactionResult): TransactionStage {
  if (result.finalized) {
    return "finalized";
  }
  if (result.submitted) {
    return "submitted";
  }
  return "failed";
}

export function LiveTraceSettleAction({
  children,
  className,
  disabled = false,
  action,
  onCanonicalReload
}: LiveTraceSettleActionProps) {
  const [stage, setStage] = useState<TransactionStage>("idle");
  const [message, setMessage] = useState<string>("No transaction has been signed from this control.");

  async function runAction() {
    const runtime = resolveRuntimeConfig(import.meta.env);
    if (runtime.mode !== "live" || !runtime.contractAddress) {
      setStage("failed");
      setMessage(`${runtime.reason}. Configure a deployed contract before signing.`);
      return;
    }

    const detection = await discoverInjectedWallet(
      typeof window === "undefined" ? {} : (window as unknown as WalletEnvironment)
    );
    if (!detection.provider) {
      setStage("failed");
      setMessage("No browser wallet detected. No transaction was submitted.");
      return;
    }

    try {
      const wallet = await connectInjectedWallet(detection.provider);
      if (!wallet.address) {
        setStage("failed");
        setMessage("Wallet did not return an account. No transaction was submitted.");
        return;
      }
      setStage("submitted");
      setMessage("Wallet transaction submitted; waiting for GenLayer finality.");
      const { createGenLayerTraceSettleAdapter } = await import("../adapters/genlayerAdapter");
      const adapter = createGenLayerTraceSettleAdapter({
        address: runtime.contractAddress,
        account: wallet.address,
        provider: detection.provider
      });
      const result = await action(adapter, wallet.address);
      setStage(classifyResult(result));
      setMessage(result.message);
      if (result.finalized) {
        await onCanonicalReload?.();
      }
    } catch (cause) {
      setStage("failed");
      setMessage(cause instanceof Error ? cause.message : "Transaction failed before finality.");
    }
  }

  return (
    <div className="stack">
      <button className={className} type="button" onClick={runAction} disabled={disabled}>
        {children}
      </button>
      <TransactionState stage={stage} message={message} />
    </div>
  );
}

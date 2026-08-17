import { useState } from "react";
import { resolveRuntimeConfig } from "../adapters/runtimeConfig";
import {
  connectInjectedWallet,
  discoverInjectedWallet,
  ensureGenLayerEvmNetwork,
  type WalletEnvironment,
  walletRequestErrorMessage
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
  const busy = stage === "wallet" || stage === "submitted";

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
      await ensureGenLayerEvmNetwork(detection.provider, runtime.evmRpcUrl);
      const wallet = await connectInjectedWallet(detection.provider);
      if (!wallet.address) {
        setStage("failed");
        setMessage("Wallet did not return an account. No transaction was submitted.");
        return;
      }
      setStage("wallet");
      setMessage("Approve or reject the request in your wallet. No transaction is claimed yet.");
      const { createGenLayerTraceSettleAdapter } = await import("../adapters/genlayerAdapter");
      const adapter = createGenLayerTraceSettleAdapter({
        address: runtime.contractAddress,
        account: wallet.address,
        provider: detection.provider,
        genlayerRpcUrl: runtime.genlayerRpcUrl,
        evmRpcUrl: runtime.evmRpcUrl
      });
      const result = await action(adapter, wallet.address);
      setStage(classifyResult(result));
      setMessage(result.message);
      if (result.finalized) {
        await onCanonicalReload?.();
      }
    } catch (cause) {
      setStage("failed");
      setMessage(walletRequestErrorMessage(cause, "Transaction failed before finality"));
    }
  }

  return (
    <div className="stack">
      <button
        className={className}
        type="button"
        onClick={runAction}
        disabled={disabled || busy}
      >
        {children}
      </button>
      <TransactionState stage={stage} message={message} />
    </div>
  );
}

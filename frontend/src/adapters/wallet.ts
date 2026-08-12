export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
}

export type WalletDetection =
  | {
      status: "available";
      provider: Eip1193Provider;
      label: "Browser wallet available";
    }
  | {
      status: "missing";
      provider: undefined;
      label: "No browser wallet detected";
    };

export type WalletConnection =
  | {
      status: "connected";
      address: `0x${string}`;
    }
  | {
      status: "rejected";
      address: undefined;
    };

export function detectInjectedWallet(source: { ethereum?: unknown }): WalletDetection {
  const maybeProvider = source.ethereum;
  if (
    typeof maybeProvider === "object" &&
    maybeProvider !== null &&
    "request" in maybeProvider &&
    typeof maybeProvider.request === "function"
  ) {
    return {
      status: "available",
      provider: maybeProvider as Eip1193Provider,
      label: "Browser wallet available"
    };
  }
  return {
    status: "missing",
    provider: undefined,
    label: "No browser wallet detected"
  };
}

export async function connectInjectedWallet(provider: Eip1193Provider): Promise<WalletConnection> {
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (Array.isArray(accounts) && typeof accounts[0] === "string") {
    return {
      status: "connected",
      address: accounts[0] as `0x${string}`
    };
  }
  return {
    status: "rejected",
    address: undefined
  };
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

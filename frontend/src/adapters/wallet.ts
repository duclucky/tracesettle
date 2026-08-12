export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
}

export interface WalletEnvironment {
  ethereum?: unknown;
  okxwallet?: unknown;
  phantom?: unknown;
  rabby?: unknown;
  coinbaseWalletExtension?: unknown;
  addEventListener?(type: string, listener: EventListener): void;
  removeEventListener?(type: string, listener: EventListener): void;
  dispatchEvent?(event: Event): boolean;
}

export type WalletDetection =
  | {
      status: "available";
      provider: Eip1193Provider;
      label: string;
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

function asProvider(candidate: unknown): Eip1193Provider | undefined {
  if (
    typeof candidate === "object" &&
    candidate !== null &&
    "request" in candidate &&
    typeof candidate.request === "function"
  ) {
    return candidate as Eip1193Provider;
  }
  return undefined;
}

function objectProperty(candidate: unknown, property: string): unknown {
  if (typeof candidate !== "object" || candidate === null || !(property in candidate)) {
    return undefined;
  }
  return (candidate as Record<string, unknown>)[property];
}

function available(provider: Eip1193Provider, label: string): WalletDetection {
  return { status: "available", provider, label };
}

function isTransactionRequest(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createBrowserWalletProvider(provider: Eip1193Provider): Eip1193Provider {
  return {
    request(args) {
      if (
        args.method !== "eth_sendTransaction" ||
        !Array.isArray(args.params) ||
        !isTransactionRequest(args.params[0]) ||
        args.params[0].gasPrice !== "0x0"
      ) {
        return provider.request(args);
      }

      const [transaction, ...rest] = args.params;
      return provider.request({
        ...args,
        params: [
          {
            ...transaction,
            gasPrice: "0x1"
          },
          ...rest
        ]
      });
    }
  };
}

export function detectInjectedWallet(source: WalletEnvironment): WalletDetection {
  const directProvider = asProvider(source.ethereum);
  if (directProvider) {
    return available(directProvider, "Browser wallet available");
  }

  const providerList = objectProperty(source.ethereum, "providers");
  if (Array.isArray(providerList)) {
    for (const candidate of providerList) {
      const provider = asProvider(candidate);
      if (provider) {
        return available(provider, "Browser wallet available");
      }
    }
  }

  const walletSpecificCandidates: Array<[unknown, string]> = [
    [source.okxwallet, "OKX Wallet available"],
    [source.phantom, "Phantom available"],
    [source.rabby, "Rabby available"],
    [source.coinbaseWalletExtension, "Coinbase Wallet available"]
  ];

  for (const [candidate, label] of walletSpecificCandidates) {
    const provider = asProvider(candidate) ?? asProvider(objectProperty(candidate, "ethereum"));
    if (provider) {
      return available(provider, label);
    }
  }

  return {
    status: "missing",
    provider: undefined,
    label: "No browser wallet detected"
  };
}

function detectionFromAnnouncement(event: Event): WalletDetection | undefined {
  const detail = (event as CustomEvent<unknown>).detail;
  const provider = asProvider(objectProperty(detail, "provider"));
  if (!provider) {
    return undefined;
  }
  const announcedName = objectProperty(objectProperty(detail, "info"), "name");
  const label =
    typeof announcedName === "string" && announcedName.trim()
      ? `${announcedName.trim()} available`
      : "Browser wallet available";
  return available(provider, label);
}

export async function discoverInjectedWallet(
  source: WalletEnvironment,
  announcementWaitMs = 100
): Promise<WalletDetection> {
  const directProvider = asProvider(source.ethereum);
  if (directProvider) {
    return available(directProvider, "Browser wallet available");
  }

  if (!source.addEventListener || !source.dispatchEvent) {
    return detectInjectedWallet(source);
  }

  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (result: WalletDetection) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer) {
        clearTimeout(timer);
      }
      source.removeEventListener?.("eip6963:announceProvider", handleAnnouncement);
      resolve(result);
    };

    const handleAnnouncement: EventListener = (event) => {
      const result = detectionFromAnnouncement(event);
      if (result) {
        finish(result);
      }
    };

    source.addEventListener?.("eip6963:announceProvider", handleAnnouncement);
    try {
      source.dispatchEvent?.(new Event("eip6963:requestProvider"));
    } catch {
      finish(detectInjectedWallet(source));
      return;
    }

    if (!settled) {
      timer = setTimeout(
        () => finish(detectInjectedWallet(source)),
        Math.max(0, announcementWaitMs)
      );
    }
  });
}

export function walletRequestErrorMessage(
  cause: unknown,
  fallback = "Wallet request failed"
): string {
  if (cause instanceof Error && cause.message.trim()) {
    return cause.message.trim();
  }
  const providerMessage = objectProperty(cause, "message");
  if (typeof providerMessage === "string" && providerMessage.trim()) {
    return providerMessage.trim();
  }
  const providerCode = objectProperty(cause, "code");
  if (typeof providerCode === "number" || typeof providerCode === "string") {
    return `${fallback} (code ${providerCode})`;
  }
  return fallback;
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

export async function readAuthorizedWallet(provider: Eip1193Provider): Promise<WalletConnection> {
  const accounts = await provider.request({ method: "eth_accounts" });
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

export async function discoverAuthorizedWallet(source: WalletEnvironment): Promise<{
  provider?: Eip1193Provider;
  address?: `0x${string}`;
}> {
  const detection = await discoverInjectedWallet(source);
  if (!detection.provider) {
    return {};
  }
  let connection: WalletConnection;
  try {
    connection = await readAuthorizedWallet(detection.provider);
  } catch {
    connection = { status: "rejected", address: undefined };
  }
  return {
    provider: detection.provider,
    address: connection.address
  };
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

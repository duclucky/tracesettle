export interface RuntimeConfig {
  contractAddress: `0x${string}` | undefined;
  mode: "live" | "preview";
  reason: string | undefined;
}

const addressPattern = /^0x[a-fA-F0-9]{40}$/;

export function isHexAddress(value: unknown): value is `0x${string}` {
  return typeof value === "string" && addressPattern.test(value);
}

export function resolveRuntimeConfig(env: Record<string, unknown>): RuntimeConfig {
  const configuredAddress = env.VITE_CONTRACT_ADDRESS;
  if (configuredAddress === undefined || configuredAddress === "") {
    return {
      contractAddress: undefined,
      mode: "preview",
      reason: "Missing VITE_CONTRACT_ADDRESS"
    };
  }
  if (!isHexAddress(configuredAddress)) {
    return {
      contractAddress: undefined,
      mode: "preview",
      reason: "Invalid VITE_CONTRACT_ADDRESS"
    };
  }
  return {
    contractAddress: configuredAddress,
    mode: "live",
    reason: undefined
  };
}

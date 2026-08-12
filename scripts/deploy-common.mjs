import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAccount } from "genlayer-js";

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const contractPath = resolve(projectRoot, "contracts", "tracesettle.py");
export const deploymentPath = resolve(
  projectRoot,
  "docs",
  "evidence",
  "studionet",
  "deployment.json"
);

export function readText(path) {
  return readFileSync(path, "utf8");
}

export function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

export function git(args) {
  return execFileSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

export function gitIdentity() {
  const commit = git(["rev-parse", "HEAD"]);
  const status = git(["status", "--short"]);
  return {
    commit,
    clean: status.length === 0,
    status
  };
}

export function contractIdentity() {
  const source = readText(contractPath);
  const firstLine = source.split(/\r?\n/, 1)[0];
  const depends = firstLine.match(/py-genlayer:[^" ]+/)?.[0];
  return {
    path: "contracts/tracesettle.py",
    source_sha256: sha256(source),
    depends
  };
}

export function parseEnv(text) {
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }
    const [rawKey, ...rest] = line.split("=");
    const key = rawKey.trim();
    const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
    out[key] = value;
  }
  return out;
}

export function discoverEnv() {
  const candidates = [resolve(projectRoot, ".env"), resolve(projectRoot, "..", ".env")];
  for (const path of candidates) {
    if (existsSync(path)) {
      return {
        path,
        env: parseEnv(readText(path))
      };
    }
  }
  throw new Error("No project or parent .env found");
}

export function privateKeyFromEnv() {
  const found = discoverEnv();
  const raw = found.env.STUDIONET_PRIVATE_KEY;
  if (!raw) {
    throw new Error("STUDIONET_PRIVATE_KEY is missing or empty");
  }
  const key = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error("STUDIONET_PRIVATE_KEY is present but malformed");
  }
  return {
    env_path: found.path,
    private_key: key
  };
}

export function authorizedAccount() {
  const { env_path, private_key } = privateKeyFromEnv();
  const account = createAccount(private_key);
  return {
    env_path,
    account
  };
}

export function publicPreflight() {
  const gitInfo = gitIdentity();
  const contract = contractIdentity();
  const { env_path, account } = authorizedAccount();
  const envSource = env_path === resolve(projectRoot, ".env") ? "project .env" : "parent .env";
  return {
    network: "studionet",
    deployer: account.address,
    env_source: envSource,
    git: {
      commit: gitInfo.commit,
      clean: gitInfo.clean
    },
    contract
  };
}

// Runtime configuration, read from `.env` (optional) and the process environment.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

if (existsSync(".env")) process.loadEnvFile(".env");

const CLUSTERS = {
  devnet: { rpc: "https://api.devnet.solana.com", ws: "wss://api.devnet.solana.com" },
  testnet: { rpc: "https://api.testnet.solana.com", ws: "wss://api.testnet.solana.com" },
  "mainnet-beta": { rpc: "https://api.mainnet-beta.solana.com", ws: "wss://api.mainnet-beta.solana.com" },
  localnet: { rpc: "http://127.0.0.1:8899", ws: "ws://127.0.0.1:8900" },
} as const;

export type Cluster = keyof typeof CLUSTERS;

function readCluster(): Cluster {
  const value = process.env.CLUSTER ?? "devnet";
  if (!(value in CLUSTERS)) {
    throw new Error(`CLUSTER must be one of ${Object.keys(CLUSTERS).join(", ")}; got "${value}"`);
  }
  return value as Cluster;
}

function expandHome(path: string): string {
  return resolve(path.startsWith("~/") ? `${homedir()}/${path.slice(2)}` : path);
}

export const CLUSTER = readCluster();
export const RPC_URL = process.env.RPC_URL ?? CLUSTERS[CLUSTER].rpc;
export const WS_URL = process.env.WS_URL ?? CLUSTERS[CLUSTER].ws;

export const AUTHORITY_KEYPAIR = expandHome(process.env.AUTHORITY_KEYPAIR ?? "~/.config/solana/id.json");
export const RECIPIENT_KEYPAIR = expandHome(process.env.RECIPIENT_KEYPAIR ?? "./wallets/recipient.json");

/** Solana Explorer link for a transaction signature or an address on the current cluster. */
export function explorer(kind: "tx" | "address", value: string): string {
  const base = `https://explorer.solana.com/${kind}/${value}`;
  if (CLUSTER === "mainnet-beta") return base;
  if (CLUSTER === "localnet") return `${base}?cluster=custom&customUrl=${encodeURIComponent(RPC_URL)}`;
  return `${base}?cluster=${CLUSTER}`;
}

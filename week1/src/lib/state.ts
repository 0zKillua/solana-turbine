// Each script records the addresses and signatures it produced in
// deployments/<cluster>.json, so the next script knows which mint or asset to use.
// The file holds only public data and is committed as proof of the on-chain runs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { CLUSTER } from "./env.js";

export type MetadataUpload = { image: string; uri: string };

export type Deployment = {
  spl?: {
    mint?: string;
    decimals?: number;
    createMintTx?: string;
    mintToTx?: string;
    transferTx?: string;
  };
  nft?: {
    /** Uploaded image and JSON per growth stage. */
    metadata?: Record<string, MetadataUpload>;
    asset?: string;
    createTx?: string;
    /** Update transaction per stage the asset was updated to. */
    updateTxs?: Record<string, string>;
    transferTx?: string;
    burnTx?: string;
  };
};

const FILE = `deployments/${CLUSTER}.json`;

export function readState(): Deployment {
  return existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")) as Deployment) : {};
}

/** Merge one section of the deployment record and write it back. */
export function saveState<K extends keyof Deployment>(section: K, patch: NonNullable<Deployment[K]>): void {
  const state = readState();
  state[section] = { ...state[section], ...patch } as Deployment[K];
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(state, null, 2) + "\n");
}

/** Read a value an earlier step must have produced, or explain which step to run. */
export function requireValue<T>(value: T | undefined, missing: string, runFirst: string): T {
  if (value === undefined) throw new Error(`No ${missing} recorded for ${CLUSTER}. Run \`${runFirst}\` first.`);
  return value;
}

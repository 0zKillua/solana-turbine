// Keypair files use the Solana CLI format: a JSON array of 64 bytes
// (32-byte private key followed by the 32-byte public key).
import { readFileSync } from "node:fs";

export function readKeypairBytes(path: string): Uint8Array {
  try {
    return Uint8Array.from(JSON.parse(readFileSync(path, "utf8")) as number[]);
  } catch (cause) {
    throw new Error(`Could not read keypair file ${path}. Run \`pnpm wallets\` or set the path in .env.`, { cause });
  }
}

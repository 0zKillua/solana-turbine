// Prepare the two wallets used by every script:
//   authority: pays fees, mint authority of the token, update authority of the NFT
//   recipient: receives the tokens and the NFT
// Creates the recipient keypair if it does not exist yet, then prints both balances.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createKeyPairSignerFromPrivateKeyBytes, getBase58Encoder } from "@solana/kit";
import { fromBaseUnits } from "./lib/amount.js";
import { AUTHORITY_KEYPAIR, CLUSTER, RECIPIENT_KEYPAIR, explorer } from "./lib/env.js";
import { loadAuthority, loadRecipient, rpc } from "./lib/kit.js";

async function createRecipientKeypair(path: string): Promise<void> {
  const privateKey = crypto.getRandomValues(new Uint8Array(32));
  const signer = await createKeyPairSignerFromPrivateKeyBytes(privateKey);
  const publicKey = getBase58Encoder().encode(signer.address);

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify([...privateKey, ...publicKey]), { mode: 0o600 });
  console.log(`Created recipient keypair at ${path}`);
}

/** 1 SOL = 10^9 lamports. */
const SOL_DECIMALS = 9;

if (!existsSync(RECIPIENT_KEYPAIR)) await createRecipientKeypair(RECIPIENT_KEYPAIR);

const wallets = [
  { role: "authority", path: AUTHORITY_KEYPAIR, signer: await loadAuthority() },
  { role: "recipient", path: RECIPIENT_KEYPAIR, signer: await loadRecipient() },
];

console.log(`Cluster: ${CLUSTER}\n`);
for (const { role, path, signer } of wallets) {
  const { value: balance } = await rpc.getBalance(signer.address).send();
  console.log(`${role.padEnd(10)} ${signer.address}  ${fromBaseUnits(balance, SOL_DECIMALS)} SOL`);
  console.log(`${"".padEnd(10)} ${path}`);
  console.log(`${"".padEnd(10)} ${explorer("address", signer.address)}\n`);
}

if (CLUSTER === "devnet") {
  console.log("Only the authority needs SOL. Top it up at https://faucet.solana.com if needed.");
}

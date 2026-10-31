// @solana/kit setup for the SPL token scripts.
import {
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Instruction,
  type KeyPairSigner,
  type TransactionSigner,
} from "@solana/kit";
import { AUTHORITY_KEYPAIR, RECIPIENT_KEYPAIR, RPC_URL, WS_URL } from "./env.js";
import { readKeypairBytes } from "./keypair.js";

export const rpc = createSolanaRpc(RPC_URL);
export const rpcSubscriptions = createSolanaRpcSubscriptions(WS_URL);

const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });

export function loadAuthority(): Promise<KeyPairSigner> {
  return createKeyPairSignerFromBytes(readKeypairBytes(AUTHORITY_KEYPAIR));
}

export function loadRecipient(): Promise<KeyPairSigner> {
  return createKeyPairSignerFromBytes(readKeypairBytes(RECIPIENT_KEYPAIR));
}

/**
 * Build one transaction from `instructions`, sign it with every signer the
 * instructions reference, send it, and wait for `confirmed` commitment.
 */
export async function sendInstructions(feePayer: TransactionSigner, instructions: Instruction[]): Promise<string> {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(feePayer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstructions(instructions, m),
  );

  const transaction = await signTransactionMessageWithSigners(message);
  assertIsTransactionWithBlockhashLifetime(transaction);
  await sendAndConfirm(transaction, { commitment: "confirmed" });
  return getSignatureFromTransaction(transaction);
}

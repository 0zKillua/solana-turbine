// Task 1b: mint tokens into the authority's own wallet.
//
// Wallets never hold tokens directly. Tokens live in a token account, and the
// standard one per (owner, mint) pair is the Associated Token Account (ATA): a
// PDA of the Associated Token Program, so anyone can derive it from the owner
// and the mint alone.
//
// Usage: pnpm spl:mint [amount]   (whole tokens, default from src/config.ts)
import { address } from "@solana/kit";
import {
  TOKEN_PROGRAM_ADDRESS,
  fetchMint,
  fetchToken,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getMintToCheckedInstruction,
} from "@solana-program/token";
import { TOKEN } from "../config.js";
import { fromBaseUnits, toBaseUnits } from "../lib/amount.js";
import { explorer } from "../lib/env.js";
import { loadAuthority, rpc, sendInstructions } from "../lib/kit.js";
import { readState, requireValue, saveState } from "../lib/state.js";

const authority = await loadAuthority();
const mint = address(requireValue(readState().spl?.mint, "mint", "pnpm spl:create-mint"));
const { data: mintAccount } = await fetchMint(rpc, mint);
const amount = toBaseUnits(process.argv[2] ?? TOKEN.mintAmount, mintAccount.decimals);

const [ata] = await findAssociatedTokenPda({
  mint,
  owner: authority.address,
  tokenProgram: TOKEN_PROGRAM_ADDRESS,
});

const signature = await sendInstructions(authority, [
  // Idempotent: succeeds whether or not the ATA already exists.
  getCreateAssociatedTokenIdempotentInstruction({
    payer: authority,
    ata,
    owner: authority.address,
    mint,
  }),
  // The "checked" variant also passes decimals, so the program rejects the
  // call if the client assumed the wrong decimals.
  getMintToCheckedInstruction({
    mint,
    token: ata,
    mintAuthority: authority,
    amount,
    decimals: mintAccount.decimals,
  }),
]);

saveState("spl", { mintToTx: signature });

const [{ data: token }, { data: mintAfter }] = await Promise.all([fetchToken(rpc, ata), fetchMint(rpc, mint)]);
const decimals = mintAfter.decimals;
console.log(`Minted ${fromBaseUnits(amount, decimals)} tokens to ${authority.address}`);
console.log(`  token account (ATA): ${ata}`);
console.log(`  balance:             ${fromBaseUnits(token.amount, decimals)}`);
console.log(`  total supply:        ${fromBaseUnits(mintAfter.supply, decimals)}`);
console.log(`  tx: ${explorer("tx", signature)}`);

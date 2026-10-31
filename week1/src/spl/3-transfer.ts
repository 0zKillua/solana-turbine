// Task 1c: transfer tokens to another wallet.
//
// A transfer moves tokens between two token accounts of the same mint. The
// sender signs as owner of the source account. The receiver does not sign; if
// their ATA does not exist yet, the sender creates it and pays its rent.
//
// Usage: pnpm spl:transfer [amount] [recipient address]
//   defaults: amount from src/config.ts, recipient = wallets/recipient.json
import { address, type Address } from "@solana/kit";
import {
  TOKEN_PROGRAM_ADDRESS,
  fetchMint,
  fetchToken,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction,
} from "@solana-program/token";
import { TOKEN } from "../config.js";
import { fromBaseUnits, toBaseUnits } from "../lib/amount.js";
import { explorer } from "../lib/env.js";
import { loadAuthority, loadRecipient, rpc, sendInstructions } from "../lib/kit.js";
import { readState, requireValue, saveState } from "../lib/state.js";

const authority = await loadAuthority();
const recipient: Address = process.argv[3] ? address(process.argv[3]) : (await loadRecipient()).address;
const mint = address(requireValue(readState().spl?.mint, "mint", "pnpm spl:create-mint"));
const { data: mintAccount } = await fetchMint(rpc, mint);
const decimals = mintAccount.decimals;
const amount = toBaseUnits(process.argv[2] ?? TOKEN.transferAmount, decimals);

const ataOf = async (owner: Address) =>
  (await findAssociatedTokenPda({ mint, owner, tokenProgram: TOKEN_PROGRAM_ADDRESS }))[0];
const [source, destination] = await Promise.all([ataOf(authority.address), ataOf(recipient)]);

const signature = await sendInstructions(authority, [
  getCreateAssociatedTokenIdempotentInstruction({
    payer: authority,
    ata: destination,
    owner: recipient,
    mint,
  }),
  getTransferCheckedInstruction({
    source,
    mint,
    destination,
    authority,
    amount,
    decimals,
  }),
]);

saveState("spl", { transferTx: signature });

const [{ data: from }, { data: to }] = await Promise.all([fetchToken(rpc, source), fetchToken(rpc, destination)]);
console.log(`Transferred ${fromBaseUnits(amount, decimals)} tokens`);
console.log(`  from ${authority.address}  balance now ${fromBaseUnits(from.amount, decimals)}`);
console.log(`  to   ${recipient}  balance now ${fromBaseUnits(to.amount, decimals)}`);
console.log(`  tx: ${explorer("tx", signature)}`);

// Task 1a: create a new SPL token mint.
//
// A mint is an account owned by the Token Program that stores supply, decimals
// and the mint/freeze authorities. Creating one takes two instructions in one
// transaction:
//   1. System Program `createAccount`: allocate the account (rent-exempt) and
//      assign it to the Token Program.
//   2. Token Program `initializeMint2`: write the mint layout into it.
// The new account's keypair must sign step 1, which proves nobody else holds
// that address.
import { generateKeyPairSigner } from "@solana/kit";
import { getCreateAccountInstruction } from "@solana-program/system";
import { TOKEN_PROGRAM_ADDRESS, fetchMint, getInitializeMint2Instruction, getMintSize } from "@solana-program/token";
import { TOKEN } from "../config.js";
import { explorer } from "../lib/env.js";
import { loadAuthority, rpc, sendInstructions } from "../lib/kit.js";
import { saveState } from "../lib/state.js";

const authority = await loadAuthority();
const mint = await generateKeyPairSigner();

const space = getMintSize();
const rent = await rpc.getMinimumBalanceForRentExemption(BigInt(space)).send();

const signature = await sendInstructions(authority, [
  getCreateAccountInstruction({
    payer: authority,
    newAccount: mint,
    lamports: rent,
    space,
    programAddress: TOKEN_PROGRAM_ADDRESS,
  }),
  // No freeze authority: nobody can freeze holders' token accounts.
  getInitializeMint2Instruction({
    mint: mint.address,
    decimals: TOKEN.decimals,
    mintAuthority: authority.address,
  }),
]);

saveState("spl", {
  mint: mint.address,
  decimals: TOKEN.decimals,
  createMintTx: signature,
  mintToTx: undefined,
  transferTx: undefined,
});

const { data } = await fetchMint(rpc, mint.address);
console.log(`Mint created: ${mint.address}`);
console.log(`  decimals:         ${data.decimals}`);
console.log(`  supply:           ${data.supply}`);
console.log(`  mint authority:   ${data.mintAuthority.__option === "Some" ? data.mintAuthority.value : "none"}`);
console.log(`  freeze authority: ${data.freezeAuthority.__option === "Some" ? data.freezeAuthority.value : "none"}`);
console.log(`  rent paid:        ${rent} lamports for ${space} bytes`);
console.log(`  ${explorer("address", mint.address)}`);
console.log(`  tx: ${explorer("tx", signature)}`);

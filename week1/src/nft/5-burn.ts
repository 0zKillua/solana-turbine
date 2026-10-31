// Extension task 5: burn the NFT and reclaim its rent.
//
// The current owner signs the burn. The Core program shrinks the asset account
// to a 1-byte tombstone (key = Uninitialized), so the address can never hold an
// asset again, and sends the freed rent to the transaction's `payer`, not to the
// owner. What stays in the tombstone (observed on devnet, see README):
//   - the rent-exempt minimum for 1 byte
//   - the Core protocol fee deposited into the asset at creation
//
// This script measures every balance before and after, so the printed numbers
// come from the chain, not from assumptions.
import { burn, fetchAsset } from "@metaplex-foundation/mpl-core";
import { publicKey, type PublicKey, type Signer, type Umi } from "@metaplex-foundation/umi";
import { explorer } from "../lib/env.js";
import { readState, requireValue, saveState } from "../lib/state.js";
import { createAuthorityUmi, loadRecipientSigner, signatureToString } from "../lib/umi.js";
import { printAsset } from "./print.js";

const umi = createAuthorityUmi();
const assetAddress = publicKey(requireValue(readState().nft?.asset, "NFT", "pnpm nft:create"));

const asset = await fetchAsset(umi, assetAddress);
printAsset("Burning", asset);

// The owner may be either local wallet, depending on whether task 4 ran.
const localSigners = [umi.identity, loadRecipientSigner(umi)];
const owner: Signer | undefined = localSigners.find((s) => s.publicKey === asset.owner);
if (!owner) throw new Error(`The NFT is owned by ${asset.owner}, which is not one of the local wallets.`);

const lamportsOf = async (umi: Umi, address: PublicKey) => (await umi.rpc.getBalance(address)).basisPoints;
const watched = { asset: assetAddress, owner: owner.publicKey, feePayer: umi.payer.publicKey };
const before = Object.fromEntries(
  await Promise.all(Object.entries(watched).map(async ([k, v]) => [k, await lamportsOf(umi, v)] as const)),
);

// The authority wallet is the payer: it pays the fee and receives the reclaimed
// rent (it paid that rent at creation). A recipient with 0 SOL can still burn.
const { signature } = await burn(umi, { asset, authority: owner }).sendAndConfirm(umi);
const tx = signatureToString(signature);
saveState("nft", { burnTx: tx });

const fee = (await umi.rpc.getTransaction(signature))?.meta.fee.basisPoints ?? 0n;
const after = Object.fromEntries(
  await Promise.all(Object.entries(watched).map(async ([k, v]) => [k, await lamportsOf(umi, v)] as const)),
);
const tombstone = await umi.rpc.getAccount(assetAddress);

console.log("\nBurned. Lamport changes:");
console.log(`  asset account: ${before.asset} -> ${after.asset}  (${after.asset - before.asset})`);
if (owner.publicKey === umi.payer.publicKey) {
  console.log(`  owner + fee payer ${owner.publicKey}: ${after.owner - before.owner} (fee ${fee})`);
} else {
  console.log(`  owner     ${owner.publicKey}: +${after.owner - before.owner}`);
  console.log(`  fee payer ${umi.payer.publicKey}: ${after.feePayer - before.feePayer} (fee ${fee})`);
}
console.log(`  rent reclaimed: ${before.asset - after.asset} lamports`);
if (tombstone.exists) {
  console.log(
    `  tombstone left: ${tombstone.data.length} byte(s), ${tombstone.lamports.basisPoints} lamports, owner ${tombstone.owner}`,
  );
} else {
  console.log("  asset account closed completely");
}
console.log(`  tx: ${explorer("tx", tx)}`);

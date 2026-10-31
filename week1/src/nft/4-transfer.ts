// Extension task 4: transfer the NFT to another wallet.
//
// A Core transfer rewrites the `owner` field inside the asset account. No
// token accounts are created or closed, so the receiver pays nothing and the
// sender pays only the transaction fee. The current owner must sign.
//
// Usage: pnpm nft:transfer [new owner address]   (default: wallets/recipient.json)
import { fetchAsset, transfer } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { explorer } from "../lib/env.js";
import { readState, requireValue, saveState } from "../lib/state.js";
import { createAuthorityUmi, loadRecipientSigner, signatureToString } from "../lib/umi.js";
import { printAsset } from "./print.js";

const umi = createAuthorityUmi();
const assetAddress = publicKey(requireValue(readState().nft?.asset, "NFT", "pnpm nft:create"));
const newOwner = process.argv[2] ? publicKey(process.argv[2]) : loadRecipientSigner(umi).publicKey;

const before = await fetchAsset(umi, assetAddress);
printAsset("Before", before);

// `authority` defaults to the Umi identity, which must be the current owner.
const { signature } = await transfer(umi, { asset: before, newOwner }).sendAndConfirm(umi);

const tx = signatureToString(signature);
saveState("nft", { transferTx: tx });

printAsset("After", await fetchAsset(umi, assetAddress));
console.log(`  tx: ${explorer("tx", tx)}`);

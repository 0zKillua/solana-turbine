// Task 2: mint an NFT with MPL Core. It starts life as a dino egg.
//
// A Core asset is a single account owned by the Core program. It stores the
// owner, update authority, name and uri directly, so there is no mint, token
// account, metadata account or master edition as in the Token Metadata
// standard. The new asset's keypair signs to prove the address is unclaimed.
import { create, fetchAsset } from "@metaplex-foundation/mpl-core";
import { generateSigner } from "@metaplex-foundation/umi";
import { explorer } from "../lib/env.js";
import { readState, requireValue, saveState } from "../lib/state.js";
import { createAuthorityUmi, signatureToString } from "../lib/umi.js";
import { METADATA } from "./metadata.js";
import { printAsset } from "./print.js";

const umi = createAuthorityUmi();
const metadata = requireValue(readState().nft?.metadata?.egg, "egg metadata", "pnpm nft:upload");
const asset = generateSigner(umi);

// Owner and update authority both default to the Umi identity (the authority wallet).
const { signature } = await create(umi, {
  asset,
  name: METADATA.egg.name,
  uri: metadata.uri,
}).sendAndConfirm(umi);

const tx = signatureToString(signature);
saveState("nft", {
  asset: asset.publicKey,
  createTx: tx,
  updateTxs: {},
  transferTx: undefined,
  burnTx: undefined,
});

printAsset("NFT created", await fetchAsset(umi, asset.publicKey));
console.log(`  ${explorer("address", asset.publicKey)}`);
console.log(`  tx: ${explorer("tx", tx)}`);

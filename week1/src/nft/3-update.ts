// Task 3: change the NFT's name and metadata as the update authority.
//
// Only the update authority can call `update`. The owner cannot, and the
// update authority cannot transfer or burn the asset: Core keeps the two
// roles separate. Here the update authority is the authority wallet (the Umi
// identity), which signs by default. That still holds after the NFT has been
// transferred to someone else, which is how the hatchling grows into a rex.
//
// Usage: pnpm nft:update <stage>   (hatchling | rex)
import { fetchAsset, update } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { explorer } from "../lib/env.js";
import { readState, requireValue, saveState } from "../lib/state.js";
import { createAuthorityUmi, signatureToString } from "../lib/umi.js";
import { METADATA, parseStage } from "./metadata.js";
import { printAsset } from "./print.js";

const stage = parseStage(process.argv[2]);
const umi = createAuthorityUmi();
const state = readState().nft;
const assetAddress = publicKey(requireValue(state?.asset, "NFT", "pnpm nft:create"));
const metadata = requireValue(state?.metadata?.[stage], `${stage} metadata`, "pnpm nft:upload");

const before = await fetchAsset(umi, assetAddress);
printAsset("Before", before);

const { signature } = await update(umi, {
  asset: before,
  name: METADATA[stage].name,
  uri: metadata.uri,
}).sendAndConfirm(umi);

const tx = signatureToString(signature);
saveState("nft", { updateTxs: { ...state?.updateTxs, [stage]: tx } });

printAsset("After", await fetchAsset(umi, assetAddress));
console.log(`  tx: ${explorer("tx", tx)}`);

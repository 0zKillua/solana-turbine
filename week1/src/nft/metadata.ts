// Off-chain metadata for the NFT, in the Metaplex JSON standard.
// The asset account on-chain stores only `name` and `uri`; wallets and
// explorers fetch the JSON at `uri` for the image, description and traits.
//
// The NFT is a dino that grows through its lifecycle:
//   egg        minted                          (task 2)
//   hatchling  updated by the update authority (task 3)
//   rex        updated again after the transfer, while another wallet owns it
//   fossil     burned (task 5). Only the 1-byte tombstone account is left, so
//              this stage has art for the docs but no on-chain metadata.
import { NFT } from "../config.js";

export const STAGES = ["egg", "hatchling", "rex"] as const;
export type Stage = (typeof STAGES)[number];

export function parseStage(value: string | undefined): Stage {
  if (!STAGES.includes(value as Stage)) {
    throw new Error(`Stage must be one of ${STAGES.join(", ")}; got "${value ?? ""}"`);
  }
  return value as Stage;
}

type Attribute = { trait_type: string; value: string };

export const METADATA: Record<
  Stage,
  { name: string; description: string; imageFile: string; attributes: Attribute[] }
> = {
  egg: {
    name: "Turbin3 Dino Egg",
    description: "A speckled egg minted with MPL Core during Turbin3 Week 1. Something is moving inside.",
    imageFile: "assets/nft/egg.png",
    attributes: [
      { trait_type: "Stage", value: "Egg" },
      { trait_type: "Cohort", value: "Turbin3 Builders" },
      { trait_type: "Week", value: "1" },
    ],
  },
  hatchling: {
    name: "Turbin3 Dino: Hatchling",
    description: "The egg hatched. Its update authority rewrote the name and metadata URI on-chain.",
    imageFile: "assets/nft/hatchling.png",
    attributes: [
      { trait_type: "Stage", value: "Hatchling" },
      { trait_type: "Cohort", value: "Turbin3 Builders" },
      { trait_type: "Week", value: "1" },
    ],
  },
  rex: {
    name: "Turbin3 Dino: Rex",
    description:
      "Fully grown. It lives in its new owner's wallet, but only the update authority can change how it looks.",
    imageFile: "assets/nft/rex.png",
    attributes: [
      { trait_type: "Stage", value: "Rex" },
      { trait_type: "Cohort", value: "Turbin3 Builders" },
      { trait_type: "Week", value: "1" },
    ],
  },
};

export function buildMetadataJson(stage: Stage, imageUri: string) {
  const { name, description, attributes } = METADATA[stage];
  return {
    name,
    symbol: NFT.symbol,
    description,
    image: imageUri,
    external_url: NFT.externalUrl,
    attributes,
    properties: {
      files: [{ uri: imageUri, type: "image/png" }],
      category: "image",
    },
  };
}

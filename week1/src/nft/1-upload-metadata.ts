// Upload each stage's image and metadata JSON to Arweave through Irys.
// The Irys node is paid from the authority wallet. The resulting URIs are
// saved to deployments/<cluster>.json for the create and update scripts.
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createGenericFile } from "@metaplex-foundation/umi";
import { CLUSTER } from "../lib/env.js";
import { readState, saveState } from "../lib/state.js";
import { createAuthorityUmi } from "../lib/umi.js";
import { METADATA, STAGES, buildMetadataJson } from "./metadata.js";

const umi = createAuthorityUmi();
if (!umi.uploader) throw new Error(`No Irys upload node is configured for ${CLUSTER}.`);

const uploads = { ...readState().nft?.metadata };

for (const stage of STAGES) {
  const imageFile = METADATA[stage].imageFile;
  const file = createGenericFile(readFileSync(imageFile), basename(imageFile), { contentType: "image/png" });

  const [image] = await umi.uploader.upload([file]);
  const uri = await umi.uploader.uploadJson(buildMetadataJson(stage, image));

  uploads[stage] = { image, uri };
  saveState("nft", { metadata: uploads });
  console.log(`${stage.padEnd(9)} image ${image}`);
  console.log(`${"".padEnd(9)} json  ${uri}`);
}

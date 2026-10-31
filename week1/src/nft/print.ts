import type { AssetV1 } from "@metaplex-foundation/mpl-core";

/** Print the fields of a Core asset that the scripts change. */
export function printAsset(label: string, asset: AssetV1): void {
  const updateAuthority = asset.updateAuthority.address ?? `(${asset.updateAuthority.type})`;
  console.log(`${label}`);
  console.log(`  address:          ${asset.publicKey}`);
  console.log(`  name:             ${asset.name}`);
  console.log(`  uri:              ${asset.uri}`);
  console.log(`  owner:            ${asset.owner}`);
  console.log(`  update authority: ${updateAuthority}`);
}

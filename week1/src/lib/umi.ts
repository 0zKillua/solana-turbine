// Umi setup for the MPL Core scripts. Metaplex ships its Core client for Umi.
import { mplCore } from "@metaplex-foundation/mpl-core";
import { createSignerFromKeypair, keypairIdentity, type Signer, type Umi } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { AUTHORITY_KEYPAIR, CLUSTER, RECIPIENT_KEYPAIR, RPC_URL } from "./env.js";
import { readKeypairBytes } from "./keypair.js";

// Irys stores files on Arweave. Its devnet node accepts devnet SOL and keeps data
// for a limited time; the mainnet node stores data permanently.
const IRYS_NODES: Partial<Record<typeof CLUSTER, string>> = {
  devnet: "https://devnet.irys.xyz",
  "mainnet-beta": "https://uploader.irys.xyz",
};

/** Umi client whose identity and fee payer is the authority wallet. */
export function createAuthorityUmi(): Umi {
  const umi = createUmi(RPC_URL, { commitment: "confirmed" }).use(mplCore());
  const keypair = umi.eddsa.createKeypairFromSecretKey(readKeypairBytes(AUTHORITY_KEYPAIR));
  umi.use(keypairIdentity(keypair));

  const irysNode = IRYS_NODES[CLUSTER];
  if (irysNode) umi.use(irysUploader({ address: irysNode }));
  return umi;
}

export function loadRecipientSigner(umi: Umi): Signer {
  return createSignerFromKeypair(umi, umi.eddsa.createKeypairFromSecretKey(readKeypairBytes(RECIPIENT_KEYPAIR)));
}

/** Umi returns signatures as raw bytes; explorers use base58. */
export function signatureToString(signature: Uint8Array): string {
  return base58.deserialize(signature)[0];
}

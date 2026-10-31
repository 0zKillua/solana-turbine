# Week 1: SPL Token and MPL Core NFT

Turbin3 Builders cohort, week 1. TypeScript scripts that:

1. Create an SPL token, mint it, and transfer it to another wallet.
2. Mint an NFT with Metaplex Core.
3. Update the NFT's name and metadata as its update authority.
4. _(extension)_ Transfer the NFT to another wallet.
5. _(extension)_ Burn the NFT and reclaim its rent.

The NFT is a dino that grows up across these steps. It is minted as an egg, the update hatches it, the transfer gives it a new owner, a second update grows it into a rex while someone else owns it, and the burn leaves a fossil.

|         Egg (mint)         |           Hatchling (update)           | Rex (update after transfer) |          Fossil (burn)           |
| :------------------------: | :------------------------------------: | :-------------------------: | :------------------------------: |
| ![egg](assets/nft/egg.png) | ![hatchling](assets/nft/hatchling.png) | ![rex](assets/nft/rex.png)  | ![fossil](assets/nft/fossil.png) |

## Devnet proof

Every script records what it created in [`deployments/devnet.json`](deployments/devnet.json).

**Wallets**

| Role                                                        | Address                                                                                                              |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Authority (fee payer, mint authority, NFT update authority) | [`DNTGUgwR…4dqhaq`](https://explorer.solana.com/address/DNTGUgwRWPhTKjWrqTeYLZSHGpprbi7p2dUoPG4dqhaq?cluster=devnet) |
| Recipient                                                   | [`Hr98auWN…9kgX3w`](https://explorer.solana.com/address/Hr98auWNM3ahp3a3LF874Jb5Por3ZWQuzc2TfU9kgX3w?cluster=devnet) |

**Task 1: SPL token**

| Step                                          | Result                                                                                                               | Transaction                                                                                                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create mint (6 decimals, no freeze authority) | [`CQYY5qbr…E4FRJz`](https://explorer.solana.com/address/CQYY5qbrL9Yq1i5pjNUaFKh2wtHE9oVD18dUosE4FRJz?cluster=devnet) | [`7WXhMKKW…`](https://explorer.solana.com/tx/7WXhMKKW9YHSoKDafxftJb8EBwtcrkd262YrJy2NcBjwV9fnqLRnp4Pw46chSz1F9jLxXDx3urp5Qf9HQk7nLV2?cluster=devnet)  |
| Mint 1,000,000 tokens to the authority        | supply 1,000,000                                                                                                     | [`2QX4z58C…`](https://explorer.solana.com/tx/2QX4z58CZr3akyMoW7zEQCDqbzYirKdfw2pMJhpgkDwiTxfxnV65EVHe6GxFSXNVB8CJiwZFRP2FX12gGgstdEyo?cluster=devnet) |
| Transfer 1,000 tokens to the recipient        | 999,000 / 1,000                                                                                                      | [`2A3jap5Y…`](https://explorer.solana.com/tx/2A3jap5YETmsNJiiULTokD4wXTxiuqd2FnbJ2tTg2DozVkgbdceaBbZHzMApPYqipqmNJEp9t4DEYYtZNkcjpMcp?cluster=devnet) |

**Tasks 2–5: Core NFT** [`7p6rjKjc…7gh6noh`](https://explorer.solana.com/address/7p6rjKjcjFX57ZydXheEknfsuzpwjHwWGnQjM7gh6noh?cluster=devnet)

| Task | Step                                                                      | Name after              | Owner after | Transaction                                                                                                                                           |
| ---- | ------------------------------------------------------------------------- | ----------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2    | Create                                                                    | Turbin3 Dino Egg        | authority   | [`4hsND9t6…`](https://explorer.solana.com/tx/4hsND9t6RUCUwAfvxW8wcNCLxpqKReAhx2B8AcXKwBJV2TRraXdpfv5McroXbXuUuL5UEfGzZTDfbxmnk1g77WMv?cluster=devnet) |
| 3    | Update (hatch)                                                            | Turbin3 Dino: Hatchling | authority   | [`ToHyKuyc…`](https://explorer.solana.com/tx/ToHyKuycfYuQ9f9swpTGTUpc4a2V63iaC51YjJmQoRAxL5ohBkz8N2nupHXG5tDkouVMr2agD1AEQRwAzPSgsyc?cluster=devnet)  |
| 4    | Transfer                                                                  | Turbin3 Dino: Hatchling | recipient   | [`2ZE1X1UC…`](https://explorer.solana.com/tx/2ZE1X1UCqGN6P7ao3HGhV9mqUWxMpirsHjhoCarjjBfmmfwLChvNcaf19eV58Jj6578j1sqtv1tqhaQy6yuPhDMs?cluster=devnet) |
| 3    | Update (grow), signed by the update authority while the recipient owns it | Turbin3 Dino: Rex       | recipient   | [`9jetDDzJ…`](https://explorer.solana.com/tx/9jetDDzJUbfzEFVLNh47CUUz9PPzAxnQPoaTNrVye7HPczui7ZPLuz61HszNEmmXfZ3ApaHj4seV9sv8REfYTRS?cluster=devnet)  |
| 5    | Burn, signed by the recipient as owner                                    | burned                  | none        | [`2oP1jGy9…`](https://explorer.solana.com/tx/2oP1jGy9XBUDPzxJgyyVB8W5NU55rfRrfe9GZyqYmxLLvRnVt1tMN8jFBa89RgLeRAX2DEfi3u3HocANXix6nekP?cluster=devnet) |

## How it works

### SPL token (`@solana/kit` + `@solana-program/token`)

- **The mint is an account.** [`1-create-mint.ts`](src/spl/1-create-mint.ts) sends two instructions in one transaction. The System Program's `createAccount` allocates 82 bytes, pays rent and assigns the account to the Token Program. Then `initializeMint2` writes the decimals and the mint authority into it. The new mint keypair signs `createAccount`, which proves no one else already holds that address. There is no freeze authority, so nobody can freeze holders' tokens.
- **Wallets don't hold tokens; token accounts do.** Each (owner, mint) pair has one standard token account, the Associated Token Account. It is a PDA, so anyone can derive it from the owner and the mint. [`2-mint-to.ts`](src/spl/2-mint-to.ts) creates it with the idempotent instruction, which succeeds even if the account already exists, then mints into it.
- **Amounts are integers.** With 6 decimals, 1 token is stored as `1_000_000`. [`amount.ts`](src/lib/amount.ts) converts between the two using strings, without floats. The scripts use `mintToChecked` and `transferChecked`, which also pass the decimals, so the program rejects a call made with the wrong decimals.
- **The sender pays for the receiver's account.** [`3-transfer.ts`](src/spl/3-transfer.ts) creates the recipient's token account if it is missing. The authority pays its rent, and the recipient never signs.

### Core NFT (`@metaplex-foundation/mpl-core` on Umi)

- **One account per NFT.** A Core asset stores its owner, update authority, name and URI in a single account. A Token Metadata NFT needs a mint, a token account, a metadata account and a master edition. The image, description and traits live in a JSON file at the URI. [`1-upload-metadata.ts`](src/nft/1-upload-metadata.ts) uploads the images and JSON to Arweave through Irys.
- **Owner and update authority are separate roles.** The owner can transfer and burn the asset. The update authority can change its name and URI. After the transfer, the recipient owned the dino, but only the authority wallet could grow it into a rex. Transferring an asset does not transfer the right to edit it.
- **A transfer is one field write.** [`4-transfer.ts`](src/nft/4-transfer.ts) rewrites the `owner` field. It creates no accounts and costs only the transaction fee.
- **The owner burns, the payer is refunded.** [`5-burn.ts`](src/nft/5-burn.ts) is signed by the recipient as owner. The authority wallet pays the fee, so a recipient with 0 SOL can still burn.

## What the lamports showed

All numbers below are read from the transactions above. They are not estimates. On devnet at the time of the run, rent-exemption cost `5,080 × (128 + bytes)` lamports. That is lower than the 6,960-per-byte figure in older tutorials, so the scripts read rent from the RPC instead of hardcoding it.

| Step                | Asset account balance | What happened                                                                                                                                |
| ------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Create              | 0 → 2,963,040         | 1,463,040 rent for 160 bytes, plus **1,500,000** (0.0015 SOL), the [Core Create protocol fee](https://developers.metaplex.com/protocol-fees) |
| Update to hatchling | +30,480               | The name and URI grew by 6 bytes in total, so the account was resized and the payer topped up 6 × 5,080 of rent                              |
| Transfer            | unchanged             | Only the `owner` field changed                                                                                                               |
| Update to rex       | −25,400               | The name and URI shrank by 5 bytes in total, and the payer got that rent back                                                                |
| Burn                | 2,968,120 → 2,155,320 | **812,800 reclaimed** by the payer                                                                                                           |

**The fossil.** A burn does not close the asset account. Core shrinks it to a 1-byte tombstone owned by the Core program, so the address can never hold an asset again. The tombstone keeps 2,155,320 lamports: 655,320 is the rent for 1 byte, and 1,500,000 is the protocol fee paid at creation. Burning reclaims everything above that, and the refund goes to the transaction's **payer**, not to the owner. The authority paid the rent at creation, so it is the one refunded here.

## Running it

Requires Node 22+ and pnpm. Uses the Solana CLI wallet (`~/.config/solana/id.json`) as the authority unless `.env` says otherwise; see [`.env.example`](.env.example).

```bash
pnpm install
pnpm wallets                  # creates wallets/recipient.json, prints balances

# Task 1
pnpm spl:create-mint
pnpm spl:mint                 # optional amount, e.g. pnpm spl:mint 500
pnpm spl:transfer             # optional amount and recipient address

# Tasks 2–5
pnpm nft:upload               # images + metadata JSON to Irys
pnpm nft:create               # egg
pnpm nft:update hatchling
pnpm nft:transfer             # optional new owner address
pnpm nft:update rex
pnpm nft:burn
```

`pnpm typecheck` runs the TypeScript compiler. To redraw the art, run `python3 assets/art/draw.py`; it writes the SVGs, which are then exported to PNG.

## Mainnet notes

The scripts take the cluster from `CLUSTER` and never assume devnet. With `CLUSTER=mainnet-beta`, uploads go to Irys's mainnet node, where Arweave storage is permanent. On devnet, Irys storage is temporary, so the metadata links in this README will eventually stop resolving, but the on-chain transactions will not. A production client would also set a compute unit limit and a priority fee on each transaction.

## Layout

```
src/
  config.ts               token decimals and default amounts, NFT symbol
  wallets.ts              recipient keypair + balances
  lib/                    env, kit and Umi clients, keypair loading, amounts, deployment record
  spl/1-3                 create mint, mint to, transfer
  nft/1-5                 upload, create, update, transfer, burn
  nft/metadata.ts         the three on-chain stages and their JSON
assets/nft/               stage art (PNG + SVG)
assets/art/draw.py        pixel-art source for the four stages
deployments/devnet.json   addresses and signatures from the devnet run
```

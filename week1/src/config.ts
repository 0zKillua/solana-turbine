// Values you are expected to change. Everything else is derived from on-chain state.

export const TOKEN = {
  /** 6 decimals is the convention used by USDC and most fungible SPL tokens. */
  decimals: 6,
  /** Default amounts in whole tokens. Each script also accepts an amount argument. */
  mintAmount: "1000000",
  transferAmount: "1000",
};

export const NFT = {
  symbol: "DINO",
  externalUrl: "https://turbin3.org",
};

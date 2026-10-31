// Token amounts are integers on-chain ("base units"). A mint with 6 decimals
// stores 1.5 tokens as 1_500_000. These helpers convert exactly, without floats.

export function toBaseUnits(amount: string, decimals: number): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount.trim());
  if (!match) throw new Error(`"${amount}" is not a positive decimal number`);
  const [, whole, fraction = ""] = match;
  if (fraction.length > decimals) {
    throw new Error(`"${amount}" has more than ${decimals} decimal places`);
  }
  return BigInt(whole + fraction.padEnd(decimals, "0"));
}

export function fromBaseUnits(amount: bigint, decimals: number): string {
  const digits = amount.toString().padStart(decimals + 1, "0");
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

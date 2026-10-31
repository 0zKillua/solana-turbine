"""Draws the article diagrams as SVGs. Run: python3 assets/art/diagrams.py"""
import os
from html import escape

from draw import STAGES

OUT = os.path.join(os.path.dirname(__file__), "..", "article")

BG, CARD, LINE = "#12162a", "#1c2240", "#2e3760"
TEXT, MUTED = "#eef0ff", "#9aa3c7"
ME, FRIEND, GOLD = "#8b9cff", "#2fe0a5", "#f2c14e"
SANS = "Inter, Helvetica Neue, Helvetica, Arial, sans-serif"


def text(x, y, s, size=18, fill=TEXT, weight=400, anchor="start", family=SANS):
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" '
            f'fill="{fill}" text-anchor="{anchor}">{escape(s)}</text>')


def box(x, y, w, h, title, lines=(), accent=LINE, title_fill=TEXT):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{CARD}" stroke="{accent}" stroke-width="2"/>',
           text(x + 20, y + 36, title, 20, title_fill, 700)]
    for i, line in enumerate(lines):
        out.append(text(x + 20, y + 68 + i * 28, line, 17, MUTED))
    return "".join(out)


def arrow(x1, y1, x2, y2, label="", color=MUTED, lx=None, ly=None):
    lx = (x1 + x2) / 2 if lx is None else lx
    ly = (y1 + y2) / 2 - 10 if ly is None else ly
    out = f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="2.5" marker-end="url(#head)"/>'
    return out + (text(lx, ly, label, 16, color, 600, "middle") if label else "")


def header(title, subtitle):
    return text(40, 54, title, 30, TEXT, 700) + text(40, 88, subtitle, 18, MUTED)


def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<defs><marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="{MUTED}"/></marker></defs>'
            f'<rect width="{w}" height="{h}" fill="{BG}"/>{body}</svg>')


def spl_accounts():
    b = [header("How an SPL token is held", "Wallets don't hold tokens. Token accounts do.")]
    b.append(box(40, 140, 250, 120, "Me", ["the authority wallet", "signs mint + transfer"], ME, ME))
    b.append(box(40, 380, 250, 120, "Friend", ["a second wallet", "never signed anything"], FRIEND, FRIEND))
    b.append(box(420, 140, 330, 130, "My token account", ["balance: 999,000", "owner: Me"]))
    b.append(box(420, 380, 330, 130, "Friend's token account", ["balance: 1,000", "created + paid for by me"]))
    b.append(box(880, 200, 280, 240, "Mint account", ["supply: 1,000,000", "decimals: 6", "mint authority: Me",
                                                      "freeze authority: none"], GOLD, GOLD))
    b.append(arrow(290, 200, 418, 200, "owns"))
    b.append(arrow(290, 440, 418, 440, "owns"))
    b.append(arrow(750, 205, 878, 280, "of mint", lx=815, ly=225))
    b.append(arrow(750, 445, 878, 360, "of mint", lx=815, ly=430))
    b.append(arrow(585, 272, 585, 376, "transfer 1,000", FRIEND, lx=660, ly=330))
    b.append(text(40, 570, "Token account address = PDA(wallet, mint), so anyone can find it from those two.", 17, MUTED))
    return svg(1200, 600, "".join(b))


def nft_designs():
    b = [header("One NFT, two designs", "Token Metadata spreads an NFT over 4 accounts. Core uses 1.")]
    b.append(text(40, 140, "Token Metadata (older standard)", 20, MUTED, 700))
    b.append(box(40, 160, 255, 115, "Mint", ["supply 1, decimals 0"]))
    b.append(box(315, 160, 255, 115, "Token account", ["holds the 1 token"]))
    b.append(box(40, 295, 255, 115, "Metadata", ["name, symbol, uri"]))
    b.append(box(315, 295, 255, 115, "Master edition", ["keeps supply at 1"]))
    b.append(f'<line x1="610" y1="130" x2="610" y2="420" stroke="{LINE}" stroke-width="2" stroke-dasharray="6 8"/>')
    b.append(text(650, 140, "MPL Core", 20, MUTED, 700))
    b.append(box(650, 160, 510, 250, "Asset account", ["owner", "update authority", "name", "uri",
                                                       "plugins (optional extras)"], ME, ME))
    b.append(box(330, 480, 540, 110, "Metadata JSON (off-chain, Arweave)", ["image · description · attributes"],
                 GOLD, GOLD))
    b.append(arrow(167, 412, 400, 476, "uri", lx=260, ly=430))
    b.append(arrow(905, 412, 800, 476, "uri", lx=880, ly=450))
    return svg(1200, 620, "".join(b))


def pixel_art(stage, cx, top, cell):
    s = STAGES[stage]
    rows = s["art"].strip("\n").split("\n")
    w = max(len(r) for r in rows) * cell
    x0 = cx - w / 2
    out = []
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in s["pal"]:
                out.append(f'<rect x="{x0 + x * cell}" y="{top + y * cell}" width="{cell}" height="{cell}" '
                           f'fill="{s["pal"][ch]}"/>')
    return f'<g shape-rendering="crispEdges">{"".join(out)}</g>'


def lifecycle():
    b = [header("The dino's life on devnet",
                "The owner moves the NFT. The update authority edits it. They are different keys.")]
    steps = [
        ("1 · Create", "Dino Egg", "egg", "Me", "Me", "0.00296 SOL", "rent + 0.0015 fee"),
        ("2 · Update", "Hatchling", "hatchling", "Me", "Me", "+6 bytes", "I pay more rent"),
        ("3 · Transfer", "Hatchling", "hatchling", "Me", "Friend", "no change", "owner field only"),
        ("4 · Update", "Rex", "rex", "Me", "Friend", "−5 bytes", "rent refunded"),
        ("5 · Burn", "Fossil", "fossil", "Friend", "none", "1 byte left", "0.00081 SOL refunded"),
    ]
    col_w, gap, x0 = 180, 12, 200
    rows_y = [400, 460, 520, 580]
    for i, label in enumerate(["Signed by", "Owner", "Update authority", "Asset account"]):
        b.append(text(40, rows_y[i], label, 17, MUTED, 700))
        b.append(f'<line x1="40" y1="{rows_y[i] + 26}" x2="1160" y2="{rows_y[i] + 26}" stroke="{LINE}"/>')
    who = {"Me": ME, "Friend": FRIEND}
    for i, (step, name, art, signer, owner, lamports, note) in enumerate(steps):
        x = x0 + i * (col_w + gap)
        cx = x + col_w / 2
        b.append(f'<rect x="{x}" y="{112}" width="{col_w}" height="{240}" rx="14" fill="{CARD}" stroke="{LINE}" '
                 f'stroke-width="2"/>')
        b.append(pixel_art(art, cx, 128, 4))
        b.append(text(cx, 298, step, 19, TEXT, 700, "middle"))
        b.append(text(cx, 326, name, 16, MUTED, 400, "middle"))
        b.append(text(cx, rows_y[0], signer, 18, who.get(signer, MUTED), 700, "middle"))
        b.append(text(cx, rows_y[1], owner, 18, who.get(owner, MUTED), 700, "middle"))
        b.append(text(cx, rows_y[2], "none" if art == "fossil" else "Me", 18, MUTED if art == "fossil" else ME, 700,
                      "middle"))
        b.append(text(cx, rows_y[3] - 6, lamports, 17, GOLD, 700, "middle"))
        b.append(text(cx, rows_y[3] + 16, note, 13, MUTED, 400, "middle"))
    b.append(text(40, 660, "Numbers read from the devnet transactions. Burn refunds go to the transaction payer.", 16,
                  MUTED))
    return svg(1200, 690, "".join(b))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, make in [("spl-accounts", spl_accounts), ("nft-designs", nft_designs), ("dino-lifecycle", lifecycle)]:
        with open(os.path.join(OUT, f"{name}.svg"), "w") as f:
            f.write(make())

import Phaser from "phaser";

const VW = 420;
const VH = 700;

// ─── Types ───────────────────────────────────────────────────────────────────

type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Ultra Rare";
type Personality = "generous" | "fair" | "stingy";

interface Squishy {
  id: string;
  emoji: string;
  name: string;
  rarity: Rarity;
  value: number;
}

interface ComputerPlayer {
  name: string;
  emoji: string;
  personality: Personality;
  color: number;
}

interface ResultData {
  given: Squishy | null;
  received: Squishy[];
  score: number;
  collectionSize: number;
}

// ─── Light Palette ────────────────────────────────────────────────────────────
// Full light-mode redesign: warm white backgrounds, soft card fills,
// rich-but-readable text, colourful accents that pop.

const BG        = 0xf5f0ff; // soft lavender-white page background
const SURFACE   = 0xffffff; // pure white card fill
const SURFACE2  = 0xede9fe; // very light violet tint (secondary surfaces)
const BORDER    = 0xc4b5fd; // medium lavender border
const ACCENT    = 0x7c3aed; // deep violet (buttons, highlights)
const ACCENT2   = 0x9333ea; // vibrant purple (secondary accent)
const NEON_G    = 0x16a34a; // rich green
const NEON_R    = 0xdc2626; // rich red
const NEON_Y    = 0xd97706; // rich amber
const WHITE_STR = "#ffffff";
const DARK_STR  = "#1e1b4b"; // near-black indigo for body text
const MUTED_STR = "#6d28d9"; // muted violet for labels
const SUB_STR   = "#7c3aed"; // subtext purple

// ─── Difficulty badge colours ─────────────────────────────────────────────────

const DIFF_EASY_COLOR = 0xbbf7d0; // mint green
const DIFF_EASY_TEXT  = "#14532d";

const DIFF_FAIR_COLOR = 0xbae6fd; // sky blue
const DIFF_FAIR_TEXT  = "#075985";

const DIFF_HARD_COLOR = 0xfecaca; // light red
const DIFF_HARD_TEXT  = "#991b1b";

// ─── Data ────────────────────────────────────────────────────────────────────

const SQUISHIES: Squishy[] = [
  { id: "strawberry", emoji: "🍓", name: "Strawberry",  rarity: "Common",     value: 10 },
  { id: "donut",      emoji: "🍩", name: "Donut",       rarity: "Common",     value: 12 },
  { id: "star",       emoji: "⭐", name: "Star",        rarity: "Common",     value: 8  },
  { id: "cloud",      emoji: "☁️", name: "Cloud",       rarity: "Common",     value: 9  },
  { id: "lemon",      emoji: "🍋", name: "Lemon",       rarity: "Common",     value: 11 },
  { id: "cat",        emoji: "🐱", name: "Cat",         rarity: "Uncommon",   value: 22 },
  { id: "bunny",      emoji: "🐰", name: "Bunny",       rarity: "Uncommon",   value: 25 },
  { id: "bear",       emoji: "🐻", name: "Bear",        rarity: "Uncommon",   value: 20 },
  { id: "penguin",    emoji: "🐧", name: "Penguin",     rarity: "Uncommon",   value: 24 },
  { id: "frog",       emoji: "🐸", name: "Frog",        rarity: "Uncommon",   value: 21 },
  { id: "unicorn",    emoji: "🦄", name: "Unicorn",     rarity: "Rare",       value: 45 },
  { id: "dragon",     emoji: "🐉", name: "Dragon",      rarity: "Rare",       value: 50 },
  { id: "rainbow",    emoji: "🌈", name: "Rainbow",     rarity: "Rare",       value: 42 },
  { id: "gem",        emoji: "💎", name: "Crystal Gem", rarity: "Epic",       value: 70 },
  { id: "crown",      emoji: "👑", name: "Crown",       rarity: "Epic",       value: 75 },
  { id: "phoenix",    emoji: "🔥", name: "Phoenix",     rarity: "Legendary",  value: 88 },
  { id: "galaxy",     emoji: "🌌", name: "Galaxy",      rarity: "Legendary",  value: 92 },
  { id: "sparkle",    emoji: "✨", name: "Sparkle",     rarity: "Ultra Rare", value: 99 },
];

const COMPUTER_PLAYERS: ComputerPlayer[] = [
  { name: "Sunny",   emoji: "☀️", personality: "generous", color: 0xfde68a }, // lemon yellow
  { name: "Blossom", emoji: "🌸", personality: "generous", color: 0xfbcfe8 }, // rose pink
  { name: "Kai",     emoji: "🌊", personality: "fair",     color: 0x93c5fd }, // sky blue
  { name: "Nova",    emoji: "🔮", personality: "fair",     color: 0xd8b4fe }, // soft violet
  { name: "Zara",    emoji: "🖤", personality: "stingy",   color: 0xfca5a5 }, // coral red
  { name: "Vex",     emoji: "⚡", personality: "stingy",   color: 0xfdba74 }, // amber orange
];

const RARITY_COLORS: Record<Rarity, number> = {
  "Common":     0x9ca3af,
  "Uncommon":   0x16a34a,
  "Rare":       0x2563eb,
  "Epic":       0x9333ea,
  "Legendary":  0xd97706,
  "Ultra Rare": 0xdb2777,
};

const RARITY_ORDER: Rarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Ultra Rare"];

function rarityRank(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

// ─── Difficulty helpers ───────────────────────────────────────────────────────

interface DiffInfo {
  label: string;
  emoji: string;
  badgeColor: number;
  textColor: string;
}

function diffInfo(p: Personality): DiffInfo {
  if (p === "generous") return { label: "EASY", emoji: "😊", badgeColor: DIFF_EASY_COLOR, textColor: DIFF_EASY_TEXT };
  if (p === "fair")     return { label: "OK",   emoji: "🤝", badgeColor: DIFF_FAIR_COLOR, textColor: DIFF_FAIR_TEXT };
  return                       { label: "HARD", emoji: "😤", badgeColor: DIFF_HARD_COLOR, textColor: DIFF_HARD_TEXT };
}

// ─── Weighted random ─────────────────────────────────────────────────────────

function weightedRandomSquishy(maxValue: number, exclude: string[]): Squishy {
  const pool = SQUISHIES.filter(s => !exclude.includes(s.id) && s.value <= maxValue + 20);
  const safePool = pool.length > 0 ? pool : SQUISHIES.filter(s => !exclude.includes(s.id));
  const finalPool = safePool.length > 0 ? safePool : SQUISHIES;
  const weights = finalPool.map(s => Math.max(1, maxValue + 20 - s.value));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < finalPool.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return finalPool[i] ?? SQUISHIES[0]!;
  }
  return finalPool[finalPool.length - 1] ?? SQUISHIES[0]!;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "squishyswap_collection";

function loadCollection(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set<string>();
}

function saveCollection(col: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...col]));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexStr(n: number): string {
  return `#${n.toString(16).padStart(6, "0")}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] ?? arr[0]!;
}

function roundRect(
  gfx: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  r: number, fillColor: number, fillAlpha = 1,
  strokeColor?: number, strokeWidth = 2,
): void {
  gfx.clear();
  if (strokeColor !== undefined) gfx.lineStyle(strokeWidth, strokeColor, 1);
  gfx.fillStyle(fillColor, fillAlpha);
  gfx.fillRoundedRect(x, y, w, h, r);
  if (strokeColor !== undefined) gfx.strokeRoundedRect(x, y, w, h, r);
}

// ─── Menu Scene ───────────────────────────────────────────────────────────────

class MenuScene extends Phaser.Scene {
  constructor() { super("menu"); }

  create(): void {
    const col = loadCollection();

    // Light background
    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    // Subtle dot grid
    const gridGfx = this.add.graphics();
    gridGfx.fillStyle(0xddd6fe, 1);
    for (let x = 20; x < VW; x += 40) {
      for (let y = 20; y < VH; y += 40) {
        gridGfx.fillCircle(x, y, 1.5);
      }
    }

    // Soft glow orb behind logo
    const orbGfx = this.add.graphics();
    orbGfx.fillStyle(ACCENT, 0.08);
    orbGfx.fillCircle(VW / 2, 185, 120);
    this.tweens.add({ targets: orbGfx, scaleX: 1.1, scaleY: 1.1, duration: 2800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // Floating sparkle particles
    const particles = ["✦", "◆", "✧", "◇", "·"];
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * VW;
      const y = Math.random() * VH;
      const t = this.add.text(x, y, pick(particles), {
        fontSize: `${7 + Math.random() * 9}px`, color: hexStr(ACCENT),
      }).setAlpha(0.2);
      this.tweens.add({
        targets: t, y: y - 50 - Math.random() * 50, alpha: 0,
        duration: 3000 + Math.random() * 2000, delay: Math.random() * 3000,
        ease: "Sine.easeIn", repeat: -1,
        onRepeat: () => { t.x = Math.random() * VW; t.y = Math.random() * VH; t.setAlpha(0.2); },
      });
    }

    // Logo
    const logo = this.add.text(VW / 2, 165, "🧸", { fontSize: "80px" }).setOrigin(0.5);
    this.tweens.add({ targets: logo, y: 178, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.add.text(VW / 2, 258, "SQUISHY SWAP", {
      fontFamily: "Fraunces, serif", fontSize: "34px", color: DARK_STR,
      stroke: hexStr(ACCENT), strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(VW / 2, 294, "trade rare. flex harder. 💜", {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: MUTED_STR,
    }).setOrigin(0.5);

    // Collection pill
    const pillGfx = this.add.graphics();
    roundRect(pillGfx, VW / 2 - 96, 320, 192, 34, 17, SURFACE, 1, BORDER, 2);
    this.add.text(VW / 2, 337, `📦  ${col.size} / ${SQUISHIES.length} collected`, {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: DARK_STR,
    }).setOrigin(0.5);

    // Difficulty legend
    this.buildDiffLegend(384);

    // Play button
    this.makePillButton(VW / 2, 464, 230, 58, "PLAY NOW  ▶", ACCENT, WHITE_STR, () => {
      this.cameras.main.fadeOut(180, 245, 240, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade"));
    });

    // Collection button
    this.makeGhostButton(VW / 2, 536, 230, 52, "MY COLLECTION  →", () => {
      this.cameras.main.fadeOut(180, 245, 240, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("collection"));
    });

    this.add.text(VW / 2, VH - 24, "freegamestore.online", {
      fontFamily: "Manrope, sans-serif", fontSize: "10px", color: hexStr(BORDER),
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(280, 245, 240, 255);
  }

  private buildDiffLegend(cy: number): void {
    this.add.text(VW / 2, cy - 14, "TRADER DIFFICULTY", {
      fontFamily: "Manrope, sans-serif", fontSize: "9px", fontStyle: "bold", color: MUTED_STR,
    }).setOrigin(0.5);

    const items = [
      { label: "😊 EASY", color: DIFF_EASY_COLOR, textColor: DIFF_EASY_TEXT },
      { label: "🤝 OK",   color: DIFF_FAIR_COLOR, textColor: DIFF_FAIR_TEXT },
      { label: "😤 HARD", color: DIFF_HARD_COLOR, textColor: DIFF_HARD_TEXT },
    ];
    const pillW = 80; const pillH = 26; const gap = 10;
    const totalW = items.length * pillW + (items.length - 1) * gap;
    const startX = (VW - totalW) / 2;

    items.forEach((item, i) => {
      const px = startX + i * (pillW + gap);
      const gfx = this.add.graphics();
      roundRect(gfx, px, cy, pillW, pillH, 13, item.color, 1, 0x000000, 0);
      this.add.text(px + pillW / 2, cy + pillH / 2, item.label, {
        fontFamily: "Manrope, sans-serif", fontSize: "10px", fontStyle: "bold", color: item.textColor,
      }).setOrigin(0.5);
    });
  }

  private makePillButton(
    x: number, y: number, w: number, h: number,
    label: string, fill: number, textColor: string,
    onDown: () => void,
  ): void {
    const gfx = this.add.graphics();
    roundRect(gfx, x - w / 2, y - h / 2, w, h, h / 2, fill, 1);
    const hitZone = this.add.rectangle(x, y, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: "Manrope, sans-serif", fontSize: "18px", fontStyle: "bold", color: textColor }).setOrigin(0.5);
    hitZone.on("pointerover", () => this.tweens.add({ targets: gfx, scaleX: 1.04, scaleY: 1.04, duration: 80 }));
    hitZone.on("pointerout",  () => this.tweens.add({ targets: gfx, scaleX: 1.0,  scaleY: 1.0,  duration: 80 }));
    hitZone.on("pointerdown", onDown);
  }

  private makeGhostButton(
    x: number, y: number, w: number, h: number,
    label: string, onDown: () => void,
  ): void {
    const gfx = this.add.graphics();
    roundRect(gfx, x - w / 2, y - h / 2, w, h, h / 2, SURFACE2, 1, BORDER, 2);
    const hitZone = this.add.rectangle(x, y, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: "Manrope, sans-serif", fontSize: "15px", fontStyle: "bold", color: hexStr(ACCENT) }).setOrigin(0.5);
    hitZone.on("pointerover", () => this.tweens.add({ targets: gfx, scaleX: 1.04, scaleY: 1.04, duration: 80 }));
    hitZone.on("pointerout",  () => this.tweens.add({ targets: gfx, scaleX: 1.0,  scaleY: 1.0,  duration: 80 }));
    hitZone.on("pointerdown", onDown);
  }
}

// ─── Trade Scene ──────────────────────────────────────────────────────────────

class TradeScene extends Phaser.Scene {
  private readonly onScore: (n: number) => void;

  private collection!: Set<string>;
  private mySquishy!: Squishy;
  private cp!: ComputerPlayer;
  private offered: Squishy[] = [];
  private addCount = 0;
  private cpIndex = 0;

  private readonly MAX_ADD = 3;
  private readonly MAX_CP  = 5;

  private speechText!: Phaser.GameObjects.Text;
  private speechBubble!: Phaser.GameObjects.Graphics;
  private addBtn!: Phaser.GameObjects.Rectangle;
  private addBtnLabel!: Phaser.GameObjects.Text;
  private cardLayer!: Phaser.GameObjects.Layer;

  private thermoBg!: Phaser.GameObjects.Graphics;
  private thermoFill!: Phaser.GameObjects.Graphics;
  private thermoBulb!: Phaser.GameObjects.Graphics;
  private thermoLabel!: Phaser.GameObjects.Text;

  constructor(onScore: (n: number) => void) {
    super("trade");
    this.onScore = onScore;
  }

  create(): void {
    this.collection = loadCollection();
    if (this.collection.size === 0) {
      this.collection.add("strawberry");
      saveCollection(this.collection);
    }
    this.cpIndex = 0;
    this.buildTrade();
  }

  private buildTrade(): void {
    this.children.removeAll(true);
    this.tweens.killAll();

    const myIds = [...this.collection];
    const myId = pick(myIds);
    this.mySquishy = SQUISHIES.find(s => s.id === myId) ?? SQUISHIES[0]!;
    this.cp = COMPUTER_PLAYERS[this.cpIndex % COMPUTER_PLAYERS.length]!;
    this.addCount = 0;
    this.offered = this.generateOffer();

    // Light background
    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    // Subtle dot grid
    const gridGfx = this.add.graphics();
    gridGfx.fillStyle(0xddd6fe, 1);
    for (let x = 20; x < VW; x += 40) {
      for (let y = 20; y < VH; y += 40) {
        gridGfx.fillCircle(x, y, 1.5);
      }
    }

    // Trader header — white card with pastel left border stripe
    const headerGfx = this.add.graphics();
    roundRect(headerGfx, 0, 0, VW, 128, 0, SURFACE, 1, BORDER, 1);
    // Thick pastel left stripe
    const stripeGfx = this.add.graphics();
    stripeGfx.fillStyle(this.cp.color, 1);
    stripeGfx.fillRect(0, 0, 6, 128);
    // Pastel top strip
    const topGfx = this.add.graphics();
    topGfx.fillStyle(this.cp.color, 0.35);
    topGfx.fillRect(0, 0, VW, 4);

    this.add.text(18, 18, this.cp.emoji, { fontSize: "44px" });
    this.add.text(76, 22, this.cp.name.toUpperCase(), {
      fontFamily: "Fraunces, serif", fontSize: "20px", color: DARK_STR,
    });
    this.add.text(76, 52, this.personalityLabel(), {
      fontFamily: "Manrope, sans-serif", fontSize: "12px", color: MUTED_STR,
    });

    // Difficulty badge
    const diff = diffInfo(this.cp.personality);
    const badgeW = 84; const badgeH = 28;
    const badgeX = VW - 14 - badgeW;
    const badgeY = 14;
    const badgeGfx = this.add.graphics();
    roundRect(badgeGfx, badgeX, badgeY, badgeW, badgeH, 14, diff.badgeColor, 1);
    this.add.text(badgeX + badgeW / 2, badgeY + badgeH / 2,
      `${diff.emoji} ${diff.label}`, {
        fontFamily: "Manrope, sans-serif", fontSize: "12px", fontStyle: "bold", color: diff.textColor,
      }).setOrigin(0.5);

    // Trader counter pill
    const counterGfx = this.add.graphics();
    roundRect(counterGfx, badgeX, badgeY + badgeH + 6, badgeW, 22, 11, SURFACE2, 1, BORDER, 1);
    this.add.text(badgeX + badgeW / 2, badgeY + badgeH + 17,
      `${this.cpIndex + 1} / ${this.MAX_CP}`, {
        fontFamily: "Manrope, sans-serif", fontSize: "11px", color: MUTED_STR,
      }).setOrigin(0.5);

    // Speech bubble
    this.speechBubble = this.add.graphics();
    this.speechText = this.add.text(VW / 2, 118, "", {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: hexStr(ACCENT2),
    }).setOrigin(0.5);
    this.drawSpeechBubble(this.getGreeting());

    // Divider
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, BORDER, 1);
    divGfx.moveTo(20, 148); divGfx.lineTo(VW - 20, 148);
    divGfx.strokePath();

    this.add.text(20, 158, "YOUR SQUISHY", {
      fontFamily: "Manrope, sans-serif", fontSize: "10px", fontStyle: "bold", color: MUTED_STR,
    });
    this.buildMyCard(VW / 2, 218);

    this.add.text(VW / 2, 272, "⇅", {
      fontFamily: "Manrope, sans-serif", fontSize: "20px", color: hexStr(ACCENT),
    }).setOrigin(0.5);

    this.add.text(20, 298, "THEY OFFER", {
      fontFamily: "Manrope, sans-serif", fontSize: "10px", fontStyle: "bold", color: MUTED_STR,
    });

    this.cardLayer = this.add.layer();
    this.buildOfferedCards();

    this.buildThermometer();
    this.buildButtons();

    this.cameras.main.fadeIn(200, 245, 240, 255);
  }

  private drawSpeechBubble(text: string): void {
    this.speechBubble.clear();
    roundRect(this.speechBubble, 16, 100, VW - 32, 36, 10, SURFACE2, 1, BORDER, 1);
    this.speechText.setText(text);
  }

  private buildMyCard(cx: number, cy: number): void {
    const sq = this.mySquishy;
    const rc = RARITY_COLORS[sq.rarity];
    const cardGfx = this.add.graphics();
    roundRect(cardGfx, cx - 72, cy - 44, 144, 88, 12, SURFACE, 1, rc, 2);
    this.add.text(cx, cy - 18, sq.emoji, { fontSize: "28px" }).setOrigin(0.5);
    this.add.text(cx, cy + 16, sq.name, { fontFamily: "Manrope, sans-serif", fontSize: "12px", fontStyle: "bold", color: DARK_STR }).setOrigin(0.5);
    this.add.text(cx, cy + 32, sq.rarity.toUpperCase(), { fontFamily: "Manrope, sans-serif", fontSize: "9px", fontStyle: "bold", color: hexStr(rc) }).setOrigin(0.5);
    if (rarityRank(sq.rarity) >= 3) {
      this.tweens.add({ targets: cardGfx, alpha: 0.65, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  private buildOfferedCards(): void {
    this.cardLayer.removeAll(true);
    const count  = this.offered.length;
    const gap    = 10;
    const cardW  = Math.min(108, (VW - 32 - gap * (count - 1)) / count);
    const cardH  = 100;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = (VW - totalW) / 2 + cardW / 2;
    const cy     = 408;

    this.offered.forEach((sq, i) => {
      const cx = startX + i * (cardW + gap);
      const rc = RARITY_COLORS[sq.rarity];
      const cardGfx = this.add.graphics();
      roundRect(cardGfx, cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10, SURFACE, 1, rc, 2);
      const emojiT = this.add.text(cx, cy - 22, sq.emoji, { fontSize: "24px" }).setOrigin(0.5);
      const nameT  = this.add.text(cx, cy + 16, sq.name, {
        fontFamily: "Manrope, sans-serif", fontSize: "9px", fontStyle: "bold", color: DARK_STR,
        wordWrap: { width: cardW - 8 }, align: "center",
      }).setOrigin(0.5);
      const rarT = this.add.text(cx, cy + 34, sq.rarity.toUpperCase(), {
        fontFamily: "Manrope, sans-serif", fontSize: "8px", fontStyle: "bold", color: hexStr(rc),
      }).setOrigin(0.5);
      this.cardLayer.add([cardGfx, emojiT, nameT, rarT]);

      const targets = [cardGfx, emojiT, nameT, rarT];
      targets.forEach(t => t.setScale(0.01));
      this.tweens.add({ targets, scaleX: 1, scaleY: 1, duration: 280, delay: i * 70, ease: "Back.easeOut" });

      if (rarityRank(sq.rarity) >= 2) {
        const badge = this.add.text(cx + cardW / 2 - 8, cy - cardH / 2 + 2, "✦", { fontSize: "11px", color: hexStr(rc) });
        this.cardLayer.add(badge);
        this.tweens.add({
          targets: badge, y: badge.y - 14, alpha: 0, duration: 1100, repeat: -1, delay: i * 180, ease: "Sine.easeIn",
          onRepeat: () => { badge.y = cy - cardH / 2 + 2; badge.setAlpha(1); },
        });
      }
    });
  }

  private buildThermometer(): void {
    const barX  = 52;
    const barY  = 516;
    const barW  = VW - 104;
    const barH  = 14;
    const bulbR = 11;

    this.thermoBg = this.add.graphics();
    this.thermoBg.fillStyle(SURFACE2, 1);
    this.thermoBg.fillRoundedRect(barX, barY - barH / 2, barW, barH, barH / 2);
    this.thermoBg.lineStyle(1, BORDER, 1);
    this.thermoBg.strokeRoundedRect(barX, barY - barH / 2, barW, barH, barH / 2);

    this.thermoFill = this.add.graphics();
    this.thermoBulb = this.add.graphics();

    this.add.text(barX - 4,        barY + 12, "😬", { fontSize: "13px" }).setOrigin(0.5);
    this.add.text(barX + barW + 4, barY + 12, "🔥", { fontSize: "13px" }).setOrigin(0.5);

    this.thermoLabel = this.add.text(VW / 2, barY - 18, "", {
      fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: MUTED_STR,
    }).setOrigin(0.5);

    this.refreshThermometer(barX, barY, barW, barH, bulbR);
  }

  private refreshThermometer(barX: number, barY: number, barW: number, barH: number, bulbR: number): void {
    const myVal  = this.mySquishy.value;
    const offVal = this.offered.reduce((s, q) => s + q.value, 0);
    const ratio  = offVal / Math.max(myVal, 1);
    const t      = Phaser.Math.Clamp((ratio - 0.4) / 1.6, 0, 1);

    let fillColor: number;
    let labelText: string;
    if (t < 0.33) {
      fillColor = NEON_R;
      labelText = t < 0.15 ? "😬 terrible deal" : "not great...";
    } else if (t < 0.55) {
      fillColor = NEON_Y;
      labelText = "kinda fair 🤔";
    } else if (t < 0.75) {
      fillColor = 0x059669;
      labelText = "solid deal 👍";
    } else {
      fillColor = NEON_G;
      labelText = t > 0.9 ? "insane deal!! 🔥" : "great deal ✨";
    }

    const fillW = Math.max(barH, t * barW);
    this.thermoFill.clear();
    this.thermoFill.fillStyle(fillColor, 1);
    this.thermoFill.fillRoundedRect(barX, barY - barH / 2, fillW, barH, barH / 2);
    this.thermoBulb.clear();
    this.thermoBulb.fillStyle(fillColor, 1);
    this.thermoBulb.fillCircle(barX, barY, bulbR);
    this.thermoLabel.setText(labelText);
    this.thermoLabel.setColor(hexStr(fillColor));
  }

  private buildButtons(): void {
    const by = 596; const bh = 60; const bw = 118;

    // Accept — green
    const acceptGfx = this.add.graphics();
    roundRect(acceptGfx, 10, by - bh / 2, bw, bh, 14, 0xd1fae5, 1, 0x16a34a, 2);
    const acceptHit = this.add.rectangle(10 + bw / 2, by, bw, bh, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(10 + bw / 2, by - 10, "✅", { fontSize: "20px" }).setOrigin(0.5);
    this.add.text(10 + bw / 2, by + 16, "ACCEPT", { fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#14532d" }).setOrigin(0.5);

    // Add more — yellow
    const addGfx = this.add.graphics();
    roundRect(addGfx, VW / 2 - bw / 2, by - bh / 2, bw, bh, 14, 0xfef3c7, 1, 0xd97706, 2);
    this.addBtn = this.add.rectangle(VW / 2, by, bw, bh, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, by - 10, "➕", { fontSize: "20px" }).setOrigin(0.5);
    this.addBtnLabel = this.add.text(VW / 2, by + 16, "ADD MORE", { fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#78350f" }).setOrigin(0.5);

    // Reject — red
    const rejectGfx = this.add.graphics();
    roundRect(rejectGfx, VW - 10 - bw, by - bh / 2, bw, bh, 14, 0xffe4e6, 1, 0xdc2626, 2);
    const rejectHit = this.add.rectangle(VW - 10 - bw / 2, by, bw, bh, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(VW - 10 - bw / 2, by - 10, "❌", { fontSize: "20px" }).setOrigin(0.5);
    this.add.text(VW - 10 - bw / 2, by + 16, "REJECT", { fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#7f1d1d" }).setOrigin(0.5);

    this.refreshAddBtn(addGfx);

    acceptHit.on("pointerdown", () => this.doAccept());
    this.addBtn.on("pointerdown", () => this.doAddMore(addGfx));
    rejectHit.on("pointerdown", () => this.doReject());
  }

  private refreshAddBtn(gfx: Phaser.GameObjects.Graphics): void {
    const bw = 118; const bh = 60; const by = 596;
    const disabled = this.addCount >= this.MAX_ADD;
    roundRect(gfx, VW / 2 - bw / 2, by - bh / 2, bw, bh, 14,
      disabled ? 0xf3f4f6 : 0xfef3c7, 1,
      disabled ? 0xd1d5db : 0xd97706, 2);
    this.addBtnLabel.setText(disabled ? "MAX ADDED" : `ADD MORE (${this.MAX_ADD - this.addCount})`);
    this.addBtnLabel.setColor(disabled ? "#9ca3af" : "#78350f");
    this.addBtn.setInteractive(!disabled ? { useHandCursor: true } : undefined);
  }

  private generateOffer(): Squishy[] {
    const myVal = this.mySquishy.value;
    let budget: number;
    if (this.cp.personality === "generous") {
      budget = myVal * (1.1 + Math.random() * 0.6);
    } else if (this.cp.personality === "fair") {
      budget = myVal * (0.7 + Math.random() * 0.5);
    } else {
      budget = myVal * (0.3 + Math.random() * 0.4);
    }

    const count = 1 + Math.floor(Math.random() * 3);
    const result: Squishy[] = [];
    const used: string[] = [this.mySquishy.id];
    for (let i = 0; i < count; i++) {
      const s = weightedRandomSquishy(budget / (count - i), used);
      result.push(s);
      used.push(s.id);
    }
    return result;
  }

  private personalityLabel(): string {
    if (this.cp.personality === "generous") return "✨ Generous trader — great deals!";
    if (this.cp.personality === "fair")     return "🤝 Fair trader — balanced offers";
    return "😤 Stingy trader — drive a hard bargain!";
  }

  private getGreeting(): string {
    const greetings: Record<Personality, string[]> = {
      generous: ["Hey! I love swapping 💜", "Great timing! I'm feeling generous~", "Let's make a deal! ✨"],
      fair:     ["Wanna trade? Let's see…", "I'll offer something fair 🤝", "Deal or no deal? 👀"],
      stingy:   ["Hmph. Fine, I'll trade.", "Don't expect much 😤", "My squishies are RARE, ok?!"],
    };
    return pick(greetings[this.cp.personality]);
  }

  private doAccept(): void {
    const received = [...this.offered];
    const given = this.mySquishy;
    this.collection.delete(given.id);
    received.forEach(s => this.collection.add(s.id));
    saveCollection(this.collection);

    const score = received.reduce((s, q) => s + rarityRank(q.rarity) * 10, 0);
    this.onScore(score);

    this.cpIndex++;
    if (this.cpIndex >= this.MAX_CP) {
      const data: ResultData = { given, received, score, collectionSize: this.collection.size };
      this.cameras.main.fadeOut(200, 245, 240, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("result", data));
    } else {
      this.cameras.main.fadeOut(180, 245, 240, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.buildTrade());
    }
  }

  private doAddMore(addGfx: Phaser.GameObjects.Graphics): void {
    if (this.addCount >= this.MAX_ADD) return;
    this.addCount++;
    const extra = weightedRandomSquishy(
      this.mySquishy.value * (this.cp.personality === "generous" ? 1.2 : this.cp.personality === "fair" ? 0.9 : 0.5),
      [this.mySquishy.id, ...this.offered.map(s => s.id)],
    );
    this.offered.push(extra);
    this.buildOfferedCards();
    this.refreshAddBtn(addGfx);

    const barX = 52; const barY = 516; const barW = VW - 104; const barH = 14; const bulbR = 11;
    this.refreshThermometer(barX, barY, barW, barH, bulbR);

    const speech: Record<Personality, string[]> = {
      generous: ["Here, take more! 💜", "Okay okay, extra! ✨", "You drive a hard bargain~"],
      fair:     ["Alright, one more…", "Fine, I'll add one.", "This is my final offer!"],
      stingy:   ["Ugh, FINE. 😤", "You're lucky I like you.", "Don't push it!!"],
    };
    this.drawSpeechBubble(pick(speech[this.cp.personality]));
  }

  private doReject(): void {
    const speech: Record<Personality, string[]> = {
      generous: ["Aw, next time! 🌸", "No worries~ ✨", "Come back soon! 💜"],
      fair:     ["Fair enough.", "Maybe next time.", "Alright, moving on."],
      stingy:   ["RUDE.", "Fine, your loss 😤", "I didn't want to trade anyway!!"],
    };
    this.drawSpeechBubble(pick(speech[this.cp.personality]));

    this.time.delayedCall(700, () => {
      this.cpIndex++;
      if (this.cpIndex >= this.MAX_CP) {
        const data: ResultData = { given: null, received: [], score: 0, collectionSize: this.collection.size };
        this.cameras.main.fadeOut(200, 245, 240, 255);
        this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("result", data));
      } else {
        this.cameras.main.fadeOut(180, 245, 240, 255);
        this.cameras.main.once("camerafadeoutcomplete", () => this.buildTrade());
      }
    });
  }
}

// ─── Result Scene ─────────────────────────────────────────────────────────────

class ResultScene extends Phaser.Scene {
  private readonly onScore: (n: number) => void;

  constructor(onScore: (n: number) => void) {
    super("result");
    this.onScore = onScore;
  }

  create(data: ResultData): void {
    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    // Dot grid
    const gridGfx = this.add.graphics();
    gridGfx.fillStyle(0xddd6fe, 1);
    for (let x = 20; x < VW; x += 40) {
      for (let y = 20; y < VH; y += 40) {
        gridGfx.fillCircle(x, y, 1.5);
      }
    }

    const accepted = data.given !== null;
    const bigEmoji = accepted ? "🎉" : "😔";
    const headline = accepted ? "TRADE COMPLETE!" : "ROUND OVER";
    const headColor = accepted ? "#14532d" : "#7f1d1d";
    const headBg    = accepted ? 0xd1fae5 : 0xffe4e6;
    const headBorder = accepted ? 0x16a34a : 0xdc2626;

    // Headline card
    const hGfx = this.add.graphics();
    roundRect(hGfx, VW / 2 - 150, 60, 300, 90, 18, headBg, 1, headBorder, 2);
    this.add.text(VW / 2, 88, bigEmoji, { fontSize: "36px" }).setOrigin(0.5);
    this.add.text(VW / 2, 122, headline, {
      fontFamily: "Fraunces, serif", fontSize: "22px", color: headColor,
    }).setOrigin(0.5);

    // Score badge
    const scoreGfx = this.add.graphics();
    roundRect(scoreGfx, VW / 2 - 80, 166, 160, 36, 18, SURFACE2, 1, BORDER, 2);
    this.add.text(VW / 2, 184, `⭐  +${data.score} pts`, {
      fontFamily: "Manrope, sans-serif", fontSize: "16px", fontStyle: "bold", color: hexStr(ACCENT),
    }).setOrigin(0.5);

    // Trade summary
    if (accepted && data.given) {
      const summaryGfx = this.add.graphics();
      roundRect(summaryGfx, 16, 218, VW - 32, 110, 14, SURFACE, 1, BORDER, 1);

      this.add.text(VW / 2, 238, "YOU GAVE", {
        fontFamily: "Manrope, sans-serif", fontSize: "9px", fontStyle: "bold", color: MUTED_STR,
      }).setOrigin(0.5);
      this.add.text(VW / 2, 258, `${data.given.emoji} ${data.given.name}`, {
        fontFamily: "Manrope, sans-serif", fontSize: "16px", fontStyle: "bold", color: DARK_STR,
      }).setOrigin(0.5);

      this.add.text(VW / 2, 288, "YOU GOT", {
        fontFamily: "Manrope, sans-serif", fontSize: "9px", fontStyle: "bold", color: MUTED_STR,
      }).setOrigin(0.5);
      const gotStr = data.received.map(s => `${s.emoji} ${s.name}`).join("  ·  ");
      this.add.text(VW / 2, 308, gotStr, {
        fontFamily: "Manrope, sans-serif", fontSize: "13px", fontStyle: "bold", color: DARK_STR,
        wordWrap: { width: VW - 64 }, align: "center",
      }).setOrigin(0.5);
    }

    // Collection size
    const colGfx = this.add.graphics();
    roundRect(colGfx, VW / 2 - 110, 344, 220, 36, 18, SURFACE2, 1, BORDER, 1);
    this.add.text(VW / 2, 362, `📦  ${data.collectionSize} / ${SQUISHIES.length} in collection`, {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: DARK_STR,
    }).setOrigin(0.5);

    // Confetti burst for accepted trades
    if (accepted) {
      const confettiColors = [0xf472b6, 0xfbbf24, 0x34d399, 0x60a5fa, 0xc084fc, 0xfb7185];
      for (let i = 0; i < 22; i++) {
        const cx = Math.random() * VW;
        const cy = 50 + Math.random() * 200;
        const c = this.add.graphics();
        c.fillStyle(confettiColors[i % confettiColors.length]!, 1);
        c.fillRect(0, 0, 8, 8);
        c.setPosition(cx, cy);
        this.tweens.add({
          targets: c, y: cy + 120 + Math.random() * 100, alpha: 0,
          angle: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 900 + Math.random() * 600, delay: i * 40, ease: "Quad.easeIn",
        });
      }
    }

    // Buttons
    this.makePillButton(VW / 2, 430, 220, 56, "PLAY AGAIN  ▶", ACCENT, WHITE_STR, () => {
      this.cameras.main.fadeOut(180, 245, 240, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade"));
    });

    this.makeGhostButton(VW / 2, 500, 220, 50, "MY COLLECTION  →", () => {
      this.cameras.main.fadeOut(180, 245, 240, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("collection"));
    });

    this.makeGhostButton(VW / 2, 562, 220, 50, "MAIN MENU  ←", () => {
      this.cameras.main.fadeOut(180, 245, 240, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
    });

    this.add.text(VW / 2, VH - 24, "freegamestore.online", {
      fontFamily: "Manrope, sans-serif", fontSize: "10px", color: hexStr(BORDER),
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(280, 245, 240, 255);
  }

  private makePillButton(
    x: number, y: number, w: number, h: number,
    label: string, fill: number, textColor: string,
    onDown: () => void,
  ): void {
    const gfx = this.add.graphics();
    roundRect(gfx, x - w / 2, y - h / 2, w, h, h / 2, fill, 1);
    const hit = this.add.rectangle(x, y, w, h, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: "Manrope, sans-serif", fontSize: "17px", fontStyle: "bold", color: textColor }).setOrigin(0.5);
    hit.on("pointerover", () => this.tweens.add({ targets: gfx, scaleX: 1.04, scaleY: 1.04, duration: 80 }));
    hit.on("pointerout",  () => this.tweens.add({ targets: gfx, scaleX: 1.0,  scaleY: 1.0,  duration: 80 }));
    hit.on("pointerdown", onDown);
  }

  private makeGhostButton(
    x: number, y: number, w: number, h: number,
    label: string, onDown: () => void,
  ): void {
    const gfx = this.add.graphics();
    roundRect(gfx, x - w / 2, y - h / 2, w, h, h / 2, SURFACE2, 1, BORDER, 2);
    const hit = this.add.rectangle(x, y, w, h, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: "Manrope, sans-serif", fontSize: "14px", fontStyle: "bold", color: hexStr(ACCENT) }).setOrigin(0.5);
    hit.on("pointerover", () => this.tweens.add({ targets: gfx, scaleX: 1.04, scaleY: 1.04, duration: 80 }));
    hit.on("pointerout",  () => this.tweens.add({ targets: gfx, scaleX: 1.0,  scaleY: 1.0,  duration: 80 }));
    hit.on("pointerdown", onDown);
  }
}

// ─── Collection Scene ─────────────────────────────────────────────────────────

class CollectionScene extends Phaser.Scene {
  constructor() { super("collection"); }

  create(): void {
    const col = loadCollection();

    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    // Dot grid
    const gridGfx = this.add.graphics();
    gridGfx.fillStyle(0xddd6fe, 1);
    for (let x = 20; x < VW; x += 40) {
      for (let y = 20; y < VH; y += 40) {
        gridGfx.fillCircle(x, y, 1.5);
      }
    }

    // Header
    const hGfx = this.add.graphics();
    roundRect(hGfx, 0, 0, VW, 64, 0, SURFACE, 1, BORDER, 1);
    this.add.text(VW / 2, 32, `📦  MY COLLECTION  (${col.size} / ${SQUISHIES.length})`, {
      fontFamily: "Fraunces, serif", fontSize: "18px", color: DARK_STR,
    }).setOrigin(0.5);

    // Grid of squishies
    const cols  = 4;
    const cardW = 88;
    const cardH = 92;
    const gapX  = 12;
    const gapY  = 10;
    const startX = (VW - (cols * cardW + (cols - 1) * gapX)) / 2 + cardW / 2;
    const startY = 96;

    SQUISHIES.forEach((sq, i) => {
      const col_ = i % cols;
      const row  = Math.floor(i / cols);
      const cx   = startX + col_ * (cardW + gapX);
      const cy   = startY + row  * (cardH + gapY);
      const owned = col.has(sq.id);
      const rc    = RARITY_COLORS[sq.rarity];

      const cardGfx = this.add.graphics();
      roundRect(cardGfx, cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10,
        owned ? SURFACE : 0xf3f4f6, 1,
        owned ? rc : 0xe5e7eb, owned ? 2 : 1);

      this.add.text(cx, cy - 20, owned ? sq.emoji : "❓", { fontSize: "22px" }).setOrigin(0.5).setAlpha(owned ? 1 : 0.35);
      this.add.text(cx, cy + 12, owned ? sq.name : "???", {
        fontFamily: "Manrope, sans-serif", fontSize: "8px", fontStyle: "bold",
        color: owned ? DARK_STR : "#9ca3af",
        wordWrap: { width: cardW - 8 }, align: "center",
      }).setOrigin(0.5);
      this.add.text(cx, cy + 30, sq.rarity.toUpperCase(), {
        fontFamily: "Manrope, sans-serif", fontSize: "7px", fontStyle: "bold",
        color: owned ? hexStr(rc) : "#d1d5db",
      }).setOrigin(0.5);
    });

    // Back button
    const backGfx = this.add.graphics();
    roundRect(backGfx, VW / 2 - 100, VH - 56, 200, 44, 22, SURFACE2, 1, BORDER, 2);
    const backHit = this.add.rectangle(VW / 2, VH - 34, 200, 44, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, VH - 34, "← BACK", {
      fontFamily: "Manrope, sans-serif", fontSize: "15px", fontStyle: "bold", color: hexStr(ACCENT),
    }).setOrigin(0.5);
    backHit.on("pointerdown", () => {
      this.cameras.main.fadeOut(180, 245, 240, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
    });

    this.add.text(VW / 2, VH - 10, "freegamestore.online", {
      fontFamily: "Manrope, sans-serif", fontSize: "9px", color: hexStr(BORDER),
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(280, 245, 240, 255);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

export function startGame(parent: HTMLElement, onScore: (n: number) => void): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: VW,
    height: VH,
    backgroundColor: "#f5f0ff",
    parent,
    scene: [
      MenuScene,
      new TradeScene(onScore),
      new ResultScene(onScore),
      CollectionScene,
    ],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
  return () => game.destroy(true);
}

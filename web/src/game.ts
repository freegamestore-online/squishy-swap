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
  color: number; // header border/glow colour — pastel, signals difficulty
}

interface ResultData {
  given: Squishy | null;
  received: Squishy[];
  score: number;
  collectionSize: number;
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const BG       = 0x0d0d1a;
const SURFACE  = 0x16162a;
const SURFACE2 = 0x1e1e38;
const BORDER   = 0x2e2e52;
const ACCENT   = 0x7c3aed;
const ACCENT2  = 0xa855f7;
const NEON_G   = 0x4ade80;
const NEON_R   = 0xf43f5e;
const NEON_Y   = 0xfbbf24;
const WHITE    = "#ffffff";
const MUTED    = "#6b7280";
const SUBTEXT  = "#9ca3af";

// ─── Difficulty colours (all light pastels now) ───────────────────────────────
// EASY  — mint green
// OK    — periwinkle blue
// HARD  — warm peach/coral
// All three are light enough to read dark text on, and pop on the dark BG.

const DIFF_EASY_COLOR = 0xa7f3d0; // light mint
const DIFF_EASY_TEXT  = "#064e3b";

const DIFF_FAIR_COLOR = 0xbfdbfe; // light periwinkle
const DIFF_FAIR_TEXT  = "#1e3a5f";

const DIFF_HARD_COLOR = 0xfed7aa; // light peach
const DIFF_HARD_TEXT  = "#7c2d12";

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

// Trader header colours — all light pastels so they pop on the dark BG.
// Easy = green-ish, Fair = blue-ish, Hard = warm orange/red.
const COMPUTER_PLAYERS: ComputerPlayer[] = [
  // EASY — generous, soft green pastels
  { name: "Sunny",   emoji: "☀️", personality: "generous", color: 0x6ee7b7 }, // light teal-green
  { name: "Blossom", emoji: "🌸", personality: "generous", color: 0xfda4af }, // light rose
  // FAIR — soft periwinkle / lavender
  { name: "Kai",     emoji: "🌊", personality: "fair",     color: 0x93c5fd }, // sky blue
  { name: "Nova",    emoji: "🔮", personality: "fair",     color: 0xd8b4fe }, // light violet
  // HARD — warm peach / amber (still light, but warm = danger)
  { name: "Zara",    emoji: "🖤", personality: "stingy",   color: 0xfb923c }, // bright orange
  { name: "Vex",     emoji: "⚡", personality: "stingy",   color: 0xf87171 }, // light red-coral
];

const RARITY_COLORS: Record<Rarity, number> = {
  "Common":     0x6b7280,
  "Uncommon":   0x4ade80,
  "Rare":       0x60a5fa,
  "Epic":       0xc084fc,
  "Legendary":  0xfbbf24,
  "Ultra Rare": 0xf472b6,
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

    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    // Grid
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x1a1a30, 1);
    for (let x = 0; x < VW; x += 40) { gridGfx.moveTo(x, 0); gridGfx.lineTo(x, VH); }
    for (let y = 0; y < VH; y += 40) { gridGfx.moveTo(0, y); gridGfx.lineTo(VW, y); }
    gridGfx.strokePath();

    // Glow orb
    const orbGfx = this.add.graphics();
    orbGfx.fillStyle(ACCENT, 0.18);
    orbGfx.fillCircle(VW / 2, 180, 110);
    this.tweens.add({ targets: orbGfx, scaleX: 1.12, scaleY: 1.12, duration: 2800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // Particles
    const particles = ["✦", "◆", "▸", "✧", "◇"];
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * VW;
      const y = Math.random() * VH;
      const t = this.add.text(x, y, pick(particles), { fontSize: `${8 + Math.random() * 10}px`, color: hexStr(ACCENT2) }).setAlpha(0.25);
      this.tweens.add({
        targets: t, y: y - 60 - Math.random() * 60, alpha: 0,
        duration: 3000 + Math.random() * 2000, delay: Math.random() * 3000,
        ease: "Sine.easeIn", repeat: -1,
        onRepeat: () => { t.x = Math.random() * VW; t.y = Math.random() * VH; t.setAlpha(0.25); },
      });
    }

    // Logo
    const logo = this.add.text(VW / 2, 165, "🧸", { fontSize: "76px" }).setOrigin(0.5);
    this.tweens.add({ targets: logo, y: 175, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.add.text(VW / 2, 252, "SQUISHY SWAP", {
      fontFamily: "Fraunces, serif", fontSize: "34px", color: WHITE,
      stroke: hexStr(ACCENT), strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(VW / 2, 290, "trade rare. flex harder. 💜", {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: hexStr(ACCENT2),
    }).setOrigin(0.5);

    // Collection pill
    const pillGfx = this.add.graphics();
    roundRect(pillGfx, VW / 2 - 90, 318, 180, 32, 16, SURFACE2, 1, BORDER, 1);
    this.add.text(VW / 2, 334, `📦  ${col.size} / ${SQUISHIES.length} collected`, {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: SUBTEXT,
    }).setOrigin(0.5);

    // Difficulty legend
    this.buildDiffLegend(380);

    // Play button
    this.makePillButton(VW / 2, 460, 230, 58, "PLAY NOW  ▶", ACCENT, WHITE, () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade"));
    });

    // Collection button
    this.makeGhostButton(VW / 2, 532, 230, 52, "MY COLLECTION  →", () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("collection"));
    });

    this.add.text(VW / 2, VH - 24, "freegamestore.online", {
      fontFamily: "Manrope, sans-serif", fontSize: "10px", color: "#2e2e52",
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(280, 13, 13, 26);
  }

  private buildDiffLegend(cy: number): void {
    this.add.text(VW / 2, cy - 14, "TRADER DIFFICULTY", {
      fontFamily: "Manrope, sans-serif", fontSize: "9px", fontStyle: "bold", color: MUTED,
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
      roundRect(gfx, px, cy, pillW, pillH, 13, item.color, 1);
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
    roundRect(gfx, x - w / 2, y - h / 2, w, h, h / 2, SURFACE2, 1, BORDER, 1);
    const hitZone = this.add.rectangle(x, y, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: "Manrope, sans-serif", fontSize: "15px", fontStyle: "bold", color: hexStr(ACCENT2) }).setOrigin(0.5);
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

    // Background
    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    // Grid
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x141428, 1);
    for (let x = 0; x < VW; x += 40) { gridGfx.moveTo(x, 0); gridGfx.lineTo(x, VH); }
    for (let y = 0; y < VH; y += 40) { gridGfx.moveTo(0, y); gridGfx.lineTo(VW, y); }
    gridGfx.strokePath();

    // CP header card — dark surface with a bright pastel border
    const headerGfx = this.add.graphics();
    roundRect(headerGfx, 0, 0, VW, 128, 0, SURFACE, 1, this.cp.color, 3);

    // Bright pastel glow strip at top
    const glowGfx = this.add.graphics();
    glowGfx.fillStyle(this.cp.color, 0.7);
    glowGfx.fillRect(0, 0, VW, 5);

    this.add.text(18, 18, this.cp.emoji, { fontSize: "44px" });
    this.add.text(76, 22, this.cp.name.toUpperCase(), {
      fontFamily: "Fraunces, serif", fontSize: "20px", color: WHITE,
    });
    // Personality label in the trader's pastel colour — now bright enough to see
    this.add.text(76, 52, this.personalityLabel(), {
      fontFamily: "Manrope, sans-serif", fontSize: "12px", color: hexStr(this.cp.color),
    });

    // ── Difficulty badge pill ──
    const diff = diffInfo(this.cp.personality);
    const badgeW = 84; const badgeH = 28;
    const badgeX = VW - 14 - badgeW;
    const badgeY = 14;
    const badgeGfx = this.add.graphics();
    roundRect(badgeGfx, badgeX, badgeY, badgeW, badgeH, 14, diff.badgeColor, 1);
    this.add.text(badgeX + badgeW / 2, badgeY + badgeH / 2,
      `${diff.emoji} ${diff.label}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: diff.textColor,
      }).setOrigin(0.5);

    // Trader counter pill (below badge)
    const counterGfx = this.add.graphics();
    roundRect(counterGfx, badgeX, badgeY + badgeH + 6, badgeW, 22, 11, SURFACE2, 1, BORDER, 1);
    this.add.text(badgeX + badgeW / 2, badgeY + badgeH + 17,
      `${this.cpIndex + 1} / ${this.MAX_CP}`, {
        fontFamily: "Manrope, sans-serif", fontSize: "11px", color: SUBTEXT,
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
      fontFamily: "Manrope, sans-serif", fontSize: "10px", fontStyle: "bold", color: MUTED,
    });
    this.buildMyCard(VW / 2, 218);

    this.add.text(VW / 2, 272, "⇅", {
      fontFamily: "Manrope, sans-serif", fontSize: "20px", color: hexStr(ACCENT2),
    }).setOrigin(0.5);

    this.add.text(20, 298, "THEY OFFER", {
      fontFamily: "Manrope, sans-serif", fontSize: "10px", fontStyle: "bold", color: MUTED,
    });

    this.cardLayer = this.add.layer();
    this.buildOfferedCards();

    this.buildThermometer();
    this.buildButtons();

    this.cameras.main.fadeIn(200, 13, 13, 26);
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
    this.add.text(cx, cy + 16, sq.name, { fontFamily: "Manrope, sans-serif", fontSize: "12px", fontStyle: "bold", color: WHITE }).setOrigin(0.5);
    this.add.text(cx, cy + 32, sq.rarity.toUpperCase(), { fontFamily: "Manrope, sans-serif", fontSize: "9px", fontStyle: "bold", color: hexStr(rc) }).setOrigin(0.5);
    if (rarityRank(sq.rarity) >= 3) {
      this.tweens.add({ targets: cardGfx, alpha: 0.7, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
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
        fontFamily: "Manrope, sans-serif", fontSize: "9px", fontStyle: "bold", color: WHITE,
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

    this.thermoFill  = this.add.graphics();
    this.thermoBulb  = this.add.graphics();

    this.add.text(barX - 4,        barY + 12, "😬", { fontSize: "13px" }).setOrigin(0.5);
    this.add.text(barX + barW + 4, barY + 12, "🔥", { fontSize: "13px" }).setOrigin(0.5);

    this.thermoLabel = this.add.text(VW / 2, barY - 18, "", {
      fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: SUBTEXT,
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
      fillColor = 0x34d399;
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

    // Accept
    const acceptGfx = this.add.graphics();
    roundRect(acceptGfx, 10, by - bh / 2, bw, bh, 14, 0x14532d, 1, NEON_G, 2);
    const acceptHit = this.add.rectangle(10 + bw / 2, by, bw, bh, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(10 + bw / 2, by - 10, "✅", { fontSize: "20px" }).setOrigin(0.5);
    this.add.text(10 + bw / 2, by + 16, "ACCEPT", { fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: hexStr(NEON_G) }).setOrigin(0.5);

    // Add more
    const addGfx = this.add.graphics();
    roundRect(addGfx, VW / 2 - bw / 2, by - bh / 2, bw, bh, 14, 0x451a03, 1, NEON_Y, 2);
    this.addBtn = this.add.rectangle(VW / 2, by, bw, bh, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, by - 10, "➕", { fontSize: "20px" }).setOrigin(0.5);
    this.addBtnLabel = this.add.text(VW / 2, by + 16, "ADD MORE", { fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: hexStr(NEON_Y) }).setOrigin(0.5);

    // Reject
    const rejectGfx = this.add.graphics();
    roundRect(rejectGfx, VW - 10 - bw, by - bh / 2, bw, bh, 14, 0x4c0519, 1, NEON_R, 2);
    const rejectHit = this.add.rectangle(VW - 10 - bw / 2, by, bw, bh, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(VW - 10 - bw / 2, by - 10, "❌", { fontSize: "20px" }).setOrigin(0.5);
    this.add.text(VW - 10 - bw / 2, by + 16, "REJECT", { fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: hexStr(NEON_R) }).setOrigin(0.5);

    this.refreshAddBtn(addGfx);

    for (const [hit, gfx] of [
      [acceptHit, acceptGfx], [this.addBtn, addGfx], [rejectHit, rejectGfx],
    ] as [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Graphics][]) {
      hit.on("pointerover", () => this.tweens.add({ targets: gfx, scaleX: 1.05, scaleY: 1.05, duration: 70 }));
      hit.on("pointerout",  () => this.tweens.add({ targets: gfx, scaleX: 1.0,  scaleY: 1.0,  duration: 70 }));
    }

    acceptHit.on("pointerdown", () => this.doAccept());
    this.addBtn.on("pointerdown", () => this.doAddMore(addGfx));
    rejectHit.on("pointerdown", () => this.doReject());
  }

  private refreshAddBtn(gfx: Phaser.GameObjects.Graphics): void {
    const remaining = this.MAX_ADD - this.addCount;
    const disabled  = remaining <= 0;
    const by = 596; const bh = 60; const bw = 118;
    roundRect(gfx, VW / 2 - bw / 2, by - bh / 2, bw, bh, 14, disabled ? 0x1a1a2e : 0x451a03, 1, disabled ? BORDER : NEON_Y, 2);
    this.addBtnLabel.setText(disabled ? "MAX ADDED" : `ADD MORE (${remaining})`);
    this.addBtn.setInteractive(disabled ? false : { useHandCursor: true });
  }

  private generateOffer(): Squishy[] {
    const myVal = this.mySquishy.value;
    const p     = this.cp.personality;

    // Generous: offer 1–2 squishies worth slightly more than yours
    // Fair:     offer 1–2 squishies worth roughly the same
    // Stingy:   offer 1 squishy worth less
    let totalTarget: number;
    let count: number;
    if (p === "generous") {
      totalTarget = myVal * (1.2 + Math.random() * 0.5);
      count = Math.random() < 0.5 ? 1 : 2;
    } else if (p === "fair") {
      totalTarget = myVal * (0.85 + Math.random() * 0.3);
      count = Math.random() < 0.4 ? 1 : 2;
    } else {
      totalTarget = myVal * (0.4 + Math.random() * 0.35);
      count = 1;
    }

    const result: Squishy[] = [];
    const used: string[] = [this.mySquishy.id];
    for (let i = 0; i < count; i++) {
      const perItem = totalTarget / (count - i);
      const sq = weightedRandomSquishy(perItem, used);
      result.push(sq);
      used.push(sq.id);
      totalTarget -= sq.value;
    }
    return result;
  }

  private personalityLabel(): string {
    if (this.cp.personality === "generous") return "✨ Generous trader — great deals!";
    if (this.cp.personality === "fair")     return "🤝 Fair trader — decent offers";
    return "😤 Stingy trader — watch out!";
  }

  private getGreeting(): string {
    const greetings: Record<Personality, string[]> = {
      generous: [
        `Hey! I love your ${this.mySquishy.name} 🥺 let's make a deal!`,
        `Omg I need that ${this.mySquishy.name}! Here's my best offer ✨`,
        `I'll be generous — check out what I've got! 🎁`,
      ],
      fair: [
        `Hmm, I'll give you a fair trade for that ${this.mySquishy.name}.`,
        `Let's keep it balanced. Here's my offer 🤝`,
        `I think this is pretty fair — what do you say?`,
      ],
      stingy: [
        `Take it or leave it. That's my only offer. 😤`,
        `Your ${this.mySquishy.name} isn't worth much to me tbh.`,
        `I'm doing YOU a favour here. 🙄`,
      ],
    };
    return pick(greetings[this.cp.personality]);
  }

  private doAccept(): void {
    // Swap: give mySquishy, receive offered squishies
    this.collection.delete(this.mySquishy.id);
    const newIds: string[] = [];
    for (const sq of this.offered) {
      this.collection.add(sq.id);
      newIds.push(sq.id);
    }
    saveCollection(this.collection);

    const score = this.offered.reduce((s, q) => s + q.value, 0) - this.mySquishy.value;
    this.onScore(Math.max(0, this.collection.size * 10));

    const data: ResultData = {
      given: this.mySquishy,
      received: this.offered,
      score,
      collectionSize: this.collection.size,
    };

    this.cameras.main.fadeOut(180, 13, 13, 26);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("result", data);
    });
  }

  private doAddMore(gfx: Phaser.GameObjects.Graphics): void {
    if (this.addCount >= this.MAX_ADD) return;
    this.addCount++;

    const used = [this.mySquishy.id, ...this.offered.map(s => s.id)];
    const extra = weightedRandomSquishy(this.mySquishy.value * 0.6, used);
    this.offered.push(extra);

    this.buildOfferedCards();
    this.refreshAddBtn(gfx);

    const barX = 52; const barY = 516; const barW = VW - 104; const barH = 14; const bulbR = 11;
    this.refreshThermometer(barX, barY, barW, barH, bulbR);

    // Reaction
    const reactions = ["Fine, fine... 🙄", "Ugh, okay 😤", "Happy now?! 😩", "Last one! 😤"];
    this.drawSpeechBubble(reactions[Math.min(this.addCount - 1, reactions.length - 1)] ?? "...");
  }

  private doReject(): void {
    this.cpIndex++;
    if (this.cpIndex >= this.MAX_CP) {
      // All traders done — go to result with no trade
      const data: ResultData = {
        given: null,
        received: [],
        score: 0,
        collectionSize: this.collection.size,
      };
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("result", data));
    } else {
      this.cameras.main.fadeOut(140, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.buildTrade());
    }
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

    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x1a1a30, 1);
    for (let x = 0; x < VW; x += 40) { gridGfx.moveTo(x, 0); gridGfx.lineTo(x, VH); }
    for (let y = 0; y < VH; y += 40) { gridGfx.moveTo(0, y); gridGfx.lineTo(VW, y); }
    gridGfx.strokePath();

    const traded = data.given !== null;
    const gained = data.score > 0;

    // Header
    this.add.text(VW / 2, 60, traded ? (gained ? "📈 NICE TRADE!" : "📉 ROUGH DEAL") : "😤 NO DEAL", {
      fontFamily: "Fraunces, serif",
      fontSize: "30px",
      color: traded ? (gained ? hexStr(NEON_G) : hexStr(NEON_R)) : hexStr(NEON_Y),
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    if (traded && data.given) {
      // Given
      this.add.text(VW / 2, 108, "You gave away", {
        fontFamily: "Manrope, sans-serif", fontSize: "12px", color: MUTED,
      }).setOrigin(0.5);
      this.add.text(VW / 2, 130, `${data.given.emoji}  ${data.given.name}`, {
        fontFamily: "Manrope, sans-serif", fontSize: "18px", fontStyle: "bold", color: WHITE,
      }).setOrigin(0.5);

      // Arrow
      this.add.text(VW / 2, 162, "↕", {
        fontFamily: "Manrope, sans-serif", fontSize: "22px", color: hexStr(ACCENT2),
      }).setOrigin(0.5);

      // Received
      this.add.text(VW / 2, 188, "You received", {
        fontFamily: "Manrope, sans-serif", fontSize: "12px", color: MUTED,
      }).setOrigin(0.5);

      const receivedStr = data.received.map(s => `${s.emoji} ${s.name}`).join("  +  ");
      this.add.text(VW / 2, 212, receivedStr, {
        fontFamily: "Manrope, sans-serif", fontSize: "16px", fontStyle: "bold", color: WHITE,
        wordWrap: { width: VW - 40 }, align: "center",
      }).setOrigin(0.5);

      // Score delta
      const deltaStr = data.score >= 0 ? `+${data.score} value` : `${data.score} value`;
      const deltaColor = data.score >= 0 ? hexStr(NEON_G) : hexStr(NEON_R);
      this.add.text(VW / 2, 268, deltaStr, {
        fontFamily: "Manrope, sans-serif", fontSize: "14px", fontStyle: "bold", color: deltaColor,
      }).setOrigin(0.5);
    } else {
      this.add.text(VW / 2, 200, "You walked away empty handed.\nMaybe next time! 💪", {
        fontFamily: "Manrope, sans-serif", fontSize: "16px", color: SUBTEXT,
        align: "center", wordWrap: { width: VW - 60 },
      }).setOrigin(0.5);
    }

    // Collection size
    const pillGfx = this.add.graphics();
    roundRect(pillGfx, VW / 2 - 110, 308, 220, 36, 18, SURFACE2, 1, BORDER, 1);
    this.add.text(VW / 2, 326, `📦  Collection: ${data.collectionSize} / ${SQUISHIES.length}`, {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: SUBTEXT,
    }).setOrigin(0.5);

    // New collection badge if unlocked
    if (traded && data.received.length > 0) {
      const newOnes = data.received.filter(s => {
        const col = loadCollection();
        return col.has(s.id);
      });
      if (newOnes.length > 0) {
        this.add.text(VW / 2, 360, "🆕 New squishy unlocked!", {
          fontFamily: "Manrope, sans-serif", fontSize: "13px", fontStyle: "bold", color: hexStr(NEON_G),
        }).setOrigin(0.5);
      }
    }

    // Play again
    this.makePillButton(VW / 2, 450, 220, 58, "TRADE AGAIN  ▶", ACCENT, WHITE, () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade"));
    });

    // Collection
    this.makeGhostButton(VW / 2, 526, 220, 52, "MY COLLECTION  →", () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("collection"));
    });

    // Menu
    this.makeGhostButton(VW / 2, 594, 220, 44, "← MENU", () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
    });

    this.cameras.main.fadeIn(240, 13, 13, 26);
    this.onScore(data.collectionSize * 10);
  }

  private makePillButton(
    x: number, y: number, w: number, h: number,
    label: string, fill: number, textColor: string,
    onDown: () => void,
  ): void {
    const gfx = this.add.graphics();
    roundRect(gfx, x - w / 2, y - h / 2, w, h, h / 2, fill, 1);
    const hitZone = this.add.rectangle(x, y, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: "Manrope, sans-serif", fontSize: "17px", fontStyle: "bold", color: textColor }).setOrigin(0.5);
    hitZone.on("pointerover", () => this.tweens.add({ targets: gfx, scaleX: 1.04, scaleY: 1.04, duration: 80 }));
    hitZone.on("pointerout",  () => this.tweens.add({ targets: gfx, scaleX: 1.0,  scaleY: 1.0,  duration: 80 }));
    hitZone.on("pointerdown", onDown);
  }

  private makeGhostButton(
    x: number, y: number, w: number, h: number,
    label: string, onDown: () => void,
  ): void {
    const gfx = this.add.graphics();
    roundRect(gfx, x - w / 2, y - h / 2, w, h, h / 2, SURFACE2, 1, BORDER, 1);
    const hitZone = this.add.rectangle(x, y, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: "Manrope, sans-serif", fontSize: "14px", fontStyle: "bold", color: hexStr(ACCENT2) }).setOrigin(0.5);
    hitZone.on("pointerover", () => this.tweens.add({ targets: gfx, scaleX: 1.04, scaleY: 1.04, duration: 80 }));
    hitZone.on("pointerout",  () => this.tweens.add({ targets: gfx, scaleX: 1.0,  scaleY: 1.0,  duration: 80 }));
    hitZone.on("pointerdown", onDown);
  }
}

// ─── Collection Scene ─────────────────────────────────────────────────────────

class CollectionScene extends Phaser.Scene {
  constructor() { super("collection"); }

  create(): void {
    const col = loadCollection();

    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x1a1a30, 1);
    for (let x = 0; x < VW; x += 40) { gridGfx.moveTo(x, 0); gridGfx.lineTo(x, VH); }
    for (let y = 0; y < VH; y += 40) { gridGfx.moveTo(0, y); gridGfx.lineTo(VW, y); }
    gridGfx.strokePath();

    this.add.text(VW / 2, 36, "MY COLLECTION", {
      fontFamily: "Fraunces, serif", fontSize: "26px", color: WHITE,
      stroke: hexStr(ACCENT), strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(VW / 2, 66, `${col.size} / ${SQUISHIES.length} squishies`, {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: SUBTEXT,
    }).setOrigin(0.5);

    // Grid of squishies
    const cols  = 4;
    const cellW = (VW - 24) / cols;
    const cellH = 90;
    const startY = 96;

    SQUISHIES.forEach((sq, idx) => {
      const col_i = idx % cols;
      const row   = Math.floor(idx / cols);
      const cx    = 12 + col_i * cellW + cellW / 2;
      const cy    = startY + row * cellH + cellH / 2;

      const owned = col.has(sq.id);
      const rc    = RARITY_COLORS[sq.rarity];

      const cardGfx = this.add.graphics();
      roundRect(
        cardGfx,
        cx - cellW / 2 + 4, cy - cellH / 2 + 4,
        cellW - 8, cellH - 8,
        8,
        owned ? SURFACE : 0x0a0a14,
        1,
        owned ? rc : BORDER,
        owned ? 2 : 1,
      );

      if (owned) {
        this.add.text(cx, cy - 16, sq.emoji, { fontSize: "22px" }).setOrigin(0.5);
        this.add.text(cx, cy + 12, sq.name, {
          fontFamily: "Manrope, sans-serif", fontSize: "8px", fontStyle: "bold", color: WHITE,
          wordWrap: { width: cellW - 12 }, align: "center",
        }).setOrigin(0.5);
        this.add.text(cx, cy + 26, sq.rarity, {
          fontFamily: "Manrope, sans-serif", fontSize: "7px", color: hexStr(rc),
          wordWrap: { width: cellW - 12 }, align: "center",
        }).setOrigin(0.5);
      } else {
        this.add.text(cx, cy, "?", {
          fontFamily: "Fraunces, serif", fontSize: "26px", color: "#1e1e38",
        }).setOrigin(0.5);
      }
    });

    // Back button
    const backGfx = this.add.graphics();
    roundRect(backGfx, VW / 2 - 100, VH - 64, 200, 46, 23, SURFACE2, 1, BORDER, 1);
    const backHit = this.add.rectangle(VW / 2, VH - 41, 200, 46, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, VH - 41, "← BACK", {
      fontFamily: "Manrope, sans-serif", fontSize: "15px", fontStyle: "bold", color: hexStr(ACCENT2),
    }).setOrigin(0.5);
    backHit.on("pointerover", () => this.tweens.add({ targets: backGfx, scaleX: 1.04, scaleY: 1.04, duration: 80 }));
    backHit.on("pointerout",  () => this.tweens.add({ targets: backGfx, scaleX: 1.0,  scaleY: 1.0,  duration: 80 }));
    backHit.on("pointerdown", () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
    });

    this.cameras.main.fadeIn(240, 13, 13, 26);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

export function startGame(parent: HTMLElement, onScore: (n: number) => void): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: VW,
    height: VH,
    backgroundColor: "#0d0d1a",
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

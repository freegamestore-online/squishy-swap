import Phaser from "phaser";

const VW = 420;
const VH = 700;

// ─── Types ───────────────────────────────────────────────────────────────────

type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Ultra Rare";

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
  personality: "generous" | "fair" | "stingy";
  color: number; // accent tint for their header
}

interface ResultData {
  given: Squishy | null;
  received: Squishy[];
  score: number;
  collectionSize: number;
}

// ─── Palette ─────────────────────────────────────────────────────────────────
// Dark, sleek, teen-coded: deep navy bg, vivid neon accents, white text.

const BG       = 0x0d0d1a; // near-black navy
const SURFACE  = 0x16162a; // card surface
const SURFACE2 = 0x1e1e38; // slightly lighter surface
const BORDER   = 0x2e2e52; // subtle border
const ACCENT   = 0x7c3aed; // vivid purple
const ACCENT2  = 0xa855f7; // lighter purple
const NEON_G   = 0x4ade80; // neon green (accept)
const NEON_R   = 0xf43f5e; // neon red (reject)
const NEON_Y   = 0xfbbf24; // amber (add more)
const WHITE    = "#ffffff";
const MUTED    = "#6b7280";
const SUBTEXT  = "#9ca3af";

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
  { name: "Zara",    emoji: "🖤", personality: "stingy",   color: 0x7c3aed },
  { name: "Kai",     emoji: "🌊", personality: "fair",     color: 0x0ea5e9 },
  { name: "Nova",    emoji: "🌙", personality: "generous", color: 0xa855f7 },
  { name: "Reese",   emoji: "🔮", personality: "stingy",   color: 0xec4899 },
  { name: "Ash",     emoji: "⚡", personality: "generous", color: 0xf59e0b },
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

// Draw a rounded rectangle using Phaser Graphics
function roundRect(
  gfx: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  r: number, fillColor: number, fillAlpha = 1,
  strokeColor?: number, strokeWidth = 2,
): void {
  gfx.clear();
  if (strokeColor !== undefined) {
    gfx.lineStyle(strokeWidth, strokeColor, 1);
  }
  gfx.fillStyle(fillColor, fillAlpha);
  gfx.fillRoundedRect(x, y, w, h, r);
  if (strokeColor !== undefined) {
    gfx.strokeRoundedRect(x, y, w, h, r);
  }
}

// ─── Menu Scene ───────────────────────────────────────────────────────────────

class MenuScene extends Phaser.Scene {
  constructor() { super("menu"); }

  create(): void {
    const col = loadCollection();

    // Dark background
    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    // Subtle grid lines for depth
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x1a1a30, 1);
    for (let x = 0; x < VW; x += 40) {
      gridGfx.moveTo(x, 0); gridGfx.lineTo(x, VH);
    }
    for (let y = 0; y < VH; y += 40) {
      gridGfx.moveTo(0, y); gridGfx.lineTo(VW, y);
    }
    gridGfx.strokePath();

    // Glowing orb behind logo
    const orbGfx = this.add.graphics();
    orbGfx.fillStyle(ACCENT, 0.18);
    orbGfx.fillCircle(VW / 2, 180, 110);
    this.tweens.add({
      targets: orbGfx,
      scaleX: 1.12, scaleY: 1.12,
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Floating particles
    const particles = ["✦", "◆", "▸", "✧", "◇"];
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * VW;
      const y = Math.random() * VH;
      const t = this.add.text(x, y, pick(particles), {
        fontSize: `${8 + Math.random() * 10}px`,
        color: hexStr(ACCENT2),
      }).setAlpha(0.25);
      this.tweens.add({
        targets: t,
        y: y - 60 - Math.random() * 60,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        delay: Math.random() * 3000,
        ease: "Sine.easeIn",
        repeat: -1,
        onRepeat: () => {
          t.x = Math.random() * VW;
          t.y = Math.random() * VH;
          t.setAlpha(0.25);
        },
      });
    }

    // Logo
    const logo = this.add.text(VW / 2, 165, "🧸", { fontSize: "76px" }).setOrigin(0.5);
    this.tweens.add({
      targets: logo,
      y: 175,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add.text(VW / 2, 252, "SQUISHY SWAP", {
      fontFamily: "Fraunces, serif",
      fontSize: "34px",
      color: WHITE,
      stroke: hexStr(ACCENT),
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(VW / 2, 290, "trade rare. flex harder. 💜", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: hexStr(ACCENT2),
    }).setOrigin(0.5);

    // Collection pill
    const pillGfx = this.add.graphics();
    roundRect(pillGfx, VW / 2 - 90, 318, 180, 32, 16, SURFACE2, 1, BORDER, 1);
    this.add.text(VW / 2, 334, `📦  ${col.size} / ${SQUISHIES.length} collected`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: SUBTEXT,
    }).setOrigin(0.5);

    // Play button — vivid purple pill
    this.makePillButton(VW / 2, 420, 230, 58, "PLAY NOW  ▶", ACCENT, ACCENT2, WHITE, () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade"));
    });

    // Collection button — ghost style
    this.makeGhostButton(VW / 2, 500, 230, 52, "MY COLLECTION  →", () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("collection"));
    });

    // Version tag
    this.add.text(VW / 2, VH - 24, "freegamestore.online", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      color: "#2e2e52",
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(280, 13, 13, 26);
  }

  private makePillButton(
    x: number, y: number, w: number, h: number,
    label: string, fill: number, _stroke: number, textColor: string,
    onDown: () => void,
  ): void {
    const gfx = this.add.graphics();
    roundRect(gfx, x - w / 2, y - h / 2, w, h, h / 2, fill, 1);

    const hitZone = this.add.rectangle(x, y, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: textColor,
    }).setOrigin(0.5);

    hitZone.on("pointerover", () => {
      this.tweens.add({ targets: gfx, scaleX: 1.04, scaleY: 1.04, duration: 80 });
    });
    hitZone.on("pointerout", () => {
      this.tweens.add({ targets: gfx, scaleX: 1.0, scaleY: 1.0, duration: 80 });
    });
    hitZone.on("pointerdown", onDown);
  }

  private makeGhostButton(
    x: number, y: number, w: number, h: number,
    label: string,
    onDown: () => void,
  ): void {
    const gfx = this.add.graphics();
    roundRect(gfx, x - w / 2, y - h / 2, w, h, h / 2, SURFACE2, 1, BORDER, 1);

    const hitZone = this.add.rectangle(x, y, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "15px",
      fontStyle: "bold",
      color: hexStr(ACCENT2),
    }).setOrigin(0.5);

    hitZone.on("pointerover", () => {
      this.tweens.add({ targets: gfx, scaleX: 1.04, scaleY: 1.04, duration: 80 });
    });
    hitZone.on("pointerout", () => {
      this.tweens.add({ targets: gfx, scaleX: 1.0, scaleY: 1.0, duration: 80 });
    });
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

  // Thermometer UI refs
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

    // ── Background ──
    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    // Subtle grid
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x141428, 1);
    for (let x = 0; x < VW; x += 40) { gridGfx.moveTo(x, 0); gridGfx.lineTo(x, VH); }
    for (let y = 0; y < VH; y += 40) { gridGfx.moveTo(0, y); gridGfx.lineTo(VW, y); }
    gridGfx.strokePath();

    // ── CP header card ──
    const headerGfx = this.add.graphics();
    roundRect(headerGfx, 0, 0, VW, 128, 0, SURFACE, 1, this.cp.color, 2);

    // Accent glow strip at top
    const glowGfx = this.add.graphics();
    glowGfx.fillStyle(this.cp.color, 0.35);
    glowGfx.fillRect(0, 0, VW, 4);

    this.add.text(18, 18, this.cp.emoji, { fontSize: "44px" });
    this.add.text(76, 22, this.cp.name.toUpperCase(), {
      fontFamily: "Fraunces, serif",
      fontSize: "20px",
      color: WHITE,
    });
    this.add.text(76, 52, this.personalityLabel(), {
      fontFamily: "Manrope, sans-serif",
      fontSize: "12px",
      color: hexStr(this.cp.color),
    });

    // Trader counter pill
    const counterGfx = this.add.graphics();
    roundRect(counterGfx, VW - 72, 20, 58, 26, 13, SURFACE2, 1, BORDER, 1);
    this.add.text(VW - 43, 33, `${this.cpIndex + 1} / ${this.MAX_CP}`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "12px",
      color: SUBTEXT,
    }).setOrigin(0.5);

    // ── Speech bubble ──
    this.speechBubble = this.add.graphics();
    this.drawSpeechBubble(this.getGreeting());

    // ── Divider ──
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, BORDER, 1);
    divGfx.moveTo(20, 148); divGfx.lineTo(VW - 20, 148);
    divGfx.strokePath();

    // ── Section labels ──
    this.add.text(20, 158, "YOUR SQUISHY", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: MUTED,
    });

    this.buildMyCard(VW / 2, 218);

    // Swap arrow
    this.add.text(VW / 2, 272, "⇅", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "20px",
      color: hexStr(ACCENT2),
    }).setOrigin(0.5);

    this.add.text(20, 298, "THEY OFFER", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: MUTED,
    });

    // Card layer for offered squishies
    this.cardLayer = this.add.layer();
    this.buildOfferedCards();

    // ── Thermometer ──
    this.buildThermometer();

    // ── Buttons ──
    this.buildButtons();

    this.cameras.main.fadeIn(200, 13, 13, 26);
  }

  // ── Speech bubble (drawn with graphics for dark style) ──────────────────────
  private drawSpeechBubble(text: string): void {
    this.speechBubble.clear();
    roundRect(this.speechBubble, 16, 100, VW - 32, 36, 10, SURFACE2, 1, BORDER, 1);

    if (!this.speechText) {
      this.speechText = this.add.text(VW / 2, 118, text, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: hexStr(ACCENT2),
      }).setOrigin(0.5);
    } else {
      this.speechText.setText(text);
    }
  }

  // ── My squishy card ──────────────────────────────────────────────────────────
  private buildMyCard(cx: number, cy: number): void {
    const sq = this.mySquishy;
    const rc = RARITY_COLORS[sq.rarity];

    const cardGfx = this.add.graphics();
    roundRect(cardGfx, cx - 72, cy - 44, 144, 88, 12, SURFACE, 1, rc, 2);

    this.add.text(cx, cy - 18, sq.emoji, { fontSize: "28px" }).setOrigin(0.5);
    this.add.text(cx, cy + 16, sq.name, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "12px",
      fontStyle: "bold",
      color: WHITE,
    }).setOrigin(0.5);
    this.add.text(cx, cy + 32, sq.rarity.toUpperCase(), {
      fontFamily: "Manrope, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
      color: hexStr(rc),
    }).setOrigin(0.5);

    if (rarityRank(sq.rarity) >= 3) {
      this.tweens.add({
        targets: cardGfx,
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // ── Offered cards ─────────────────────────────────────────────────────────────
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
        fontFamily: "Manrope, sans-serif",
        fontSize: "9px",
        fontStyle: "bold",
        color: WHITE,
        wordWrap: { width: cardW - 8 },
        align: "center",
      }).setOrigin(0.5);
      const rarT = this.add.text(cx, cy + 34, sq.rarity.toUpperCase(), {
        fontFamily: "Manrope, sans-serif",
        fontSize: "8px",
        fontStyle: "bold",
        color: hexStr(rc),
      }).setOrigin(0.5);

      this.cardLayer.add([cardGfx, emojiT, nameT, rarT]);

      // Pop-in
      const targets = [cardGfx, emojiT, nameT, rarT];
      targets.forEach(t => t.setScale(0.01));
      this.tweens.add({
        targets,
        scaleX: 1, scaleY: 1,
        duration: 280,
        delay: i * 70,
        ease: "Back.easeOut",
      });

      // Floating sparkle badge for rares
      if (rarityRank(sq.rarity) >= 2) {
        const badge = this.add.text(cx + cardW / 2 - 8, cy - cardH / 2 + 2, "✦", {
          fontSize: "11px",
          color: hexStr(rc),
        });
        this.cardLayer.add(badge);
        this.tweens.add({
          targets: badge,
          y: badge.y - 14,
          alpha: 0,
          duration: 1100,
          repeat: -1,
          delay: i * 180,
          ease: "Sine.easeIn",
          onRepeat: () => { badge.y = cy - cardH / 2 + 2; badge.setAlpha(1); },
        });
      }
    });
  }

  // ── Thermometer ───────────────────────────────────────────────────────────────
  private buildThermometer(): void {
    // Layout: horizontal bar from left to right
    // Left label "BAD DEAL" ←————————[fill]————→ "GREAT DEAL" right
    const barX  = 52;          // left edge of bar
    const barY  = 516;         // vertical center
    const barW  = VW - 104;    // width of bar track
    const barH  = 14;
    const bulbR = 11;

    // Track background (rounded pill)
    this.thermoBg = this.add.graphics();
    this.thermoBg.fillStyle(SURFACE2, 1);
    this.thermoBg.fillRoundedRect(barX, barY - barH / 2, barW, barH, barH / 2);
    this.thermoBg.lineStyle(1, BORDER, 1);
    this.thermoBg.strokeRoundedRect(barX, barY - barH / 2, barW, barH, barH / 2);

    // Fill (will be updated)
    this.thermoFill = this.add.graphics();

    // Bulb (left end circle)
    this.thermoBulb = this.add.graphics();

    // Labels
    this.add.text(barX - 4, barY + 12, "😬", { fontSize: "13px" }).setOrigin(0.5);
    this.add.text(barX + barW + 4, barY + 12, "🔥", { fontSize: "13px" }).setOrigin(0.5);

    // Deal quality label
    this.thermoLabel = this.add.text(VW / 2, barY - 18, "", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: SUBTEXT,
    }).setOrigin(0.5);

    this.refreshThermometer(barX, barY, barW, barH, bulbR);
  }

  private refreshThermometer(
    barX: number, barY: number, barW: number, barH: number, bulbR: number,
  ): void {
    const myVal  = this.mySquishy.value;
    const offVal = this.offered.reduce((s, q) => s + q.value, 0);
    const ratio  = offVal / Math.max(myVal, 1);

    // Map ratio 0.4–2.0 → 0–1 fill
    const t = Phaser.Math.Clamp((ratio - 0.4) / 1.6, 0, 1);

    // Color gradient: red → amber → green
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

    // Bulb at left end
    this.thermoBulb.clear();
    this.thermoBulb.fillStyle(fillColor, 1);
    this.thermoBulb.fillCircle(barX, barY, bulbR);

    this.thermoLabel.setText(labelText);
    this.thermoLabel.setColor(hexStr(fillColor));
  }

  // ── Buttons ───────────────────────────────────────────────────────────────────
  private buildButtons(): void {
    const by  = 596;
    const bh  = 60;
    const bw  = 118;

    // Accept
    const acceptGfx = this.add.graphics();
    roundRect(acceptGfx, 10, by - bh / 2, bw, bh, 14, 0x14532d, 1, NEON_G, 2);
    const acceptHit = this.add.rectangle(10 + bw / 2, by, bw, bh, 0, 0)
      .setInteractive({ useHandCursor: true });
    this.add.text(10 + bw / 2, by - 10, "✅", { fontSize: "20px" }).setOrigin(0.5);
    this.add.text(10 + bw / 2, by + 16, "ACCEPT", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: hexStr(NEON_G),
    }).setOrigin(0.5);

    // Add more
    const addGfx = this.add.graphics();
    roundRect(addGfx, VW / 2 - bw / 2, by - bh / 2, bw, bh, 14, 0x451a03, 1, NEON_Y, 2);
    this.addBtn = this.add.rectangle(VW / 2, by, bw, bh, 0, 0)
      .setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, by - 10, "➕", { fontSize: "20px" }).setOrigin(0.5);
    this.addBtnLabel = this.add.text(VW / 2, by + 16, "ADD MORE", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: hexStr(NEON_Y),
    }).setOrigin(0.5);

    // Reject
    const rejectGfx = this.add.graphics();
    roundRect(rejectGfx, VW - 10 - bw, by - bh / 2, bw, bh, 14, 0x4c0519, 1, NEON_R, 2);
    const rejectHit = this.add.rectangle(VW - 10 - bw / 2, by, bw, bh, 0, 0)
      .setInteractive({ useHandCursor: true });
    this.add.text(VW - 10 - bw / 2, by - 10, "❌", { fontSize: "20px" }).setOrigin(0.5);
    this.add.text(VW - 10 - bw / 2, by + 16, "REJECT", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: hexStr(NEON_R),
    }).setOrigin(0.5);

    this.refreshAddBtn(addGfx);

    // Hover scale on hit zones
    for (const [hit, gfx] of [[acceptHit, acceptGfx], [this.addBtn, addGfx], [rejectHit, rejectGfx]] as [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Graphics][]) {
      hit.on("pointerover", () => this.tweens.add({ targets: gfx, scaleX: 1.05, scaleY: 1.05, duration: 70 }));
      hit.on("pointerout",  () => this.tweens.add({ targets: gfx, scaleX: 1.0,  scaleY: 1.0,  duration: 70 }));
    }

    acceptHit.on("pointerdown", () => this.doAccept());
    this.addBtn.on("pointerdown", () => this.doAddMore());
    rejectHit.on("pointerdown", () => this.doReject());
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private generateOffer(): Squishy[] {
    const myVal = this.mySquishy.value;
    const p = this.cp.personality;
    const target = p === "generous" ? myVal * 1.3
                 : p === "stingy"   ? myVal * 0.6
                 :                    myVal * 0.95;
    const count = p === "stingy" ? 1 : 2;
    const result: Squishy[] = [];
    const used = [this.mySquishy.id];
    for (let i = 0; i < count; i++) {
      const s = weightedRandomSquishy((target / count) * 1.6, used);
      result.push(s);
      used.push(s.id);
    }
    return result;
  }

  private personalityLabel(): string {
    return this.cp.personality === "generous" ? "💚 generous trader"
         : this.cp.personality === "stingy"   ? "💀 stingy trader"
         :                                       "⚖️ fair trader";
  }

  private getGreeting(): string {
    const map: Record<string, string[]> = {
      generous: ["yo here's something good for u 💜", "i got you fr fr 🌟", "this deal slaps ngl 🎉"],
      fair:     ["wanna trade? 🤝", "seems fair to me tbh", "deal? 🌸"],
      stingy:   ["take it or leave it 🙄", "this is literally my best offer", "hmm... maybe 🤔"],
    };
    return pick(map[this.cp.personality] ?? map["fair"]!);
  }

  private setSpeech(txt: string): void {
    this.speechText.setText(txt);
    this.tweens.killTweensOf(this.speechBubble);
    this.speechBubble.setScale(1);
    this.tweens.add({
      targets: this.speechBubble,
      scaleX: 1.03, scaleY: 1.1,
      duration: 90,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  private refreshAddBtn(gfx?: Phaser.GameObjects.Graphics): void {
    const maxed = this.addCount >= this.MAX_ADD;
    if (gfx) {
      gfx.clear();
      roundRect(gfx, VW / 2 - 59, 566, 118, 60, 14,
        maxed ? SURFACE2 : 0x451a03, 1,
        maxed ? BORDER : NEON_Y, 2,
      );
    }
    this.addBtnLabel.setColor(maxed ? MUTED : hexStr(NEON_Y));
    if (maxed) this.addBtn.removeInteractive();
  }

  private updateThermo(): void {
    const barX = 52;
    const barY = 516;
    const barW = VW - 104;
    const barH = 14;
    const bulbR = 11;
    this.refreshThermometer(barX, barY, barW, barH, bulbR);
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  private doAccept(): void {
    const myVal  = this.mySquishy.value;
    const offVal = this.offered.reduce((s, q) => s + q.value, 0);
    const ratio  = offVal / Math.max(myVal, 1);

    let score: number;
    if      (ratio >= 1.5) score = 90 + Math.floor(Math.random() * 10);
    else if (ratio >= 1.1) score = 70 + Math.floor(Math.random() * 20);
    else if (ratio >= 0.9) score = 50 + Math.floor(Math.random() * 20);
    else if (ratio >= 0.6) score = 25 + Math.floor(Math.random() * 25);
    else                   score = 5  + Math.floor(Math.random() * 20);

    this.collection.delete(this.mySquishy.id);
    this.offered.forEach(s => this.collection.add(s.id));
    saveCollection(this.collection);
    this.onScore(this.collection.size);

    this.cameras.main.fadeOut(180, 13, 13, 26);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("result", {
        given: this.mySquishy,
        received: this.offered,
        score,
        collectionSize: this.collection.size,
      } satisfies ResultData);
    });
  }

  private doAddMore(): void {
    if (this.addCount >= this.MAX_ADD) return;
    this.addCount++;

    const map: Record<string, string[]> = {
      generous: ["ok fine, one more 🎁", "here take this too 💖", "ur lucky i like u ✨"],
      fair:     ["hmm ok one more 🤔", "fine, deal? 😊", "alright alright 🌸"],
      stingy:   ["ugh FINE 😤", "this better be worth it 😒", "u drive a hard bargain 😑"],
    };
    this.setSpeech(pick(map[this.cp.personality] ?? map["fair"]!));

    const used = [this.mySquishy.id, ...this.offered.map(s => s.id)];
    this.offered.push(weightedRandomSquishy(this.mySquishy.value * 0.8, used));

    this.buildOfferedCards();
    this.updateThermo();
    this.refreshAddBtn();
  }

  private doReject(): void {
    const map: Record<string, string[]> = {
      generous: ["nooo 😢 maybe someone else?", "fine... 💔", "i thought we were friends!! 😭"],
      fair:     ["your loss 🤷", "ok moving on 😊", "fine! maybe someone else! 😤"],
      stingy:   ["FINE. didn't want to anyway 😤", "whatever 😒", "hmph 😤"],
    };
    this.setSpeech(pick(map[this.cp.personality] ?? map["fair"]!));

    this.input.enabled = false;
    this.time.delayedCall(700, () => {
      this.cpIndex++;
      if (this.cpIndex >= this.MAX_CP) {
        this.cameras.main.fadeOut(180, 13, 13, 26);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("result", {
            given: null, received: [], score: 0,
            collectionSize: this.collection.size,
          } satisfies ResultData);
        });
        return;
      }
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.input.enabled = true;
        this.buildTrade();
      });
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
    this.onScore(data.collectionSize);

    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    // Grid bg
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x141428, 1);
    for (let x = 0; x < VW; x += 40) { gridGfx.moveTo(x, 0); gridGfx.lineTo(x, VH); }
    for (let y = 0; y < VH; y += 40) { gridGfx.moveTo(0, y); gridGfx.lineTo(VW, y); }
    gridGfx.strokePath();

    if (!data.given) {
      this.add.text(VW / 2, VH / 2 - 80, "😔", { fontSize: "72px" }).setOrigin(0.5);
      this.add.text(VW / 2, VH / 2, "no trade made", {
        fontFamily: "Fraunces, serif",
        fontSize: "30px",
        color: WHITE,
      }).setOrigin(0.5);
      this.add.text(VW / 2, VH / 2 + 48, "better luck next time 🤞", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "15px",
        color: SUBTEXT,
      }).setOrigin(0.5);
    } else {
      this.spawnParticles();

      // Header
      const { label, color } = this.getDealLabel(data.score);
      const headerGfx = this.add.graphics();
      roundRect(headerGfx, 0, 0, VW, 110, 0, SURFACE, 1, color, 2);
      const glowGfx = this.add.graphics();
      glowGfx.fillStyle(color, 0.3);
      glowGfx.fillRect(0, 0, VW, 4);

      this.add.text(VW / 2, 38, "TRADE COMPLETE", {
        fontFamily: "Fraunces, serif",
        fontSize: "26px",
        color: WHITE,
        stroke: hexStr(color),
        strokeThickness: 4,
      }).setOrigin(0.5);

      this.add.text(VW / 2, 78, label, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: hexStr(color),
      }).setOrigin(0.5);

      // Given card
      this.add.text(20, 128, "YOU GAVE", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: MUTED,
      });
      this.buildResultCard(VW / 2, 190, data.given);

      // Arrow
      this.add.text(VW / 2, 248, "⬇", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "22px",
        color: hexStr(ACCENT2),
      }).setOrigin(0.5);

      // Received cards
      this.add.text(20, 268, "YOU GOT", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: MUTED,
      });
      const count = data.received.length;
      const gap = 12;
      const cardW = Math.min(130, (VW - 32 - gap * (count - 1)) / count);
      const totalW = count * cardW + (count - 1) * gap;
      const startX = (VW - totalW) / 2 + cardW / 2;
      data.received.forEach((sq, i) => {
        this.buildResultCard(startX + i * (cardW + gap), 340, sq, cardW);
      });

      // Score badge
      const scoreBadgeGfx = this.add.graphics();
      roundRect(scoreBadgeGfx, VW / 2 - 100, 430, 200, 64, 14, SURFACE2, 1, color, 2);
      this.add.text(VW / 2, 455, `${data.score}`, {
        fontFamily: "Fraunces, serif",
        fontSize: "32px",
        color: hexStr(color),
      }).setOrigin(0.5);
      this.add.text(VW / 2, 484, "DEAL SCORE", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: MUTED,
      }).setOrigin(0.5);

      // Collection count
      this.add.text(VW / 2, 518, `📦  ${data.collectionSize} / ${SQUISHIES.length} in your collection`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: SUBTEXT,
      }).setOrigin(0.5);
    }

    // Buttons
    const btnY = VH - 72;

    const playAgainGfx = this.add.graphics();
    roundRect(playAgainGfx, VW / 2 - 110, btnY - 26, 220, 52, 26, ACCENT, 1);
    const playHit = this.add.rectangle(VW / 2, btnY, 220, 52, 0, 0)
      .setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, btnY, "TRADE AGAIN  ▶", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: WHITE,
    }).setOrigin(0.5);
    playHit.on("pointerdown", () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade"));
    });

    const menuGfx = this.add.graphics();
    roundRect(menuGfx, VW / 2 - 60, btnY + 36, 120, 36, 18, SURFACE2, 1, BORDER, 1);
    const menuHit = this.add.rectangle(VW / 2, btnY + 54, 120, 36, 0, 0)
      .setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, btnY + 54, "← MENU", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: SUBTEXT,
    }).setOrigin(0.5);
    menuHit.on("pointerdown", () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
    });

    for (const [hit, gfx] of [[playHit, playAgainGfx], [menuHit, menuGfx]] as [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Graphics][]) {
      hit.on("pointerover", () => this.tweens.add({ targets: gfx, scaleX: 1.05, scaleY: 1.05, duration: 70 }));
      hit.on("pointerout",  () => this.tweens.add({ targets: gfx, scaleX: 1.0,  scaleY: 1.0,  duration: 70 }));
    }

    this.cameras.main.fadeIn(220, 13, 13, 26);
  }

  private buildResultCard(cx: number, cy: number, sq: Squishy, w = 130): void {
    const h = 80;
    const rc = RARITY_COLORS[sq.rarity];
    const cardGfx = this.add.graphics();
    roundRect(cardGfx, cx - w / 2, cy - h / 2, w, h, 10, SURFACE, 1, rc, 2);
    this.add.text(cx, cy - 14, sq.emoji, { fontSize: "24px" }).setOrigin(0.5);
    this.add.text(cx, cy + 16, sq.name, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: WHITE,
      wordWrap: { width: w - 10 },
      align: "center",
    }).setOrigin(0.5);
    this.add.text(cx, cy + 32, sq.rarity.toUpperCase(), {
      fontFamily: "Manrope, sans-serif",
      fontSize: "8px",
      fontStyle: "bold",
      color: hexStr(rc),
    }).setOrigin(0.5);
  }

  private getDealLabel(score: number): { label: string; color: number } {
    if (score >= 90) return { label: "🔥 INSANE DEAL!!",    color: NEON_G };
    if (score >= 70) return { label: "✨ great deal!",       color: 0x34d399 };
    if (score >= 50) return { label: "👍 solid deal",        color: NEON_Y };
    if (score >= 30) return { label: "😬 kinda bad deal",    color: 0xf97316 };
    return              { label: "💀 terrible deal lol",   color: NEON_R };
  }

  private spawnParticles(): void {
    const symbols = ["✦", "◆", "✧", "▸", "◇", "★"];
    const colors  = [ACCENT, ACCENT2, NEON_G, NEON_Y, 0x60a5fa];
    for (let i = 0; i < 22; i++) {
      const x = Math.random() * VW;
      const t = this.add.text(x, VH + 10, pick(symbols), {
        fontSize: `${10 + Math.random() * 14}px`,
        color: hexStr(pick(colors)),
      }).setAlpha(0.9);
      this.tweens.add({
        targets: t,
        y: -20,
        x: x + (Math.random() - 0.5) * 80,
        alpha: 0,
        duration: 1800 + Math.random() * 1400,
        delay: Math.random() * 1200,
        ease: "Sine.easeOut",
      });
    }
  }
}

// ─── Collection Scene ─────────────────────────────────────────────────────────

class CollectionScene extends Phaser.Scene {
  private readonly onScore: (n: number) => void;
  constructor(onScore: (n: number) => void) {
    super("collection");
    this.onScore = onScore;
  }

  create(): void {
    const col = loadCollection();
    this.onScore(col.size);

    this.add.rectangle(VW / 2, VH / 2, VW, VH, BG);

    // Grid bg
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x141428, 1);
    for (let x = 0; x < VW; x += 40) { gridGfx.moveTo(x, 0); gridGfx.lineTo(x, VH); }
    for (let y = 0; y < VH; y += 40) { gridGfx.moveTo(0, y); gridGfx.lineTo(VW, y); }
    gridGfx.strokePath();

    // Header
    const headerGfx = this.add.graphics();
    roundRect(headerGfx, 0, 0, VW, 80, 0, SURFACE, 1, BORDER, 1);
    const glowGfx = this.add.graphics();
    glowGfx.fillStyle(ACCENT, 0.3);
    glowGfx.fillRect(0, 0, VW, 3);

    this.add.text(VW / 2, 28, "MY COLLECTION", {
      fontFamily: "Fraunces, serif",
      fontSize: "22px",
      color: WHITE,
    }).setOrigin(0.5);
    this.add.text(VW / 2, 56, `${col.size} / ${SQUISHIES.length} squishies`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: hexStr(ACCENT2),
    }).setOrigin(0.5);

    // Grid of squishies
    const cols   = 4;
    const cellW  = (VW - 24) / cols;
    const cellH  = 88;
    const startY = 100;

    SQUISHIES.forEach((sq, idx) => {
      const col_i  = idx % cols;
      const row_i  = Math.floor(idx / cols);
      const cx     = 12 + col_i * cellW + cellW / 2;
      const cy     = startY + row_i * cellH + cellH / 2;
      const owned  = col.has(sq.id);
      const rc     = RARITY_COLORS[sq.rarity];

      const cardGfx = this.add.graphics();
      roundRect(
        cardGfx,
        cx - cellW / 2 + 4, cy - cellH / 2 + 4,
        cellW - 8, cellH - 8,
        10,
        owned ? SURFACE : 0x0a0a16,
        1,
        owned ? rc : BORDER,
        owned ? 2 : 1,
      );

      if (owned) {
        this.add.text(cx, cy - 16, sq.emoji, { fontSize: "22px" }).setOrigin(0.5);
        this.add.text(cx, cy + 12, sq.name, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "8px",
          fontStyle: "bold",
          color: WHITE,
          wordWrap: { width: cellW - 12 },
          align: "center",
        }).setOrigin(0.5);
        this.add.text(cx, cy + 26, sq.rarity.toUpperCase(), {
          fontFamily: "Manrope, sans-serif",
          fontSize: "7px",
          color: hexStr(rc),
        }).setOrigin(0.5);
      } else {
        this.add.text(cx, cy - 6, "?", {
          fontFamily: "Fraunces, serif",
          fontSize: "24px",
          color: "#2e2e52",
        }).setOrigin(0.5);
        this.add.text(cx, cy + 18, sq.rarity.toUpperCase(), {
          fontFamily: "Manrope, sans-serif",
          fontSize: "7px",
          color: "#2e2e52",
        }).setOrigin(0.5);
      }
    });

    // Back button
    const backGfx = this.add.graphics();
    roundRect(backGfx, VW / 2 - 90, VH - 58, 180, 44, 22, SURFACE2, 1, BORDER, 1);
    const backHit = this.add.rectangle(VW / 2, VH - 36, 180, 44, 0, 0)
      .setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, VH - 36, "← BACK TO MENU", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: hexStr(ACCENT2),
    }).setOrigin(0.5);

    backHit.on("pointerover", () => this.tweens.add({ targets: backGfx, scaleX: 1.04, scaleY: 1.04, duration: 70 }));
    backHit.on("pointerout",  () => this.tweens.add({ targets: backGfx, scaleX: 1.0,  scaleY: 1.0,  duration: 70 }));
    backHit.on("pointerdown", () => {
      this.cameras.main.fadeOut(180, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
    });

    this.cameras.main.fadeIn(220, 13, 13, 26);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

export function startGame(parent: HTMLElement, onScore: (n: number) => void): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VW,
    height: VH,
    backgroundColor: "#0d0d1a",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
    scene: [
      new MenuScene(),
      new TradeScene(onScore),
      new ResultScene(onScore),
      new CollectionScene(onScore),
    ],
    banner: false,
  });

  return () => game.destroy(true);
}

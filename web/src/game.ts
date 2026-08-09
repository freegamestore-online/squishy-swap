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
  color: number; // accent tint — light = easy, mid = fair, dark = hard
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

// Difficulty badge colours
const DIFF_EASY_COLOR   = 0x86efac; // light green  — easy traders have light colours
const DIFF_FAIR_COLOR   = 0x93c5fd; // light blue   — neutral/ok traders
const DIFF_HARD_COLOR   = 0x374151; // dark slate   — hard traders have dark colours

const DIFF_EASY_TEXT  = "#14532d";
const DIFF_FAIR_TEXT  = "#1e3a5f";
const DIFF_HARD_TEXT  = "#e5e7eb";

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

// colour = light → easy, medium → fair, dark → hard
const COMPUTER_PLAYERS: ComputerPlayer[] = [
  // EASY — generous, light pastel colours
  { name: "Sunny",   emoji: "☀️", personality: "generous", color: 0xfde68a }, // pale yellow
  { name: "Blossom", emoji: "🌸", personality: "generous", color: 0xfbcfe8 }, // pale pink
  // FAIR — neutral mid-tone colours
  { name: "Kai",     emoji: "🌊", personality: "fair",     color: 0x60a5fa }, // mid blue
  { name: "Nova",    emoji: "🔮", personality: "fair",     color: 0xa78bfa }, // mid purple
  // HARD — stingy, dark colours
  { name: "Zara",    emoji: "🖤", personality: "stingy",   color: 0x374151 }, // dark slate
  { name: "Vex",     emoji: "⚡", personality: "stingy",   color: 0x1e1b4b }, // near-black indigo
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
  if (p === "generous") return { label: "EASY",   emoji: "😊", badgeColor: DIFF_EASY_COLOR, textColor: DIFF_EASY_TEXT };
  if (p === "fair")     return { label: "OK",     emoji: "🤝", badgeColor: DIFF_FAIR_COLOR, textColor: DIFF_FAIR_TEXT };
  return                       { label: "HARD",   emoji: "😤", badgeColor: DIFF_HARD_COLOR, textColor: DIFF_HARD_TEXT };
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

  // Small difficulty legend on the menu so players know what colours mean
  private buildDiffLegend(cy: number): void {
    this.add.text(VW / 2, cy - 14, "TRADER DIFFICULTY", {
      fontFamily: "Manrope, sans-serif", fontSize: "9px", fontStyle: "bold", color: MUTED,
    }).setOrigin(0.5);

    const items: { label: string; color: number; textColor: string }[] = [
      { label: "EASY", color: DIFF_EASY_COLOR, textColor: DIFF_EASY_TEXT },
      { label: "OK",   color: DIFF_FAIR_COLOR, textColor: DIFF_FAIR_TEXT },
      { label: "HARD", color: DIFF_HARD_COLOR, textColor: DIFF_HARD_TEXT },
    ];
    const pillW = 72; const pillH = 24; const gap = 10;
    const totalW = items.length * pillW + (items.length - 1) * gap;
    const startX = (VW - totalW) / 2;

    items.forEach((item, i) => {
      const px = startX + i * (pillW + gap);
      const gfx = this.add.graphics();
      roundRect(gfx, px, cy, pillW, pillH, 12, item.color, 1);
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

    // CP header
    const headerGfx = this.add.graphics();
    roundRect(headerGfx, 0, 0, VW, 128, 0, SURFACE, 1, this.cp.color, 2);

    // Accent glow strip
    const glowGfx = this.add.graphics();
    glowGfx.fillStyle(this.cp.color, 0.35);
    glowGfx.fillRect(0, 0, VW, 4);

    this.add.text(18, 18, this.cp.emoji, { fontSize: "44px" });
    this.add.text(76, 22, this.cp.name.toUpperCase(), {
      fontFamily: "Fraunces, serif", fontSize: "20px", color: WHITE,
    });
    this.add.text(76, 52, this.personalityLabel(), {
      fontFamily: "Manrope, sans-serif", fontSize: "12px", color: hexStr(this.cp.color),
    });

    // ── Difficulty badge pill ──
    const diff = diffInfo(this.cp.personality);
    const badgeW = 80; const badgeH = 26;
    const badgeX = VW - 14 - badgeW;
    const badgeY = 16;
    const badgeGfx = this.add.graphics();
    roundRect(badgeGfx, badgeX, badgeY, badgeW, badgeH, 13, diff.badgeColor, 1);
    this.add.text(badgeX + badgeW / 2, badgeY + badgeH / 2,
      `${diff.emoji} ${diff.label}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: diff.textColor,
      }).setOrigin(0.5);

    // Trader counter pill (moved below badge)
    const counterGfx = this.add.graphics();
    roundRect(counterGfx, VW - 14 - badgeW, badgeY + badgeH + 6, badgeW, 22, 11, SURFACE2, 1, BORDER, 1);
    this.add.text(VW - 14 - badgeW / 2, badgeY + badgeH + 17,
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

    // Section labels
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

    this.add.text(barX - 4,       barY + 12, "😬", { fontSize: "13px" }).setOrigin(0.5);
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
    const target = p === "generous" ? myVal * 1.3 : p === "stingy" ? myVal * 0.6 : myVal * 0.95;
    const count  = p === "stingy" ? 1 : 2;
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
    const diff = diffInfo(this.cp.personality);
    return `${diff.emoji} ${diff.label} trader`;
  }

  private getGreeting(): string {
    const map: Record<Personality, string[]> = {
      generous: ["Hi! I'd love to trade! 💕", "I have something great! 🌟", "Let's make a deal! 🎉"],
      fair:     ["Hey! Wanna trade? 😊", "I think this is fair! 🤝", "Deal? 🌸"],
      stingy:   ["Hmm... maybe? 🤔", "I guess I can trade... 😒", "Take it or leave it! 😤"],
    };
    return pick(map[this.cp.personality]);
  }

  private setSpeech(txt: string): void {
    this.speechText.setText(txt);
    this.tweens.killTweensOf(this.speechBubble);
    this.speechBubble.setScale(1);
    this.tweens.add({ targets: this.speechBubble, scaleX: 1.04, scaleY: 1.12, duration: 100, yoyo: true, ease: "Sine.easeOut" });
  }

  private refreshAddBtn(addGfx: Phaser.GameObjects.Graphics): void {
    const maxed = this.addCount >= this.MAX_ADD;
    roundRect(addGfx, VW / 2 - 118 / 2, 596 - 60 / 2, 118, 60, 14,
      maxed ? 0x1c1c1c : 0x451a03, 1,
      maxed ? BORDER   : NEON_Y, 2);
    this.addBtnLabel.setColor(maxed ? MUTED : hexStr(NEON_Y));
    if (maxed) this.addBtn.removeInteractive();
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
        given: this.mySquishy, received: this.offered, score, collectionSize: this.collection.size,
      } satisfies ResultData);
    });
  }

  private doAddMore(): void {
    if (this.addCount >= this.MAX_ADD) return;
    this.addCount++;

    const map: Record<Personality, string[]> = {
      generous: ["Okay! One more! 🎁", "Sure, take this too! 💖", "Here you go! ✨"],
      fair:     ["Hmm… I could add one! 🤔", "Fine, one more! 😊", "Okay, deal? 🌸"],
      stingy:   ["Ugh, fine! 😤", "This better be worth it! 😒", "Hard bargain! 😑"],
    };
    this.setSpeech(pick(map[this.cp.personality]));

    const used = [this.mySquishy.id, ...this.offered.map(s => s.id)];
    this.offered.push(weightedRandomSquishy(this.mySquishy.value * 0.8, used));

    this.buildOfferedCards();
    this.refreshThermometer(52, 516, VW - 104, 14, 11);
    // rebuild add btn graphic to reflect new count
    const addGfx = this.add.graphics();
    this.refreshAddBtn(addGfx);
  }

  private doReject(): void {
    const map: Record<Personality, string[]> = {
      generous: ["Oh no! 😢 Maybe someone else?", "Fine... 💔", "I thought we were friends! 😭"],
      fair:     ["Your loss! 🤷", "Okay, moving on! 😊", "Fine! Maybe someone else! 😤"],
      stingy:   ["FINE! Didn't want to anyway! 😤", "Whatever! 😒", "Hmph! 😤"],
    };
    this.setSpeech(pick(map[this.cp.personality]));
    this.input.enabled = false;

    this.time.delayedCall(700, () => {
      this.cpIndex++;
      if (this.cpIndex >= this.MAX_CP) {
        this.cameras.main.fadeOut(180, 13, 13, 26);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("result", {
            given: null, received: [], score: 0, collectionSize: this.collection.size,
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

    // Grid
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x1a1a30, 1);
    for (let x = 0; x < VW; x += 40) { gridGfx.moveTo(x, 0); gridGfx.lineTo(x, VH); }
    for (let y = 0; y < VH; y += 40) { gridGfx.moveTo(0, y); gridGfx.lineTo(VW, y); }
    gridGfx.strokePath();

    if (!data.given) {
      this.add.text(VW / 2, VH / 2 - 80, "😔", { fontSize: "72px" }).setOrigin(0.5);
      this.add.text(VW / 2, VH / 2, "No trade made!", {
        fontFamily: "Fraunces, serif", fontSize: "30px", color: WHITE,
      }).setOrigin(0.5);
      this.add.text(VW / 2, VH / 2 + 50, "Better luck next time!", {
        fontFamily: "Manrope, sans-serif", fontSize: "16px", color: SUBTEXT,
      }).setOrigin(0.5);
    } else {
      this.spawnConfetti();

      this.add.text(VW / 2, 72, "🎉 TRADE COMPLETE! 🎉", {
        fontFamily: "Fraunces, serif", fontSize: "26px", color: WHITE,
        stroke: hexStr(ACCENT), strokeThickness: 4,
      }).setOrigin(0.5);

      this.add.text(VW / 2, 128, "You gave:", {
        fontFamily: "Manrope, sans-serif", fontSize: "13px", color: MUTED,
      }).setOrigin(0.5);
      this.add.text(VW / 2, 158, `${data.given.emoji}  ${data.given.name}`, {
        fontFamily: "Manrope, sans-serif", fontSize: "20px", fontStyle: "bold", color: WHITE,
      }).setOrigin(0.5);

      this.add.text(VW / 2, 188, "⬇️", { fontSize: "18px" }).setOrigin(0.5);

      this.add.text(VW / 2, 218, "You got:", {
        fontFamily: "Manrope, sans-serif", fontSize: "13px", color: MUTED,
      }).setOrigin(0.5);

      const received = data.received;
      const cardW = Math.min(110, (VW - 40 - 10 * (received.length - 1)) / received.length);
      const totalW = received.length * cardW + (received.length - 1) * 10;
      const startX = (VW - totalW) / 2 + cardW / 2;
      const cy = 310;

      received.forEach((sq, i) => {
        const cx = startX + i * (cardW + 10);
        const rc = RARITY_COLORS[sq.rarity];
        const cardGfx = this.add.graphics();
        roundRect(cardGfx, cx - cardW / 2, cy - 55, cardW, 110, 12, SURFACE, 1, rc, 2);
        this.add.text(cx, cy - 22, sq.emoji, { fontSize: "28px" }).setOrigin(0.5);
        this.add.text(cx, cy + 18, sq.name, {
          fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: WHITE,
          wordWrap: { width: cardW - 8 }, align: "center",
        }).setOrigin(0.5);
        this.add.text(cx, cy + 38, sq.rarity.toUpperCase(), {
          fontFamily: "Manrope, sans-serif", fontSize: "9px", color: hexStr(rc),
        }).setOrigin(0.5);

        const targets = [cardGfx];
        targets.forEach(t => t.setScale(0.01));
        this.tweens.add({ targets, scaleX: 1, scaleY: 1, duration: 320, delay: i * 80, ease: "Back.easeOut" });
      });

      // Score bar
      const scoreGfx = this.add.graphics();
      roundRect(scoreGfx, 20, 400, VW - 40, 70, 14, SURFACE, 1, BORDER, 1);
      this.add.text(VW / 2, 418, "TRADE SCORE", {
        fontFamily: "Manrope, sans-serif", fontSize: "10px", fontStyle: "bold", color: MUTED,
      }).setOrigin(0.5);
      this.add.text(VW / 2, 450, `${data.score} pts`, {
        fontFamily: "Fraunces, serif", fontSize: "32px", color: data.score >= 70 ? hexStr(NEON_G) : data.score >= 40 ? hexStr(NEON_Y) : hexStr(NEON_R),
      }).setOrigin(0.5);

      // Collection progress
      const progGfx = this.add.graphics();
      roundRect(progGfx, 20, 488, VW - 40, 48, 12, SURFACE2, 1, BORDER, 1);
      this.add.text(VW / 2, 512, `📦  ${data.collectionSize} / ${SQUISHIES.length} squishies collected`, {
        fontFamily: "Manrope, sans-serif", fontSize: "13px", color: SUBTEXT,
      }).setOrigin(0.5);
    }

    // Buttons
    this.makePillButton(VW / 2, 590, 200, 54, "TRADE AGAIN  ▶", ACCENT, WHITE, () => {
      this.cameras.main.fadeOut(160, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade"));
    });
    this.makeGhostButton(VW / 2, 652, 200, 46, "MAIN MENU", () => {
      this.cameras.main.fadeOut(160, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
    });

    this.cameras.main.fadeIn(220, 13, 13, 26);
  }

  private spawnConfetti(): void {
    const colors = [hexStr(NEON_G), hexStr(NEON_R), hexStr(NEON_Y), hexStr(ACCENT2), "#f472b6"];
    for (let i = 0; i < 22; i++) {
      const x = Math.random() * VW;
      const t = this.add.text(x, -20, pick(["✦", "◆", "★", "▲"]), {
        fontSize: `${10 + Math.random() * 10}px`,
        color: pick(colors),
      }).setAlpha(0.9);
      this.tweens.add({
        targets: t,
        y: VH + 20,
        x: x + (Math.random() - 0.5) * 80,
        angle: Math.random() * 360,
        duration: 1800 + Math.random() * 1200,
        delay: Math.random() * 800,
        ease: "Sine.easeIn",
        onComplete: () => t.destroy(),
      });
    }
  }

  private makePillButton(
    x: number, y: number, w: number, h: number,
    label: string, fill: number, textColor: string,
    onDown: () => void,
  ): void {
    const gfx = this.add.graphics();
    roundRect(gfx, x - w / 2, y - h / 2, w, h, h / 2, fill, 1);
    const hitZone = this.add.rectangle(x, y, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: "Manrope, sans-serif", fontSize: "16px", fontStyle: "bold", color: textColor }).setOrigin(0.5);
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

    // Grid
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x1a1a30, 1);
    for (let x = 0; x < VW; x += 40) { gridGfx.moveTo(x, 0); gridGfx.lineTo(x, VH); }
    for (let y = 0; y < VH; y += 40) { gridGfx.moveTo(0, y); gridGfx.lineTo(VW, y); }
    gridGfx.strokePath();

    this.add.text(VW / 2, 36, "MY COLLECTION", {
      fontFamily: "Fraunces, serif", fontSize: "26px", color: WHITE,
      stroke: hexStr(ACCENT), strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(VW / 2, 68, `${col.size} / ${SQUISHIES.length} squishies`, {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: SUBTEXT,
    }).setOrigin(0.5);

    // Grid of squishies
    const cols = 4; const cardW = 88; const cardH = 90;
    const gapX = (VW - cols * cardW) / (cols + 1);
    const startY = 100;

    SQUISHIES.forEach((sq, idx) => {
      const col_ = idx % cols;
      const row  = Math.floor(idx / cols);
      const cx   = gapX + col_ * (cardW + gapX) + cardW / 2;
      const cy   = startY + row * (cardH + 10) + cardH / 2;
      const owned = col.has(sq.id);
      const rc    = RARITY_COLORS[sq.rarity];

      const cardGfx = this.add.graphics();
      roundRect(cardGfx, cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10,
        owned ? SURFACE : 0x0a0a14, 1,
        owned ? rc : BORDER, owned ? 2 : 1);

      this.add.text(cx, cy - 16, sq.emoji, {
        fontSize: "26px", alpha: owned ? 1 : 0.2,
      }).setOrigin(0.5).setAlpha(owned ? 1 : 0.2);

      this.add.text(cx, cy + 16, sq.name, {
        fontFamily: "Manrope, sans-serif", fontSize: "8px", fontStyle: "bold",
        color: owned ? WHITE : MUTED,
        wordWrap: { width: cardW - 8 }, align: "center",
      }).setOrigin(0.5);

      this.add.text(cx, cy + 32, owned ? sq.rarity.toUpperCase() : "???", {
        fontFamily: "Manrope, sans-serif", fontSize: "7px",
        color: owned ? hexStr(rc) : "#374151",
      }).setOrigin(0.5);
    });

    // Back button
    const backGfx = this.add.graphics();
    roundRect(backGfx, VW / 2 - 100, VH - 62, 200, 46, 23, SURFACE2, 1, BORDER, 1);
    const backHit = this.add.rectangle(VW / 2, VH - 39, 200, 46, 0, 0).setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, VH - 39, "← BACK", {
      fontFamily: "Manrope, sans-serif", fontSize: "15px", fontStyle: "bold", color: hexStr(ACCENT2),
    }).setOrigin(0.5);
    backHit.on("pointerdown", () => {
      this.cameras.main.fadeOut(160, 13, 13, 26);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
    });

    this.cameras.main.fadeIn(220, 13, 13, 26);
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

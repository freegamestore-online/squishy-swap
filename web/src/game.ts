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
  color: number;
}

interface ResultData {
  given: Squishy | null;
  received: Squishy[];
  score: number;
  collectionSize: number;
}

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
  { name: "Mochi",       emoji: "🧁", personality: "generous", color: 0xf9a8d4 },
  { name: "Pudding",     emoji: "🍮", personality: "fair",     color: 0xfde68a },
  { name: "Jellybean",   emoji: "🍬", personality: "stingy",  color: 0xa5f3fc },
  { name: "Marshmallow", emoji: "☁️", personality: "fair",    color: 0xe9d5ff },
  { name: "Boba",        emoji: "🧋", personality: "generous", color: 0xbbf7d0 },
];

const RARITY_COLORS: Record<Rarity, number> = {
  "Common":     0xa3a3a3,
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

// ─── Menu Scene ───────────────────────────────────────────────────────────────

class MenuScene extends Phaser.Scene {
  constructor() { super("menu"); }

  create(): void {
    const col = loadCollection();

    // Soft pink background
    this.add.rectangle(VW / 2, VH / 2, VW, VH, 0xfdf2f8);

    // Floating ambient sparkles
    const sparkleEmojis = ["✨", "💫", "🌸", "💕", "⭐"];
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * VW;
      const y = Math.random() * VH;
      const t = this.add.text(x, y, pick(sparkleEmojis), {
        fontSize: `${10 + Math.random() * 12}px`,
      }).setAlpha(0.35);
      this.tweens.add({
        targets: t,
        y: y - 50 - Math.random() * 60,
        alpha: 0,
        duration: 2500 + Math.random() * 2500,
        delay: Math.random() * 2500,
        ease: "Sine.easeIn",
        repeat: -1,
        onRepeat: () => {
          t.x = Math.random() * VW;
          t.y = VH * 0.2 + Math.random() * VH * 0.7;
          t.setAlpha(0.35);
        },
      });
    }

    // Big teddy bear icon, bouncing
    const bear = this.add.text(VW / 2, 150, "🧸", { fontSize: "80px" }).setOrigin(0.5);
    this.tweens.add({
      targets: bear,
      y: 160,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add.text(VW / 2, 240, "Squishy Swap!", {
      fontFamily: "Fraunces, serif",
      fontSize: "38px",
      color: "#be185d",
      stroke: "#fce7f3",
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(VW / 2, 285, "Trade squishies. Collect them all! ✨", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      color: "#9d174d",
    }).setOrigin(0.5);

    this.add.text(VW / 2, 320, `📦 ${col.size} / ${SQUISHIES.length} collected`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      color: "#6b7280",
    }).setOrigin(0.5);

    // Play button
    this.makeButton(VW / 2, 410, 220, 62, "🎮  PLAY", 0xec4899, 0xbe185d, "#ffffff", () => {
      this.cameras.main.fadeOut(180, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade"));
    });

    // Collection button
    this.makeButton(VW / 2, 495, 220, 56, "🎀  COLLECTION", 0xf9a8d4, 0xec4899, "#9d174d", () => {
      this.cameras.main.fadeOut(180, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("collection"));
    });

    this.cameras.main.fadeIn(280, 253, 242, 248);
  }

  private makeButton(
    x: number, y: number, w: number, h: number,
    label: string, fill: number, stroke: number, textColor: string,
    onDown: () => void,
  ): void {
    const btn = this.add.rectangle(x, y, w, h, fill)
      .setStrokeStyle(3, stroke)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: textColor,
    }).setOrigin(0.5);

    btn.on("pointerover", () => this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 80, ease: "Sine.easeOut" }));
    btn.on("pointerout",  () => this.tweens.add({ targets: btn, scaleX: 1.0,  scaleY: 1.0,  duration: 80, ease: "Sine.easeOut" }));
    btn.on("pointerdown", onDown);
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

  // UI refs rebuilt each trade
  private speechText!: Phaser.GameObjects.Text;
  private speechBubble!: Phaser.GameObjects.Rectangle;
  private addBtn!: Phaser.GameObjects.Rectangle;
  private addBtnLabel!: Phaser.GameObjects.Text;
  private valueText!: Phaser.GameObjects.Text;
  // Container that holds ALL offered-card objects so we can wipe & rebuild cleanly
  private cardLayer!: Phaser.GameObjects.Layer;

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

  // Completely rebuild the scene for a new CP/trade
  private buildTrade(): void {
    // Destroy everything from any previous trade
    this.children.removeAll(true);
    this.tweens.killAll();

    // Pick my squishy & CP
    const myIds = [...this.collection];
    const myId = pick(myIds);
    this.mySquishy = SQUISHIES.find(s => s.id === myId) ?? SQUISHIES[0]!;
    this.cp = COMPUTER_PLAYERS[this.cpIndex % COMPUTER_PLAYERS.length]!;
    this.addCount = 0;
    this.offered = this.generateOffer();

    // ── Background ──
    this.add.rectangle(VW / 2, VH / 2, VW, VH, 0xfdf2f8);

    // ── CP header strip ──
    this.add.rectangle(VW / 2, 65, VW, 130, this.cp.color, 0.6)
      .setStrokeStyle(2, 0xfce7f3);

    this.add.text(22, 22, this.cp.emoji, { fontSize: "52px" });
    this.add.text(84, 26, this.cp.name, {
      fontFamily: "Fraunces, serif",
      fontSize: "22px",
      color: "#1f2937",
    });
    this.add.text(84, 56, this.personalityLabel(), {
      fontFamily: "Manrope, sans-serif",
      fontSize: "12px",
      color: "#6b7280",
    });
    this.add.text(VW - 14, 26, `${this.cpIndex + 1} / ${this.MAX_CP}`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#9d174d",
    }).setOrigin(1, 0);

    // ── Speech bubble ──
    this.speechBubble = this.add.rectangle(VW / 2, 116, VW - 32, 34, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xf9a8d4);
    this.speechText = this.add.text(VW / 2, 116, this.getGreeting(), {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#be185d",
    }).setOrigin(0.5);

    // ── Section labels ──
    this.add.text(VW / 2, 152, "YOUR SQUISHY", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#9ca3af",
    }).setOrigin(0.5);

    this.buildMyCard(VW / 2, 205);

    this.add.text(VW / 2, 265, "⬆️  for  ⬇️", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      color: "#be185d",
    }).setOrigin(0.5);

    this.add.text(VW / 2, 295, "THEY OFFER", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#9ca3af",
    }).setOrigin(0.5);

    // Card layer — a Layer lets us add/remove offered cards without touching anything else
    this.cardLayer = this.add.layer();
    this.buildOfferedCards();

    // Value text
    this.valueText = this.add.text(VW / 2, 504, "", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "12px",
      color: "#6b7280",
    }).setOrigin(0.5);
    this.refreshValueText();

    // Buttons
    this.buildButtons();

    this.cameras.main.fadeIn(220, 253, 242, 248);
  }

  // ── My squishy card ──────────────────────────────────────────────────────────
  private buildMyCard(cx: number, cy: number): void {
    const sq = this.mySquishy;
    const rc = RARITY_COLORS[sq.rarity];

    const card = this.add.rectangle(cx, cy, 140, 80, 0xffffff)
      .setStrokeStyle(3, rc);
    this.add.text(cx, cy - 16, sq.emoji, { fontSize: "28px" }).setOrigin(0.5);
    this.add.text(cx, cy + 16, sq.name, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#1f2937",
    }).setOrigin(0.5);
    this.add.text(cx, cy + 32, sq.rarity, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      color: hexStr(rc),
    }).setOrigin(0.5);

    // Pulse for high rarity
    if (rarityRank(sq.rarity) >= 3) {
      this.tweens.add({
        targets: card,
        strokeAlpha: 0.3,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // ── Offered cards ─────────────────────────────────────────────────────────────
  private buildOfferedCards(): void {
    // Wipe only the card layer
    this.cardLayer.removeAll(true);

    const count  = this.offered.length;
    const gap    = 10;
    const cardW  = Math.min(105, (VW - 32 - gap * (count - 1)) / count);
    const cardH  = 100;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = (VW - totalW) / 2 + cardW / 2;
    const cy     = 405;

    this.offered.forEach((sq, i) => {
      const cx = startX + i * (cardW + gap);
      const rc = RARITY_COLORS[sq.rarity];

      const card = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff)
        .setStrokeStyle(2, rc);
      const emojiT = this.add.text(cx, cy - 22, sq.emoji, { fontSize: "24px" }).setOrigin(0.5);
      const nameT  = this.add.text(cx, cy + 16, sq.name, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "9px",
        fontStyle: "bold",
        color: "#1f2937",
        wordWrap: { width: cardW - 8 },
        align: "center",
      }).setOrigin(0.5);
      const rarT = this.add.text(cx, cy + 34, sq.rarity, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "8px",
        color: hexStr(rc),
      }).setOrigin(0.5);

      // Add all to the layer so they're isolated
      this.cardLayer.add([card, emojiT, nameT, rarT]);

      // Pop-in animation
      const targets = [card, emojiT, nameT, rarT];
      targets.forEach(t => t.setScale(0.01));
      this.tweens.add({
        targets,
        scaleX: 1,
        scaleY: 1,
        duration: 260,
        delay: i * 70,
        ease: "Back.easeOut",
      });

      // Sparkle badge for rares+
      if (rarityRank(sq.rarity) >= 2) {
        const badge = this.add.text(cx + cardW / 2 - 6, cy - cardH / 2 + 2, "✨", { fontSize: "11px" });
        this.cardLayer.add(badge);
        this.tweens.add({
          targets: badge,
          y: badge.y - 12,
          alpha: 0,
          duration: 1000,
          repeat: -1,
          delay: i * 150,
          ease: "Sine.easeIn",
          onRepeat: () => {
            badge.y = cy - cardH / 2 + 2;
            badge.setAlpha(1);
          },
        });
      }
    });
  }

  // ── Buttons ───────────────────────────────────────────────────────────────────
  private buildButtons(): void {
    const by = 592;
    const bh = 62;
    const bw = 118;

    // Accept ✅
    const acceptBg = this.add.rectangle(62, by, bw, bh, 0x4ade80)
      .setStrokeStyle(3, 0x16a34a)
      .setInteractive({ useHandCursor: true });
    this.add.text(62, by - 12, "✅", { fontSize: "22px" }).setOrigin(0.5);
    this.add.text(62, by + 16, "ACCEPT", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#14532d",
    }).setOrigin(0.5);

    // Add more ➕
    this.addBtn = this.add.rectangle(VW / 2, by, bw, bh, 0xfbbf24)
      .setStrokeStyle(3, 0xd97706)
      .setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, by - 12, "➕", { fontSize: "22px" }).setOrigin(0.5);
    this.addBtnLabel = this.add.text(VW / 2, by + 16, "ADD MORE", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#78350f",
    }).setOrigin(0.5);

    // Reject ❌
    const rejectBg = this.add.rectangle(VW - 62, by, bw, bh, 0xf87171)
      .setStrokeStyle(3, 0xdc2626)
      .setInteractive({ useHandCursor: true });
    this.add.text(VW - 62, by - 12, "❌", { fontSize: "22px" }).setOrigin(0.5);
    this.add.text(VW - 62, by + 16, "REJECT", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#7f1d1d",
    }).setOrigin(0.5);

    this.refreshAddBtn();

    // Hover scale
    for (const btn of [acceptBg, this.addBtn, rejectBg]) {
      btn.on("pointerover", () => this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 70 }));
      btn.on("pointerout",  () => this.tweens.add({ targets: btn, scaleX: 1.0,  scaleY: 1.0,  duration: 70 }));
    }

    acceptBg.on("pointerdown", () => this.doAccept());
    this.addBtn.on("pointerdown", () => this.doAddMore());
    rejectBg.on("pointerdown", () => this.doReject());
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
    return this.cp.personality === "generous" ? "💖 Generous trader"
         : this.cp.personality === "stingy"   ? "😒 Stingy trader"
         :                                       "🤝 Fair trader";
  }

  private getGreeting(): string {
    const map: Record<string, string[]> = {
      generous: ["Hi! I'd love to trade! 💕", "I have something great! 🌟", "Let's make a deal! 🎉"],
      fair:     ["Hey! Wanna trade? 😊", "I think this is fair! 🤝", "Deal? 🌸"],
      stingy:   ["Hmm... maybe? 🤔", "I guess I can trade... 😒", "Take it or leave it! 😤"],
    };
    return pick(map[this.cp.personality] ?? map["fair"]!);
  }

  private setSpeech(txt: string): void {
    this.speechText.setText(txt);
    // Gentle pop on the bubble only — no scale conflict with other tweens
    this.tweens.killTweensOf(this.speechBubble);
    this.speechBubble.setScale(1);
    this.tweens.add({
      targets: this.speechBubble,
      scaleX: 1.04,
      scaleY: 1.12,
      duration: 100,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  private refreshValueText(): void {
    const myVal  = this.mySquishy.value;
    const offVal = this.offered.reduce((s, q) => s + q.value, 0);
    const diff   = offVal - myVal;
    const sign   = diff >= 0 ? "+" : "";
    this.valueText.setText(`Offer: ${offVal} pts  (yours: ${myVal} pts  ${sign}${diff})`);
    this.valueText.setColor(diff >= 0 ? "#16a34a" : "#dc2626");
  }

  private refreshAddBtn(): void {
    const maxed = this.addCount >= this.MAX_ADD;
    this.addBtn.setFillStyle(maxed ? 0xd1d5db : 0xfbbf24);
    this.addBtn.setStrokeStyle(3, maxed ? 0x9ca3af : 0xd97706);
    this.addBtnLabel.setColor(maxed ? "#9ca3af" : "#78350f");
    if (maxed) {
      this.addBtn.removeInteractive();
    }
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

    this.cameras.main.fadeOut(180, 253, 242, 248);
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
      generous: ["Okay! One more! 🎁", "Sure, take this too! 💖", "Here you go! ✨"],
      fair:     ["Hmm… I could add one! 🤔", "Fine, one more! 😊", "Okay, deal? 🌸"],
      stingy:   ["Ugh, fine! 😤", "This better be worth it! 😒", "Hard bargain! 😑"],
    };
    this.setSpeech(pick(map[this.cp.personality] ?? map["fair"]!));

    const used = [this.mySquishy.id, ...this.offered.map(s => s.id)];
    this.offered.push(weightedRandomSquishy(this.mySquishy.value * 0.8, used));

    this.buildOfferedCards();
    this.refreshValueText();
    this.refreshAddBtn();
  }

  private doReject(): void {
    const map: Record<string, string[]> = {
      generous: ["Oh no! 😢 Maybe someone else?", "Fine... 💔", "I thought we were friends! 😭"],
      fair:     ["Your loss! 🤷", "Okay, moving on! 😊", "Fine! Maybe someone else! 😤"],
      stingy:   ["FINE! Didn't want to anyway! 😤", "Whatever! 😒", "Hmph! 😤"],
    };
    this.setSpeech(pick(map[this.cp.personality] ?? map["fair"]!));

    // Disable all buttons to prevent double-tap during delay
    this.input.enabled = false;

    this.time.delayedCall(700, () => {
      this.cpIndex++;
      if (this.cpIndex >= this.MAX_CP) {
        this.cameras.main.fadeOut(180, 253, 242, 248);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("result", {
            given: null,
            received: [],
            score: 0,
            collectionSize: this.collection.size,
          } satisfies ResultData);
        });
        return;
      }
      this.cameras.main.fadeOut(180, 253, 242, 248);
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

    this.add.rectangle(VW / 2, VH / 2, VW, VH, 0xfdf2f8);

    if (!data.given) {
      // No trade was made
      this.add.text(VW / 2, VH / 2 - 80, "😔", { fontSize: "72px" }).setOrigin(0.5);
      this.add.text(VW / 2, VH / 2, "No trade made!", {
        fontFamily: "Fraunces, serif",
        fontSize: "30px",
        color: "#be185d",
      }).setOrigin(0.5);
      this.add.text(VW / 2, VH / 2 + 50, "Better luck next time!", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "16px",
        color: "#6b7280",
      }).setOrigin(0.5);
    } else {
      this.spawnConfetti();

      this.add.text(VW / 2, 72, "🎉 TRADE COMPLETE! 🎉", {
        fontFamily: "Fraunces, serif",
        fontSize: "26px",
        color: "#be185d",
        stroke: "#fce7f3",
        strokeThickness: 4,
      }).setOrigin(0.5);

      // Given
      this.add.text(VW / 2, 128, "You gave:", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#9ca3af",
      }).setOrigin(0.5);
      this.add.text(VW / 2, 158, `${data.given.emoji}  ${data.given.name}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#1f2937",
      }).setOrigin(0.5);

      this.add.text(VW / 2, 188, "⬇️", { fontSize: "18px" }).setOrigin(0.5);

      // Received
      this.add.text(VW / 2, 216, "You received:", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#9ca3af",
      }).setOrigin(0.5);

      const recStr = data.received.map(s => `${s.emoji} ${s.name}`).join("  +  ");
      this.add.text(VW / 2, 248, recStr, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#1f2937",
        wordWrap: { width: VW - 40 },
        align: "center",
      }).setOrigin(0.5);

      // Score panel
      const { label, emoji: scoreEmoji, color } = this.tradeLabel(data.score);
      const panel = this.add.rectangle(VW / 2, 360, VW - 48, 110, color, 0.12)
        .setStrokeStyle(3, color);
      this.tweens.add({ targets: panel, scaleX: 1.02, scaleY: 1.02, duration: 600, yoyo: true, repeat: -1 });

      this.add.text(VW / 2, 335, `${scoreEmoji}  ${label}`, {
        fontFamily: "Fraunces, serif",
        fontSize: "24px",
        color: hexStr(color),
      }).setOrigin(0.5);
      this.add.text(VW / 2, 375, `${data.score} / 100`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "32px",
        fontStyle: "bold",
        color: hexStr(color),
      }).setOrigin(0.5);
      this.add.text(VW / 2, 410, this.tradeMessage(data.score), {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#6b7280",
      }).setOrigin(0.5);

      // Collection count
      this.add.text(VW / 2, 460, `📦 Collection: ${data.collectionSize} / ${SQUISHIES.length}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#9d174d",
      }).setOrigin(0.5);
    }

    // Buttons
    this.makeButton(VW / 2 - 75, VH - 80, "🔄  Trade Again", 0xec4899, 0xbe185d, "#fff", () => {
      this.cameras.main.fadeOut(180, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade"));
    });
    this.makeButton(VW / 2 + 75, VH - 80, "🎀  Collection", 0xf9a8d4, 0xec4899, "#9d174d", () => {
      this.cameras.main.fadeOut(180, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("collection"));
    });

    this.cameras.main.fadeIn(280, 253, 242, 248);
  }

  private makeButton(
    x: number, y: number, label: string,
    fill: number, stroke: number, textColor: string,
    onDown: () => void,
  ): void {
    const btn = this.add.rectangle(x, y, 138, 54, fill)
      .setStrokeStyle(3, stroke)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: textColor,
    }).setOrigin(0.5);
    btn.on("pointerover", () => this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 70 }));
    btn.on("pointerout",  () => this.tweens.add({ targets: btn, scaleX: 1.0,  scaleY: 1.0,  duration: 70 }));
    btn.on("pointerdown", onDown);
  }

  private tradeLabel(score: number): { label: string; emoji: string; color: number } {
    if (score >= 85) return { label: "AMAZING TRADE!",     emoji: "🔥", color: 0xf472b6 };
    if (score >= 70) return { label: "GREAT TRADE!",       emoji: "💖", color: 0x4ade80 };
    if (score >= 50) return { label: "FAIR TRADE",         emoji: "😊", color: 0x60a5fa };
    if (score >= 30) return { label: "NOT THE BEST...",    emoji: "😬", color: 0xfbbf24 };
    return              { label: "TERRIBLE TRADE!",    emoji: "💀", color: 0xf87171 };
  }

  private tradeMessage(score: number): string {
    if (score >= 85) return "You got way more than you gave! 🎉";
    if (score >= 70) return "Nice deal — you came out ahead! ✨";
    if (score >= 50) return "Pretty even trade. Not bad! 😊";
    if (score >= 30) return "You gave more than you got... 😬";
    return                  "Ouch. That was a rough deal! 💀";
  }

  private spawnConfetti(): void {
    const colors = [0xf472b6, 0xfbbf24, 0x4ade80, 0x60a5fa, 0xc084fc, 0xfde68a];
    for (let i = 0; i < 28; i++) {
      const x = Math.random() * VW;
      const c = this.add.rectangle(x, -20, 8 + Math.random() * 8, 8 + Math.random() * 8,
        colors[Math.floor(Math.random() * colors.length)] ?? 0xf472b6);
      this.tweens.add({
        targets: c,
        y: VH + 30,
        x: x + (Math.random() - 0.5) * 120,
        angle: Math.random() * 360,
        duration: 1800 + Math.random() * 1200,
        delay: Math.random() * 800,
        ease: "Sine.easeIn",
        onComplete: () => c.destroy(),
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

    this.add.rectangle(VW / 2, VH / 2, VW, VH, 0xfdf2f8);

    this.add.text(VW / 2, 36, "🎀  My Collection", {
      fontFamily: "Fraunces, serif",
      fontSize: "26px",
      color: "#be185d",
    }).setOrigin(0.5);

    this.add.text(VW / 2, 72, `${col.size} / ${SQUISHIES.length} squishies collected`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#9d174d",
    }).setOrigin(0.5);

    // Grid
    const cols  = 4;
    const cellW = (VW - 24) / cols;
    const cellH = 90;
    const startY = 110;

    SQUISHIES.forEach((sq, idx) => {
      const col2   = idx % cols;
      const row    = Math.floor(idx / cols);
      const cx     = 12 + col2 * cellW + cellW / 2;
      const cy     = startY + row * cellH + cellH / 2;
      const owned  = col.has(sq.id);
      const rc     = RARITY_COLORS[sq.rarity];

      const card = this.add.rectangle(cx, cy, cellW - 6, cellH - 6, owned ? 0xffffff : 0xf3f4f6)
        .setStrokeStyle(2, owned ? rc : 0xe5e7eb);

      if (owned) {
        this.add.text(cx, cy - 18, sq.emoji, { fontSize: "22px" }).setOrigin(0.5);
        this.add.text(cx, cy + 10, sq.name, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "8px",
          fontStyle: "bold",
          color: "#1f2937",
          wordWrap: { width: cellW - 10 },
          align: "center",
        }).setOrigin(0.5);
        this.add.text(cx, cy + 26, sq.rarity, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "7px",
          color: hexStr(rc),
        }).setOrigin(0.5);

        // Gentle float for legendaries+
        if (rarityRank(sq.rarity) >= 4) {
          this.tweens.add({
            targets: card,
            y: cy - 3,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }
      } else {
        // Silhouette lock
        this.add.text(cx, cy - 10, "❓", { fontSize: "22px", color: "#d1d5db" }).setOrigin(0.5);
        this.add.text(cx, cy + 18, "???", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "9px",
          color: "#d1d5db",
        }).setOrigin(0.5);
      }
    });

    // Back button
    const back = this.add.rectangle(VW / 2, VH - 44, 180, 52, 0xec4899)
      .setStrokeStyle(3, 0xbe185d)
      .setInteractive({ useHandCursor: true });
    this.add.text(VW / 2, VH - 44, "← Back", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
    back.on("pointerover", () => this.tweens.add({ targets: back, scaleX: 1.06, scaleY: 1.06, duration: 70 }));
    back.on("pointerout",  () => this.tweens.add({ targets: back, scaleX: 1.0,  scaleY: 1.0,  duration: 70 }));
    back.on("pointerdown", () => {
      this.cameras.main.fadeOut(180, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
    });

    this.cameras.main.fadeIn(280, 253, 242, 248);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

export function startGame(parent: HTMLElement, onScore: (n: number) => void): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VW,
    height: VH,
    backgroundColor: "#fdf2f8",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
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

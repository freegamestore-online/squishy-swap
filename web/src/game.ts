import Phaser from "phaser";

// ─── Constants ───────────────────────────────────────────────────────────────
const VW = 480;
const VH = 720;

// ─── Types ───────────────────────────────────────────────────────────────────
type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "ultrarare";

interface Squishy {
  id: string;
  emoji: string;
  name: string;
  rarity: Rarity;
  value: number; // base trade value
}

interface ComputerPlayer {
  name: string;
  emoji: string;
  color: number;
  personality: "generous" | "fair" | "stingy" | "tricky";
  speechAdd: string[];
  speechReject: string[];
  speechDeal: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────
const SQUISHIES: Squishy[] = [
  // Common (value 1–2)
  { id: "strawberry",  emoji: "🍓", name: "Strawberry",   rarity: "common",    value: 1 },
  { id: "donut",       emoji: "🍩", name: "Donut",         rarity: "common",    value: 1 },
  { id: "cloud",       emoji: "☁️", name: "Cloud",         rarity: "common",    value: 1 },
  { id: "lemon",       emoji: "🍋", name: "Lemon",         rarity: "common",    value: 2 },
  { id: "cookie",      emoji: "🍪", name: "Cookie",        rarity: "common",    value: 2 },
  { id: "cupcake",     emoji: "🧁", name: "Cupcake",       rarity: "common",    value: 2 },
  // Uncommon (value 3–5)
  { id: "cat",         emoji: "🐱", name: "Cat",           rarity: "uncommon",  value: 3 },
  { id: "bunny",       emoji: "🐰", name: "Bunny",         rarity: "uncommon",  value: 4 },
  { id: "bear",        emoji: "🐻", name: "Bear",          rarity: "uncommon",  value: 4 },
  { id: "frog",        emoji: "🐸", name: "Frog",          rarity: "uncommon",  value: 3 },
  { id: "duck",        emoji: "🐥", name: "Duck",          rarity: "uncommon",  value: 5 },
  { id: "penguin",     emoji: "🐧", name: "Penguin",       rarity: "uncommon",  value: 5 },
  // Rare (value 6–9)
  { id: "unicorn",     emoji: "🦄", name: "Unicorn",       rarity: "rare",      value: 8 },
  { id: "fox",         emoji: "🦊", name: "Fox",           rarity: "rare",      value: 7 },
  { id: "axolotl",     emoji: "🦎", name: "Axolotl",       rarity: "rare",      value: 9 },
  { id: "mushroom",    emoji: "🍄", name: "Mushroom",      rarity: "rare",      value: 6 },
  // Epic (value 10–15)
  { id: "dragon",      emoji: "🐉", name: "Dragon",        rarity: "epic",      value: 12 },
  { id: "mermaid",     emoji: "🧜", name: "Mermaid",       rarity: "epic",      value: 14 },
  { id: "rainbow",     emoji: "🌈", name: "Rainbow",       rarity: "epic",      value: 11 },
  { id: "crystal",     emoji: "💎", name: "Crystal",       rarity: "epic",      value: 15 },
  // Legendary (value 16–22)
  { id: "phoenix",     emoji: "🔥", name: "Phoenix",       rarity: "legendary", value: 18 },
  { id: "galaxy",      emoji: "🌌", name: "Galaxy",        rarity: "legendary", value: 20 },
  { id: "crown",       emoji: "👑", name: "Crown",         rarity: "legendary", value: 22 },
  // Ultra Rare (value 23+)
  { id: "stardust",    emoji: "✨", name: "Stardust",      rarity: "ultrarare", value: 28 },
  { id: "moonstone",   emoji: "🌙", name: "Moonstone",     rarity: "ultrarare", value: 30 },
  { id: "heartgem",    emoji: "💖", name: "Heart Gem",     rarity: "ultrarare", value: 35 },
];

const RARITY_COLORS: Record<Rarity, number> = {
  common:    0xaaaaaa,
  uncommon:  0x4ade80,
  rare:      0x60a5fa,
  epic:      0xa855f7,
  legendary: 0xfbbf24,
  ultrarare: 0xf472b6,
};

const RARITY_LABELS: Record<Rarity, string> = {
  common:    "Common",
  uncommon:  "Uncommon",
  rare:      "Rare ✦",
  epic:      "Epic ✦✦",
  legendary: "Legendary ✦✦✦",
  ultrarare: "✨ Ultra Rare",
};

const COMPUTER_PLAYERS: ComputerPlayer[] = [
  {
    name: "Mochi",
    emoji: "🐱",
    color: 0xfda4af,
    personality: "generous",
    speechAdd:    ["Okay! I'll add one more~ 💕", "Sure! Here you go! 🎀", "Anything for a trade! ✨"],
    speechReject: ["Aww... okay then! 😿", "Nooo come back! 🐾", "Fine... see ya! 😢"],
    speechDeal:   ["Deal? Deal?! 🥺", "Please trade with me! 💖", "I really want that one! 🎀"],
  },
  {
    name: "Pudding",
    emoji: "🍮",
    color: 0xfde68a,
    personality: "fair",
    speechAdd:    ["Hmm... I could add something! 🤔", "Let me check my bag... 🎒", "Okay, one more! 😊"],
    speechReject: ["Fair enough! 😌", "Worth a shot! 👍", "Good luck out there! 🌟"],
    speechDeal:   ["Seems fair to me! 😊", "What do you think? 🤗", "A good deal for both! 💫"],
  },
  {
    name: "Boba",
    emoji: "🧋",
    color: 0xc4b5fd,
    personality: "stingy",
    speechAdd:    ["Ugh... fiiiine. 😒", "This is my last one! 😤", "Don't push it... 😑"],
    speechReject: ["Whatever! 🙄", "Your loss! 😤", "Fine! Maybe someone else! 💢"],
    speechDeal:   ["Take it or leave it! 😏", "Best offer you'll get! 😤", "This is already generous! 🙄"],
  },
  {
    name: "Sprinkle",
    emoji: "🍬",
    color: 0x86efac,
    personality: "tricky",
    speechAdd:    ["Ooh! Sneaky add! 🎭", "Surprise! ✨", "Hehe, how about THIS! 🎪"],
    speechReject: ["You're sharp! 🦊", "I almost had you! 😜", "Onto the next one~! 🌀"],
    speechDeal:   ["Hehe, deal? 😈", "Trust me on this one~ 🎭", "It's a good deal, I promise! 😇"],
  },
  {
    name: "Marshmallow",
    emoji: "☁️",
    color: 0xe0f2fe,
    personality: "generous",
    speechAdd:    ["Of course! Here's more! 🌸", "I have lots to share! 💝", "Take it, it's yours! 🎁"],
    speechReject: ["Oh no! 😱 Please reconsider!", "I'll miss you! 🥹", "Come back anytime! 💕"],
    speechDeal:   ["I really love that squishy! 🥰", "Please? It would make me so happy! ☁️", "Best friends trade! 💞"],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0] as T);
  }
  return result;
}

function squishyValue(sq: Squishy): number {
  return sq.value;
}

function totalValue(squishies: Squishy[]): number {
  return squishies.reduce((s, sq) => s + squishyValue(sq), 0);
}

function tradeScore(given: Squishy, received: Squishy[]): number {
  const gv = squishyValue(given);
  const rv = totalValue(received);
  if (gv === 0) return 50;
  const ratio = rv / gv;
  // ratio > 1 = good deal, < 1 = bad deal
  const score = Math.round(Math.min(100, Math.max(0, 50 + (ratio - 1) * 40)));
  return score;
}

function tradeLabel(score: number): { label: string; emoji: string; color: string } {
  if (score >= 90) return { label: "AMAZING TRADE!", emoji: "🔥", color: "#f472b6" };
  if (score >= 70) return { label: "GREAT TRADE!",   emoji: "💖", color: "#a855f7" };
  if (score >= 50) return { label: "FAIR TRADE",     emoji: "😊", color: "#4ade80" };
  if (score >= 30) return { label: "NOT THE BEST",   emoji: "😬", color: "#fbbf24" };
  return              { label: "TERRIBLE TRADE!",    emoji: "💀", color: "#ef4444" };
}

function getInitialCollection(): string[] {
  try {
    const raw = localStorage.getItem("squishyswap_collection");
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* ignore */ }
  // Start with 3 random common squishies
  return pickN(SQUISHIES.filter(s => s.rarity === "common"), 3).map(s => s.id);
}

function saveCollection(ids: string[]): void {
  try {
    localStorage.setItem("squishyswap_collection", JSON.stringify(ids));
  } catch { /* ignore */ }
}

function getStartingSquishy(collection: string[]): Squishy {
  const owned = SQUISHIES.filter(s => collection.includes(s.id));
  if (owned.length === 0) return SQUISHIES[0]!;
  return pick(owned);
}

// Generate computer offer based on personality
function generateOffer(computer: ComputerPlayer, yourSquishy: Squishy, count: number): Squishy[] {
  const yourValue = squishyValue(yourSquishy);
  let targetValue: number;
  switch (computer.personality) {
    case "generous": targetValue = yourValue * (0.9 + Math.random() * 0.6); break;
    case "fair":     targetValue = yourValue * (0.7 + Math.random() * 0.5); break;
    case "stingy":   targetValue = yourValue * (0.3 + Math.random() * 0.4); break;
    case "tricky":   targetValue = yourValue * (0.5 + Math.random() * 0.8); break;
  }
  // Pick squishies whose combined value is close to targetValue
  const pool = SQUISHIES.filter(s => s.id !== yourSquishy.id);
  const result: Squishy[] = [];
  let remaining = targetValue;
  for (let i = 0; i < count; i++) {
    const candidates = pool.filter(s => !result.includes(s) && s.value <= Math.max(1, remaining + 3));
    if (candidates.length === 0) break;
    const chosen = pick(candidates);
    result.push(chosen);
    remaining -= chosen.value;
  }
  // If we got nothing, add a random one
  if (result.length === 0) result.push(pick(pool));
  return result;
}

// ─── Scenes ──────────────────────────────────────────────────────────────────

// Shared game state passed between scenes
interface GameState {
  onScore: (n: number) => void;
  collection: string[];
  yourSquishy: Squishy;
  tradeResult?: { given: Squishy; received: Squishy[]; score: number };
}

// ─── MENU SCENE ──────────────────────────────────────────────────────────────
class MenuScene extends Phaser.Scene {
  private state!: GameState;

  constructor() { super("Menu"); }

  init(data: object): void {
    this.state = data as GameState;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#fdf2f8");

    // Pastel gradient bg
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfce7f3, 0xfce7f3, 0xede9fe, 0xede9fe, 1);
    bg.fillRect(0, 0, VW, VH);

    // Floating sparkles
    this.spawnSparkles();

    // Title
    this.add.text(VW / 2, 120, "✨", { fontSize: "64px" }).setOrigin(0.5);
    this.add.text(VW / 2, 200, "Squishy Swap!", {
      fontFamily: "Fraunces, serif",
      fontSize: "42px",
      color: "#be185d",
      stroke: "#ffffff",
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(VW / 2, 250, "Collect & Trade Cute Squishies!", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "16px",
      color: "#9d174d",
    }).setOrigin(0.5);

    // Show collection count
    const count = this.state.collection.length;
    const total = SQUISHIES.length;
    this.add.text(VW / 2, 300, `🎀 Collection: ${count} / ${total}`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "18px",
      color: "#7c3aed",
      backgroundColor: "#f5f3ff",
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setAlpha(0.9);

    // Current squishy preview
    const sq = this.state.yourSquishy;
    this.drawSquishyCard(VW / 2, 400, sq, true);

    // Play button
    const playBtn = this.add.text(VW / 2, 530, "  START TRADING  ", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#ffffff",
      backgroundColor: "#ec4899",
      padding: { x: 24, y: 14 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on("pointerover", () => playBtn.setBackgroundColor("#db2777"));
    playBtn.on("pointerout",  () => playBtn.setBackgroundColor("#ec4899"));
    playBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start("Trade", this.state);
      });
    });

    // Collection button
    const colBtn = this.add.text(VW / 2, 600, "  📦 My Collection  ", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "17px",
      color: "#7c3aed",
      backgroundColor: "#ede9fe",
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    colBtn.on("pointerover", () => colBtn.setBackgroundColor("#ddd6fe"));
    colBtn.on("pointerout",  () => colBtn.setBackgroundColor("#ede9fe"));
    colBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start("Collection", this.state);
      });
    });

    this.cameras.main.fadeIn(400);
  }

  private drawSquishyCard(x: number, y: number, sq: Squishy, animate: boolean): void {
    const rarColor = RARITY_COLORS[sq.rarity];
    const card = this.add.rectangle(x, y, 160, 120, 0xffffff, 0.9)
      .setStrokeStyle(3, rarColor);

    this.add.text(x, y - 20, sq.emoji, { fontSize: "40px" }).setOrigin(0.5);
    this.add.text(x, y + 22, sq.name, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#1e1b4b",
    }).setOrigin(0.5);
    this.add.text(x, y + 42, RARITY_LABELS[sq.rarity], {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      color: "#" + rarColor.toString(16).padStart(6, "0"),
    }).setOrigin(0.5);

    if (animate) {
      this.tweens.add({
        targets: card,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private spawnSparkles(): void {
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * VW;
      const y = Math.random() * VH;
      const star = this.add.text(x, y, pick(["✦", "✧", "⋆", "✨", "🌸"]), {
        fontSize: `${10 + Math.random() * 16}px`,
        alpha: 0,
      });
      this.tweens.add({
        targets: star,
        alpha: { from: 0, to: 0.7 },
        y: y - 30 - Math.random() * 40,
        duration: 1500 + Math.random() * 2000,
        delay: Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }
}

// ─── TRADE SCENE ─────────────────────────────────────────────────────────────
class TradeScene extends Phaser.Scene {
  private state!: GameState;
  private computer!: ComputerPlayer;
  private offer: Squishy[] = [];
  private computerIndex = 0;
  private offerContainer!: Phaser.GameObjects.Container;
  private speechBubble!: Phaser.GameObjects.Text;
  private speechBg!: Phaser.GameObjects.Rectangle;
  private addCount = 0;

  constructor() { super("Trade"); }

  init(data: object): void {
    this.state = data as GameState;
    this.computerIndex = 0;
    this.addCount = 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#fdf4ff");
    this.drawBackground();
    this.loadNextComputer();
    this.cameras.main.fadeIn(350);
  }

  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfdf4ff, 0xfdf4ff, 0xfce7f3, 0xfce7f3, 1);
    bg.fillRect(0, 0, VW, VH);

    // Decorative circles
    const deco = this.add.graphics();
    deco.fillStyle(0xfce7f3, 0.4);
    deco.fillCircle(-40, 80, 120);
    deco.fillStyle(0xede9fe, 0.4);
    deco.fillCircle(VW + 40, VH - 100, 140);
  }

  private loadNextComputer(): void {
    this.children.removeAll(true);
    this.drawBackground();
    this.addCount = 0;

    if (this.computerIndex >= COMPUTER_PLAYERS.length) {
      // All computers done — back to menu
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.state.yourSquishy = getStartingSquishy(this.state.collection);
        this.scene.start("Menu", this.state);
      });
      return;
    }

    this.computer = COMPUTER_PLAYERS[this.computerIndex]!;
    this.offer = generateOffer(this.computer, this.state.yourSquishy, 2);

    this.drawHeader();
    this.drawYourSquishy();
    this.drawComputer();
    this.drawOffer();
    this.drawButtons();
    this.showSpeech(pick(this.computer.speechDeal));
  }

  private drawHeader(): void {
    this.add.text(VW / 2, 24, `Trader ${this.computerIndex + 1} of ${COMPUTER_PLAYERS.length}`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#9d174d",
    }).setOrigin(0.5);

    this.add.text(VW / 2, 48, "✨ Trade Time! ✨", {
      fontFamily: "Fraunces, serif",
      fontSize: "26px",
      color: "#be185d",
    }).setOrigin(0.5);
  }

  private drawYourSquishy(): void {
    const sq = this.state.yourSquishy;
    this.add.text(30, 88, "YOUR SQUISHY", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#6b7280",
    });

    const rarColor = RARITY_COLORS[sq.rarity];
    const card = this.add.rectangle(100, 150, 140, 110, 0xffffff, 0.95)
      .setStrokeStyle(3, rarColor);
    this.tweens.add({
      targets: card,
      scaleX: 1.03, scaleY: 1.03,
      duration: 1000, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    this.add.text(100, 128, sq.emoji, { fontSize: "34px" }).setOrigin(0.5);
    this.add.text(100, 162, sq.name, {
      fontFamily: "Manrope, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#1e1b4b",
    }).setOrigin(0.5);
    this.add.text(100, 178, RARITY_LABELS[sq.rarity], {
      fontFamily: "Manrope, sans-serif", fontSize: "10px",
      color: "#" + rarColor.toString(16).padStart(6, "0"),
    }).setOrigin(0.5);

    // Sparkles for rare+
    if (["rare","epic","legendary","ultrarare"].includes(sq.rarity)) {
      this.spawnCardSparkles(100, 150);
    }
  }

  private drawComputer(): void {
    const cp = this.computer;
    const hexColor = "#" + cp.color.toString(16).padStart(6, "0");

    // Computer avatar
    const bubble = this.add.circle(VW - 80, 150, 44, cp.color, 0.85)
      .setStrokeStyle(3, 0xffffff);
    this.tweens.add({
      targets: bubble,
      scaleX: 1.06, scaleY: 1.06,
      duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
    this.add.text(VW - 80, 150, cp.emoji, { fontSize: "36px" }).setOrigin(0.5);
    this.add.text(VW - 80, 202, cp.name, {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", fontStyle: "bold",
      color: hexColor,
    }).setOrigin(0.5);

    // Speech bubble (will be updated)
    this.speechBg = this.add.rectangle(VW / 2, 240, 300, 44, 0xffffff, 0.9)
      .setStrokeStyle(2, cp.color);
    this.speechBubble = this.add.text(VW / 2, 240, "", {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: "#374151",
      wordWrap: { width: 270 },
    }).setOrigin(0.5);
  }

  private showSpeech(text: string): void {
    this.speechBubble.setText(text);
    this.tweens.add({
      targets: [this.speechBg, this.speechBubble],
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  private drawOffer(): void {
    this.offerContainer?.destroy();
    this.offerContainer = this.add.container(0, 0);

    this.add.text(VW / 2, 270, `${this.computer.name.toUpperCase()} OFFERS`, {
      fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#6b7280",
    }).setOrigin(0.5);

    const offerY = 370;
    const spacing = Math.min(130, (VW - 40) / this.offer.length);
    const startX = VW / 2 - ((this.offer.length - 1) * spacing) / 2;

    this.offer.forEach((sq, i) => {
      const x = startX + i * spacing;
      const rarColor = RARITY_COLORS[sq.rarity];

      const card = this.add.rectangle(x, offerY, 110, 90, 0xffffff, 0.95)
        .setStrokeStyle(2, rarColor);
      this.offerContainer.add(card);

      const emoji = this.add.text(x, offerY - 18, sq.emoji, { fontSize: "28px" }).setOrigin(0.5);
      this.offerContainer.add(emoji);

      const name = this.add.text(x, offerY + 16, sq.name, {
        fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#1e1b4b",
      }).setOrigin(0.5);
      this.offerContainer.add(name);

      const rar = this.add.text(x, offerY + 30, RARITY_LABELS[sq.rarity], {
        fontFamily: "Manrope, sans-serif", fontSize: "9px",
        color: "#" + rarColor.toString(16).padStart(6, "0"),
      }).setOrigin(0.5);
      this.offerContainer.add(rar);

      // Bounce in
      this.tweens.add({
        targets: [card, emoji, name, rar],
        y: `-=8`,
        duration: 600 + i * 100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 200,
      });

      // Sparkles for rare+
      if (["rare","epic","legendary","ultrarare"].includes(sq.rarity)) {
        this.spawnCardSparkles(x, offerY);
      }
    });
  }

  private drawButtons(): void {
    const btnY = VH - 90;
    const btnData = [
      { x: 80,       label: "✅", sub: "ACCEPT",  color: 0x4ade80, action: "accept" },
      { x: VW / 2,   label: "➕", sub: "ADD MORE", color: 0x60a5fa, action: "add"    },
      { x: VW - 80,  label: "❌", sub: "NEXT",    color: 0xf87171, action: "reject"  },
    ];

    btnData.forEach(({ x, label, sub, color, action }) => {
      const hexColor = "#" + color.toString(16).padStart(6, "0");
      const btn = this.add.circle(x, btnY, 38, color, 0.9)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, btnY - 4, label, { fontSize: "26px" }).setOrigin(0.5);
      this.add.text(x, btnY + 48, sub, {
        fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: hexColor,
      }).setOrigin(0.5);

      btn.on("pointerover", () => {
        this.tweens.add({ targets: btn, scaleX: 1.15, scaleY: 1.15, duration: 150 });
      });
      btn.on("pointerout", () => {
        this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 150 });
      });
      btn.on("pointerdown", () => this.handleAction(action));
    });
  }

  private handleAction(action: string): void {
    if (action === "accept") {
      // Complete the trade!
      const score = tradeScore(this.state.yourSquishy, this.offer);
      // Add received squishies to collection
      const newCollection = [...this.state.collection];
      this.offer.forEach(sq => {
        if (!newCollection.includes(sq.id)) newCollection.push(sq.id);
      });
      // Remove given squishy from collection (maybe)
      const givenIdx = newCollection.indexOf(this.state.yourSquishy.id);
      if (givenIdx !== -1) newCollection.splice(givenIdx, 1);
      // Ensure at least one squishy
      if (newCollection.length === 0) newCollection.push(pick(SQUISHIES.filter(s => s.rarity === "common")).id);

      this.state.collection = newCollection;
      saveCollection(newCollection);
      this.state.tradeResult = { given: this.state.yourSquishy, received: this.offer, score };
      this.state.onScore(score);

      this.cameras.main.fadeOut(300, 255, 255, 255);
      this.time.delayedCall(300, () => {
        this.scene.start("Result", this.state);
      });

    } else if (action === "add") {
      if (this.addCount >= 2) {
        this.showSpeech("I can't add any more! 😅");
        return;
      }
      this.addCount++;
      const existing = this.offer.map(s => s.id);
      const pool = SQUISHIES.filter(s => !existing.includes(s.id) && s.id !== this.state.yourSquishy.id);
      if (pool.length === 0) {
        this.showSpeech("I have nothing left! 😱");
        return;
      }
      // Personality affects what they add
      let newSq: Squishy;
      if (this.computer.personality === "generous") {
        const good = pool.filter(s => s.value >= this.state.yourSquishy.value * 0.3);
        newSq = pick(good.length ? good : pool);
      } else if (this.computer.personality === "stingy") {
        const cheap = pool.filter(s => s.value <= 3);
        newSq = pick(cheap.length ? cheap : pool);
      } else {
        newSq = pick(pool);
      }
      this.offer.push(newSq);
      this.showSpeech(pick(this.computer.speechAdd));
      this.refreshOffer();

    } else if (action === "reject") {
      this.showSpeech(pick(this.computer.speechReject));
      this.time.delayedCall(700, () => {
        this.computerIndex++;
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.time.delayedCall(250, () => {
          this.cameras.main.fadeIn(250);
          this.loadNextComputer();
        });
      });
    }
  }

  private refreshOffer(): void {
    // Remove old offer objects and redraw
    this.offerContainer?.destroy();
    this.drawOffer();
  }

  private spawnCardSparkles(x: number, y: number): void {
    const glyphs = ["✦", "✧", "⋆", "★"];
    for (let i = 0; i < 4; i++) {
      const sx = x + (Math.random() - 0.5) * 80;
      const sy = y + (Math.random() - 0.5) * 60;
      const star = this.add.text(sx, sy, pick(glyphs), {
        fontSize: "10px",
        color: "#f9a8d4",
        alpha: 0,
      });
      this.tweens.add({
        targets: star,
        alpha: { from: 0, to: 0.9 },
        y: sy - 20,
        duration: 800 + Math.random() * 600,
        delay: Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }
}

// ─── RESULT SCENE ────────────────────────────────────────────────────────────
class ResultScene extends Phaser.Scene {
  private state!: GameState;

  constructor() { super("Result"); }

  init(data: object): void {
    this.state = data as GameState;
  }

  create(): void {
    const result = this.state.tradeResult;
    if (!result) {
      this.scene.start("Menu", this.state);
      return;
    }

    const { given, received, score } = result;
    const { label, emoji, color } = tradeLabel(score);

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfdf2f8, 0xfdf2f8, 0xf0fdf4, 0xf0fdf4, 1);
    bg.fillRect(0, 0, VW, VH);

    // Confetti burst
    this.spawnConfetti();

    // Title
    this.add.text(VW / 2, 60, "🎉 TRADE COMPLETE! 🎉", {
      fontFamily: "Fraunces, serif",
      fontSize: "28px",
      color: "#be185d",
      stroke: "#ffffff",
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: this.children.list[this.children.list.length - 1],
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 500, ease: "Back.easeOut",
    });

    // Trade summary
    this.add.text(VW / 2, 120, "You gave:", {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: "#6b7280",
    }).setOrigin(0.5);

    this.add.text(VW / 2, 148, `${given.emoji} ${given.name}`, {
      fontFamily: "Manrope, sans-serif", fontSize: "20px", fontStyle: "bold", color: "#1e1b4b",
    }).setOrigin(0.5);

    const rarColor = "#" + RARITY_COLORS[given.rarity].toString(16).padStart(6, "0");
    this.add.text(VW / 2, 172, RARITY_LABELS[given.rarity], {
      fontFamily: "Manrope, sans-serif", fontSize: "12px", color: rarColor,
    }).setOrigin(0.5);

    // Arrow
    this.add.text(VW / 2, 200, "⬇️", { fontSize: "24px" }).setOrigin(0.5);

    this.add.text(VW / 2, 228, "You received:", {
      fontFamily: "Manrope, sans-serif", fontSize: "13px", color: "#6b7280",
    }).setOrigin(0.5);

    // Received squishies
    const recY = 310;
    const spacing = Math.min(140, (VW - 40) / received.length);
    const startX = VW / 2 - ((received.length - 1) * spacing) / 2;

    received.forEach((sq, i) => {
      const x = startX + i * spacing;
      const rc = RARITY_COLORS[sq.rarity];
      const rcHex = "#" + rc.toString(16).padStart(6, "0");

      const card = this.add.rectangle(x, recY, 110, 90, 0xffffff, 0.95)
        .setStrokeStyle(2, rc).setAlpha(0).setScale(0.5);

      const emojiTxt = this.add.text(x, recY - 18, sq.emoji, { fontSize: "28px" })
        .setOrigin(0.5).setAlpha(0).setScale(0.5);
      const nameTxt = this.add.text(x, recY + 16, sq.name, {
        fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#1e1b4b",
      }).setOrigin(0.5).setAlpha(0).setScale(0.5);
      const rarTxt = this.add.text(x, recY + 30, RARITY_LABELS[sq.rarity], {
        fontFamily: "Manrope, sans-serif", fontSize: "9px", color: rcHex,
      }).setOrigin(0.5).setAlpha(0).setScale(0.5);

      this.tweens.add({
        targets: [card, emojiTxt, nameTxt, rarTxt],
        alpha: 1, scaleX: 1, scaleY: 1,
        duration: 400, delay: 300 + i * 200, ease: "Back.easeOut",
      });

      if (["rare","epic","legendary","ultrarare"].includes(sq.rarity)) {
        this.time.delayedCall(300 + i * 200, () => this.spawnCardSparkles(x, recY));
      }
    });

    // Score badge
    const scoreBadge = this.add.text(VW / 2, 430, `${emoji} ${label}  ${score}/100`, {
      fontFamily: "Fraunces, serif",
      fontSize: "24px",
      color: color,
      backgroundColor: "#ffffff",
      padding: { x: 20, y: 12 },
      stroke: color,
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0).setScale(0.3);

    this.tweens.add({
      targets: scoreBadge,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 500, delay: 700, ease: "Back.easeOut",
    });

    // New squishies badge
    const newOnes = received.filter(s => !this.state.collection.includes(s.id) || true);
    if (newOnes.some(s => ["epic","legendary","ultrarare"].includes(s.rarity))) {
      const rareBadge = this.add.text(VW / 2, 490, "✨ RARE FIND! ✨", {
        fontFamily: "Fraunces, serif",
        fontSize: "20px",
        color: "#a855f7",
        backgroundColor: "#f5f3ff",
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: rareBadge,
        alpha: 1,
        duration: 400, delay: 1100,
        yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      });
    }

    // Buttons
    const nextBtn = this.add.text(VW / 2 - 80, VH - 80, "  🔄 Trade Again  ", {
      fontFamily: "Manrope, sans-serif", fontSize: "16px", fontStyle: "bold",
      color: "#ffffff", backgroundColor: "#ec4899", padding: { x: 14, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    nextBtn.on("pointerover", () => nextBtn.setBackgroundColor("#db2777"));
    nextBtn.on("pointerout",  () => nextBtn.setBackgroundColor("#ec4899"));
    nextBtn.on("pointerdown", () => {
      this.state.yourSquishy = getStartingSquishy(this.state.collection);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("Trade", this.state));
    });

    const colBtn = this.add.text(VW / 2 + 80, VH - 80, "  📦 Collection  ", {
      fontFamily: "Manrope, sans-serif", fontSize: "16px",
      color: "#7c3aed", backgroundColor: "#ede9fe", padding: { x: 14, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    colBtn.on("pointerover", () => colBtn.setBackgroundColor("#ddd6fe"));
    colBtn.on("pointerout",  () => colBtn.setBackgroundColor("#ede9fe"));
    colBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("Collection", this.state));
    });

    this.cameras.main.fadeIn(400);
  }

  private spawnConfetti(): void {
    const colors = ["#f472b6","#a855f7","#60a5fa","#4ade80","#fbbf24","#f87171"];
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * VW;
      const conf = this.add.rectangle(x, -20, 8, 8, parseInt(colors[i % colors.length]!.slice(1), 16));
      this.tweens.add({
        targets: conf,
        y: VH + 20,
        x: x + (Math.random() - 0.5) * 100,
        angle: Math.random() * 360,
        duration: 1500 + Math.random() * 1500,
        delay: Math.random() * 1000,
        ease: "Quad.easeIn",
        onComplete: () => conf.destroy(),
      });
    }
  }

  private spawnCardSparkles(x: number, y: number): void {
    const glyphs = ["✦", "✧", "⋆", "★", "✨"];
    for (let i = 0; i < 6; i++) {
      const sx = x + (Math.random() - 0.5) * 80;
      const sy = y + (Math.random() - 0.5) * 60;
      const star = this.add.text(sx, sy, pick(glyphs), {
        fontSize: "12px", color: "#f9a8d4", alpha: 0,
      });
      this.tweens.add({
        targets: star,
        alpha: { from: 0, to: 1 },
        y: sy - 25,
        duration: 700 + Math.random() * 500,
        delay: Math.random() * 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }
}

// ─── COLLECTION SCENE ────────────────────────────────────────────────────────
class CollectionScene extends Phaser.Scene {
  private state!: GameState;
  private scrollY = 0;
  private contentHeight = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private isDragging = false;
  private dragStartY = 0;
  private scrollStartY = 0;

  constructor() { super("Collection"); }

  init(data: object): void {
    this.state = data as GameState;
    this.scrollY = 0;
  }

  create(): void {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfdf4ff, 0xfdf4ff, 0xfce7f3, 0xfce7f3, 1);
    bg.fillRect(0, 0, VW, VH);

    // Header (fixed)
    this.add.text(VW / 2, 30, "📦 My Collection", {
      fontFamily: "Fraunces, serif", fontSize: "28px", color: "#be185d",
    }).setOrigin(0.5);

    const count = this.state.collection.length;
    this.add.text(VW / 2, 62, `${count} / ${SQUISHIES.length} squishies collected`, {
      fontFamily: "Manrope, sans-serif", fontSize: "14px", color: "#9d174d",
    }).setOrigin(0.5);

    // Scrollable content
    this.contentContainer = this.add.container(0, 90);
    this.buildGrid();

    // Back button (fixed)
    const backBtn = this.add.text(VW / 2, VH - 36, "  ← Back  ", {
      fontFamily: "Manrope, sans-serif", fontSize: "16px", fontStyle: "bold",
      color: "#ffffff", backgroundColor: "#ec4899", padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

    backBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("Menu", this.state));
    });

    // Scroll input
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartY = p.y;
      this.scrollStartY = this.scrollY;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const delta = p.y - this.dragStartY;
      this.scrollY = Phaser.Math.Clamp(
        this.scrollStartY + delta,
        -(this.contentHeight - (VH - 140)),
        0
      );
      this.contentContainer.y = 90 + this.scrollY;
    });
    this.input.on("pointerup", () => { this.isDragging = false; });

    this.cameras.main.fadeIn(350);
  }

  private buildGrid(): void {
    const cols = 3;
    const cardW = 130;
    const cardH = 110;
    const padX = (VW - cols * cardW) / (cols + 1);
    const padY = 12;

    SQUISHIES.forEach((sq, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = padX + col * (cardW + padX) + cardW / 2;
      const y = row * (cardH + padY) + cardH / 2;

      const owned = this.state.collection.includes(sq.id);
      const rarColor = owned ? RARITY_COLORS[sq.rarity] : 0xcccccc;

      const card = this.add.rectangle(x, y, cardW, cardH, owned ? 0xffffff : 0xf3f4f6, 0.95)
        .setStrokeStyle(2, rarColor);
      this.contentContainer.add(card);

      if (owned) {
        const emojiTxt = this.add.text(x, y - 20, sq.emoji, { fontSize: "28px" }).setOrigin(0.5);
        const nameTxt = this.add.text(x, y + 14, sq.name, {
          fontFamily: "Manrope, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#1e1b4b",
        }).setOrigin(0.5);
        const rarTxt = this.add.text(x, y + 28, RARITY_LABELS[sq.rarity], {
          fontFamily: "Manrope, sans-serif", fontSize: "9px",
          color: "#" + rarColor.toString(16).padStart(6, "0"),
        }).setOrigin(0.5);
        this.contentContainer.add([emojiTxt, nameTxt, rarTxt]);

        // Bounce for rare+
        if (["epic","legendary","ultrarare"].includes(sq.rarity)) {
          this.tweens.add({
            targets: [card, emojiTxt],
            scaleX: 1.05, scaleY: 1.05,
            duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
            delay: idx * 80,
          });
        }
      } else {
        // Silhouette / locked
        const lock = this.add.text(x, y - 10, "🔒", { fontSize: "28px" }).setOrigin(0.5);
        const unk = this.add.text(x, y + 20, "???", {
          fontFamily: "Manrope, sans-serif", fontSize: "12px", color: "#9ca3af",
        }).setOrigin(0.5);
        this.contentContainer.add([lock, unk]);
      }
    });

    const rows = Math.ceil(SQUISHIES.length / cols);
    this.contentHeight = rows * (cardH + padY) + 20;
  }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────
export function startGame(parent: HTMLElement, onScore: (n: number) => void): () => void {
  const collection = getInitialCollection();
  const yourSquishy = getStartingSquishy(collection);

  const state: GameState = { onScore, collection, yourSquishy };

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
    scene: [MenuScene, TradeScene, ResultScene, CollectionScene],
    banner: false,
  });

  // Pass state via scene.start data
  game.events.once("ready", () => {
    game.scene.start("Menu", state);
  });

  return () => game.destroy(true);
}

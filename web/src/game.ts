import Phaser from "phaser";

const VW = 480;
const VH = 720;

// ─── Data ────────────────────────────────────────────────────────────────────

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "ultra";

interface Squishy {
  id: string;
  emoji: string;
  name: string;
  rarity: Rarity;
  value: number;
}

const SQUISHIES: Squishy[] = [
  // Common
  { id: "strawberry", emoji: "🍓", name: "Strawberry",  rarity: "common",    value: 10 },
  { id: "donut",      emoji: "🍩", name: "Donut",       rarity: "common",    value: 10 },
  { id: "cloud",      emoji: "☁️",  name: "Cloud",       rarity: "common",    value: 12 },
  { id: "star",       emoji: "⭐",  name: "Star",        rarity: "common",    value: 11 },
  { id: "mushroom",   emoji: "🍄", name: "Mushroom",    rarity: "common",    value: 13 },
  // Uncommon
  { id: "cat",        emoji: "🐱", name: "Cat",         rarity: "uncommon",  value: 25 },
  { id: "bunny",      emoji: "🐰", name: "Bunny",       rarity: "uncommon",  value: 27 },
  { id: "bear",       emoji: "🐻", name: "Bear",        rarity: "uncommon",  value: 26 },
  { id: "frog",       emoji: "🐸", name: "Frog",        rarity: "uncommon",  value: 24 },
  { id: "penguin",    emoji: "🐧", name: "Penguin",     rarity: "uncommon",  value: 28 },
  // Rare
  { id: "unicorn",    emoji: "🦄", name: "Unicorn",     rarity: "rare",      value: 55 },
  { id: "dragon",     emoji: "🐉", name: "Dragon",      rarity: "rare",      value: 60 },
  { id: "mermaid",    emoji: "🧜", name: "Mermaid",     rarity: "rare",      value: 58 },
  { id: "phoenix",    emoji: "🦅", name: "Phoenix",     rarity: "rare",      value: 62 },
  // Epic
  { id: "rainbow",    emoji: "🌈", name: "Rainbow",     rarity: "epic",      value: 110 },
  { id: "galaxy",     emoji: "🌌", name: "Galaxy",      rarity: "epic",      value: 120 },
  { id: "crystal",    emoji: "💎", name: "Crystal",     rarity: "epic",      value: 115 },
  // Legendary
  { id: "crown",      emoji: "👑", name: "Crown",       rarity: "legendary", value: 220 },
  { id: "comet",      emoji: "☄️",  name: "Comet",       rarity: "legendary", value: 240 },
  // Ultra Rare
  { id: "magic",      emoji: "✨", name: "Magic Spark", rarity: "ultra",     value: 500 },
  { id: "angel",      emoji: "😇", name: "Angel",       rarity: "ultra",     value: 480 },
];

const RARITY_COLORS: Record<Rarity, number> = {
  common:    0xa3a3a3,
  uncommon:  0x4ade80,
  rare:      0x60a5fa,
  epic:      0xa855f7,
  legendary: 0xfbbf24,
  ultra:     0xf43f5e,
};

const RARITY_LABELS: Record<Rarity, string> = {
  common:    "Common",
  uncommon:  "Uncommon",
  rare:      "Rare",
  epic:      "Epic",
  legendary: "Legendary",
  ultra:     "✨ Ultra Rare",
};

const BG_COLOR = 0xfdf4ff;
const ACCENT = 0xd946ef;

interface Trader {
  name: string;
  avatar: string;
  personality: "generous" | "fair" | "stingy";
  speechAdd: string;
  speechDeal: string;
  speechReject: string;
}

const TRADERS: Trader[] = [
  { name: "Mochi",  avatar: "🐱", personality: "generous", speechAdd: "Sure! Here's more! 🎀", speechDeal: "Deal? Pleaseee! 🥺",    speechReject: "Aww okay... bye! 😿" },
  { name: "Boba",   avatar: "🐰", personality: "fair",     speechAdd: "Hmm, okay! One more~",   speechDeal: "Wanna trade? 💕",       speechReject: "Fine! Your loss! 😤" },
  { name: "Coco",   avatar: "🐸", personality: "stingy",   speechAdd: "Ugh... fine! 😒",        speechDeal: "Take it or leave it!",  speechReject: "Whatever! 🙄" },
  { name: "Lumi",   avatar: "🦄", personality: "generous", speechAdd: "I'll add something! ✨",  speechDeal: "Best deal ever! 🌟",    speechReject: "Okay, next time! 🌸" },
  { name: "Starr",  avatar: "⭐", personality: "fair",     speechAdd: "One more! Just for you", speechDeal: "Let's trade! 🤝",       speechReject: "Alright, moving on!" },
  { name: "Dreamy", avatar: "🌙", personality: "stingy",   speechAdd: "...okay, one more. 😑",  speechDeal: "This is my best offer", speechReject: "Good riddance! 😤"  },
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function weightedRandom(): Squishy {
  const weights: Record<Rarity, number> = {
    common: 40, uncommon: 28, rare: 18, epic: 9, legendary: 4, ultra: 1,
  };
  const pool: Squishy[] = [];
  for (const s of SQUISHIES) {
    const w = weights[s.rarity];
    for (let i = 0; i < w; i++) pool.push(s);
  }
  return rand(pool);
}

function totalValue(squishies: Squishy[]): number {
  return squishies.reduce((s, q) => s + q.value, 0);
}

function tradeScore(gave: Squishy, received: Squishy[]): number {
  const ratio = totalValue(received) / gave.value;
  return Math.round(Math.min(100, Math.max(0, ratio * 50)));
}

function tradeRating(score: number): { label: string; emoji: string; color: string } {
  if (score >= 90) return { label: "AMAZING TRADE!", emoji: "🔥", color: "#ef4444" };
  if (score >= 70) return { label: "GREAT TRADE!",   emoji: "💖", color: "#ec4899" };
  if (score >= 50) return { label: "FAIR TRADE",     emoji: "😊", color: "#22c55e" };
  if (score >= 30) return { label: "NOT THE BEST",   emoji: "😬", color: "#f59e0b" };
  return                  { label: "TERRIBLE TRADE!",emoji: "💀", color: "#6b7280" };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadCollection(): Set<string> {
  try {
    const raw = localStorage.getItem("squishyswap_collection");
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set<string>();
}

function saveCollection(col: Set<string>): void {
  localStorage.setItem("squishyswap_collection", JSON.stringify([...col]));
}

function loadInventory(): Squishy[] {
  try {
    const raw = localStorage.getItem("squishyswap_inventory");
    if (raw) {
      const ids = JSON.parse(raw) as string[];
      const result: Squishy[] = [];
      for (const id of ids) {
        const s = SQUISHIES.find(q => q.id === id);
        if (s) result.push(s);
      }
      if (result.length > 0) return result;
    }
  } catch { /* ignore */ }
  return [
    SQUISHIES.find(q => q.id === "strawberry")!,
    SQUISHIES.find(q => q.id === "donut")!,
    SQUISHIES.find(q => q.id === "cloud")!,
  ];
}

function saveInventory(inv: Squishy[]): void {
  localStorage.setItem("squishyswap_inventory", JSON.stringify(inv.map(s => s.id)));
}

// ─── Shared state ─────────────────────────────────────────────────────────────

interface SharedState {
  onScore: (n: number) => void;
  inventory: Squishy[];
  collection: Set<string>;
  tradesCompleted: number;
}

// ─── MenuScene ────────────────────────────────────────────────────────────────

class MenuScene extends Phaser.Scene {
  private shared!: SharedState;

  constructor() { super("menu"); }

  init(data: object): void {
    this.shared = data as SharedState;
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, BG_COLOR);
    this.spawnSparkles();

    // Title
    this.add.text(W / 2, 100, "✨", { fontSize: "52px" }).setOrigin(0.5);
    this.add.text(W / 2, 160, "Squishy Swap!", {
      fontFamily: "Fraunces, serif",
      fontSize: "38px",
      color: "#7c3aed",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(W / 2, 205, "Collect & Trade Cute Squishies", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "15px",
      color: "#9333ea",
    }).setOrigin(0.5);

    const inv = this.shared.inventory;
    const col = this.shared.collection;
    this.add.text(W / 2, 248, `🎒 ${inv.length} squishies  •  📦 ${col.size}/${SQUISHIES.length} collected`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#a855f7",
    }).setOrigin(0.5);

    // Inventory preview
    const previewY = 318;
    const shown = inv.slice(0, 5);
    const spacing = Math.min(60, (W - 80) / Math.max(shown.length, 1));
    const startX = W / 2 - (spacing * (shown.length - 1)) / 2;
    shown.forEach((sq, i) => {
      const x = startX + i * spacing;
      const bg = this.add.circle(x, previewY, 28, RARITY_COLORS[sq.rarity], 0.2);
      this.add.circle(x, previewY, 26, 0xffffff);
      this.add.text(x, previewY, sq.emoji, { fontSize: "26px" }).setOrigin(0.5);
      this.tweens.add({
        targets: bg,
        scaleX: 1.1, scaleY: 1.1,
        duration: 900 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    // Buttons
    this.makeRoundBtn(W / 2, 420, "🤝  START TRADING", 0x7c3aed, () => {
      this.cameras.main.fadeOut(200, 253, 244, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade", this.shared));
    });

    this.makeRoundBtn(W / 2, 496, "🎀  MY COLLECTION", 0xec4899, () => {
      this.cameras.main.fadeOut(200, 253, 244, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("collection", this.shared));
    });

    this.cameras.main.fadeIn(300, 253, 244, 255);
  }

  private makeRoundBtn(x: number, y: number, label: string, color: number, cb: () => void): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(x - 130, y - 26, 260, 52, 26);
    const txt = this.add.text(x, y, label, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
    const hit = this.add.rectangle(x, y, 260, 52, 0xffffff, 0).setInteractive({ useHandCursor: true });
    hit.on("pointerdown", cb);
    hit.on("pointerover", () => this.tweens.add({ targets: [gfx, txt], scaleX: 1.05, scaleY: 1.05, duration: 80 }));
    hit.on("pointerout",  () => this.tweens.add({ targets: [gfx, txt], scaleX: 1,    scaleY: 1,    duration: 80 }));
  }

  private spawnSparkles(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const emojis = ["✨", "⭐", "💫", "🌟", "💕"];
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(20, W - 20);
      const y = Phaser.Math.Between(20, H - 20);
      const t = this.add.text(x, y, rand(emojis), {
        fontSize: `${Phaser.Math.Between(10, 22)}px`,
        alpha: 0,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: t,
        alpha: { from: 0, to: 0.6 },
        y: y - Phaser.Math.Between(20, 50),
        duration: Phaser.Math.Between(1500, 3000),
        delay: Phaser.Math.Between(0, 2000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }
}

// ─── TradeScene ───────────────────────────────────────────────────────────────

class TradeScene extends Phaser.Scene {
  private shared!: SharedState;
  private mySquishyIndex = 0;
  private trader!: Trader;
  private traderIndex = 0;
  private offer: Squishy[] = [];
  private speechText!: Phaser.GameObjects.Text;
  private offerContainer!: Phaser.GameObjects.Container;
  private addCount = 0;
  private readonly MAX_OFFER = 4;

  constructor() { super("trade"); }

  init(data: object): void {
    this.shared = data as SharedState;
  }

  create(): void {
    const W = this.scale.width;

    this.add.rectangle(W / 2, this.scale.height / 2, W, this.scale.height, BG_COLOR);

    const inv = this.shared.inventory;
    if (inv.length === 0) {
      inv.push(weightedRandom());
      saveInventory(inv);
    }
    this.mySquishyIndex = Math.floor(Math.random() * inv.length);
    this.traderIndex = Math.floor(Math.random() * TRADERS.length);
    this.trader = TRADERS[this.traderIndex]!;
    this.addCount = 0;
    this.offer = this.buildOffer(1);

    this.buildUI();
    this.cameras.main.fadeIn(300, 253, 244, 255);
  }

  private buildOffer(count: number): Squishy[] {
    const myVal = this.shared.inventory[this.mySquishyIndex]?.value ?? 10;
    const result: Squishy[] = [];
    for (let i = 0; i < count; i++) {
      let s = weightedRandom();
      for (let attempt = 0; attempt < 8; attempt++) {
        if (result.some(r => r.id === s.id)) {
          s = weightedRandom();
        } else {
          break;
        }
      }
      // Bias by personality
      if (this.trader.personality === "generous" && s.value < myVal * 0.4) s = weightedRandom();
      if (this.trader.personality === "stingy"   && s.value > myVal * 1.2) s = weightedRandom();
      result.push(s);
    }
    return result;
  }

  private buildUI(): void {
    const W = this.scale.width;
    const inv = this.shared.inventory;
    const mySquishy = inv[this.mySquishyIndex] ?? inv[0]!;
    const halfW = (W - 40) / 2;

    // Header
    this.add.text(W / 2, 28, "🤝 TRADE TIME!", {
      fontFamily: "Fraunces, serif",
      fontSize: "24px",
      color: "#7c3aed",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // My squishy panel
    const myGfx = this.add.graphics();
    myGfx.fillStyle(0xffffff, 1);
    myGfx.fillRoundedRect(16, 55, halfW, 140, 16);
    myGfx.lineStyle(2, RARITY_COLORS[mySquishy.rarity], 1);
    myGfx.strokeRoundedRect(16, 55, halfW, 140, 16);

    this.add.text(16 + halfW / 2, 72, "YOUR SQUISHY", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#9ca3af",
    }).setOrigin(0.5);

    const myEmoji = this.add.text(16 + halfW / 2, 118, mySquishy.emoji, { fontSize: "44px" }).setOrigin(0.5);
    this.tweens.add({ targets: myEmoji, scaleX: 1.08, scaleY: 1.08, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.add.text(16 + halfW / 2, 158, mySquishy.name, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#374151",
    }).setOrigin(0.5);
    this.add.text(16 + halfW / 2, 176, RARITY_LABELS[mySquishy.rarity], {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      color: `#${RARITY_COLORS[mySquishy.rarity].toString(16).padStart(6, "0")}`,
    }).setOrigin(0.5);

    // Trader panel
    const tGfx = this.add.graphics();
    tGfx.fillStyle(0xffffff, 1);
    tGfx.fillRoundedRect(W / 2 + 4, 55, halfW, 140, 16);

    this.add.text(W / 2 + 4 + halfW / 2, 72, "TRADER", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#9ca3af",
    }).setOrigin(0.5);

    const avatar = this.add.text(W / 2 + 4 + halfW / 2, 118, this.trader.avatar, { fontSize: "44px" }).setOrigin(0.5);
    this.tweens.add({ targets: avatar, y: 112, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.add.text(W / 2 + 4 + halfW / 2, 158, this.trader.name, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#374151",
    }).setOrigin(0.5);

    // Speech bubble
    const bubbleGfx = this.add.graphics();
    bubbleGfx.fillStyle(0xf3e8ff, 1);
    bubbleGfx.fillRoundedRect(20, 210, W - 40, 44, 12);
    this.speechText = this.add.text(W / 2, 232, this.trader.speechDeal, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      color: "#7c3aed",
    }).setOrigin(0.5);

    // Offer label
    this.add.text(W / 2, 272, `${this.trader.name.toUpperCase()} OFFERS`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#9ca3af",
    }).setOrigin(0.5);

    // Offer items
    this.offerContainer = this.add.container(W / 2, 360);
    this.renderOffer();

    // Action buttons
    this.buildButtons();
  }

  private renderOffer(): void {
    this.offerContainer.removeAll(true);
    const W = this.scale.width;
    const n = this.offer.length;
    const spacing = Math.min(80, (W - 60) / Math.max(n, 1));
    const startX = -(spacing * (n - 1)) / 2;

    this.offer.forEach((sq, i) => {
      const x = startX + i * spacing;
      const gfx = this.add.graphics();
      gfx.fillStyle(RARITY_COLORS[sq.rarity], 0.15);
      gfx.fillCircle(x, 0, 32);
      gfx.lineStyle(2, RARITY_COLORS[sq.rarity], 0.8);
      gfx.strokeCircle(x, 0, 32);

      const emojiT = this.add.text(x, 0, sq.emoji, { fontSize: "30px" }).setOrigin(0.5);
      const nameT = this.add.text(x, 40, sq.name, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#374151",
      }).setOrigin(0.5);
      const rarT = this.add.text(x, 54, RARITY_LABELS[sq.rarity], {
        fontFamily: "Manrope, sans-serif",
        fontSize: "9px",
        color: `#${RARITY_COLORS[sq.rarity].toString(16).padStart(6, "0")}`,
      }).setOrigin(0.5);

      this.offerContainer.add([gfx, emojiT, nameT, rarT]);

      this.tweens.add({
        targets: emojiT,
        scaleX: 1.12, scaleY: 1.12,
        duration: 700 + i * 100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      if (sq.rarity === "epic" || sq.rarity === "legendary" || sq.rarity === "ultra") {
        this.time.addEvent({
          delay: 500 + i * 200,
          loop: true,
          callback: () => {
            if (!this.offerContainer?.active) return;
            const sx = x + Phaser.Math.Between(-28, 28);
            const sy = Phaser.Math.Between(-30, 30);
            const sp = this.add.text(sx, sy, "✨", { fontSize: "10px", alpha: 0 }).setOrigin(0.5);
            this.offerContainer.add(sp);
            this.tweens.add({
              targets: sp,
              alpha: { from: 0, to: 1 },
              y: sy - 18,
              duration: 550,
              yoyo: true,
              onComplete: () => sp.destroy(),
            });
          },
        });
      }
    });
  }

  private buildButtons(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const btnY = H - 72;

    const buttons = [
      { label: "✅", sub: "ACCEPT",   x: W / 2 - 120, color: 0x22c55e, action: "accept" },
      { label: "➕", sub: "ADD MORE", x: W / 2,        color: 0x7c3aed, action: "add"    },
      { label: "❌", sub: "SKIP",     x: W / 2 + 120,  color: 0xef4444, action: "reject" },
    ];

    for (const bd of buttons) {
      const gfx = this.add.graphics();
      gfx.fillStyle(bd.color, 1);
      gfx.fillCircle(bd.x, btnY, 34);

      const lbl = this.add.text(bd.x, btnY - 4, bd.label, { fontSize: "26px" }).setOrigin(0.5);
      this.add.text(bd.x, btnY + 42, bd.sub, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#6b7280",
      }).setOrigin(0.5);

      const hit = this.add.circle(bd.x, btnY, 38, 0xffffff, 0).setInteractive({ useHandCursor: true });
      const action = bd.action;
      hit.on("pointerdown", () => this.handleAction(action));
      hit.on("pointerover", () => this.tweens.add({ targets: [gfx, lbl], scaleX: 1.12, scaleY: 1.12, duration: 80 }));
      hit.on("pointerout",  () => this.tweens.add({ targets: [gfx, lbl], scaleX: 1,    scaleY: 1,    duration: 80 }));
    }
  }

  private setSpeech(text: string): void {
    this.speechText.setText(text);
    this.tweens.add({
      targets: this.speechText,
      scaleX: { from: 1.15, to: 1 },
      scaleY: { from: 1.15, to: 1 },
      duration: 220,
      ease: "Back.easeOut",
    });
  }

  private handleAction(action: string): void {
    if (action === "accept") {
      this.doTrade();
    } else if (action === "add") {
      if (this.addCount >= this.MAX_OFFER - 1) {
        this.setSpeech("That's all I have! 😅");
        return;
      }
      this.addCount++;
      this.offer.push(...this.buildOffer(1));
      this.setSpeech(this.trader.speechAdd);
      this.renderOffer();
      this.tweens.add({
        targets: this.offerContainer,
        scaleX: { from: 0.85, to: 1 },
        scaleY: { from: 0.85, to: 1 },
        duration: 300,
        ease: "Back.easeOut",
      });
    } else {
      // reject
      this.setSpeech(this.trader.speechReject);
      this.cameras.main.shake(180, 0.005);
      this.time.delayedCall(650, () => {
        this.cameras.main.fadeOut(200, 253, 244, 255);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.restart();
        });
      });
    }
  }

  private doTrade(): void {
    const inv = this.shared.inventory;
    const mySquishy = inv[this.mySquishyIndex] ?? inv[0]!;
    const received = [...this.offer];

    inv.splice(this.mySquishyIndex, 1);
    inv.push(...received);
    saveInventory(inv);

    for (const s of received) this.shared.collection.add(s.id);
    this.shared.collection.add(mySquishy.id);
    saveCollection(this.shared.collection);

    this.shared.tradesCompleted++;
    this.shared.onScore(this.shared.tradesCompleted);

    this.spawnCelebration();

    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(300, 253, 244, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        const resultData: ResultData = {
          onScore: this.shared.onScore,
          inventory: this.shared.inventory,
          collection: this.shared.collection,
          tradesCompleted: this.shared.tradesCompleted,
          gave: mySquishy,
          received,
        };
        this.scene.start("result", resultData);
      });
    });
  }

  private spawnCelebration(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const emojis = ["🎉", "✨", "💕", "🌟", "🎀", "💫"];
    for (let i = 0; i < 16; i++) {
      const t = this.add.text(
        Phaser.Math.Between(20, W - 20),
        Phaser.Math.Between(H / 2 - 80, H / 2 + 80),
        rand(emojis),
        { fontSize: `${Phaser.Math.Between(16, 32)}px`, alpha: 0 }
      ).setOrigin(0.5);
      this.tweens.add({
        targets: t,
        alpha: { from: 0, to: 1 },
        y: t.y - Phaser.Math.Between(60, 120),
        duration: Phaser.Math.Between(400, 700),
        delay: i * 40,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
        },
      });
    }
  }
}

// ─── ResultScene ──────────────────────────────────────────────────────────────

interface ResultData extends SharedState {
  gave: Squishy;
  received: Squishy[];
}

class ResultScene extends Phaser.Scene {
  private resultData!: ResultData;

  constructor() { super("result"); }

  init(data: object): void {
    this.resultData = data as ResultData;
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const { gave, received } = this.resultData;

    this.add.rectangle(W / 2, H / 2, W, H, BG_COLOR);

    const score = tradeScore(gave, received);
    const rating = tradeRating(score);

    this.add.text(W / 2, 52, "🎉 TRADE COMPLETE! 🎉", {
      fontFamily: "Fraunces, serif",
      fontSize: "24px",
      color: "#7c3aed",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Score circle
    const cGfx = this.add.graphics();
    cGfx.fillStyle(0xffffff, 1);
    cGfx.fillCircle(W / 2, 140, 52);
    cGfx.lineStyle(4, ACCENT, 1);
    cGfx.strokeCircle(W / 2, 140, 52);

    this.add.text(W / 2, 132, `${score}`, {
      fontFamily: "Fraunces, serif",
      fontSize: "32px",
      fontStyle: "bold",
      color: rating.color,
    }).setOrigin(0.5);
    this.add.text(W / 2, 156, "/100", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#9ca3af",
    }).setOrigin(0.5);

    this.add.text(W / 2, 210, `${rating.emoji} ${rating.label}`, {
      fontFamily: "Fraunces, serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: rating.color,
    }).setOrigin(0.5);

    // You gave
    const gGfx = this.add.graphics();
    gGfx.fillStyle(0xfee2e2, 1);
    gGfx.fillRoundedRect(20, 238, W - 40, 78, 14);
    this.add.text(W / 2, 255, "You Gave", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#9ca3af",
    }).setOrigin(0.5);
    this.add.text(W / 2, 282, `${gave.emoji}  ${gave.name}`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#374151",
    }).setOrigin(0.5);
    this.add.text(W / 2, 304, RARITY_LABELS[gave.rarity], {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      color: `#${RARITY_COLORS[gave.rarity].toString(16).padStart(6, "0")}`,
    }).setOrigin(0.5);

    // You received
    const rGfx = this.add.graphics();
    rGfx.fillStyle(0xf0fdf4, 1);
    rGfx.fillRoundedRect(20, 330, W - 40, 155, 14);
    this.add.text(W / 2, 348, "You Received", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#9ca3af",
    }).setOrigin(0.5);

    const n = received.length;
    const spacing = Math.min(72, (W - 60) / Math.max(n, 1));
    const startX = W / 2 - (spacing * (n - 1)) / 2;
    received.forEach((sq, i) => {
      const x = startX + i * spacing;
      const emojiT = this.add.text(x, 388, sq.emoji, { fontSize: "28px" }).setOrigin(0.5);
      this.add.text(x, 418, sq.name, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "9px",
        fontStyle: "bold",
        color: "#374151",
      }).setOrigin(0.5);
      this.add.text(x, 430, RARITY_LABELS[sq.rarity], {
        fontFamily: "Manrope, sans-serif",
        fontSize: "8px",
        color: `#${RARITY_COLORS[sq.rarity].toString(16).padStart(6, "0")}`,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: emojiT,
        scaleX: { from: 0, to: 1 },
        scaleY: { from: 0, to: 1 },
        duration: 400,
        delay: i * 120,
        ease: "Back.easeOut",
      });
    });

    // Buttons
    this.makeBtn(W / 2 - 82, H - 90, "🤝 Trade Again", 0x7c3aed, () => {
      this.cameras.main.fadeOut(200, 253, 244, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade", this.resultData));
    });
    this.makeBtn(W / 2 + 82, H - 90, "🏠 Menu", 0xec4899, () => {
      this.cameras.main.fadeOut(200, 253, 244, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu", this.resultData));
    });

    this.spawnConfetti();
    this.cameras.main.fadeIn(300, 253, 244, 255);
  }

  private makeBtn(x: number, y: number, label: string, color: number, cb: () => void): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(x - 72, y - 22, 144, 44, 22);
    const txt = this.add.text(x, y, label, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
    const hit = this.add.rectangle(x, y, 144, 44, 0xffffff, 0).setInteractive({ useHandCursor: true });
    hit.on("pointerdown", cb);
    hit.on("pointerover", () => this.tweens.add({ targets: [gfx, txt], scaleX: 1.06, scaleY: 1.06, duration: 80 }));
    hit.on("pointerout",  () => this.tweens.add({ targets: [gfx, txt], scaleX: 1,    scaleY: 1,    duration: 80 }));
  }

  private spawnConfetti(): void {
    const W = this.scale.width;
    const colors = [0xef4444, 0xfbbf24, 0x22c55e, 0x3b82f6, 0xa855f7, 0xec4899];
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(0, W);
      const color = colors[i % colors.length]!;
      const rect = this.add.rectangle(x, -10, 8, 8, color);
      this.tweens.add({
        targets: rect,
        y: 820,
        x: x + Phaser.Math.Between(-60, 60),
        angle: Phaser.Math.Between(0, 360),
        duration: Phaser.Math.Between(1200, 2400),
        delay: i * 60,
        ease: "Linear",
        onComplete: () => rect.destroy(),
      });
    }
  }
}

// ─── CollectionScene ──────────────────────────────────────────────────────────

class CollectionScene extends Phaser.Scene {
  private shared!: SharedState;

  constructor() { super("collection"); }

  init(data: object): void {
    this.shared = data as SharedState;
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const col = this.shared.collection;

    this.add.rectangle(W / 2, H / 2, W, H, BG_COLOR);

    this.add.text(W / 2, 30, "🎀 My Collection", {
      fontFamily: "Fraunces, serif",
      fontSize: "26px",
      color: "#7c3aed",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(W / 2, 60, `${col.size} / ${SQUISHIES.length} discovered`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#a855f7",
    }).setOrigin(0.5);

    // Grid
    const cols = 4;
    const cellW = (W - 40) / cols;
    const cellH = 88;
    const startX = 20 + cellW / 2;
    const startY = 88;

    SQUISHIES.forEach((sq, i) => {
      const col2 = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col2 * cellW;
      const y = startY + row * cellH;
      const discovered = col.has(sq.id);

      const bg = this.add.graphics();
      if (discovered) {
        bg.fillStyle(RARITY_COLORS[sq.rarity], 0.12);
        bg.fillRoundedRect(x - cellW / 2 + 3, y - 34, cellW - 6, 78, 12);
        bg.lineStyle(1.5, RARITY_COLORS[sq.rarity], 0.6);
        bg.strokeRoundedRect(x - cellW / 2 + 3, y - 34, cellW - 6, 78, 12);

        const emojiT = this.add.text(x, y - 4, sq.emoji, { fontSize: "26px" }).setOrigin(0.5);
        this.tweens.add({
          targets: emojiT,
          scaleX: 1.08, scaleY: 1.08,
          duration: 900 + i * 60,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        this.add.text(x, y + 24, sq.name, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "9px",
          fontStyle: "bold",
          color: "#374151",
        }).setOrigin(0.5);
        this.add.text(x, y + 36, RARITY_LABELS[sq.rarity], {
          fontFamily: "Manrope, sans-serif",
          fontSize: "8px",
          color: `#${RARITY_COLORS[sq.rarity].toString(16).padStart(6, "0")}`,
        }).setOrigin(0.5);
      } else {
        bg.fillStyle(0xe5e7eb, 0.6);
        bg.fillRoundedRect(x - cellW / 2 + 3, y - 34, cellW - 6, 78, 12);
        this.add.text(x, y, "❓", { fontSize: "28px", alpha: 0.4 }).setOrigin(0.5);
        this.add.text(x, y + 30, "???", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "10px",
          color: "#9ca3af",
        }).setOrigin(0.5);
      }
    });

    // Back button
    const backGfx = this.add.graphics();
    backGfx.fillStyle(0x7c3aed, 1);
    backGfx.fillRoundedRect(W / 2 - 80, H - 62, 160, 44, 22);
    const backTxt = this.add.text(W / 2, H - 40, "← Back to Menu", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
    const hit = this.add.rectangle(W / 2, H - 40, 160, 44, 0xffffff, 0).setInteractive({ useHandCursor: true });
    hit.on("pointerdown", () => {
      this.cameras.main.fadeOut(200, 253, 244, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu", this.shared));
    });
    hit.on("pointerover", () => this.tweens.add({ targets: [backGfx, backTxt], scaleX: 1.05, scaleY: 1.05, duration: 80 }));
    hit.on("pointerout",  () => this.tweens.add({ targets: [backGfx, backTxt], scaleX: 1,    scaleY: 1,    duration: 80 }));

    this.cameras.main.fadeIn(300, 253, 244, 255);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function startGame(parent: HTMLElement, onScore: (n: number) => void): () => void {
  const inventory = loadInventory();
  const collection = loadCollection();

  for (const s of inventory) collection.add(s.id);
  saveCollection(collection);

  const shared: SharedState = { onScore, inventory, collection, tradesCompleted: 0 };

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VW,
    height: VH,
    backgroundColor: "#fdf4ff",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [MenuScene, TradeScene, ResultScene, CollectionScene],
    banner: false,
  });

  game.events.once("ready", () => {
    game.scene.start("menu", shared);
  });

  return () => game.destroy(true);
}

import Phaser from "phaser";

const VW = 420;
const VH = 700;

// ─── Data ───────────────────────────────────────────────────────────────────

type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Ultra Rare";

interface Squishy {
  id: string;
  emoji: string;
  name: string;
  rarity: Rarity;
  value: number; // 1–100 for trade scoring
}

interface ComputerPlayer {
  name: string;
  emoji: string;
  personality: "generous" | "fair" | "stingy";
  color: number;
}

const SQUISHIES: Squishy[] = [
  { id: "strawberry",  emoji: "🍓", name: "Strawberry",   rarity: "Common",     value: 10 },
  { id: "donut",       emoji: "🍩", name: "Donut",        rarity: "Common",     value: 12 },
  { id: "star",        emoji: "⭐", name: "Star",         rarity: "Common",     value: 8  },
  { id: "cloud",       emoji: "☁️", name: "Cloud",        rarity: "Common",     value: 9  },
  { id: "lemon",       emoji: "🍋", name: "Lemon",        rarity: "Common",     value: 11 },
  { id: "cat",         emoji: "🐱", name: "Cat",          rarity: "Uncommon",   value: 22 },
  { id: "bunny",       emoji: "🐰", name: "Bunny",        rarity: "Uncommon",   value: 25 },
  { id: "bear",        emoji: "🐻", name: "Bear",         rarity: "Uncommon",   value: 20 },
  { id: "penguin",     emoji: "🐧", name: "Penguin",      rarity: "Uncommon",   value: 24 },
  { id: "frog",        emoji: "🐸", name: "Frog",         rarity: "Uncommon",   value: 21 },
  { id: "unicorn",     emoji: "🦄", name: "Unicorn",      rarity: "Rare",       value: 45 },
  { id: "dragon",      emoji: "🐉", name: "Dragon",       rarity: "Rare",       value: 50 },
  { id: "rainbow",     emoji: "🌈", name: "Rainbow",      rarity: "Rare",       value: 42 },
  { id: "gem",         emoji: "💎", name: "Crystal Gem",  rarity: "Epic",       value: 70 },
  { id: "crown",       emoji: "👑", name: "Crown",        rarity: "Epic",       value: 75 },
  { id: "phoenix",     emoji: "🔥", name: "Phoenix",      rarity: "Legendary",  value: 88 },
  { id: "galaxy",      emoji: "🌌", name: "Galaxy",       rarity: "Legendary",  value: 92 },
  { id: "sparkle",     emoji: "✨", name: "Sparkle",      rarity: "Ultra Rare", value: 99 },
];

const COMPUTER_PLAYERS: ComputerPlayer[] = [
  { name: "Mochi",      emoji: "🧁", personality: "generous", color: 0xf9a8d4 },
  { name: "Pudding",    emoji: "🍮", personality: "fair",     color: 0xfde68a },
  { name: "Jellybean",  emoji: "🍬", personality: "stingy",  color: 0xa5f3fc },
  { name: "Marshmallow",emoji: "☁️", personality: "fair",    color: 0xe9d5ff },
  { name: "Boba",       emoji: "🧋", personality: "generous", color: 0xbbf7f4 },
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

// ─── Persistent collection ───────────────────────────────────────────────────

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

// ─── Menu Scene ──────────────────────────────────────────────────────────────

class MenuScene extends Phaser.Scene {
  private collection: Set<string> = new Set();

  constructor() { super("menu"); }

  create(): void {
    this.collection = loadCollection();

    // Background
    this.add.rectangle(VW / 2, VH / 2, VW, VH, 0xfdf2f8).setDepth(-10);

    // Floating sparkles
    for (let i = 0; i < 20; i++) {
      this.spawnSparkle();
    }

    // Title
    this.add.text(VW / 2, 140, "🧸", { fontSize: "72px" }).setOrigin(0.5);
    this.add.text(VW / 2, 220, "Squishy Swap!", {
      fontFamily: "Fraunces, serif",
      fontSize: "36px",
      color: "#be185d",
      stroke: "#fce7f3",
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(VW / 2, 265, "Trade squishies. Collect them all! ✨", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "15px",
      color: "#9d174d",
    }).setOrigin(0.5);

    // Collection count
    const collected = this.collection.size;
    this.add.text(VW / 2, 310, `📦 ${collected} / ${SQUISHIES.length} collected`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      color: "#6b7280",
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(VW / 2, 400, 220, 60, 0xec4899, 1)
      .setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(3, 0xbe185d);
    this.add.text(VW / 2, 400, "🎮  PLAY", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Collection button
    const colBtn = this.add.rectangle(VW / 2, 480, 220, 55, 0xf9a8d4, 1)
      .setInteractive({ useHandCursor: true });
    colBtn.setStrokeStyle(3, 0xec4899);
    this.add.text(VW / 2, 480, "🎀  COLLECTION", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#9d174d",
    }).setOrigin(0.5);

    // Bounce animation on play button
    this.tweens.add({
      targets: playBtn,
      scaleY: 0.95,
      scaleX: 1.03,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    playBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(200, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("trade");
      });
    });

    colBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(200, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("collection");
      });
    });

    [playBtn, colBtn].forEach(btn => {
      btn.on("pointerover", () => btn.setScale(1.05));
      btn.on("pointerout", () => btn.setScale(1.0));
    });

    this.cameras.main.fadeIn(300, 253, 242, 248);
  }

  private spawnSparkle(): void {
    const x = Math.random() * VW;
    const y = Math.random() * VH;
    const emojis = ["✨", "💫", "⭐", "🌸", "💕"];
    const e = emojis[Math.floor(Math.random() * emojis.length)] ?? "✨";
    const t = this.add.text(x, y, e, { fontSize: `${10 + Math.random() * 14}px` }).setAlpha(0.4);
    this.tweens.add({
      targets: t,
      y: y - 40 - Math.random() * 60,
      alpha: 0,
      duration: 2000 + Math.random() * 3000,
      delay: Math.random() * 3000,
      repeat: -1,
      onRepeat: () => {
        t.x = Math.random() * VW;
        t.y = VH * 0.3 + Math.random() * VH * 0.6;
        t.setAlpha(0.4);
      },
    });
  }
}

// ─── Trade Scene ─────────────────────────────────────────────────────────────

class TradeScene extends Phaser.Scene {
  private readonly onScore: (n: number) => void;
  private collection: Set<string> = new Set();

  private mySquishy!: Squishy;
  private cp!: ComputerPlayer;
  private offered: Squishy[] = [];
  private addCount = 0;
  private cpIndex = 0;
  private readonly MAX_ADD = 3;
  private readonly MAX_CP = 5;

  private offeredGroup!: Phaser.GameObjects.Container;
  private speechText!: Phaser.GameObjects.Text;
  private speechBubble!: Phaser.GameObjects.Rectangle;
  private addBtn!: Phaser.GameObjects.Rectangle;
  private addLabel!: Phaser.GameObjects.Text;
  private totalValueText!: Phaser.GameObjects.Text;

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
    this.startNewTrade();
  }

  private startNewTrade(): void {
    this.children.removeAll(true);

    const myIds = [...this.collection];
    const myId = myIds[Math.floor(Math.random() * myIds.length)] ?? "strawberry";
    this.mySquishy = SQUISHIES.find(s => s.id === myId) ?? SQUISHIES[0]!;

    this.cp = COMPUTER_PLAYERS[this.cpIndex % COMPUTER_PLAYERS.length]!;
    this.addCount = 0;
    this.offered = this.generateOffer(this.cp.personality, 0);

    this.buildUI();
  }

  private generateOffer(personality: string, addCount: number): Squishy[] {
    const myVal = this.mySquishy.value;
    let targetVal: number;
    if (personality === "generous") targetVal = myVal * (1.2 + addCount * 0.3);
    else if (personality === "stingy") targetVal = myVal * (0.6 + addCount * 0.2);
    else targetVal = myVal * (0.9 + addCount * 0.25);

    const count = personality === "generous" ? 2 : personality === "stingy" ? 1 : 2;
    const result: Squishy[] = [];
    const usedIds: string[] = [this.mySquishy.id];

    for (let i = 0; i < count + addCount; i++) {
      const each = targetVal / (count + addCount);
      const s = weightedRandomSquishy(each * 1.5, usedIds);
      result.push(s);
      usedIds.push(s.id);
    }
    return result;
  }

  private buildUI(): void {
    this.add.rectangle(VW / 2, VH / 2, VW, VH, 0xfdf2f8).setDepth(-10);

    // CP header strip
    const cpBg = this.add.rectangle(VW / 2, 60, VW, 120, this.cp.color, 0.7);
    cpBg.setStrokeStyle(2, 0xfce7f3);

    this.add.text(40, 30, this.cp.emoji, { fontSize: "48px" });
    this.add.text(100, 35, this.cp.name, {
      fontFamily: "Fraunces, serif",
      fontSize: "22px",
      color: "#1f2937",
    });
    this.add.text(100, 62, `Personality: ${this.cp.personality}`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "12px",
      color: "#6b7280",
    });
    this.add.text(VW - 16, 35, `${this.cpIndex + 1}/${this.MAX_CP}`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#6b7280",
    }).setOrigin(1, 0);

    // Speech bubble
    this.speechBubble = this.add.rectangle(VW / 2, 118, VW - 40, 36, 0xffffff, 0.9);
    this.speechBubble.setStrokeStyle(2, 0xf9a8d4);
    this.speechText = this.add.text(VW / 2, 118, this.getGreeting(), {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#be185d",
    }).setOrigin(0.5);

    this.add.text(VW / 2, 155, "🔄  TRADE OFFER", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#9d174d",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // My squishy
    this.add.text(VW / 2, 190, "YOUR SQUISHY", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      color: "#6b7280",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.buildMySquishyCard(VW / 2, 240);

    this.add.text(VW / 2, 295, "⬆️  for  ⬇️", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      color: "#9d174d",
    }).setOrigin(0.5);

    this.add.text(VW / 2, 325, "THEY OFFER", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      color: "#6b7280",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.offeredGroup = this.add.container(0, 0);
    this.buildOfferedCards();

    this.totalValueText = this.add.text(VW / 2, 510, "", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#6b7280",
    }).setOrigin(0.5);
    this.updateTotalValueText();

    this.buildButtons();

    this.cameras.main.fadeIn(250, 253, 242, 248);
  }

  private buildMySquishyCard(x: number, y: number): void {
    const rarityColor = RARITY_COLORS[this.mySquishy.rarity];
    const card = this.add.rectangle(x, y, 130, 80, 0xffffff, 1);
    card.setStrokeStyle(3, rarityColor);
    this.add.text(x, y - 15, this.mySquishy.emoji, { fontSize: "30px" }).setOrigin(0.5);
    this.add.text(x, y + 18, this.mySquishy.name, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      color: "#1f2937",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(x, y + 34, this.mySquishy.rarity, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      color: `#${rarityColor.toString(16).padStart(6, "0")}`,
    }).setOrigin(0.5);

    if (rarityRank(this.mySquishy.rarity) >= 3) {
      this.tweens.add({
        targets: card,
        alpha: 0.75,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private buildOfferedCards(): void {
    this.offeredGroup.removeAll(true);

    const count = this.offered.length;
    const cardW = Math.min(100, (VW - 40) / count - 8);
    const cardH = 90;
    const totalW = count * (cardW + 8) - 8;
    const startX = (VW - totalW) / 2 + cardW / 2;

    this.offered.forEach((sq, i) => {
      const x = startX + i * (cardW + 8);
      const y = 415;
      const rarityColor = RARITY_COLORS[sq.rarity];

      const card = this.add.rectangle(x, y, cardW, cardH, 0xffffff, 1);
      card.setStrokeStyle(2, rarityColor);

      const emoji = this.add.text(x, y - 18, sq.emoji, { fontSize: "26px" }).setOrigin(0.5);
      const nameT = this.add.text(x, y + 14, sq.name, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "9px",
        color: "#1f2937",
        fontStyle: "bold",
        wordWrap: { width: cardW - 6 },
        align: "center",
      }).setOrigin(0.5);
      const rarT = this.add.text(x, y + 30, sq.rarity, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "8px",
        color: `#${rarityColor.toString(16).padStart(6, "0")}`,
      }).setOrigin(0.5);

      this.offeredGroup.add([card, emoji, nameT, rarT]);

      // Bounce-in
      card.setScale(0.5);
      emoji.setScale(0.5);
      this.tweens.add({
        targets: [card, emoji, nameT, rarT],
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        delay: i * 80,
        ease: "Back.easeOut",
      });

      // Glow for rares
      if (rarityRank(sq.rarity) >= 2) {
        this.tweens.add({
          targets: card,
          alpha: 0.75,
          duration: 700,
          yoyo: true,
          repeat: -1,
        });
        const sparkle = this.add.text(x + cardW / 2 - 8, y - cardH / 2, "✨", { fontSize: "10px" });
        this.tweens.add({
          targets: sparkle,
          y: sparkle.y - 10,
          alpha: 0,
          duration: 1200,
          repeat: -1,
          delay: 300,
        });
      }
    });
  }

  private buildButtons(): void {
    const btnY = 580;
    const btnH = 58;

    // ✅ Accept
    const acceptBtn = this.add.rectangle(70, btnY, 110, btnH, 0x4ade80, 1)
      .setInteractive({ useHandCursor: true });
    acceptBtn.setStrokeStyle(3, 0x16a34a);
    this.add.text(70, btnY - 10, "✅", { fontSize: "22px" }).setOrigin(0.5);
    this.add.text(70, btnY + 14, "ACCEPT", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#166534",
    }).setOrigin(0.5);

    // ➕ Add more
    this.addBtn = this.add.rectangle(VW / 2, btnY, 110, btnH, 0xfbbf24, 1)
      .setInteractive({ useHandCursor: true });
    this.addBtn.setStrokeStyle(3, 0xd97706);
    this.add.text(VW / 2, btnY - 10, "➕", { fontSize: "22px" }).setOrigin(0.5);
    this.addLabel = this.add.text(VW / 2, btnY + 14, "ADD MORE", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#92400e",
    }).setOrigin(0.5);

    if (this.addCount >= this.MAX_ADD) {
      this.addBtn.setFillStyle(0xd1d5db);
      this.addBtn.setStrokeStyle(3, 0x9ca3af);
      this.addLabel.setColor("#9ca3af");
    }

    // ❌ Reject
    const rejectBtn = this.add.rectangle(VW - 70, btnY, 110, btnH, 0xf87171, 1)
      .setInteractive({ useHandCursor: true });
    rejectBtn.setStrokeStyle(3, 0xdc2626);
    this.add.text(VW - 70, btnY - 10, "❌", { fontSize: "22px" }).setOrigin(0.5);
    this.add.text(VW - 70, btnY + 14, "REJECT", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#7f1d1d",
    }).setOrigin(0.5);

    acceptBtn.on("pointerdown", () => this.onAccept());
    this.addBtn.on("pointerdown", () => this.onAddMore());
    rejectBtn.on("pointerdown", () => this.onReject());

    [acceptBtn, this.addBtn, rejectBtn].forEach(btn => {
      btn.on("pointerover", () => btn.setScale(1.05));
      btn.on("pointerout", () => btn.setScale(1.0));
    });
  }

  private updateTotalValueText(): void {
    const myVal = this.mySquishy.value;
    const offeredVal = this.offered.reduce((s, sq) => s + sq.value, 0);
    const diff = offeredVal - myVal;
    const sign = diff >= 0 ? "+" : "";
    this.totalValueText.setText(
      `Offer value: ${offeredVal} pts  (yours: ${myVal} pts, ${sign}${diff})`
    );
    this.totalValueText.setColor(diff >= 0 ? "#16a34a" : "#dc2626");
  }

  private setSpeech(text: string): void {
    this.speechText.setText(text);
    this.tweens.add({
      targets: [this.speechBubble, this.speechText],
      scaleX: 1.03,
      scaleY: 1.1,
      duration: 120,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  private getGreeting(): string {
    const greetings: Record<string, string[]> = {
      generous: ["Hi! I'd love to trade! 💕", "I have something great for you! 🌟", "Let's make a deal! 🎉"],
      fair:     ["Hey! Wanna trade? 😊", "I think this is fair! 🤝", "Deal? 🌸"],
      stingy:   ["Hmm... maybe? 🤔", "I guess I can trade... 😒", "This is my best offer! 😤"],
    };
    const list = greetings[this.cp.personality] ?? greetings["fair"]!;
    return list[Math.floor(Math.random() * list.length)] ?? "Let's trade!";
  }

  private onAccept(): void {
    const myVal = this.mySquishy.value;
    const offeredVal = this.offered.reduce((s, sq) => s + sq.value, 0);
    const ratio = offeredVal / Math.max(myVal, 1);
    let score: number;
    if (ratio >= 1.5) score = 90 + Math.floor(Math.random() * 10);
    else if (ratio >= 1.1) score = 70 + Math.floor(Math.random() * 20);
    else if (ratio >= 0.9) score = 50 + Math.floor(Math.random() * 20);
    else if (ratio >= 0.6) score = 25 + Math.floor(Math.random() * 25);
    else score = 5 + Math.floor(Math.random() * 20);

    this.collection.delete(this.mySquishy.id);
    this.offered.forEach(s => this.collection.add(s.id));
    saveCollection(this.collection);
    this.onScore(this.collection.size);

    this.cameras.main.fadeOut(200, 253, 242, 248);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("result", {
        given: this.mySquishy,
        received: this.offered,
        score,
        collectionSize: this.collection.size,
      });
    });
  }

  private onAddMore(): void {
    if (this.addCount >= this.MAX_ADD) return;
    this.addCount++;

    const speeches: Record<string, string[]> = {
      generous: ["Okay! I'll add one more! 🎁", "Sure! Take another! 💖", "Here, have this too! ✨"],
      fair:     ["Hmm... I could add something! 🤔", "Fine, one more! 😊", "Okay, deal? 🌸"],
      stingy:   ["Ugh, fine! 😤", "This better be worth it! 😒", "You drive a hard bargain! 😑"],
    };
    const list = speeches[this.cp.personality] ?? speeches["fair"]!;
    this.setSpeech(list[Math.floor(Math.random() * list.length)] ?? "Okay!");

    const usedIds = [this.mySquishy.id, ...this.offered.map(s => s.id)];
    const newSquishy = weightedRandomSquishy(this.mySquishy.value * 0.8, usedIds);
    this.offered.push(newSquishy);

    this.buildOfferedCards();
    this.updateTotalValueText();

    if (this.addCount >= this.MAX_ADD) {
      this.addBtn.setFillStyle(0xd1d5db);
      this.addBtn.setStrokeStyle(3, 0x9ca3af);
      this.addLabel.setColor("#9ca3af");
    }
  }

  private onReject(): void {
    const speeches: Record<string, string[]> = {
      generous: ["Oh no! 😢 Maybe someone else?", "Fine... 💔", "I thought we were friends! 😭"],
      fair:     ["Fine! Maybe someone else will trade! 😤", "Your loss! 🤷", "Okay, moving on! 😊"],
      stingy:   ["FINE! I didn't want to trade anyway! 😤", "Whatever! 😒", "Hmph! 😤"],
    };
    const list = speeches[this.cp.personality] ?? speeches["fair"]!;
    this.setSpeech(list[Math.floor(Math.random() * list.length)] ?? "Fine!");

    this.time.delayedCall(800, () => {
      this.cpIndex++;
      if (this.cpIndex >= this.MAX_CP) {
        this.cameras.main.fadeOut(200, 253, 242, 248);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("result", {
            given: null,
            received: [],
            score: 0,
            collectionSize: this.collection.size,
          });
        });
        return;
      }
      this.cameras.main.fadeOut(200, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.startNewTrade();
        this.cameras.main.fadeIn(250, 253, 242, 248);
      });
    });
  }
}

// ─── Result Scene ─────────────────────────────────────────────────────────────

interface ResultData {
  given: Squishy | null;
  received: Squishy[];
  score: number;
  collectionSize: number;
}

class ResultScene extends Phaser.Scene {
  private readonly onScore: (n: number) => void;
  constructor(onScore: (n: number) => void) {
    super("result");
    this.onScore = onScore;
  }

  create(data: ResultData): void {
    this.onScore(data.collectionSize);

    this.add.rectangle(VW / 2, VH / 2, VW, VH, 0xfdf2f8).setDepth(-10);

    if (!data.given) {
      this.add.text(VW / 2, VH / 2 - 60, "😔", { fontSize: "64px" }).setOrigin(0.5);
      this.add.text(VW / 2, VH / 2 + 10, "No trade made!", {
        fontFamily: "Fraunces, serif",
        fontSize: "28px",
        color: "#be185d",
      }).setOrigin(0.5);
      this.add.text(VW / 2, VH / 2 + 55, "Better luck next time!", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "16px",
        color: "#6b7280",
      }).setOrigin(0.5);
    } else {
      this.spawnConfetti();

      this.add.text(VW / 2, 80, "🎉 TRADE COMPLETE! 🎉", {
        fontFamily: "Fraunces, serif",
        fontSize: "26px",
        color: "#be185d",
        stroke: "#fce7f3",
        strokeThickness: 3,
      }).setOrigin(0.5);

      this.add.text(VW / 2, 140, "You gave:", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#6b7280",
      }).setOrigin(0.5);
      this.add.text(VW / 2, 168, `${data.given.emoji}  ${data.given.name}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#1f2937",
      }).setOrigin(0.5);

      this.add.text(VW / 2, 200, "⬇️", { fontSize: "20px" }).setOrigin(0.5);

      this.add.text(VW / 2, 228, "You received:", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#6b7280",
      }).setOrigin(0.5);

      const receivedStr = data.received.map(s => `${s.emoji} ${s.name}`).join("  +  ");
      this.add.text(VW / 2, 258, receivedStr, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#1f2937",
        wordWrap: { width: VW - 40 },
        align: "center",
      }).setOrigin(0.5);

      const { label, color } = this.getTradeLabel(data.score);
      this.add.rectangle(VW / 2, 360, VW - 60, 100, color, 0.15)
        .setStrokeStyle(3, color);

      this.add.text(VW / 2, 335, label, {
        fontFamily: "Fraunces, serif",
        fontSize: "24px",
        color: `#${color.toString(16).padStart(6, "0")}`,
      }).setOrigin(0.5);

      const scoreText = this.add.text(VW / 2, 375, "0 / 100", {
        fontFamily: "Fraunces, serif",
        fontSize: "32px",
        fontStyle: "bold",
        color: `#${color.toString(16).padStart(6, "0")}`,
      }).setOrigin(0.5);

      let current = 0;
      this.time.addEvent({
        delay: 20,
        repeat: data.score,
        callback: () => {
          current++;
          scoreText.setText(`${current} / 100`);
        },
      });

      this.add.text(VW / 2, 445, `📦 Collection: ${data.collectionSize} / ${SQUISHIES.length}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#6b7280",
      }).setOrigin(0.5);

      const rareNew = data.received.filter(s => rarityRank(s.rarity) >= 2);
      if (rareNew.length > 0) {
        const rareText = this.add.text(
          VW / 2, 475,
          `✨ NEW RARE: ${rareNew.map(s => `${s.emoji} ${s.name}`).join(", ")}`,
          {
            fontFamily: "Manrope, sans-serif",
            fontSize: "13px",
            color: "#7c3aed",
            fontStyle: "bold",
          }
        ).setOrigin(0.5);
        this.tweens.add({
          targets: rareText,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
      }
    }

    // Buttons
    const playAgainBtn = this.add.rectangle(VW / 2 - 70, 560, 120, 55, 0xec4899, 1)
      .setInteractive({ useHandCursor: true });
    playAgainBtn.setStrokeStyle(3, 0xbe185d);
    this.add.text(VW / 2 - 70, 548, "🔄", { fontSize: "18px" }).setOrigin(0.5);
    this.add.text(VW / 2 - 70, 570, "TRADE AGAIN", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);

    const collectionBtn = this.add.rectangle(VW / 2 + 70, 560, 120, 55, 0xf9a8d4, 1)
      .setInteractive({ useHandCursor: true });
    collectionBtn.setStrokeStyle(3, 0xec4899);
    this.add.text(VW / 2 + 70, 548, "🎀", { fontSize: "18px" }).setOrigin(0.5);
    this.add.text(VW / 2 + 70, 570, "COLLECTION", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#9d174d",
    }).setOrigin(0.5);

    playAgainBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(200, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("trade"));
    });
    collectionBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(200, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("collection"));
    });

    [playAgainBtn, collectionBtn].forEach(btn => {
      btn.on("pointerover", () => btn.setScale(1.05));
      btn.on("pointerout", () => btn.setScale(1.0));
    });

    this.cameras.main.fadeIn(300, 253, 242, 248);
  }

  private getTradeLabel(score: number): { label: string; color: number } {
    if (score >= 85) return { label: "🔥 AMAZING TRADE!", color: 0xf59e0b };
    if (score >= 65) return { label: "💖 GREAT TRADE!",   color: 0xec4899 };
    if (score >= 45) return { label: "😊 FAIR TRADE",     color: 0x4ade80 };
    if (score >= 25) return { label: "😬 NOT THE BEST",   color: 0xf97316 };
    return                  { label: "💀 TERRIBLE TRADE!", color: 0xef4444 };
  }

  private spawnConfetti(): void {
    const emojis = ["🎊", "🎉", "✨", "💕", "🌸", "⭐"];
    for (let i = 0; i < 18; i++) {
      const e = emojis[i % emojis.length] ?? "✨";
      const x = Math.random() * VW;
      const t = this.add.text(x, -20, e, { fontSize: `${14 + Math.random() * 16}px` });
      this.tweens.add({
        targets: t,
        y: VH + 40,
        x: x + (Math.random() - 0.5) * 100,
        angle: (Math.random() - 0.5) * 360,
        duration: 1500 + Math.random() * 1500,
        delay: Math.random() * 1000,
        ease: "Cubic.easeIn",
        onComplete: () => t.destroy(),
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
    const collection = loadCollection();
    this.onScore(collection.size);

    this.add.rectangle(VW / 2, VH / 2, VW, VH, 0xfdf2f8).setDepth(-10);

    this.add.text(VW / 2, 40, "🎀 My Collection", {
      fontFamily: "Fraunces, serif",
      fontSize: "26px",
      color: "#be185d",
    }).setOrigin(0.5);
    this.add.text(VW / 2, 72, `${collection.size} / ${SQUISHIES.length} squishies`, {
      fontFamily: "Manrope, sans-serif",
      fontSize: "13px",
      color: "#6b7280",
    }).setOrigin(0.5);

    // Grid
    const cols = 4;
    const cellW = (VW - 32) / cols;
    const cellH = 90;
    const startY = 110;

    SQUISHIES.forEach((sq, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 16 + col * cellW + cellW / 2;
      const y = startY + row * cellH + cellH / 2;
      const owned = collection.has(sq.id);
      const rarityColor = RARITY_COLORS[sq.rarity];

      const card = this.add.rectangle(x, y, cellW - 6, cellH - 6, owned ? 0xffffff : 0xf3f4f6, 1);
      card.setStrokeStyle(2, owned ? rarityColor : 0xe5e7eb);

      if (owned) {
        this.add.text(x, y - 18, sq.emoji, { fontSize: "22px" }).setOrigin(0.5);
        this.add.text(x, y + 8, sq.name, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "8px",
          fontStyle: "bold",
          color: "#1f2937",
          wordWrap: { width: cellW - 10 },
          align: "center",
        }).setOrigin(0.5);
        this.add.text(x, y + 24, sq.rarity, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "7px",
          color: `#${rarityColor.toString(16).padStart(6, "0")}`,
        }).setOrigin(0.5);

        if (rarityRank(sq.rarity) >= 2) {
          this.tweens.add({
            targets: card,
            alpha: 0.75,
            duration: 800,
            yoyo: true,
            repeat: -1,
          });
        }
      } else {
        this.add.text(x, y - 8, "❓", { fontSize: "22px" }).setOrigin(0.5).setAlpha(0.3);
        this.add.text(x, y + 18, "???", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "9px",
          color: "#d1d5db",
        }).setOrigin(0.5);
      }
    });

    // Back button
    const backBtn = this.add.rectangle(VW / 2, VH - 40, 180, 50, 0xec4899, 1)
      .setInteractive({ useHandCursor: true });
    backBtn.setStrokeStyle(3, 0xbe185d);
    this.add.text(VW / 2, VH - 40, "← Back to Menu", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);

    backBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(200, 253, 242, 248);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
    });
    backBtn.on("pointerover", () => backBtn.setScale(1.05));
    backBtn.on("pointerout", () => backBtn.setScale(1.0));

    this.cameras.main.fadeIn(300, 253, 242, 248);
  }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

export function startGame(parent: HTMLElement, onScore: (n: number) => void): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VW,
    height: VH,
    backgroundColor: "#fdf2f8",
    transparent: false,
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

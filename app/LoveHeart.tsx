"use client";

import { useEffect, useRef } from "react";

const phrases = [
  { language: "English", text: "I love you" },
  { language: "Malay", text: "Saya cinta padamu" },
  { language: "Indonesian", text: "Aku cinta kamu" },
  { language: "Spanish", text: "Te amo" },
  { language: "French", text: "Je t'aime" },
  { language: "Italian", text: "Ti amo" },
  { language: "Portuguese", text: "Eu te amo" },
  { language: "German", text: "Ich liebe dich" },
  { language: "Dutch", text: "Ik hou van jou" },
  { language: "Turkish", text: "Seni seviyorum" },
  { language: "Filipino", text: "Mahal kita" },
  { language: "Swahili", text: "Nakupenda" },
  { language: "Vietnamese", text: "Anh yeu em" },
  { language: "Japanese", text: "\u611b\u3057\u3066\u308b" },
  { language: "Korean", text: "\uc0ac\ub791\ud574" },
  { language: "Chinese", text: "\u6211\u7231\u4f60" },
  {
    language: "Hindi",
    text:
      "\u092e\u0948\u0902 \u0924\u0941\u092e\u0938\u0947 \u092a\u094d\u092f\u093e\u0930 \u0915\u0930\u0924\u093e \u0939\u0942\u0901",
  },
  { language: "Arabic", text: "\u0623\u062d\u0628\u0643" },
  {
    language: "Russian",
    text: "\u042f \u0442\u0435\u0431\u044f \u043b\u044e\u0431\u043b\u044e",
  },
  { language: "Greek", text: "\u03a3' \u03b1\u03b3\u03b1\u03c0\u03ce" },
  { language: "Thai", text: "\u0e09\u0e31\u0e19\u0e23\u0e31\u0e01\u0e04\u0e38\u0e13" },
  {
    language: "Tamil",
    text:
      "\u0ba8\u0bbe\u0ba9\u0bcd \u0b89\u0ba9\u0bcd\u0ba9\u0bc8 \u0b95\u0bbe\u0ba4\u0bb2\u0bbf\u0b95\u0bcd\u0b95\u0bbf\u0bb1\u0bc7\u0ba9\u0bcd",
  },
] as const;

const cardColors = [
  "#bff2ff",
  "#c6ffb2",
  "#fff7bd",
  "#ffd2e1",
  "#f31fc1",
  "#dff4ff",
  "#cfdcff",
];

const codeLines = [
  "import random, math, time",
  "from love import every_language",
  "messages = [p.text for p in phrases]",
  "colors = ['pink', 'lightblue', 'lightgreen', 'lemon']",
  "def heart(t):",
  "    x = 16 * math.sin(t) ** 3",
  "    y = 13 * math.cos(t) - 5 * math.cos(2*t)",
  "    return x, y",
  "for card in floating_windows:",
  "    card.move_to(heart(card.angle))",
  "    card.caption = random.choice(messages)",
  "    card.glow = 'for you'",
  "while True:",
  "    draw_editor_background()",
  "    draw_love_cards()",
  "    time.sleep(1 / 60)",
];

const fontStack =
  "'Segoe UI', 'Noto Sans', 'Segoe UI Symbol', 'Apple Color Emoji', 'Noto Color Emoji', Arial, sans-serif";
const monoStack = "'Cascadia Code', Consolas, 'SFMono-Regular', monospace";
const totalCards = 176;
const cycleSeconds = 13.2;

type Card = {
  index: number;
  t: number;
  layer: number;
  phrase: (typeof phrases)[number];
  color: string;
  seed: number;
  delay: number;
  scatterX: number;
  scatterY: number;
  driftX: number;
  driftY: number;
  rotation: number;
};

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function ease(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, p: number) {
  return a + (b - a) * p;
}

function heartPoint(t: number) {
  const x = 16 * Math.sin(t) ** 3;
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);
  return { x, y };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function makeCards() {
  const random = seeded(20260729);

  return Array.from({ length: totalCards }, (_, index) => {
    const phrase = phrases[index % phrases.length];
    return {
      index,
      t: (index / totalCards) * Math.PI * 2 + (random() - 0.5) * 0.08,
      layer: index % 7,
      phrase,
      color: cardColors[index % cardColors.length],
      seed: random(),
      delay: (index % 44) * 0.018,
      scatterX: random(),
      scatterY: random(),
      driftX: random() - 0.5,
      driftY: random() - 0.5,
      rotation: (random() - 0.5) * 0.16,
    };
  });
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  weight = 700,
) {
  let size = maxSize;
  do {
    ctx.font = `${weight} ${size}px ${fontStack}`;
    if (ctx.measureText(text).width <= maxWidth || size <= minSize) return size;
    size -= 1;
  } while (size >= minSize);

  return minSize;
}

function drawEditor(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-0.035);
  ctx.translate(-width / 2, -height / 2);

  const x = width * 0.075;
  const y = height * 0.07;
  const w = width * 0.85;
  const h = height * 0.86;

  ctx.fillStyle = "#081328";
  ctx.fillRect(0, 0, width, height);
  ctx.shadowColor = "rgba(71, 153, 255, 0.5)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#0d1f3e";
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#21395f";
  ctx.fillRect(x, y, w, 34);
  ctx.fillStyle = "#102546";
  ctx.fillRect(x + 10, y + 9, 116, 21);
  ctx.fillStyle = "#b8d8ff";
  ctx.font = `600 ${Math.max(10, width * 0.007)}px ${fontStack}`;
  ctx.fillText("temp.py", x + 28, y + 24);

  const leftW = w * 0.56;
  const rightX = x + leftW + 9;
  ctx.strokeStyle = "rgba(74, 140, 226, 0.68)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 12, y + 44, leftW - 18, h - 68);
  ctx.strokeRect(rightX, y + 44, w - leftW - 22, h * 0.5);
  ctx.strokeRect(rightX, y + h * 0.58, w - leftW - 22, h * 0.34);

  ctx.fillStyle = "#071227";
  ctx.fillRect(x + 13, y + 45, leftW - 20, h - 70);
  ctx.fillRect(rightX + 1, y + 45, w - leftW - 24, h * 0.5 - 2);
  ctx.fillRect(rightX + 1, y + h * 0.58 + 1, w - leftW - 24, h * 0.34 - 2);

  const lineH = clamp(height * 0.028, 14, 24);
  const codeSize = clamp(width * 0.009, 10, 17);
  const lineX = x + 28;
  let lineY = y + 72;
  ctx.font = `600 ${codeSize}px ${monoStack}`;

  for (let row = 0; row < Math.floor((h - 92) / lineH); row += 1) {
    const line = codeLines[row % codeLines.length];
    const wobble = Math.sin(elapsed * 0.9 + row) * 0.3;
    ctx.fillStyle = "rgba(130, 165, 215, 0.78)";
    ctx.fillText(String(row + 1).padStart(2, " "), lineX, lineY + wobble);
    ctx.fillStyle = row % 5 === 0 ? "#ba7dff" : row % 3 === 0 ? "#74ff8a" : "#e7eefb";
    ctx.fillText(line.slice(0, 54), lineX + 42, lineY + wobble);
    if (row % 4 === 2) {
      ctx.fillStyle = "#ffe36e";
      ctx.fillText("love", lineX + 260, lineY + wobble);
    }
    lineY += lineH;
  }

  ctx.fillStyle = "#214a83";
  ctx.fillRect(rightX + 22, y + 68, w - leftW - 68, 34);
  ctx.fillStyle = "#d8ebff";
  ctx.font = `700 ${clamp(width * 0.01, 12, 18)}px ${fontStack}`;
  ctx.fillText("Output", rightX + 42, y + 91);
  ctx.fillStyle = "#e8eefc";
  ctx.font = `600 ${clamp(width * 0.0085, 10, 15)}px ${monoStack}`;
  ctx.fillText("Python 3.12.7 | love_languages.py", rightX + 32, y + h * 0.65);
  ctx.fillStyle = "#65ff86";
  ctx.fillText("In [1]: runfile('heart_love_languages.py')", rightX + 32, y + h * 0.72);

  const scanY = y + 54 + ((elapsed * 44) % Math.max(80, h - 110));
  ctx.strokeStyle = "rgba(100, 183, 255, 0.26)";
  ctx.beginPath();
  ctx.moveTo(x + 14, scanY);
  ctx.lineTo(x + w - 20, scanY);
  ctx.stroke();

  ctx.restore();
}

function cardPosition(card: Card, width: number, height: number, phase: number) {
  const heart = heartPoint(card.t);
  const scaleX = Math.min(width * 0.019, height * 0.043);
  const scaleY = Math.min(width * 0.016, height * 0.029);
  const centerX = width * 0.58;
  const centerY = height * 0.49;
  const depthX = card.layer * clamp(width * 0.0044, 2.5, 7);
  const depthY = -card.layer * clamp(height * 0.006, 2.5, 6.5);
  const beat = 1 + Math.sin(phase * 1.8) * 0.025;
  const heartX = centerX + heart.x * scaleX * beat + depthX;
  const heartY = centerY - heart.y * scaleY * beat + depthY;

  const startX = width * 0.55 + Math.cos(card.t) * 38 + depthX;
  const startY = -80 - (card.index % 35) * 5;
  const scatterX = lerp(width * 0.12, width * 0.88, card.scatterX);
  const scatterY = lerp(height * 0.08, height * 0.92, card.scatterY);
  const floatX = Math.sin(phase * 1.4 + card.seed * 8) * 12 * card.driftX;
  const floatY = Math.cos(phase * 1.1 + card.seed * 9) * 10 * card.driftY;

  if (phase < 4.1) {
    const p = ease((phase - card.delay) / 2.3);
    return {
      x: lerp(startX, heartX, p),
      y: lerp(startY, heartY, p),
      alpha: p,
      rotation: card.rotation * p,
      size: lerp(0.8, 1, p),
    };
  }

  if (phase < 6.2) {
    return {
      x: heartX + floatX * 0.35,
      y: heartY + floatY * 0.35,
      alpha: 1,
      rotation: card.rotation,
      size: 1,
    };
  }

  const spread = ease((phase - 6.2 - card.delay * 0.45) / 2.4);
  if (phase < 9.8) {
    return {
      x: lerp(heartX, scatterX, spread) + floatX,
      y: lerp(heartY, scatterY, spread) + floatY,
      alpha: 1,
      rotation: lerp(card.rotation, card.rotation * 2.6, spread),
      size: lerp(1, 0.92, spread),
    };
  }

  const fall = ((phase - 9.8) * (18 + card.seed * 24)) % (height + 120);
  return {
    x: scatterX + floatX * 1.5,
    y: ((scatterY + fall - 70) % (height + 130)) - 45,
    alpha: 0.92,
    rotation: card.rotation * 2.6,
    size: 0.92,
  };
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  card: Card,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha: number,
  rotation: number,
  scale: number,
) {
  const w = clamp(width * 0.1, 92, 156) * scale;
  const h = w * 0.46;
  const barH = h * 0.34;
  const radius = clamp(w * 0.07, 5, 10);
  const darkText = card.color === "#f31fc1" ? "rgba(37, 7, 42, 0.8)" : "rgba(24, 48, 72, 0.82)";

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;

  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 7;
  roundedRect(ctx, -w / 2, -h / 2, w, h, radius);
  ctx.fillStyle = "rgba(241, 247, 252, 0.94)";
  ctx.fill();

  ctx.shadowColor = "transparent";
  roundedRect(ctx, -w / 2, -h / 2, w, h, radius);
  ctx.clip();

  ctx.fillStyle = "#edf2f6";
  ctx.fillRect(-w / 2, -h / 2, w, barH);
  ctx.fillStyle = card.color;
  ctx.fillRect(-w / 2, -h / 2 + barH, w, h - barH);

  ctx.strokeStyle = "rgba(115, 132, 148, 0.24)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);

  ctx.fillStyle = "#2b6daf";
  ctx.beginPath();
  ctx.ellipse(-w / 2 + 16, -h / 2 + barH * 0.48, 3.2, 8, 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(104, 119, 136, 0.28)";
  ctx.lineWidth = 1.3;
  const controlsX = w / 2 - 44;
  ctx.strokeRect(controlsX, -h / 2 + barH * 0.34, 7, 7);
  ctx.beginPath();
  ctx.moveTo(controlsX + 28, -h / 2 + barH * 0.34);
  ctx.lineTo(controlsX + 36, -h / 2 + barH * 0.78);
  ctx.moveTo(controlsX + 36, -h / 2 + barH * 0.34);
  ctx.lineTo(controlsX + 28, -h / 2 + barH * 0.78);
  ctx.stroke();

  const size = fitText(ctx, card.phrase.text, w * 0.78, clamp(w * 0.14, 12, 20), 9);
  ctx.fillStyle = darkText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `750 ${size}px ${fontStack}`;
  ctx.fillText(card.phrase.text, 0, h * 0.17);

  ctx.globalAlpha = alpha * 0.35;
  ctx.font = `600 ${Math.max(7, size * 0.55)}px ${fontStack}`;
  ctx.fillText(card.phrase.language, 0, h * 0.37);
  ctx.restore();
}

export default function LoveHeart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    const previewPhase = new URLSearchParams(window.location.search).get("phase");
    let elapsed = previewPhase ? Number(previewPhase) || 0 : 0;
    let cards = makeCards();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const restart = () => {
      elapsed = 0;
      cards = makeCards();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      elapsed += dt;
      const phase = elapsed % cycleSeconds;

      drawEditor(ctx, width, height, elapsed);

      const vignette = ctx.createRadialGradient(
        width * 0.55,
        height * 0.48,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7,
      );
      vignette.addColorStop(0, "rgba(32, 70, 120, 0.06)");
      vignette.addColorStop(0.7, "rgba(4, 8, 18, 0.08)");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.45)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      const positioned = cards
        .map((card) => ({ card, position: cardPosition(card, width, height, phase) }))
        .sort((a, b) => a.position.y - b.position.y || a.card.layer - b.card.layer);

      for (const item of positioned) {
        drawCard(
          ctx,
          item.card,
          item.position.x,
          item.position.y,
          width,
          height,
          item.position.alpha,
          item.position.rotation,
          item.position.size,
        );
      }

      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", restart);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", restart);
    };
  }, []);

  return (
    <main className="love-stage" aria-label="Animated love messages forming a heart">
      <canvas ref={canvasRef} className="love-canvas" />
      <div className="signature" aria-hidden="true">
        for you
      </div>
    </main>
  );
}

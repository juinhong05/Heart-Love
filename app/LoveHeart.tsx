"use client";

import { useEffect, useRef, useState } from "react";

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

const scatterMessages = [
  "\u8eab\u4f53\u5065\u5eb7",
  "\u522b\u71ac\u591c",
  "\u987a\u987a\u5229\u5229",
  "\u4fdd\u6301\u597d\u5fc3\u60c5",
  "\u597d\u597d\u5403\u996d",
  "\u5929\u5929\u5f00\u5fc3",
  "\u597d\u597d\u7231\u81ea\u5df1",
  "\u6211\u7231\u4f60",
  "\u6211\u60f3\u4f60\u4e86",
  "\u591a\u559d\u6c34\u5440",
  "\u5145\u5b9e\u81ea\u5df1",
] as const;

const cardColors = [
  "#ffd9e7",
  "#ffe7b8",
  "#dff2d4",
  "#f8d7c8",
  "#e9dcff",
  "#fff2cb",
  "#cfeae2",
];

const fontStack =
  "'Segoe UI', 'Noto Sans', 'Segoe UI Symbol', 'Apple Color Emoji', 'Noto Color Emoji', Arial, sans-serif";
const totalCards = 156;
const cycleSeconds = 13.8;

type Card = {
  index: number;
  t: number;
  layer: number;
  phrase: (typeof phrases)[number];
  scatterText: (typeof scatterMessages)[number];
  color: string;
  seed: number;
  delay: number;
  scatterX: number;
  scatterY: number;
  driftX: number;
  driftY: number;
  rotation: number;
  image?: HTMLCanvasElement;
  scatterImage?: HTMLCanvasElement;
  imageWidth?: number;
  imageHeight?: number;
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
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function makeCards() {
  const random = seeded(20260729);

  return Array.from({ length: totalCards }, (_, index) => {
    const drawingOrder = index / totalCards;
    return {
      index,
      t: Math.PI + drawingOrder * Math.PI * 2 + (random() - 0.5) * 0.075,
      layer: index % 7,
      phrase: phrases[index % phrases.length],
      scatterText: scatterMessages[index % scatterMessages.length],
      color: cardColors[index % cardColors.length],
      seed: random(),
      delay: (index % 42) * 0.014,
      scatterX: random(),
      scatterY: random(),
      driftX: random() - 0.5,
      driftY: random() - 0.5,
      rotation: (random() - 0.5) * 0.13,
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
  while (size >= minSize) {
    ctx.font = `${weight} ${size}px ${fontStack}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return minSize;
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#34121f");
  bg.addColorStop(0.45, "#7b3045");
  bg.addColorStop(1, "#2a0d18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const blush = ctx.createLinearGradient(0, height * 0.15, width, height * 0.85);
  blush.addColorStop(0, "rgba(255, 231, 221, 0.22)");
  blush.addColorStop(0.48, "rgba(255, 171, 190, 0.24)");
  blush.addColorStop(1, "rgba(122, 31, 56, 0)");
  ctx.fillStyle = blush;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.12,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.72,
  );
  vignette.addColorStop(0, "rgba(255, 232, 224, 0.18)");
  vignette.addColorStop(0.62, "rgba(83, 21, 38, 0.05)");
  vignette.addColorStop(1, "rgba(23, 5, 14, 0.56)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function heartPosition(
  t: number,
  layer: number,
  width: number,
  height: number,
  phase: number,
) {
  const heart = heartPoint(t);
  const isNarrow = width < 640;
  const scaleX = isNarrow
    ? Math.min(width * 0.015, height * 0.026)
    : Math.min(width * 0.02, height * 0.043);
  const scaleY = isNarrow
    ? Math.min(width * 0.013, height * 0.02)
    : Math.min(width * 0.017, height * 0.031);
  const centerX = width * (isNarrow ? 0.39 : 0.52);
  const centerY = height * (isNarrow ? 0.51 : 0.51);
  const depthX = layer * clamp(width * (isNarrow ? 0.0021 : 0.0038), 1.3, 6.4);
  const depthY = -layer * clamp(height * (isNarrow ? 0.003 : 0.0052), 1.4, 5.8);
  const beat = 1 + Math.sin(phase * 1.75) * 0.018;

  return {
    x: centerX + heart.x * scaleX * beat + depthX,
    y: centerY - heart.y * scaleY * beat + depthY,
  };
}

function cardPosition(card: Card, width: number, height: number, phase: number) {
  const target = heartPosition(card.t, card.layer, width, height, phase);
  const trail = heartPosition(card.t - 0.5, card.layer, width, height, phase);
  const order = card.index / totalCards;
  const scatterX = lerp(width * 0.11, width * 0.89, card.scatterX);
  const scatterY = lerp(height * 0.1, height * 0.9, card.scatterY);
  const floatX = Math.sin(phase * 1.2 + card.seed * 8) * 8 * card.driftX;
  const floatY = Math.cos(phase * 0.95 + card.seed * 9) * 7 * card.driftY;
  const drawDuration = 5.4;
  const drawProgress = ease(phase / drawDuration);

  if (phase < drawDuration) {
    const trace = ease((drawProgress - order) / 0.075);
    return {
      x: lerp(trail.x, target.x, trace),
      y: lerp(trail.y, target.y, trace),
      alpha: clamp((drawProgress - order + 0.035) / 0.055, 0, 1),
      rotation: card.rotation * trace,
      size: lerp(0.9, 1, trace),
      textMix: 0,
    };
  }

  if (phase < 7.4) {
    return {
      x: target.x + floatX * 0.3,
      y: target.y + floatY * 0.3,
      alpha: 1,
      rotation: card.rotation,
      size: 1,
      textMix: 0,
    };
  }

  if (phase < 10.9) {
    const spread = ease((phase - 7.4 - card.delay * 0.3) / 2.7);
    const textMix = ease((phase - 7.55 - card.delay * 0.22) / 0.9);
    return {
      x: lerp(target.x, scatterX, spread) + floatX,
      y: lerp(target.y, scatterY, spread) + floatY,
      alpha: 1,
      rotation: lerp(card.rotation, card.rotation * 2.5, spread),
      size: lerp(1, 0.92, spread),
      textMix,
    };
  }

  return {
    x: scatterX + floatX * 1.7,
    y: scatterY + floatY * 1.7,
    alpha: 0.92,
    rotation: card.rotation * 2.5,
    size: 0.92,
    textMix: 1,
  };
}

function renderCardImage(
  card: Card,
  width: number,
  dpr: number,
  text: string,
  language?: string,
) {
  const isNarrow = width < 640;
  const w = isNarrow ? clamp(width * 0.18, 64, 96) : clamp(width * 0.1, 92, 156);
  const h = w * 0.46;
  const pad = 24;
  const cssWidth = w + pad * 2;
  const cssHeight = h + pad * 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(cssWidth * dpr);
  canvas.height = Math.ceil(cssHeight * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);
  ctx.translate(cssWidth / 2, cssHeight / 2);

  const barH = h * 0.34;
  const radius = clamp(w * 0.07, 5, 10);
  const darkText = "rgba(82, 34, 55, 0.86)";

  ctx.shadowColor = "rgba(76, 18, 39, 0.28)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 2.5;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, -w / 2, -h / 2, w, h, radius);
  ctx.fillStyle = "rgba(255, 250, 250, 0.96)";
  ctx.fill();

  ctx.shadowColor = "transparent";
  roundedRect(ctx, -w / 2, -h / 2, w, h, radius);
  ctx.clip();

  ctx.fillStyle = "#fff7fa";
  ctx.fillRect(-w / 2, -h / 2, w, barH);
  ctx.fillStyle = card.color;
  ctx.fillRect(-w / 2, -h / 2 + barH, w, h - barH);

  ctx.strokeStyle = "rgba(140, 76, 98, 0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);

  ctx.fillStyle = "#ff7fa4";
  ctx.beginPath();
  ctx.ellipse(-w / 2 + 16, -h / 2 + barH * 0.48, 3.2, 8, 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(168, 90, 113, 0.26)";
  ctx.lineWidth = 1.3;
  const controlsX = w / 2 - 44;
  ctx.strokeRect(controlsX, -h / 2 + barH * 0.34, 7, 7);
  ctx.beginPath();
  ctx.moveTo(controlsX + 28, -h / 2 + barH * 0.34);
  ctx.lineTo(controlsX + 36, -h / 2 + barH * 0.78);
  ctx.moveTo(controlsX + 36, -h / 2 + barH * 0.34);
  ctx.lineTo(controlsX + 28, -h / 2 + barH * 0.78);
  ctx.stroke();

  const size = fitText(
    ctx,
    text,
    w * 0.82,
    language ? clamp(w * 0.14, 12, 20) : clamp(w * 0.17, 14, 23),
    9,
  );
  ctx.fillStyle = darkText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `750 ${size}px ${fontStack}`;
  ctx.fillText(text, 0, language ? h * 0.17 : h * 0.24);

  if (language) {
    ctx.globalAlpha = 0.36;
    ctx.font = `600 ${Math.max(7, size * 0.55)}px ${fontStack}`;
    ctx.fillText(language, 0, h * 0.37);
  }

  card.imageWidth = cssWidth;
  card.imageHeight = cssHeight;
  return canvas;
}

function refreshCardImages(cards: Card[], width: number, dpr: number) {
  for (const card of cards) {
    card.image = renderCardImage(card, width, dpr, card.phrase.text, card.phrase.language);
    card.scatterImage = renderCardImage(card, width, dpr, card.scatterText);
  }
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  card: Card,
  x: number,
  y: number,
  alpha: number,
  rotation: number,
  scale: number,
  textMix: number,
) {
  if (!card.image || !card.imageWidth || !card.imageHeight || alpha <= 0.01) return;

  const w = card.imageWidth * scale;
  const h = card.imageHeight * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha * (1 - textMix);
  ctx.drawImage(card.image, -w / 2, -h / 2, w, h);
  if (card.scatterImage && textMix > 0.01) {
    ctx.globalAlpha = alpha * textMix;
    ctx.drawImage(card.scatterImage, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

export default function LoveHeart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

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

    const startMusic = () => {
      const audio = audioRef.current;
      if (!audio || !audio.paused) return;

      void audio.play().catch(() => {
        // Browsers can block playback until a direct user interaction occurs.
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      refreshCardImages(cards, width, dpr);
    };

    const restart = () => {
      elapsed = 0;
      cards = makeCards();
      refreshCardImages(cards, width, dpr);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.026, (now - last) / 1000);
      last = now;
      if (!previewPhase) elapsed += dt;
      const phase = elapsed % cycleSeconds;

      drawBackground(ctx, width, height);

      const positioned = cards
        .map((card) => ({ card, position: cardPosition(card, width, height, phase) }))
        .sort((a, b) => a.position.y - b.position.y || a.card.layer - b.card.layer);

      for (const item of positioned) {
        drawCard(
          ctx,
          item.card,
          item.position.x,
          item.position.y,
          item.position.alpha,
          item.position.rotation,
          item.position.size,
          item.position.textMix,
        );
      }

      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    const handlePointerDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement | null)?.closest(".music-toggle")) return;
      restart();
      startMusic();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play().catch(() => {
        setIsMusicPlaying(false);
      });
      return;
    }

    audio.pause();
  };

  return (
    <main className="love-stage" aria-label="Animated love messages forming a heart">
      <canvas ref={canvasRef} className="love-canvas" />
      <audio
        ref={audioRef}
        loop
        preload="metadata"
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => setIsMusicPlaying(false)}
      >
        <source src="/love-me.mp3" type="audio/mpeg" />
      </audio>
      <button
        type="button"
        className="music-toggle"
        aria-label={isMusicPlaying ? "Pause background music" : "Play background music"}
        aria-pressed={isMusicPlaying}
        onClick={toggleMusic}
      >
        <span aria-hidden="true">{isMusicPlaying ? "II" : "♪"}</span>
      </button>
      <div className="signature" aria-hidden="true">
        for you
      </div>
    </main>
  );
}

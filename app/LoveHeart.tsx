"use client";

import { useEffect, useRef } from "react";

const phrases = [
  ["English", "I love you"],
  ["Malay", "Saya cinta padamu"],
  ["Indonesian", "Aku cinta kamu"],
  ["Spanish", "Te amo"],
  ["French", "Je t'aime"],
  ["Italian", "Ti amo"],
  ["Portuguese", "Eu te amo"],
  ["German", "Ich liebe dich"],
  ["Dutch", "Ik hou van jou"],
  ["Turkish", "Seni seviyorum"],
  ["Filipino", "Mahal kita"],
  ["Swahili", "Nakupenda"],
  ["Vietnamese", "Anh yeu em"],
  ["Japanese", "愛してる"],
  ["Korean", "사랑해"],
  ["Chinese", "我爱你"],
  ["Hindi", "मैं तुमसे प्यार करता हूँ"],
  ["Arabic", "أحبك"],
  ["Russian", "Я тебя люблю"],
  ["Greek", "Σ' αγαπώ"],
  ["Thai", "ฉันรักคุณ"],
  ["Tamil", "நான் உன்னை காதலிக்கிறேன்"],
] as const;

type Particle = {
  t: number;
  text: string;
  phase: number;
  size: number;
  depth: number;
  drift: number;
};

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
};

const particleCount = 190;
const phraseSeconds = 2.2;
const fontStack =
  "'Noto Sans', 'Segoe UI', 'Segoe UI Symbol', 'Apple Color Emoji', 'Noto Color Emoji', Arial, sans-serif";

function heartPoint(t: number) {
  const x = 16 * Math.sin(t) ** 3;
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);
  return { x, y };
}

function makeParticles() {
  return Array.from({ length: particleCount }, (_, index) => ({
    t: (index / particleCount) * Math.PI * 2,
    text: phrases[index % phrases.length][1],
    phase: Math.random() * Math.PI * 2,
    size: 12 + Math.random() * 7,
    depth: Math.random(),
    drift: 1.5 + Math.random() * 5,
  }));
}

function makeSparks(x: number, y: number) {
  return Array.from({ length: 30 }, (_, index) => {
    const angle = (index / 30) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const speed = 90 + Math.random() * 230;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      text: phrases[Math.floor(Math.random() * phrases.length)][1],
      life: 1 + Math.random() * 0.9,
      maxLife: 1.9,
      size: 13 + Math.random() * 9,
      hue: Math.random(),
    };
  });
}

function drawGlowText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
  weight = 700,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${weight} ${size}px ${fontStack}`;
  ctx.shadowColor = color;
  ctx.shadowBlur = Math.max(8, size * 0.28);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
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
    let elapsed = 0;
    let particles: Particle[] = makeParticles();
    let sparks: Spark[] = [];

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

    const burst = (event: PointerEvent) => {
      sparks = sparks.concat(makeSparks(event.clientX, event.clientY)).slice(-120);
    };

    const drawBackground = () => {
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.42,
        0,
        width * 0.5,
        height * 0.55,
        Math.max(width, height) * 0.72,
      );
      gradient.addColorStop(0, "#351326");
      gradient.addColorStop(0.42, "#120816");
      gradient.addColorStop(1, "#05040c");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 50; i += 1) {
        const x = (i * 137 + elapsed * (12 + (i % 5))) % (width + 120) - 60;
        const y =
          (i * 83 + Math.sin(elapsed * 0.7 + i) * 30) % (height + 120) - 60;
        ctx.fillStyle = `hsla(${320 + Math.sin(i) * 36}, 88%, 76%, 0.18)`;
        ctx.beginPath();
        ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawHeartWords = () => {
      const centerX = width / 2;
      const centerY = height / 2 + Math.min(height * 0.06, 42);
      const scale = Math.min(width, height) / 43;
      const beat = 1 + 0.052 * Math.sin(elapsed * 3.4) + 0.018 * Math.sin(elapsed * 6.8);

      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        const heart = heartPoint(particle.t);
        const x =
          centerX +
          heart.x * scale * beat +
          Math.cos(elapsed * 0.8 + particle.phase) * particle.drift;
        const y =
          centerY -
          heart.y * scale * beat +
          Math.sin(elapsed * 0.9 + particle.phase) * particle.drift;
        const hue = 330 + 42 * Math.sin(elapsed * 0.45 + particle.phase + i * 0.04);
        const alpha = 0.45 + particle.depth * 0.42;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${particle.size}px ${fontStack}`;
        ctx.fillStyle = `hsl(${hue}, 92%, 76%)`;
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.5)`;
        ctx.shadowBlur = 9;
        ctx.fillText(particle.text, x, y);
        ctx.restore();
      }
    };

    const drawCenterPhrase = () => {
      const index = Math.floor(elapsed / phraseSeconds) % phrases.length;
      const [language, phrase] = phrases[index];
      const cycle = (elapsed % phraseSeconds) / phraseSeconds;
      const fade = Math.min(1, cycle * 4, (1 - cycle) * 4);
      const maxPhraseSize = Math.min(78, Math.max(38, width * 0.1));
      const phraseSize = Math.max(
        30,
        Math.min(maxPhraseSize, (width * 0.86) / Math.max(8, phrase.length * 0.54)),
      );
      const centerY = height * 0.49 + Math.sin(elapsed * 3.2) * 4;

      drawGlowText(ctx, phrase, width / 2, centerY, phraseSize, "#fff0f7", fade);
      drawGlowText(
        ctx,
        language,
        width / 2,
        centerY + phraseSize * 0.56 + 34,
        Math.max(18, phraseSize * 0.28),
        "#94edff",
        fade * 0.9,
        500,
      );
    };

    const drawSparks = (dt: number) => {
      sparks = sparks.filter((spark) => {
        spark.life -= dt;
        if (spark.life <= 0) return false;

        spark.vy += 100 * dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        const alpha = Math.max(0, spark.life / spark.maxLife);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${spark.size}px ${fontStack}`;
        ctx.fillStyle = `hsl(${spark.hue * 360}, 95%, 75%)`;
        ctx.shadowColor = `hsla(${spark.hue * 360}, 100%, 70%, 0.7)`;
        ctx.shadowBlur = 10;
        ctx.fillText(spark.text, spark.x, spark.y);
        ctx.restore();
        return true;
      });
    };

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      elapsed += dt;

      drawBackground();
      drawHeartWords();
      drawCenterPhrase();
      drawSparks(dt);

      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", burst);
    const rebuild = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") particles = makeParticles();
    };
    window.addEventListener("keydown", rebuild);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", burst);
      window.removeEventListener("keydown", rebuild);
    };
  }, []);

  return (
    <main className="love-stage" aria-label="Animated heart made from I love you in many languages">
      <canvas ref={canvasRef} className="love-canvas" />
      <div className="signature" aria-hidden="true">
        for you
      </div>
    </main>
  );
}

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the love heart page shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>I Love You<\/title>/i);
  assert.match(
    html,
    /A soft romantic heart animation with love-note cards and sweet messages\./,
  );
  assert.match(html, /<meta property="og:image" content="http:\/\/localhost(?::3000)?\/og\.png"\/>/);
  assert.match(html, /<main class="love-stage"/);
  assert.match(html, /aria-label="Animated love messages forming a heart"/);
  assert.match(html, /<canvas class="love-canvas"><\/canvas>/);
  assert.match(html, /<source src="\/love-me\.mp3" type="audio\/mpeg"\/>/);
  assert.match(html, /class="music-toggle"/);
  assert.match(html, /<div class="signature" aria-hidden="true">for you<\/div>/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|react-loading-skeleton/);
});

test("keeps the animation content and lovely styling in source", async () => {
  const [loveHeart, globals, layout] = await Promise.all([
    readFile(new URL("../app/LoveHeart.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(loveHeart, /const phrases = \[/);
  assert.match(loveHeart, /text: "I love you"/);
  assert.match(loveHeart, /const scatterMessages = \[/);
  assert.match(loveHeart, /\\u8eab\\u4f53\\u5065\\u5eb7/);
  assert.match(loveHeart, /\\u522b\\u71ac\\u591c/);
  assert.match(loveHeart, /\\u5145\\u5b9e\\u81ea\\u5df1/);
  assert.match(loveHeart, /card\.scatterImage = renderCardImage/);
  assert.match(loveHeart, /textMix/);
  assert.match(loveHeart, /src="\/love-me\.mp3"/);
  assert.match(loveHeart, /aria-label=\{isMusicPlaying/);
  assert.match(loveHeart, /startMusic\(\);/);
  assert.match(loveHeart, /Math\.min\(elapsed, cycleSeconds\)/);
  assert.match(loveHeart, /bg\.addColorStop\(0, "#34121f"\)/);
  assert.match(loveHeart, /"#ffd9e7"/);

  assert.match(globals, /--background:\s*#34121f/);
  assert.match(globals, /\.love-canvas/);
  assert.match(globals, /\.signature/);
  assert.match(globals, /\.music-toggle/);
  assert.match(layout, /A soft romantic heart animation with love-note cards and sweet messages\./);
});

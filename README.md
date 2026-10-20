# Heart Love

A small romantic web experience that draws a heart from floating love-note cards.
It opens on a quiet start screen, then begins its animation and music when the
visitor taps the screen.

**Live site:** [heart-love-zeta.vercel.app](https://heart-love-zeta.vercel.app)

## Features

- Full-screen animated heart made from stacked message cards.
- Centered cursive "Tap to begin" start screen for mobile-friendly music playback.
- "I love you" translations during the heart-drawing phase.
- Chinese care messages during the spread-out phase:
  `身体健康`, `别熬夜`, `顺顺利利`, `保持好心情`, `好好吃饭`, `天天开心`,
  `好好爱自己`, `我爱你`, `我想你了`, `多喝水呀`, `充实自己`.
- Soft rose/pastel visual style designed to feel lovely instead of cyber.
- Background music from `public/love-me.mp3`, with a pause/play control after starting.
- The animation settles on its final message-filled scene instead of looping.
  Tap the screen again to replay the animation from the beginning.
- Proportional, contained heart sizing for phone portrait and tablet landscape screens.
- Link preview image in `public/og.png`.

## Run Locally

```powershell
npm install
npm run dev
```

Then open the local URL shown by the dev server.

## Build

The regular build is used for the local Vinext/Cloudflare preview:

```powershell
npm run build
```

For Vercel's Next.js build:

```powershell
npm run build:vercel
```

## Test

```powershell
npm test
```

## Customize

Edit [app/LoveHeart.tsx](app/LoveHeart.tsx):

- `phrases` controls the "I love you" translations used while the heart forms.
- `scatterMessages` controls the Chinese messages shown when the cards spread out.
- `cardColors` and `drawBackground()` control the romantic color palette.
- `public/love-me.mp3` is the background song. Replace it with another MP3 using
  the same filename, or update the audio source in `LoveHeart.tsx`.

Edit [app/layout.tsx](app/layout.tsx) to change the page title, description, and
social preview metadata.

## Deploy To Vercel

1. Import this GitHub repository in Vercel.
2. Select the `Next.js` framework preset.
3. Set the build command to `npm run build:vercel`.
4. Leave the output directory empty.
5. Deploy.

Vercel will provide a public `vercel.app` link that can be shared directly.

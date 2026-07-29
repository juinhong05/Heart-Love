# Heart Love

A soft romantic web animation that draws a heart from floating love-note cards.
The heart starts with "I love you" in different languages, then the cards spread
out and switch to warm Chinese care messages.

## Features

- Full-screen animated heart made from stacked message cards.
- "I love you" translations during the heart-drawing phase.
- Chinese care messages during the spread-out phase:
  `身体健康`, `别熬夜`, `顺顺利利`, `保持好心情`, `好好吃饭`, `天天开心`,
  `好好爱自己`, `我爱你`, `我想你了`, `多喝水呀`, `充实自己`.
- Soft rose/pastel visual style designed to feel lovely instead of cyber.
- Responsive canvas layout for desktop and phone screens.
- Link preview image in `public/og.png`.

## Run Locally

```powershell
npm install
npm run dev
```

Then open the local URL shown by the dev server.

## Build

```powershell
npm run build
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

Edit [app/layout.tsx](app/layout.tsx) to change the page title, description, and
social preview metadata.

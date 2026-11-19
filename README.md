# Vice Sunset — GTA-style Cover Art Maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun](https://make.fun/badge/gta6-cover-art-01/daviddika/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun](https://make.fun/badge/gta6-cover-art-01/daviddika/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your own photo into a GTA-style multi-panel cover: a big hero panel, two
smaller panels, bold caption lettering over a Vice City sunset (or neon, or
Vice Nights) colour grade — exported as a PNG in 1080×1080, 1080×1350 or
1920×1080.

## How it works

1. Add your photos (or start with the two free samples) — click a thumbnail
   to put it in the selected panel.
2. Crop each panel: drag the live preview to pan, scroll to zoom, or use the
   per-panel sliders.
3. Write the title, subtitle and place tag; pick the title size, colour and
   position.
4. Pick a look — Sunset, Neon or Vice Nights — and a size, then export the PNG.

Everything runs offline in the browser from the static files in `app/`. Photos
are read on your own machine and never uploaded. No build step: serve `app/`
with any static server (`node serve.ts`, then open http://localhost:8080).

## Originality

An original design — no Rockstar Games logo, wordmark, artwork, character or
font. Display type is Anton and Archivo Black, both under the SIL Open Font
License and vendored under `app/fonts/` with the licence file. The sample
photos under `app/samples/` were made for make.fun and are free to use.

## Files

- `app/index.html` — the editor page
- `app/src/cover.js` — the cover engine (panels, grade, caption band, grain)
- `app/src/main.js` — editor wiring (photos, panels, export)
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots
- `app/style.css` — editor styling
- `main.ts` — hands the app in via `vendor/makefun-app.ts`

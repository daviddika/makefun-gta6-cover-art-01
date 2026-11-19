// Fixed scenes for screenshots. ?shot=cover shows the exported cover alone,
// full-bleed; ?shot=editor shows the editor with a photo loaded. The query
// picks the look (?look=sunset|neon|nights), size (?size=square|portrait|wide),
// caption (?caption=...), subtitle and tag. window.__shotReady is set once
// the scene has painted, so a screenshot tool can wait for it.
import { drawCover } from './cover.js';

const SAMPLE_SRC = { boulevard: 'samples/boulevard.jpg', pier: 'samples/pier.jpg' };

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function ready() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

/** Applies a shot scene to the shared editor state, then redraws. */
export async function runShot(shot, query, state, photos, redraw) {
  const look = query.get('look');
  if (look && ['sunset', 'neon', 'nights'].includes(look)) state.lookKey = look;
  const size = query.get('size');
  if (size && ['square', 'portrait', 'wide'].includes(size)) state.sizeKey = size;
  if (query.get('caption')) state.caption.title = query.get('caption');
  if (query.get('subtitle')) state.caption.subtitle = query.get('subtitle');
  if (query.get('tag')) state.caption.tag = query.get('tag');

  // The shot's photos: ?photo=pier loads the pier sample into the hero panel,
  // ?photo2=... into panel 2, ?photo3=... into panel 3 (default: boulevard).
  const picks = [query.get('photo') ?? 'boulevard', query.get('photo2') ?? 'pier', query.get('photo3') ?? 'boulevard'];
  for (let i = 0; i < 3; i++) {
    const key = picks[i];
    const idx = key === 'pier' ? 1 : 0;
    state.panels[i].photo = idx;
    if (!photos[idx]) photos[idx] = await loadImage(SAMPLE_SRC[key]);
  }
  if (query.get('zoom')) state.panels[0].zoom = Number(query.get('zoom'));
  if (query.get('ox')) state.panels[0].ox = Number(query.get('ox'));
  if (query.get('oy')) state.panels[0].oy = Number(query.get('oy'));

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // Cover shots render at full export size on an offscreen canvas, then the
    // visible canvas shows that exact export — what the app writes is what
    // the screenshot shows.
    const off = document.createElement('canvas');
    drawCover(off, state, photos);
    const ctx = document.getElementById('cover').getContext('2d');
    const vis = document.getElementById('cover');
    vis.width = off.width;
    vis.height = off.height;
    ctx.drawImage(off, 0, 0);
    document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.sizeKey));
    document.querySelectorAll('[data-look]').forEach((b) => b.classList.toggle('active', b.dataset.look === state.lookKey));
  } else {
    redraw();
  }
  ready();
}

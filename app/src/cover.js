// Vice Sunset — the cover engine. Draws a multi-panel GTA-style poster:
// a big hero panel, two smaller panels, and a sunset caption band, with a
// colour grade (Sunset / Neon / Vice Nights), grain and vignette. All drawing
// is plain Canvas 2D; every photo is drawn from an <img> the user loaded
// locally, so nothing ever leaves the machine.

export const LOOKS = {
  sunset: {
    label: 'Sunset',
    band: ['#ff9a3d', '#ff5e62', '#c2187a', '#3b105f'],
    tint: 'rgba(255, 110, 60, 0.16)',
    glow: 'rgba(255, 190, 90, 0.85)',
    grade: 'warm',
  },
  neon: {
    label: 'Neon',
    band: ['#00e5ff', '#ff2fb3', '#7b2fff', '#12002e'],
    tint: 'rgba(255, 47, 179, 0.14)',
    glow: 'rgba(0, 229, 255, 0.8)',
    grade: 'cool',
  },
  nights: {
    label: 'Vice Nights',
    band: ['#ff7b00', '#8b1fa8', '#2b1a6e', '#0b0626'],
    tint: 'rgba(139, 31, 168, 0.20)',
    glow: 'rgba(255, 123, 0, 0.75)',
    grade: 'purple',
  },
};

export const SIZES = {
  square: { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
};

// Panel rectangles, in fractions of the cover, per size. Panel 0 is the hero.
export function panelLayout(sizeKey) {
  if (sizeKey === 'portrait') {
    return [
      { x: 0, y: 0, w: 1, h: 0.52 },
      { x: 0, y: 0.52, w: 0.5, h: 0.22 },
      { x: 0.5, y: 0.52, w: 0.5, h: 0.22 },
    ];
  }
  if (sizeKey === 'wide') {
    return [
      { x: 0, y: 0, w: 0.58, h: 0.78 },
      { x: 0.58, y: 0, w: 0.42, h: 0.39 },
      { x: 0.58, y: 0.39, w: 0.42, h: 0.39 },
    ];
  }
  return [
    { x: 0, y: 0, w: 0.62, h: 0.68 },
    { x: 0.62, y: 0, w: 0.38, h: 0.34 },
    { x: 0.62, y: 0.34, w: 0.38, h: 0.34 },
  ];
}

/** Where the caption band sits, in fractions of the cover height. */
export function bandLayout(sizeKey) {
  if (sizeKey === 'portrait') return { y: 0.74, h: 0.26 };
  if (sizeKey === 'wide') return { y: 0.78, h: 0.22 };
  return { y: 0.68, h: 0.32 };
}

function coverFit(img, rect, zoom, ox, oy) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const s = base * (zoom || 1);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  // ox/oy in [-1, 1]: 0 centres the photo, +1 pushes it to its far edge.
  const maxX = Math.max(0, (dw - rect.w) / 2);
  const maxY = Math.max(0, (dh - rect.h) / 2);
  return { x: rect.x - maxX + ox * maxX, y: rect.y - maxY + oy * maxY, w: dw, h: dh };
}

function drawPhotoPanel(ctx, img, rect, panel, look) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img) {
    const d = coverFit(img, rect, panel.zoom, panel.ox, panel.oy);
    ctx.drawImage(img, d.x, d.y, d.w, d.h);
  } else {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#3b105f');
    g.addColorStop(1, '#12002e');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  // Colour grade: warm wash + a soft top light, so panels feel like one shoot.
  ctx.fillStyle = look.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const top = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h * 0.45);
  top.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
  top.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = top;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Panel frame: thick white gutter line with a dark keyline.
  ctx.lineWidth = Math.max(3, rect.w * 0.008);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.lineWidth = Math.max(1, rect.w * 0.002);
  ctx.strokeStyle = 'rgba(10, 5, 20, 0.85)';
  ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
}

function drawSun(ctx, w, h, band, look) {
  const cy = band.y * h + band.h * h * 0.34;
  const cx = w * 0.86;
  const r = Math.min(w, h) * 0.115;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 2.2);
  glow.addColorStop(0, look.glow);
  glow.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Retro sun slats.
  ctx.fillStyle = look.band[1];
  for (let i = 0; i < 4; i++) {
    const sy = cy + r * (0.15 + i * 0.22);
    ctx.fillRect(cx - r, sy, r * 2, r * 0.05);
  }
}

function drawGrain(ctx, w, h, seed) {
  let s = seed || 7;
  const next = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.save();
  ctx.globalAlpha = 0.028;
  const step = Math.max(4, Math.round(w / 270));
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const v = next();
      if (v < 0.55) continue; // sparse speckle, not a solid noise field
      ctx.fillStyle = v > 0.78 ? '#ffffff' : '#000000';
      ctx.fillRect(x, y, step, step);
    }
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(10, 0, 25, 0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function fitCaption(ctx, text, maxW, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Archivo Black', sans-serif`;
  while (size > 20 && ctx.measureText(text).width > maxW) {
    size -= 4;
    ctx.font = `${size}px Anton, 'Archivo Black', sans-serif`;
  }
  return size;
}

/** Draws the caption band: sunset gradient, sun, big title, subtitle, tag. */
export function drawCaptionBand(ctx, w, h, sizeKey, caption, opts, look) {
  const band = bandLayout(sizeKey);
  const by = band.y * h;
  const bh = band.h * h;
  const grad = ctx.createLinearGradient(0, by, 0, by + bh);
  look.band.forEach((c, i) => grad.addColorStop(i / (look.band.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillRect(0, by, w, bh);
  // Horizon glow where the band meets the panels.
  const horizon = ctx.createLinearGradient(0, by - bh * 0.25, 0, by + bh * 0.3);
  horizon.addColorStop(0, 'rgba(255, 200, 110, 0)');
  horizon.addColorStop(0.5, 'rgba(255, 200, 110, 0.55)');
  horizon.addColorStop(1, 'rgba(255, 200, 110, 0)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, by - bh * 0.25, w, bh * 0.55);
  drawSun(ctx, w, h, band, look);

  const pad = w * 0.045;
  const title = (caption.title || 'SUNSET HEIST').trim().toUpperCase() || 'SUNSET HEIST';
  const baseSize = h * 0.115 * (opts.titleScale || 1);
  ctx.textBaseline = 'alphabetic';
  const size = fitCaption(ctx, title, w - pad * 2, baseSize);
  const titleY = by + bh * (opts.titleTop ? 0.42 : 0.62);
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = opts.outline ? '#14041f' : 'rgba(20, 4, 31, 0.9)';
  ctx.lineWidth = size * 0.14;
  ctx.strokeText(title, pad, titleY);
  ctx.fillStyle = opts.titleColor || '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.04;
  ctx.fillText(title, pad, titleY);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const sub = (caption.subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(18, size * 0.24);
    ctx.font = `${subSize}px 'Archivo Black', sans-serif`;
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(sub.toUpperCase(), pad, titleY + subSize * 1.5);
  }
  // Small location tag, bottom-right of the band, clear of the sun.
  const tag = (caption.tag || 'SUNSET CITY').trim().toUpperCase();
  const tagSize = Math.max(16, h * 0.018);
  ctx.font = `${tagSize}px 'Archivo Black', sans-serif`;
  ctx.textAlign = 'right';
  const tw = ctx.measureText(tag).width;
  ctx.fillStyle = 'rgba(10, 4, 24, 0.55)';
  ctx.fillRect(w - pad - tw - tagSize, by + bh * 0.80, tw + tagSize * 2, tagSize * 2.1);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(tag, w - pad, by + bh * 0.80 + tagSize * 1.5);
  ctx.textAlign = 'left';
}

/**
 * Draws the whole cover onto `canvas`.
 * state: { sizeKey, lookKey, panels: [{photo, zoom, ox, oy} x3], caption, titleScale, titleColor, outline, titleTop }
 * photos: array of <img> (or null) indexed by panel.photo.
 */
export function drawCover(canvas, state, photos) {
  const size = SIZES[state.sizeKey] || SIZES.square;
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  const ctx = canvas.getContext('2d');
  const { w, h } = size;
  const look = LOOKS[state.lookKey] || LOOKS.sunset;
  ctx.fillStyle = '#0b0626';
  ctx.fillRect(0, 0, w, h);
  const layout = panelLayout(state.sizeKey);
  const gutter = Math.max(6, Math.round(w * 0.008));
  layout.forEach((p, i) => {
    const rect = {
      x: p.x * w + (i === 0 ? 0 : gutter / 2) + (p.x === 0 ? 0 : 0),
      y: p.y * h,
      w: p.w * w - gutter,
      h: p.h * h,
    };
    // Inset the hero's right edge and the side panels so gutters read evenly.
    if (i > 0) rect.x = p.x * w + gutter;
    if (i === 0) rect.w = p.w * w - gutter / 2;
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    drawPhotoPanel(ctx, photos[panel.photo] || null, rect, panel, look);
  });
  drawCaptionBand(ctx, w, h, state.sizeKey, state.caption, {
    titleScale: state.titleScale,
    titleColor: state.titleColor,
    outline: state.outline !== false,
    titleTop: state.titleTop,
  }, look);
  drawGrain(ctx, w, h, 1234567);
  drawVignette(ctx, w, h);
}

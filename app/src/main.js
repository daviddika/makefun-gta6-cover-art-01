// Vice Sunset — the editor. Wires the panel controls, caption editor, looks
// and export buttons to the cover engine (./cover.js). Photos stay local:
// samples load from app/samples/, uploads are read with FileReader and kept
// as in-memory images, never sent anywhere.
import { drawCover, LOOKS, SIZES, panelLayout } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const panelList = document.getElementById('panels');
const photoStrip = document.getElementById('photoStrip');

const SAMPLES = [
  { name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { name: 'Pier', src: 'samples/pier.jpg' },
];

// photos[i] is an <img> (or null while it loads). Index 0/1 are the samples.
const photos = [null, null];
const photoNames = SAMPLES.map((s) => s.name);

const state = {
  sizeKey: 'square',
  lookKey: 'sunset',
  panels: [
    { photo: 0, zoom: 1.1, ox: 0, oy: 0.5 },
    { photo: 1, zoom: 1.1, ox: 0, oy: 0.3 },
    { photo: 0, zoom: 1.25, ox: 0.15, oy: 0.5 },
  ],
  caption: { title: 'Sunset Heist', subtitle: 'One last job in the city', tag: 'Sunset City' },
  titleScale: 1,
  titleColor: '#ffffff',
  outline: true,
  titleTop: false,
};

let fontsReady = false;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  for (let i = 0; i < SAMPLES.length; i++) {
    try { photos[i] = await loadImage(SAMPLES[i].src); } catch { photos[i] = null; }
  }
}

async function waitFonts() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('100px Anton'),
        document.fonts.load('40px "Archivo Black"'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    fontsReady = true;
  } catch { fontsReady = false; }
}

function redraw() {
  drawCover(canvas, state, photos);
}

/** Rebuilds the photo strip: one thumbnail per loaded photo, click to assign. */
function renderPhotoStrip() {
  photoStrip.innerHTML = '';
  photos.forEach((img, i) => {
    if (!img) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = `Use ${photoNames[i]} for the selected panel`;
    const t = document.createElement('img');
    t.src = img.src;
    t.alt = photoNames[i];
    b.appendChild(t);
    const label = document.createElement('span');
    label.textContent = photoNames[i];
    b.appendChild(label);
    b.addEventListener('click', () => {
      state.panels[selectedPanel].photo = i;
      renderPanels();
      redraw();
    });
    photoStrip.appendChild(b);
  });
}

let selectedPanel = 0;

/** Rebuilds the three panel cards (photo pick, zoom, position sliders). */
function renderPanels() {
  panelList.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const card = document.createElement('div');
    card.className = 'panel-card' + (i === selectedPanel ? ' selected' : '');
    card.addEventListener('click', () => { selectedPanel = i; renderPanels(); });

    const head = document.createElement('div');
    head.className = 'panel-head';
    head.textContent = i === 0 ? 'Hero panel — the big one' : `Panel ${i + 1}`;
    card.appendChild(head);

    const pick = document.createElement('select');
    pick.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    photos.forEach((img, pi) => {
      if (!img) return;
      const o = document.createElement('option');
      o.value = String(pi);
      o.textContent = photoNames[pi];
      if (panel.photo === pi) o.selected = true;
      pick.appendChild(o);
    });
    pick.addEventListener('change', () => {
      panel.photo = Number(pick.value);
      redraw();
    });
    card.appendChild(pick);

    card.appendChild(sliderRow('Zoom', 1, 2.5, 0.05, panel.zoom, (v) => { panel.zoom = v; redraw(); }));
    card.appendChild(sliderRow('Left–right', -1, 1, 0.05, panel.ox, (v) => { panel.ox = v; redraw(); }));
    card.appendChild(sliderRow('Up–down', -1, 1, 0.05, panel.oy, (v) => { panel.oy = v; redraw(); }));
    panelList.appendChild(card);
  });
}

function sliderRow(label, min, max, step, value, onInput) {
  const row = document.createElement('label');
  row.className = 'slider-row';
  const span = document.createElement('span');
  span.textContent = label;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener('input', () => onInput(Number(input.value)));
  row.appendChild(span);
  row.appendChild(input);
  return row;
}

function bindControls() {
  document.getElementById('title').addEventListener('input', (e) => {
    state.caption.title = e.target.value;
    redraw();
  });
  document.getElementById('subtitle').addEventListener('input', (e) => {
    state.caption.subtitle = e.target.value;
    redraw();
  });
  document.getElementById('tag').addEventListener('input', (e) => {
    state.caption.tag = e.target.value;
    redraw();
  });
  document.getElementById('titleSize').addEventListener('input', (e) => {
    state.titleScale = Number(e.target.value);
    redraw();
  });
  document.getElementById('titleColor').addEventListener('input', (e) => {
    state.titleColor = e.target.value;
    redraw();
  });
  document.getElementById('titleTop').addEventListener('change', (e) => {
    state.titleTop = e.target.checked;
    redraw();
  });

  document.querySelectorAll('[data-look]').forEach((b) => {
    b.addEventListener('click', () => {
      state.lookKey = b.dataset.look;
      document.querySelectorAll('[data-look]').forEach((x) => x.classList.toggle('active', x === b));
      redraw();
    });
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      state.sizeKey = b.dataset.size;
      document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x === b));
      redraw();
    });
  });

  document.getElementById('shuffle').addEventListener('click', () => {
    const order = state.panels.map((p) => p.photo);
    state.panels.forEach((p, i) => { p.photo = order[(i + 1) % order.length]; });
    renderPanels();
    redraw();
  });
  document.getElementById('fillOne').addEventListener('click', () => {
    const hero = state.panels[0].photo;
    state.panels.forEach((p) => { p.photo = hero; });
    renderPanels();
    redraw();
  });

  document.getElementById('uploads').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        photos.push(img);
        photoNames.push(file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'Photo');
      } catch { /* unreadable file: skip it */ }
    }
    renderPhotoStrip();
    renderPanels();
    redraw();
    statusEl.textContent = `${photos.length - 2} of your photos added — click one to use it.`;
  });

  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => exportCover(b.dataset.export));
  });

  // Drag on the preview pans the selected panel's photo.
  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    const layout = panelLayout(state.sizeKey);
    const hit = layout.findIndex((p) => fx >= p.x && fx < p.x + p.w && fy >= p.y && fy < p.y + p.h);
    if (hit < 0) return;
    selectedPanel = hit;
    renderPanels();
    dragging = { x: e.clientX, y: e.clientY, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    const p = state.panels[selectedPanel];
    p.ox = clamp(dragging.ox + ((e.clientX - dragging.x) / r.width) * 2, -1, 1);
    p.oy = clamp(dragging.oy + ((e.clientY - dragging.y) / r.height) * 2, -1, 1);
    redraw();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; renderPanels(); });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[selectedPanel];
    p.zoom = clamp(p.zoom * (e.deltaY < 0 ? 1.08 : 0.93), 1, 2.5);
    redraw();
    renderPanels();
  }, { passive: false });
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

/** Renders the cover at full export size and downloads it as a PNG. */
export function exportCover(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  const savedSize = state.sizeKey;
  state.sizeKey = sizeKey;
  drawCover(off, state, photos);
  state.sizeKey = savedSize;
  redraw();
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-sunset-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Saved vice-sunset-${size.w}x${size.h}.png (${LOOKS[state.lookKey].label} look).`;
  }, 'image/png');
}

export { state, photos, loadImage, redraw };

bindControls();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  await loadSamples();
  await waitFonts();
  renderPhotoStrip();
  renderPanels();
  runShot(shot, new URLSearchParams(location.search), state, photos, redraw);
} else {
  await loadSamples();
  await waitFonts();
  renderPhotoStrip();
  renderPanels();
  redraw();
}

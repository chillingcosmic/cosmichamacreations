const canvas = document.getElementById('beadCanvas');
const ctx = canvas.getContext('2d');

const gridWidthInput = document.getElementById('gridWidth');
const gridHeightInput = document.getElementById('gridHeight');
const beadSizeInput = document.getElementById('beadSize');
const toggleGridInput = document.getElementById('toggleGrid');
const imageInput = document.getElementById('imageInput');
const colorSteps = document.getElementById('colorSteps');
const colorStepsValue = document.getElementById('colorStepsValue');
const shareLink = document.getElementById('shareLink');

const paletteContainer = document.getElementById('palette');

const hamaPalette = [
  '#ffffff', '#f8d5d8', '#ee5d6c', '#bc1f3f', '#f68c34', '#ffd661', '#e0f0a2', '#8dc63f',
  '#2f8f5b', '#57c7d4', '#1f7ca6', '#3353a1', '#6957a8', '#b986cb', '#8a4d2a', '#5f3a1f',
  '#1e1e1e', '#9ca2a8', '#dce2ea', '#f8b9a0', '#e1785e', '#c95a3f', '#fbe2b7', '#ecc594'
];

let gridW = Number(gridWidthInput.value);
let gridH = Number(gridHeightInput.value);
let beadSizeMm = Number(beadSizeInput.value);
let activeColor = hamaPalette[0];
let showGrid = true;
let drawing = false;
let beads = [];

function initBeads(fill = null) {
  beads = Array.from({ length: gridH }, () => Array.from({ length: gridW }, () => fill));
}

function createPalette() {
  paletteContainer.innerHTML = '';
  hamaPalette.forEach((color) => {
    const button = document.createElement('button');
    button.className = 'palette-btn';
    button.style.background = color;
    button.title = color;
    if (color === activeColor) button.classList.add('active');

    button.addEventListener('click', () => {
      activeColor = color;
      document.querySelectorAll('.palette-btn').forEach((el) => el.classList.remove('active'));
      button.classList.add('active');
    });
    paletteContainer.appendChild(button);
  });
}

function resizeCanvas() {
  const maxDimension = 900;
  const cellSize = Math.floor(Math.min(maxDimension / gridW, maxDimension / gridH));
  canvas.width = cellSize * gridW;
  canvas.height = cellSize * gridH;
}

function drawBasePegboard(size) {
  ctx.fillStyle = '#f6f6f3';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pegRadius = size * 0.14;
  ctx.fillStyle = '#d8d8d2';

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const centerX = x * size + size / 2;
      const centerY = y * size + size / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pegRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGridLines(size) {
  if (!showGrid) return;

  ctx.strokeStyle = '#c8c8bf';
  ctx.lineWidth = 1;

  for (let x = 0; x <= gridW; x++) {
    const px = x * size;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= gridH; y++) {
    const py = y * size;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
    ctx.stroke();
  }
}

function drawBead(centerX, centerY, radius, color) {
  const ringThickness = radius * 0.34;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00000024';
  ctx.beginPath();
  ctx.arc(centerX + radius * 0.15, centerY + radius * 0.2, radius * 0.85, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#00000020';
  ctx.lineWidth = Math.max(1, radius * 0.08);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.94, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff33';
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.25, centerY - radius * 0.25, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f7f7f2';
  ctx.beginPath();
  ctx.arc(centerX, centerY, Math.max(radius - ringThickness, radius * 0.38), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d5d5ce';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const size = canvas.width / gridW;
  drawBasePegboard(size);

  beads.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) return;

      const centerX = x * size + size / 2;
      const centerY = y * size + size / 2;
      const radius = size * 0.45;
      drawBead(centerX, centerY, radius, cell);
    });
  });

  drawGridLines(size);
}

function pointerToCell(evt) {
  const rect = canvas.getBoundingClientRect();
  const relX = ((evt.clientX - rect.left) / rect.width) * canvas.width;
  const relY = ((evt.clientY - rect.top) / rect.height) * canvas.height;
  const size = canvas.width / gridW;
  return {
    x: Math.floor(relX / size),
    y: Math.floor(relY / size)
  };
}

function paintCell(evt) {
  const { x, y } = pointerToCell(evt);
  if (x < 0 || y < 0 || x >= gridW || y >= gridH) return;
  beads[y][x] = activeColor;
  drawBoard();
}

function nearestPaletteColor(r, g, b) {
  let best = hamaPalette[0];
  let bestDistance = Infinity;

  hamaPalette.forEach((hex) => {
    const [pr, pg, pb] = hexToRgb(hex);
    const distance = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = hex;
    }
  });

  return best;
}

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function quantize(value, levels) {
  if (levels <= 1) return value;
  const step = 255 / (levels - 1);
  return Math.round(value / step) * step;
}

function convertImageToPattern(file) {
  if (!file) return;

  const image = new Image();
  const reader = new FileReader();

  reader.onload = () => {
    image.src = String(reader.result);
  };

  image.onload = () => {
    const temp = document.createElement('canvas');
    temp.width = gridW;
    temp.height = gridH;
    const tCtx = temp.getContext('2d');
    tCtx.drawImage(image, 0, 0, gridW, gridH);

    const imgData = tCtx.getImageData(0, 0, gridW, gridH);
    const levels = Number(colorSteps.value);

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const idx = (y * gridW + x) * 4;
        const alpha = imgData.data[idx + 3];
        if (alpha < 30) {
          beads[y][x] = null;
          continue;
        }

        const qr = quantize(imgData.data[idx], levels);
        const qg = quantize(imgData.data[idx + 1], levels);
        const qb = quantize(imgData.data[idx + 2], levels);
        beads[y][x] = nearestPaletteColor(qr, qg, qb);
      }
    }

    drawBoard();
  };

  reader.readAsDataURL(file);
}

function exportBlueprint() {
  const link = document.createElement('a');
  link.download = `hama-blueprint-${gridW}x${gridH}-${beadSizeMm}mm.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function encodeState() {
  const payload = {
    version: 1,
    w: gridW,
    h: gridH,
    bead: beadSizeMm,
    grid: showGrid,
    data: beads
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeState(encoded) {
  const decoded = decodeURIComponent(escape(atob(encoded)));
  return JSON.parse(decoded);
}

function applyState(state) {
  if (!state || !state.data || !state.w || !state.h) return;
  gridW = Number(state.w);
  gridH = Number(state.h);
  beadSizeMm = Number(state.bead || 5);
  showGrid = Boolean(state.grid);

  gridWidthInput.value = String(gridW);
  gridHeightInput.value = String(gridH);
  beadSizeInput.value = String(beadSizeMm);
  toggleGridInput.checked = showGrid;

  resizeCanvas();
  beads = state.data;
  drawBoard();
}

function rebuildGrid() {
  gridW = Number(gridWidthInput.value);
  gridH = Number(gridHeightInput.value);
  beadSizeMm = Number(beadSizeInput.value);
  showGrid = toggleGridInput.checked;

  initBeads(null);
  resizeCanvas();
  drawBoard();
}

canvas.addEventListener('pointerdown', (evt) => {
  drawing = true;
  paintCell(evt);
});

canvas.addEventListener('pointermove', (evt) => {
  if (!drawing) return;
  paintCell(evt);
});

window.addEventListener('pointerup', () => {
  drawing = false;
});

document.getElementById('applyGridBtn').addEventListener('click', rebuildGrid);
document.getElementById('clearBtn').addEventListener('click', () => {
  initBeads(null);
  drawBoard();
});
document.getElementById('downloadBtn').addEventListener('click', exportBlueprint);
document.getElementById('convertBtn').addEventListener('click', () => {
  convertImageToPattern(imageInput.files?.[0]);
});
document.getElementById('shareBtn').addEventListener('click', () => {
  const encoded = encodeState();
  const url = `${window.location.origin}${window.location.pathname}#blueprint=${encoded}`;
  shareLink.value = url;
  navigator.clipboard.writeText(url).catch(() => {
    /* clipboard may be unavailable */
  });
});

toggleGridInput.addEventListener('change', () => {
  showGrid = toggleGridInput.checked;
  drawBoard();
});

colorSteps.addEventListener('input', () => {
  colorStepsValue.textContent = colorSteps.value;
});

function bootFromHash() {
  if (!window.location.hash.startsWith('#blueprint=')) return;
  const encoded = window.location.hash.replace('#blueprint=', '').trim();
  if (!encoded) return;

  try {
    applyState(decodeState(encoded));
  } catch {
    console.warn('Blueprint non valido nel link condiviso.');
  }
}

createPalette();
rebuildGrid();
bootFromHash();

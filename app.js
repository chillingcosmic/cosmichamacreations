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
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const toolButtons = document.querySelectorAll('.paint-tool-btn');

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
let activeTool = 'pencil';
let showGrid = true;
let pointerDown = false;
let beads = [];
let hoverCell = null;
let dragStartCell = null;
let previewCells = [];

const historyPast = [];
const historyFuture = [];
const HISTORY_LIMIT = 80;

function cloneBeads(data) {
  return data.map((row) => [...row]);
}

function pushHistorySnapshot() {
  historyPast.push(cloneBeads(beads));
  if (historyPast.length > HISTORY_LIMIT) {
    historyPast.shift();
  }
  historyFuture.length = 0;
  updateHistoryButtons();
}

function restoreSnapshot(snapshot) {
  beads = cloneBeads(snapshot);
  drawBoard();
}

function updateHistoryButtons() {
  undoBtn.disabled = historyPast.length === 0;
  redoBtn.disabled = historyFuture.length === 0;
}

function resetHistory() {
  historyPast.length = 0;
  historyFuture.length = 0;
  updateHistoryButtons();
}

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
      drawBoard();
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
  ctx.fillStyle = '#b8a493';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pegRadius = size * 0.14;
  ctx.fillStyle = '#877767';

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

  ctx.strokeStyle = '#635549';
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

function drawBead(centerX, centerY, radius, color, opacity = 1) {
  const innerHoleRadius = radius * 0.32;
  const isWhiteBead = String(color).toLowerCase() === '#ffffff';
  ctx.save();
  ctx.globalAlpha = opacity;

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

  ctx.strokeStyle = isWhiteBead ? '#5f5348b8' : '#00000020';
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
  ctx.arc(centerX, centerY, innerHoleRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d5d5ce';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPreview(size) {
  const toDraw = new Map();

  if (!pointerDown && hoverCell && (activeTool === 'pencil' || activeTool === 'eraser')) {
    toDraw.set(`${hoverCell.x},${hoverCell.y}`, {
      x: hoverCell.x,
      y: hoverCell.y,
      color: activeTool === 'eraser' ? '#ffffff' : activeColor,
      opacity: activeTool === 'eraser' ? 0.25 : 0.45
    });
  }

  previewCells.forEach((cell) => {
    toDraw.set(`${cell.x},${cell.y}`, {
      ...cell,
      opacity: cell.opacity ?? 0.45,
      color: cell.color ?? activeColor
    });
  });

  toDraw.forEach((cell) => {
    if (!isValidCell(cell.x, cell.y)) return;
    const centerX = cell.x * size + size / 2;
    const centerY = cell.y * size + size / 2;
    const radius = size * 0.45;
    drawBead(centerX, centerY, radius, cell.color, cell.opacity);
  });
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

  drawPreview(size);
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

function isValidCell(x, y) {
  return x >= 0 && y >= 0 && x < gridW && y < gridH;
}

function setCell(x, y, color) {
  if (!isValidCell(x, y)) return false;
  const nextColor = color ?? null;
  if (beads[y][x] === nextColor) return false;
  // Every cell contains at most one bead; repainting replaces the old color.
  beads[y][x] = nextColor;
  return true;
}

function paintSingleCell(cell) {
  if (!isValidCell(cell.x, cell.y)) return false;
  if (activeTool === 'eraser') return setCell(cell.x, cell.y, null);
  return setCell(cell.x, cell.y, activeColor);
}

function floodFill(startX, startY, targetColor) {
  if (!isValidCell(startX, startY)) return false;
  const sourceColor = beads[startY][startX];
  if (sourceColor === targetColor) return false;

  const queue = [[startX, startY]];
  const visited = new Set();
  let changed = false;

  while (queue.length) {
    const [x, y] = queue.shift();
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (!isValidCell(x, y)) continue;
    if (beads[y][x] !== sourceColor) continue;

    beads[y][x] = targetColor;
    changed = true;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return changed;
}

function getLineCells(a, b) {
  const cells = [];
  let x0 = a.x;
  let y0 = a.y;
  const x1 = b.x;
  const y1 = b.y;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    cells.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }

  return cells;
}

function getRectCells(a, b) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const cells = [];

  for (let x = minX; x <= maxX; x++) {
    cells.push({ x, y: minY }, { x, y: maxY });
  }
  for (let y = minY; y <= maxY; y++) {
    cells.push({ x: minX, y }, { x: maxX, y });
  }

  return cells;
}

function getCircleCells(a, b) {
  const cx = Math.floor((a.x + b.x) / 2);
  const cy = Math.floor((a.y + b.y) / 2);
  const rx = Math.max(1, Math.floor(Math.abs(b.x - a.x) / 2));
  const ry = Math.max(1, Math.floor(Math.abs(b.y - a.y) / 2));
  const cells = [];

  for (let y = cy - ry - 1; y <= cy + ry + 1; y++) {
    for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const d = (nx * nx) + (ny * ny);
      if (d > 0.7 && d < 1.3) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

function getShapeCells(start, end) {
  if (!start || !end) return [];
  if (activeTool === 'line') return getLineCells(start, end);
  if (activeTool === 'rect') return getRectCells(start, end);
  if (activeTool === 'circle') return getCircleCells(start, end);
  return [];
}

function applyCells(cells, color) {
  let changed = false;
  cells.forEach(({ x, y }) => {
    if (setCell(x, y, color)) changed = true;
  });
  return changed;
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
    pushHistorySnapshot();

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
    updateHistoryButtons();
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
  resetHistory();
  drawBoard();
}

function rebuildGrid() {
  gridW = Number(gridWidthInput.value);
  gridH = Number(gridHeightInput.value);
  beadSizeMm = Number(beadSizeInput.value);
  showGrid = toggleGridInput.checked;

  initBeads(null);
  resizeCanvas();
  resetHistory();
  drawBoard();
}

function clearPreview() {
  previewCells = [];
}

function applyCurrentShape(endCell) {
  const cells = getShapeCells(dragStartCell, endCell);
  return applyCells(cells, activeColor);
}

function onPointerDown(evt) {
  pointerDown = true;
  const cell = pointerToCell(evt);
  hoverCell = isValidCell(cell.x, cell.y) ? cell : null;

  if (!hoverCell) return;

  if (activeTool === 'bucket') {
    pushHistorySnapshot();
    const color = activeColor;
    if (!floodFill(hoverCell.x, hoverCell.y, color)) {
      historyPast.pop();
      updateHistoryButtons();
    }
    drawBoard();
    pointerDown = false;
    return;
  }

  if (activeTool === 'pencil' || activeTool === 'eraser') {
    pushHistorySnapshot();
    if (!paintSingleCell(hoverCell)) {
      historyPast.pop();
      updateHistoryButtons();
    }
    drawBoard();
    return;
  }

  dragStartCell = hoverCell;
  previewCells = getShapeCells(dragStartCell, hoverCell).map((c) => ({ ...c, color: activeColor, opacity: 0.45 }));
  drawBoard();
}

function onPointerMove(evt) {
  const cell = pointerToCell(evt);
  hoverCell = isValidCell(cell.x, cell.y) ? cell : null;

  if (!pointerDown || !hoverCell) {
    drawBoard();
    return;
  }

  if (activeTool === 'pencil' || activeTool === 'eraser') {
    paintSingleCell(hoverCell);
    drawBoard();
    return;
  }

  if (activeTool === 'line' || activeTool === 'rect' || activeTool === 'circle') {
    previewCells = getShapeCells(dragStartCell, hoverCell).map((c) => ({ ...c, color: activeColor, opacity: 0.45 }));
    drawBoard();
  }
}

function onPointerUp(evt) {
  if (!pointerDown) return;
  pointerDown = false;

  const cell = pointerToCell(evt);
  const endCell = isValidCell(cell.x, cell.y) ? cell : hoverCell;

  if (endCell && (activeTool === 'line' || activeTool === 'rect' || activeTool === 'circle')) {
    pushHistorySnapshot();
    if (!applyCurrentShape(endCell)) {
      historyPast.pop();
      updateHistoryButtons();
    }
  }

  dragStartCell = null;
  clearPreview();
  drawBoard();
}

function handlePointerLeave() {
  hoverCell = null;
  if (!pointerDown) clearPreview();
  drawBoard();
}

function undo() {
  if (historyPast.length === 0) return;
  historyFuture.push(cloneBeads(beads));
  const snapshot = historyPast.pop();
  restoreSnapshot(snapshot);
  updateHistoryButtons();
}

function redo() {
  if (historyFuture.length === 0) return;
  historyPast.push(cloneBeads(beads));
  const snapshot = historyFuture.pop();
  restoreSnapshot(snapshot);
  updateHistoryButtons();
}

function setActiveTool(tool) {
  activeTool = tool;
  toolButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
  clearPreview();
  drawBoard();
}

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('pointerleave', handlePointerLeave);
window.addEventListener('pointerup', onPointerUp);

document.getElementById('applyGridBtn').addEventListener('click', rebuildGrid);
document.getElementById('clearBtn').addEventListener('click', () => {
  pushHistorySnapshot();
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

toolButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setActiveTool(btn.dataset.tool);
  });
});

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

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
setActiveTool('pencil');
bootFromHash();
updateHistoryButtons();

import './style.css';
import { generateCP } from './cp/generate';
import { cpToSVG } from './cp/svg';
import { textToMaze } from './maze/font';
import { clearMaze, createMaze, resizeMaze, toggleLeft, toggleTop } from './maze/model';
import { randomMaze } from './maze/random';
import { deflattenMaze, flattenMaze } from './maze/serialize';
import { renderFrontView } from './render/frontView';
import { RESET_ANGLES, renderIso3D } from './render/iso3d';
import { renderMazeView } from './render/mazeView';
import { downloadText, svgElementToString } from './ui/download';
import { renderGadgetLegend } from './ui/explainer';

function el<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`missing #${id}`);
  return found as T;
}

const mazeEl = el<HTMLDivElement>('maze');
const d3El = el<HTMLDivElement>('d3');
const front3El = el<HTMLDivElement>('front3');
const cpEl = el<HTMLDivElement>('cp');
const textEl = el<HTMLTextAreaElement>('text');
const lock0El = el<HTMLInputElement>('lock0');
const frontEl = el<HTMLInputElement>('front');
const nxEl = el<HTMLSpanElement>('nx');
const nyEl = el<HTMLSpanElement>('ny');

const state = {
  maze: createMaze(6, 5),
  mazeIsText: false,
  angles: { ...RESET_ANGLES },
};

// --- restore state from the URL hash (#maze=...&text=...&lock0=1&front=1) ---
{
  const params = new URLSearchParams(location.hash.slice(1));
  const text = params.get('text');
  const flat = params.get('maze');
  if (text) {
    textEl.value = text;
    const m = textToMaze(text);
    if (m) {
      state.maze = m;
      state.mazeIsText = true;
    }
  } else if (flat) {
    const m = deflattenMaze(flat);
    if (m) state.maze = m;
  }
  lock0El.checked = params.get('lock0') === '1';
  frontEl.checked = params.get('front') === '1';
}

function updateHash(): void {
  const params = new URLSearchParams();
  if (state.mazeIsText) params.set('text', textEl.value);
  else params.set('maze', flattenMaze(state.maze));
  if (lock0El.checked) params.set('lock0', '1');
  if (frontEl.checked) params.set('front', '1');
  history.replaceState(null, '', `#${params.toString()}`);
}

let currentCP = '';

function render3D(): void {
  d3El.style.display = frontEl.checked ? 'none' : '';
  front3El.style.display = frontEl.checked ? '' : 'none';
  if (frontEl.checked) {
    front3El.replaceChildren(renderFrontView(state.maze));
  } else {
    const box = d3El.getBoundingClientRect();
    d3El.replaceChildren(
      renderIso3D(state.maze, state.angles, Math.max(box.width, 100), Math.max(box.height, 100)),
    );
  }
}

function renderAll(): void {
  nxEl.textContent = String(state.maze.nx);
  nyEl.textContent = String(state.maze.ny);
  mazeEl.replaceChildren(
    renderMazeView(state.maze, (kind, x, y) => {
      if (kind === 'top') toggleTop(state.maze, x, y);
      else toggleLeft(state.maze, x, y);
      state.mazeIsText = false;
      renderAll();
    }),
  );
  render3D();
  currentCP = cpToSVG(generateCP(state.maze, lock0El.checked));
  cpEl.innerHTML = currentCP;
  updateHash();
}

// --- controls ---
el('clear').addEventListener('click', () => {
  clearMaze(state.maze);
  state.mazeIsText = false;
  renderAll();
});

el('random').addEventListener('click', () => {
  state.maze = randomMaze(state.maze.nx, state.maze.ny);
  state.mazeIsText = false;
  renderAll();
});

function wireResize(id: string, dnx: number, dny: number): void {
  el(id).addEventListener('click', (event) => {
    const nx = Math.max(1, state.maze.nx + dnx);
    const ny = Math.max(1, state.maze.ny + dny);
    const shift = (event as MouseEvent).shiftKey;
    state.maze = resizeMaze(
      state.maze,
      nx,
      ny,
      shift ? nx - state.maze.nx : 0,
      shift ? ny - state.maze.ny : 0,
    );
    state.mazeIsText = false;
    renderAll();
  });
}
wireResize('nx+1', 1, 0);
wireResize('nx-1', -1, 0);
wireResize('ny+1', 0, 1);
wireResize('ny-1', 0, -1);

textEl.addEventListener('input', () => {
  const m = textToMaze(textEl.value);
  if (m) {
    state.maze = m;
    state.mazeIsText = true;
    renderAll();
  }
});

lock0El.addEventListener('change', renderAll);
frontEl.addEventListener('change', () => {
  render3D();
  updateHash();
});

// --- 3D view controls ---
el('d3reset').addEventListener('click', () => {
  state.angles = { ...RESET_ANGLES };
  render3D();
});
const nudge = (dy: number, dx: number) => () => {
  state.angles.yang += dy;
  state.angles.xang += dx;
  render3D();
};
el('d3-5+0').addEventListener('click', nudge(-5, 0));
el('d3+5+0').addEventListener('click', nudge(5, 0));
el('d3+0-5').addEventListener('click', nudge(0, -5));
el('d3+0+5').addEventListener('click', nudge(0, 5));

// Drag to rotate: 1 degree per pixel, as in the original.
d3El.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  const startX = event.screenX;
  const startY = event.screenY;
  const start = { ...state.angles };
  d3El.classList.add('dragging');
  d3El.setPointerCapture(event.pointerId);
  const move = (ev: PointerEvent) => {
    state.angles.xang = start.xang + (ev.screenY - startY);
    state.angles.yang = start.yang + (ev.screenX - startX);
    render3D();
  };
  const up = () => {
    d3El.classList.remove('dragging');
    d3El.removeEventListener('pointermove', move);
    d3El.removeEventListener('pointerup', up);
    d3El.removeEventListener('pointercancel', up);
  };
  d3El.addEventListener('pointermove', move);
  d3El.addEventListener('pointerup', up);
  d3El.addEventListener('pointercancel', up);
});

window.addEventListener('resize', render3D);

// --- downloads ---
el('downloadCP').addEventListener('click', () => downloadText('maze-cp.svg', currentCP));
el('downloadMaze').addEventListener('click', () => {
  const svg = mazeEl.querySelector('svg');
  if (svg) downloadText('maze.svg', svgElementToString(svg));
});
el('download3D').addEventListener('click', () => {
  const svg = (frontEl.checked ? front3El : d3El).querySelector('svg');
  if (svg) downloadText('maze-3d.svg', svgElementToString(svg));
});

renderGadgetLegend(el('gadget-legend'));
renderAll();

import './style.css';
import { cpToFOLD } from './cp/fold';
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
const foldEl = el<HTMLDivElement>('fold');
const cpEl = el<HTMLDivElement>('cp');
const textEl = el<HTMLTextAreaElement>('text');
const lock0El = el<HTMLInputElement>('lock0');
const nxEl = el<HTMLSpanElement>('nx');
const nyEl = el<HTMLSpanElement>('ny');

type View = '3d' | 'front' | 'fold';

const state = {
  maze: createMaze(6, 5),
  mazeIsText: false,
  angles: { ...RESET_ANGLES },
  mathOpen: false,
  view: '3d' as View,
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
  const view = params.get('view');
  if (view === 'front' || view === 'fold') state.view = view;
  else if (params.get('front') === '1') state.view = 'front'; // legacy links
  state.mathOpen = params.get('math') === '1';
}

function updateHash(): void {
  const params = new URLSearchParams();
  if (state.mazeIsText) params.set('text', textEl.value);
  else params.set('maze', flattenMaze(state.maze));
  if (lock0El.checked) params.set('lock0', '1');
  if (state.view !== '3d') params.set('view', state.view);
  if (state.mathOpen) params.set('math', '1');
  history.replaceState(null, '', `#${params.toString()}`);
}

let currentCP = '';

// --- embedded folding simulation (Origami Simulator by Amanda Ghassaei) ---
// The iframe is created lazily the first time the Fold view is opened. Once
// the simulator posts its 'ready' handshake, the current crease pattern is
// sent (and re-sent on every maze change) with fold angles encoded as line
// opacity — the same protocol the original app uses in a popup.
let simFrame: HTMLIFrameElement | null = null;
let simReady = false;
let simLastSent = '';

function sendToSimulator(): void {
  if (!simFrame?.contentWindow || !simReady) return;
  const svg = cpToSVG(generateCP(state.maze, lock0El.checked), 'simulator');
  if (svg === simLastSent) return;
  simLastSent = svg;
  simFrame.contentWindow.postMessage(
    { op: 'importSVG', svg, vertTol: 0.1, filename: 'maze.svg' },
    'https://origamisimulator.org',
  );
}

window.addEventListener('message', (event) => {
  const data = event.data as { from?: string; status?: string } | undefined;
  if (data && data.from === 'OrigamiSimulator' && data.status === 'ready') {
    simReady = true;
    sendToSimulator();
  }
});

function ensureSimulator(): void {
  if (simFrame) return;
  simFrame = document.createElement('iframe');
  simFrame.src = 'https://origamisimulator.org/?model=';
  simFrame.title = 'Origami Simulator';
  simFrame.allow = 'fullscreen';
  foldEl.appendChild(simFrame);
}

function renderRightPane(): void {
  d3El.style.display = state.view === '3d' ? '' : 'none';
  front3El.style.display = state.view === 'front' ? '' : 'none';
  foldEl.style.display = state.view === 'fold' ? '' : 'none';
  if (state.view === 'front') {
    front3El.replaceChildren(renderFrontView(state.maze));
  } else if (state.view === 'fold') {
    ensureSimulator();
    sendToSimulator();
  } else {
    const box = d3El.getBoundingClientRect();
    d3El.replaceChildren(
      renderIso3D(state.maze, state.angles, Math.max(box.width, 100), Math.max(box.height, 100)),
    );
  }
}

function setView(view: View): void {
  state.view = view;
  for (const id of ['view-3d', 'view-front', 'view-fold'] as const) {
    el(id).setAttribute('aria-pressed', String(id === `view-${view}`));
  }
  renderRightPane();
  updateHash();
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
  renderRightPane();
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
el('view-3d').addEventListener('click', () => setView('3d'));
el('view-front').addEventListener('click', () => setView('front'));
el('view-fold').addEventListener('click', () => setView('fold'));

// --- 3D view controls ---
el('d3reset').addEventListener('click', () => {
  state.angles = { ...RESET_ANGLES };
  renderRightPane();
});
const nudge = (dy: number, dx: number) => () => {
  state.angles.yang += dy;
  state.angles.xang += dx;
  renderRightPane();
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
    renderRightPane();
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

window.addEventListener('resize', renderRightPane);

el('simulate').addEventListener('click', () => setView('fold'));

// --- downloads ---
el('downloadCP').addEventListener('click', () => downloadText('maze-cp.svg', currentCP));
el('downloadFOLD').addEventListener('click', () =>
  downloadText('maze.fold', cpToFOLD(generateCP(state.maze, lock0El.checked)), 'application/json'),
);
el('downloadMaze').addEventListener('click', () => {
  const svg = mazeEl.querySelector('svg');
  if (svg) downloadText('maze.svg', svgElementToString(svg));
});
el('download3D').addEventListener('click', () => {
  // In the Fold view there is no local SVG; fall back to a fresh 3D render.
  const svg =
    (state.view === 'front' ? front3El : d3El).querySelector('svg') ??
    renderIso3D(state.maze, state.angles, 800, 600);
  downloadText('maze-3d.svg', svgElementToString(svg));
});

// --- "How the math works" drawer ---
const mathDrawer = el<HTMLElement>('mathDrawer');
const mathBackdrop = el<HTMLDivElement>('drawerBackdrop');
const mathBtn = el<HTMLButtonElement>('mathBtn');

function setMathOpen(open: boolean): void {
  state.mathOpen = open;
  mathDrawer.classList.toggle('open', open);
  mathBackdrop.hidden = !open;
  mathBtn.setAttribute('aria-expanded', String(open));
  updateHash();
}
mathBtn.addEventListener('click', () => setMathOpen(!state.mathOpen));
el('mathClose').addEventListener('click', () => setMathOpen(false));
mathBackdrop.addEventListener('click', () => setMathOpen(false));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.mathOpen) setMathOpen(false);
});

renderGadgetLegend(el('gadget-legend'));
renderAll();
setView(state.view); // sync the switcher buttons with hash-restored state
if (state.mathOpen) setMathOpen(true);

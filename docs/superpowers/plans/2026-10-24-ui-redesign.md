# Rediseño UI: afinador minimalista con arco — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la UI actual (regla, chips, glow) por una minimalista: blanco/gris sobre negro, un arco ∩ con un punto que recorre la desviación, lima al afinar, y todo lo que se mueve animado con CSS.

**Architecture:** Solo cambia `src/ui/` (más el color de tema en `index.html` y `vite.config.ts`). `Meter.tsx` pasa a `ArcMeter.tsx`: funciones puras testeadas (`meterHue`, `meterColor`, `arcAngle`, `traceDash`) + un componente SVG que recibe la nota como `children`. `app.css` se reescribe entero. La animación es CSS (transitions que se re-apuntan cada 40 ms; keyframes solo para entradas únicas).

**Tech Stack:** Preact 11 · TypeScript 6.0 · Vitest 5 · Vite 8. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-10-24-ui-redesign-design.md` (leer entera antes de empezar).

## Global Constraints

- Sin dependencias nuevas. Animación solo con CSS transitions/keyframes.
- Código e identificadores en inglés. Todo texto visible sale de `src/ui/strings.ts`.
- Tokens: `--bg: #0b0b0b`, `--fg: #f2f2f0`, `--dim: #555`, `--faint: #2a2a2a`, `--ok: #c6ff3d`, `--far: #ff5a4e`.
- Los únicos colores son el gradiente del medidor y el lima; el resto blanco/gris sobre negro.
- Sin bordes en controles, sin border-radius (salvo puntos circulares), sin chips, sin glow. Separación con hairlines de 1px `--faint`.
- Nota en sans fina (`'Helvetica Neue', system-ui, …`, peso 200); números (cents, Hz, notas de afinaciones) en monospace con `tabular-nums`.
- Botones: área táctil mínima 48px y `:focus-visible` visible (lima).
- `prefers-reduced-motion: reduce`: todo se reduce a fades de opacidad; punto y trazo saltan.
- Curvas: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`.
- `src/music/` y `src/audio/` no se tocan.

## Review Focus

1. **Fuera de rango (> ±50 cents):** el punto queda clavado en la punta del arco (no la pasa), el trazo cubre medio arco, color rojo, cents `>+50` / `<−50`. Test en Task 1 (`arcAngle` con ±80 y ±500).
2. **Silencio (`view === null`):** el punto vuelve al centro al 25%, sin trazo, cents/Hz vacíos, sin arco lima colgado. Test en Task 1 (`arcAngle(null)`, `traceDash(0)`); chequeo visual en Task 5.
3. **Nota más ancha en español (`Sol#` + octava) y guitarra de 8 cuerdas a 320px de ancho:** la nota entra dentro del arco y las 8 cuerdas entran en una fila sin desbordar. Chequeo en Task 5.
4. **Nombre de afinación largo en el header:** se corta con `…` y el `▾` sigue visible. CSS en Task 2, chequeo en Task 5.
5. **Permiso de micrófono denegado tras tocar ▶:** el botón vuelve a aparecer (no queda el arco vacío) y se ve el error en rojo. Lógica en Task 3, chequeo en Task 5.

---

### Task 1: Geometría y color del arco (funciones puras)

**Files:**
- Rename: `src/ui/components/Meter.tsx` → `src/ui/components/ArcMeter.tsx`
- Modify: `src/ui/screens/TunerScreen.tsx:5` (import)
- Test: `tests/meter.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces (en `src/ui/components/ArcMeter.tsx`):
  - `meterHue(absCents: number): number`
  - `meterColor(cents: number | null, outOfRange: boolean): string` — `'var(--fg)'` sin señal, `'var(--far)'` fuera de rango, `'var(--ok)'` con `|cents| <= 3`, si no `hsl(<hue> 90% 62%)`.
  - `arcAngle(cents: number | null): number` — grados desde la vertical, −90…+90, `null` → 0.
  - `traceDash(angle: number): string` — `stroke-dasharray` sobre un path de longitud 180.
  - (El componente `Meter` sigue exportado sin cambios hasta Task 2.)

- [ ] **Step 1: Renombrar el archivo y arreglar el import**

```bash
git mv src/ui/components/Meter.tsx src/ui/components/ArcMeter.tsx
```

En `src/ui/screens/TunerScreen.tsx` cambiar la línea 5:

```tsx
import { Meter, meterColor } from '../components/ArcMeter';
```

- [ ] **Step 2: Reescribir el test (falla)**

Reemplazar todo `tests/meter.test.ts` por:

```ts
import { describe, expect, it } from 'vitest';
import { arcAngle, meterColor, meterHue, traceDash } from '../src/ui/components/ArcMeter';

describe('meter color', () => {
  it('is lime in tune, amber mid-way, red far off', () => {
    expect(meterHue(0)).toBe(78);
    expect(meterHue(3)).toBe(78);
    expect(meterHue(15)).toBe(40);
    expect(meterHue(35)).toBe(6);
    expect(meterHue(80)).toBe(6);
  });

  it('interpolates between stops', () => {
    expect(meterHue(9)).toBeCloseTo(59, 5);
    expect(meterHue(25)).toBeCloseTo(23, 5);
  });

  it('uses the fixed colors for idle, out of range and in tune', () => {
    expect(meterColor(null, false)).toBe('var(--fg)');
    expect(meterColor(-60, true)).toBe('var(--far)');
    expect(meterColor(-2, false)).toBe('var(--ok)');
    expect(meterColor(3, false)).toBe('var(--ok)');
    expect(meterColor(9, false)).toBe('hsl(59 90% 62%)');
  });
});

describe('arc geometry', () => {
  it('maps ±50 cents to the arc ends and clamps beyond', () => {
    expect(arcAngle(null)).toBe(0);
    expect(arcAngle(0)).toBe(0);
    expect(arcAngle(25)).toBe(45);
    expect(arcAngle(-50)).toBe(-90);
    expect(arcAngle(80)).toBe(90);
    expect(arcAngle(-500)).toBe(-90);
  });

  it('draws the trace from the center toward the dot', () => {
    expect(traceDash(0)).toBe('0 90 0 360');
    expect(traceDash(45)).toBe('0 90 45 360');
    expect(traceDash(-45)).toBe('0 45 45 360');
    expect(traceDash(90)).toBe('0 90 90 360');
    expect(traceDash(-90)).toBe('0 0 90 360');
  });
});
```

- [ ] **Step 3: Correr y ver que falla**

Run: `npx vitest run tests/meter.test.ts`
Expected: FAIL (`arcAngle`/`traceDash` no existen; `meterHue(0)` da 145).

- [ ] **Step 4: Implementar**

En `src/ui/components/ArcMeter.tsx`, reemplazar `HUE_STOPS`, `meterHue` y `meterColor` por esto y agregar las dos funciones nuevas (el componente `Meter` y sus constantes quedan como están):

```tsx
// Hue stops by |cents|: lime when in tune, amber mid-way, red far off.
const HUE_STOPS: readonly [number, number][] = [
  [3, 78],
  [15, 40],
  [35, 6],
];

export function meterHue(absCents: number): number {
  if (absCents <= HUE_STOPS[0][0]) return HUE_STOPS[0][1];
  for (let i = 1; i < HUE_STOPS.length; i++) {
    const [a0, h0] = HUE_STOPS[i - 1];
    const [a1, h1] = HUE_STOPS[i];
    if (absCents <= a1) return h0 + ((h1 - h0) * (absCents - a0)) / (a1 - a0);
  }
  return HUE_STOPS[HUE_STOPS.length - 1][1];
}

export function meterColor(cents: number | null, outOfRange: boolean): string {
  if (cents === null) return 'var(--fg)';
  if (outOfRange) return 'var(--far)';
  const abs = Math.abs(cents);
  if (abs <= HUE_STOPS[0][0]) return 'var(--ok)';
  return `hsl(${meterHue(abs).toFixed(0)} 90% 62%)`;
}

/** Dot angle in degrees from vertical: −90 (left end) … +90 (right end). */
export function arcAngle(cents: number | null): number {
  if (cents === null) return 0;
  return (Math.max(-RANGE, Math.min(RANGE, cents)) / RANGE) * 90;
}

/** Dash pattern on the arc (pathLength 180, 1 unit = 1°) drawing from the center to the dot. */
export function traceDash(angle: number): string {
  return `0 ${90 + Math.min(0, angle)} ${Math.abs(angle)} 360`;
}
```

- [ ] **Step 5: Correr y ver que pasa**

Run: `npx vitest run tests/meter.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add -A src/ui/components tests/meter.test.ts src/ui/screens/TunerScreen.tsx
git commit -m "feat(ui): arc geometry and lime in-tune color"
```

---

### Task 2: Sistema visual + pantalla del afinador

**Files:**
- Rewrite: `src/ui/app.css`
- Modify: `src/ui/components/ArcMeter.tsx` (reemplazar el componente `Meter` por `ArcMeter`)
- Modify: `src/ui/screens/TunerScreen.tsx`
- Modify: `src/ui/components/StringList.tsx`
- Modify: `index.html:6`, `vite.config.ts:26-27` (color de tema)

**Interfaces:**
- Consumes: `arcAngle`, `traceDash`, `meterColor` de Task 1.
- Produces:
  - `ArcMeter({ cents, children }: { cents: number | null; children?: ComponentChildren })` — renderiza `.arc` (con `.idle` si `cents === null`), el SVG y `children` centrados abajo dentro del arco (`.arc-center`).
  - Clases CSS que usan Task 3 y 4: `.start`, `.start-btn`, `.start-btn.leaving`, `.error`, `.resume`, `.sheet*`, `.seg*`, `.tuning-list`, `.tuning`, `.name`, `.notes`, `.mark`, `.chroma`, `.sr-only`.

- [ ] **Step 1: Reemplazar el componente `Meter` por `ArcMeter`**

En `src/ui/components/ArcMeter.tsx`: borrar `TICKS`, `LABELS`, `tickHeight` y la función `Meter`. Dejar `RANGE`, `HUE_STOPS` y las funciones de Task 1. Agregar arriba el import y la constante del arco (`RANGE = 50` ya existe en el archivo), y al final el componente:

```tsx
import type { ComponentChildren } from 'preact';

// ∩ semicircle in SVG units: center (100,100), radius 90. pathLength 180 makes 1 unit = 1°.
const ARC = 'M10 100 A90 90 0 0 1 190 100';
```

```tsx
export function ArcMeter({ cents, children }: { cents: number | null; children?: ComponentChildren }) {
  const angle = arcAngle(cents);
  return (
    <div
      class={cents === null ? 'arc idle' : 'arc'}
      role="meter"
      aria-valuemin={-RANGE}
      aria-valuemax={RANGE}
      aria-valuenow={Math.round((angle / 90) * RANGE)}
    >
      <svg viewBox="0 0 200 110" aria-hidden="true">
        <path class="base" d={ARC} pathLength={180} />
        <path class="lock" d={ARC} pathLength={180} />
        <line class="zero" x1={100} y1={4} x2={100} y2={16} />
        <path class="trace" d={ARC} pathLength={180} style={{ strokeDasharray: traceDash(angle) }} />
        {/* Rotating the group around the arc center moves the dot along the curve. */}
        <g class="dot" style={{ transform: `rotate(${angle}deg)` }}>
          <circle cx={100} cy={10} r={5} />
        </g>
      </svg>
      <div class="arc-center">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Reescribir `TunerScreen.tsx`**

Reemplazar todo el archivo por:

```tsx
import { displayNote, type NoteNaming } from '../../music/notes';
import type { TunerView } from '../../music/tuner';
import type { Tuning } from '../../music/tunings';
import { ArcMeter, meterColor } from '../components/ArcMeter';
import { StringList } from '../components/StringList';
import { S, tuningLabel } from '../strings';

export interface TunerScreenProps {
  view: TunerView | null;
  tuning: Tuning;
  chromatic: boolean;
  naming: NoteNaming;
  confirmed: ReadonlySet<number>;
  suspended: boolean;
  onResume(): void;
  onOpenPicker(): void;
  onTitleTap(): void;
}

// Not shown: only read out by screen readers, and only when it changes.
function statusText(view: TunerView): string {
  if (view.outOfRange) return S.status.far;
  if (view.inTune) return S.status.inTune;
  return view.cents < 0 ? S.status.up : S.status.down;
}

function centsText(view: TunerView): string {
  const c = Math.round(view.cents);
  if (view.outOfRange) return c < 0 ? '<−50' : '>+50';
  return c > 0 ? `+${c}` : c < 0 ? `−${-c}` : '0';
}

export function TunerScreen(p: TunerScreenProps) {
  const { view } = p;
  const state = !view ? '' : view.outOfRange ? ' far' : view.inTune ? ' in-tune' : '';
  const shown = view ? displayNote(view.note, p.naming) : '—';
  const [, name, octave] = /^(.*?)(-?\d*)$/.exec(shown)!;
  return (
    <main
      class={`screen tuner${state}`}
      style={{ '--c': meterColor(view?.cents ?? null, !!view?.outOfRange) }}
    >
      <header>
        <h1 onClick={p.onTitleTap}>AFINADOR</h1>
        <button class="pick" onClick={p.onOpenPicker}>
          <span class="pick-text">{p.chromatic ? S.kinds.chromatic : tuningLabel(p.tuning)}</span>
          {!p.chromatic && (
            <small>
              {S.kinds[p.tuning.instrument]} {p.tuning.notes.length}
            </small>
          )}
          <span aria-hidden="true">▾</span>
        </button>
      </header>
      {p.suspended && (
        <button class="resume" onClick={p.onResume} aria-label="resume">
          ▶
        </button>
      )}
      <div class="dial">
        <ArcMeter cents={view?.cents ?? null}>
          <div class="note">
            {/* key remounts the span so the entry animation plays on every note change */}
            <span key={shown} class="note-inner">
              {name}
              <sub>{octave}</sub>
            </span>
          </div>
        </ArcMeter>
        <div class="readout">
          <div class="cents">{view && centsText(view)}</div>
          <div class="hz">{view && `${view.freq.toFixed(1)} Hz`}</div>
          <div class="sr-only" aria-live="polite">
            {view && statusText(view)}
          </div>
        </div>
      </div>
      {p.chromatic ? (
        <div class="strings-spacer" />
      ) : (
        <StringList
          notes={p.tuning.notes}
          naming={p.naming}
          activeIndex={view?.stringIndex ?? -1}
          confirmed={p.confirmed}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 3: Reescribir `StringList.tsx`**

Reemplazar la función `StringList` por:

```tsx
export function StringList({ notes, naming, activeIndex, confirmed, onTap }: Props) {
  return (
    <div class="strings" style={{ '--count': notes.length }}>
      <ol>
        {notes.map((note, i) => (
          <li key={i}>
            <button
              aria-pressed={i === activeIndex}
              class={confirmed.has(i) ? 'done' : undefined}
              onClick={onTap && (() => onTap(i))}
            >
              {displayNote(note, naming)}
              {confirmed.has(i) && <span class="sr-only"> ✓</span>}
            </button>
          </li>
        ))}
      </ol>
      {/* One shared underline that slides to the active string. */}
      <span
        class="string-line"
        aria-hidden="true"
        style={{
          transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
          opacity: activeIndex < 0 ? 0 : 1,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Reescribir `src/ui/app.css`**

Reemplazar todo el archivo por:

```css
/* Minimal arc: white on black, one dot on a semicircle, lime when in tune. */
:root {
  --bg: #0b0b0b;
  --fg: #f2f2f0;
  --dim: #555;
  --faint: #2a2a2a;
  --ok: #c6ff3d;
  --far: #ff5a4e;
  --c: var(--fg);
  --sans: 'Helvetica Neue', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --mono: ui-monospace, Menlo, Consolas, monospace;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  color-scheme: dark;
}
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html,
body {
  height: 100%;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--sans);
}
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
    env(safe-area-inset-left);
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior: none;
}
button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  border-radius: 0;
  min-width: 48px;
  min-height: 48px;
  padding: 0 12px;
  touch-action: manipulation;
  cursor: pointer;
  transition:
    color 150ms ease,
    opacity 200ms ease,
    transform 120ms var(--ease-out);
}
button:active {
  transform: scale(0.97);
}
button:focus-visible {
  outline: 1px solid var(--ok);
  outline-offset: 2px;
}
button:disabled {
  opacity: 0.3;
}
input {
  font: inherit;
  font-size: 16px;
  color: inherit;
  background: none;
  border: 0;
  border-bottom: 1px solid var(--faint);
  border-radius: 0;
  padding: 12px 0;
  width: 100%;
  -webkit-user-select: text;
  user-select: text;
}
.screen {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100dvh;
  padding: 20px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.error {
  font-size: 13px;
  text-align: center;
  color: var(--far);
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
}

/* Header */
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
h1 {
  flex: none;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.3em;
  color: var(--dim);
}
.pick {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  padding: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
}
.pick-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pick small {
  flex: none;
  color: var(--dim);
}

/* Arc meter */
.tuner {
  position: relative;
  justify-content: space-between;
}
.dial {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.arc {
  position: relative;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}
.arc svg {
  display: block;
  width: 100%;
  overflow: visible;
}
.arc path {
  fill: none;
}
.arc .base {
  stroke: var(--faint);
  stroke-width: 1;
}
.arc .zero {
  stroke: var(--dim);
  stroke-width: 1;
}
/* Readings arrive every 40 ms; short transitions retarget mid-flight instead of restarting. */
.arc .trace {
  stroke: var(--c);
  stroke-opacity: 0.4;
  stroke-width: 3;
  transition:
    stroke-dasharray 120ms var(--ease-out),
    stroke 200ms ease;
}
/* Lime arc drawn from the center to both ends when the note locks in tune. */
.arc .lock {
  stroke: var(--ok);
  stroke-width: 1.5;
  stroke-dasharray: 0 90 0 360;
  transition: stroke-dasharray 300ms var(--ease-out);
}
.in-tune .arc .lock {
  stroke-dasharray: 0 0 180 360;
}
.arc .dot {
  transform-box: view-box;
  transform-origin: 100px 100px;
  transition:
    transform 120ms var(--ease-out),
    opacity 200ms ease;
}
.arc.idle .dot {
  opacity: 0.25;
  transition:
    transform 400ms var(--ease-out),
    opacity 400ms ease;
}
.arc .dot circle {
  fill: var(--c);
  transform-box: fill-box;
  transform-origin: center;
  transition: fill 200ms ease;
}
.in-tune .arc .dot circle {
  animation: pulse 300ms var(--ease-out);
}
@keyframes pulse {
  40% {
    transform: scale(1.4);
  }
}
.arc-center {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

/* Note + numbers */
.note {
  font-size: min(22vw, 17dvh, 100px);
  font-weight: 200;
  line-height: 0.8;
  letter-spacing: -0.04em;
  white-space: nowrap;
  transition: color 200ms ease;
}
.note sub {
  font-size: 0.25em;
  color: var(--dim);
  letter-spacing: 0;
}
.note-inner {
  display: inline-block;
  animation: note-in 180ms var(--ease-out);
}
@keyframes note-in {
  from {
    opacity: 0;
    transform: translateY(6px);
    filter: blur(4px);
  }
}
.in-tune .note {
  color: var(--ok);
}
.readout {
  text-align: center;
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}
.cents {
  min-height: 20px;
  font-size: 15px;
  color: var(--c);
  transition: color 200ms ease;
}
.hz {
  min-height: 14px;
  margin-top: 4px;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--dim);
}

/* Strings */
.strings {
  position: relative;
}
.strings ol {
  list-style: none;
  display: flex;
}
.strings li {
  flex: 1;
  min-width: 0;
}
.strings button {
  width: 100%;
  min-width: 0;
  padding: 0;
  font-family: var(--mono);
  font-size: 15px;
  color: var(--dim);
  transition: color 220ms ease;
}
.strings button.done {
  color: var(--ok);
}
.strings button[aria-pressed='true'] {
  color: var(--fg);
}
.string-line {
  position: absolute;
  left: 0;
  bottom: 6px;
  width: calc(100% / var(--count));
  display: flex;
  justify-content: center;
  pointer-events: none;
  transition:
    transform 220ms var(--ease-out),
    opacity 200ms ease;
}
.string-line::after {
  content: '';
  width: 16px;
  height: 1px;
  background: var(--ok);
}
.strings-spacer {
  min-height: 48px;
}

/* Resume overlay */
.resume {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: rgba(11, 11, 11, 0.9);
  font-size: 48px;
  animation: fade-in 200ms ease;
}

/* Start */
.start {
  justify-content: center;
  align-items: center;
}
.start .arc .base {
  stroke-dasharray: 180;
  animation: draw 600ms var(--ease-out) both;
}
@keyframes draw {
  from {
    stroke-dashoffset: 180;
  }
}
.start .arc .dot,
.start .arc .zero {
  display: none;
}
.start-btn {
  font-size: 48px;
}
.start-btn.leaving {
  opacity: 0;
}

/* Picker: bottom sheet over the tuner */
.sheet-wrap {
  position: fixed;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}
.sheet-wrap.open {
  pointer-events: auto;
}
.scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  opacity: 0;
  transition: opacity 300ms ease;
}
.sheet-wrap.open .scrim {
  opacity: 1;
}
.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 88dvh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 20px calc(20px + env(safe-area-inset-bottom));
  background: var(--bg);
  border-top: 1px solid var(--faint);
  transform: translateY(100%);
  transition: transform 320ms var(--ease-drawer);
}
.sheet-wrap.open .sheet {
  transform: translateY(0);
}
.grab {
  align-self: center;
  width: 32px;
  height: 1px;
  margin: 6px 0;
  background: var(--dim);
}
.sheet h2,
.label {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dim);
}
.label {
  margin-bottom: 4px;
}

/* Segmented: words with a sliding underline */
.seg {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--count), 1fr);
  border-bottom: 1px solid var(--faint);
}
.seg-ind {
  position: absolute;
  left: 0;
  bottom: -1px;
  width: calc(100% / var(--count));
  height: 1px;
  background: var(--fg);
  transition: transform 220ms var(--ease-out);
}
.seg button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 48px;
  padding: 8px 4px;
  font-size: 12px;
  color: var(--dim);
}
.seg button[aria-pressed='true'] {
  color: var(--fg);
}

/* Tuning rows */
.tuning-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
}
.tuning-list > * {
  animation: row-in 200ms var(--ease-out) both;
  animation-delay: calc(min(var(--i, 0), 8) * 20ms);
}
.tuning-list > li {
  border-bottom: 1px solid var(--faint);
}
@keyframes row-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
.tuning {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  text-align: left;
}
.tuning .name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
}
.tuning .notes {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
  white-space: nowrap;
}
.tuning .mark {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ok);
  transform: scale(0);
  transition: transform 200ms var(--ease-out);
}
.tuning[aria-pressed='true'] .mark {
  transform: scale(1);
}
.chroma {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
  color: var(--dim);
}
.chroma b {
  display: block;
  margin-bottom: 6px;
  font-family: var(--mono);
  font-size: 28px;
  font-weight: 400;
  color: var(--fg);
}

.debug pre {
  font-family: var(--mono);
  font-size: 16px;
  line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  .arc .trace,
  .arc .lock,
  .arc .dot,
  .arc.idle .dot,
  .seg-ind,
  .string-line,
  .sheet {
    transition-property: opacity;
  }
  .in-tune .arc .dot circle,
  .start .arc .base {
    animation: none;
  }
  .note-inner,
  .tuning-list > *,
  .resume {
    animation: fade-in 200ms ease both;
  }
  button:active {
    transform: none;
  }
}
```

- [ ] **Step 5: Color de tema**

En `index.html:6`: `<meta name="theme-color" content="#0b0b0b" />`.
En `vite.config.ts:26-27`: `background_color: '#0b0b0b',` y `theme_color: '#0b0b0b',`.

- [ ] **Step 6: Verificar**

Run: `npm test && npm run lint && npm run build`
Expected: todo pasa (el picker y el start todavía tienen markup viejo; se ajusta en Task 3 y 4).

Run: `npm run dev -- --host` y abrir la URL https en el celular (o Chrome con emulación de móvil 360×780). Tocar ▶, cantar o tocar una cuerda:
- El punto recorre el arco y el trazo crece desde el centro.
- Cerca de 0: el arco entero se dibuja en lima desde el centro, el punto pulsa y la nota se pone lima.
- En silencio, el punto vuelve al centro al 25%.

- [ ] **Step 7: Commit**

```bash
git add src/ui index.html vite.config.ts
git commit -m "feat(ui): minimal arc tuner screen"
```

---

### Task 3: Pantalla de inicio sobre el mismo arco

**Files:**
- Modify: `src/ui/screens/StartScreen.tsx`

**Interfaces:**
- Consumes: `ArcMeter` (Task 2); clases `.start`, `.start-btn`, `.leaving`, `.error` (Task 2).
- Produces: `StartScreen({ error, onStart }: { error: MicErrorKind | null; onStart(): Promise<void> })`. `App.start` en `src/app.tsx` ya es `async` y devuelve `Promise<void>`: no cambia.

- [ ] **Step 1: Reescribir `StartScreen.tsx`**

```tsx
import { useState } from 'preact/hooks';
import type { MicErrorKind } from '../../audio/mic';
import { ArcMeter } from '../components/ArcMeter';
import { S } from '../strings';

interface Props {
  error: MicErrorKind | null;
  onStart(): Promise<void>;
}

// The same arc as the tuner: on success the note appears where ▶ was.
export function StartScreen({ error, onStart }: Props) {
  const [leaving, setLeaving] = useState(false);
  async function start() {
    setLeaving(true);
    await onStart();
    // Only visible when the mic failed; on success this screen is already gone.
    setLeaving(false);
  }
  return (
    <main class="screen start">
      <ArcMeter cents={null}>
        <button
          class={leaving ? 'start-btn leaving' : 'start-btn'}
          onClick={() => void start()}
          aria-label="start"
        >
          ▶
        </button>
      </ArcMeter>
      {error && <p class="error">{S.micErrors[error]}</p>}
    </main>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run lint && npm run build`
Expected: pasa.

En el navegador: al cargar, el arco gris se dibuja en 600 ms; al tocar ▶, el botón se desvanece y aparece la nota en el mismo lugar. Bloquear el micrófono en los permisos del sitio y recargar: tocar ▶ → el botón vuelve a aparecer y se ve "Micrófono bloqueado" en rojo, sin caja.

- [ ] **Step 3: Commit**

```bash
git add src/ui/screens/StartScreen.tsx
git commit -m "feat(ui): start screen on the arc with fade-out"
```

---

### Task 4: Picker minimalista

**Files:**
- Modify: `src/ui/screens/TuningPicker.tsx` (filas de afinación y botón cromático)
- Modify: `src/app.tsx:62` (comentario)

**Interfaces:**
- Consumes: clases `.tuning-list`, `.tuning`, `.name`, `.notes`, `.mark`, `.seg*` (Task 2). `Segmented.tsx` no cambia: el indicador ya es un subrayado por CSS.
- Produces: nada nuevo.

- [ ] **Step 1: Botón cromático sin ✓ de texto**

En `TuningPicker.tsx`, dentro del bloque `kind === 'chromatic'`, reemplazar:

```tsx
              <span class="mark">✓</span>
```

por:

```tsx
              <span class="mark" />
```

- [ ] **Step 2: Filas de afinación: nombre, notas en monospace, punto lima**

Reemplazar el `.map` de `tuningsFor(...)` por:

```tsx
              {tuningsFor(p.tunings, kind, strings).map((t, i) => (
                <li key={t.id} style={{ '--i': i }}>
                  <button
                    class="tuning"
                    aria-pressed={!p.chromatic && t.id === p.activeId}
                    onClick={() => p.onSelect(t.id)}
                  >
                    <span class="name">{tuningLabel(t)}</span>
                    <span class="notes">
                      {t.notes.map((n) => displayNote(n, p.naming)).join(' ')}
                    </span>
                    <span class="mark" />
                  </button>
                </li>
              ))}
```

- [ ] **Step 3: Comentario en `app.tsx`**

`src/app.tsx:62`: `// Short pause so the selected dot lands before the sheet slides away.`

- [ ] **Step 4: Verificar**

Run: `npm test && npm run lint && npm run build`
Expected: pasa.

En el navegador, abrir el picker: el sheet se desliza, las filas entran en cascada, el subrayado de Guitarra/Bajo/Cromático se desliza, y al elegir una afinación el punto lima crece antes de que el sheet se cierre.

- [ ] **Step 5: Commit**

```bash
git add src/ui/screens/TuningPicker.tsx src/app.tsx
git commit -m "feat(ui): minimal tuning picker rows"
```

---

### Task 5: Pasada de animación y chequeos en el celular

**Files:**
- Modify (solo si un chequeo falla): `src/ui/app.css`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: nada nuevo.

- [ ] **Step 1: Revisar el movimiento con la skill `animate`**

Invocar la skill `animate` sobre `src/ui/app.css` con la tabla de animación de la spec. Ajustar solo duraciones y curvas que la skill marque como incorrectas; no agregar animaciones nuevas.

- [ ] **Step 2: Chequeos del Review Focus (celular o Chrome con emulación 320×640)**

1. Tocar una nota muy desafinada (> 50 cents): el punto queda en la punta del arco, el trazo cubre medio arco y está en rojo, y los cents dicen `>+50` o `<−50`.
2. Hacer silencio: el punto vuelve al centro al 25%, sin trazo, y los cents/Hz quedan vacíos.
3. Con nombres en español, elegir Guitarra 8 cuerdas y tocar un `Sol#`: la nota entra dentro del arco y las 8 cuerdas entran en una fila sin desbordar. Si no entran, bajar el `font-size` de `.note` o de `.strings button`.
4. Emular 320px de ancho con "Medio tono abajo" y la etiqueta de Bajo 6: el nombre se corta con `…` y el `▾` sigue visible.
5. Permiso de micrófono bloqueado: el botón ▶ vuelve a aparecer y el error se ve en rojo.
6. DevTools → Rendering → `prefers-reduced-motion: reduce`: no hay pulso ni dibujo del arco, el punto salta, y la nota y las filas solo hacen fade.

- [ ] **Step 3: Verificación final**

Run: `npm test && npm run lint && npm run build`
Expected: todo pasa.

- [ ] **Step 4: Commit (si hubo ajustes)**

```bash
git add src/ui/app.css
git commit -m "fix(ui): tune motion and fit after device check"
```

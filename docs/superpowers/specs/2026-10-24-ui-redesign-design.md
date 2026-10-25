# UI redesign: minimal arc tuner

Date: 2026-10-24
Status: approved in brainstorming, pending written-spec review

## Intent

The current UI (ruler meter, chips, pill badges, radial glow, rounded borders) works but lacks
**identity** and **hierarchy**. Goal: a minimalist redesign with few components and few colors,
where the note and how far off it is read first, and everything that can move meaningfully is
animated.

Out of scope: audio/pitch logic, tuner state, storage, strings/i18n content (except removing the
now-unused status texts from the tuner screen), new features.

## Visual system

- Tokens (`src/ui/app.css` `:root`):
  - `--bg: #0b0b0b`, `--fg: #f2f2f0`, `--dim: #555`, `--faint: #2a2a2a`
  - `--ok: #c6ff3d` (lime, in-tune)
  - `--far: #ff5a4e` (out of range)
- Color rule: the UI is white/grey on black. The only colors are the meter gradient and lime.
- Type: thin sans (`'Helvetica Neue', system-ui, sans-serif`, weight 200) for the note; monospace
  with `tabular-nums` only for numbers (cents, Hz, tuning notes).
- No borders on controls, no border radii, no chips/pills, no glow, no radial background.
  Separation is done with 1px hairlines (`--faint`) and spacing only.
- Buttons keep a 48px minimum hit area and visible `:focus-visible` outline (lime).

## Tuner screen

Top to bottom:

1. **Header**: `AFINADOR` (left, small, letter-spaced, dim; tap behaviour unchanged) and the
   current tuning as plain text `E STD ▾` (right, opens picker). Chromatic shows the chromatic
   label instead.
2. **Arc meter** (new `ArcMeter` component replacing `Meter`, SVG):
   - A ∩ semicircle; the big note (with octave subscript) sits inside the arc, bottom-aligned.
   - A small center tick at 0.
   - A dot that travels along the arc, mapping −50…+50 cents to the left…right ends.
   - A trace (thick, ~40% opacity) from the center to the dot, showing the deviation.
   - Dot and trace use `meterColor` (gradient, see below). The base arc is `--faint`.
   - In tune: the whole arc lights up in lime.
   - Keeps `role="meter"` and `aria-value*` attributes.
3. **Cents**: number only, monospace — `+6`, `−12`, `0`; out of range shows `<−50` / `>+50`.
   Colored with the meter color. No "tensar/aflojar/afinada" text on screen.
4. **Hz**: directly under cents, small (≈10px), dim, monospace — `110.8 Hz`.
5. **Strings**: plain text notes spread across the width. The active string is white with a lime
   underline; confirmed strings are lime (replaces the ✓ dot). Chromatic mode: empty spacer.

The `aria-live` region stays, but announces the cents value instead of the status text.
The chromatic badge above the note is removed (the header already says it).

### Meter color

`meterColor` / `meterHue` stay in the same module and keep the gradient behaviour (green-ish →
amber → red by |cents|), with one change: the in-tune color becomes `var(--ok)` (lime) instead of
`hsl(145 70% 62%)`, and the first hue stop moves to lime's hue (78) so the gradient starts from it.
`tests/meter.test.ts` is updated accordingly.

## Other screens

- **Picker (bottom sheet)**: background `--bg`, a 1px hairline on top, no large radius; the grab
  handle becomes a short 1px line. `Segmented` becomes plain words: the selected option is white
  with a sliding underline, the others dim. Instrument icons stay. Tuning rows are text rows
  separated by hairlines: name left, notes in dim monospace right; the selected row shows a lime
  dot instead of the ✓ circle. The chromatic panel loses its dashed box.
- **Start screen**: black, the empty grey arc drawn in place, `▶` centered where the note goes.
  Mic errors are plain red text, no box.
- **Resume overlay**: `▶` over a black scrim, no circle.
- **Debug**: no layout changes, just inherits the new tokens.

## Animation

CSS transitions/keyframes only, no new dependencies. Readings arrive every 40ms, so continuous
values use short transitions that retarget mid-flight instead of keyframes that restart.

| # | Element | Motion | Timing |
|---|---------|--------|--------|
| 1 | Dot | rotate a group around the arc center so the dot moves along the curve | 120ms ease-out |
| 2 | Trace | `stroke-dashoffset`, grows from center to dot | 120ms ease-out |
| 3 | Color | dot/trace/cents color | 200ms |
| 4 | In-tune lock | arc draws in lime from center to both ends; dot pulses scale 1→1.4→1; note turns lime. Once per lock (keyed on entering in-tune) | 300ms |
| 5 | No signal | dot returns to center and fades to 25% | 400ms |
| 6 | Note change | opacity + blur + translateY entry (existing `note-in`, plus blur) | 180ms ease-out |
| 7 | Strings | one shared underline slides to the active string; confirmed string fades to lime | 220ms ease-out |
| 8 | Cents / Hz | no motion (numbers must stay readable) | — |
| 9 | Start | grey arc draws in on load (once); on ▶ the button fades out and the note fades in inside the same arc | 600ms / 200ms |
| 10 | Picker | sheet slide (existing 320ms drawer curve); tab underline slides; rows stagger in 20ms apart, capped at 8; selected dot scales in | as noted |
| 11 | Buttons | `scale(0.97)` on press | 120ms |

`prefers-reduced-motion: reduce`: all of the above collapse to opacity fades; dot and trace jump.

Curves: existing `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` and
`--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`. Final durations/curves are validated with the
`animate` skill during implementation.

## Code changes

- `src/ui/components/Meter.tsx` → rewrite as `ArcMeter` (SVG); keep `meterColor`/`meterHue` exports.
- `src/ui/screens/TunerScreen.tsx`: new layout, drop `statusText` usage and the chromatic badge,
  Hz under cents.
- `src/ui/components/StringList.tsx`: shared sliding underline, lime confirmed state.
- `src/ui/components/Segmented.tsx`: indicator becomes an underline (markup mostly unchanged).
- `src/ui/screens/TuningPicker.tsx`, `StartScreen.tsx`: markup tweaks for the new styles.
- `src/ui/strings.ts`: remove `status` texts if nothing else uses them.
- `src/ui/app.css`: full rewrite.
- `tests/meter.test.ts`: update for lime in-tune color/hue.

## Testing

- `npm test`, `npm run lint`, `npm run build` pass.
- Unit: arc position mapping (cents → angle, clamped at ±50) gets a small test next to the meter
  tests; `meterColor` tests updated.
- Manual on a phone (HTTPS dev server): in-tune lock animation, dot following the arc, picker
  open/close, reduced-motion setting.

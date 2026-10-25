# Afinador — Diseño

> Fecha: 2026-10-24. Parte de `afinador-spec.md` y lo **reemplaza donde hay conflicto**.
> Surge de cuatro rondas de preguntas sobre ese documento. Nombre e ícono son provisorios.

---

## 1. Qué es y para quién

PWA para afinar **guitarra y bajo** desde el celular. Gratis, sin publicidad, sin cuentas, sin backend.
Usuarios: el autor y un grupo chico de amigos músicos. Prioridad: Android + Chrome.

**Éxito:** abrir la app, tocar una cuerda y saber al instante si subirla o bajarla.
- Precisión ±1–2 cents con señal limpia.
- Lectura estable en < 300 ms en guitarra; los graves del bajo pueden tardar más.
- Cero configuración para el caso común (se recuerda la última afinación).

**Fuera de alcance:** lecciones, acordes, metrónomo, cuentas, nube, tiendas de apps, analítica,
segundo plano, tema claro, guitarra de 12 cuerdas.

---

## 2. Principios de interfaz

- **Gráfica antes que texto.** Somos músicos: no hay explicaciones. Dirección con flechas ↑↓,
  posición del medidor y color; ✓ al afinar.
- El texto que queda es mínimo (ícono + 1–3 palabras), en **español o inglés según
  `navigator.language`** (fallback: inglés), centralizado en `src/ui/strings.ts` (~10 cadenas).
- **Notación de notas:** inglés (`E2`) por defecto; toggle en Ajustes para español (`Mi2`).
  Independiente del idioma de la UI. Mapeo: C D E F G A B → Do Re Mi Fa Sol La Si; sostenido `#`.
- **Solo tema oscuro**, siempre (ignora la preferencia del sistema).
- Tipografía: monoespaciada del sistema (`ui-monospace, Menlo, Consolas, monospace`).
- **Estética "Regla"** (elegida en fase 2 entre 3 maquetas): fondo casi negro, líneas finas de 1 px,
  esquinas redondeadas, nota en trazo fino. El **color indica la distancia** a la nota: rojo (≥ 35 cents)
  → ámbar (~15) → verde (≤ 3), interpolado en tono; lo toman la aguja, un brillo suave de fondo, el
  estado y la cuerda activa. Fuera de rango: rojo fijo. Fases 0–1 usan una pantalla de debug sin estilo.
- **Animación:** la aguja se desliza con una transición de 120 ms (las lecturas llegan cada 40 ms y la
  transición retoma desde donde va); al cambiar de nota, la nueva entra con un fundido de 180 ms; los
  cambios de color duran 200 ms. Con "reducir movimiento" la aguja salta y solo quedan los fundidos.
- Mobile-first, una mano, legible a 1 m. Respeta `env(safe-area-inset-*)`.

---

## 3. Instrumentos y afinaciones

| Instrumento | Cuerdas permitidas |
|---|---|
| Guitarra | 6, 7, 8 |
| Bajo | 4, 5, 6 |

Notas de grave a aguda. Frecuencias calculadas desde la nota y La4; nunca guardadas.

### Predefinidas

| Instr. | Cuerdas | Nombre | Notas |
|---|---|---|---|
| Guitarra | 6 | Estándar | E2 A2 D3 G3 B3 E4 |
| Guitarra | 6 | Drop D | D2 A2 D3 G3 B3 E4 |
| Guitarra | 6 | Medio tono abajo | D#2 G#2 C#3 F#3 A#3 D#4 |
| Guitarra | 6 | Un tono abajo | D2 G2 C3 F3 A3 D4 |
| Guitarra | 6 | Dos tonos abajo | C2 F2 A#2 D#3 G3 C4 |
| Guitarra | 6 | Drop C | C2 G2 C3 F3 A3 D4 |
| Guitarra | 6 | DADGAD | D2 A2 D3 G3 A3 D4 |
| Guitarra | 6 | Open G | D2 G2 D3 G3 B3 D4 |
| Guitarra | 6 | Open D | D2 A2 D3 F#3 A3 D4 |
| Guitarra | 7 | Estándar | B1 E2 A2 D3 G3 B3 E4 |
| Guitarra | 7 | Drop A | A1 E2 A2 D3 G3 B3 E4 |
| Guitarra | 8 | Estándar | F#1 B1 E2 A2 D3 G3 B3 E4 |
| Guitarra | 8 | Drop E | E1 B1 E2 A2 D3 G3 B3 E4 |
| Bajo | 4 | Estándar | E1 A1 D2 G2 |
| Bajo | 4 | Drop D | D1 A1 D2 G2 |
| Bajo | 4 | Dos tonos abajo | C1 F1 A#1 D#2 |
| Bajo | 5 | Estándar | B0 E1 A1 D2 G2 |
| Bajo | 6 | Estándar | B0 E1 A1 D2 G2 C3 |

La primera de cada combinación es la **estándar** de esa combinación (base para "desde cero").
Los nombres de predefinidas pasan por `strings.ts`.

### Selector de afinación (hoja que sube desde abajo, sobre el afinador)
1. Control segmentado **Guitarra · Bajo · Cromático**, con siluetas de instrumento y texto.
2. **Cuerdas**: control segmentado (`6 7 8` o `4 5 6`); se oculta en Cromático.
3. Lista de afinaciones de esa combinación (predefinidas + propias), cada una con sus notas en chips;
   la activa con borde verde y ✓. Elegir una la aplica y cierra la hoja.
4. **Cromático** reemplaza la lista por una explicación breve y "Usar cromático".
- El botón del afinador muestra ícono + afinación + instrumento y cuerdas (`Estándar · Guitarra 6 ▾`),
  o `Cromático ▾`. En cromático no se muestran cuerdas y aparece una etiqueta "cromático".

La última afinación activa se recuerda (`activeTuningId`), ya desde el MVP.

### Editor (fase 3)
- Crear **desde cero** (copia de la estándar de la combinación) o **duplicar** cualquiera.
- Cada cuerda: **▲▼ de a un semitono**. Rango permitido: A0–D6 (dentro del rango de detección).
- La cantidad de cuerdas la fija la combinación; no se agregan ni quitan cuerdas.
- Renombrar (1–40 caracteres) y borrar. Las predefinidas no se editan ni borran: se duplican.

---

## 4. Modelo de datos

```ts
type Instrument = 'guitar' | 'bass';

const STRING_COUNTS: Record<Instrument, number[]> = {
  guitar: [6, 7, 8],
  bass: [4, 5, 6],
};

interface Tuning {
  id: string;            // crypto.randomUUID(); predefinidas con id fijo ("guitar-6-standard")
  name: string;
  instrument: Instrument;
  notes: string[];       // grave → aguda; notes.length ∈ STRING_COUNTS[instrument]
  builtIn: boolean;
}

interface Settings {
  a4: number;                    // 440; rango 415–466 (fase 3)
  activeTuningId: string;
  mode: 'auto' | 'manual' | 'chromatic';
  inTuneThresholdCents: number;  // 3
  noteNaming: 'en' | 'es';       // 'en'
}
```

- `localStorage`: `afinador:tunings` (solo las propias) y `afinador:settings`, cada una con `version`.
- Todo acceso en `try/catch`; si falla o falta, valores por defecto.
- Si `activeTuningId` no existe (afinación borrada), cae a Guitarra 6 Estándar.

---

## 5. Pantalla del afinador

- **Nota detectada**: lo más grande de la pantalla, según `noteNaming`.
- **Hz** chico debajo, un decimal (`82.4 Hz`).
- **Medidor** de −50 a +50 cents: regla con marcas cada 5 cents (mayores en ±25 y 0), banda de color
  rojo-ámbar-verde debajo, franja central de ±3 cents que se ilumina al afinar, y una aguja fina.
- **Estado**: ↑ tensar, ↓ aflojar, ✓ afinada (en verde), "fuera de rango" (en rojo).
- **Cuerdas** de la afinación activa: la detectada resaltada, ✓ en las ya afinadas en la sesión.
- **Nombre de la afinación**, que abre el selector.

### Reglas de comportamiento
- **Auto:** cuerda objetivo = la de menor |cents| respecto de la frecuencia detectada.
- **Fuera de rango:** si |cents| > 50 respecto de toda cuerda, el medidor queda **clavado en el extremo**
  con su flecha y se muestra la **nota real detectada**.
- **Afinado:** entra dentro de ±3 cents, sale al superar ±5 (histéresis).
- **Marca de cuerda afinada:** ≥ 500 ms seguidos dentro de ±3 cents. Se borran al cambiar de afinación
  o al recargar.
- **Retención:** al dejar de sonar, mantener la última lectura ~1 s y volver a espera.
- **Manual (fase 3):** tocar una cuerda en pantalla la fija como objetivo.
- **Cromático (adelantado a fase 2, desde el selector):** objetivo = semitono más cercano, sin afinación de referencia.

---

## 6. Audio

### Captura (`src/audio/mic.ts`)
- `getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })`.
- `AudioContext` creado **dentro del handler del botón de inicio** (requisito de iOS).
- `sampleRate` leído en tiempo de ejecución.
- Si el contexto pasa a `suspended`, mostrar botón ▶ para reanudar.
- Errores: permiso denegado / sin micrófono / contexto inseguro → pantalla con ícono + 1 línea.

### Análisis
- `capture-worklet.ts`: AudioWorkletProcessor con buffer circular; postea ventanas al hilo principal.
- **pitchy (MPM) en el hilo principal.** Pasar a un Worker solo si la vista de debug muestra trabas.
- Ventana según la cuerda más grave de la afinación activa:
  - < 60 Hz → 8192 muestras · < 100 Hz → 4096 · resto → 2048. Cromático → 4096.
- Solapamiento 50–75 % → 20–30 lecturas/s. Rango de búsqueda 25–1200 Hz.
- `pitch.ts` expone una interfaz intercambiable (`detect(buffer, sampleRate) → { freq, clarity } | null`)
  para poder probar YIN propio si pitchy rinde mal en el bajo.

### Filtrado (`src/audio/smoothing.ts`)
- Compuerta RMS: **umbral fijo** en código, ajustable en vivo solo desde la vista de debug.
- Descartar clarity < 0,9.
- Mediana de las últimas 5 lecturas → EMA.
- Descartar saltos de exactamente una octava respecto de la tendencia reciente.

### Tonos de referencia (fase 3)
- Tocar una cuerda en la lista: onda **triangular**, ~2 s con fade in/out. Tocarla de nuevo la corta.
- **La detección se pausa** mientras suena un tono.

### Fórmulas
```ts
freq = a4 * 2 ** ((midi - 69) / 12);
cents = 1200 * Math.log2(detected / target);
```

---

## 7. Compartir (fase 4)

- Link: `#t=<base64url(JSON)>` con `{"n":"Nombre","i":"g"|"b","s":["D2",...]}`.
- **Validación al importar:** `i` válido, `s.length ∈ STRING_COUNTS`, cada nota válida y en A0–D6,
  nombre de 1–40 caracteres. Cualquier falla → se ignora el link con un aviso mínimo.
- Al abrir un link válido: **vista previa** (instrumento, cuerdas) + ✓ para importar.
  Si ya existe ese nombre, se guarda como `Nombre (2)` (`(3)`, …).
- Envío: `navigator.share` (menú nativo) cuando existe; si no, copiar al portapapeles.
  Siempre se muestra el **QR** (librería `qrcode`).

---

## 8. Ajustes (fase 3)

- Notación E ↔ Mi.
- La4: 415–466 Hz, paso 1 Hz.
- Modo: auto / manual / cromático (también accesible desde la pantalla del afinador).

---

## 9. Vista de debug

Oculta; se abre tocando 5 veces el título. Muestra Hz crudo, clarity, RMS, tamaño de ventana,
sample rate, y permite ajustar el umbral RMS en vivo. En fases 0–1 es la única pantalla.

---

## 10. Stack

Vite · Preact · TypeScript · Web Audio + AudioWorklet · pitchy · vite-plugin-pwa · qrcode ·
Vitest · ESLint + Prettier · `@vitejs/plugin-basic-ssl` · GitHub Pages vía GitHub Actions.
Cualquier dependencia fuera de esta lista se consulta antes.

Repo: `matiasArrebillaga/afinador` (público), rama `main`, Vite con `base: '/afinador/'`.

### Estructura
```
src/
  audio/   mic.ts · capture-worklet.ts · pitch.ts · smoothing.ts
  music/   notes.ts · tunings.ts · matcher.ts
  state/   storage.ts · share.ts
  ui/      strings.ts · components/ · screens/ (Start, Tuner, Tunings, Settings, Debug)
  app.tsx · main.tsx
tests/     notes · matcher · pitch · smoothing · share · storage
```
`music/` y `audio/` no importan nada de `ui/`.

### Compatibilidad
Chrome Android reciente (probado) y Safari iOS 15+ (**soportado en el código, no probado**:
no hay iPhone disponible). Sin fallback a `ScriptProcessorNode`.

---

## 11. Fases

Se ejecutan en orden, confirmando con el autor antes de pasar a la siguiente.

| Fase | Contenido | Termina cuando |
|---|---|---|
| 0 · Setup | Vite + Preact + TS, ESLint/Prettier, Vitest, HTTPS en dev, deploy a Pages | La página vacía está publicada y abre por HTTPS en el celular |
| 1 · Núcleo de audio | `notes`, `matcher`, worklet, pitchy, smoothing, vista de debug | Tests verdes; el debug muestra Hz estables con guitarra real |
| 2 · MVP | Maquetas brutalistas → elección; Start → Tuner; medidor, estado, cuerdas; selector de 3 niveles; predefinidas; recordar afinación; errores de micrófono | Las 6 cuerdas de guitarra (Estándar y Drop D) y las 4 del bajo afinan contra un afinador de referencia con < 3 cents de diferencia |
| 3 · Personalización | Editor, persistencia de afinaciones propias, manual, cromático, La4, tonos de referencia, toggle de notación, Ajustes | Crear, duplicar, renombrar y borrar una afinación sobrevive a una recarga |
| 4 · Compartir y PWA | Link + QR + importación; manifest, íconos provisorios, service worker, offline | Un link abierto en otro celular importa la afinación; la app instalada abre sin conexión |

---

## 12. Testing

**Automático (Vitest):**
- `notes`: A4 = 440, E2 ≈ 82,41, B0 ≈ 30,87; ida y vuelta nota ↔ MIDI; nombres en/es.
- `matcher`: 84 Hz en Guitarra 6 Estándar → E2 con ~+33 cents; caso fuera de rango (> 50 cents).
- `pitch`: senoidales y señales con 2.º armónico más fuerte en 31, 41, 55, 82, 110, 196 y 330 Hz,
  con desvíos −30 / 0 / +30 cents. Error < 2 cents en guitarra, < 3 en bajo, sin errores de octava.
- `smoothing`: mediana, EMA, histéresis, descarte de octava, marca de 500 ms.
- `share`: ida y vuelta y rechazo de entradas inválidas (instrumento, cantidad de cuerdas, notas, nombre).
- `storage`: valores por defecto ante JSON roto o `localStorage` inaccesible.

**Manual (Android + Chrome):** guitarra de 6 cuerdas y bajo de 4; permiso denegado; bloquear la
pantalla y volver. Bajo de 5 y 6, guitarra de 7 y 8 e iOS: **solo tests sintéticos**.

---

## 13. Limitaciones conocidas

- Micrófonos de celular captan poco bajo ~100 Hz: los graves del bajo tardan más en estabilizarse.
- iOS sin probar; Safari respeta solo en parte la desactivación del procesamiento de audio.
- Con otros instrumentos sonando la detección no es confiable.
- Las afinaciones propias viven en cada celular; borrar datos del navegador las pierde
  (backup JSON queda para más adelante).

## 14. Pendientes de decisión

- Nombre definitivo e ícono de la app.
- ~~Estética concreta~~ → resuelta: dirección "Regla" (§2).

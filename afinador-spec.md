# Afinador PWA — Especificación del proyecto

> Documento de partida para desarrollar el proyecto desde cero con Claude Code.
> Nombre provisorio: **Afinador**. Cambiarlo cuando haya uno definitivo.

---

## 1. Resumen

Una app web instalable (PWA) para afinar **guitarra y bajo** desde el celular, al estilo de GuitarTuna pero gratuita, sin publicidad, sin cuentas y adaptada a las afinaciones que uso yo y mis amigos.

La app escucha el instrumento por el micrófono, detecta la nota y muestra qué tan desafinada está la cuerda en *cents*, con una aguja clara y estable. Permite crear afinaciones propias y compartirlas mediante un link o un código QR.

No es un producto comercial: la prioridad es que funcione bien, que sea agradable de usar y que sea fácil de compartir.

---

## 2. Usuario objetivo

- **Quién:** yo y un grupo chico de amigos músicos (decenas de personas como mucho).
- **Instrumentos:** guitarra (acústica y eléctrica) y bajo de 4 y 5 cuerdas.
- **Dispositivos:** celulares Android (Chrome, prioridad) e iPhone (Safari).
- **Idioma de la interfaz:** español/ingles para las notas.
- **Contexto de uso:** en casa, antes de tocar o ensayar, con poco ruido ambiente. El celular se apoya cerca del instrumento.
- **Lo que esperan:** abrir la app, tocar una cuerda y saber al instante si tienen que subirla o bajarla. Cero configuración para el caso común.

---

## 3. Objetivos y no-objetivos

### Objetivos
- Precisión de afinación de **±1 a 2 cents** con señal limpia.
- Respuesta rápida en guitarra (lectura estable en menos de 300 ms).
- Funcionamiento correcto en las cuerdas graves del bajo, aunque tarde un poco más.
- Un solo código que funcione en Android e iOS.
- Costo cero: hosting gratuito, sin backend.
- Funcionamiento sin conexión una vez instalada.
- Creacion de afinaciones propias, puede ser desde 0 o a partir de una afinacion ya hecha.
- Interfaz simple y amigable.

### No-objetivos (fuera de alcance)
- Lecciones, biblioteca de acordes, juegos o metrónomo (quizás más adelante).
- Cuentas de usuario, login o sincronización en la nube.
- Publicación en Play Store o App Store.
- Monetización, publicidad o analítica.
- Funcionamiento en segundo plano.

---

## 4. Stack tecnológico

| Área | Tecnología | Motivo |
|---|---|---|
| Lenguaje | **TypeScript** | Tipado para el modelo de afinaciones y el procesamiento de audio |
| Build / dev server | **Vite** | Rápido y simple, con HTTPS en desarrollo para probar el micrófono en el celular |
| UI | **Preact** (+ hooks) | Liviano (~4 KB) y con la misma API que React |
| Estilos | CSS plano con variables (o CSS Modules) | Sin dependencias extra; tema claro y oscuro |
| Audio | **Web Audio API** + **AudioWorklet** | Captura y análisis en tiempo real sin bloquear la UI |
| Micrófono | `navigator.mediaDevices.getUserMedia` | Estándar en todos los navegadores móviles |
| Detección de pitch | **pitchy** (algoritmo MPM / McLeod) | Robusto frente a errores de octava y con buena precisión |
| PWA | **vite-plugin-pwa** (Workbox) | Manifest, service worker y uso offline |
| Persistencia | `localStorage` | Afinaciones propias y preferencias del usuario |
| Compartir | Afinación codificada en el *hash* de la URL + **qrcode** (librería JS) | Compartir sin servidor |
| Tests | **Vitest** | Tests del detector con señales sintéticas |
| Calidad | ESLint + Prettier | Consistencia del código |
| Hosting | **GitHub Pages** (deploy con GitHub Actions) | Gratis y con HTTPS incluido |

**Reglas:**
- Mantener las dependencias al mínimo. Consultar antes de agregar una nueva.
- Si `pitchy` no rinde bien en el bajo, evaluar implementar **YIN** propio en `src/audio/` como alternativa intercambiable.

---

## 5. Funciones

### 5.1 MVP (fase 1)
1. **Pantalla de inicio con botón "Empezar"**: necesario porque iOS solo habilita audio tras un gesto del usuario. Ahí se pide el permiso del micrófono.
2. **Modo automático por afinación**: el usuario elige una afinación, toca cualquier cuerda y la app detecta cuál es (la más cercana en cents) y muestra cuánto le falta.
3. **Indicador visual**:
   - Aguja o barra de −50 a +50 cents.
   - Nota detectada y frecuencia en Hz.
   - Estado claro: "Subí", "Bajá" o "Afinado".
   - Color verde al estar dentro de ±3 cents.
4. **Visualización de cuerdas**: las cuerdas de la afinación actual, con la detectada resaltada y una marca en las que ya quedaron afinadas durante la sesión.
5. **Afinaciones predefinidas** (ver sección 7).
6. **Manejo de errores del micrófono**: mensajes claros si el permiso fue denegado o no hay micrófono disponible.

### 5.2 Versión 1 (fase 2)
7. **Modo cromático**: detecta cualquier nota sin afinación de referencia.
8. **Editor de afinaciones propias**: crear, editar, duplicar, renombrar y borrar. Cada cuerda se elige por nota y octava (p. ej. `D2`), con un selector simple.
9. **Selección manual de cuerda**: fijar una cuerda específica en lugar de la detección automática. Útil cuando la cuerda está muy desafinada y la app la confunde con otra.
10. **La4 de referencia ajustable**: 440 Hz por defecto, configurable entre 415 y 466 Hz.
11. **Tonos de referencia**: tocar la nota de cada cuerda con un oscilador, para afinar de oído.
12. **Compartir afinación**: generar un link y un QR. Al abrir el link, la app ofrece importar la afinación.
13. **Instalación PWA** y funcionamiento offline.

### 5.3 Más adelante (opcional)
- Modo estroboscópico de alta precisión.
- Temas de color.
- Exportar e importar todas las afinaciones como un archivo JSON (backup).
- Vibración háptica al llegar a "Afinado" (Android).
- Soporte para otros instrumentos (ukelele, charango).

---

## 6. Detalles técnicos del audio

### 6.1 Captura
Pedir el micrófono **desactivando el procesamiento del navegador**, que distorsiona la señal:

```ts
navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  },
});
```

- Crear el `AudioContext` **dentro del handler del botón "Empezar"** (requisito de iOS).
- Leer `audioContext.sampleRate` en tiempo de ejecución; no asumir 44100 ni 48000.
- Si el contexto pasa a `suspended` (por ejemplo, al bloquear la pantalla), mostrar un botón para reanudar.

### 6.2 Análisis
- Un **AudioWorklet** acumula muestras en un buffer circular y envía ventanas al hilo principal (o a un Worker) para analizarlas.
- **Tamaño de ventana según el instrumento**:
  - Guitarra: ~2048 muestras (~43 ms a 48 kHz).
  - Bajo: 4096 a 8192 muestras, necesarias para el Mi grave (41,2 Hz) y el Si grave (30,9 Hz).
  - Recomendado: elegir el tamaño según la cuerda más grave de la afinación activa.
- **Solapamiento** entre ventanas (~50–75 %) para actualizar la lectura a 20–30 Hz.
- **Rango de búsqueda**: 25 Hz a 1200 Hz.

### 6.3 Filtrado y estabilidad
- **Compuerta de ruido**: ignorar ventanas con RMS bajo un umbral (calibrable).
- **Umbral de claridad**: descartar lecturas con *clarity* menor a ~0,9 (dato que devuelve pitchy).
- **Suavizado**: mediana de las últimas 5 lecturas y luego un promedio exponencial (EMA) para que la aguja no tiemble.
- **Corrección de octava**: si una lectura salta exactamente una octava respecto de la tendencia reciente, descartarla.
- **Histéresis** en el estado "Afinado": entrar en ±3 cents y salir recién al superar ±5 cents, para que no parpadee.
- **Retención**: al dejar de sonar la cuerda, mantener la última lectura válida ~1 s antes de volver al estado de espera.

### 6.4 Fórmulas
```ts
// Nota MIDI a frecuencia
freq = a4 * Math.pow(2, (midi - 69) / 12);

// Desviación en cents respecto de una frecuencia objetivo
cents = 1200 * Math.log2(detected / target);
```

Para el modo automático, la cuerda objetivo es la de **menor |cents|** respecto de la frecuencia detectada.

---

## 7. Afinaciones predefinidas

Referencia con La4 = 440 Hz. Las frecuencias se **calculan** a partir de la nota; no hay que guardarlas fijas.

### Guitarra (6 cuerdas, de grave a aguda)
| Nombre | Notas |
|---|---|
| Estándar | E2 A2 D3 G3 B3 E4 |
| Drop D | D2 A2 D3 G3 B3 E4 |
| Medio tono abajo | D#2 G#2 C#3 F#3 A#3 D#4 |
| Un tono abajo (D estándar) | D2 G2 C3 F3 A3 D4 |
| Drop C | C2 G2 C3 F3 A3 D4 |
| DADGAD | D2 A2 D3 G3 A3 D4 |
| Open G | D2 G2 D3 G3 B3 D4 |
| Open D | D2 A2 D3 F#3 A3 D4 |

### Bajo
| Nombre | Notas |
|---|---|
| 4 cuerdas estándar | E1 A1 D2 G2 |
| 4 cuerdas Drop D | D1 A1 D2 G2 |
| 5 cuerdas estándar | B0 E1 A1 D2 G2 |

Frecuencias de control para los tests: E2 = 82,41 Hz · A2 = 110,00 Hz · E4 = 329,63 Hz · E1 = 41,20 Hz · B0 = 30,87 Hz.

> **TODO:** agregar acá mis afinaciones personales.

---

## 8. Modelo de datos

```ts
type Instrument = 'guitar' | 'bass';

interface Tuning {
  id: string;            // uuid
  name: string;          // "Drop D"
  instrument: Instrument;
  notes: string[];       // ["D2","A2","D3","G3","B3","E4"], de grave a aguda
  builtIn: boolean;      // las predefinidas no se pueden borrar
}

interface Settings {
  a4: number;                  // 440 por defecto
  activeTuningId: string;
  mode: 'auto' | 'manual' | 'chromatic';
  inTuneThresholdCents: number; // 3 por defecto
  theme: 'system' | 'light' | 'dark';
}
```

- **Almacenamiento:** `localStorage` con las claves `afinador:tunings` y `afinador:settings`, ambas con un campo `version` para migraciones futuras. Todo acceso va en `try/catch`, con valores por defecto si falla.
- **Compartir:** `#t=<base64url(JSON compacto)>`, por ejemplo `{"n":"Mi afinación","i":"g","s":["D2","A2","D3","G3","B3","D4"]}`. Al importar hay que **validar** el contenido: notas válidas, entre 4 y 8 cuerdas y nombre de hasta 40 caracteres.

---

## 9. Estructura sugerida del proyecto

```
afinador/
├── public/
│   └── icons/                 # íconos PWA (192, 512, maskable)
├── src/
│   ├── audio/
│   │   ├── mic.ts             # getUserMedia + AudioContext
│   │   ├── capture-worklet.ts # AudioWorkletProcessor (buffer circular)
│   │   ├── pitch.ts           # wrapper sobre pitchy (interfaz intercambiable)
│   │   └── smoothing.ts       # mediana, EMA, histéresis, corrección de octava
│   ├── music/
│   │   ├── notes.ts           # nota <-> MIDI <-> frecuencia, cents
│   │   ├── tunings.ts         # afinaciones predefinidas
│   │   └── matcher.ts         # elegir la cuerda más cercana
│   ├── state/
│   │   ├── storage.ts         # localStorage con versión y fallback
│   │   └── share.ts           # codificar y decodificar el link de la afinación
│   ├── ui/
│   │   ├── components/        # Needle, StringList, TuningPicker, NoteEditor...
│   │   └── screens/           # Start, Tuner, Tunings, Settings
│   ├── app.tsx
│   └── main.tsx
├── tests/
│   ├── notes.test.ts
│   ├── matcher.test.ts
│   ├── pitch.test.ts          # señales sintéticas
│   └── share.test.ts
├── .github/workflows/deploy.yml
├── vite.config.ts
└── README.md
```

La lógica musical (`music/`) y la de audio (`audio/`) deben ser **independientes de la UI** para poder testearlas por separado.

---

## 10. Plan de trabajo por fases

### Fase 0: Setup
- [ ] Proyecto Vite + Preact + TypeScript.
- [ ] ESLint, Prettier y Vitest configurados.
- [ ] HTTPS en el dev server (`@vitejs/plugin-basic-ssl`) para probar desde el celular en la red local.
- [ ] Workflow de deploy a GitHub Pages.

### Fase 1: Núcleo de audio
- [ ] `notes.ts` y `matcher.ts`, con tests.
- [ ] Captura de micrófono con el AudioWorklet.
- [ ] Detección con pitchy y una vista de debug (Hz, claridad, RMS).
- [ ] Tests del detector con señales sintéticas.

### Fase 2: MVP usable
- [ ] Pantalla Start → Tuner.
- [ ] Aguja, nota y estado.
- [ ] Modo automático con las afinaciones predefinidas.
- [ ] Suavizado e histéresis.
- [ ] Prueba real con guitarra y bajo en Android e iPhone.

### Fase 3: Personalización
- [ ] Editor de afinaciones y persistencia.
- [ ] Modo manual y modo cromático.
- [ ] La4 ajustable y tonos de referencia.

### Fase 4: Compartir y PWA
- [ ] Link y QR para compartir afinaciones, con flujo de importación.
- [ ] Manifest, íconos, service worker y modo offline.
- [ ] Revisión en iOS: instalación en la pantalla de inicio y permisos.

---

## 11. Criterios de aceptación y testing

### Tests automáticos (Vitest)
- `notes`: A4 = 440 Hz, E2 ≈ 82,41 Hz, conversión ida y vuelta entre nota y MIDI.
- `matcher`: con 84 Hz en afinación estándar devuelve la cuerda E2 con ~+33 cents.
- `pitch`: con **senoidales** y **señales con armónicos** (fundamental + 2.º armónico más fuerte, para simular cuerdas reales), en 41, 55, 82, 110, 196 y 330 Hz, y con desvíos de −30, 0 y +30 cents:
  - error menor a 2 cents en guitarra y menor a 3 cents en bajo;
  - sin errores de octava.
- `share`: ida y vuelta de la codificación y rechazo de entradas inválidas.

### Pruebas manuales en dispositivos
- Android con Chrome e iPhone con Safari (navegador y PWA instalada).
- Guitarra: las 6 cuerdas en estándar y en Drop D.
- Bajo: las 4 cuerdas, y el Si grave si hay un bajo de 5 disponible.
- Comparar contra un afinador conocido (de clip o GuitarTuna): diferencia menor a 3 cents.
- Comportamiento al negar el permiso del micrófono, al bloquear la pantalla y al volver a la app.

---

## 12. Limitaciones conocidas

- **Graves del bajo:** los micrófonos de celular captan poco por debajo de ~100 Hz. La detección se apoya en los armónicos y necesita ventanas largas, así que el Mi y el Si graves tardan más en estabilizarse. Con un bajo eléctrico desenchufado conviene acercar el celular al instrumento.
- **Safari en iOS:** respeta solo en parte la desactivación del procesamiento de audio. Además, la PWA instalada puede pedir el permiso del micrófono más seguido que una app nativa.
- **Ruido ambiente:** con otros instrumentos sonando, la detección por micrófono no es confiable. Es una limitación de cualquier afinador de este tipo.
- **HTTPS obligatorio** para usar el micrófono, incluso en desarrollo.
- **Sin segundo plano:** la app solo escucha mientras está abierta en pantalla.
- **Datos locales:** las afinaciones viven en cada celular; si se borran los datos del navegador, se pierden. El backup en JSON, planeado para más adelante, lo resuelve.

---

## 13. Guía de diseño de la UI

- **Mobile-first**, para usarse con una mano y el celular apoyado.
- La aguja y la nota son lo más grande de la pantalla, legibles a un metro de distancia.
- Contraste alto; no depender solo del color (sumar texto o íconos: ↑ "Subí", ↓ "Bajá", ✓ "Afinado").
- Tema oscuro por defecto, siguiendo la preferencia del sistema.
- Respetar las *safe areas* del celular (notch y barra inferior) con `env(safe-area-inset-*)`.
- Animaciones suaves en la aguja (transición CSS de ~100 ms), sin efectos que distraigan.

---

## 14. Instrucciones para Claude Code

- Trabajar **fase por fase** (sección 10) y confirmar conmigo antes de pasar a la siguiente.
- Antes de agregar una dependencia que no esté en la sección 4, preguntar.
- Código e identificadores en **inglés**; textos de la interfaz en **español** (centralizados en un archivo de strings).
- Escribir tests para toda la lógica en `music/` y `audio/`.
- Mantener una **vista de debug** oculta (p. ej. tocando 5 veces el título) con Hz, claridad, RMS y tamaño de ventana, para calibrar en dispositivos reales.
- Mantener actualizado un `README.md` con cómo correr el proyecto, cómo probarlo en el celular y cómo hacer el deploy.

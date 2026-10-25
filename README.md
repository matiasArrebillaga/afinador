# Afinador

Afinador PWA para guitarra y bajo. Spec: `docs/superpowers/specs/2026-10-24-afinador-design.md`.

## Correr

```bash
npm install
npm run dev      # https://localhost:5173/afinador/
npm test
npm run lint
```

## Probar en el celular

1. Celular y PC en la misma red Wi-Fi.
2. `npm run dev` muestra una URL `Network: https://192.168.x.x:5173/afinador/`.
3. Abrirla en Chrome del celular y aceptar el certificado autofirmado (el micrófono exige HTTPS).

## Deploy

Cada push a `main` corre lint, tests y build, y publica en
https://matiasarrebillaga.github.io/afinador/ (GitHub Actions → Pages).

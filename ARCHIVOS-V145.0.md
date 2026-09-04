# Relación exacta de archivos — v145.0 frente a v144.0

## Modificados

- `coco-v144-core.js` — versión activa v145 y compatibilidad del modal.
- `coco-v144-padel.js` — flujos Mixing/Campeonato/Jugadores y aislamiento de estadísticas.
- `coco-v144-runner.js` — definición unificada, validación, objetivos garantizados y movimiento.
- `index.html` — identificación v145, carga de refinamientos y caché actualizada.
- `juego/coco-corre/index.html` — revisión de caché del acceso directo.
- `manifest.json` — `start_url` de prueba v145.
- `manifest.webmanifest` — `start_url` de prueba v145.
- `qa/v144-functional-tests.mjs` — queda marcada como suite histórica cuando la candidata activa es v145.
- `sw.js` — caché v145 y nuevo CSS.

Los nombres `coco-v144-*.js` se mantienen deliberadamente para no romper rutas internas ni datos existentes. Los módulos corregidos publican las API `CocoRunnerV145` y `CocoPadelV145`, además de alias compatibles para el núcleo anterior.

## Añadidos

- `coco-v145-refinements.css`.
- `qa/v145-functional-tests.mjs`.
- `qa/v145-browser-tests.mjs`.
- `ENTREGA-V145.0.md`.
- `ARCHIVOS-V145.0.md`.
- `PRUEBAS-V145.0.md`.
- `LEEME-RESPALDO-Y-PRUEBA-V145.0.txt`.
- `RELEASE-MANIFEST-v145.0.json`.

## Retirados

Ninguno.

## Base de datos

No se añadió ni modificó ninguna migración. Continúan incluidos, intactos:

- `supabase-coco-v144.sql`.
- `supabase-coco-v144-rollback.sql`.


# Relación exacta de archivos — v146.0 frente a v145.0

## Modificados

- `coco-v144-core.js` — núcleo v146, integración del runner con la clasificación, apertura segura e iconos vectoriales.
- `coco-v144-differences.js` — render natural de color/forma/presencia, zonas normalizadas y resolución de solapamientos.
- `coco-v144-padel.js` — tres pestañas, portadas limpias, flujos por pasos, administración de jugadores y clasificación derivada.
- `coco-v144-runner.js` — planes de objetos garantizados, validación previa, Coco estable y puntuación general única.
- `index.html` — identificación v146, Coco Corre en clasificación general, SDK local, módulos y QA local.
- `juego/coco-corre/index.html` — revisión de caché del acceso directo.
- `manifest.json` — `start_url` de PWA v146.
- `manifest.webmanifest` — `start_url` de PWA v146.
- `qa/v144-functional-tests.mjs` — se marca como suite histórica al detectar v145/v146.
- `qa/v145-functional-tests.mjs` — se marca como suite histórica al detectar v146.
- `qa/v145-browser-tests.mjs` — se marca como suite histórica al detectar v146.
- `sw.js` — caché v146, SDK local y recursos de los tres módulos.

## Añadidos

- `coco-v146-refinements.css`.
- `supabase-js-2.112.3.min.js`.
- `SUPABASE-JS-LICENSE.txt`.
- `qa/v146-functional-tests.mjs`.
- `qa/v146-browser-tests.mjs`.
- `qa/v146-differences-render-tests.mjs`.
- `qa/v146-visual-evidence.mjs`.
- `qa/evidence-v146/coco-corre-intro-390-v146.png`.
- `qa/evidence-v146/coco-corre-partida-390-v146.png`.
- `qa/evidence-v146/coco-padel-mixing-390-v146.png`.
- `qa/evidence-v146/coco-padel-campeonatos-390-v146.png`.
- `qa/evidence-v146/coco-padel-detalle-390-v146.png`.
- `qa/evidence-v146/coco-padel-jugadores-390-v146.png`.
- `qa/evidence-v146/coco-padel-jugadores-320-v146.png`.
- `qa/evidence-v146/diferencias-partida-390-v146.png`.
- `qa/evidence-v146/encuentra-las-diferencias-v146.jpg`.
- `ENTREGA-V146.0.md`.
- `ARCHIVOS-V146.0.md`.
- `PRUEBAS-V146.0.md`.
- `LEEME-RESPALDO-Y-PRUEBA-V146.0.txt`.
- `RELEASE-MANIFEST-v146.0.json`.
- `SHA256SUMS-v146.0.txt`.

## Retirados de la candidata v146.0

- `coco-v145-refinements.css` — sustituido por `coco-v146-refinements.css`.

No se retiró ningún archivo de datos, imagen de Coco V2, escena, migración ni historial.

## Base de datos

No se añadió ni modificó ninguna migración en v146.0. Continúan incluidos:

- `supabase-coco-v144.sql`.
- `supabase-coco-v144-rollback.sql`.

El rollback no debe ejecutarse para descartar v146.0, porque esta candidata no introduce cambios de esquema.

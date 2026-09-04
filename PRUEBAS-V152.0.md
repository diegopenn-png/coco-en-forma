# QA — Coco en Forma v152.0

## Suite funcional v152

Resultado: **12/12 PASS**.

Comprueba:
- Coco Pádel disponible, no en construcción.
- Tarjetas sin puntajes/rankings individuales y estado de clasificación no clicable.
- Pádel sin Excel ni terminología `torneo`.
- Fichas de jugador sin siglas opacas y con palabras completas.
- Búsqueda, jornadas, resultados y recálculo de Pádel.
- Street Skate, skate, salto, agacharse, distractor inicial y cambios de regla ≤15 s.
- Diferencias con pares específicos por nivel y sin cambios extra no pulsables.
- 100 recursos WebP v152.
- CSS v152 aplicable al modal exterior a `#cocoApp`.
- PWA v152.
- Clasificación principal Supabase intacta.
- Compatibilidad de aliases con el núcleo estable.

Archivo: `qa/v152-functional-tests.mjs`.

## Núcleo Coco Pádel

Resultado: **8/8 PASS**.

Valida jugadores, resultado por sets, sets/games, puntos, perfil, corrección y borrado con recálculo.

Archivo: `qa/v152-padel-core-tests.mjs`.

## Recursos HTTP

Resultado: **160/160 HTTP 200, 0 errores 404** usando la suite de integridad local heredada.

También se validaron 27 imágenes sociales servidas como `image/png`.

## Sintaxis

- `coco-v152-padel.js`: PASS
- `coco-v152-runner.js`: PASS
- `coco-v152-differences.js`: PASS
- `coco-v152-fixes.js`: PASS
- `sw.js`: PASS
- Scripts inline de `index.html`: **20/20 PASS**

## Imágenes de Diferencias

- **100/100 WebP válidos**.
- Resolución: **768×512**.
- **30/30** tríos de nivel L1/L2/L3 son archivos distintos.
- En la comprobación visual móvil cada escena se mantiene en relación **3:2** sin deformación.

Archivo de evidencia: `qa/v152-image-assets.json`.

## Catálogo móvil

Harness Chromium a 390 px:
- Coco Pádel pierde el estado de construcción y queda habilitado.
- `Abrir Coco Pádel` disponible.
- Estado `No puntúa para la clasificación general`, no clicable.
- Coco Corre muestra `Puntúa para la clasificación general`, no clicable.
- Eliminación del puntaje individual de la tarjeta.
- Sin overflow horizontal.

Archivo: `qa/v152-catalog-browser.json`.

## Observación sobre suite histórica v150

La suite v150 conserva una aserción que exige literalmente el cache `v150.0.0-r1`; por diseño esa comprobación deja de ser aplicable en v152. Las comprobaciones de lógica anteriores relevantes siguen cubiertas por la suite v152 y el cache actual se valida explícitamente como `v152.0.0-r1`.

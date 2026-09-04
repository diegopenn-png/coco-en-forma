# QA — Coco en Forma v151.0

## Resultado

- **12/12** pruebas funcionales v151.
- **8/8** pruebas del núcleo de Coco Pádel con resultados reales por sets, corrección y borrado/recalculo.
- **8/8** comprobaciones de interfaz móvil de Coco Pádel en Chromium (390×844).
- **9/9** comprobaciones DOM/interacción de Coco Corre en Chromium móvil.
- **6/6** comprobaciones DOM de Encuentra las diferencias en Chromium móvil.
- **69/69** recursos declarados por la PWA servidos por HTTP con estado 200; **0 fallos / 0 recursos 404**.
- **20/20** scripts inline de `index.html` compilan correctamente.
- **4/4** scripts externos modificados (`Padel`, `Runner`, `Diferencias`, `sw.js`) pasan `node --check`.
- **40/40** nuevos WebP de Diferencias válidos a 768×512.
- **30/30** pares modificados contienen cambios visuales medibles y limitados; 0 escenas con área de cambio excesiva.
- **10/10** escenas v151 aumentan luminosidad frente a su base; mejora media **+38,7 %**.
- **15/15** miniaturas sociales originales permanecen presentes.

## Cobertura relevante

### Coco Pádel
- Crear jugadores desde interfaz.
- Búsqueda parcial y sin tildes (`alv` localiza `Álvaro`).
- Crear campeonato desde interfaz.
- Terminología “Campeonato” sin “torneo”.
- WhatsApp y Copiar presentes; Excel ausente.
- Crear jornada y nombre automático `Jornada 1`.
- Sin overflow horizontal a 390 px.
- Resultado 6-4 / 3-6 / 10-7: sets, games, victoria y puntos calculados correctamente.
- Corrección del resultado: clasificación recalculada sin duplicados.
- Borrado del resultado: estadísticas derivadas vuelven a cero.

### Coco Corre
- Street stage, muro/grafitis y skate presentes.
- Recurso oficial de Coco conservado.
- Controles táctiles de salto y agacharse presentes.
- Animación/estado de impulso lateral comprobado.
- Estados `jump` y `duck` activados mediante interacción real.
- Sin overflow horizontal a 390 px.
- Máximo 15 s por consigna y distractor inicial verificados sobre 120 misiones generadas (40 por nivel).

### Encuentra las diferencias
- Pares de imágenes precompuestos; no Canvas ni SVG usados para fabricar diferencias en runtime.
- Hotspots simétricos en ambas escenas.
- 10 escenas × 3 variantes × 6 diferencias disponibles.
- Niveles 4/5/6 diferencias.
- Coordenadas/hotspots dentro de límites.
- Assets locales, precacheados y sin faltantes.

## Evidencias en `/qa`

- `v151-functional-tests.mjs`
- `v151-padel-core-tests.mjs`
- `v151-http-assets.json`
- `v151-image-assets.json`
- `v151-js-syntax.json`
- `v151-browser-ui.json`
- `v151-runner-browser-ui.json`
- `v151-differences-browser-ui.json`
- `v151-padel-mobile.png`
- `differences-v151-scenes.json`

Nota: el test DOM de Diferencias sustituye las URLs de imágenes por un píxel válido únicamente dentro del harness de Chromium porque el sandbox bloquea navegación local. Los WebP reales se validan por separado mediante HTTP, dimensiones, luminancia y comparación de píxeles.

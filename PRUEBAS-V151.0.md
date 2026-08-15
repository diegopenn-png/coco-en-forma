# Pruebas v151.0

Ejecutadas sobre la entrega completa.

## Automatizadas

- `node qa/v151-functional-tests.mjs` → 9/9 PASS.
- `node qa/v149-http-tests.mjs` → PASS, 70/70 recursos HTTP 200 y 0 errores 404.
- `node qa/v149-padel-ui-tests.mjs` → PASS en las cuatro comprobaciones de UI/función de Coco Pádel.
- 20 scripts inline de `index.html` comprobados con `node --check` → 0 errores de sintaxis.
- `coco-v151-runner.js`, `coco-v151-differences.js`, `coco-v144-core.js` y `sw.js` → sintaxis válida.

## Cobertura específica v151

- Botones no bloqueados durante consultas remotas.
- Timeouts de sesión/estadísticas/perfil.
- Motores con filenames v151 para evitar mezcla de caché.
- 180 misiones de Coco Corre validadas.
- Dos distractores antes del primer objetivo de cada nueva regla.
- Velocidad y frecuencia de aparición v151 verificadas.
- CSS sin `contain: paint` en objetos de Coco Corre.
- Etiquetas largas sin `text-overflow: ellipsis` en tarjetas de categorías.
- 10 escenas de diferencias y 3 combinaciones por escena.
- Solo `object-color` y `character-color` como tipos activos.
- Ausencia de renderers de formas/props superpuestos.
- Cerebro o pico de Coco presentes en todos los niveles/variantes.
- Los 15 IDs de juego siguen presentes.

## Nota de prueba visual

La entrega incluye comprobaciones estáticas y funcionales del motor. En este entorno el navegador Chromium del sistema está bloqueado por política administrativa, por lo que no se utilizó automatización visual de navegador para capturas finales. Los recursos y motores sí fueron servidos por HTTP local y validados.

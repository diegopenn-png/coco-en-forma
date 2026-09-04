# Coco en Forma v150.0 — QA

Fecha de reconstrucción: 2026-08-16

## Resultado

- `qa/v150-functional-tests.mjs`: **14/14 PASS**
- `qa/v149-padel-ui-tests.mjs`: **4/4 PASS** sobre el módulo Pádel conservado y versionado en v150
- `qa/v149-http-tests.mjs`: **68/68 recursos HTTP 200**, 0 peticiones 404
- Miniaturas servidas: **27 PNG**
- JavaScript externo modificado: sintaxis correcta
- JavaScript inline de `index.html`: **20/20 scripts** validados con `node --check`

## Cobertura específica v150

1. Ranking general por RPC global y no por lectura RLS del usuario.
2. Migración general/específica segura y reversible.
3. Doce retos exactos dentro de clasificación general.
4. Coco Med y Coco Fútbol como rankings específicos.
5. Coco Corre: 180 misiones de preflight, primer elemento distractor y objetivo en segunda posición.
6. Coco Corre: herramientas, frutas, animales, deportes, naturaleza y ciencia.
7. Coco Corre: color morado mezclado con otros colores en la misma regla.
8. Coco Corre: obstáculos pequeños y mensajes no técnicos.
9. Diferencias: cerebro y pico de Coco presentes en las 10 escenas como cambios de color.
10. Diferencias: luminosidad 1.24 y sin pistas previas.
11. Coco Pádel: torneo, ranking, WhatsApp, XLSX e impresión.
12. Las 15 miniaturas sociales continúan presentes a 1200 × 630.
13. PWA con caché v150 y todos los recursos de precaché existentes.
14. Rollback v150 sin borrado de datos.

## Nota sobre la antigua prueba v149

La prueba `La base v148 permanece idéntica...` del script histórico v149 busca dos carpetas de trabajo externas que no forman parte del ZIP distribuible. Por eso no se utiliza como criterio de esta entrega; no representa un fallo de la aplicación.

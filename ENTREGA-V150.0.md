# Coco en Forma v150.0 — Entrega para GitHub

## Objetivo

Actualizar la base v149.0 sin reescribir el proyecto: corregir la experiencia de clasificación dentro de los juegos, enriquecer contenido/variedad y mejorar especialmente Coco Corre y Encuentra las diferencias.

## Resultado

### Clasificación sin duplicados

Las tarjetas muestran únicamente una etiqueta de tipo de clasificación. El jugador no puede abrir desde ahí un ranking paralelo que lo presente como número 1. La consulta de posiciones queda en la pestaña Clasificación de la navegación principal.

### Coco Corre

El runner combina 8 colores, 7 figuras y 8 categorías temáticas. Tras cada regla nueva hay dos distractores antes del primer objetivo. Para reglas de color sobre frutas/herramientas/otros objetos, el objeto se tiñe visualmente y muestra un indicador del color, de modo que el desafío se entiende por la imagen y no por una regla interna invisible.

### Encuentra las diferencias

Los 10 escenarios mantienen dos escenas comparables, ahora más luminosas. Se añaden cambios visibles en Coco —cerebro y pico— con zonas específicas por escena y recolor selectivo del propio personaje. Cada combinación incluye al menos un cambio en Coco además del pool de objetos.

### Contenido y variedad

Se amplían vocabulario, pistas, afirmaciones, temas de memoria y vocabularios de sopa de letras. Los juegos procedimentales conservan sus generadores y rotación anti-repetición. La auditoría v150 cubre 15 accesos y 45 combinaciones juego/nivel.

## Compatibilidad

- Base: v149.0.
- Sin migración SQL nueva.
- Service worker: `coco-en-forma-v150.0.0-r1`.
- Sin eliminación de archivos de producción de v149.
- Se mantiene el ranking operativo por torneos de Coco Pádel.

## QA

- 11/11 pruebas funcionales específicas v150.
- 69/69 recursos HTTP locales con 200 y 0 errores 404.
- 27/27 miniaturas sociales servidas como PNG.
- 20/20 scripts inline de `index.html` con sintaxis válida.
- 0 recursos faltantes en el precaché declarado.

La versión no ha sido publicada ni conectada contra datos reales de producción durante la preparación del ZIP.

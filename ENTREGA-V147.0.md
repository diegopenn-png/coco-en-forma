# Coco en Forma v147.0

Versión de prueba creada exclusivamente desde la v146.0. La copia situada en `coco-v147/base-v1460` se conserva intacta. Esta entrega no se ha publicado ni desplegado.

## Encuentra las diferencias

- Se retiraron por completo los círculos, estrellas y figuras brillantes que señalaban las respuestas antes de jugar.
- Las zonas táctiles son transparentes, no contienen texto visible, no reciben foco y no revelan su ubicación.
- Las diferencias se integran en la escena mediante recoloración del objeto real, cambios de piezas completas y objetos contextuales presentes o ausentes.
- No se emplean objetos rotos, deformados, derretidos, borrosos ni artefactos gráficos.
- Solamente después de acertar aparece una pequeña confirmación con una marca de verificación; nunca aparece antes del acierto.
- Se mantiene la posibilidad de pulsar desde cualquiera de las dos imágenes con una única definición normalizada para imagen y zona interactiva.
- Se completaron 30 partidas reales en navegador —los 10 escenarios en los tres niveles— y se renderizaron las 90 combinaciones de escena, nivel y variante para verificar 450 diferencias píxel a píxel.

## Coco Corre — Misión Cerebro

- Los objetivos aumentaron de tamaño y conservan una escala legible durante toda su aproximación.
- Cada tarjeta incluye un símbolo grande y una etiqueta breve, por ejemplo `TRIÁNGULO`, `ÁTOMO` o `NÚMERO`.
- Se mejoró la perspectiva lateral y vertical para que el objeto se identifique con tiempo suficiente.
- Se añadió sonido neutral de aproximación a todos los objetos sin revelar si son correctos o distractores.
- Los obstáculos utilizan una advertencia sonora distinta, pero no punitiva.
- Cambio de carril, salto y agachado tienen respuestas sonoras breves.
- Aciertos, distractores, colisiones, cambios de tramo y finalización conservan su feedback propio.
- El audio se desbloquea desde el gesto inicial para funcionar correctamente en Safari y en la PWA instalada.
- El botón de sonido y la preferencia del usuario continúan respetándose.
- Coco permanece visualmente estable; solo se mueve de forma breve al cambiar de carril, saltar o agacharse.
- Se mantiene la misión finita, el límite diario y la puntuación única en la clasificación general.

## Coco Pádel

Coco Pádel no recibió cambios funcionales en esta revisión. Se comprobó nuevamente que mantiene exactamente tres pestañas, que Mixing no guarda puntos ni historial y que las jornadas de Campeonato recalculan la clasificación correctamente.

## Pruebas superadas

- 20/20 pruebas funcionales.
- 14/14 pruebas reales en Chromium Headless Shell.
- 30 partidas completas de diferencias terminadas en navegador.
- 90 combinaciones de escena, nivel y variante verificadas mediante render real.
- 450 diferencias verificadas píxel a píxel.
- Anchos comprobados: 320, 360, 390 y 430 píxeles, además de escritorio a 1440 píxeles.
- Sin errores JavaScript, rutas locales rotas ni peticiones 404 durante las pruebas.
- Service worker actualizado a `coco-en-forma-v147.0.0-r1`.

## Base de datos

No se necesita ninguna migración nueva. Las migraciones existentes de la v144 permanecen sin cambios.

## Publicación

No se ha publicado ni desplegado la v147.0. Debe probarse en una rama o entorno separado y publicarse únicamente después de la aprobación expresa del propietario.

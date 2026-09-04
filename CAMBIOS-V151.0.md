# Coco en Forma v151.0 — nueva línea estable

Base única de esta entrega: **Coco-en-Forma-v150.0-listo-para-GitHub.zip** (SHA-256 `72092926d45e78a8a05a37c19a1ac47068c434d1ae7e60b3a86e69dbd2895530`).

La v151.0 se construyó de forma modular sobre esa base. No se sustituyeron los módulos estables de login, clasificación general, Supabase, límite diario, Coco Med, Coco Fútbol ni el resto de juegos.

## Encuentra las diferencias

- 10 escenas conservadas, ahora con **3 variantes precompuestas por escena**.
- 40 WebP locales nuevos: 10 originales iluminados + 30 variantes modificadas.
- Las diferencias se integran en objetos reales de la escena (cerebro/pico de Coco, herramientas, macetas, taza, discos, robot, etc.).
- Se elimina la fabricación de diferencias mediante formas, parches o zonas pintadas en tiempo de ejecución.
- El juego muestra 4 / 5 / 6 diferencias según nivel.
- Los hotspots funcionan sobre ambas imágenes y solo se marcan después del acierto.
- Luminosidad media de las escenas originales v151: **+38,7 %** frente a las escenas v141 usadas por la base.

## Coco Pádel

- Terminología visible unificada en **Campeonato**. No queda la palabra “torneo” en el módulo activo.
- Eliminada la exportación a Excel y la impresión.
- Se mantienen solo **Enviar por WhatsApp** y **Copiar**.
- Nuevo buscador explícito de jugadores con botón **Buscar**, coincidencia parcial e insensible a mayúsculas/tildes, scroll a la ficha y resaltado temporal.
- Las jornadas se crean con nombres `Jornada 1`, `Jornada 2`, etc.
- Carga de resultados **set a set** (hasta 3 sets visibles), compatible con marcadores tipo 6-4 / 3-6 / 10-7.
- El ranking se recalcula desde los resultados guardados como única fuente de verdad.
- Estadísticas acumuladas: PJ, PG, PP, sets ganados/perdidos/diferencia, games ganados/perdidos/diferencia, puntos y posición.
- La ficha de cada jugador agrega campeonatos jugados, jornadas disputadas, estadísticas y posición en campeonatos activos.
- Corregir o borrar un resultado recalcula la clasificación; no duplica estadísticas.
- Persistencia continúa usando el estado JSON existente (`coco_padel_club_state`) y almacenamiento local de respaldo.

## Coco Corre — Street Skate

- Nuevo concepto visual **street-skate** manteniendo el recurso oficial de Coco (`coco-v2-runner-v144.png`).
- Coco avanza sobre una tabla de skate integrada en la escena.
- Animación de impulso/inclinación al cambiar de carril.
- Acciones: cambio de carril, **saltar** y **agacharse**.
- Obstáculos visuales: barricada y barrera elevada, sin bloques genéricos.
- Escenario urbano con asfalto, edificios, muro, grafitis y mobiliario de calle.
- Consignas con duración máxima de 15 s: 15 / 12 / 10 s según nivel.
- Tras cada cambio de regla, el primer objeto es un distractor; nunca se sirve la respuesta correcta inmediatamente.
- 11 categorías: herramientas, frutas, animales, deportes, naturaleza, ciencia, material escolar, alimentos, instrumentos, vehículos y objetos cotidianos.
- Catálogo sin emojis; presentación tipográfica y cromática integrada con el juego.

## Puntuaciones y clasificación

- Se eliminan/ocultan los micro-puntajes redundantes de las tarjetas de juegos.
- Las tarjetas dejan de consultar estadísticas para fabricar esos valores.
- Se conserva intacto el acceso principal **Clasificación** y la RPC `clasificacion_general_coco`.
- El registro real de partidas y puntuaciones permanece activo: se modifica la visualización de tarjetas, no el almacenamiento competitivo.

## PWA

- Caché actualizada a `coco-en-forma-v151.0.0-r1`.
- Manifest actualizado a `?source=pwa-v151`.
- Los 40 nuevos recursos de Diferencias se incluyen en el precaché.

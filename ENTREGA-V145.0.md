# Coco en Forma v145.0 — entrega de prueba

Estado: **candidata para revisión, no publicada ni desplegada**.

La versión v145.0 parte exclusivamente del ZIP íntegro de v144.0. La copia congelada de esa base se conservó sin cambios y su SHA-256 es:

`505b59de4e7250c006d897d9ce9e87d20fff960cc7d8b11bfdba5e750f3b1335`

## Coco Corre — Misión Cerebro

- Texto, generador y validación utilizan una misma definición de regla.
- Cada regla genera deliberadamente objetivos correctos y distractores válidos.
- Los dos primeros objetos tras iniciar o cambiar una regla son objetivos correctos.
- Después existe un máximo de 2, 3 o 4 apariciones no correctas consecutivas en Básico, Intermedio y Avanzado.
- Una estrella solicitada se representa siempre como `★`; ya no puede ser reemplazada visualmente por un número.
- Se validan formas, colores, pares, impares, categorías, forma + color, categoría + color, memoria, reglas inversas y operaciones.
- Las secuencias de memoria generan el color esperado en el orden solicitado.
- Los objetos de una regla anterior se retiran al cambiar el criterio para evitar respuestas desincronizadas.
- Antes de iniciar, la misión comprueba objetivos, distractores y presupuesto mínimo de apariciones. Si falla, se regenera.
- Se eliminó todo identificador técnico visible. Solo aparece: “La dificultad cambia las reglas y los distractores, no solo la velocidad.”
- Se añadieron capas de parallax, flujo de carretera, marcas de carril, señales laterales, ciclo corporal, inclinación, salto, agachado, sombra y transiciones de tramo.
- Continúa siendo finito, una vez al día, sin clasificación propia y sin escribir en `partidas` ni en la clasificación general.

## Coco Pádel

La navegación principal tiene exactamente:

1. Mixing.
2. Campeonato.
3. Jugadores.

### Mixing

- Selecciona únicamente jugadores activos ya registrados.
- Recupera el nivel guardado.
- Configura pistas y rondas.
- Genera, regenera y permite ajustar una pareja.
- No registra marcadores.
- Se mantiene solo en memoria mientras está abierto.
- No se añade a `state.sessions`, no crea historial, no suma puntos y no afecta estadísticas.
- Los mixings históricos de versiones anteriores se conservan en los datos, pero se ignoran y no se muestran.

### Campeonato

- Mantiene creación, participantes, jornadas ilimitadas, parejas, partidos y resultados.
- Permite guardar, corregir y deshacer resultados con confirmación.
- La clasificación se recalcula siempre desde los resultados guardados.
- Conserva puntos, PJ, PG, PP, empates, games ganados/perdidos, diferencia y posición.
- Admite puntos por resultado o games ganados, con criterios de desempate visibles.
- Permite finalizar, reabrir, archivar y revisar niveles manualmente.

### Jugadores

- Es el único lugar donde se crean jugadores.
- Busca por nombre o código y filtra por nivel y estado.
- Muestra nombre, código permanente, nivel, estado y puntos de campeonatos.
- Permite editar nombre, cambiar nivel y dar de alta o baja.
- Una baja nunca elimina datos ni reutiliza el código.
- Los puntos mostrados proceden exclusivamente de resultados de campeonatos.
- La ficha conserva el nivel histórico capturado en cada jornada.

## Datos y migraciones

No hace falta una migración nueva para v145.0. Se reutiliza de forma compatible el estado `coco_padel_club_state` y la tabla personal `coco_runner_history` introducida en v144.0. Los SQL aditivo y de reversión de v144.0 se incluyen sin cambios.

## Límites verificados

- Coco Pádel sigue siendo ilimitado.
- Coco Corre no modifica la clasificación general.
- Mixing no guarda historial ni suma puntos.
- No se retiró ni destruyó información existente.
- No se publicó ni desplegó esta candidata.

Consulta `PRUEBAS-V145.0.md` para los resultados y `LEEME-RESPALDO-Y-PRUEBA-V145.0.txt` para probarla sin sustituir la aplicación pública.


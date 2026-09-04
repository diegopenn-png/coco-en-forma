# Entrega — Coco en Forma v149.0

Fecha: 15 de agosto de 2026.

## Estado de la entrega

- Versión preparada: **v149.0**.
- Base utilizada: **v148.0**.
- Copia congelada e intacta: `coco-v149/base-v1480`.
- Publicación o despliegue realizados: **no**.
- Aplicación pública sustituida: **no**.
- Datos históricos eliminados: **ninguno**.

## Coco Corre — Misión Cerebro

- Cada tramo se construye desde una única definición compartida por la instrucción, el generador y el validador.
- La validación previa rechaza y regenera misiones imposibles.
- Triángulos, estrellas, colores, categorías, paridad y combinaciones aparecen cuando se solicitan.
- Al cambiar la regla se intercala un patrón justo de distractor, objetivo, distractor, objetivo; no se entrega una fila de respuestas correctas.
- En “herramientas moradas” aparecen herramientas moradas y herramientas de otros colores.
- Los objetivos llegan con frecuencia suficiente y se controla el máximo de distractores consecutivos.
- Coco permanece estable; carril, salto y agachado usan transiciones breves y funcionales.
- Se redujo la huella visual de Coco y de los obstáculos para que un cambio correcto de carril deje separación visible.
- Se ampliaron los objetos y se añadió sonido neutral de aproximación, aviso de obstáculo, acierto y error.
- La interfaz no muestra errores de Supabase, identificadores ni reglas internas de programación.
- Coco Corre entra en la clasificación general, con tope y ponderación de 320 puntos, escritura única y sin puntuar partidas abandonadas.
- Se añadió la migración reversible `supabase-coco-v149.sql` para aceptar `cococorre` y una función segura de guardado cuando RLS impida una inserción directa.

## Coco Pádel

- Mantiene exactamente tres pestañas: **Mixing**, **Campeonato** y **Jugadores**.
- La portada de Campeonato muestra creación, campeonatos activos y el acceso **Ranking actualizado por torneos**.
- El selector permite elegir un campeonato y consultar su clasificación recalculada desde los resultados guardados.
- Ranking, jornadas, orden de pista y jugadores pueden copiarse para WhatsApp, imprimirse o exportarse a un archivo `.xlsx` real.
- El Excel se genera localmente, sin servicios externos ni librerías remotas.
- Las jornadas se vinculan a un solo campeonato; corregir o eliminar un resultado recalcula puntos, games y posiciones sin contadores irreversibles.
- Mixing continúa temporal, ilimitado, sin historial, sin resultados puntuables y sin modificar estadísticas.
- Jugadores conserva códigos permanentes, homónimos, nivel manual, alta/baja y resumen acumulado sin mostrar parejas o rivales que recarguen la pantalla.
- Diseño optimizado para móvil, PWA, tableta y ordenador, con tarjetas compactas para clasificaciones estrechas.

## Encuentra las diferencias

- No se muestran círculos, estrellas ni marcas que revelen las respuestas antes de jugar.
- Se conservan únicamente diferencias naturales de color, forma completa y presencia/ausencia.
- No se usan objetos rotos, deformados ni artefactos gráficos.
- Se verificaron 90 combinaciones y 450 diferencias mediante renderizado y comparación de píxeles.
- La región interactiva procede de la misma definición visual y funciona desde ambas imágenes.

## Cuenta de pruebas

Solo `diegopenn@icloud.com` tiene repeticiones ilimitadas en todos los juegos. La primera partida diaria puede puntuar; las repeticiones del mismo juego y día son de prueba y no duplican puntuación. Todos los demás usuarios conservan el límite de una partida diaria por juego. Coco Pádel sigue siendo ilimitado para todos.

## Miniaturas sociales

Los 15 juegos activos tienen una página compartible y una miniatura propia de 1200 × 630 píxeles con metadatos Open Graph y Twitter. Los enlaces compartidos desde la aplicación usan esas páginas para que WhatsApp y otras redes puedan mostrar la tarjeta del juego.

## Base de datos

La migración v149:

1. Respalda la definición previa de las restricciones de `partidas.juego`.
2. Añade `diferencias` y `cococorre` al catálogo válido conservando identificadores históricos.
3. Crea `registrar_coco_corre_v149(integer)` con autenticación, tope de puntos y protección diaria.
4. No borra ni modifica partidas históricas.

La reversión elimina la función, restaura las restricciones anteriores y no borra las partidas ya registradas. Los archivos son:

- `supabase-coco-v149.sql`
- `supabase-coco-v149-rollback.sql`

## Confirmaciones

- Coco Corre puede generar y completar todos los objetivos auditados: **sí**.
- Coco Corre guarda en la clasificación general una sola vez: **sí, con la migración v149 aplicada**.
- Las repeticiones ilimitadas de la cuenta de prueba no duplican puntos: **sí**.
- Mixing guarda historial o puntos: **no**.
- Las jornadas de Campeonato se acumulan y recalculan: **sí**.
- Encuentra las diferencias revela respuestas mediante círculos o estrellas: **no**.
- Coco Pádel continúa ilimitado: **sí**.
- Publicación realizada: **no**.

Consulta `PRUEBAS-V149.0.md` para el alcance exacto de las pruebas y `LEEME-RESPALDO-Y-PRUEBA-V149.0.txt` antes de probar o subir archivos.

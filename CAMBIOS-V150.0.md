# Coco en Forma v150.0 — nueva línea desde v149.0

## Base de trabajo

Esta entrega se ha reconstruido **exclusivamente** desde el ZIP sano aportado por el usuario:

- `Coco-en-Forma-v149.0-prueba(3).zip`
- SHA-256 del ZIP base: `3f430b4a1383b367e3b0c5d3eade537a7fec872e8964d2dce5e883573e320e0d`

No se ha copiado código de las antiguas v150–v155 descartadas.

## 1. Clasificaciones

- La clasificación general ya no depende de una lectura directa de `partidas` que, bajo RLS, podía mostrar únicamente al usuario conectado.
- Nueva RPC segura `clasificacion_general_coco(p_limit)` para ordenar a todos los jugadores por la suma de los 12 retos generales.
- Nueva RPC segura `clasificacion_juego_coco(p_juego, p_limit)` para las clasificaciones específicas de Coco Med y Coco Fútbol.
- La respuesta incluye posición, puntos totales, mejor partida, número de partidas, total de jugadores y marca del usuario conectado.
- No se exponen correos ni otros datos privados.
- Migración aditiva y rollback incluidos.

## 2. Coco Corre — Misión Cerebro

- Se conserva el patrón justo tras cada cambio de regla: primero aparece un distractor, después un objetivo y continúan intercalados.
- Se amplía la variedad visual de categorías a: herramientas, frutas, animales, deportes, naturaleza y ciencia.
- Cada familia dispone de al menos 6 elementos diferentes.
- Las reglas por color siguen mostrando simultáneamente el color objetivo y colores distractores.
- Los tokens muestran un marco del color real para que las combinaciones categoría + color sean inequívocas incluso con emoji.
- Se mantienen obstáculos reducidos y separación segura entre carriles.
- Se mantienen ocultos los errores técnicos y reglas internas de programación.

## 3. Coco Pádel

Se conserva y valida la herramienta de la v149.0:

- Tres áreas limpias: Mixing, Campeonato y Jugadores.
- Ranking actualizado por torneo.
- Varias jornadas por campeonato con acumulación y recálculo de puntos.
- Exportación XLSX real.
- Copia para WhatsApp.
- Impresión.
- Datos de jugadores con códigos permanentes.
- Mixing separado de los puntos oficiales de campeonato.
- Uso ilimitado como herramienta del club.

## 4. Encuentra las diferencias

- Diez escenas cinematográficas conservadas.
- En las diez escenas se añaden cambios detectables sobre Coco: cerebro y pico pueden cambiar de color.
- Las zonas visuales de cerebro y pico son más precisas que las zonas táctiles para mantener facilidad de pulsación en móvil sin colorear áreas excesivas.
- Luminosidad elevada de `1.20` a `1.24`, con contraste y saturación ligeramente reforzados.
- Se mantienen únicamente diferencias naturales de color, forma o presencia.
- No hay círculos, estrellas ni marcadores que revelen respuestas antes del acierto.

## 5. Contenido, miniaturas y PWA

- Se conserva el banco enriquecido y el sistema anti-repetición de la v149.0 para los retos activos.
- Coco Corre amplía sus familias y objetos para aumentar combinaciones reales.
- Encuentra las diferencias mantiene 10 escenas × 3 variantes × 3 niveles.
- Se conservan las 15 miniaturas sociales 1200 × 630 y las páginas de compartir de cada juego.
- Caché PWA actualizada a `coco-en-forma-v150.0.0-r1`.
- Manifiestos actualizados a `source=pwa-v150`.

## Supabase

Si la base v149.0 ya estaba instalada en Supabase, ejecutar solamente:

- `supabase-coco-v150.sql`

Si se parte de una base anterior, ejecutar primero:

1. `supabase-coco-v149.sql`
2. `supabase-coco-v150.sql`

Rollback exclusivo de esta entrega:

- `supabase-coco-v150-rollback.sql`

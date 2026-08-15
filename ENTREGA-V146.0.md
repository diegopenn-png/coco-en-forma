# Coco en Forma v146.0 — entrega de prueba

Estado: **candidata para revisión; no publicada, desplegada ni conectada a la aplicación pública**.

Esta versión parte exclusivamente de v145.0. La copia de seguridad original permanece intacta en `Coco-en-Forma-v145.0-prueba.zip` y se entrega por separado, sin anidarla dentro del ZIP v146.0. Su SHA-256 es:

`6b17c8340f6f36774a8be2a4b70b94067ecc32e46f3dfee183658f1ff39479f4`

## Coco Corre — Misión Cerebro

- La instrucción, el generador, la validación y la puntuación usan una misma definición de regla.
- Triángulos, estrellas, círculos, cuadrados, colores, números, categorías, combinaciones, memoria y cálculo generan objetivos compatibles.
- Los dos primeros objetos de cada regla son válidos. Después se limita la racha máxima de distractores a 2, 3 o 4 según el nivel.
- Una validación previa rechaza cualquier misión sin objetivos, distractores o tiempo suficientes.
- Al cambiar la regla se retiran los objetos anteriores y se empieza con objetivos de la regla nueva.
- Coco permanece visualmente estable. Solo responde de forma breve al cambio de carril, salto, agachado o colisión; la sensación de avance procede del escenario.
- Se mejoraron profundidad, carretera, parallax, carriles, señalización, contraste, controles y transiciones.
- No se muestran semillas, códigos ni identificadores técnicos.
- La misión continúa siendo finita, dura aproximadamente entre 2 y 4 minutos y admite una partida diaria.
- Al completarla se calcula una puntuación de 0 a 320 mediante precisión, objetivos, control inhibitorio, memoria, obstáculos y dificultad. La velocidad no es el único criterio.
- La puntuación se registra una sola vez mediante el servicio oficial de clasificación general. Abandonar no suma puntos.
- El historial personal del runner se conserva además de la puntuación general.

## Coco Pádel

La navegación principal contiene exactamente:

1. Mixing.
2. Campeonato.
3. Jugadores.

### Mixing

- La portada muestra `Crear nuevo mixing` y, si corresponde, `Continuar mixing` o `Descartar mixing`.
- El flujo se divide en cinco pasos: jugadores, pistas/rondas, revisión, ajuste y orden de juego.
- Solo usa jugadores activos y recupera sus niveles guardados.
- Es temporal: no registra resultados, no guarda historial, no suma puntos y no modifica campeonatos ni estadísticas.

### Campeonato

- La portada muestra primero `Crear campeonato`, los campeonatos activos y un acceso secundario a finalizados/archivados.
- Cada campeonato se abre en una pantalla de detalle independiente.
- `Plantilla del campeonato` se retiró de la vista; los participantes siguen conservados y pueden editarse desde una acción secundaria.
- `Añadir jornada` crea sesiones vinculadas únicamente al campeonato correcto.
- La clasificación se deriva siempre de los resultados guardados: PJ, PG, PE, PP, GG, GP, diferencia, puntos y posición.
- Corregir o eliminar un marcador recalcula la clasificación completa sin contadores irreversibles ni duplicaciones.
- Se verificó un campeonato simulado con 20 jornadas.

### Jugadores

- Es el único lugar de alta y administración de jugadores.
- Permite buscar por nombre o código, filtrar por nivel/estado y diferenciar homónimos mediante códigos permanentes `CP-0001`, `CP-0002`, etc.
- Desde cada resumen se puede editar el nombre, cambiar manualmente entre nivel bajo/medio/alto y dar de alta o baja.
- Una baja es lógica, nunca destructiva; conserva código, nivel y datos históricos.
- La vista muestra solo el resumen solicitado. Parejas, rivales y partidos individuales permanecen en los datos para los cálculos, pero no se presentan aquí.
- Los puntos visibles proceden exclusivamente de campeonatos.

## Encuentra las diferencias

- Solo se permiten cambios de color claramente perceptibles, sustituciones por formas completas y objetos presentes/ausentes.
- No se usan roturas, deformaciones, recortes, estiramientos, desenfoques, borrados ni artefactos gráficos.
- Las dos escenas se dibujan completas y con mayor luminosidad.
- La misma definición normalizada genera el cambio visual y su región interactiva.
- Cada diferencia responde desde cualquiera de las dos imágenes, se cuenta una sola vez y los clics falsos no se aceptan.
- Las zonas solapadas priorizan la diferencia no encontrada más próxima, evitando objetivos imposibles.
- Se validaron 90 combinaciones y 450 diferencias mediante renderizado real, además de completar 30 partidas en navegador.

## Datos, compatibilidad y migraciones

- No existe una migración nueva para v146.0.
- Se conservan los SQL aditivo y reversible de v144.0 sin cambios.
- Coco Pádel normaliza el estado previo y no elimina jugadores, campeonatos, jornadas ni resultados históricos.
- El nombre físico de algunos archivos `coco-v144-*.js` se mantiene para no romper rutas ni instalaciones existentes; las API activas publican la versión v146.
- `supabase-js` 2.112.3 se incluye localmente, junto con su licencia MIT, para eliminar la dependencia de carga del SDK desde un CDN.
- El service worker usa una caché v146 nueva y retira cachés anteriores durante la activación.

## Confirmaciones

- Coco Corre aparece en la clasificación general y guarda como máximo una puntuación por finalización.
- Una partida abandonada de Coco Corre no suma puntos.
- Coco Pádel continúa siendo ilimitado.
- Mixing no conserva historial ni suma puntos.
- Las jornadas de Campeonato acumulan y recalculan correctamente.
- Encuentra las diferencias no utiliza objetos rotos o deformados.
- Las comprobaciones de navegador no detectaron errores JavaScript no controlados, rutas locales rotas ni respuestas 404 locales.
- No se publicó ni desplegó v146.0.

Consulta `PRUEBAS-V146.0.md`, `ARCHIVOS-V146.0.md` y `LEEME-RESPALDO-Y-PRUEBA-V146.0.txt` antes de probar o mover archivos.

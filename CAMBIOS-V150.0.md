# Coco en Forma v150.0 — Cambios

Fecha: 16 de agosto de 2026.
Base: v149.0.

## Clasificación

- Dentro de las tarjetas y pantallas de juego, la clasificación queda reducida a una etiqueta informativa: **Clasificación general** o **Clasificación específica**.
- Esas etiquetas no tienen navegación, botón, `role=button`, foco de teclado ni apertura de modal de ranking.
- Se retiran los accesos paralelos a clasificaciones desde introducciones y resultados de juego.
- La consulta real de posiciones continúa centralizada en la pestaña principal **Clasificación**, junto a Mis retos y Mis tarjetas.
- Coco Med y Coco Fútbol se identifican como clasificación específica; los retos generales como clasificación general.
- Coco Pádel conserva su **ranking actualizado por torneos** dentro de la herramienta del club porque pertenece a la gestión del campeonato y no al ranking genérico de puntos.

## Coco Corre

- 8 colores, 7 figuras y 8 familias de objetos: herramientas, frutas, naturaleza, ciencia, colegio, deportes, espacio y cocina.
- Se añaden martillos, llaves, destornilladores, engranajes, frutas variadas, material escolar, objetos científicos, deportivos, espaciales y de cocina.
- Las reglas combinadas pueden pedir, por ejemplo, **herramientas moradas** o una figura concreta de un color concreto.
- Los objetos de categoría se tiñen visualmente con el color correspondiente, conservando volumen y detalle, y además muestran un indicador cromático y el nombre del color.
- Cuando cambia una regla, aparecen **dos distractores antes del primer objetivo correcto**. Una regla nueva como «cuadrados azules» no entrega un cuadrado azul inmediatamente.
- Se mezclan objetivos y distractores de forma controlada para conservar dificultad sin volver la misión imposible.

## Encuentra las diferencias

- Los 10 escenarios se presentan con mayor luminosidad, contraste y saturación para facilitar la lectura visual.
- Cada escenario dispone de al menos 8 cambios candidatos y el sistema sigue seleccionando la cantidad adecuada según el nivel.
- Se incorporan diferencias detectables sobre Coco: **cambio de color del cerebro** y **cambio de color del pico**.
- Cada combinación diaria incluye al menos una diferencia visible en Coco; las transformaciones de color afectan al elemento real y no añaden un parche plano.
- Las zonas de cerebro y pico se ajustaron individualmente a cada escena para mantener el cambio dentro del personaje.
- Se mantienen las diferencias de objetos, presencia/ausencia y cambios completos de forma, evitando microdetalles poco legibles.

## Contenido y variedad de los 15 juegos/módulos

- Se auditan los 15 accesos actuales: Une los números, Cálculo veloz, Descifra la palabra, Series lógicas, Memoria, Sudoku, Sopa de letras, Crucigrama, Reto Tiempo, Verdadero o falso, Encuentra las diferencias, Coco Corre, Coco Med, Coco Fútbol y Coco Pádel Club.
- Se amplía el vocabulario real de Descifra la palabra y Crucigrama, con nuevas pistas de ciencia, lógica, naturaleza, orientación, tecnología y lenguaje.
- Se añaden nuevas afirmaciones verificadas a Verdadero o falso, repartidas entre los tres niveles.
- Memoria incorpora 12 nuevos temas visuales y Sopa de letras incorpora nuevos vocabularios y categorías por dificultad.
- Los juegos procedimentales mantienen sus generadores y sistema anti-repetición, con inventario de rotación v150 de al menos 40 combinaciones por nivel y pools más amplios.
- Coco Med conserva su banco académico extenso y su rotación estratificada; Coco Fútbol conserva variación de secuencias/velocidad; Pádel conserva combinaciones de mixing y campeonatos.

## Compatibilidad

- No se elimina ningún juego ni archivo histórico de la base v149.0.
- No se requiere una migración nueva de Supabase para estos cambios.
- Se renueva la caché PWA a `coco-en-forma-v150.0.0-r1`.

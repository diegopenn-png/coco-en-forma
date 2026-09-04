# Inventario de contenido — Coco en Forma v144.0

Cada cantidad de la tabla corresponde a combinaciones o semillas estables **por nivel**. Todos los juegos se auditan en básico, intermedio y avanzado.

| Juego o módulo | Combinaciones por nivel | Variación principal |
|---|---:|---|
| Une los números | 180 | recorridos y distribuciones numéricas |
| Cálculo veloz | 160 | operaciones y valores verificados |
| Descifra la palabra | 60 | palabras, definiciones y dificultad léxica |
| Series lógicas | 120 | patrones y reglas |
| Memoria | 60 | temas, elementos y secuencias |
| Sudoku | 80 | tableros y distribuciones |
| Sopa de letras | 120 | vocabulario y colocaciones |
| Crucigrama | 80 | selecciones de palabras y pistas |
| Reto tiempo | 160 | microdesafíos y parámetros temporales |
| Verdadero o falso | 36 | afirmaciones explicadas por nivel |
| Coco Med | 180 | preguntas verificadas; ampliación opcional exclusiva |
| Fútbol | 120 | preguntas y señales |
| Encuentra las diferencias | 30 | 10 escenarios × 3 variantes |
| Coco Corre | 30 | reglas, secuencias, cálculos y criterios de recogida |

## Bancos verificados

- Palabras básicas disponibles: 83.
- Palabras intermedias disponibles: 48.
- Palabras avanzadas disponibles: 76.
- Afirmaciones de nivel básico: 49.
- Afirmaciones de nivel intermedio: 45.
- Afirmaciones de nivel avanzado: 26.
- Entradas totales de crucigrama: 225.
- Temas totales de memoria: 30.
- Preguntas adicionales de Coco Med: 180.

## Contenido incorporado en v144.0

- 29 palabras y definiciones únicas.
- 31 entradas nuevas de crucigrama.
- 36 afirmaciones con respuesta y explicación verificadas.
- 12 temas de memoria con doce iconos cada uno.
- 30 combinaciones por nivel para el nuevo runner.
- 30 combinaciones por nivel para diferencias.

## Antirrepetición

Cada reto tiene un identificador estable. La selección usa una bolsa barajada separada por usuario, juego y nivel. El historial se conserva mediante la rotación remota existente y el respaldo local `coco_v134_rotation_`. Solo se reinicia al agotar el conjunto y evita repetir inmediatamente el último reto del ciclo anterior.


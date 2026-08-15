# Pruebas realizadas — Coco en Forma v150.0

Fecha: 16 de agosto de 2026.

## Resultado automatizado

| Bloque | Resultado |
|---|---:|
| Suite funcional específica v150 | **11/11 PASS** |
| Recursos HTTP locales | **69/69 HTTP 200** |
| Peticiones 404 en inventario HTTP | **0** |
| Miniaturas sociales servidas | **27/27 image/png** |
| Scripts inline de `index.html` | **20/20 sintaxis válida** |
| JavaScript v150 modificado | **PASS** |
| `manifest.json` y `manifest.webmanifest` | **JSON válido** |
| Recursos declarados en precaché PWA | **0 faltantes** |

## Coco Corre

- 180 misiones de los tres niveles pasan prevalidación.
- El primer objetivo correcto aparece en la posición 3 del tramo: hay dos distractores previos.
- Se valida explícitamente que una regla nueva nunca entregue la respuesta en los dos primeros objetos.
- 8 colores, 7 figuras y 8 categorías disponibles.
- Herramientas y frutas participan en reglas combinadas por categoría + color.
- En una regla como herramientas moradas, los distractores iniciales siguen siendo herramientas de otros colores y el objetivo morado aparece después.
- El render de categorías usa un lienzo tintado `source-atop`, indicador cromático y etiqueta de color para que el color sea perceptible y no solo un dato interno.

## Clasificación

- No existe `leaderboardPreviewHtml` dentro del flujo de juego.
- No existen botones `data-open-leaderboard` ni botones de ranking en resultados paralelos.
- El badge de cada tarjeta se clona para retirar manejadores heredados y queda sin `role`, `tabindex`, `title` ni navegación.
- Las etiquetas visibles son Clasificación general / Clasificación específica.
- La pestaña principal Clasificación se conserva operativa.
- El ranking por torneos de Coco Pádel se mantiene porque pertenece a la gestión deportiva del club.

## Encuentra las diferencias

- 10 escenarios disponibles.
- Todos cuentan con al menos 8 diferencias candidatas.
- Brillo de escena configurado a 1,28 con refuerzo moderado de contraste/saturación.
- Todos los escenarios incluyen coordenadas propias para cerebro y pico de Coco.
- Las 3 variantes × 3 niveles de cada escena incluyen al menos una diferencia de Coco.
- El recolor de cerebro y pico selecciona píxeles del elemento correspondiente y no dibuja un parche rectangular/plano.

## Contenido

- 59 entradas nuevas únicas incorporadas por la extensión v150 inicial para palabra/crucigrama en una base limpia de prueba.
- 30 nuevas afirmaciones de verdadero/falso en la extensión v150 inicial.
- 12 nuevos temas de Memoria en la extensión v150 inicial.
- Sopa de letras incorpora vocabulario adicional por tema y dificultad.
- La segunda capa de contenido v150 añade contenido complementario evitando duplicados.
- Auditoría de rotación: 15 juegos/módulos × 3 niveles, mínimo 40 combinaciones por nivel, identificadores estables y sin duplicados.

## Limitaciones

No se ha iniciado sesión contra el Supabase público ni se ha publicado esta versión. La validación contra cuentas reales, audio/gestos en dispositivos físicos, actualización instalada de la PWA y vistas previas externas de WhatsApp debe realizarse después de subirla a un entorno HTTPS de prueba.

No se pudo ejecutar el test histórico `qa/v147-differences-render-tests.mjs` en este contenedor porque requiere el paquete opcional `@napi-rs/canvas`, no instalado en el entorno. La suite v150 verifica estructura, selección, coordenadas y lógica de recolor de las diferencias.

# Pruebas realizadas — Coco en Forma v147.0

| Área | Prueba | Resultado |
|---|---|---|
| Diferencias | Ausencia de círculos, estrellas y señales previas | SUPERADA |
| Diferencias | Hotspots transparentes antes del primer acierto | SUPERADA |
| Diferencias | Color, forma completa y presencia/ausencia | SUPERADA |
| Diferencias | 10 escenarios × 3 niveles terminados en navegador | SUPERADA |
| Diferencias | 10 escenarios × 3 niveles × 3 variantes renderizados | SUPERADA |
| Diferencias | 450 diferencias verificadas píxel a píxel | SUPERADA |
| Diferencias | Clic desde ambas imágenes y rechazo de clic falso | SUPERADA |
| Diferencias | Finalización completa de todas las combinaciones | SUPERADA |
| Diferencias | Escena musical avanzada equivalente a la captura recibida | SUPERADA |
| Runner | Objetivos grandes y con etiqueta legible | SUPERADA |
| Runner | Sonido neutral de aproximación | SUPERADA |
| Runner | Desbloqueo Web Audio en gesto inicial para Safari/PWA | SUPERADA |
| Runner | Sonidos de carril, salto, agachado, acierto y error | SUPERADA |
| Runner | Objetivos válidos, distractores y cambios de regla | SUPERADA |
| Runner | Triángulos, estrellas, círculos y cuadrados disponibles | SUPERADA |
| Runner | Coco estable, sin animación continua | SUPERADA |
| Runner | Registro único en la clasificación general | SUPERADA |
| Runner | Abandono sin puntuación | SUPERADA |
| Coco Pádel | Tres pestañas, Mixing temporal y Campeonato acumulativo | SUPERADA |
| Responsive | 320, 360, 390 y 430 píxeles | SUPERADA |
| Escritorio | 1440 × 900 píxeles | SUPERADA |
| PWA | Service worker v147 y recursos locales | SUPERADA |
| Regresión | Sin errores JavaScript ni 404 locales | SUPERADA |

## Ejecuciones

```text
node qa/v147-functional-tests.mjs
20/20 pruebas superadas.

COCO_QA_EVIDENCE=1 node qa/v147-differences-render-tests.mjs
90 combinaciones y 450 diferencias verificadas.

COCO_CHROMIUM_PATH=<ruta-chromium> node qa/v147-browser-tests.mjs
14/14 pruebas de navegador superadas.
```

Las capturas utilizadas para la inspección manual se incluyen en `qa/evidence-v147/`.

# Pruebas de Coco en Forma v145.0

## Ejecutadas en esta entrega

| Área | Prueba | Resultado |
|---|---|---|
| Runner | 80 semillas × 3 niveles pasan la validación previa | Aprobada |
| Runner | Objetivo y distractor para cada regla en Básico, Intermedio y Avanzado | Aprobada |
| Runner | Estrella visible como `★` cuando es el objetivo | Aprobada |
| Runner | Colores, formas, pares, impares, categorías y combinaciones | Aprobada |
| Runner | Secuencias de memoria, cambio de criterio y operaciones | Aprobada |
| Runner | Identificador técnico ausente y leyenda exacta presente | Aprobada |
| Runner | Duraciones finitas, límite diario y cero escrituras al ranking | Aprobada |
| Pádel | Exactamente Mixing, Campeonato y Jugadores | Aprobada |
| Pádel | Dos jugadores “Diego” con CP-0001 y CP-0002 | Aprobada |
| Pádel | Baja, edición y normalización conservan el código | Aprobada |
| Pádel | Mixing histórico excluido de puntos e historial | Aprobada |
| Pádel | Campeonato simulado con 20 jornadas | Aprobada |
| Pádel | Guardar, corregir y eliminar recalcula sin duplicar | Aprobada |
| Pádel | Cambio manual conserva nivel histórico | Aprobada |
| Integración | Recursos y rutas locales declaradas existen | Aprobada |
| PWA | 27/27 recursos esenciales respondieron HTTP 200 | Aprobada |
| Código | Sintaxis de núcleo, Pádel, runner, diferencias, contenido y service worker | Aprobada |
| Responsive | Reglas específicas para 320, 360, 390 y 430 px y protección de desbordamiento | Aprobada estática |

Resultado automatizado principal: **16/16 pruebas aprobadas**.

Comando:

```bash
node qa/v145-functional-tests.mjs
```

## Suite funcional de navegador incluida

`qa/v145-browser-tests.mjs` cubre apertura real, controles del runner, pausa, finalización, los cuatro anchos móviles, alta/baja, homónimos, Mixing temporal, creación de campeonato, resultados, recarga, consola y respuestas 404.

No pudo ejecutarse en el contenedor de construcción porque la librería Playwright estaba presente pero no existía ningún binario Chromium instalado. La suite detecta esa condición y la informa como `SKIP`; no se presenta como aprobada.

Para ejecutarla:

```bash
npx playwright install chromium
python3 -m http.server 8080
COCO_QA_URL=http://127.0.0.1:8080 node qa/v145-browser-tests.mjs
```

## Interpretación honesta

La lógica funcional, persistencia derivada, integridad de rutas y sintaxis quedaron verificadas. La comprobación visual/interactiva con un navegador real —incluidos ancho renderizado, consola en ejecución y gestos— debe completarse al probar el ZIP. No se afirma que esa suite se haya ejecutado en este entorno.


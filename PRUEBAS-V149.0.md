# Pruebas realizadas — Coco en Forma v149.0

Fecha: 15 de agosto de 2026.

## Resultados automatizados

| Bloque | Resultado | Cobertura |
|---|---:|---|
| Funcional v149 | 22/22 PASS | Runner, puntuación, migración, Pádel, miniaturas, Diferencias, cuenta ilimitada, PWA y responsive |
| Render de Coco Pádel | 4/4 PASS | Portadas de las tres pestañas, ranking por torneo y acciones de exportación |
| Recursos HTTP locales | 68/68 HTTP 200 | Archivos solicitados por la aplicación; 0 respuestas 404 |
| Miniaturas HTTP | 27/27 PNG | Tipo MIME correcto en los recursos sociales servidos |
| Diferencias renderizadas | 90/90 combinaciones | 450 diferencias verificadas píxel a píxel |
| Sintaxis | PASS | JavaScript principal, scripts de QA y ambos manifiestos JSON |

## Coco Corre

| Prueba | Resultado |
|---|---:|
| 180 misiones de los tres niveles pasan la validación previa | PASS |
| Triángulos y estrellas solicitados se generan con su forma real | PASS |
| Todas las familias de reglas producen objetivos suficientes | PASS |
| Inicio intercalado distractor–objetivo–distractor–objetivo | PASS |
| Herramientas moradas y herramientas de otros colores en el mismo tramo | PASS |
| Máximo de distractores consecutivos controlado por dificultad | PASS |
| Obstáculos con escala compatible con separación entre carriles | PASS |
| Coco estable con transiciones funcionales breves | PASS |
| Audio de aproximación, obstáculo, acierto y error conectado | PASS |
| Respuestas correctas no reveladas visualmente | PASS |
| Errores técnicos ocultos al usuario | PASS |
| Ruta `registrar_coco_corre_v149` y migración reversible presentes | PASS |
| Tope de 320 puntos y protección de duplicado diario | PASS |

## Coco Pádel

| Prueba | Resultado |
|---|---:|
| Exactamente tres pestañas principales | PASS |
| Dos jugadores “Diego” con códigos CP diferentes | PASS |
| Persistencia de código, nivel y estado | PASS |
| Mixing excluido de puntos e historial | PASS |
| Nivel histórico conservado después de un cambio manual | PASS |
| 20 jornadas acumuladas en un campeonato | PASS |
| Corrección de marcador sin duplicar partidos | PASS |
| Eliminación de resultado y recálculo | PASS |
| Aislamiento entre dos campeonatos | PASS |
| Ranking actualizado por torneo | PASS |
| Copia para WhatsApp | PASS |
| Impresión | PASS |
| XLSX estructuralmente válido | PASS |
| XLSX abierto y convertido por LibreOffice | PASS |
| Portadas y tarjetas móviles renderizadas mediante DOM controlado | PASS |

## Encuentra las diferencias

- 10 escenarios × 3 niveles × 3 combinaciones: 90 partidas comprobadas.
- 450 diferencias renderizadas y comparadas píxel a píxel.
- Únicamente color, forma completa y presencia/ausencia.
- Ausencia de círculos o estrellas que señalen respuestas antes del clic.
- Ausencia de objetos rotos o deformados.
- Zonas normalizadas compartidas por la definición visual e interactiva.

## PWA, recursos y miniaturas

- Los recursos locales declarados responden correctamente en un servidor HTTP aislado.
- No se detectaron peticiones 404 en el inventario automatizado.
- Los 15 juegos tienen miniatura propia de 1200 × 630 y página con Open Graph/Twitter.
- El service worker usa la caché `coco-en-forma-v149.0.0-r1`.
- Se verificaron reglas CSS específicas para 320, 360, 390 y 430 píxeles, áreas táctiles y reducción de movimiento.

## Limitación del entorno de pruebas

El contenedor no dispone de un ejecutable Chromium, Chrome o Firefox. Por ello no se ejecutó una regresión end-to-end en un navegador gráfico real ni se inició sesión contra el Supabase público. Se sustituyó esa cobertura por pruebas funcionales de módulos, render DOM controlado, servidor HTTP local, validación de XLSX y renderizado real de imágenes.

Antes de aprobar un despliegue se debe completar la comprobación manual descrita en `LEEME-RESPALDO-Y-PRUEBA-V149.0.txt`, especialmente:

1. Inicio de sesión con una cuenta normal y con `diegopenn@icloud.com`.
2. Escritura real en una copia de Supabase después de aplicar la migración v149.
3. Audio y gestos en iOS/Android.
4. Instalación y actualización de la PWA en dispositivos físicos.
5. Vista previa real de enlaces en WhatsApp, que además depende de que las páginas sean accesibles por HTTPS.

## Comandos ejecutados

```text
node qa/v149-functional-tests.mjs
node qa/v149-padel-ui-tests.mjs
node qa/v149-http-tests.mjs
node qa/v147-differences-render-tests.mjs
node --check coco-v144-runner.js
node --check coco-v144-padel.js
node --check coco-v144-core.js
node --check coco-v142-runtime.js
node --check coco-v144-differences.js
python3 -m json.tool manifest.json
python3 -m json.tool manifest.webmanifest
```

No se publicó ni desplegó ningún archivo durante estas pruebas.

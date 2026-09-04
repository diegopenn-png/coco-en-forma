# Pruebas realizadas — Coco en Forma v146.0

Fecha: 15 de agosto de 2026. Entorno: servidor HTTP local, Node.js y Chromium Headless Shell controlado con Playwright. La aplicación pública no se modificó.

## Resumen

| Suite | Alcance | Resultado |
|---|---|---:|
| `qa/v146-functional-tests.mjs` | Lógica, datos, rutas, PWA, responsive y migración | 19/19 PASS |
| `qa/v146-browser-tests.mjs` | Flujos reales de los tres módulos, persistencia, caché, consola y 404 | 13/13 PASS |
| `qa/v146-differences-render-tests.mjs` | Render real de 90 combinaciones y comparación de píxeles | 450/450 diferencias PASS |
| `qa/v146-visual-evidence.mjs` | Capturas reales a 320/390 px | 9 evidencias generadas |
| `node --check` | Sintaxis de módulos y suites v146 | PASS |

## Coco Corre

| Comprobación | Método | Resultado |
|---|---|---:|
| Triángulos, estrellas, círculos y cuadrados | Generación y validación en tres niveles | PASS |
| Colores, pares/impares, categorías y combinaciones | Barrido determinista de reglas | PASS |
| Secuencias, cambios de criterio y cálculo | Validación previa y planes completos | PASS |
| Primer objetivo y frecuencia suficiente | Dos objetivos iniciales; límite de distractores por nivel | PASS |
| Retirada de objetos de la regla anterior | Inspección de transición y prueba funcional | PASS |
| Coco estable | Estilos calculados: personaje y sombra sin animación permanente | PASS |
| Carriles, salto, agachado y pausa | Teclado y controles de interfaz en navegador | PASS |
| Misión completa | Partida acelerada de extremo a extremo | PASS |
| Puntuación general | `cococorre` guardado mediante el servicio oficial | PASS |
| Escritura única | Contador instrumentado: una llamada al finalizar | PASS |
| Abandono | Cierre durante la partida: cero escrituras | PASS |
| Límite diario | Estado `Completado hoy` y auditoría diaria | PASS |
| Escala justa | Fórmula limitada a 320, sin usar velocidad como único criterio | PASS |

## Coco Pádel

| Comprobación | Método | Resultado |
|---|---|---:|
| Tres pestañas exactas | Lectura de navegación real | PASS |
| Homónimos | Dos jugadores Diego con códigos distintos | PASS |
| Búsqueda | Nombre/código, nivel y estado | PASS |
| Cambio de nivel | Confirmación, guardado y recarga | PASS |
| Alta/baja | Baja lógica y reactivación sin perder código | PASS |
| Resumen de Jugadores | Sin parejas, rivales ni historial partido a partido | PASS |
| Mixing | Cinco pasos; sin marcador, historial ni puntos | PASS |
| Portada de Campeonato | Crear, listar activos y abrir detalle | PASS |
| `Plantilla del campeonato` | Ausente de la interfaz; participantes conservados | PASS |
| Añadir jornada | Jornada vinculada al campeonato y visible en detalle | PASS |
| Acumulación | Campeonato simulado con 20 jornadas | PASS |
| Corrección y eliminación | Recalculo desde resultados, sin duplicación | PASS |
| Persistencia PWA | Jugadores, nivel y campeonato tras recargar | PASS |

## Encuentra las diferencias

| Comprobación | Método | Resultado |
|---|---|---:|
| Escenarios y niveles | 10 escenarios × 3 niveles completados en navegador | PASS |
| Variantes visuales | 10 escenarios × 3 variantes × 3 niveles renderizados | PASS |
| Tipos permitidos | Solo color, forma completa y presencia/ausencia | PASS |
| Objetos rotos/deformados | Auditoría de renderer y evidencia visual | AUSENTES |
| Coincidencia visual/interactiva | Una definición normalizada para dibujo y zona | PASS |
| Clic desde ambas imágenes | Alternancia izquierda/derecha en cada partida | PASS |
| Clic falso | Esquina sin diferencia incrementa fallos, no aciertos | PASS |
| Zonas solapadas | Se elige la diferencia pendiente más próxima | PASS |
| Escalado móvil | Interfaz real a 390 px y geometría normalizada | PASS |
| Pixel QA | 450 cambios visibles respecto de la escena base | PASS |

## Regresión, PWA e integridad

- Caché activa: `coco-en-forma-v146.0.0-r2`.
- Todos los recursos locales declarados por la PWA existen.
- No se detectaron respuestas 404 locales.
- No se detectaron excepciones JavaScript no controladas.
- No se detectó desplazamiento horizontal efectivo a 320, 360, 390 ni 430 px.
- Los nombres de las tres pestañas permanecen completos en esos anchos.
- El SDK de Supabase se carga desde un archivo local con licencia incluida.
- Las suites históricas v144/v145 se omiten deliberadamente al detectar v146 y remiten a la suite correcta.

## Alcance no ejecutado contra producción

No se desplegó el paquete ni se escribieron datos en la aplicación pública. Las pruebas de persistencia se realizaron con el almacenamiento local de la PWA y con las dependencias remotas neutralizadas; la ruta de sincronización existente con Supabase se conserva, pero no se modificó ni se ensayó contra datos productivos en esta entrega.

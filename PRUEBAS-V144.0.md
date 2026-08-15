# Pruebas realizadas — Coco en Forma v144.0

## Resultado automatizado

Comando incluido: `node qa/v144-functional-tests.mjs`  
Resultado: **15/15 pruebas superadas**.

| Área | Prueba | Resultado |
|---|---|---|
| Coco Pádel | exactamente tres pestañas e ilimitado | PASS |
| Coco Pádel | dos Diego con códigos únicos y códigos no reutilizables | PASS |
| Coco Pádel | campeonato simulado de 20 fechas | PASS |
| Coco Pádel | acumulación derivada jornada tras jornada | PASS |
| Coco Pádel | guardar dos veces no duplica estadísticas | PASS |
| Coco Pádel | corregir y eliminar recalcula correctamente | PASS |
| Coco Pádel | cambio manual y conservación del nivel histórico | PASS |
| Coco Pádel | búsqueda por nombre/código/nivel y filtros históricos presentes | PASS |
| Diferencias | 30 combinaciones por nivel y seis tipos | PASS |
| Diferencias | zonas normalizadas dentro de 1536 × 1024 | PASS |
| Diferencias | una definición para visual y clic; ambas imágenes | PASS |
| Runner | tres niveles, duración finita y 20+ misiones distintas | PASS |
| Runner | controles, pausa, cierre saludable y guardado personal | PASS |
| Runner | ausencia de escrituras en ranking/`partidas` | PASS |
| Contenido | 14 juegos × 3 niveles con mínimo 20 IDs únicos | PASS |
| Base de datos | migración aditiva, RLS y rollback | PASS |
| PWA | todos los recursos de precaché existen | PASS |
| Inglés | ausencia en `index.html`, rutas funcionales y service worker | PASS |
| Responsive | reglas específicas para 320, 360, 390 y 430 px | PASS |
| Accesibilidad | controles táctiles y reducción de movimiento | PASS |

## Compilación y artefacto

| Comprobación | Resultado |
|---|---|
| Validación de checksums de la base v143.0 | PASS |
| Validación sintáctica de 19 scripts internos | PASS |
| Build de producción | PASS |
| Artefacto ESM y manifiesto de hosting | PASS |
| Recursos PWA declarados pero ausentes | 0 |
| Referencias de Inglés en `index.html` o `sw.js` | 0 |

## Prueba interactiva realizada

En la previsualización local se comprobó el catálogo, la ausencia visible de Inglés, la tarjeta de Coco Corre, el aviso “no suma al ranking”, la apertura de Coco Pádel, sus tres pestañas exactas y la creación del jugador `Diego — CP-0001` con nivel persistente en la sesión.

La conexión del navegador de prueba local dejó de responder durante la pasada final, aunque el servidor informó que seguía activo. Siguiendo el límite de recuperación, no se sustituyó por otro navegador ni se creó un despliegue. Por ese motivo, la reproducción visual final completa del runner, las 30 combinaciones de diferencias y los cuatro anchos físicos debe formar parte de la aceptación manual del ZIP. La lógica correspondiente sí se ejecutó en la suite y el build posterior terminó correctamente.

## Criterio de publicación

**No aprobado para publicación automática.** El paquete es candidato de prueba. La publicación requiere aprobación expresa después de completar la lista manual incluida en `LEEME-RESPALDO-Y-PRUEBA-V144.0.txt`.


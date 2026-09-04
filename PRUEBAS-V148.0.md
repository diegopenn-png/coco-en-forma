# Pruebas realizadas — Coco en Forma v148.0

Fecha: 15 de agosto de 2026.

## Resumen

| Bloque | Resultado | Cobertura principal |
|---|---:|---|
| Pruebas funcionales | 22/22 | Política diaria, Runner, Pádel, Diferencias, PWA, rutas, responsive y migraciones existentes |
| Política ilimitada en navegador | 5/5 | Correo exacto, todos los juegos, cuenta normal, puntuación sin duplicar e interfaz unificada |
| Regresión completa en navegador | 14/14 | Runner real, Pádel, 30 combinaciones de Diferencias, persistencia, responsive, JS y 404 |
| Sintaxis | Correcta | 7 módulos JavaScript principales, service worker y 19 scripts inline |
| Manifiestos | Válidos | `manifest.json` y `manifest.webmanifest` |

## Política de partidas

| Caso probado | Resultado |
|---|---|
| `diegopenn@icloud.com`, sin importar mayúsculas/minúsculas | Modo ilimitado activado |
| Otro correo con el mismo identificador simulado | Sin excepción |
| Cuenta autorizada con marcas diarias locales existentes | Todos los juegos siguen disponibles |
| Cuenta normal con una partida completada | El juego queda bloqueado hasta el día siguiente |
| Primera puntuación de la cuenta de prueba | Se guarda una vez |
| Segunda puntuación del mismo juego y día | Se completa como prueba, sin sumar ni duplicar |
| Tarjeta tras una repetición de prueba | Vuelve a estado disponible |
| Coco Med repetido | No vuelve a incrementar progreso ni clasificación |

La identidad se probó en navegador mediante una sesión automatizada controlada. La comprobación manual final debe hacerse iniciando sesión con la cuenta real, sin compartir su contraseña.

## Regresión de producto

| Módulo | Pruebas superadas |
|---|---|
| Coco Corre | Abandono sin puntos; objetivo visible; triángulos; Coco estable; sonido; carriles; salto; agachado; pausa; finalización; escritura única; 320–430 px |
| Coco Pádel | Tres pestañas; homónimos; códigos; búsqueda; nivel; alta/baja; Mixing temporal; Campeonato; jornada; corrección; clasificación; persistencia |
| Encuentra las diferencias | 10 escenarios × 3 niveles; ambas imágenes; sin pistas previas; sin círculos o estrellas reveladores; clic falso; finalización; 320–1440 px |
| PWA | Caché v148; persistencia; recursos locales; ausencia de rutas rotas y 404 |
| General | Sin desbordamiento horizontal; sin errores JavaScript de la aplicación |

## Comandos ejecutados

```text
node qa/v148-functional-tests.mjs
node qa/v148-unlimited-browser-tests.mjs
node qa/v148-browser-tests.mjs
```

Las pruebas de navegador se ejecutaron con Chromium en un servidor local aislado. No se realizó ningún despliegue público.

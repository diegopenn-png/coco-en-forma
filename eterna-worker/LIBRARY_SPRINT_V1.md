# ETERNA · práctica calculada y orientación curricular

Contenido: `eterna-library-2026.09-v6-310-traceable-12c672`.
Motor de ejercicios: `procedural-practice-v1`; orientación: `curricular-compass-v1`.
Base pública anterior: `12c672a4e67646f8da3bba125ccdaade7e34d7a0`.

## Qué aporta esta entrega

310 microlecciones originales, 930 preguntas fijas y 56 protocolos. Se conservan las 304 fichas anteriores y se añaden seis apoyos de asignaturas poco representadas: permisos de aplicaciones, materia y energía en ecosistemas, compás compuesto, acotaciones teatrales, coste afín y proyecto artístico. Estas fichas no equivalen a un curso completo ni a correspondencias exhaustivas con los criterios.

Una fábrica determinista genera rondas de tres ejercicios en 22 familias: suma, resta, multiplicación, división exacta, fracciones equivalentes y suma con igual denominador, porcentajes, ecuaciones lineales, área y perímetro de rectángulos, comparación decimal, longitud, duración, potencias, probabilidad de dado equilibrado, derivada de monomio, to be, être, clases de palabras, cambios de estado, rapidez media y notación científica. No usa un modelo generativo para producir la ronda o comprobar una opción inequívoca. La cantidad de variantes depende de cada familia; no se anuncia como infinita ni como nuevas lecciones revisadas.

Activación deliberada en Practicar o Examen: «Dame ejercicios nuevos de porcentajes», «Dame ejercicios nuevos de sumas» o una de las familias compatibles con el curso. Se presenta una pregunta cada vez. «Una pista», saludos, tres respuestas y «otra ronda» preservan el contrato de actividad. Las respuestas ambiguas, cursos o lenguas no cubiertos, tareas con imágenes y nuevas explicaciones fuera de las reglas se derivan al tutor habitual. No se confía en claves de respuesta aportadas por el cliente. Las rondas no son notas oficiales ni acreditaciones de dominio.

## Orientación curricular acotada

Supabase conserva 9.033 elementos de los anexos estatales, incluidos 3.120 saberes y 1.612 criterios, separados de las lecciones. La función `eterna_curricular_compass_v1` solo es ejecutable por service_role. Busca un máximo de tres fragmentos por etapa, banda de curso, asignatura y términos presentes en vocabulario público. No transmite el texto del chat ni nombres o identificadores de alumnos en esa consulta ni en su caché compartida.

Se ejecuta después de los controles de acceso, seguridad y ámbito escolar, en paralelo a la recuperación curricular anterior. Se limita la espera a 900 ms y el contexto a 2.600 caracteres; si falla, continúa el tutor anterior. No añade una llamada generativa, aunque los fragmentos pueden aumentar ligeramente los tokens de entrada en consultas que ya usan IA. El contexto está rotulado como orientación estatal, no evidencia de que una solución sea correcta, no texto completo de la norma y no acreditación autonómica. Los resultados no activan las 1.037 correspondencias candidatas sin validar.

Flags separados: `ETERNA_EXERCISE_FACTORY=v1` y `ETERNA_CURRICULAR_COMPASS=v1`. Desactivarlos conserva la biblioteca propia. Se mantiene `ENABLE_ETERNA_LIBRARY=true` y el release exacto.

## Pruebas realizadas

Build `34682508300`, artefacto `10294331673`, fuentes `592c25a857d52e9e9583ac6f6937e3b25f698733`: 753 pruebas automáticas, cero fallos. Se incluyen 19.800 instancias de preguntas generadas contrastadas mediante cálculos/reglas independientes; son casos de prueba y pueden repetir ejercicios, no 19.800 contenidos únicos.

Servicio privado `34682659445`, artefacto `10293424995`: 140 peticiones con autenticación y Supabase reales, 40 turnos de fichas, 44 de ejercicios generados (22 familias y una respuesta por familia) y 56 protocolos. En esos casos preparados, cero llamadas generativas y cero tokens de generación. Dos identidades sintéticas eliminadas y comprobadas; ninguna modificación de cuotas de alumnos. Mediana 663 ms, percentil 95 1.135 ms y máximo 4.568 ms desde GitHub; excluyen transcripción y voz y no representan una medición de iPhone físico.

La consulta normativa real confirmó filtrado de curso, rechazo de términos inválidos y denegación de acceso anónimo. No se ha medido todavía el porcentaje de ahorro global en usuarios reales ni la eficacia pedagógica en aula. No se presentan los antiguos 42 recorridos de navegador como nuevas pruebas de esta versión.

## Publicación y reversión

Promover únicamente la versión canónica probada `9480a578-cca5-4412-bbfd-fbfbf27c11c1`, cuyo etag es `b676afed755f3c9aa89d23a67a2a2a7f125d3ecb9b04f3aeafd4b277d31d69f5`, desde `ce846fe8-2f9a-4c4e-ba72-397dcc14e2db`. Nunca desplegar los envoltorios de pruebas/importación. Verificar hashes, main, vinculaciones y runtime; solo cambian release y los dos flags. Ante modificación concurrente, detener; ante fallo propio posterior, revertir solo la candidata.

Micrófono, envío automático, pausas por edad, interfaz, juegos, modelos, precios, suscripción y controles de acceso/cuota no cambian. El nuevo código solo compone la biblioteca existente con los módulos explícitos.

## Límites del encargo general

Esta entrega aborda rapidez, variación de ejercicios y reutilización de conocimiento. No completa todas las lecciones, todos los criterios, las lenguas cooficiales ni las cadenas de modificaciones autonómicas. La revisión disciplinar es asistida por una IA que emula perspectivas docentes, no una certificación humana independiente. No se cambia `coverage_complete` a true para aparentar el cierre de un alcance no verificado.

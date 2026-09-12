# ETERNA · ampliación y revisión multidisciplinar simulada

Release: `eterna-library-2026.09-v5-304-panel-ffe822`. Motor: `library-first-v5-panel`.
Base: `ffe822edc7985609ae69da41312ec32835193dcb`.

## Alcance real

304 microlecciones originales, 912 preguntas y 56 protocolos. Se añaden 48 fichas: 8 Infantil, 8 Primaria, 12 ESO y 20 Bachillerato. Totales: 38 Infantil, 95 Primaria, 96 ESO y 75 Bachillerato. Se refuerzan primeros cursos, artes, humanidades y vías poco representadas. Las asignaciones por curso son editoriales; modalidades y oferta territorial/centro deben comprobarse. Tres preguntas no equivalen a una evaluación completa de dominio.

El usuario solicitó emular un equipo docente multidisciplinar. Un solo sistema de IA aplica ocho perspectivas: Infantil, Primaria, Matemáticas, Ciencias, Lenguas, Humanidades, Artes/Educación Física y Orientación/inclusión. No participaron ocho revisores independientes ni docentes humanos. No es homologación, certificación ni estudio de eficacia en aula.

`qa/teacher-panel/review-ledger.json` conserva 304 registros vinculados por SHA-256 a las fichas: foco disciplinar, perspectiva complementaria, error que se pretende evitar, explicación causal, preguntas y claves examinadas, cambios y límites. `qa/teacher-panel/changes.json` permite revertir todas las modificaciones y reconstruir exactamente las 256 fichas anteriores.

Ocho entradas sobre cinco lecciones aclaran ángulos rectos del cuadrado, condiciones de número primo, coordenadas ortonormales en el módulo de un vector y dirección/sentido de velocidad y aceleración, incluidas pistas coherentes. Los 768 identificadores y claves de pregunta previos se mantienen. La nueva pregunta de mayúsculas usa opciones inequívocas, sin debilitar el control que impide calificar por diferencias de caja que una transcripción no conserva.

## Evidencia

Build `34669394225`, artefacto `10290756404`, fuentes `4b1a7a1117d292bef6b9909d2071dd8f2587f6cf`: 674 pruebas automáticas, cero fallos. Incluyen las matrices de 304 lecciones en seis modos, 912 claves, formulaciones, idioma/curso, seguridad, contexto y reversibilidad.

Prueba privada `34669693567`, artefacto `10290107665`: 96 peticiones con red, autenticación y Supabase reales (40 turnos docentes y 56 protocolos), cero llamadas al modelo generativo y cero tokens de generación en las rutas preparadas. Instantánea de 304 fichas y 56 protocolos almacenada sin discrepancias de hash. Identidad sintética eliminada y comprobada, sin datos de alumnos reales. Mediana 676 ms; percentil 95 969 ms desde el runner, excluyendo transcripción y voz. No es una medición física en iPhone. No se han repetido pruebas nuevas de interfaz; los 42 recorridos anteriores no se contabilizan como resultados de esta revisión.

Promover únicamente la versión inmutable `ce846fe8-2f9a-4c4e-ba72-397dcc14e2db`, desde `6181ec9c-d5be-44f1-a9a2-f7390fbfd73b`. Comprobar main, hashes, etags, vinculaciones y runtime. Detener ante concurrencia; revertir solo la propia candidata si falla la comprobación posterior. Nunca publicar el envoltorio de importación/QA. El workflow de publicación conserva su resultado definitivo.

## Normativa y límites de cobertura

La auditoría del registro normativo se mantiene separada de las lecciones. Recuperación `34668555920`: **25 referencias intentadas, 15 accesibles**, y 72 de 76 combinaciones territorio/etapa con alguna referencia accesible por captura automática. Algunos resultados son índices o metadatos, no texto curricular íntegro. Cantabria se consultó adicionalmente mediante el lector web de los PDF oficiales 66/2022 y 73/2022, manteniendo la distinción entre lectura y descarga automática fallida.

Visores `34669619090`: siete referencias examinadas. Se recuperaron seis textos sustanciales de Madrid y Cataluña. El resultado de Bachillerato de Madrid contenía bytes de PDF tratados como texto; se detectó y no se considera extracción válida. Una captura sustancial no demuestra que estén todos los anexos ni todas las modificaciones semánticamente revisadas.

No se activa automáticamente normativa autonómica no validada. Se conservan fuentes históricas y documentos retirados. No se afirma cobertura exhaustiva de cada saber, criterio, optativa, lengua cooficial, modalidad ni del primer ciclo completo de Infantil. El material es apoyo introductorio, no una colección completa de libros de texto.

La revisión simulada es la modalidad solicitada por Diego; no se convierte en una firma humana. Los límites anteriores son explícitos y no se ocultan marcando `coverage_complete=true`.

Micrófono, pausas por edad, envío automático, interfaz, juegos, diseño, algoritmos de reconocimiento/estado, modelos, acceso y cuotas no cambian. Casos abiertos, imágenes, idiomas no cubiertos o respuestas ambiguas mantienen el tutor IA. El ahorro de las rutas preparadas no representa un porcentaje global medido en usuarios reales.

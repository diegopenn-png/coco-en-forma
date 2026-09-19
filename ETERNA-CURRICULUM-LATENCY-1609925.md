# ETERNA · currículo local y latencia · 160.99.25

## Estado comprobado antes del cambio
- Base: main b2cb0ffb879a824c1a1b4e9bbf22c1afa325cb42.
- Worker publicado de referencia: 160.99.24.
- PWA publicada de referencia: 160.100.17.
- Biblioteca docente local: 410 lecciones / 1.230 preguntas, ruta cerrada con 0 llamadas al modelo cuando hay coincidencia exacta segura.
- Brújula curricular local: snapshot eterna-curriculum-map-2026.09.12-v1, 9.033 elementos fuente, 3.120 saberes y 1.612 criterios.
- El corpus estatal ya cubre Infantil, Primaria, ESO y Bachillerato. No se debe duplicar íntegramente dentro del prompt ni reenviarlo en cada turno.

## Fuentes normativas de referencia
- Infantil estatal: BOE-A-2022-1654.
- Primaria estatal: BOE-A-2022-3296.
- ESO estatal: BOE-A-2022-4975.
- Bachillerato estatal: BOE-A-2022-5521.
- Andalucía: Órdenes de 30 de mayo de 2023 para Infantil, Primaria, ESO y Bachillerato (BOJA 104, 02/06/2023).

## Decisión de arquitectura
La velocidad no se mejora metiendo el currículo entero en cada petición. Se mantiene una arquitectura por capas:
1. protocolo/local determinista;
2. biblioteca ETERNA local y ejercicios deterministas;
3. brújula curricular acotada al curso/materia/concepto;
4. agente Cloudflare/OpenAI solo cuando la consulta exige razonamiento, imagen, ambigüedad o conocimiento no cubierto.

## Cambio 160.99.25
Se amplía la gramática cerrada de la biblioteca para que formulaciones naturales frecuentes ("quiero que me expliques", "qué significa", "me gustaría comprender", "háblame de", "no entiendo bien") reutilicen las 410 lecciones existentes sin generación. La coincidencia sigue exigiendo que, después de retirar la envoltura conversacional, quede exactamente un alias permitido y apropiado al curso.

No se usa fuzzy matching abierto. Una frase con cláusulas adicionales, un tema desconocido, una imagen, una petición sensible o una pregunta no cubierta continúa hacia el pipeline normal.

## Próximos lotes de contenido
La expansión de contenido debe ser incremental, sin duplicar temas y con trazabilidad. Prioridad: Andalucía, empezando por los huecos de alta frecuencia de Primaria y ESO. Cada lección nueva debe incluir tres comprobaciones, curso, materia, referencia curricular, revisión editorial reproducible y pruebas de no solapamiento.

## Objetivos de rendimiento
- Respuesta local: 0 llamadas de generación.
- No aumentar el contexto enviado al agente con miles de saberes.
- Mantener Server-Timing/X-Eterna-Latency-Ms para medir cada tramo.
- Ampliar cobertura local antes de reducir calidad o razonamiento del agente.

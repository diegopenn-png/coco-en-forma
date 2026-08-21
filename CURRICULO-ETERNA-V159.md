# Base curricular Eterna v159 · estado real

La arquitectura de v159 ya separa:

- fuente oficial (`eterna_curriculum_sources`),
- concepto verificable (`eterna_concepts`),
- dominio individual (`eterna_mastery`),
- contexto del alumno (`eterna_student_profiles`).

## Qué incluye v159

1. Fuentes estatales base de Infantil, Primaria, ESO y Bachillerato.
2. Esquema preparado para `jurisdiction` + `autonomous_community`.
3. Semilla de conceptos para probar la cadena completa.
4. El Worker busca contenidos del curso antes de responder.
5. Si una pregunta factual necesita respaldo curricular y no existe evidencia suficiente, Eterna **pide el enunciado/material en vez de improvisar**.

## Qué NO se declara terminado

No se finge haber transformado todavía en registros conceptuales cada saber básico, criterio y desarrollo autonómico de todas las administraciones educativas españolas. Ese corpus debe construirse por lotes, con trazabilidad de fuente y revisión, antes de llamar a la cobertura “completa 0–18”.

Esto es deliberado: inventar un currículo “completo” sería contrario al requisito anti-alucinación.

## Siguiente lote recomendado

1. Andalucía 1º–6º Primaria: Matemáticas, Lengua, Inglés, Conocimiento del Medio.
2. Andalucía 1º–4º ESO: Matemáticas, Lengua, Inglés, Biología/Geología, Física/Química, Geografía/Historia.
3. Bachillerato por modalidad.
4. Repetir proceso para el resto de CCAA.

Cada fila debe conservar `source_id`, código, curso, asignatura, resumen pedagógico y fecha de verificación.


## Separación importante

El Student Model no depende de que el Knowledge Model esté completo. `eterna_student_concept_memory` puede registrar progreso sobre una etiqueta pedagógica observada sin convertirla en fuente curricular. Esto NO autoriza a Eterna a inventar conocimiento: el Scope/Source Gate sigue exigiendo evidencia para responder hechos externos.

# ETERNA 160.99.25 — candidata estable de un mes

## Objetivo

Preparar una versión del Worker más natural, coherente y curricularmente segura sin modificar la PWA 160.100.17. La publicación queda separada del merge: producción solo se activa al añadir el marcador `.github/release-eterna-1609925` después de autorización explícita.

## Cambios verificables

- Activa explícitamente la biblioteca propia `eterna-library-2026.09-v8-410-consolidated-1c484e`, con 410 lecciones, 1.230 preguntas y 56 protocolos.
- Activa la fábrica determinista de práctica `procedural-practice-v1`, con 22 familias, y la brújula curricular estatal.
- Hace fallar los previews y el despliegue si la biblioteca, la fábrica, la brújula, los recuentos o el release no coinciden exactamente.
- Amplía el contexto reciente de 8 a 12 turnos y de 2 a 4 respuestas de ETERNA para reducir repeticiones.
- Añade tres variantes naturales a 14 intercambios frecuentes sin introducir más de una pregunta activa.
- Reconoce de forma determinista las 70 combinaciones etapa–materia del inventario oficial estatal (59 nombres únicos), además de alias escolares comunes.
- Revalida con un segundo verificador cualquier respuesta reparada antes de enseñársela al alumno.
- Mantiene los seis modos, Safety, autorización parental, privacidad infantil, integridad académica y el principio de una sola pregunta útil.

## Límites que se mantienen visibles

- `curriculum_complete` continúa en `false`: la biblioteca no se presenta como cobertura exhaustiva.
- Las lecciones siguen indicando `human_teacher_reviewed: false`, `full_criterion_alignment_verified: false` y `classroom_validated: false` mientras no exista esa revisión real.
- La brújula curricular es orientación estatal, no prueba factual ni consolidación autonómica.
- La normativa andaluza recopilada permanece en cuarentena hasta revisión humana; no se activa como si estuviera validada.
- Las pruebas automatizadas no sustituyen una evaluación humana de respuestas generadas por el modelo.

## Puertas de publicación

1. Regresión completa del Worker y de QA sin fallos.
2. Conversation Director en verde.
3. Preview del Worker en verde con los recuentos exactos.
4. Preview autenticada en verde.
5. Evaluación conversacional humana sobre la preview autenticada, con representación de los seis modos y las cuatro etapas.
6. Autorización explícita de merge y publicación.
7. Creación separada del marcador `.github/release-eterna-1609925`; el workflow valida el candidato exacto y revierte automáticamente si producción no queda sana.

## Congelación

Tras una publicación correcta, la versión se mantiene estable durante 30 días salvo corrección crítica de seguridad, privacidad, disponibilidad o exactitud académica demostrable.

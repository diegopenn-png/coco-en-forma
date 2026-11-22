# Eterna: continuidad de preguntas contestadas

Versión: `160.100.1-conversation-continuity` · 22 de noviembre de 2026.

## Fallo reproducido

El historial conservaba una comprobación antigua después de que el alumno la respondiera correctamente. `latestCheckQuestion` buscaba una pregunta en cualquier turno anterior; `handleChatCore` podía reinstalarla cuando el estado actual ya tenía `pending_question: null`.

Un recorrido sintético por `/v1/chat` lo reprodujo:

1. Eterna pregunta qué recurso aparece en «sus ojos son estrellas».
2. El alumno responde «Una metáfora».
3. Eterna devuelve `correct`, `pending_question: null` y `conversation_stage: complete`.
4. El alumno saluda.
5. Antes de esta corrección, el servidor recuperaba la pregunta contestada y devolvía `resume_available: true`.

La función que originaba el fallo también se comprobó en el bundle de producción de la versión 583, cuyo SHA-256 era `8f64db9d1f938195919b186cd19041f14433e50f33310cf93551fa4abeda57c1`.

## Comportamiento corregido

La recuperación de comprobaciones se detiene en el último turno del asistente, aunque ese turno no contenga una pregunta. Un estado completado sin pregunta pendiente prevalece sobre un historial antiguo o truncado. La clasificación del turno y el contexto del tutor siguen la misma regla; un tema nuevo tampoco hereda una comprobación anterior.

Las preguntas que siguen pendientes se conservan durante un saludo. Una nueva pregunta explícita o implícita sigue siendo contestable. El cierre devuelve `pending_question_id: null`, y las ideas aprendidas se toman de la pregunta contestada, sin dar por aprendida la respuesta esperada de la siguiente.

## Verificación local

`test/conversation-continuity.test.mjs` incluye siete regresiones que fallaban antes del cambio y pasan después. Comprueban cierre, saludo, continuación, replay idempotente, recuperación de una pregunta nueva, historial truncado, roles del historial, identificadores y registro de ideas aprendidas.

La ruta HTTP y la gestión de estado son las del Worker real. Las llamadas a modelos se sustituyen por fixtures y todo acceso de datos se restringe a `https://supabase.test/`: cero inferencias reales.

Comprobación conjunta: 596 pruebas aprobadas en continuidad, director pedagógico, regresión del Worker, biblioteca, contrato v3 y matriz de seis modos. Tras fijar la versión final también pasaron las siete regresiones nuevas y la comprobación de sintaxis.

```sh
node --check src/index.js
node --test test/conversation-continuity.test.mjs test/systemwide-pedagogical-director.test.mjs test/worker-regression.test.mjs test/library-first.test.mjs test/state-contract-v3.test.mjs test/six-modes-matrix.test.mjs
```

## Identificación al publicar

La comprobación de producción debe esperar `160.100.1-conversation-continuity`. El cambio no requiere una migración de datos ni cambios en bindings, límites, proveedores de IA o configuración del cliente. La publicación y su verificación remota se registran por separado de esta comprobación local.

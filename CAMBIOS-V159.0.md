# Coco en Forma v159.0 — Eterna Beta

## Base protegida

Se parte exclusivamente de v158.0. Los archivos de lógica histórica de Coco se mantienen byte a byte salvo `index.html`, `sw.js` y manifests, que requieren inserciones/versionado de integración.

## Nuevo

- Módulo aislado `eterna-v159.js`.
- Estilos aislados `eterna-v159.css`.
- Entrada visible Eterna después del carnet del jugador.
- Overlay propio con foto, texto y voz.
- Captura/galería con compresión local; no se persiste la foto en localStorage.
- Grabación de audio y transcripción por backend.
- TTS por backend con fallback de síntesis del navegador.
- Ámbito escolar obligatorio y respuesta fija fuera de ámbito.
- Separación frontend / Worker / Scope Gate / Tutor / Verifier.
- Student Model en Supabase.
- Datos de interacción minimizados: hash + metadatos, no conversación completa por defecto.
- Prueba y suscripción desde Zona Familiar.
- Stripe Checkout, webhook y Billing Portal en Worker.
- Nueva miniatura social `share/eterna.png` 1200×630.
- Metadatos Open Graph actualizados sin alterar las miniaturas específicas de cada juego.
- Shortcut PWA Eterna.
- Service Worker v159.

## Supabase

Nuevos scripts:

- `supabase-eterna-v159.sql`
- `supabase-eterna-v159-rollback.sql`
- `eterna-curriculum-seed-v159.sql`

No se modifica `supabase-coco-v153.sql`.

## Coco Med

`tutorEndpoint:'https://coco-med-tutor.chatinmobiliario.workers.dev/'` permanece sin modificación.

## Limitación honesta

El corpus curricular completo estatal + autonómico no se finge terminado. v159 implementa la arquitectura, fuentes oficiales base y semilla QA; el Worker falla de forma segura cuando falta evidencia curricular suficiente.

- Controles familiares para voz, cámara, micrófono y límite diario.
- Exportación y borrado de memoria pedagógica (sin borrar control de suscripción).
- Rate limit diario autenticado en backend.
- Corrección del formato multimodal de Moderation API para imágenes.

- Autolearning reforzado: Eterna puede evaluar respuestas a preguntas de comprobación y actualizar el dominio del concepto sin depender solo de auto-reporte.
- `self_contained` en Scope Gate: si una pregunta factual requiere conocimiento externo y no hay fuente curricular recuperada, Eterna pide material en vez de improvisar.
- Misión Eterna y puente seguro hacia juegos existentes de Coco (solo resalta/sugiere; no abre automáticamente ni salta límites diarios).

- Student Model desacoplado del currículo mediante `eterna_student_concept_memory`: Eterna puede aprender de un concepto observado aunque ese concepto aún no esté convertido en el Knowledge Model oficial; si luego se mapea, conserva `concept_id`.
- Zona Familiar muestra un resumen de conceptos débiles/progreso a partir de señales pedagógicas estructuradas.


## Configuración de despliegue
- Worker público conectado: `https://coco-eterna-v159.chatinmobiliario.workers.dev`
- `tutorEndpoint` de Coco Med permanece intacto.

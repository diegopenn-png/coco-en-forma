# ETERNA · biblioteca propia, integración de contexto v1.1

Release de contenido: `eterna-library-2026.09-v1`. Revisión del motor: `library-first-v1.1`.
Base publicada: `a877d730a018fce369b5b262310cd8182439a7bc`.

## Alcance

La biblioteca conserva 80 microlecciones, 240 preguntas y 24 protocolos. No se ha completado el currículo de España. Los documentos territoriales pendientes permanecen en cuarentena; no se han promovido ni modificado. El Worker usa una copia compilada de las lecciones para evitar una consulta de contenido adicional por respuesta.

Esta revisión decodifica únicamente las plantillas exactas que la PWA genera para «más fácil», «no entiendo», «por qué», continuar y contestar sí/no. Exige que coincidan el tema, la pregunta y el modo. No elimina cláusulas arbitrarias ni se fía de las respuestas esperadas enviadas por el cliente.

Los saludos conservan también los metadatos que necesita el frontend para retomar la pregunta. Una actividad completada no recupera por error una pregunta antigua del historial. La memoria de aprendizaje registra evidencia de la pregunta respondida y no la solución de la siguiente. Pedir otro ejemplo no vuelve a entregar el ejemplo ya mostrado: el tutor generativo puede dar uno nuevo. Se elimina la etiqueta de comprobación cuando el sistema suprime una pregunta repetida.

Se preservan las comprobaciones publicadas de idioma, signos matemáticos, decimales, unidades y potencias; también acceso, autorización parental, suscripción, cuotas y seguridad. No hay cambios en el micrófono, frontend, estilos, juegos, modelos o proveedor.

## Evidencia reproducible

Commit de las fuentes probadas: `d633e1b4b152a78bb891949c2303eb725d75ac93`.
Workflow final: `34662016544`.
Artefacto: `eterna-library-context-final-verification`, ID `10287667350`.

397 pruebas superadas, sin fallos. La suite incluye todos los conceptos en los seis modos y las 240 respuestas previstas. Se ejecutaron 32 recorridos en Chromium con la interfaz real sin modificaciones, estilos reales y dos configuraciones (ordenador y emulación móvil/PWA). La autenticación y la base de datos de esas pruebas eran sintéticas: no es una prueba física de iPhone.

En Cloudflare, el código canónico compilado superó las comprobaciones de configuración y acceso. Un envoltorio temporal protegido, con entradas sintéticas fijas y sin datos de menores, comprobó la conversación de contexto con cero llamadas al modelo. Una prueba separada de continuación recurrió al proveedor real y obtuvo una respuesta nueva, HTTP 200. No se afirma que las consultas generativas sean instantáneas ni gratuitas.

Versión canónica candidata comprobada: `5da15a04-5396-4841-8b21-a94c0c6647c3`.
SHA-256 del Worker fuente: `0a142b6705aa1ee4b63562cd59cfc66c8e5702768d5413e46c94106f6e1eb52c`.
SHA-256 del runtime: `ed83c7f574db28c0e32e996579aed1ac9f03a85e91a2d59ff1cf28eb94c1b976`.

## Publicación y reversión

Publicar solo la versión canónica comprobada, nunca el envoltorio temporal. Comprobar de nuevo el HEAD de main, la versión activa, el hash del código compilado, las vinculaciones y los modelos antes de promoverla. Verificar después `/health` y los bloqueos 401 sin sesión. Si la comprobación falla y no hubo otro despliegue concurrente, regresar a `438466cb-f081-48f1-a4cc-7986deb58f8a`.

La prueba de esta revisión no sustituye la evidencia anterior de 64 peticiones con autenticación real. Tampoco convierte el archivo normativo en una colección completa de lecciones ni acredita una revisión docente humana.

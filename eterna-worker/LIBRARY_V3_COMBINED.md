# ETERNA · biblioteca consolidada: 217 microlecciones, 651 preguntas y 56 protocolos

Release: `eterna-library-2026.09-v3-217-6b83`.
Motor: `library-first-v3-combined`.
Base preservada: `6b83b043e85d0eb15e629affb0f42d2957a6cc83`.

## Contenido real

30 fichas de Infantil, 75 de Primaria, 69 de ESO y 43 de Bachillerato. Son materiales originales de apoyo, no una colección completa de libros de texto ni todo el currículo español. La distribución por curso es editorial y no una certificación de correspondencia exhaustiva con cada criterio autonómico. No se afirma homologación ni revisión de un docente humano.

Se conservan exactamente los 160 objetos de lección y las 40 definiciones de protocolo que ya estaban publicados. Se incorporan 57 lecciones y 16 protocolos adicionales sin colisiones de alias. Otras 23 versiones alternativas permanecen como material editorial no activado, para no reemplazar por accidente contenidos o identidades de preguntas existentes. El borrador compartido v2 y las versiones anteriores no se borran ni se promocionan.

Los 56 protocolos cubren cordialidad, identidad veraz de IA, datos autorizados del perfil, fecha/hora del sistema, ayuda gradual, cansancio, errores, vergüenza, concentración, métodos de estudio, integridad académica, apoyo del profesor y familia y comprobación de fuentes. No sustituyen interpretación de conversaciones sensibles ni evaluación de trabajos no vistos. Las muestras documentales de fecha y hora no se usan como respuestas fijas.

## Arquitectura y elementos preservados

Se mantiene el índice de alias y el reconocimiento de peticiones completas y naturales del motor publicado. La copia compilada del contenido evita lecturas adicionales de la biblioteca para consultas cubiertas. Los casos preparados usan cero generación; los ambiguos, no cubiertos, imágenes o razonamientos abiertos conservan el tutor habitual. No se equipara coincidencia textual aproximada con corrección pedagógica.

Se conservan controles de autenticación, autorización parental, suscripción, perfil, seguridad y uso; también contexto de los seis modos, identidad de las preguntas, signos y unidades. `lib:v1:` sigue identificando actividades existentes. El código de integración del Worker cambia únicamente su identificador de release respecto a la base. El motor añade definiciones de protocolos, sin sustituir sus algoritmos de reconocimiento y estado.

Micrófono, pausas por curso, envío automático, interfaz, juegos, diseño, proveedor, modelos y configuración de runtime permanecen sin cambios. El archivo normativo conserva sus versiones de origen: descargarlo no equivale a convertir todas sus tablas y criterios en lecciones. No se cambia el estado de revisión de documentos regionales.

## Evidencia

Workflow final: `34665248254`; artefacto `eterna-library-217-final-verification`, ID `10289270622`.
Fuentes comprobadas: `f1f701f03ea39b9f052d145fcd169993245211f6`.
566 pruebas automáticas superadas; matriz de 217 lecciones por seis modos, 651 preguntas, formulaciones completas, límites de reconocimiento, conservación de los 160 objetos y oráculos numéricos.
42 recorridos en la interfaz real sin modificar, Chromium de escritorio y emulación móvil/PWA; servicios de identidad y datos simulados, cero llamadas al modelo en esos recorridos. No es una prueba física de iPhone.
96 peticiones posteriores al Worker canónico en una versión privada con autenticación y Supabase reales: 40 recorridos docentes y 56 protocolos, cero llamadas al modelo generativo, cero tokens de generación. Se verificaron datos persistidos y la eliminación de la identidad sintética. No se usaron datos de alumnos reales.
Tiempo de ida y vuelta mediano: 906 ms; percentil 95: 1113 ms. Incluye red y comprobaciones de acceso desde GitHub, no latencia de un iPhone físico, transcripción ni síntesis de voz. No prueba un ahorro porcentual total en tráfico real.

## Publicación controlada

Versión inmutable comprobada: `122648ab-15d5-4486-825b-996b06fd86e1`.
Base para reversión: `616b2ff8-5a2c-43a8-9092-5d70a42f14e2`.
Activar con `ENABLE_ETERNA_LIBRARY=true` y `ETERNA_LIBRARY_RELEASE=eterna-library-2026.09-v3-217-6b83`.
Promover únicamente la versión canónica probada, nunca el envoltorio de importación o pruebas. Reconfirmar main, versión activa, etag compilado, vinculaciones y modelos. Validar `/health` y bloqueos 401 después. Revertir solo la promoción propia si falla y no hubo otro despliegue concurrente.

Los límites pendientes son explícitos: revisión docente especializada, cobertura completa por materia/curso/territorio, fuentes regionales faltantes y correspondencias semánticas de anexos. Estos límites no se ocultan elevando las cifras de fragmentos a lecciones ni afirmando una puntuación perfecta.

# ETERNA · biblioteca propia, primer bloque verificado

Release: `eterna-library-2026.09-v1`.

## Alcance real

80 microlecciones originales (12 Infantil, 28 Primaria, 24 ESO, 16 Bachillerato), 240 preguntas de comprobación y 24 protocolos de conversación. No es el currículo completo de España ni contenido homologado. La colocación por curso es pedagógica, no una afirmación de asignación normativa exhaustiva. La revisión realizada es editorial asistida y técnica; no equivale a revisión por un profesor humano.

En Supabase se conservan 58 documentos oficiales y 13.130 fragmentos con fuente y SHA-256. Solo los cuatro textos estatales están marcados como `source_checked`; 54 documentos territoriales siguen en cuarentena. Quedan fuentes sin descargar y anexos, idiomas, vigencia y correspondencias curriculares por revisar. Un decreto curricular no es un libro de explicaciones escolares.

## Funcionamiento

El Worker usa una copia compilada de las mismas 80 lecciones almacenadas en la biblioteca para evitar una consulta adicional y llamadas al modelo al responder intenciones preparadas. Mantiene las comprobaciones existentes de autenticación, perfil, autorización parental, suscripción y acceso. Las respuestas abiertas, ambiguas, complejas o no cubiertas conservan el recorrido del tutor habitual. No se califica una respuesta libre solo por similitud de palabras. Los signos, decimales, unidades y potencias se mantienen al comprobar respuestas.

En Ayúdame y Revisa, nombrar un tema no autoriza a inventar un enunciado o un error: se pide el trabajo real. En Examen y Practicar se mantiene una sola pregunta, pistas graduadas y estado de actividad. Los saludos y pausas no cuentan como errores ni borran la pregunta pendiente.

Los protocolos incluyen saludo, gratitud, despedida, identidad de IA, datos del perfil, fecha/hora reales, cansancio, pausas, nervios, vergüenza al leer, privacidad, autonomía y apoyo de personas de confianza. No simulan una persona, no diagnostican, ni convierten a ETERNA en sustituta del profesor o la familia.

## Activación y reversión

Activar únicamente con ambas variables del Worker:

- `ENABLE_ETERNA_LIBRARY=true`
- `ETERNA_LIBRARY_RELEASE=eterna-library-2026.09-v1`

Sin ellas, el recorrido anterior sigue disponible. No sustituir el resto de variables al desplegar: leer y conservar las vinculaciones del Worker activo. `/health` expone `owned_library.enabled`, `release`, `lessons`, `protocols` y `curriculum_complete:false`.

Versión inmutable probada en Cloudflare: `438466cb-f081-48f1-a4cc-7986deb58f8a`.
Versión anterior para rollback controlado: `0abf2be8-16c4-4695-96ae-48d0e9ef82fe`.
La publicación debe verificar que no hubo un despliegue concurrente y confirmar salud/modelos/acceso; nunca desplegar los envoltorios temporales de importación o pruebas.

## Evidencia

Workflow de verificación privada: `34659948883`, artefacto `eterna-library-canonical-private-verification`.
Commit de fuentes verificadas: `81bf9e7a46c67bb12638a941a1cd774ad3de14bc`.
387 pruebas de regresión superadas. La matriz local recorre las 80 lecciones en los seis modos, con servicios externos simulados y llamadas a inferencia prohibidas.
La prueba privada posterior hizo 64 peticiones al Worker canónico con autenticación y Supabase reales, usando una identidad sintética temporal: 40 recorridos docentes en cuatro etapas y seis modos, más 24 protocolos. Todas usaron rutas propias, cero llamadas al modelo generativo y cero tokens de generación. La identidad sintética se eliminó y se verificó su ausencia.
Mediana de ida y vuelta: 853 ms. Percentil 95: 1110 ms. Incluye red y comprobaciones reales de acceso desde un ejecutor de GitHub, no desde un iPhone físico. No incluye transcripción de voz, lectura de imágenes, síntesis de voz ni todas las futuras consultas.

## Elementos preservados

Micrófono, pausas de voz, envío automático, frontend, juegos, diseño, modelos y proveedor permanecen sin cambios. No se mezclan conversaciones, fotografías o grabaciones de alumnos con la biblioteca compartida. Este primer bloque no implica ahorro total medido en usuarios reales: ese porcentaje requiere observar el reparto real de consultas y su calidad.

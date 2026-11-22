# Coco en Forma en 15 idiomas

Trabajo iniciado el 21 de noviembre de 2026 sobre la aplicación que sirve cocoenforma.com.

La web y la PWA comparten la preferencia de idioma. El catálogo usa español, inglés, alemán, neerlandés, francés, italiano, polaco, ucraniano, ruso, chino simplificado, árabe, sueco, finés, noruego bokmål y danés. El selector usa un desplegable nativo, permite elegir directamente un idioma y carga un paquete local del propio sitio. La aplicación, los diálogos y las landings no añaden flechas laterales al control. El español usa el contenido original.

Diego autorizó conservar en español los juegos con una adaptación lingüística compleja. El aviso previo cubre Descifra la palabra, Sopa de letras, Crucigrama, Coco Med, Verdadero o falso, Reto tiempo y Coco Bank. Coco Med, Verdadero o falso y Reto tiempo tienen bancos de preguntas o microdesafíos de contenido. Coco Bank incluye su propia escuela de inversión, presupuesto y simulación familiar.

## Estado vigente · 22 de noviembre de 2026

El selector público y los 15 idiomas se publicaron mediante la PR 132, commit `c0e10ab783d4f0374e59c9f5bd230251617426be`. GitHub Pages y la comprobación de producción terminaron correctamente. En cocoenforma.com se comprobó la actualización desde la versión anterior mediante «Nueva versión disponible · actualizar», la aparición del selector y la conservación del francés tras recargar. Las notas de preparación más abajo son históricas.

Diego amplió el encargo: selector dentro del menú después de entrar, landings de captación en cada idioma y corrección de una pregunta repetida por Eterna tras responder. Esta entrega incluye:

- El mismo selector se coloca en `.navegacionJugador` cuando el menú está abierto y regresa al espacio público al salir. No duplica los controles ni reinicia el juego. El renderer real, con Supabase simulado, se comprobó entrando, cambiando pestañas, abriendo la clasificación y Memoria, cambiando idioma con una carta girada y cerrando sesión, en web y modo PWA. Las 24 pruebas de idiomas pasan.
- La página española `/juegos-gratis/` conserva su URL. Se añaden 14 equivalentes con HTML estático y redacción propia, canonical individual, 15 alternates `hreflang` y `x-default`, enlaces de idioma utilizables sin JavaScript, metadatos sociales y FAQ coherente con su JSON-LD. El sitemap pasa de 38 a 52 URL. El generador único conserva las nuevas direcciones al reconstruir el catálogo.
- El contenido se encuentra en `seo/locales/free-games.json`; las palabras clave son intenciones editoriales, sin estimaciones inventadas de demanda o posición. Cada página incluye seis juegos, un ejemplo resuelto, pasos para empezar, FAQ y enlaces a la aplicación que conservan el idioma. Las 14 pruebas de páginas/SEO pasan. No se afirma que Google haya indexado las nuevas URL.
- La actualización del acceso destaca «Todos los juegos son gratuitos» y aclara que crear una cuenta también es gratis, sin tarjeta ni suscripción para jugar. El aviso aparece en entrada y registro, en las tarjetas comerciales y en las 15 landings. Eterna se presenta como apoyo escolar opcional por suscripción; Coco Eneagrama sigue identificado como evaluación de autoconocimiento con informe PDF de pago independiente. No se cambian precios, checkout ni flujos de cuenta o recuperación.
- Eterna `160.100.1-conversation-continuity` impide recuperar desde el historial una pregunta que un turno posterior ya cerró. Conserva las preguntas legítimamente pendientes y registra como aprendidas las ideas correspondientes a la pregunta contestada. La reproducción y siete regresiones nuevas pasan con fixtures y sin llamadas a modelos; la validación backend afectada pasa 596 comprobaciones. Se publicó mediante la PR 133 y se conserva en el Worker actual `160.100.2-eneagrama-analysis`, con los bindings y orígenes de producción.

La simplificación del selector se publicó con `coco-en-forma-v160.100.85-dropdown-languages`. La ampliación posterior de Eneagrama usa `coco-en-forma-v160.100.86-eneagrama-analysis`; los archivos compartidos de idioma conservan `20261122-3`. La [PR 134](https://github.com/diegopenn-png/coco-en-forma/pull/134) publicó el selector y la gratuidad; la [PR 135](https://github.com/diegopenn-png/coco-en-forma/pull/135) publicó los análisis de Eneagrama. La [comprobación de producción 45026878968](https://github.com/diegopenn-png/coco-en-forma/actions/runs/45026878968) verificó Worker `160.100.2-eneagrama-analysis`, informe `2026-11-22-coaching-4` y caché PWA 86. En navegador real se comprobó el selector único, el cambio a inglés con los mensajes de gratuidad y el regreso a español.

### Evidencia operativa · 22 de noviembre de 2026

#### Corrección de la portada mezclada · 22 de noviembre de 2026

La captura aportada por Diego mostró la interfaz china con los avisos de prueba y los banners todavía en español. La reproducción identificó dos causas: el normalizador de Eterna, cargado después de la portada, reescribía tres textos sin conservar su traducción; además, el botón de prueba buscaba «Crear cuenta» por su texto visible español y podía dejar de abrir el registro al cambiar el idioma.

La corrección conserva la fuente de cada texto y aplica el idioma activo de forma síncrona. Tanto el acceso inicial como el módulo diferido encuentran el control de alta mediante su fuente original. Los 14 paquetes adicionales incluyen los avisos que faltaban. Se completan también las etiquetas visibles de la guía de juegos, las sugerencias y dos pistas de la portada, y se corrige el texto alternativo chino del póster.

Los dos banners decorativos de portada usan ilustraciones existentes sin letras y rótulos HTML traducidos cuando el idioma no es español. Los originales se restauran al volver a español. La colección de tarjetas de logro y sus descargas conserva su contenido original; esta corrección no supone traducir esos archivos ni el contenido del tutor o del cuestionario de Eneagrama.

Esta entrega prepara la caché `coco-en-forma-v160.100.87-complete-launcher-languages`, la revisión compartida `20261122-4` y la carga diferida de Eterna `160109`. El arte horizontal nuevo se incluye en el precaché. El Worker `160.100.2-eneagrama-analysis` y el informe `2026-11-22-coaching-4` no requieren otra publicación.

Verificación local: las 27 pruebas de idiomas pasan, incluidas tres regresiones nuevas que recorren los 15 idiomas, el acceso al alta, las omisiones de portada y los banners clonados con retorno al español. Las 18 pruebas de actualización PWA y paridad de vista previa también pasan. Se añade al control existente de navegador una comprobación móvil en chino, árabe, alemán, inglés y español, con capturas y apertura del registro sin introducir ni enviar datos. El estado de ejecución de ese control y la evidencia de publicación se registran en la PR asociada a esta entrega; preparar el código no acredita por sí solo su publicación.

En la propiedad de Search Console `https://cocoenforma.com/`, se reenvió `sitemap.xml` y el panel confirmó su lectura en esta fecha con estado **Correcto** y **52 URL descubiertas**, frente a las 38 anteriores. Este recuento acredita descubrimiento, no indexación.

La inspección de `https://cocoenforma.com/en/free-brain-games/` confirmó que Google la había detectado mediante el sitemap y que todavía no estaba indexada. La solicitud manual de indexación fue aceptada y pasó a la cola prioritaria. La aceptación de la solicitud tampoco acredita que la página ya esté indexada ni garantiza una fecha.

#### Correos de acceso activados en Coco V2 · 22 de noviembre de 2026

Se guardaron en producción las plantillas `supabase/templates/confirmation.html` y `supabase/templates/recovery.html`. Tras recargar cada página del panel, el contenido recuperado del editor coincidió exactamente con el archivo correspondiente. Los cuerpos incluyen los 15 idiomas y dirección de lectura RTL para árabe; conservan `.ConfirmationURL` y priorizan el idioma del enlace solicitado sobre el idioma anterior del perfil.

El asunto de ambos correos queda como **Coco en Forma**, nombre de marca común a todos los idiomas. El panel rechazó el asunto condicional largo por su máximo de 255 caracteres; esa propuesta no se guardó. El título, las instrucciones, el botón y el aviso del cuerpo sí cambian por idioma.

Se comprobó que SMTP personalizado está activo, con nombre de remitente **Coco en Forma**, servidor `smtp.servidor-correo.net` y puerto 587. No se modificaron sus credenciales. El Site URL es `https://cocoenforma.com`; la lista de redirecciones ya incluye `https://cocoenforma.com/**` y `https://www.cocoenforma.com/**`, que cubren las rutas usadas por alta y recuperación. No se amplió la lista.

La activación de las plantillas y la lectura de la configuración quedan completadas. No se envió un correo real en esta comprobación: la recepción en un buzón y el recorrido desde ese mensaje siguen pendientes. Tampoco se dispone de un iPhone físico para validar la PWA instalada. Las referencias a configuración pendiente dentro del historial inferior describen el estado previo a esta activación.

Los juegos marcados en español, las sesiones del tutor y el cuestionario/PDF original de Eneagrama mantienen el alcance lingüístico indicado. La revisión editorial completa de los paquetes anteriores sigue siendo distinta de la redacción nueva de estas landings.

Referencias técnicas de SEO: [versiones localizadas](https://developers.google.com/search/docs/specialty/international/localized-versions) y [contenido para la búsqueda con IA](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide). La publicación, el rastreo, la indexación y la obtención de usuarios son etapas diferentes.

## Historial de preparación · 21–22 de noviembre

Están en preparación los paquetes de texto y los accesos desde la aplicación, los juegos independientes y las páginas del catálogo. Hay traducciones de borrador que requieren revisión. La rama no constituye una publicación. Quedan por verificar los recorridos completos de cuenta, reportes en pantalla y exportados, estadísticas, juegos y PWA instalada. Comprobar que los textos originales usados por las reglas de juego y los valores personales sigan intactos después de cambiar el idioma.

### Pruebas de integración

El selector, las claves de acceso y las etiquetas de los juegos que conservan su contenido español se comprobaron en 15 idiomas con un DOM de prueba. Se verificó la conservación de los campos, de una tabla de puntuaciones de prueba, de la identidad de instalación y de los parámetros de los enlaces. Se corrigió el destino antiguo de recuperación de contraseña y se incorporó el idioma al enlace nuevo del propio sitio. No se envió un correo real.

Pasaron las pruebas locales de idioma, arranque, PWA, catálogo, navegación e informes y reglas de Ajedrez, Ciudad, Generala y Batalla Naval. La prueba en navegador de Conecta colores reveló una colisión con el historial interno del juego. La corrección usa la API de historial de la ventana.

En Conecta colores se comprobó la selección de los 15 idiomas en el navegador, el cambio inglés–árabe y la pista con el mismo tablero abierto. Los nombres personales y los valores de las partidas tienen tratamiento independiente de las etiquetas. Los recorridos de Generala y Ciudad incluyen plantillas para rondas y tiradas.

Las plantillas de correo se encuentran en `supabase/templates/confirmation.html` y `supabase/templates/recovery.html`. Priorizan el idioma elegido al solicitar el correo y usan el enlace de verificación proporcionado por el servicio. Hay pruebas de ambos flujos en 15 idiomas para dos configuraciones del dominio. La configuración del servicio y la recepción de un correo real siguen pendientes.

La exportación del informe familiar prepara un documento local con el idioma y la orientación del texto. Se han probado nombres propios, puntuaciones, listas de materias, recomendaciones y la navegación. Los informes con descripciones libres, las pantallas de Eterna y los textos de Eneagrama requieren una revisión de contenido. Las preguntas y la escala del Eneagrama continúan en español. El producto lo indica antes de la compra. La sesión de Eterna también indica el idioma de la tutoría. En el informe de Eneagrama hay una opción de impresión localizada y se indica que el PDF original se genera en español. Falta verificar una PWA instalada en un iPhone físico.

La revisión del catálogo cubre 21 fichas de juego y la página del catálogo. Se identificaron 468 apariciones de títulos y acciones. Todas tienen entrada en los 14 paquetes, además del español original. Este control comprueba la cobertura de las claves. La revisión de estilo y significado es independiente.

Se comprobaron en local el alta y el restablecimiento en plantillas HTML, el informe de Eneagrama con dos perfiles ficticios, la impresión familiar, los controles de compartir y la continuidad de la partida. El aviso de Coco Bank se aplica en el catálogo y en su ficha. El funcionamiento de las áreas con usuarios reales, la aprobación de los textos y el despliegue están pendientes.


En 38 páginas (fichas, guías, menú y pantallas de juego) se identificaron 1.306 fragmentos distintos de texto visible en la estructura estática. Los 14 paquetes de traducción contienen una entrada para cada fragmento. El control no cubre todas las combinaciones de una partida ni acredita la calidad lingüística de las traducciones. Las traducciones automáticas, los textos largos del informe y las páginas legales requieren revisión. Estas últimas ofrecen el original español en una pestaña independiente.

Al instalar la PWA se registra el idioma de instalación. En los siguientes arranques tiene prioridad la última preferencia elegida por el jugador. Una prueba simula estos casos y comprueba los accesos rápidos del manifiesto. Las pruebas de Generala tiran los dados y cambian de idioma con un dado guardado. Las del informe familiar generan una exportación con una identidad ficticia en cada uno de los idiomas.

El entorno de vista previa usa la API de pruebas y desactiva el trabajador de servicio para mostrar la última revisión. La prueba de apertura sin conexión se realiza por separado. La página inicial de producción conserva su versión anterior hasta la publicación.

Se revisaron los recuentos de interacciones y observaciones, los días de actividad y los porcentajes del informe familiar en pantalla y al imprimir. Los avisos de las secciones escolar y de juegos se tradujeron conservando los límites de interpretación del informe. En la clasificación de cada juego, los totales, las partidas jugadas y la mejor puntuación cambian al elegir otro idioma con la tabla abierta. Las pruebas usan datos ficticios y comprueban que el apodo conserva sus letras originales.

En la recuperación del PIN, los avisos y el correo enmascarado se muestran por separado. El PIN familiar admite también dígitos árabes, persas y de ancho completo. El informe conserva la grafía del apodo del jugador y el total numérico original antes de aplicar el formato del idioma. Se revisaron los nombres de las ocho estrategias de aprendizaje, el título de impresión y el mensaje que prepara la función de compartir en los 15 idiomas. Las comprobaciones automáticas de la PWA cotejan la caché de la aplicación con la versión que espera la comprobación de producción.

### Informe familiar con poca actividad · 21 de noviembre

El resumen escolar diferencia un primer intento en cada concepto de los conceptos que ya se han practicado dos o más veces. Si todavía no hay intentos, la familia ve el estado inicial sin una recomendación de repetir un ejercicio. El capítulo de juegos también distingue la ausencia de partidas de una primera observación. Se revisaron los textos de estos estados y de las recomendaciones en los 14 paquetes de traducción. Los nombres de materias con comas se conservan al dar formato a la lista.

La prueba de idioma genera tres historiales ficticios y compara el resumen en pantalla y en el documento para imprimir en los 15 idiomas, incluida la vuelta al español. El recorrido de Chrome con pantalla móvil verifica el PIN, la recuperación, el informe y la vuelta al menú en los 15 idiomas, distribuidos entre los tres historiales. El estado de ejecución de este último recorrido se consulta en el control «Eterna regression» de la PR 132. La recepción real de los correos y la instalación en un iPhone físico siguen pendientes.

La ficha familiar, el formulario de contexto escolar y la impresión utilizan las denominaciones locales de los 16 cursos registrados por Coco en el sistema educativo español. El selector conserva el valor original al guardar. La traducción del curso respeta los textos personalizados, el nombre del estudiante y la comunidad autónoma. El campo de edad calculada usa las unidades y los números del idioma que haya elegido la familia.

Se corrigió también el aviso para padres y tutores de la pantalla de acceso que aparecía en español al seleccionar francés. La prueba de los 15 idiomas comprueba el aviso insertado por la aplicación, los dos enlaces y la conservación de los campos de acceso.

### Coco Ajedrez · 21 de noviembre

El tablero utiliza vocabulario propio de ajedrez para las piezas, el turno, las pistas y los finales de partida. El selector conserva la pieza seleccionada, las casillas legales, el historial y la posición guardada. Las coordenadas y la notación de las jugadas mantienen su valor al cambiar de idioma. Los enlaces para entrar, compartir e invitar incorporan el idioma activo.

La prueba del selector juega un mate en cuatro medias jugadas y unas tablas por triple repetición. También comprueba un jaque, unas tablas por ahogado desde una posición guardada y las cuatro opciones de coronación con el diálogo abierto. Cada recorrido comprueba los mensajes en los 15 idiomas a través de los controles del juego.

El selector se puede usar dentro de las ventanas de opciones, reglas y coronación de Ajedrez. El tablero conserva su orientación al activar el árabe y los dos botones de entrada de la ficha enlazan con el idioma elegido. El control de vista previa abre el botón inferior en Chrome con pantalla táctil simulada de 390 × 844, juega hasta un mate y regresa al menú principal.

### Privacidad para menores · 22 de noviembre

Se revisó la guía completa de privacidad para menores frente al original español en los 14 paquetes. Se corrigieron, entre otros, el significado de la ayuda escolar de Eterna, la autorización del adulto, el tratamiento de la voz, la selección de anuncios y el correo de contacto. La página conserva el idioma al abrir la política completa y al volver a Coco. Una pestaña abierta expresamente en el original español conserva ese idioma aunque el jugador cambie la preferencia en otra pestaña.

La prueba local lee la página real y comprueba texto, título, descripción, dirección de lectura, enlace al original, enlaces internos y correo en los 15 idiomas. Pasaron 65 pruebas locales de idioma, Ajedrez, arranque, navegación y PWA. Continúan pendientes la activación de los correos en Coco V2, su recepción en un buzón de prueba, el resto de la revisión editorial y jurídica y la prueba en un iPhone físico.

### Inicio de la cuenta y acceso familiar · 22 de noviembre

La ficha del jugador traduce el botón de acceso familiar, el rótulo de puntos y el número de partidas. El total conserva su valor al aplicar los separadores del idioma. Las instrucciones del PIN y el campo de confirmación también tienen traducción. La tarjeta de Eterna incluye los textos que aparecen al entrar con una cuenta. La prueba reproduce el cambio de idioma con 279 partidas ficticias y un apodo que también es una palabra traducible. Comprueba el apodo, los puntos, la ficha y las acciones de Eterna en los 15 idiomas en web y en modo de aplicación simulado. La comprobación física en iPhone sigue pendiente.

### Zona familiar, partidas y tienda 3D · 22 de noviembre

El selector también está disponible al abrir la zona familiar. Una cuenta de prueba con una suscripción mensual reproduce el recorrido desde el menú, introduce el PIN y cambia de idioma con la ficha abierta. El plan, los botones de gestión, la oferta anual y el perfil escolar se actualizan en los 15 idiomas. Las pruebas locales también cubren planes anuales, la fecha de renovación, una cancelación programada y las ofertas de prueba.

Se recorrieron las 56 páginas que utilizan el traductor compartido, una vez incorporadas las condiciones de la compra 3D, entre ellas las 21 fichas de juegos. También se probaron estados que se crean al jugar o abrir la bolsa. Hay pruebas de regresión para el turno y el objetivo de Batalla naval, el sorteo inicial de Coco Ciudad, la planilla de Generala y el recorrido desde una pieza 3D hasta el formulario de pago. El formulario se comprueba sin enviarlo. Las pruebas distinguen los nombres de jugador, los títulos bibliográficos, las direcciones y los datos introducidos de los textos de la interfaz.

Coco Med ofrece 24 preguntas del banco adaptadas en los 14 idiomas adicionales. Las pruebas de Eneagrama verifican las 54 afirmaciones por tramo de edad y los campos de los informes. La comprobación de una PWA instalada físicamente en iOS y la recepción de correos de acceso son verificaciones independientes.

El recorrido de los juegos también incluye la organización de dobles y campeonatos de Coco Pádel, el directorio de jugadores y las instrucciones de Diferencias, Coco Corre, Verdadero o falso, Fútbol, Crucigrama y Reto tiempo. El calendario, los marcadores y las operaciones conservan su significado al cambiar de idioma. Las pruebas de Coco Bank abren su aplicación integrada en los 15 idiomas antes y después de configurar una cuenta de prueba.

### Partidas abiertas y miniaturas descargables · 23 de noviembre

Verdadero o falso comparte las 180 entradas del banco y sus explicaciones (179 enunciados distintos, uno se utiliza en dos niveles) en los 15 idiomas. La rotación y las respuestas usan las mismas claves en todos ellos. Reto tiempo actualiza las 15 clases de pregunta, las opciones y las explicaciones al cambiar el idioma, incluso al recuperar una misión diaria guardada. Conserva la cuenta atrás y el orden de las opciones.

La revisión también abarca 38 mensajes de confirmación, avisos y solicitudes de datos que muestran el navegador y los juegos, incluida la gestión de memoria de Eterna. La miniatura descargable desde el catálogo se genera con el título y el pie del idioma elegido. La prueba de navegador abre la partida con una cuenta ficticia, cambia de idioma, cancela el aviso de salida y comprueba el JPEG de Coco Bank. La batería local de esta revisión pasó 102 pruebas. La comprobación en dispositivo iOS físico, la recepción efectiva de correos y la validación editorial del banco médico completo siguen pendientes.

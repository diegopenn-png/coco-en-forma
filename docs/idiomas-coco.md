# Coco en Forma en 15 idiomas

Trabajo iniciado el 21 de noviembre de 2026 sobre la aplicación que sirve cocoenforma.com.

La web y la PWA comparten la preferencia de idioma. El catálogo usa español, inglés, alemán, neerlandés, francés, italiano, polaco, ucraniano, ruso, chino simplificado, árabe, sueco, finés, noruego bokmål y danés. El selector usa flechas, permite elegir directamente un idioma y carga un paquete local del propio sitio. El español usa el contenido original.

Diego autorizó conservar en español los juegos con una adaptación lingüística compleja. El aviso previo cubre Descifra la palabra, Sopa de letras, Crucigrama, Coco Med, Verdadero o falso, Reto tiempo y Coco Bank. Coco Med, Verdadero o falso y Reto tiempo tienen bancos de preguntas o microdesafíos de contenido. Coco Bank incluye su propia escuela de inversión, presupuesto y simulación familiar.

## Estado vigente · 22 de noviembre de 2026

El selector público y los 15 idiomas se publicaron mediante la PR 132, commit `c0e10ab783d4f0374e59c9f5bd230251617426be`. GitHub Pages y la comprobación de producción terminaron correctamente. En cocoenforma.com se comprobó la actualización desde la versión anterior mediante «Nueva versión disponible · actualizar», la aparición del selector y la conservación del francés tras recargar. Las notas de preparación más abajo son históricas.

Diego amplió el encargo: selector dentro del menú después de entrar, landings de captación en cada idioma y corrección de una pregunta repetida por Eterna tras responder. Esta entrega incluye:

- El mismo selector se coloca en `.navegacionJugador` cuando el menú está abierto y regresa al espacio público al salir. No duplica los controles ni reinicia el juego. El renderer real, con Supabase simulado, se comprobó entrando, cambiando pestañas, abriendo la clasificación y Memoria, cambiando idioma con una carta girada y cerrando sesión, en web y modo PWA. Las 24 pruebas de idiomas pasan.
- La página española `/juegos-gratis/` conserva su URL. Se añaden 14 equivalentes con HTML estático y redacción propia, canonical individual, 15 alternates `hreflang` y `x-default`, enlaces de idioma utilizables sin JavaScript, metadatos sociales y FAQ coherente con su JSON-LD. El sitemap pasa de 38 a 52 URL. El generador único conserva las nuevas direcciones al reconstruir el catálogo.
- El contenido se encuentra en `seo/locales/free-games.json`; las palabras clave son intenciones editoriales, sin estimaciones inventadas de demanda o posición. Cada página incluye seis juegos, un ejemplo resuelto, pasos para empezar, FAQ y enlaces a la aplicación que conservan el idioma. Las 14 pruebas de páginas/SEO pasan. No se afirma que Google haya indexado las nuevas URL.
- Eterna `160.100.1-conversation-continuity` impide recuperar desde el historial una pregunta que un turno posterior ya cerró. Conserva las preguntas legítimamente pendientes y registra como aprendidas las ideas correspondientes a la pregunta contestada. La reproducción y siete regresiones nuevas pasan con fixtures y sin llamadas a modelos; la validación backend afectada pasa 596 comprobaciones. Su publicación requiere promover un candidato con los bindings de la versión activa, sin adoptar los orígenes de las vistas previas.

La caché de esta entrega es `coco-en-forma-v160.100.84-menu-languages`; los archivos compartidos de idioma utilizan `20261122-2`. El estado final de despliegue y los identificadores de la publicación se registran en la PR de esta entrega. No dar por publicada una versión solo por existir en la rama.

Pendientes de validación externa: correos de alta/recuperación recibidos en un buzón real; PWA instalada en un iPhone físico; inspección posterior de las nuevas URL en Search Console. No se dispone de un conector GSC en esta sesión. Los juegos marcados en español, las sesiones del tutor y el cuestionario/PDF original de Eneagrama mantienen el alcance lingüístico indicado. La revisión editorial completa de los paquetes anteriores sigue siendo distinta de la redacción nueva de estas landings.

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

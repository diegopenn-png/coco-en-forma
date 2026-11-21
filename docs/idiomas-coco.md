# Coco en Forma en 15 idiomas

Trabajo iniciado el 21 de noviembre de 2026 sobre la aplicación que sirve cocoenforma.com.

La web y la PWA comparten la preferencia de idioma. El catálogo usa español, inglés, alemán, neerlandés, francés, italiano, polaco, ucraniano, ruso, chino simplificado, árabe, sueco, finés, noruego bokmål y danés. El selector usa flechas, permite elegir directamente un idioma y carga un paquete local del propio sitio. El español usa el contenido original.

Diego autorizó conservar en español los juegos con una adaptación lingüística compleja. El aviso previo cubre Descifra la palabra, Sopa de letras, Crucigrama, Coco Med, Verdadero o falso, Reto tiempo y Coco Bank. Coco Med, Verdadero o falso y Reto tiempo tienen bancos de preguntas o microdesafíos de contenido. Coco Bank incluye su propia escuela de inversión, presupuesto y simulación familiar.

## Estado de la rama

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

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

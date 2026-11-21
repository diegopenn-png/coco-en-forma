# Coco en Forma en 15 idiomas

Trabajo iniciado el 21 de noviembre de 2026 sobre la aplicación que sirve cocoenforma.com.

La web y la PWA comparten la preferencia de idioma. El catálogo usa español, inglés, alemán, neerlandés, francés, italiano, polaco, ucraniano, ruso, chino simplificado, árabe, sueco, finés, noruego bokmål y danés. El selector carga un paquete local del propio sitio. El español usa el contenido original.

Diego autorizó conservar en español los juegos con una adaptación lingüística compleja. El aviso previo cubre Descifra la palabra, Sopa de letras, Crucigrama, Coco Med, Verdadero o falso y Reto tiempo. Los tres últimos tienen bancos de preguntas o microdesafíos de contenido.

## Estado de la rama

Están en preparación los paquetes de texto y los accesos desde la aplicación, los juegos independientes y las páginas del catálogo. Hay traducciones de borrador que requieren revisión. La rama no constituye una publicación. Quedan por verificar los recorridos completos de cuenta, reportes en pantalla y exportados, estadísticas, juegos y PWA instalada. Comprobar que los textos originales usados por las reglas de juego y los valores personales sigan intactos después de cambiar el idioma.

### Pruebas de integración

El selector, las claves de acceso y las etiquetas de los seis juegos españoles se comprobaron en 15 idiomas con un DOM de prueba. Se verificó la conservación de los campos, de una tabla de puntuaciones de prueba, de la identidad de instalación y de los parámetros de los enlaces. Se corrigió el destino antiguo de recuperación de contraseña y se incorporó el idioma al enlace nuevo del propio sitio. No se envió un correo real.

Pasaron 81 pruebas locales de idioma, arranque, PWA, catálogo, navegación e informes y reglas de Ajedrez, Ciudad, Generala y Batalla Naval. La prueba en navegador de Conecta colores reveló una colisión con el historial interno del juego. La corrección usa la API de historial de la ventana.

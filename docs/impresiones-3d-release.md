# Coco 3D — 8 noviembre 2026

## Acceso desde el menú de Coco — 8 noviembre 2026

Añadida la opción «Impresiones 3D / Descubre la colección» inmediatamente después de Clasificación, con el estilo del menú y un icono de pieza 3D. Es un enlace directo en la misma ventana a `/galeria/impresiones-3d/`, accesible con teclado y sin duplicarse cuando se reconstruye el menú. La caché PWA pasa a `v160.100.63-shop-navigation` para actualizar el HTML instalado.

Validación: sintaxis del script de navegación y del Service Worker; 11/11 comprobaciones existentes de estado del cliente superadas. Revisión en 390 y 320 px usando los estilos y el script de navegación de producción: una sola opción debajo de Clasificación, sin desbordamiento (374/374 y 304/304 px). Pulsación comprobada: abre la landing con las 23 fichas. Captura: `docs/qa/coco-3d-menu-mobile.png`.

Solicitud: landing comercial con las 25 fotos, precios de las imágenes, cobro con Stripe de ETERNA, recogida o envío. Ruta canónica /galeria/impresiones-3d/; alias /galeria/impresiones3D/.

23 productos: el perrito tiene dos vistas y el elefante dos colores. Vaquitas y estrellas se venden por parejas. No se alteraron los productos de las fotos.

Recogida gratuita con cita: dirección ya declarada en Coco, Calle El Lirio 16, escalera 1, 1.º B, 29640 Fuengirola. Envíos requieren presupuesto previo porque el propietario no ha fijado tarifa ni zonas. El máster confirma portes en /galeria/impresiones-3d/admin.html y copia el enlace Stripe; el correo se abre como borrador y no se envía automáticamente.

Arquitectura: catálogo único compartido, nuevos endpoints /v1/shop en Worker existente, pagos únicos, precios calculados en servidor. Webhook firmado compartido con ETERNA, con comprobación independiente de sesión, pago y líneas Stripe. No suscripciones nuevas. Reutiliza secretos/configuración existentes con --keep-vars. El acceso máster usa la autorización existente de Eneagrama.

Migración coco_3d_private_orders aplicada en Coco V2 (fcatttsfufjiphgohgwp): tabla coco_shop_orders con RLS; sin permisos anon/authenticated. Pedidos accesibles por clave aleatoria privada o máster. No se expone la clave en la URL de retorno Stripe.

Validación: 23 pruebas de pagos específicos (tienda + Eneagrama); build Wrangler sin errores. Suite completa: 1179/1179 pruebas superadas tras corregir pin obsoleto del SW y excluir únicamente las tres inserciones aisladas de tienda de los hashes educativos congelados. Se comprobó que el resto de index.js coincide exactamente con el commit base fb5840ffea1da82307b0785ec2a7813f5e91b1bb. Revisión visual en escritorio, 390 y 320 px; bolsa, compra por recogida, dirección de envío, búsqueda y variantes.

No se ha cobrado ninguna tarjeta ni enviado correos. Las pruebas de pasarela son simuladas; despliegue verificará salud, configuración y denegación de accesos sin credenciales. Publicado mediante PR #124, commit 0faff957496fecd6f1dd1f3faff17c74d420c9bd. GitHub Pages: run 42507763334 terminado correctamente. Worker: run 42507763554 superó pruebas, candidato, despliegue y verificación de producción (configuración tienda y salud ETERNA). Portada pública verificada en https://cocoenforma.com/galeria/impresiones-3d/. Captura: docs/qa/coco-3d-publicada.png. La inspección HTTP desde este entorno está restringida; la comprobación HTTP de producción se ejecutó correctamente desde GitHub Actions.


## Revisión de miniatura y visibilidad de compra — 8 noviembre 2026
Petición: miniatura temática, Flashforge Adventurer 5M Pro del usuario, y pago/entrega más visibles con discreción. Nueva imagen social JPEG versionada, con Open Graph y Twitter completos también en los alias. El botón Compartir copia una URL nueva para facilitar la actualización de vistas previas anteriores. Los mensajes ya enviados pueden conservar la miniatura en caché.

Imagen creada con generación integrada. Prompt final: mantener fondo marfil, tipografía azul marino y los textos «Impresiones 3D», «Imaginación que puedes tocar.», «Compra online · Recogida o envío»; sustituir la impresora abierta por una Flashforge Adventurer 5M Pro fiel a la referencia oficial, cerrada, con pantalla superior derecha y forma abstracta azul dentro, sin águila, premios ni productos del catálogo. Referencia de diseño del equipo: https://www.flashforge.com/products/adventurer-5m-pro-3d-printer . Recurso de producción: galeria/impresiones-3d/images/impresiones-3d-flashforge-5m-pro-v2.jpg .

La portada, fichas y bolsa explican tarjeta/Stripe/pago único. La franja de servicios destaca recogida gratuita con cita y envío con porte confirmado antes de pagar. Botones Añadir y bolsa más reconocibles. No se modifica el backend, precios, tarifa de envío ni condiciones de pago.

Validación de esta revisión: sintaxis de shop.mjs correcta, metadatos Open Graph/Twitter comprobados en las tres rutas, imagen JPEG 1200×628. Navegación y bolsa revisadas en 390/320 px, sin desbordamiento horizontal (305/305 px internos a 320). Catálogo mantiene 23 fichas. Captura de escritorio: docs/qa/coco-3d-pago-visible.png.

## Miniatura mágica con figuras de la colección — 8 noviembre 2026

Petición posterior: separar «3D» de la impresora, crear una estética de animación mágica y rodear la Flashforge con figuras realmente disponibles. Nueva imagen social versionada: `images/impresiones-3d-magia-flashforge-v3.jpg` (1200×628). Cuatro referencias del catálogo: leopardo, perrito, ranita roja y delfín. Se preservan sus colores, formas y textura impresa. La miniatura muestra pago con tarjeta y recogida en Fuengirola o envío. Open Graph, Twitter y los dos alias apuntan al nuevo recurso; Compartir utiliza `?v=magia-3d-3`. Script versionado para renovar su caché. No hay cambios en catálogo, precios ni circuito de pagos.

Revisión visual: título en dos líneas despejado, modelo de impresora reconocible, cuatro figuras visibles y textos legibles. Conversión de PNG a JPEG y reducción de tamaño sin retoques de contenido.

Comprobaciones locales: JPEG 1200×628 (199.371 bytes), Open Graph/Twitter correctos en las tres rutas, enlace Compartir y versión de caché del script coincidentes, sintaxis JavaScript correcta y `git diff --check` sin errores.

Prompt de generación (referencias: miniatura Flashforge anterior y cuatro fotos originales del catálogo):

```text
Redesign the FIRST supplied image as an exceptional landscape social-sharing thumbnail for a Spanish 3D-printed figurine shop, 1.91:1 aspect ratio, composed for 1200 x 630 pixels. The user wants a magical Pixar-like family animated movie aesthetic: polished, richly dimensional 3D illustration, warm and charming, cinematic soft light, luminous turquoise and golden filament curls and tiny sparkles. It must still feel premium and beautifully composed, not a cluttered collage.

The first reference contains the correct enclosed FLASHFORGE Adventurer 5M Pro printer. Preserve its recognizable dark graphite enclosed cubic body, glass front door, upper-right landscape touchscreen, round power button, model label upper-left and FLASHFORGE on the bottom front. Make the printer itself feel enchanted and softly stylized, not industrial-photographic. No eyes or face on the printer. Place it in the RIGHT half, slightly three-quarter view, with soft blue and gold magic coming from its nozzle and glowing chamber.

The remaining four reference images show ACTUAL figurines sold by this shop. Place these FOUR recognizable figurines around the printer's base in a playful, visually balanced little gathering: the bright yellow articulated spotted leopard with white paws; the brown-and-cream articulated puppy with floppy ears; the red/orange frog with huge white eyes and splayed feet; and the turquoise-and-blue articulated dolphin. Adapt them gently to the same animated 3D illustration style, but preserve their distinctive silhouettes, colors, proportions, markings and visible printed layers/segmented construction. They should look like the supplied figurines, not generic unrelated animals. Show all four clearly, no duplicates, no extra sale products. A gentle arc of sparkles connects the figures to the printer. Do not copy any text, price badges, plants or background printers from the product reference photographs. No eagle, no awards badge.

CRITICAL COMPOSITION: The LEFT 44% of the canvas is a completely clear typography zone, with generous empty space between all text and any printer/figure. No object, sparkles, shadow, glow, frame or decoration may overlap the letters. Make the title TWO LINES, exact text:
"Impresiones"
"3D"
Set it in large bold clean Montserrat-like deep navy sans serif, extremely legible at WhatsApp preview size. The 3D must be fully separated from the printer, not touching it. Put the subtitle below on two shorter lines, exact wording:
"Imaginación que"
"puedes tocar."
Then a restrained thin blue accent line. At the lower left, clearly readable but secondary, two exact lines:
"Pago con tarjeta"
"Recogida en Fuengirola o envío"

All text must be spelled exactly, crisp and clean, with no extra headlines. Keep all text at least 6% away from canvas edges. Left background soft warm ivory / peach; right background a beautiful subtle pastel lavender and aqua magical halo. Colorful figurines, graphite printer, navy type, cinematic shadows, premium animated-film visual quality. No logo invented for Coco, no watermarks, no UI, no prices. This is one finished flat full-bleed thumbnail, not a mockup of a browser, card or WhatsApp screen.
```

## Recuperación de navegación web/PWA — 8 noviembre 2026

Solicitud: regresar a Coco desde la colección y revisar la sensación de bloqueo.

Fuente: main `ffe8a1d94da6bf96caa905f21940b0859f145946`. El enlace anterior ya apuntaba a la raíz. Se comprobó públicamente la ida a Coco sin sesión y una carga inicial parcial que finalmente completó. No se ha reproducido el bloqueo específico del iPhone del usuario.

Cambios: todos los accesos de regreso a Coco desde colección, condiciones y pedido usan la misma ventana y `/?coco_home=1`. La entrada selecciona Mis retos y solicita una lectura de red con recuperación desde caché. Las consultas de inicio/sesión/perfil y carga inicial de puntuaciones tienen límite de espera y permiten reintentar; un error transitorio del perfil ya no cierra la sesión. El SW limita esperas de red/precarga y no sustituye un script o recurso ausente por index.html. Caché `coco-en-forma-v160.100.64-navigation-recovery`.

Verificado localmente: todos los scripts inline y SW compilan; 12 pruebas de recuperación (sesión, perfil, puntuaciones, bonos, reintentos, menú, regreso, red bloqueada y caché); 11 pruebas existentes de contrato del cliente. Simulación del menú autenticado con los scripts reales: sin errores de ejecución y un único enlace de tienda. Navegador de previsualización: Volver a Coco abre correctamente el inicio, con controles disponibles. No se han enviado pedidos, cobrado tarjetas ni cambiado datos de usuarios.

Estado: publicado y comprobado en producción el 8 de noviembre de 2026. Commit `06d48c10cb663dd3b6b645ad936b8d9c3e4f15df`. Al retomar se contrastó el repositorio remoto y se confirmó que la publicación ya había concluido, aunque este registro seguía indicando preparado.

Verificación de cierre: 23/23 pruebas aprobadas (12 de navegación/recuperación y 11 de contrato de cliente). Los cinco archivos públicos modificados —inicio, SW, colección, condiciones y pedido— responden 200 y coinciden byte a byte con el commit. Los 27 scripts y hojas de estilo locales referenciados por el inicio responden 200 con tipo de contenido correcto.

Navegador de producción: tras recargar la colección, «Volver a Coco» abre `https://cocoenforma.com/?coco_home=1` en la misma ventana; el inicio sin sesión completa la carga y muestra Entrar y Todos los juegos. Se probó Explorar los juegos y el regreso mediante Menú principal. El SW público contiene `coco-en-forma-v160.100.64-navigation-recovery`. No se observaron errores de la aplicación en la consola; únicamente mensajes de una extensión del navegador de pruebas.

Límite: el menú con sesión y los fallos de red se comprobaron con simulaciones locales, no con una cuenta real en producción. La PWA instalada en el iPhone del usuario no es accesible desde este entorno y no se da por verificada. No quedan cambios de este arreglo pendientes de publicación; ante una incidencia específica del dispositivo, el siguiente paso es identificar su pantalla y comportamiento con esta versión. Sin pedidos, cobros, correos ni cambios de datos de usuarios.

## Continuación de comprobaciones en producción — 8 noviembre 2026

Fuente contrastada: main `e12d1ba08f2ded9702d46313349d5dee6b5b2cdb`. El arreglo estaba publicado; esta continuación no requiere cambios de código ni otro despliegue funcional.

Comprobación HTTP directa: `index.html`, `sw.js`, `manifest.webmanifest`, `galeria/impresiones-3d/index.html`, `shop.mjs`, `condiciones.html` y `pedido.html` responden 200 con tipo de contenido apropiado y coinciden byte a byte con la fuente de main.

Prueba interactiva pública en Chrome: colección → «Volver a Coco» → inicio sin sesión completamente cargado → atrás del navegador → colección operativa. Búsqueda «elefante» devuelve un diseño; selección Azul oscuro; añadir a la bolsa conserva el color y total 5 €; continuar muestra recogida; seleccionar envío muestra dirección y solicitud de porte previo; «Volver a mi bolsa», eliminar la pieza de prueba y «Explorar la colección» funcionan. Bolsa devuelta a cero y búsqueda limpiada. No se completaron formularios, no se enviaron pedidos ni correos y no se efectuaron pagos. Sin errores o avisos de la aplicación registrados por el navegador; se excluyen mensajes de la extensión de pruebas.

Estado de alcance: navegación pública y controles anteriores comprobados. Se mantienen los límites ya documentados para la cuenta autenticada real y la PWA instalada en el iPhone. La siguiente comprobación requiere abrir la PWA en ese dispositivo y probar Impresiones 3D → Volver a Coco; si persiste un bloqueo, recoger la pantalla y el comportamiento exactos para poder reproducirlo. No hay cambios funcionales de este arreglo pendientes de publicación.

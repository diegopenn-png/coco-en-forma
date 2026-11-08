# Coco 3D — 8 noviembre 2026

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

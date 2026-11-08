# Coco 3D — 8 noviembre 2026

Solicitud: landing comercial con las 25 fotos, precios de las imágenes, cobro con Stripe de ETERNA, recogida o envío. Ruta canónica /galeria/impresiones-3d/; alias /galeria/impresiones3D/.

23 productos: el perrito tiene dos vistas y el elefante dos colores. Vaquitas y estrellas se venden por parejas. No se alteraron los productos de las fotos.

Recogida gratuita con cita: dirección ya declarada en Coco, Calle El Lirio 16, escalera 1, 1.º B, 29640 Fuengirola. Envíos requieren presupuesto previo porque el propietario no ha fijado tarifa ni zonas. El máster confirma portes en /galeria/impresiones-3d/admin.html y copia el enlace Stripe; el correo se abre como borrador y no se envía automáticamente.

Arquitectura: catálogo único compartido, nuevos endpoints /v1/shop en Worker existente, pagos únicos, precios calculados en servidor. Webhook firmado compartido con ETERNA, con comprobación independiente de sesión, pago y líneas Stripe. No suscripciones nuevas. Reutiliza secretos/configuración existentes con --keep-vars. El acceso máster usa la autorización existente de Eneagrama.

Migración coco_3d_private_orders aplicada en Coco V2 (fcatttsfufjiphgohgwp): tabla coco_shop_orders con RLS; sin permisos anon/authenticated. Pedidos accesibles por clave aleatoria privada o máster. No se expone la clave en la URL de retorno Stripe.

Validación: 23 pruebas de pagos específicos (tienda + Eneagrama); build Wrangler sin errores. Suite completa: 1179/1179 pruebas superadas tras corregir pin obsoleto del SW y excluir únicamente las tres inserciones aisladas de tienda de los hashes educativos congelados. Se comprobó que el resto de index.js coincide exactamente con el commit base fb5840ffea1da82307b0785ec2a7813f5e91b1bb. Revisión visual en escritorio, 390 y 320 px; bolsa, compra por recogida, dirección de envío, búsqueda y variantes.

No se ha cobrado ninguna tarjeta ni enviado correos. Las pruebas de pasarela son simuladas; despliegue verificará salud, configuración y denegación de accesos sin credenciales. Pendiente registrar resultado del despliegue remoto.

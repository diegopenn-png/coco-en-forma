# Coco Explora · propuesta comercial para Diego

Estado 31/10/2026: piloto educativo funcional; cobro de este producto NO habilitado.

## Oferta propuesta
- Muestra gratuita que explica alcance antes de empezar y entrega resultado básico sin retener información relevante.
- Informe educativo ampliado por **9,90 € de pago único, precio final propuesto pendiente de confirmar**: explicaciones, actividades familiares organizadas para cuatro semanas y exportación. No CI, diagnóstico, probabilidad de altas capacidades ni aval de Mensa.
- El piloto permite revisar gratuitamente el informe. Antes de vender, ampliar y revisar las actividades, probar entrega y preparar condiciones comerciales e impuestos.
- Canal: landing Coco → muestra → adulto → vista previa del informe → precio/condiciones → Stripe → entrega autenticada. No cobrar a un menor ni usar mensajes de alarma para forzar una compra.
- Diferenciar de los juegos gratuitos de Coco y de la suscripción de Eterna.

## Cobro existente comprobado
El Worker de Eterna tiene STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET configuradas, con precios mensual y anual. La ruta /v1/checkout crea mode=subscription. No reutilizarla para este producto.
No se ha podido verificar el titular, capacidad de cobro/payouts o modo real/prueba de Stripe desde las herramientas disponibles: los secretos no son legibles y el conector Stripe fue localizado y sugerido, pero aún no está instalado/conectado en esta conversación. No desplegar rutas para extraer secretos.
Para cerrar: confirmar precio; conectar acceso administrativo a Stripe existente; revisar titular y estado; crear producto/precio de pago único; confirmar fiscalidad/condiciones; implementar sesión autenticada con precio servidor, webhook firmado, compra idempotente y autorización por usuario/informe; probar compra cancelada, duplicados, reembolso y entrega. No afirmar ventas listas sin esa prueba.

## Economía orientativa, no previsión
100 ventas × 9,90 € = 990 € brutos; 500 = 4.950 € brutos. Faltan impuestos, comisiones de cobro, atención, desarrollo y adquisición. No son beneficios ni una garantía de demanda.
Empezar con tráfico propio y familias voluntarias antes de gastar en anuncios. Medir visitas y compras agregadas sin resultados cognitivos ni fecha de nacimiento en analítica.

## Para ofrecer CI o identificación de altas capacidades
Necesita un proyecto profesional distinto: licencias cuando proceda, responsable cualificado, desarrollo psicométrico, baremos locales por edad, estudios de validez y fiabilidad, evaluación de sesgo y límites de decisión. No se resuelve combinando tests de internet ni comprando informes generados por IA.

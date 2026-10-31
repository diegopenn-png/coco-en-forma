# Coco Eneagrama · estado de producto

Actualización 31/10/2026: autoconocimiento con 54 frases originales, nueve tendencias e informe automático de siete páginas (`2026-10-31-coaching-3`). Ruta /explora/. Cliente: 15 EUR por evaluación e informe, pago único sin renovación. Acceso máster ilimitado mediante derecho de cuenta confirmado por el servidor; consultar `.github/coco-eneagrama/master-access.sql` y `qa/eneagrama-coaching-verification.md`. Nunca por metadatos del cliente.

Stripe Cocoenforma acct_1U730uBWXPNbVxJs, live. Precio price_1UWVEXBWXPNbVxJshWAVJxu2, producto prod_VXaP34NSwWFess; 1500 céntimos EUR, no recurrente, tax_behavior inclusive. No se ha configurado Stripe Tax ni realizado un cobro de prueba real.

Servidor: Worker coco-eterna-v159, /v1/eneagrama/{access,checkout,reconcile,report}. Webhook existente con firma verificada, eventos de pago inmediato/diferido, reembolso y disputa. Compra canónica validada contra precio, importe, moneda, cantidad y cuenta, independiente de las suscripciones Eterna. Idempotencia de checkout y de consumo por informe. Tabla privada public.coco_eneagrama_orders y RPC para service_role únicamente. Master ilimitado comprobado contra rol persistido, sin consumo.

PDF generado en servidor tras validar respuestas y acceso. No persiste respuestas, fecha de nacimiento, alias, notas ni PDF. La fecha no sale del navegador; edad en años, respuestas y texto opcional se procesan transitoriamente. Se conserva un recibo de uso y huella del informe para reintentos sin duplicar consumo. No ofrece recuperación de respuestas después de cerrar la pestaña; se explica antes de comprar y completar. Condiciones públicas en /explora/condiciones.html, versión 2026-10-31-v1.

Menores acompañados sin eneatipo. Cuestionario original sin validación psicométrica ni acreditación; no reproduce pruebas licenciadas. Fuentes y límites en /explora/metodo.html.

## Objetivo comercial: 1.000 compradores de 15 EUR

Objetivo pedido por Diego: 1.000 personas, no 1.000 clics ni 1.000 inicios de pago. Representaría 15.000 EUR de cobros brutos si cada persona compra una evaluación al precio actual. No equivale a beneficio: descontar impuestos aplicables, comisiones, devoluciones, adquisición y soporte. El punto de partida de ventas y tráfico todavía no se ha consultado; no se presenta como cero.

Landing: «Conócete mejor. Cuida lo que más te importa». Situaciones de crianza, relación con los padres siendo adulto, pareja, trabajo y liderazgo; muestra gratuita, contenido exacto del informe, precio y condiciones visibles. No prometer mejora garantizada ni usar culpa parental, testimonios inventados, urgencia ficticia o sellos de validación inexistentes.

### Recorrido y medición propuestos

1. Visita por canal → ejemplo de informe → acceso/alta → checkout → compra confirmada → informe generado y descargado.
2. Contar compradores únicos con pago confirmado, separando reembolsos, disputas, compras repetidas, pruebas y acceso máster. Usar órdenes del servidor como verdad del pago; una visita a la página de regreso no acredita venta.
3. Antes de medir por canal, revisar la instrumentación existente y definir consentimiento, retención y datos mínimos. No enviar respuestas, perfil, edad, notas, correo ni otros datos personales a píxeles de publicidad. La nueva landing no incorpora rastreadores.
4. Medir conversión visita → comprador, abandono de alta y pago, coste de adquisición, margen por comprador, incidencias y devoluciones. La tasa objetivo se fijará con datos propios, no con una cifra supuestamente típica del mercado.

Escenarios aritméticos, no pronósticos ni benchmarks:

| Conversión visita → comprador | Visitas necesarias para 1.000 compradores |
| --- | ---: |
| 1 % | 100.000 |
| 2 % | 50.000 |
| 5 % | 20.000 |

Coste máximo de adquisición sostenible = ingreso neto por comprador menos comisiones, costes variables, devoluciones esperadas y margen deseado. No activar publicidad antes de conocerlo y de obtener autorización del gasto concreto.

### Etapas de adquisición

- Primeros 30 compradores: objetivo de aprendizaje comercial. Pedir de forma voluntaria qué entendieron de la oferta, qué faltó y qué práctica utilizaron. No son una muestra de validación psicométrica ni se ofrece contacto automático con el coach.
- Hasta 100: corregir la principal pérdida del recorrido. Fricción observada en el código: crear cuenta lleva al menú general y exige volver al eneagrama. Diseñar retorno al producto y probarlo antes de ampliar tráfico. Probar por separado mensajes de crianza y pareja, con el mismo precio y producto.
- De 100 a 300: concentrar contenido en el canal y mensaje con mejor conversión y margen observado. Preparar colaboraciones con coaches y comunidades de adultos; los contactos y publicaciones requieren el encargo correspondiente. No usar audiencias infantiles para vender.
- De 300 a 1.000: ampliar solo lo que conserva margen, entrega correcta y satisfacción. Solicitar testimonios con consentimiento y mostrar experiencias reales sin generalizarlas. Publicidad de pago únicamente tras aprobar inversión concreta.

Piezas iniciales propuestas, aún no publicadas ni enviadas:

- Crianza: «Quieres acompañar a tus hijos. ¿Qué ocurre contigo cuando se acaba la paciencia?» → explicar una escena y enlazar la muestra.
- Pareja: «Antes de repetir la misma discusión, prueba a poner en palabras lo que necesitas» → ejemplo de petición y presentación del informe.
- Trabajo: «Cuando todo parece depender de ti, ¿qué acuerdo falta?» → ejemplo de delegación y presentación del informe.

No hay un plazo prometido para las 1.000 ventas ni campañas activadas en esta actualización. El seguimiento de utilidad a 7/30 días es una propuesta a implementar con participación voluntaria; no una automatización activa.

## Calidad y evidencia

La estrategia de validación y mejora del informe está en [VALIDACION.md](VALIDACION.md). Separar conversión, satisfacción y validez de las puntuaciones: ninguna de las dos primeras demuestra por sí sola la tercera.

# Eterna Worker v160.92

Worker independiente. **No sustituye ni modifica el Worker de Coco Med.**

## Secrets obligatorios

Configúralos en Cloudflare, nunca en GitHub ni en `index.html`:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (recomendado; `SUPABASE_ANON_KEY` queda como fallback legado)
- `SUPABASE_SECRET_KEY` (recomendado; `SUPABASE_SERVICE_ROLE_KEY` queda como fallback legado)

Para pagos Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_ANNUAL_PRICE_ID`

Opcional:

- `EXPOSE_ERRORS=false`

El acceso de usuario máster no depende de correos publicados ni de variables de
entorno: el Worker lo concede únicamente cuando el perfil autenticado tiene el
rol `propietario`, leído en servidor.

Después de desplegar, copia la URL pública del Worker en `window.COCO_CONFIG.eternaEndpoint` dentro de `index.html`.

## Stripe

Crear dos Prices recurrentes en EUR (para la beta propuesta: 7,99 €/mes y 79,99 €/año; ajústalos antes de publicar si el cálculo de margen exige otro precio) y configurar webhook hacia:

`https://TU-WORKER/v1/stripe/webhook`

Eventos mínimos:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

El IBAN de Banco Sabadell se configura en **Stripe Dashboard → Payouts**, no en el código.

## PAYCOMET

v159 deja la columna `provider='paycomet'` preparada en Supabase, pero **no inventa una integración PAYCOMET sin las credenciales/contrato y parámetros reales del TPV**. Stripe Checkout queda implementado de extremo a extremo como primera pasarela funcional. PAYCOMET puede añadirse como segundo adaptador sin cambiar el Student Model ni Eterna.


## Controles familiares y uso

El Worker aplica el menor de dos límites: `max_sessions_per_day` configurado por la familia y `MAX_CHAT_REQUESTS_PER_DAY` del servidor. También expone `/v1/parent-settings`, `/v1/export` y `/v1/delete-data`. El borrado conserva el registro de suscripción para no descontrolar cobros activos.

Stripe Checkout no recibe el email del perfil infantil como `customer_email`: el adulto introduce los datos de pago en la pasarela. El acceso solo se marca activo por webhook y estado de pago/suscripción.

# Eterna Worker v160.94.5

Worker independiente. **No sustituye ni modifica el Worker de Coco Med.**

## Teacher Core y Situational Core

La decisión de cada turno sigue esta prioridad:

1. Riesgo o protección infantil en el mensaje actual.
2. Situación natural de aula: saludo, estado para aprender, malestar o tiempo de hoy.
3. Cambio explícito de tema o pregunta nueva.
4. Respuesta compatible con la pregunta académica pendiente.
5. Historial y memoria académica como contexto auxiliar.

El mensaje actual nunca se interpreta automáticamente como respuesta a una
pregunta anterior. Una interrupción de seguridad o de conversación natural no
se califica, no altera los contadores y conserva la actividad para poder
retomarla.

El núcleo docente se aplica a los seis modos y adapta vocabulario, profundidad,
autonomía y tipo de ayuda a Infantil, Primaria, ESO y Bachillerato. Exige trato
digno, inclusivo y no adoctrinador; distingue hechos, interpretaciones y
opiniones; admite incertidumbre; protege la privacidad; y evita fingir que
Eterna es una persona o que tiene experiencias humanas.

Las consultas del tiempo requieren una ciudad y usan una fuente oficial de
AEMET. Eterna pregunta qué ciudad se quiere consultar, no la ubicación del
menor. Si no hay datos verificables, lo dice y no inventa.

Referencias de diseño: [currículo estatal publicado en BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2022-3296),
[Ley Orgánica 8/2021 de protección integral a la infancia](https://www.boe.es/buscar/act.php?id=BOE-A-2021-9347),
[código deontológico de la profesión docente](https://consejogeneralcdl.es/Codigos-deontologicos/Profesion-docente/),
[guía de UNICEF sobre IA y niñez](https://www.unicef.org/innocenti/reports/policy-guidance-ai-children)
y [guía de UNESCO sobre IA generativa en educación](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research).

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

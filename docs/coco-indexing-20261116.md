# Coco: rastreo y URL canónicas — 16 noviembre 2026

Encargo de Diego: «Vale soluciónalo», ante el correo de Search Console que
informa de páginas bloqueadas por robots.txt y duplicadas sin canonical.
Repositorio canónico: diegopenn-png/coco-en-forma. Base: eaa3ce2.

## Hallazgos observados

- La portada, `/index.html` y las entradas con parámetros sirven el mismo HTML
  sin canonical. También faltaba en Método y Centro de confianza, que sí están
  en el sitemap, y en varias páginas informativas públicas.
- La galería 3D y sus dos alias señalaban como canonical una dirección con www,
  aunque el alojamiento redirige www al dominio principal sin www. El sitemap
  y los datos estructurados repetían esa variante; Open Graph incluía un
  parámetro de versión que no identifica contenido diferente.
- robots.txt bloqueaba entradas `?juego=`, `?coco_bank=` y
  `/explora/jugar.html`. Este último documento ya contiene `noindex`, que Google
  no puede leer si se impide el rastreo.
- Auditoría inicial: 42 URL públicas consultadas, 38 del sitemap y cuatro
  variantes. El acceso inicial a Search Console estaba cerrado; Diego completó
  el acceso y se revisó el listado privado en la continuación descrita abajo.

## Corrección

- Canonical estático en la portada y las páginas públicas que carecían de él,
  disponible sin JavaScript. La portada consolida también `/index.html` y sus
  parámetros en `https://cocoenforma.com/`.
- Canonical, Open Graph, sitemap y datos estructurados de la galería alineados
  con su URL final sin www. Se conservan los alias de entrada.
- Se permite rastrear las entradas de la aplicación y leer su canonical, y
  leer el `noindex` de la exploración. Se conservan las exclusiones técnicas
  `/api/`, `/qa/` y `/supabase/`, y el noindex de pedidos y administración.
- Se corrige también el generador para que una regeneración no reintroduzca
  los problemas. Se mantienen las 38 páginas del sitemap.
- Sin cambios de autenticación, reglas de acceso, juegos, puntuaciones,
  contenido visible, pagos, datos de usuarios ni comportamiento de la PWA.

## Verificación y continuación

Pruebas locales: 14 correctas (SEO de indexación, landings de captación y
catálogo/juegos). Se comprueban las 38 URL del sitemap, canonical en el HTML
inicial, enlaces, noindex de pantallas internas, coherencia de galería/alias,
contenido de guías, filtros y compartir. El cuerpo HTML de las páginas editadas
permanece idéntico. Regeneración idempotente y `git diff --check` correctos.

Publicado mediante PR #131, commit de integración
`99a325d217bcc57952e8e4f0f4a6f25b5d3f14d9`. GitHub Pages completó build y
deploy correctamente: ejecución 43830290971. Smoke de web/PWA: 43830293004,
correcto. Regresión Eterna: 43829819467, correcta. Preview y matriz de
dispositivos: 43829819455, correctos.

Comprobación de producción terminada el 16/11/2026 a las 09:20 CET:
60 URL con HTTP 200 y HTML idéntico byte por byte al probado localmente,
incluidas las 38 del sitemap, páginas informativas, alias, www y parámetros.
Canonical y noindex coinciden con lo previsto. robots.txt, sitemap.xml y el
archivo de verificación de Google coinciden exactamente con el repositorio.
Evidencia: `qa/reports/coco-indexing-production-20261116.json`.

Incidencia previa de CI: `qa/explora/share-tools.test.cjs:6` falla al devolver
el foco tras cerrar Compartir (body frente a botón). Reproducido también sobre
la base eaa3ce2 en un directorio temporal; ese test solo ejecuta tres módulos
sin cambios en esta entrega. Motor, informes, UI y navegación de Eneagrama
pasan. No se ha modificado esa funcionalidad dentro del encargo SEO.

## Cierre de Search Console — 16 noviembre 2026

Acceso completado por Diego. Propiedad comprobada: `https://cocoenforma.com/`.
El informe, con última actualización indicada 13/11/26, muestra 52 páginas
indexadas y 10 excluidas. No se atribuye ese total a la corrección de hoy.

- Cinco bloqueadas por robots.txt: entradas `?juego=crucigrama`, `?juego=padel`,
  `?juego=sopa`, `?juego=sudoku` y `?juego=conecta`. La regla eliminada cubre
  estos cinco casos. Se pulsó VALIDAR CORRECCIÓN: estado **Iniciada**, inicio
  **16/11/26**.
- Cuatro duplicadas sin canónica: variantes de portada con `open=eterna`
  (modos explain/homework y fuentes SEO/social) y `password_actualizada=1`.
  Dos incluyen un identificador de sesión de marketing que no se reproduce.
  El canonical estático de portada cubre las cuatro variantes. Se pulsó
  VALIDAR CORRECCIÓN: estado **Iniciada**, inicio **16/11/26**.
- Una rastreada sin indexar: la entrada de portada con `open=eterna`,
  `mode=homework` y `source=seo_apoyo_escolar_con_ia`. Es otra variante de la
  portada, consolidada mediante canonical. No se solicita que esta variante
  aparezca como página independiente ni se fuerza la validación de ese estado.

Ambas validaciones se confirmaron también en el informe general tras abrirlo
de nuevo: robots.txt **Iniciada (5)** y duplicadas **Iniciada (4)**.

Inspección individual de la portada: **La URL está en Google / La página está
indexada**. Último rastreo guardado: 15/11/2026 14:56:17; entonces aún no había
canonical declarada. La prueba en tiempo real de 16/11/2026 08:39:31 confirma
obtención correcta, rastreo e indexación permitidos y canonical declarada
`https://cocoenforma.com/`. Se solicitó indexación de la versión corregida y
Google confirmó que la URL se añadió a la cola de rastreo prioritaria.

Sitemap: `/sitemap.xml`, **Correcto**, **38 páginas descubiertas**, última
lectura indicada 15/11/2026. Se volvió a enviar para recoger los cambios de
canonical; Google confirmó **Se ha enviado el sitemap correctamente**.

Pendiente externo: Google debe completar las dos validaciones y actualizar
sus informes. No se afirma que hayan terminado ni que las variantes deban
indexarse por separado. Las exclusiones técnicas y los noindex intencionales
se conservan. La evidencia de producción anterior refleja el estado de acceso
en el momento de aquella auditoría; este cierre la complementa.

Referencias oficiales consultadas:
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/block-indexing

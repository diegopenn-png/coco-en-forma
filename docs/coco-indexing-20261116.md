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
  variantes. No se ha podido consultar el listado privado de URLs del aviso:
  Search Console muestra la cuenta guardada con sesión cerrada.

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

Search Console: faltan la lista exacta de URLs afectadas, la inspección actual y
la validación de correcciones. Que el código esté corregido no demuestra que
Google haya vuelto a rastrearlo ni que haya actualizado el informe. Las rutas
técnicas bloqueadas y las páginas con noindex siguen excluidas intencionalmente.

Referencias oficiales consultadas:
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/block-indexing

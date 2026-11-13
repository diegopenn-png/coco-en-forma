# Landings y miniaturas de Coco

El catálogo público está en `/juegos/`. Las 19 guías de juegos se generan en
`/juego/{id}/`; Coco Eneagrama conserva su página y condiciones en `/explora/`.
Los botones de jugar abren las rutas originales de la aplicación. Las guías se
pueden leer sin JavaScript ni cuenta; las condiciones de acceso al juego no cambian.

## Editar y reconstruir

1. Editar textos, ejemplos, preguntas y relaciones en `seo/catalog.mjs`.
2. Ejecutar `node scripts/build-game-landings.mjs` desde el repositorio.
3. Versionar los HTML generados, `robots.txt` y `sitemap.xml` junto con la fuente.

El generador entrega HTML estático, metadatos únicos, canonical, Open Graph,
Twitter Cards, datos estructurados descriptivos y enlaces internos. No incluye
valoraciones inventadas ni resultados educativos garantizados. El sitemap contiene
solo contenido público y excluye cuentas, salas privadas y parámetros de juego.

## Miniaturas

`share/premium-v160126/` contiene 18 composiciones de 1200 × 630 en JPEG y sus
versiones de 720 × 378 en WebP. Los fondos originales generados se conservan en
`art/`; `seo/thumbnail-sources.json` conserva las indicaciones, títulos y subtítulos.
La referencia visual es `share/eterna.png`, que no se modifica. Todos los títulos
se componen con los archivos Montserrat del repositorio, sin logos adicionales.

Para reconstruir las composiciones: `python scripts/build-premium-cards.py`.
Requiere Python con Pillow, Inkscape, Fontconfig, Node y Sharp. Sharp se resuelve
desde `COCO_NODE_MODULES`, el runtime de Codex o el entorno Node instalado.
La regeneración usa los fondos guardados y no hace nuevas llamadas a modelos.

El catálogo principal, Bank, Ciudad, Ajedrez, Eneagrama y las landings comparten
los mismos recursos. `sw.js` renueva la caché e incluye ambas resoluciones para
los dispositivos con la PWA instalada. Se conservan las imágenes anteriores.

## Validación

Instalar jsdom 26.1.0 en un directorio temporal y pasar su ruta:

```sh
COCO_JSDOM_PATH=/tmp/coco-landings-qa/node_modules/jsdom node --test qa/game-landings.test.mjs
```

La prueba comprueba páginas, enlaces, metadatos, FAQ, rutas de juego, buscador,
portapapeles, dimensiones/peso de miniaturas y cobertura de caché. Complementar
con revisión visual en escritorio y móvil, y comprobar las URL públicas después
de publicar. La puntuación y las reglas de los juegos no se modifican.

## Alcance SEO

El contenido queda disponible para buscadores y rastreadores que respeten
`robots.txt`. Esto no demuestra que ya esté indexado ni garantiza posición o
aparición en respuestas de IA. No se requieren archivos especiales para IA.
No se ha realizado un envío a Google Search Console ni Bing Webmaster Tools.

Referencias oficiales:

- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- https://developers.openai.com/api/docs/bots

## Captación orgánica · 13 de noviembre de 2026

`seo/discovery.mjs` define 10 páginas por intención de búsqueda: seis selecciones
de juegos gratuitos y cuatro guías de Eterna. Sus contenidos y ejemplos son
visibles sin ejecutar JavaScript. Se generan junto al catálogo al ejecutar
`node scripts/build-game-landings.mjs`. El generador conserva además la página
de impresiones 3D y la página comercial de Eterna dentro del sitemap.

Las páginas gratuitas incluyen enlaces directos al juego y a sus reglas. Las
de Eterna abren el modo de tarea, examen o explicación admitido por el onboarding
y muestran prueba, precio y enlace a condiciones. Las 19 fichas de juegos enlazan
la guía general de Eterna. El catálogo enlaza las diez nuevas guías.

Oferta reflejada de `eterna-captacion.html` el 2026-11-13: prueba de 7 días sin
tarjeta; 7,99 €/mes o 79,99 €/año. Al cambiar la oferta, revisar también
`eternaOffer` y las menciones de precio en `seo/discovery.mjs` y el generador.
No se han cambiado el checkout, los cobros, las cuotas ni los controles de acceso.
No hay nuevas peticiones a modelos ni analítica añadida en estas páginas.

Validación adicional: `COCO_JSDOM_PATH=/tmp/coco-seo-qa/node_modules/jsdom node
--test qa/discovery-landings.test.mjs qa/game-landings.test.mjs`. La entrega
se prepara en rama de revisión. La publicación requiere la autorización de Diego.
Tras publicarla, comprobar URL y contenido en producción y enviar el sitemap en
Search Console/Bing si hay acceso; publicación no acredita indexación.

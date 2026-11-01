# Landings y miniaturas de Coco

El catálogo público está en `/juegos/`. Las 17 guías de juegos se generan en
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

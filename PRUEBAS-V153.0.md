# Coco en Forma v153.0 — QA final

Fecha: 20/08/2026  
Base única: `Coco-en-Forma-v152.0-listo-para-GitHub(1).zip`

## Resultado automatizado
- **318/318 comprobaciones estáticas y de integración superadas**.
- **59/59 archivos de la distribución responden HTTP 200** en servidor local de prueba.
- **20/20 scripts JavaScript inline** de `index.html` con sintaxis válida.
- **10/10 JavaScript externos activos + `sw.js`** con sintaxis válida (`node --check`).
- **8/8 pruebas del núcleo de Coco Pádel**: jugadores, resultado por sets, sets/juegos, puntos, perfil, corrección, borrado y recálculo.
- **49/49 recursos de precache** del service worker existen físicamente.
- **13/13 páginas sociales directas** presentes.
- **13/13 miniaturas sociales JPEG** presentes, válidas y verificadas a **1200×630**.
- `manifest.json` y `manifest.webmanifest`: JSON válido, `start_url` v153.
- `icon-512.png`: **512×512** y es también la imagen social de la portada.
- **0 recursos 404** dentro de la distribución publicada durante la prueba HTTP local.

## Clasificación — fuente única
- Conjunto general único: **11 juegos**: Números, Cálculo, Palabras, Series, Memoria, Sudoku, Sopa, Crucigrama, Tiempo, Verdadero/Falso y **Coco Fútbol**.
- Coco Corre y Encuentra las diferencias quedan excluidos del cálculo sin borrar sus filas históricas.
- `supabase-coco-v153.sql` crea `public.coco_clasificacion_fuente_v153` como fuente única.
- Cada columna por juego se calcula desde `public.partidas`.
- `total` SQL es literalmente la suma de las **11 columnas**.
- `clasificacion_general_coco` y `clasificacion_global_v153` leen esa misma fuente.
- El carnet del jugador y Zona Familiar consumen `clasificacion_general_coco`, evitando un total alternativo calculado por otra fórmula.
- Coco Fútbol deja de devolver clasificación específica; `clasificacion_juego_coco` queda restringida a Coco Med.

## Juegos retirados
- `juego/coco-corre/`: ausente.
- `juego/diferencias/`: ausente.
- `scenes/`: ausente.
- Scripts Runner/Diferencias v144/v151/v152: ausentes.
- Service worker: sin referencias a esos juegos ni a `scenes/`.

## Compartir / Open Graph
- Web Share API presente.
- WhatsApp presente.
- Copiar enlace presente con confirmación `Enlace copiado`.
- Botón de compartir integrado en tarjetas y cabeceras de los módulos activos.
- URLs públicas normalizadas a `https://www.cocoenforma.com/juego/<id>/`.
- Cada juego tiene página HTML estática con `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, Twitter Card y canonical.
- Miniaturas sociales optimizadas a JPEG 1200×630 para reducir peso sin perder calidad visual.
- Portada: `og:image` y `twitter:image` = `https://www.cocoenforma.com/icon-512.png`, el mismo icono de 512 px utilizado por la PWA.

## PWA
- Caché: `coco-en-forma-v153.0.0-r1`.
- 49 recursos de precache; todos existentes.
- No quedan recursos de Coco Corre, Diferencias ni `scenes/` en el precache.

## Nota de validación externa
La estructura y los recursos sociales se validaron dentro de la entrega. La vista previa real de WhatsApp, Facebook, LinkedIn, X o Telegram solo puede comprobarse **después de publicar** porque esos servicios consultan el dominio público y mantienen sus propias cachés.

El Chromium disponible en este entorno bloquea por política administrativa las URLs `localhost` y `file://`, por lo que no se declara una prueba visual E2E de navegador que el entorno no permitió ejecutar. Esa limitación no afecta a las pruebas HTTP, sintaxis, DOM estático, metadatos, assets, lógica de Pádel ni consistencia estructural realizadas arriba.

# Coco en Forma v152.0

## PWA / app instalada
- Registro de Service Worker centralizado en `coco-v152-pwa.js`: existe una sola llamada `serviceWorker.register` en toda la aplicación.
- Eliminados los registros duplicados que quedaban en `index.html` y `coco-v142-runtime.js`.
- `manifest.json` y `manifest.webmanifest` arrancan en `./?source=pwa-v152&v=15200`.
- Todos los JS y CSS de primera parte cargados por `index.html` usan el mismo fingerprint `?v=15200`; no quedan referencias ejecutables con v142/v145/v148/v150/v151.
- `sw.js` elimina caches Coco antiguas y usa red pura con `cache: no-store`, sin reutilizar HTML/JS/CSS antiguos.
- `index.html` y recursos críticos llevan política no-store en `_headers` y meta anti-cache.
- El botón **Salir** cambia de pantalla inmediatamente y realiza `signOut` en segundo plano con límite de espera.
- La comprobación diaria antes de abrir un juego tiene límite de espera: Supabase lento no puede dejar un botón congelado.
- La lectura de sesión de los módulos nuevos tiene límite de espera de 1 segundo para que el juego pueda abrir aunque Auth tarde.

## Coco Corre
- Cinco carriles reales: `-2, -1, 0, 1, 2`.
- Coco puede moverse claramente por los cinco carriles mediante flechas, teclado o gesto.
- Los objetos utilizan exactamente la misma geometría de carriles que Coco, por lo que no pueden aparecer en una posición inalcanzable.
- Bolsa aleatoria de cinco carriles: cada bloque de cinco apariciones reparte los objetos por los cinco carriles en orden aleatorio.
- Cuatro divisorias visibles forman cinco franjas claras de carretera.
- Los carriles exteriores aprovechan el ancho real de la carretera también en escritorio.
- Objetos más rápidos y ritmo de aparición más vivo.
- Frutas, herramientas y otros objetos dejan de verse como cromos cuadrados: dibujo flotante completo, sombra suave y etiqueta separada.
- Tamaños ajustados para evitar invasión visual entre carriles.

## Encuentra las diferencias
- Eliminada la recoloración fija que convertía varias zonas/objetos en el mismo morado.
- El renderer detecta el color dominante del objeto y modifica selectivamente sus píxeles, preservando fondo, textura, luces y sombras.
- Cada diferencia de una misma escena usa una variación distinta para evitar que todos los cambios tengan el mismo color.
- Cerebro y pico de Coco usan alternativas naturales (dorado, naranja, rosa/rojo, ámbar), sin morado o azul eléctrico.
- No se añaden círculos, rombos, pegatinas, manchas, figuras geométricas ni objetos sintéticos sobre la escena.
- Luminosidad ajustada a 1.22 para mantener detalle sin sobreexponer.

No requiere cambios SQL en Supabase.

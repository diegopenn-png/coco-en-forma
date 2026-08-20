# Coco en Forma v153.0 — Cambios

Base única: **v152.0 adjunta**. No se reconstruyó desde versiones anteriores.

## Simplificación
- Retirados completamente **Coco Corre** y **Encuentra las diferencias** del catálogo, rutas, páginas sociales, service worker y distribución.
- Eliminada la carpeta `scenes/` y los módulos/recursos exclusivos de ambos juegos.
- Se conserva el buzón de sugerencias y el resto de funciones estables.

## Clasificación general
- Fuente única de verdad: **11 juegos generales**: Números, Cálculo, Palabras, Series, Memoria, Sudoku, Sopa, Crucigrama, Tiempo, Verdadero/Falso y **Coco Fútbol**.
- Coco Fútbol deja de tener clasificación específica y pasa a sumar a la general.
- La tabla principal muestra una columna por cada juego general y un Total.
- `Total` se calcula como suma exacta de esas 11 columnas desde la misma vista SQL.
- Carnet, clasificación y Zona Familiar dejan de depender de fórmulas paralelas para el total general.
- Las partidas históricas de Coco Corre/Diferencias no se borran de Supabase: simplemente dejan de contar.

## Tarjetas
- Ninguna tarjeta abre una clasificación particular.
- Solo muestran un estado informativo no clicable: `Puntúa para la clasificación general` o `No puntúa para la clasificación general`.
- La clasificación competitiva se consulta desde la pestaña principal `Clasificación`.

## Compartir
- Los **13 módulos activos** tienen URL directa estable en `/juego/<id>/`.
- Menú con Web Share API, WhatsApp y Copiar enlace.
- El parámetro `?juego=<id>` conserva el destino y abre/posiciona el módulo correspondiente después del acceso.
- Cada página social tiene Open Graph y Twitter Card estáticos, URL canónica e imagen HTTPS absoluta.
- Las 13 miniaturas sociales se optimizaron a **JPEG 1200×630** (aprox. 2,09 MiB en total frente a casi 9,5 MiB en PNG).
- La portada `www.cocoenforma.com` usa como `og:image` y `twitter:image` el mismo `icon-512.png` de la PWA.

## PWA
- Caché `coco-en-forma-v153.0.0-r1`.
- Precache sin Coco Corre, Diferencias ni `scenes/`.
- Precarga de las 13 páginas sociales y sus miniaturas optimizadas.

## Limpieza
- **v152: 337 archivos / 47,48 MiB** sin comprimir.
- **v153: 59 archivos / 8,10 MiB** sin comprimir.
- Reducción neta: **278 archivos menos y 39,38 MiB menos** (aprox. 83 % del peso).
- 300 rutas de la v152 desaparecen; se incorporan 22 rutas nuevas propias de v153.
- Ver `ARCHIVOS-SEGUROS-PARA-BORRAR.txt`.

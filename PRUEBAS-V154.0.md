# QA Coco en Forma v154.0

## Resultado específico de miniaturas sociales
- 122/122 comprobaciones específicas superadas.
- Fallos: 0.
- 13/13 páginas individuales usan Open Graph estático.
- 13/13 miniaturas son JPEG 1200×630 y existen físicamente.
- 13/13 URLs Twitter apuntan a la misma miniatura oficial del juego.
- 13/13 imágenes están incluidas en el precache v154.
- 0 referencias productivas a las miniaturas sociales genéricas v153.
- El dominio principal usa exactamente la URL de `TARJETAS_COCO[0]` ya presente en el repositorio (Coco · Tu primer gran paso).

## QA general heredado y reejecutado
- `qa_v153_final.py`: **318/318 checks passed; files=59**.

## Fuente visual
Las miniaturas v154 no introducen personajes ni ilustraciones nuevas. Se rasterizan las ilustraciones SVG ya existentes en `index.html`: `Y()` para los juegos clásicos y `svgEspecial()` para Crucigrama, Reto Tiempo, Verdadero/Falso, Coco Med, Fútbol y Pádel. El fondo replica la familia cromática del contenedor `.emoji/.cocoIconoEspecial` de cada tarjeta.

# Coco en Forma v152.0 — Corrección integral sobre v151.0

Base exclusiva: `Coco-en-Forma-v151.0-listo-para-GitHub.zip` aportado por el usuario.

## 1. Catálogo y clasificaciones

- Coco Pádel deja de aparecer como **En construcción** y abre el módulo funcional.
- Se eliminan de las tarjetas los pequeños puntajes y accesos de clasificación por juego que podían resultar ambiguos.
- Cada tarjeta muestra únicamente un estado informativo, no clicable:
  - `Puntúa para la clasificación general`, o
  - `No puntúa para la clasificación general`.
- La **Clasificación** principal de la cabecera continúa siendo el único acceso a rankings desde el catálogo.
- No se modifica el registro interno de partidas, puntos ni las funciones RPC de Supabase instaladas en v150.

## 2. Coco Pádel

- Se corrige la aplicación real de los estilos dentro del modal: el modal vive fuera de `#cocoApp`, por lo que la capa v151 no estaba aplicándose correctamente.
- Fichas de jugador compactadas: desaparecen PJ/PG/PP/SG/SP/DS/GG/GP/DG del resumen móvil.
- Resumen visible por jugador: `Partidos jugados`, `Victorias`, `Derrotas`, más `Campeonatos`, `Jornadas`, `Posición` y `Puntos`.
- Ranking y contenido compartido usan palabras comprensibles en lugar de siglas opacas.
- Se conserva búsqueda parcial de jugadores, jornadas, resultados set a set y recálculo desde resultados.
- Excel permanece eliminado; solo quedan WhatsApp y Copiar.
- En la interfaz se utiliza exclusivamente `Campeonato`.

## 3. Coco Corre — Street Skate

- Se corrige la causa por la que la nueva capa visual prácticamente no se veía: los estilos v151 estaban limitados a `#cocoApp` y el juego se renderiza en un modal exterior.
- La nueva capa v152 se aplica realmente al modal y muestra calle urbana, edificios, muro con grafitis, mobiliario urbano y asfalto animado.
- Coco aparece sobre un skate visible, con ruedas animadas.
- Se añade una señal visual de impulso con la pierna al cambiar de carril.
- Se mantienen salto y agacharse con barricada y barrera elevada ilustradas.
- Controles táctiles compactos y legibles en móvil, sin textos cortados.
- Reglas: máximo 15 s en básico, 12 s en intermedio y 10 s en avanzado.
- Después de un cambio de regla, la cola de apertura comienza con distractor; no se sirve la respuesta correcta inmediatamente.

## 4. Encuentra las diferencias

- Se corrige la desproporción móvil: imágenes siempre 3:2, `object-fit: contain` y sin estiramientos.
- En móvil las dos escenas se muestran apiladas, compactas y completas dentro del área de juego; en pantallas amplias se muestran lado a lado.
- Se generan pares específicos por nivel: básico muestra únicamente sus 4 diferencias, intermedio 5 y avanzado 6. Ya no existen diferencias visibles extra que no puedan pulsarse.
- 10 escenas × 3 variantes × 3 niveles, más 10 originales: **100 WebP v152** a 768×512.
- Los cambios se integran dentro de objetos/zonas reales de la escena y se reduce el aspecto de parche artificial de la versión anterior.
- Los hotspots mantienen las coordenadas de las diferencias y funcionan simétricamente en ambas escenas.

## 5. PWA y estabilidad

- Cache PWA: `coco-en-forma-v152.0.0-r1`.
- Manifest actualizado a `pwa-v152` y query de manifest a `v=1520`.
- Nuevos módulos: `coco-v152-padel.js`, `coco-v152-runner.js`, `coco-v152-differences.js`, `coco-v152-fixes.js`, `coco-v152-refinements.css`.
- Los aliases v149 usados por el núcleo estable se conservan para compatibilidad.
- No se requieren cambios nuevos en Supabase.

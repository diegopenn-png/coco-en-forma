# Coco en Forma v151.0 — cambios

Fecha: 2026-08-16

## 1. Acceso a juegos

- El catálogo ya no deshabilita todos los botones mientras espera a Supabase.
- Se aplica un estado local inmediato y después se sincronizan puntuación y límite diario en segundo plano.
- Las lecturas de sesión, perfil y partidas tienen límites de espera para que una consulta lenta no congele el acceso.
- El manejador global solo bloquea una tarjeta cuando su estado es explícitamente `done`.
- `Coco Corre` y `Encuentra las diferencias` usan nombres de archivo nuevos (`coco-v151-*.js`) para impedir que un Service Worker antiguo mezcle motores de versiones anteriores.
- El Service Worker v151 usa actualización sin caché del propio worker, activa la versión nueva al terminar el precache y usa red primero para recursos estáticos.

## 2. Coco Corre

- Velocidad de aproximación: básico 0,30; intermedio 0,34; avanzado 0,38 de progreso/segundo.
- Tiempo aproximado desde aparición hasta decisión: 2,93 s / 2,59 s / 2,32 s.
- Intervalo de aparición: 1,08 s / 0,92 s / 0,78 s.
- Se mantiene la regla de dos distractores antes del primer objetivo tras una regla nueva.
- Los objetos de categorías ya no están atrapados por `contain: paint`.
- Nuevo visual flotante con objeto completo, brillo, color físico y etiqueta separada.
- Etiquetas sin elipsis: nombres largos como “balón de baloncesto” o “pala de tenis de mesa” pueden ocupar dos líneas y no se recortan.
- Se mantiene variedad de frutas, herramientas, deportes, ciencia, colegio, espacio, cocina y naturaleza.

## 3. Encuentra las diferencias

- Eliminados del motor activo todos los cambios por figuras superpuestas y objetos dibujados encima de la escena.
- Eliminados los renderers de rombos, hexágonos, etiquetas, herramientas genéricas y props añadidos.
- Las diferencias activas son únicamente cambios de color aplicados a objetos reales de la imagen y cambios selectivos en cerebro/pico de Coco.
- Todos los niveles conservan al menos una diferencia real en Coco.
- Luminosidad elevada a 1,32 con contraste 1,07 y saturación 1,12.
- El texto del juego deja claro que no se usan marcas, círculos o formas superpuestas para simular diferencias.

## 4. Compatibilidad

- Se conservan los 15 accesos del catálogo.
- Se conserva la clasificación general/específica implementada en v150.
- Se conserva Coco Pádel Club y sus exportaciones.
- No requiere SQL nuevo para esta entrega.

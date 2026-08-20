# Coco en Forma v157.0

Base exclusiva: v156.0.

## Corrección realizada
- El acceso de instalación continúa visible en iPhone, iPad, Android y tablets cuando Coco se abre desde el navegador.
- Si Coco se abre como PWA instalada (`standalone`), el bloque ya no desaparece: muestra **“✓ Coco ya está instalada en este dispositivo”**.
- El cierre del aviso de instalación usa una clave de sesión nueva para v157, evitando que un cierre anterior de v156 lo mantenga oculto.
- Se mantiene el tutorial iPhone/iPad (Safari) y Android (Chrome), incluyendo el prompt nativo cuando está disponible.
- Service Worker y `start_url` del manifest actualizados a v157 para forzar la actualización de instalaciones existentes.

## Sin cambios funcionales
No se han modificado juegos, Supabase, puntuaciones, clasificaciones, Zona Familiar, Coco Pádel, miniaturas sociales ni rutas de los juegos.

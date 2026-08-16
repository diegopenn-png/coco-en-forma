# Pruebas v152.0

Resultados realizados sobre el paquete final antes de comprimir:

- 16/16 archivos JavaScript externos: sintaxis válida con `node --check`.
- 20/20 scripts JavaScript inline de `index.html`: sintaxis válida.
- 21/21 recursos locales referenciados desde `index.html`: existentes y respuesta HTTP 200 en servidor local.
- 0 referencias ejecutables JS/CSS con fingerprints antiguos; 15 dependencias ejecutables de primera parte usan `?v=15200`.
- 1/1 registro de Service Worker en toda la aplicación.
- Simulación PWA: registro único, limpieza de caches antiguas, worker v152 y fetch de red `no-store`.
- `manifest.json` y `manifest.webmanifest`: JSON válido, `display=standalone`, `start_url=./?source=pwa-v152&v=15200`.
- Botón Salir: navegación local ocurre antes del `signOut`; Auth no puede inmovilizar el botón.
- Acceso diario: límite de espera de 950 ms; fallo/lentitud de Supabase no impide abrir el reto.
- Coco Corre: 120 misiones generadas/validadas (40 por nivel) sin error.
- Coco Corre: 50 barajados de carriles; todos contienen exactamente `-2,-1,0,1,2` una vez por ciclo.
- Coco Corre: geometría comprobada para 320, 390, 768 y 1366 px; los cinco centros quedan ordenados, simétricos y dentro de pantalla.
- Diferencias: 30 combinaciones escena/variante auditadas; 10 escenas x 3 variantes, sin overlays sintéticos.
- Renderer de diferencias: análisis de la biblioteca tecnológica con cambios naturales: ~3,48 % de píxeles modificados y ~0,34 % de los píxeles cambiados en rango morado, frente a la inundación de color anterior.

Limitación de laboratorio: el Chromium disponible en este entorno bloquea por política administrativa la navegación a localhost, por lo que no se afirma una prueba visual dentro de una PWA iOS real. La lógica PWA, recursos, service worker, caché y módulos sí se verificaron de forma estática y mediante simulación del ciclo del worker.

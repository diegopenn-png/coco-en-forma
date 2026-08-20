# QA — Coco en Forma v157.0

Comprobaciones realizadas sobre la distribución final:

- Bloque de instalación v157 presente una sola vez.
- Detección iPhone/iPad/Android conservada.
- En navegador móvil/tablet: estado “Instala Coco en tu dispositivo”.
- En `display-mode: standalone`: estado “Coco ya está instalada en este dispositivo”.
- El estado instalado no contiene botón de cierre ni vuelve a pedir instalación.
- Tutorial iOS y Android conservado.
- `beforeinstallprompt` y `appinstalled` conservados.
- Clave de descarte actualizada a v157.
- `manifest.webmanifest` y `manifest.json` válidos y con `start_url` v157.
- Service Worker con caché v157 y todos sus recursos de precache existentes.
- Scripts JavaScript externos e inline verificados sintácticamente.
- ZIP verificado sin errores de integridad.

No requiere SQL nuevo en Supabase.

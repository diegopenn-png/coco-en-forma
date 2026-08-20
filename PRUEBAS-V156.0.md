# Pruebas Coco en Forma v156.0

**Resultado: 52/52 comprobaciones superadas.**

## Instalación móvil/tablet
- Acceso visible independiente de la tarjeta de login.
- Detección suave de iPhone/iPad y Android.
- Tutorial con pestañas manuales iOS/Android.
- Aviso Safari para iPhone/iPad y Chrome para Android.
- Prompt nativo Android mediante `beforeinstallprompt` cuando el navegador lo ofrece.
- Ocultación automática en modo PWA/standalone.
- Safe areas y scroll interno del modal verificados en CSS.

## PWA
- `manifest.webmanifest` y `manifest.json` válidos.
- `start_url` actualizado a `?source=pwa-v156`.
- `display: standalone`, `scope: ./` y `prefer_related_applications: false`.
- Iconos 192/512 y maskable presentes y válidos.
- Service worker actualizado a `coco-en-forma-v156.0.0-r1`.
- Todos los recursos del precache existen.

## Regresión
- Todos los scripts inline y JavaScript externos compilan.
- 0 recursos HTTP con error en la distribución probada.
- Supabase, Coco Pádel y la identidad v155 permanecen byte a byte sin cambios.
- Los únicos archivos funcionales modificados respecto a v155 son `index.html`, los dos manifests y `sw.js`.


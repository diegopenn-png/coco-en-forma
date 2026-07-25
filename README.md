# Coco en Forma · App móvil

Este proyecto contiene la versión web actual de Coco en Forma dentro de `www/index.html`, preparada para convertirse en app con Capacitor 8.

## Requisitos en Mac

1. Instalar Node.js LTS.
2. Instalar Android Studio para Android.
3. Instalar Xcode desde App Store para iPhone/iPad.

## Primera instalación

Abre Terminal dentro de esta carpeta y ejecuta:

```bash
npm install
npx cap add android
npx cap add ios
npx cap sync
```

## Abrir Android

```bash
npm run android
```

## Abrir iOS

```bash
npm run ios
```

## Cuando se actualice la web

Sustituye `www/index.html` por la nueva versión y ejecuta:

```bash
npm run cap:sync
```

## Importante

Esta es la fase inicial. Antes de publicar faltan:

- icono y pantalla de inicio;
- enlaces profundos para recuperar contraseña;
- funcionamiento sin conexión;
- área parental;
- política de privacidad y eliminación de cuenta;
- pruebas en dispositivos reales;
- configuración de firma para App Store y Google Play.

# QA Coco en Forma v159.0 — Eterna Beta

## Ejecutado automáticamente en el paquete

- Sintaxis de `eterna-v159.js`.
- Sintaxis del Worker Eterna.
- Validación sintáctica de todos los scripts inline de `index.html`.
- Presencia de archivos obligatorios.
- `tutorEndpoint` de Coco Med intacto.
- `eternaEndpoint` separado.
- Service Worker v159 y precache de Eterna.
- Comparación SHA-256 byte a byte de módulos protegidos de Coco contra `RELEASE-MANIFEST-v158.0.json`.
- Detección básica de secretos privados incrustados.
- Miniatura social 1200×630 presente.

Ejecutar localmente:

```bash
node tools/qa-v159.mjs
```

## QA que requiere entorno real y credenciales

No se marca falsamente como probado en este ZIP:

- llamada real OpenAI;
- cámara física iPhone/iPad/Android;
- micrófono físico;
- TTS real;
- Stripe live/test checkout;
- webhook Stripe;
- PWA instalada desde producción;
- RLS contra la instancia real después de ejecutar SQL.

Debe ejecutarse después del despliegue siguiendo `QA-MANUAL-ETERNA-V159.md`.


## Smoke test del Worker con dependencias simuladas

Ejecutar:

```bash
node tools/worker-smoke-v159.mjs
```

Comprueba health, CORS, autenticación, respuesta fija fuera de ámbito, ruta de seguridad infantil, flujo escolar Scope → Tutor → Verify y actualización del Student Model cuando el alumno responde correctamente una pregunta de comprobación, sin utilizar credenciales reales.

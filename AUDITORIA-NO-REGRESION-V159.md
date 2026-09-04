# Auditoría de no regresión v158 → v159

Archivos v158 que permanecen byte a byte idénticos: **56**.

Archivos v158 modificados deliberadamente: `index.html, manifest.json, manifest.webmanifest, sw.js`.

Se esperaba modificar únicamente la integración (`index.html`, `sw.js`, manifests) y añadir archivos nuevos. Los módulos históricos de lógica se conservan.

## Archivos protegidos críticos comprobados

- `coco-v142-content-extension.js`
- `coco-v142-runtime.js`
- `coco-v142-unified.js`
- `coco-v144-content.js`
- `coco-v144-core.js`
- `coco-v144-professional.css`
- `coco-v147-refinements.css`
- `coco-v149-refinements.css`
- `coco-v152-padel.js`
- `coco-v152-refinements.css`
- `coco-v153-fixes.js`
- `coco-v153-release.css`
- `coco-v155-identity.js`
- `supabase-coco-v153-rollback.sql`
- `supabase-coco-v153.sql`
- `supabase-js-2.112.3.min.js`

# Eterna v159 · actualización de claves Supabase (21/08/2026)

El Worker acepta las claves modernas de Supabase:

- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Y mantiene compatibilidad temporal con las antiguas:

- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Para instalaciones nuevas de Eterna usar las claves modernas. No desactivar todavía las claves legacy del proyecto hasta verificar que el Coco existente no dependa de ellas.

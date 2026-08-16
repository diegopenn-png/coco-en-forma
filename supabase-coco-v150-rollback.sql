-- Coco en Forma v150.0 — rollback SOLO de las funciones de clasificación añadidas en v150.0.
-- No borra partidas, perfiles, rankings históricos ni datos de Coco Pádel.

begin;
drop function if exists public.clasificacion_general_coco(integer);
drop function if exists public.clasificacion_juego_coco(text, integer);
commit;

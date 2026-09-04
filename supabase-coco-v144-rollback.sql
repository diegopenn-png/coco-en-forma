-- Reversión de la única estructura nueva de v144.0.
-- ADVERTENCIA: elimina exclusivamente el historial personal del runner creado por esta migración.
-- No afecta partidas, perfiles, clasificaciones ni Coco Pádel.

begin;
drop table if exists public.coco_runner_history;
commit;


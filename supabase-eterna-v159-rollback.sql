-- COCO EN FORMA v159.0 · ETERNA Beta · ROLLBACK
-- Elimina SOLO tablas de Eterna. No toca Coco, perfiles, partidas, rankings ni Coco Med.
begin;
drop table if exists public.eterna_usage cascade;
drop table if exists public.eterna_subscriptions cascade;
drop table if exists public.eterna_parent_settings cascade;
drop table if exists public.eterna_learning_signals cascade;
drop table if exists public.eterna_attempts cascade;
drop table if exists public.eterna_interactions cascade;
drop table if exists public.eterna_sessions cascade;
drop table if exists public.eterna_student_concept_memory cascade;
drop table if exists public.eterna_mastery cascade;
drop table if exists public.eterna_concepts cascade;
drop table if exists public.eterna_curriculum_sources cascade;
drop table if exists public.eterna_student_profiles cascade;
commit;

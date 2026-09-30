-- Rollback de las estructuras del tope mensual de IA.
-- No ejecutar salvo que se desee retirar por completo esta protección.
begin;
drop function if exists public.eterna_ai_budget_status(uuid,date,numeric);
drop function if exists public.eterna_ai_budget_settle(uuid,uuid,numeric,bigint,bigint);
drop function if exists public.eterna_ai_budget_reserve(uuid,date,numeric,numeric);
drop table if exists public.eterna_ai_budget_reservations;
drop table if exists public.eterna_ai_monthly_budget;
commit;

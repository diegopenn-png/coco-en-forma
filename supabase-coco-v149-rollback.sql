-- Coco en Forma v149.0 · reversión de la migración de clasificación de Coco Corre.
-- No elimina partidas ya registradas. Restaura las restricciones anteriores desde el respaldo.

begin;

drop function if exists public.registrar_coco_corre_v149(integer);

do $$
declare
  restriccion record;
begin
  if to_regclass('public.partidas') is not null then
    for restriccion in
      select conname
      from pg_constraint
      where conrelid = 'public.partidas'::regclass
        and contype = 'c'
        and pg_get_constraintdef(oid) ilike '%juego%'
    loop
      execute format(
        'alter table public.partidas drop constraint %I',
        restriccion.conname
      );
    end loop;
  end if;
end
$$;

do $$
declare
  restriccion record;
begin
  if to_regclass('public.coco_v149_constraint_backup') is not null then
    for restriccion in
      select constraint_name, constraint_definition
      from public.coco_v149_constraint_backup
      where table_name = 'public.partidas'
      order by constraint_name
    loop
      execute format(
        'alter table public.partidas add constraint %I %s',
        restriccion.constraint_name,
        restriccion.constraint_definition
      );
    end loop;
  end if;
end
$$;

drop table if exists public.coco_v149_constraint_backup;

do $$
begin
  if to_regclass('public.coco_runner_history') is not null then
    comment on table public.coco_runner_history is
      'Resultados personales de Coco Corre. No forma parte de partidas ni de ninguna clasificación.';
  end if;
end
$$;

commit;

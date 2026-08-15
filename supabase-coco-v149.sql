-- Coco en Forma v149.0
-- Migración aditiva y reversible para registrar Coco Corre en la clasificación general.
-- No borra partidas, perfiles ni resultados históricos.
-- Ejecutar una sola vez en Supabase > SQL Editor, después de realizar una copia de seguridad.

begin;

-- Conserva la definición anterior de cualquier restricción CHECK que limite `partidas.juego`.
-- La tabla de respaldo queda fuera del acceso de anon/authenticated y se usa solo al revertir.
create table if not exists public.coco_v149_constraint_backup (
  table_name text not null,
  constraint_name text not null,
  constraint_definition text not null,
  backed_up_at timestamptz not null default now(),
  primary key (table_name, constraint_name)
);

revoke all on table public.coco_v149_constraint_backup from public, anon, authenticated;

insert into public.coco_v149_constraint_backup (
  table_name,
  constraint_name,
  constraint_definition
)
select
  'public.partidas',
  conname,
  pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.partidas'::regclass
  and contype = 'c'
  and pg_get_constraintdef(oid) ilike '%juego%'
on conflict (table_name, constraint_name) do nothing;

do $$
declare
  restriccion record;
begin
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
end
$$;

-- Mantiene también los identificadores históricos retirados para no invalidar datos antiguos.
-- NOT VALID conserva cualquier fila histórica desconocida, pero la regla se aplica a inserciones nuevas.
alter table public.partidas
  add constraint partidas_juego_valido
  check (
    juego in (
      'numeros',
      'calculo',
      'palabras',
      'series',
      'memoria',
      'sudoku',
      'sopa',
      'crucigrama',
      'tiempo',
      'verdadero',
      'diferencias',
      'cococorre',
      'cocomed',
      'futbol',
      'baloncesto',
      'padel',
      'ingles'
    )
  ) not valid;

-- Valida la restricción si todos los datos existentes pertenecen al catálogo conocido.
do $$
begin
  if not exists (
    select 1
    from public.partidas
    where juego is not null
      and juego not in (
        'numeros', 'calculo', 'palabras', 'series', 'memoria', 'sudoku',
        'sopa', 'crucigrama', 'tiempo', 'verdadero', 'diferencias',
        'cococorre', 'cocomed', 'futbol', 'baloncesto', 'padel', 'ingles'
      )
  ) then
    alter table public.partidas validate constraint partidas_juego_valido;
  end if;
end
$$;

-- Ruta segura de respaldo cuando las políticas RLS impiden la inserción directa desde la PWA.
create or replace function public.registrar_coco_corre_v149(p_puntos integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario uuid := auth.uid();
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
begin
  if v_usuario is null then
    raise exception using
      errcode = '42501',
      message = 'Es necesario iniciar sesión para guardar la partida.';
  end if;

  if p_puntos is null or p_puntos < 0 or p_puntos > 320 then
    raise exception using
      errcode = '22003',
      message = 'La puntuación de Coco Corre está fuera del intervalo permitido.';
  end if;

  if exists (
    select 1
    from public.partidas p
    where p.jugador = v_usuario
      and p.juego = 'cococorre'
      and (p.creado at time zone 'Europe/Madrid')::date = v_hoy
  ) then
    raise exception using
      errcode = '23505',
      message = 'La partida de Coco Corre ya está registrada hoy.';
  end if;

  insert into public.partidas (jugador, juego, puntos)
  values (v_usuario, 'cococorre', p_puntos);

  return jsonb_build_object('ok', true, 'juego', 'cococorre');
end
$$;

revoke all on function public.registrar_coco_corre_v149(integer) from public;
grant execute on function public.registrar_coco_corre_v149(integer) to authenticated;

comment on function public.registrar_coco_corre_v149(integer) is
  'Registra una única puntuación diaria de Coco Corre para el usuario autenticado.';

do $$
begin
  if to_regclass('public.coco_runner_history') is not null then
    comment on table public.coco_runner_history is
      'Estadísticas personales de Coco Corre. La puntuación general se registra por separado en partidas.';
  end if;
end
$$;

commit;

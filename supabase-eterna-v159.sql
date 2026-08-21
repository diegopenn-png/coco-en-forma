-- ============================================================
-- COCO EN FORMA v159.0 · ETERNA Beta
-- Migración ADITIVA. No modifica ni elimina tablas de Coco existentes.
-- Ejecutar una vez en Supabase SQL Editor.
-- ============================================================
begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.eterna_student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stage text not null check (stage in ('infantil','primaria','eso','bachillerato')),
  school_year text not null,
  autonomous_community text not null,
  preferred_language text not null default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eterna_curriculum_sources (
  id uuid primary key default gen_random_uuid(),
  jurisdiction text not null default 'ES-STATE',
  stage text not null,
  title text not null,
  official_url text not null,
  legal_reference text,
  source_version text,
  verified_at timestamptz,
  active boolean not null default true,
  unique(jurisdiction, stage, official_url)
);

create table if not exists public.eterna_concepts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.eterna_curriculum_sources(id) on delete set null,
  jurisdiction text not null default 'ES-STATE',
  autonomous_community text,
  stage text not null check (stage in ('infantil','primaria','eso','bachillerato')),
  school_year text not null,
  subject text not null,
  concept_code text not null,
  title text not null,
  summary text not null,
  prerequisites jsonb not null default '[]'::jsonb,
  verification_notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(jurisdiction, school_year, subject, concept_code)
);
create index if not exists eterna_concepts_lookup_idx on public.eterna_concepts(stage, school_year, subject, active);
create index if not exists eterna_concepts_title_trgm_idx on public.eterna_concepts using gin (title gin_trgm_ops) where active=true;

create table if not exists public.eterna_mastery (
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.eterna_concepts(id) on delete cascade,
  attempts integer not null default 0 check(attempts>=0),
  independent_successes integer not null default 0 check(independent_successes>=0),
  assisted_successes integer not null default 0 check(assisted_successes>=0),
  errors integer not null default 0 check(errors>=0),
  mastery_score numeric(5,4) not null default 0 check(mastery_score between 0 and 1),
  last_help_level integer check(last_help_level between 0 and 5),
  avg_help_level numeric(5,2),
  last_practiced_at timestamptz,
  retention_7d text check(retention_7d in ('unknown','positive','mixed','negative')) default 'unknown',
  updated_at timestamptz not null default now(),
  primary key(user_id,concept_id)
);

create table if not exists public.eterna_student_concept_memory (
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_key text not null,
  subject text,
  concept_label text not null,
  concept_id uuid references public.eterna_concepts(id) on delete set null,
  attempts integer not null default 0 check(attempts>=0),
  independent_successes integer not null default 0 check(independent_successes>=0),
  assisted_successes integer not null default 0 check(assisted_successes>=0),
  errors integer not null default 0 check(errors>=0),
  partials integer not null default 0 check(partials>=0),
  mastery_score numeric(5,4) not null default 0 check(mastery_score between 0 and 1),
  last_help_level integer check(last_help_level between 0 and 5),
  avg_help_level numeric(5,2),
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,concept_key)
);
create index if not exists eterna_student_memory_weak_idx on public.eterna_student_concept_memory(user_id,mastery_score,last_practiced_at desc);

create table if not exists public.eterna_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'homework',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  message_count integer not null default 0,
  image_count integer not null default 0,
  audio_seconds numeric(10,2) not null default 0
);
create index if not exists eterna_sessions_user_idx on public.eterna_sessions(user_id,started_at desc);

create table if not exists public.eterna_interactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.eterna_sessions(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid references public.eterna_concepts(id) on delete set null,
  input_kind text not null check(input_kind in ('text','image','audio','mixed')),
  input_sha256 text,
  scope_status text not null check(scope_status in ('school','out_of_scope','safety','unknown')),
  verification_status text not null check(verification_status in ('verified','needs_clarification','verification_conflict','blocked_out_of_scope','blocked_safety','error')),
  subject text,
  concept_label text,
  help_level integer check(help_level between 0 and 5),
  model_route text,
  created_at timestamptz not null default now()
);
create index if not exists eterna_interactions_user_idx on public.eterna_interactions(user_id,created_at desc);

create table if not exists public.eterna_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interaction_id uuid references public.eterna_interactions(id) on delete set null,
  concept_id uuid references public.eterna_concepts(id) on delete set null,
  understood boolean,
  help_level integer check(help_level between 0 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.eterna_learning_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid references public.eterna_concepts(id) on delete cascade,
  signal_type text not null,
  numeric_value numeric,
  evidence_count integer not null default 1 check(evidence_count>0),
  last_observed_at timestamptz not null default now(),
  unique(user_id,concept_id,signal_type)
);

create table if not exists public.eterna_parent_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  voice_enabled boolean not null default true,
  max_sessions_per_day integer not null default 20 check(max_sessions_per_day between 1 and 100),
  allow_image_input boolean not null default true,
  allow_audio_input boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.eterna_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'stripe' check(provider in ('stripe','paycomet','manual','none')),
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null default 'none' check(plan in ('none','trial','monthly','annual','family')),
  status text not null default 'inactive' check(status in ('inactive','trialing','active','past_due','canceled','expired')),
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
create unique index if not exists eterna_sub_provider_subscription_uq on public.eterna_subscriptions(provider,provider_subscription_id) where provider_subscription_id is not null;

create table if not exists public.eterna_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  chat_requests integer not null default 0,
  image_requests integer not null default 0,
  transcription_seconds numeric(12,2) not null default 0,
  speech_characters integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  estimated_cost_usd numeric(12,6) not null default 0,
  updated_at timestamptz not null default now(),
  primary key(user_id,usage_date)
);

-- RLS: cada cuenta ve únicamente su información pedagógica. El currículo es lectura autenticada.
alter table public.eterna_student_profiles enable row level security;
alter table public.eterna_curriculum_sources enable row level security;
alter table public.eterna_concepts enable row level security;
alter table public.eterna_mastery enable row level security;
alter table public.eterna_student_concept_memory enable row level security;
alter table public.eterna_sessions enable row level security;
alter table public.eterna_interactions enable row level security;
alter table public.eterna_attempts enable row level security;
alter table public.eterna_learning_signals enable row level security;
alter table public.eterna_parent_settings enable row level security;
alter table public.eterna_subscriptions enable row level security;
alter table public.eterna_usage enable row level security;

-- Políticas idempotentes
DO $$ DECLARE t text; BEGIN
  foreach t in array ARRAY['eterna_student_profiles','eterna_mastery','eterna_student_concept_memory','eterna_sessions','eterna_interactions','eterna_attempts','eterna_learning_signals','eterna_parent_settings','eterna_subscriptions','eterna_usage']
  loop
    execute format('drop policy if exists %I on public.%I','eterna_own_select',t);
    execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid())','eterna_own_select',t);
  end loop;
END $$;

drop policy if exists eterna_profile_insert on public.eterna_student_profiles;
create policy eterna_profile_insert on public.eterna_student_profiles for insert to authenticated with check(user_id=auth.uid());
drop policy if exists eterna_profile_update on public.eterna_student_profiles;
create policy eterna_profile_update on public.eterna_student_profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

drop policy if exists eterna_parent_insert on public.eterna_parent_settings;
create policy eterna_parent_insert on public.eterna_parent_settings for insert to authenticated with check(user_id=auth.uid());
drop policy if exists eterna_parent_update on public.eterna_parent_settings;
create policy eterna_parent_update on public.eterna_parent_settings for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Privilegios explícitos para que la política RLS no dependa de defaults del proyecto.
grant select on public.eterna_student_profiles, public.eterna_mastery, public.eterna_student_concept_memory, public.eterna_sessions,
  public.eterna_interactions, public.eterna_attempts, public.eterna_learning_signals,
  public.eterna_parent_settings, public.eterna_subscriptions, public.eterna_usage,
  public.eterna_curriculum_sources, public.eterna_concepts to authenticated;
grant insert, update on public.eterna_student_profiles, public.eterna_parent_settings to authenticated;

-- Suscripción: el cliente puede LEER su estado, pero no otorgarse acceso. Solo backend/service_role escribe.
revoke insert, update, delete on public.eterna_subscriptions from authenticated;
revoke insert, update, delete on public.eterna_usage from authenticated;
revoke insert, update, delete on public.eterna_mastery from authenticated;
revoke insert, update, delete on public.eterna_student_concept_memory from authenticated;
revoke insert, update, delete on public.eterna_interactions from authenticated;
revoke insert, update, delete on public.eterna_attempts from authenticated;
revoke insert, update, delete on public.eterna_learning_signals from authenticated;
revoke insert, update, delete on public.eterna_sessions from authenticated;

-- Currículo: lectura autenticada; escritura reservada a service_role/SQL editor.
drop policy if exists eterna_curriculum_sources_read on public.eterna_curriculum_sources;
create policy eterna_curriculum_sources_read on public.eterna_curriculum_sources for select to authenticated using(active=true);
drop policy if exists eterna_concepts_read on public.eterna_concepts;
create policy eterna_concepts_read on public.eterna_concepts for select to authenticated using(active=true);

-- Fuentes estatales oficiales de referencia. El corpus conceptual completo se carga por lotes verificados.
insert into public.eterna_curriculum_sources(jurisdiction,stage,title,official_url,legal_reference,source_version,verified_at)
values
('ES-STATE','infantil','Ordenación y enseñanzas mínimas de Educación Infantil','https://www.boe.es/buscar/act.php?id=BOE-A-2022-1654','Real Decreto 95/2022','LOMLOE',now()),
('ES-STATE','primaria','Ordenación y enseñanzas mínimas de Educación Primaria','https://www.boe.es/buscar/act.php?id=BOE-A-2022-3296','Real Decreto 157/2022','LOMLOE',now()),
('ES-STATE','eso','Ordenación y enseñanzas mínimas de ESO','https://www.boe.es/buscar/act.php?id=BOE-A-2022-4975','Real Decreto 217/2022','LOMLOE',now()),
('ES-STATE','bachillerato','Ordenación y enseñanzas mínimas de Bachillerato','https://www.boe.es/buscar/act.php?id=BOE-A-2022-5521','Real Decreto 243/2022','LOMLOE',now())
on conflict(jurisdiction,stage,official_url) do update set verified_at=excluded.verified_at, source_version=excluded.source_version;

commit;

-- IMPORTANTE: esta migración crea la arquitectura y fuentes oficiales base. No afirma haber
-- convertido todavía cada saber/criterio autonómico de las 19 administraciones en conceptos.
-- Eterna está programada para FALLAR DE FORMA SEGURA si falta soporte curricular suficiente.

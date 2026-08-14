-- ============================================================
-- Bicho Malo Taller — esquema de base de datos
--
-- Pegar entero en el SQL Editor de Supabase y ejecutar.
-- Es re-ejecutable: no rompe nada si ya se corrió antes.
--
-- Las columnas salen de los campos del formulario de ingreso.
-- "Pendientes" e "Historial" son la misma tabla: cambia `finalizado`.
-- ============================================================

create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- Mecánicos (alimenta el desplegable del formulario)
-- ------------------------------------------------------------

create table if not exists public.mecanicos (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

insert into public.mecanicos (nombre)
values ('Román Federice'), ('Gonzalo Federice'), ('Juan Mecánico')
on conflict (nombre) do nothing;

-- ------------------------------------------------------------
-- Ingresos
-- ------------------------------------------------------------

create table if not exists public.ingresos (
  id                 uuid primary key default gen_random_uuid(),

  -- Vehículo y cliente
  patente            text not null default '',
  cliente            text not null default '',
  telefono           text not null default '',
  vehiculo           text not null default '',
  kilometraje        integer,
  fecha              date not null default current_date,

  -- Problema y trabajos
  motivo             text not null default '',
  diagnostico        text not null default '',
  trabajos           text not null default '',

  -- Repuestos y costos
  repuestos_taller   numeric(12, 2),
  repuestos_cliente  boolean not null default false,
  mano_obra          numeric(12, 2),
  total_cobrado      numeric(12, 2),

  -- Cierre
  mecanico           text not null default '',
  estado             text not null default 'Pendiente',
  pendientes         text not null default '',
  observaciones      text not null default '',

  -- false = el auto sigue en el taller · true = trabajo cerrado
  finalizado         boolean not null default false,

  creado_por         uuid references auth.users (id) on delete set null,
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now(),

  constraint ingresos_estado_valido
    check (estado in ('Pendiente', 'En reparación', 'Finalizado', 'Entregado'))
);

-- Columna de búsqueda: junta todo lo que el buscador del frontend mira.
alter table public.ingresos
  add column if not exists busqueda text
  generated always as (
    coalesce(patente, '') || ' ' ||
    coalesce(cliente, '') || ' ' ||
    coalesce(vehiculo, '') || ' ' ||
    coalesce(trabajos, '') || ' ' ||
    coalesce(motivo, '') || ' ' ||
    coalesce(diagnostico, '')
  ) stored;

create index if not exists ingresos_finalizado_idx
  on public.ingresos (finalizado, creado_en desc);

create index if not exists ingresos_patente_idx
  on public.ingresos (upper(patente));

create index if not exists ingresos_busqueda_idx
  on public.ingresos using gin (busqueda gin_trgm_ops);

-- ------------------------------------------------------------
-- actualizado_en se mantiene solo
-- ------------------------------------------------------------

create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists ingresos_actualizado_en on public.ingresos;

create trigger ingresos_actualizado_en
  before update on public.ingresos
  for each row execute function public.tocar_actualizado_en();

-- ------------------------------------------------------------
-- Seguridad a nivel de fila
--
-- Un solo taller: cualquiera que esté logueado ve y edita todo.
-- Sin sesión no se ve nada.
-- ------------------------------------------------------------

alter table public.ingresos  enable row level security;
alter table public.mecanicos enable row level security;

drop policy if exists "ingresos: leer"     on public.ingresos;
drop policy if exists "ingresos: crear"    on public.ingresos;
drop policy if exists "ingresos: editar"   on public.ingresos;
drop policy if exists "ingresos: borrar"   on public.ingresos;

create policy "ingresos: leer"   on public.ingresos for select to authenticated using (true);
create policy "ingresos: crear"  on public.ingresos for insert to authenticated with check (true);
create policy "ingresos: editar" on public.ingresos for update to authenticated using (true) with check (true);
create policy "ingresos: borrar" on public.ingresos for delete to authenticated using (true);

drop policy if exists "mecanicos: leer" on public.mecanicos;

create policy "mecanicos: leer" on public.mecanicos for select to authenticated using (true);

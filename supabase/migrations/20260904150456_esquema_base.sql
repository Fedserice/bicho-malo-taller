-- ============================================================
-- Esquema base del taller
--
-- Todo el archivo es re-ejecutable (create ... if not exists,
-- drop policy if exists), así que se puede aplicar sobre una base
-- que ya tenga los datos cargados sin romper nada.
--
-- Modelo: clientes → vehículos (ficha única por patente) → visitas
-- (una fila por cada paso del auto por el taller). Un vehículo
-- guarda todo su historial en `visitas`; su estado actual es el
-- de la visita más reciente.
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
-- Clientes
-- ------------------------------------------------------------

create table if not exists public.clientes (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null default '',
  telefono   text not null default '',
  creado_en  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Vehículos (ficha única por patente)
-- ------------------------------------------------------------

create table if not exists public.vehiculos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes (id) on delete cascade,
  patente     text not null unique,
  vehiculo    text not null default '',
  creado_en   timestamptz not null default now()
);

create index if not exists vehiculos_patente_idx on public.vehiculos (upper(patente));
create index if not exists vehiculos_cliente_idx on public.vehiculos (cliente_id);

-- ------------------------------------------------------------
-- Visitas (una por cada paso del vehículo por el taller)
-- ------------------------------------------------------------

create table if not exists public.visitas (
  id                 uuid primary key default gen_random_uuid(),
  vehiculo_id        uuid not null references public.vehiculos (id) on delete cascade,

  fecha              date not null default current_date,
  kilometraje        integer,

  motivo             text not null default '',
  diagnostico        text not null default '',
  trabajos           text not null default '',

  mano_obra          numeric(12, 2),
  total_cobrado      numeric(12, 2),

  mecanico           text not null default '',
  estado             text not null default 'Pendiente',
  pendientes         text not null default '',
  observaciones      text not null default '',

  creado_por         uuid references auth.users (id) on delete set null,
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now(),

  constraint visitas_estado_valido
    check (estado in ('Pendiente', 'En reparación', 'Finalizado', 'Entregado'))
);

create index if not exists visitas_vehiculo_idx on public.visitas (vehiculo_id, creado_en desc);
create index if not exists visitas_estado_idx on public.visitas (estado);

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

drop trigger if exists visitas_actualizado_en on public.visitas;

create trigger visitas_actualizado_en
  before update on public.visitas
  for each row execute function public.tocar_actualizado_en();

-- ------------------------------------------------------------
-- Vista resumen: un vehículo por fila con los datos de su
-- última visita. Alimenta Inicio, Historial, Pendientes y Buscar.
-- ------------------------------------------------------------

create or replace view public.vehiculos_resumen as
select
  v.id,
  v.patente,
  v.vehiculo,
  c.nombre                 as cliente,
  c.telefono                as telefono,
  uv.id                     as ultima_visita_id,
  uv.fecha                  as fecha,
  uv.estado                 as estado,
  uv.motivo                 as motivo,
  uv.mecanico                as mecanico,
  uv.total_cobrado           as "totalCobrado",
  uv.creado_en                as ultimo_movimiento,
  (select count(*) from public.visitas vi where vi.vehiculo_id = v.id) as cantidad_visitas,
  (
    coalesce(v.patente, '') || ' ' ||
    coalesce(c.nombre, '') || ' ' ||
    coalesce(v.vehiculo, '') || ' ' ||
    coalesce(uv.trabajos, '') || ' ' ||
    coalesce(uv.motivo, '') || ' ' ||
    coalesce(uv.diagnostico, '')
  ) as busqueda
from public.vehiculos v
join public.clientes c on c.id = v.cliente_id
left join lateral (
  select *
  from public.visitas vi
  where vi.vehiculo_id = v.id
  order by vi.creado_en desc
  limit 1
) uv on true;

-- ------------------------------------------------------------
-- Seguridad a nivel de fila
--
-- Un solo taller: cualquiera que esté logueado ve y edita todo.
-- Sin sesión no se ve nada.
-- ------------------------------------------------------------

alter table public.clientes  enable row level security;
alter table public.vehiculos enable row level security;
alter table public.visitas   enable row level security;
alter table public.mecanicos enable row level security;

drop policy if exists "clientes: leer"   on public.clientes;
drop policy if exists "clientes: crear"  on public.clientes;
drop policy if exists "clientes: editar" on public.clientes;
drop policy if exists "clientes: borrar" on public.clientes;

create policy "clientes: leer"   on public.clientes for select to authenticated using (true);
create policy "clientes: crear"  on public.clientes for insert to authenticated with check (true);
create policy "clientes: editar" on public.clientes for update to authenticated using (true) with check (true);
create policy "clientes: borrar" on public.clientes for delete to authenticated using (true);

drop policy if exists "vehiculos: leer"   on public.vehiculos;
drop policy if exists "vehiculos: crear"  on public.vehiculos;
drop policy if exists "vehiculos: editar" on public.vehiculos;
drop policy if exists "vehiculos: borrar" on public.vehiculos;

create policy "vehiculos: leer"   on public.vehiculos for select to authenticated using (true);
create policy "vehiculos: crear"  on public.vehiculos for insert to authenticated with check (true);
create policy "vehiculos: editar" on public.vehiculos for update to authenticated using (true) with check (true);
create policy "vehiculos: borrar" on public.vehiculos for delete to authenticated using (true);

drop policy if exists "visitas: leer"   on public.visitas;
drop policy if exists "visitas: crear"  on public.visitas;
drop policy if exists "visitas: editar" on public.visitas;
drop policy if exists "visitas: borrar" on public.visitas;

create policy "visitas: leer"   on public.visitas for select to authenticated using (true);
create policy "visitas: crear"  on public.visitas for insert to authenticated with check (true);
create policy "visitas: editar" on public.visitas for update to authenticated using (true) with check (true);
create policy "visitas: borrar" on public.visitas for delete to authenticated using (true);

drop policy if exists "mecanicos: leer" on public.mecanicos;

create policy "mecanicos: leer" on public.mecanicos for select to authenticated using (true);

-- ------------------------------------------------------------
-- Migración desde v1 (tabla única `ingresos`)
--
-- Si tu base todavía tiene la tabla vieja `ingresos`, esto la
-- vuelca al modelo nuevo y la borra. Si nunca existió, no hace
-- nada. Correr una sola vez, después de crear las tablas de arriba.
-- ------------------------------------------------------------

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ingresos') then

    insert into public.clientes (nombre, telefono)
    select distinct on (upper(trim(patente))) cliente, telefono
    from public.ingresos
    where coalesce(trim(patente), '') <> ''
    order by upper(trim(patente)), creado_en desc;

    insert into public.vehiculos (cliente_id, patente, vehiculo)
    select c.id, upper(trim(i.patente)), i.vehiculo
    from (
      select distinct on (upper(trim(patente))) *
      from public.ingresos
      where coalesce(trim(patente), '') <> ''
      order by upper(trim(patente)), creado_en desc
    ) i
    join public.clientes c on c.nombre = i.cliente and c.telefono = i.telefono
    on conflict (patente) do nothing;

    insert into public.visitas (
      vehiculo_id, fecha, kilometraje, motivo, diagnostico, trabajos,
      mano_obra, total_cobrado, mecanico, estado, pendientes, observaciones,
      creado_por, creado_en
    )
    select
      vh.id, i.fecha, i.kilometraje, i.motivo, i.diagnostico, i.trabajos,
      i.mano_obra, i.total_cobrado, i.mecanico, i.estado, i.pendientes, i.observaciones,
      i.creado_por, i.creado_en
    from public.ingresos i
    join public.vehiculos vh on vh.patente = upper(trim(i.patente))
    where coalesce(trim(i.patente), '') <> '';

    drop table public.ingresos;
  end if;
end $$;

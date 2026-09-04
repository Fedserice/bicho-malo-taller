-- ============================================================
-- Flujo simplificado del taller
--
-- · Se elimina el estado "Pendiente": un ingreso nace directamente
--   "En reparación" y aparece en el tablero.
-- · Se agrega `total_trabajo`: el importe final que se le factura al
--   cliente. `saldo` (generada) = total_trabajo − total_cobrado.
--
-- Corre después del esquema base, así también normaliza lo que
-- haya traído la migración de la tabla vieja `ingresos`.
-- ============================================================

-- Total del trabajo: lo que se le cobra al cliente por la visita.
alter table public.visitas
  add column if not exists total_trabajo numeric(12, 2);

-- Saldo pendiente, calculado por la base para poder filtrarlo y ordenarlo.
alter table public.visitas
  add column if not exists saldo numeric(12, 2)
  generated always as (coalesce(total_trabajo, 0) - coalesce(total_cobrado, 0)) stored;

create index if not exists visitas_saldo_idx
  on public.visitas (saldo)
  where saldo > 0;

-- Las visitas que quedaron en "Pendiente" pasan a "En reparación":
-- el estado deja de existir en el flujo nuevo.
update public.visitas
   set estado = 'En reparación'
 where estado = 'Pendiente';

alter table public.visitas
  alter column estado set default 'En reparación';

-- El check tiene que recrearse para que deje de aceptar "Pendiente".
alter table public.visitas
  drop constraint if exists visitas_estado_valido;

alter table public.visitas
  add constraint visitas_estado_valido
  check (estado in ('En reparación', 'Finalizado', 'Entregado'));

-- La vista suma los importes nuevos para el tablero y los reportes.
-- Se recrea de cero: `create or replace` no admite renombrar ni
-- reordenar columnas, y acá cambian las dos cosas.
drop view if exists public.vehiculos_resumen;

-- `security_invoker` es importante: sin esto la vista corre con los
-- permisos de quien la creó y se saltea el RLS de las tablas de abajo,
-- así que cualquiera con la anon key podría leer clientes y patentes.
create view public.vehiculos_resumen
  with (security_invoker = on)
as
select
  v.id,
  v.patente,
  v.vehiculo,
  c.nombre                  as cliente,
  c.telefono                as telefono,
  uv.id                     as ultima_visita_id,
  uv.fecha                  as fecha,
  uv.estado                 as estado,
  uv.motivo                 as motivo,
  uv.trabajos               as trabajos,
  uv.mecanico               as mecanico,
  uv.mano_obra              as mano_obra,
  uv.total_trabajo          as total_trabajo,
  uv.total_cobrado          as total_cobrado,
  uv.saldo                  as saldo,
  uv.creado_en              as ultimo_movimiento,
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

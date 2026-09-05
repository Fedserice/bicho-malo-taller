-- ============================================================
-- Saldo pendiente en base a mano de obra
--
-- El saldo pasa a calcularse como mano_obra - total_cobrado
-- (positivo = falta cobrar). total_trabajo queda en desuso: el
-- formulario de Nuevo Ingreso ya no lo pide.
-- ============================================================

drop view if exists public.vehiculos_resumen;

alter table public.visitas drop column if exists saldo;

alter table public.visitas
  add column saldo numeric(12, 2)
  generated always as (coalesce(mano_obra, 0) - coalesce(total_cobrado, 0)) stored;

create index if not exists visitas_saldo_idx
  on public.visitas (saldo)
  where saldo > 0;

alter table public.visitas alter column total_trabajo drop not null;

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
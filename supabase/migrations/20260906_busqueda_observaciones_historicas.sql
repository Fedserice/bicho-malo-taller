-- Buscar observaciones de cualquier visita del vehículo, no solo de la última.
drop view if exists public.vehiculos_resumen;

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
  uv.observaciones          as observaciones,
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
    coalesce(uv.diagnostico, '') || ' ' ||
    coalesce((
      select string_agg(coalesce(vi.observaciones, ''), ' ')
      from public.visitas vi
      where vi.vehiculo_id = v.id
    ), '')
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
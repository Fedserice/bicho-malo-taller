alter table public.visitas
  add column if not exists fecha_entrega date;

create or replace function public.registrar_fecha_entrega()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.estado = 'Entregado' and new.fecha_entrega is null then
      new.fecha_entrega := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
    end if;
  elsif new.estado = 'Entregado' and old.estado is distinct from 'Entregado' then
    new.fecha_entrega := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  elsif new.estado <> 'Entregado' then
    new.fecha_entrega := null;
  end if;

  return new;
end;
$$;

drop trigger if exists visitas_registrar_fecha_entrega on public.visitas;

create trigger visitas_registrar_fecha_entrega
  before insert or update on public.visitas
  for each row execute function public.registrar_fecha_entrega();
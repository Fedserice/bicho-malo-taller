export const schema = `
  drop table if exists public.ingresos cascade;
  
  create extension if not exists pg_trgm;
  
  -- ...resto del SQL...
`;
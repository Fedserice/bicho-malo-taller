import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Sin credenciales la app muestra una pantalla de configuración en vez de romperse. */
export const hayConfig = Boolean(url && anonKey);

export const supabase = hayConfig
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

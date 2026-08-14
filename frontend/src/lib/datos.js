import { supabase } from "./supabase";

/**
 * Acceso a datos. El resto de la app trabaja con los nombres de campo
 * del formulario (camelCase); acá se traducen a las columnas de Postgres.
 */

const COLUMNAS = `
  id, patente, cliente, telefono, vehiculo, kilometraje, fecha,
  motivo, diagnostico, trabajos,
  repuestos_taller, repuestos_cliente, mano_obra, total_cobrado,
  mecanico, estado, pendientes, observaciones,
  finalizado, creado_en
`;

function numero(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function texto(valor) {
  return (valor ?? "").toString();
}

/** Fila de Postgres → objeto que usan los componentes. */
export function desdeFila(fila) {
  return {
    id: fila.id,
    patente: texto(fila.patente),
    cliente: texto(fila.cliente),
    telefono: texto(fila.telefono),
    vehiculo: texto(fila.vehiculo),
    kilometraje: fila.kilometraje ?? "",
    fecha: fila.fecha ?? "",
    motivo: texto(fila.motivo),
    diagnostico: texto(fila.diagnostico),
    trabajos: texto(fila.trabajos),
    repuestosTaller: fila.repuestos_taller ?? "",
    repuestosCliente: Boolean(fila.repuestos_cliente),
    manoObra: fila.mano_obra ?? "",
    totalCobrado: fila.total_cobrado ?? "",
    mecanico: texto(fila.mecanico),
    estado: texto(fila.estado),
    pendientes: texto(fila.pendientes),
    observaciones: texto(fila.observaciones),
    finalizado: Boolean(fila.finalizado),
    creadoEn: fila.creado_en,
  };
}

/** Objeto del formulario → fila de Postgres. */
function haciaFila(datos) {
  return {
    patente: texto(datos.patente).trim().toUpperCase(),
    cliente: texto(datos.cliente).trim(),
    telefono: texto(datos.telefono).trim(),
    vehiculo: texto(datos.vehiculo).trim(),
    kilometraje: numero(datos.kilometraje),
    fecha: datos.fecha || null,
    motivo: texto(datos.motivo),
    diagnostico: texto(datos.diagnostico),
    trabajos: texto(datos.trabajos),
    repuestos_taller: numero(datos.repuestosTaller),
    repuestos_cliente: Boolean(datos.repuestosCliente),
    mano_obra: numero(datos.manoObra),
    total_cobrado: numero(datos.totalCobrado),
    mecanico: texto(datos.mecanico),
    estado: texto(datos.estado) || "Pendiente",
    pendientes: texto(datos.pendientes),
    observaciones: texto(datos.observaciones),
  };
}

function reventar(error) {
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------
// Lecturas
// ------------------------------------------------------------

/** Autos que siguen en el taller (ingreso empezado y sin cerrar). */
export async function listarEnTaller() {
  const { data, error } = await supabase
    .from("ingresos")
    .select(COLUMNAS)
    .eq("finalizado", false)
    .order("creado_en", { ascending: false });

  reventar(error);
  return (data ?? []).map(desdeFila);
}

/** Trabajos cerrados, del más reciente al más viejo. */
export async function listarHistorial() {
  const { data, error } = await supabase
    .from("ingresos")
    .select(COLUMNAS)
    .eq("finalizado", true)
    .order("creado_en", { ascending: false });

  reventar(error);
  return (data ?? []).map(desdeFila);
}

/**
 * Busca en patente, cliente, vehículo, trabajos, motivo y diagnóstico.
 *
 * PostgREST usa coma y paréntesis como separadores en la query, y `%`/`_`
 * son comodines de LIKE: si el mecánico los escribe hay que neutralizarlos
 * o la búsqueda falla o devuelve cualquier cosa.
 */
export async function buscarIngresos(consulta) {
  const texto = consulta
    .trim()
    .replace(/[(),]/g, " ")
    .replace(/[%_\\]/g, "\\$&");

  if (!texto) return [];

  const { data, error } = await supabase
    .from("ingresos")
    .select(COLUMNAS)
    .ilike("busqueda", `%${texto}%`)
    .order("creado_en", { ascending: false })
    .limit(50);

  reventar(error);
  return (data ?? []).map(desdeFila);
}

/** Las tres cifras del panel de inicio. */
export async function obtenerResumen() {
  const [enTaller, cerrados] = await Promise.all([
    supabase.from("ingresos").select("id", { count: "exact", head: true }).eq("finalizado", false),
    supabase.from("ingresos").select("total_cobrado").eq("finalizado", true),
  ]);

  reventar(enTaller.error);
  reventar(cerrados.error);

  const filas = cerrados.data ?? [];

  return {
    enTaller: enTaller.count ?? 0,
    cerrados: filas.length,
    facturado: filas.reduce((total, fila) => total + (Number(fila.total_cobrado) || 0), 0),
  };
}

export async function listarMecanicos() {
  const { data, error } = await supabase
    .from("mecanicos")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre");

  reventar(error);
  return data ?? [];
}

// ------------------------------------------------------------
// Escrituras
// ------------------------------------------------------------

/**
 * Crea o actualiza un ingreso.
 * `finalizado: false` lo deja en el taller, `true` lo manda al historial.
 */
export async function guardarIngreso(datos, { finalizado }) {
  const fila = {
    ...haciaFila(datos),
    finalizado,
    ...(finalizado ? { estado: "Finalizado" } : {}),
  };

  if (datos.id) {
    const { data, error } = await supabase
      .from("ingresos")
      .update(fila)
      .eq("id", datos.id)
      .select(COLUMNAS)
      .single();

    reventar(error);
    return desdeFila(data);
  }

  const { data: sesion } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("ingresos")
    .insert({ ...fila, creado_por: sesion?.user?.id ?? null })
    .select(COLUMNAS)
    .single();

  reventar(error);
  return desdeFila(data);
}

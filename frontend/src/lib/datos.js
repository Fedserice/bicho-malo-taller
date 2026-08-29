import { supabase } from "./supabase";

/**
 * Acceso a datos v2.
 * Modelo: clientes → vehículos (ficha única) → visitas (historial).
 */

function numero(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function texto(valor) {
  return (valor ?? "").toString();
}

const REGEX_PATENTE = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

export function normalizarPatente(valor) {
  return texto(valor).trim().toUpperCase().replace(/\s+/g, "");
}

export function patenteValida(valor) {
  return REGEX_PATENTE.test(normalizarPatente(valor));
}

function reventar(error) {
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------
// Mapeos de visita (fila ↔ objeto de formulario)
// ------------------------------------------------------------

const COLUMNAS_VISITA = `
  id, vehiculo_id, fecha, kilometraje, motivo, diagnostico, trabajos,
  mano_obra, total_cobrado, mecanico, estado, pendientes, observaciones,
  creado_en, actualizado_en
`;

export function desdeFilaVisita(fila) {
  return {
    id: fila.id,
    vehiculoId: fila.vehiculo_id,
    fecha: fila.fecha ?? "",
    kilometraje: fila.kilometraje ?? "",
    motivo: texto(fila.motivo),
    diagnostico: texto(fila.diagnostico),
    trabajos: texto(fila.trabajos),
    manoObra: fila.mano_obra ?? "",
    totalCobrado: fila.total_cobrado ?? "",
    mecanico: texto(fila.mecanico),
    estado: texto(fila.estado),
    pendientes: texto(fila.pendientes),
    observaciones: texto(fila.observaciones),
    creadoEn: fila.creado_en,
  };
}

function haciaFilaVisita(datos) {
  return {
    fecha: datos.fecha || null,
    kilometraje: numero(datos.kilometraje),
    motivo: texto(datos.motivo),
    diagnostico: texto(datos.diagnostico),
    trabajos: texto(datos.trabajos),
    mano_obra: numero(datos.manoObra),
    total_cobrado: numero(datos.totalCobrado),
    mecanico: texto(datos.mecanico),
    estado: texto(datos.estado) || "En reparación",
    pendientes: texto(datos.pendientes),
    observaciones: texto(datos.observaciones),
  };
}

// ------------------------------------------------------------
// Vehículos / clientes
// ------------------------------------------------------------

/** Busca un vehículo por patente exacta, con su cliente. null si no existe. */
export async function buscarVehiculoPorPatente(patente) {
  const p = normalizarPatente(patente);
  if (!p) return null;

  const { data, error } = await supabase
    .from("vehiculos")
    .select("id, patente, vehiculo, cliente_id, clientes ( id, nombre, telefono )")
    .eq("patente", p)
    .maybeSingle();

  reventar(error);
  if (!data) return null;

  return {
    id: data.id,
    patente: data.patente,
    vehiculo: data.vehiculo,
    clienteId: data.cliente_id,
    cliente: data.clientes?.nombre ?? "",
    telefono: data.clientes?.telefono ?? "",
  };
}

/** Crea cliente + vehículo juntos (alta de un auto que nunca vino). */
export async function crearClienteYVehiculo({ patente, vehiculo, cliente, telefono }) {
  const p = normalizarPatente(patente);

  if (!patenteValida(p)) {
    throw new Error("La patente no tiene un formato válido (ej: ABC123 o AB123CD)");
  }

  const { data: clienteFila, error: errorCliente } = await supabase
    .from("clientes")
    .insert({ nombre: texto(cliente).trim(), telefono: texto(telefono).trim() })
    .select("id")
    .single();

  reventar(errorCliente);

  const { data: vehiculoFila, error: errorVehiculo } = await supabase
    .from("vehiculos")
    .insert({
      cliente_id: clienteFila.id,
      patente: p,
      vehiculo: texto(vehiculo).trim(),
    })
    .select("id, patente, vehiculo, cliente_id")
    .single();

  reventar(errorVehiculo);

  return {
    id: vehiculoFila.id,
    patente: vehiculoFila.patente,
    vehiculo: vehiculoFila.vehiculo,
    clienteId: clienteFila.id,
    cliente: texto(cliente).trim(),
    telefono: texto(telefono).trim(),
  };
}

/** Ficha completa: datos del vehículo/cliente + todas sus visitas, más nueva primero. */
export async function obtenerFichaVehiculo(vehiculoId) {
  const { data: vehiculo, error: errorVehiculo } = await supabase
    .from("vehiculos")
    .select("id, patente, vehiculo, cliente_id, clientes ( id, nombre, telefono )")
    .eq("id", vehiculoId)
    .single();

  reventar(errorVehiculo);

  const { data: visitas, error: errorVisitas } = await supabase
    .from("visitas")
    .select(COLUMNAS_VISITA)
    .eq("vehiculo_id", vehiculoId)
    .order("creado_en", { ascending: false });

  reventar(errorVisitas);

  return {
    id: vehiculo.id,
    patente: vehiculo.patente,
    vehiculo: vehiculo.vehiculo,
    clienteId: vehiculo.cliente_id,
    cliente: vehiculo.clientes?.nombre ?? "",
    telefono: vehiculo.clientes?.telefono ?? "",
    visitas: (visitas ?? []).map(desdeFilaVisita),
  };
}

/** Todos los vehículos (para Historial), como una historia clínica: uno por fila. */
export async function listarVehiculos() {
  const { data, error } = await supabase
    .from("vehiculos_resumen")
    .select("*")
    .order("ultima_fecha", { ascending: false, nullsFirst: false });

  reventar(error);
  return data ?? [];
}

/** Vehículos con una visita activa (no entregada) — pantalla "En el taller". */
export async function listarEnTaller() {
  const { data, error } = await supabase
    .from("vehiculos_resumen")
    .select("*")
    .neq("ultimo_estado", "Entregado")
    .not("ultimo_estado", "is", null)
    .order("ultima_fecha", { ascending: false });

  reventar(error);
  return data ?? [];
}

/** Busca vehículos por patente, cliente o marca/modelo. */
export async function buscarVehiculos(consulta) {
  const texto = consulta.trim().replace(/[(),]/g, " ").replace(/[%_\\]/g, "\\$&");
  if (!texto) return [];

  const { data, error } = await supabase
    .from("vehiculos_resumen")
    .select("*")
    .or(`patente.ilike.%${texto}%,cliente.ilike.%${texto}%,vehiculo.ilike.%${texto}%`)
    .order("ultima_fecha", { ascending: false })
    .limit(50);

  reventar(error);
  return data ?? [];
}

// ------------------------------------------------------------
// Visitas
// ------------------------------------------------------------

/** Crea una visita nueva sobre un vehículo existente. */
export async function crearVisita(vehiculoId, datos) {
  const { data: sesion } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("visitas")
    .insert({
      ...haciaFilaVisita(datos),
      vehiculo_id: vehiculoId,
      creado_por: sesion?.user?.id ?? null,
    })
    .select(COLUMNAS_VISITA)
    .single();

  reventar(error);
  return desdeFilaVisita(data);
}

/** Actualiza una visita existente (cambiar estado, cerrar, editar datos). */
export async function actualizarVisita(visitaId, datos) {
  const { data, error } = await supabase
    .from("visitas")
    .update(haciaFilaVisita(datos))
    .eq("id", visitaId)
    .select(COLUMNAS_VISITA)
    .single();

  reventar(error);
  return desdeFilaVisita(data);
}

// ------------------------------------------------------------
// Resumen del dashboard
// ------------------------------------------------------------

export async function obtenerResumen() {
  const [enTaller, entregadas] = await Promise.all([
    supabase
      .from("vehiculos_resumen")
      .select("id", { count: "exact", head: true })
      .neq("ultimo_estado", "Entregado")
      .not("ultimo_estado", "is", null),
    supabase.from("visitas").select("total_cobrado").eq("estado", "Entregado"),
  ]);

  reventar(enTaller.error);
  reventar(entregadas.error);

  const filas = entregadas.data ?? [];

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

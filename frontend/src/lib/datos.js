import { supabase } from "./supabase";

/**
 * Acceso a datos.
 * Modelo: clientes → vehículos (ficha única) → visitas (historial).
 * `vehiculos_resumen` es una vista de solo lectura: un vehículo por
 * fila con los datos de su última visita. Alimenta Inicio, Historial,
 * Pendientes, Buscar y el Kanban.
 */

const ESTADOS = ["Pendiente", "En reparación", "Finalizado", "Entregado"];

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
// Mapeos (fila de la base ↔ objeto que usan los componentes)
// ------------------------------------------------------------

const COLUMNAS_VISITA = `
  id, vehiculo_id, fecha, kilometraje, motivo, diagnostico, trabajos,
  mano_obra, total_cobrado, mecanico, estado, pendientes, observaciones,
  creado_en, actualizado_en
`;

function desdeFilaVisita(fila) {
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
    estado: texto(datos.estado) || "Pendiente",
    pendientes: texto(datos.pendientes),
    observaciones: texto(datos.observaciones),
  };
}

/** Fila de `vehiculos_resumen` → objeto plano que usan Historial/Pendientes/Buscar/Kanban. */
function desdeFilaResumen(fila) {
  return {
    id: fila.id,
    vehiculoId: fila.id,
    ultimaVisitaId: fila.ultima_visita_id,
    patente: texto(fila.patente),
    vehiculo: texto(fila.vehiculo),
    cliente: texto(fila.cliente),
    telefono: texto(fila.telefono),
    fecha: fila.fecha ?? "",
    estado: texto(fila.estado),
    motivo: texto(fila.motivo),
    mecanico: texto(fila.mecanico),
    totalCobrado: fila.totalCobrado ?? "",
    cantidadVisitas: fila.cantidad_visitas ?? 0,
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

/** Actualiza los datos de vehículo y cliente (patente, modelo, nombre, teléfono). */
async function actualizarVehiculoYCliente(vehiculoId, clienteId, { patente, vehiculo, cliente, telefono }) {
  const p = normalizarPatente(patente);

  if (!patenteValida(p)) {
    throw new Error("La patente no tiene un formato válido (ej: ABC123 o AB123CD)");
  }

  const { error: errorVehiculo } = await supabase
    .from("vehiculos")
    .update({ patente: p, vehiculo: texto(vehiculo).trim() })
    .eq("id", vehiculoId);

  reventar(errorVehiculo);

  const { error: errorCliente } = await supabase
    .from("clientes")
    .update({ nombre: texto(cliente).trim(), telefono: texto(telefono).trim() })
    .eq("id", clienteId);

  reventar(errorCliente);
}

/** Datos del vehículo y su cliente, sin las visitas. */
async function obtenerVehiculoConCliente(vehiculoId) {
  const { data: vehiculo, error } = await supabase
    .from("vehiculos")
    .select("id, patente, vehiculo, cliente_id, clientes ( id, nombre, telefono )")
    .eq("id", vehiculoId)
    .single();

  reventar(error);

  return {
    id: vehiculo.id,
    patente: vehiculo.patente,
    vehiculo: vehiculo.vehiculo,
    clienteId: vehiculo.cliente_id,
    cliente: vehiculo.clientes?.nombre ?? "",
    telefono: vehiculo.clientes?.telefono ?? "",
  };
}

/** Ficha completa: datos del vehículo/cliente + todas sus visitas, más nueva primero. */
export async function obtenerFichaVehiculo(vehiculoId) {
  const [vehiculo, { data: visitas, error: errorVisitas }] = await Promise.all([
    obtenerVehiculoConCliente(vehiculoId),
    supabase
      .from("visitas")
      .select(COLUMNAS_VISITA)
      .eq("vehiculo_id", vehiculoId)
      .order("creado_en", { ascending: false }),
  ]);

  reventar(errorVisitas);

  return {
    ...vehiculo,
    visitas: (visitas ?? []).map(desdeFilaVisita),
  };
}

/**
 * Trae una visita puntual lista para cargar en el formulario de edición,
 * con los datos del vehículo y el cliente incluidos.
 */
export async function obtenerVisitaParaEditar(vehiculoId, visitaId) {
  const [vehiculo, { data: visitaFila, error: errorVisita }] = await Promise.all([
    obtenerVehiculoConCliente(vehiculoId),
    supabase.from("visitas").select(COLUMNAS_VISITA).eq("id", visitaId).single(),
  ]);

  reventar(errorVisita);
  const visita = desdeFilaVisita(visitaFila);

  return {
    ...visita,
    vehiculoId: vehiculo.id,
    clienteId: vehiculo.clienteId,
    patente: vehiculo.patente,
    vehiculo: vehiculo.vehiculo,
    cliente: vehiculo.cliente,
    telefono: vehiculo.telefono,
  };
}

/** Todos los vehículos (para Historial), uno por fila con su última visita. */
export async function listarVehiculos() {
  const { data, error } = await supabase
    .from("vehiculos_resumen")
    .select("*")
    .order("ultimo_movimiento", { ascending: false, nullsFirst: false });

  reventar(error);
  return (data ?? []).map(desdeFilaResumen);
}

/** Vehículos con una visita activa (no entregada) — pantalla "En el taller" y Kanban. */
export async function listarEnTaller() {
  const { data, error } = await supabase
    .from("vehiculos_resumen")
    .select("*")
    .neq("estado", "Entregado")
    .not("estado", "is", null)
    .order("ultimo_movimiento", { ascending: false });

  reventar(error);
  return (data ?? []).map(desdeFilaResumen);
}

/** Vehículos cuya última visita quedó entregada — pantalla "Historial". */
export async function listarHistorial() {
  const { data, error } = await supabase
    .from("vehiculos_resumen")
    .select("*")
    .eq("estado", "Entregado")
    .order("ultimo_movimiento", { ascending: false });

  reventar(error);
  return (data ?? []).map(desdeFilaResumen);
}

/** Busca vehículos por patente, cliente, vehículo o lo hecho al auto. */
export async function buscarVehiculos(consulta) {
  const t = consulta.trim().replace(/[(),]/g, " ").replace(/[%_\\]/g, "\\$&");
  if (!t) return [];

  const { data, error } = await supabase
    .from("vehiculos_resumen")
    .select("*")
    .ilike("busqueda", `%${t}%`)
    .order("ultimo_movimiento", { ascending: false })
    .limit(50);

  reventar(error);
  return (data ?? []).map(desdeFilaResumen);
}

/** Alias para compatibilidad con el componente Buscar.jsx */
export async function buscarIngresos(consulta) {
  return await buscarVehiculos(consulta);
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

/** Cambia solo el estado de una visita (usado por el Kanban). */
export async function cambiarEstadoVisita(visitaId, estado) {
  if (!ESTADOS.includes(estado)) {
    throw new Error("Estado inválido");
  }

  const { data, error } = await supabase
    .from("visitas")
    .update({ estado })
    .eq("id", visitaId)
    .select(COLUMNAS_VISITA)
    .single();

  reventar(error);
  return desdeFilaVisita(data);
}

/**
 * Guarda un ingreso desde el formulario. Si `datos.id` está presente,
 * actualiza esa visita (y los datos del vehículo/cliente si cambiaron).
 * Si no, busca o crea el vehículo y arma una visita nueva.
 */
export async function guardarIngreso(datos, opciones = {}) {
  const datosVisita = {
    ...datos,
    estado: opciones.finalizado ? "Entregado" : datos.estado || "Pendiente",
  };

  if (datos.id) {
    if (datos.vehiculoId) {
      await actualizarVehiculoYCliente(datos.vehiculoId, datos.clienteId, {
        patente: datos.patente,
        vehiculo: datos.vehiculo,
        cliente: datos.cliente,
        telefono: datos.telefono,
      });
    }
    return await actualizarVisita(datos.id, datosVisita);
  }

  let vehiculoExistente = await buscarVehiculoPorPatente(datos.patente);

  if (!vehiculoExistente) {
    vehiculoExistente = await crearClienteYVehiculo({
      patente: datos.patente,
      vehiculo: datos.vehiculo,
      cliente: datos.cliente,
      telefono: datos.telefono,
    });
  }

  return await crearVisita(vehiculoExistente.id, datosVisita);
}

// ------------------------------------------------------------
// Resumen del dashboard
// ------------------------------------------------------------

export async function obtenerResumen() {
  const [enTaller, entregadas] = await Promise.all([
    supabase
      .from("vehiculos_resumen")
      .select("id", { count: "exact", head: true })
      .neq("estado", "Entregado")
      .not("estado", "is", null),
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

// ------------------------------------------------------------
// Reportes
// ------------------------------------------------------------

function claveMes(fechaTexto) {
  if (!fechaTexto) return null;
  return fechaTexto.slice(0, 7); // "YYYY-MM"
}

function nombreMes(clave) {
  const [anio, mes] = clave.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, 1);
  const texto = fecha.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
  return texto.charAt(0).toUpperCase() + texto.slice(1).replace(".", "");
}

/**
 * Arma los datos de la pantalla de Reportes a partir de las visitas
 * entregadas: facturación de los últimos 6 meses y desempeño por
 * mecánico. Todo se calcula en el cliente para no depender de
 * funciones extra en la base.
 */
export async function obtenerReportes() {
  const { data, error } = await supabase
    .from("visitas")
    .select("fecha, mano_obra, total_cobrado, mecanico, estado")
    .eq("estado", "Entregado");

  reventar(error);
  const visitas = data ?? [];

  // Facturación por mes, últimos 6 meses con datos.
  const porMes = new Map();
  for (const v of visitas) {
    const clave = claveMes(v.fecha);
    if (!clave) continue;
    porMes.set(clave, (porMes.get(clave) ?? 0) + (Number(v.total_cobrado) || 0));
  }
  const meses = [...porMes.keys()].sort().slice(-6);
  const facturacionMensual = meses.map((clave) => ({
    clave,
    mes: nombreMes(clave),
    total: porMes.get(clave) ?? 0,
  }));

  // Desempeño por mecánico.
  const porMecanico = new Map();
  for (const v of visitas) {
    const nombre = texto(v.mecanico).trim() || "Sin asignar";
    const actual = porMecanico.get(nombre) ?? { nombre, trabajos: 0, facturado: 0 };
    actual.trabajos += 1;
    actual.facturado += Number(v.total_cobrado) || 0;
    porMecanico.set(nombre, actual);
  }
  const porMecanicoLista = [...porMecanico.values()].sort((a, b) => b.facturado - a.facturado);

  const totalFacturado = visitas.reduce((acc, v) => acc + (Number(v.total_cobrado) || 0), 0);
  const totalManoObra = visitas.reduce((acc, v) => acc + (Number(v.mano_obra) || 0), 0);

  return {
    totalFacturado,
    totalManoObra,
    trabajosEntregados: visitas.length,
    facturacionMensual,
    porMecanico: porMecanicoLista,
  };
}

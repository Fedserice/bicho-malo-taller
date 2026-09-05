import { supabase } from "./supabase";

/**
 * Acceso a datos.
 * Modelo: clientes → vehículos (ficha única) → visitas (historial).
 * `vehiculos_resumen` es una vista de solo lectura: un vehículo por
 * fila con los datos de su última visita. Alimenta el Panel (tablero
 * y buscador) y el Historial.
 */

const ESTADOS = ["En reparación", "Finalizado", "Entregado"];

// Reparto de la mano de obra. Los nombres visibles se mantienen
// canónicos aunque en datos viejos aparezcan sin acento o abreviados.
const NOMBRES_MECANICOS = {
  roman: "Román Federice",
  juan: "Juan Mecánico",
  gonzalo: "Gonzalo Federice",
};

function numero(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function texto(valor) {
  return (valor ?? "").toString();
}

// Saca mayúsculas y acentos para comparar nombres de mecánico sin
// depender de cómo estén tipeados ("Román" === "roman" === "ROMAN").
function normalizarNombre(valor) {
  return texto(valor)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
  mano_obra, total_trabajo, total_cobrado, saldo, mecanico, estado,
  pendientes, observaciones, creado_en, actualizado_en
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
    totalTrabajo: fila.total_trabajo ?? "", // en desuso, se conserva por compatibilidad
    totalCobrado: fila.total_cobrado ?? "",
    saldo: Number(fila.saldo) || 0, // positivo = falta cobrar (mano_obra - total_cobrado)
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
    // total_trabajo ya no se toca desde el formulario: si se manda
    // siempre null, se pisan datos viejos en cada edición. Se deja
    // la columna intacta hasta que decidan borrarla del todo.
    mecanico: texto(datos.mecanico),
    estado: texto(datos.estado) || "En reparación",
    pendientes: texto(datos.pendientes),
    observaciones: texto(datos.observaciones),
  };
}

/** Fila de `vehiculos_resumen` → objeto plano que usan el tablero, el buscador y el Historial. */
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
    trabajos: texto(fila.trabajos),
    mecanico: texto(fila.mecanico),
    manoObra: fila.mano_obra ?? "",
    totalTrabajo: fila.total_trabajo ?? "",
    totalCobrado: fila.total_cobrado ?? "",
    saldo: Number(fila.saldo) || 0,
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

/** Vehículos que siguen en el taller (En reparación o Finalizado) — alimenta el tablero. */
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
 * Actualiza solo lo cobrado de una visita ya entregada — pensado para
 * corregir el saldo pendiente desde Historial o Reportes sin tener
 * que reabrir toda la ficha.
 */
export async function actualizarCobroVisita(visitaId, totalCobrado) {
  const { data, error } = await supabase
    .from("visitas")
    .update({ total_cobrado: numero(totalCobrado) })
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
  // El estado no se elige a mano: un ingreso nuevo nace "En reparación"
  // y solo se mueve con las acciones del flujo. "Finalizar" deja el auto
  // en el taller; recién "Entregado" lo saca del tablero.
  const datosVisita = {
    ...datos,
    estado: opciones.finalizado ? "Finalizado" : datos.estado || "En reparación",
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

/**
 * "En taller" es una foto del presente y no se reinicia nunca.
 * "Entregados" y "facturado" sí se reinician cada mes: acá se logra
 * simplemente mirando solo las visitas entregadas desde el día 1 del
 * mes actual. No hace falta mover ni borrar filas — el historial
 * completo sigue disponible en Reportes, mes por mes.
 */
export async function obtenerResumen() {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [enTaller, entregadasDelMes] = await Promise.all([
    supabase
      .from("vehiculos_resumen")
      .select("id", { count: "exact", head: true })
      .neq("estado", "Entregado")
      .not("estado", "is", null),
    supabase
      .from("visitas")
      .select("total_cobrado")
      .eq("estado", "Entregado")
      .gte("fecha", inicioMes),
  ]);

  reventar(enTaller.error);
  reventar(entregadasDelMes.error);

  const filas = entregadasDelMes.data ?? [];

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
    .in("nombre", Object.values(NOMBRES_MECANICOS))
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
  const t = fecha.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
  return t.charAt(0).toUpperCase() + t.slice(1).replace(".", "");
}

/**
 * Trabajos con plata sin cobrar. `saldo` ya viene calculado por la
 * base como (mano_obra - total_cobrado): positivo = falta cobrar.
 */
export async function obtenerSaldosPendientes() {
  const { data, error } = await supabase
    .from("visitas")
    .select(
      "id, fecha, estado, mano_obra, total_cobrado, saldo, vehiculos ( id, patente, vehiculo, clientes ( nombre, telefono ) )"
    )
    .gt("saldo", 0)
    .order("saldo", { ascending: false });

  reventar(error);

  const trabajos = (data ?? []).map((fila) => ({
    id: fila.id,
    vehiculoId: fila.vehiculos?.id ?? null,
    patente: texto(fila.vehiculos?.patente),
    vehiculo: texto(fila.vehiculos?.vehiculo),
    cliente: texto(fila.vehiculos?.clientes?.nombre) || "Sin cliente",
    telefono: texto(fila.vehiculos?.clientes?.telefono),
    fecha: fila.fecha ?? "",
    estado: texto(fila.estado),
    manoObra: Number(fila.mano_obra) || 0,
    cobrado: Number(fila.total_cobrado) || 0,
    saldo: Number(fila.saldo) || 0,
  }));

  // Un mismo cliente puede deber por varios trabajos: se agrupa para
  // que quede claro de un vistazo quién debe y cuánto.
  const porDeudor = new Map();
  for (const t of trabajos) {
    const actual = porDeudor.get(t.cliente) ?? {
      cliente: t.cliente,
      telefono: t.telefono,
      trabajos: 0,
      saldo: 0,
    };
    actual.trabajos += 1;
    actual.saldo += t.saldo;
    if (!actual.telefono) actual.telefono = t.telefono;
    porDeudor.set(t.cliente, actual);
  }

  return {
    trabajos,
    deudores: [...porDeudor.values()].sort((a, b) => b.saldo - a.saldo),
    totalSaldos: trabajos.reduce((acc, t) => acc + t.saldo, 0),
  };
}

/**
 * Calcula dos lecturas del reparto:
 * - `porMecanico`: lo que cobra cada mecánico por sus propios trabajos.
 * - `ingresosTotalMecanicos`: lo que queda para el conjunto del taller:
 *   100% de Gonzalo + 70% de Román + 70% de Juan.
 * La base de cálculo es `mano_obra`, no `total_cobrado`.
 */
function calcularFacturacionPorMecanico(visitas) {
  const porMecanico = new Map();
  const ingresosTotalMecanicos = new Map();

  function sumar(mapa, nombre, monto, cuentaComoTrabajo) {
    const actual = mapa.get(nombre) ?? { nombre, trabajos: 0, facturado: 0 };
    actual.facturado += monto;
    if (cuentaComoTrabajo) actual.trabajos += 1;
    mapa.set(nombre, actual);
  }

  for (const v of visitas) {
    const nombreOriginal = texto(v.mecanico).trim() || "Sin asignar";
    const clave = normalizarNombre(nombreOriginal);
    const manoObra = Number(v.mano_obra) || 0;

    if (clave.includes("roman") || clave.includes("román")) {
      sumar(porMecanico, NOMBRES_MECANICOS.roman, manoObra * 0.3, true);
      sumar(ingresosTotalMecanicos, NOMBRES_MECANICOS.roman, manoObra * 0.7, true);
    } else if (clave.includes("juan")) {
      sumar(porMecanico, NOMBRES_MECANICOS.juan, manoObra * 0.3, true);
      sumar(ingresosTotalMecanicos, NOMBRES_MECANICOS.juan, manoObra * 0.7, true);
    } else if (clave.includes("gonzalo")) {
      sumar(porMecanico, NOMBRES_MECANICOS.gonzalo, manoObra, true);
      sumar(ingresosTotalMecanicos, NOMBRES_MECANICOS.gonzalo, manoObra, true);
    } else {
      sumar(porMecanico, nombreOriginal, manoObra, true);
    }
  }

  return {
    porMecanico: [...porMecanico.values()]
      .map((mecanico) => ({
        ...mecanico,
        porcentaje:
          normalizarNombre(mecanico.nombre).includes("roman") ||
          normalizarNombre(mecanico.nombre).includes("juan")
            ? 30
            : 100,
      }))
      .sort((a, b) => b.facturado - a.facturado),
    ingresosTotalMecanicos: [...ingresosTotalMecanicos.values()]
      .map((mecanico) => ({
        ...mecanico,
        porcentaje: normalizarNombre(mecanico.nombre).includes("roman") ||
          normalizarNombre(mecanico.nombre).includes("juan")
          ? 70
          : 100,
      }))
      .sort((a, b) => b.facturado - a.facturado),
  };
}

/**
 * Datos completos de Reportes: facturación mensual (todos los meses
 * con datos, no solo los últimos), reparto por mecánico y saldos
 * pendientes. `facturacionMensual` es lo que alimenta el apartado
 * "mes por mes" — cada entrada se puede abrir con
 * `listarVisitasDelMes(clave)`.
 */
export async function obtenerReportes() {
  const [{ data, error }, saldos] = await Promise.all([
    supabase
      .from("visitas")
      .select("fecha, mano_obra, total_cobrado, mecanico, estado")
      .eq("estado", "Entregado"),
    obtenerSaldosPendientes(),
  ]);

  reventar(error);
  const visitas = data ?? [];

  // Facturación por mes — todos los meses con datos, más reciente primero.
  const porMes = new Map();
  for (const v of visitas) {
    const clave = claveMes(v.fecha);
    if (!clave) continue;
    porMes.set(clave, (porMes.get(clave) ?? 0) + (Number(v.total_cobrado) || 0));
  }
  const facturacionMensual = [...porMes.keys()]
    .sort()
    .reverse()
    .map((clave) => ({
      clave,
      mes: nombreMes(clave),
      total: porMes.get(clave) ?? 0,
    }));

  const { porMecanico, ingresosTotalMecanicos } = calcularFacturacionPorMecanico(visitas);
  const totalIngresosMecanicos = ingresosTotalMecanicos.reduce(
    (acc, mecanico) => acc + mecanico.facturado,
    0
  );

  const totalFacturado = visitas.reduce((acc, v) => acc + (Number(v.total_cobrado) || 0), 0);
  const totalManoObra = visitas.reduce((acc, v) => acc + (Number(v.mano_obra) || 0), 0);

  return {
    totalFacturado,
    totalManoObra,
    trabajosEntregados: visitas.length,
    facturacionMensual,
    porMecanico,
    ingresosTotalMecanicos,
    totalIngresosMecanicos,
    saldos,
  };
}

/** Detalle de trabajos entregados en un mes puntual ("2026-09"). Alimenta el drill-down de Reportes. */
export async function listarVisitasDelMes(claveMes) {
  const [anio, mes] = claveMes.split("-").map(Number);
  const inicio = `${claveMes}-01`;
  const fin = new Date(anio, mes, 1).toISOString().slice(0, 10); // primer día del mes siguiente

  const { data, error } = await supabase
    .from("visitas")
    .select(
      "id, fecha, mano_obra, total_cobrado, saldo, mecanico, trabajos, vehiculos ( id, patente, vehiculo, clientes ( nombre ) )"
    )
    .eq("estado", "Entregado")
    .gte("fecha", inicio)
    .lt("fecha", fin)
    .order("fecha", { ascending: false });

  reventar(error);

  return (data ?? []).map((fila) => ({
    id: fila.id,
    vehiculoId: fila.vehiculos?.id ?? null,
    fecha: fila.fecha ?? "",
    manoObra: Number(fila.mano_obra) || 0,
    totalCobrado: Number(fila.total_cobrado) || 0,
    saldo: Number(fila.saldo) || 0,
    mecanico: texto(fila.mecanico),
    trabajos: texto(fila.trabajos),
    patente: texto(fila.vehiculos?.patente),
    vehiculo: texto(fila.vehiculos?.vehiculo),
    cliente: texto(fila.vehiculos?.clientes?.nombre),
  }));
}
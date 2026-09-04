import { useCallback, useRef, useState } from "react";
import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import { useToast } from "../ui/useToast";
import { guardarIngreso, listarMecanicos } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import "./NuevoIngreso.css";

const ESTADO_INICIAL = {
  patente: "",
  cliente: "",
  telefono: "",
  vehiculo: "",
  kilometraje: "",
  fecha: new Date().toISOString().split("T")[0],
  motivo: "",
  diagnostico: "",
  trabajos: "",
  manoObra: "",
  totalTrabajo: "",
  totalCobrado: "",
  mecanico: "",
  estado: "En reparación",
  pendientes: "",
  observaciones: "",
};

// Lo mínimo para identificar el auto y al dueño. Todo lo demás
// (kilometraje, diagnóstico, importes, mecánico) se completa después,
// mientras el vehículo está en el tablero.
const OBLIGATORIOS = [
  ["patente", "Patente"],
  ["cliente", "Cliente"],
  ["telefono", "Teléfono"],
  ["vehiculo", "Vehículo"],
  ["fecha", "Fecha"],
];

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function NuevoIngreso({ onVolver, ingreso }) {
  // `ingreso` puede ser una visita completa (editar) o solo los datos
  // del vehículo (trabajo nuevo sobre una ficha que ya existe).
  const [datos, setDatos] = useState({ ...ESTADO_INICIAL, ...(ingreso || {}) });
  const [faltantes, setFaltantes] = useState([]);
  const [guardando, setGuardando] = useState(null);
  const [ingresoPrevio, setIngresoPrevio] = useState(ingreso);
  const formRef = useRef(null);
  const avisar = useToast();

  const consultaMecanicos = useCallback(() => listarMecanicos(), []);
  const { datos: mecanicos } = useConsulta(consultaMecanicos, []);

  // Si cambia el ingreso que se está editando, el formulario se rearma.
  if (ingreso !== ingresoPrevio) {
    setIngresoPrevio(ingreso);
    setDatos({ ...ESTADO_INICIAL, ...(ingreso || {}) });
    setFaltantes([]);
  }

  const esEdicion = Boolean(datos.id);
  // Ficha existente a la que se le abre un trabajo nuevo: ya trae
  // vehículo y cliente cargados, pero todavía no es una visita.
  const esNuevoTrabajo = !datos.id && Boolean(datos.vehiculoId);
  const puedeFinalizar = esEdicion && datos.estado === "En reparación";

  // El mecánico guardado se mantiene aunque ya no esté en la lista activa.
  const nombresMecanicos = (mecanicos ?? []).map((m) => m.nombre);
  const opcionesMecanicos =
    datos.mecanico && !nombresMecanicos.includes(datos.mecanico)
      ? [...nombresMecanicos, datos.mecanico]
      : nombresMecanicos;

  function cambiarDato(e) {
    const { name, value, type, checked } = e.target;

    setDatos((previos) => ({
      ...previos,
      [name]: type === "checkbox" ? checked : value,
    }));

    // El aviso de campo faltante se levanta apenas se empieza a completar
    if (faltantes.includes(name)) {
      setFaltantes((previos) => previos.filter((campo) => campo !== name));
    }
  }

  function buscarFaltantes() {
    return OBLIGATORIOS.filter(([campo]) => {
      const valor = datos[campo];
      return valor === undefined || valor === null || valor.toString().trim() === "";
    });
  }

  /** Marca los campos que faltan y avisa. Devuelve si se puede guardar. */
  function validar() {
    const pendientes = buscarFaltantes();
    if (pendientes.length === 0) return true;

    const claves = pendientes.map(([campo]) => campo);
    setFaltantes(claves);

    avisar(
      pendientes.length === 1
        ? `Falta completar: ${pendientes[0][1]}`
        : `Faltan ${pendientes.length} campos por completar`,
      "error"
    );

    const primero = formRef.current?.elements[claves[0]];
    primero?.focus();
    primero?.scrollIntoView({ block: "center", behavior: "smooth" });
    return false;
  }

  // Acción principal. Un ingreso nuevo entra al tablero como
  // "En reparación"; editando uno existente se conserva su estado.
  async function guardar(e) {
    e?.preventDefault();
    if (!validar()) return;

    setGuardando("guardar");

    try {
      await guardarIngreso(datos, {});
      avisar(
        esEdicion ? "Cambios guardados" : "Ingreso registrado. El vehículo ya está en el tablero.",
        "ok"
      );
      onVolver();
    } catch (error) {
      avisar(error.message || "No se pudo guardar el ingreso", "error");
      setGuardando(null);
    }
  }

  // Finalizar no es entregar: el auto sigue en el taller hasta que
  // alguien lo pase a "Entregado" desde el tablero.
  async function finalizarTrabajo() {
    if (!validar()) return;

    setGuardando("finalizar");

    try {
      await guardarIngreso(datos, { finalizado: true });
      avisar("Trabajo finalizado. El vehículo sigue en el taller hasta que se entregue.", "ok");
      onVolver();
    } catch (error) {
      avisar(error.message || "No se pudo finalizar el trabajo", "error");
      setGuardando(null);
    }
  }

  const totalTrabajoNum = Number(datos.totalTrabajo) || 0;
  const saldo = totalTrabajoNum - (Number(datos.totalCobrado) || 0);

  const claseCampo = (campo) => `campo ${faltantes.includes(campo) ? "campo--error" : ""}`.trim();

  return (
    <div className="ingreso">
      {/* La chapa se arma sola mientras se escribe la patente */}
      <header className="ingreso__head">
        <Patente valor={datos.patente} tamano="lg" />

        <div className="ingreso__head-texto">
          <span className="eyebrow">
            {esEdicion ? "En el taller" : esNuevoTrabajo ? "Ficha existente" : "Alta de vehículo"}
          </span>
          <h1>{esEdicion ? "Editar trabajo" : esNuevoTrabajo ? "Nuevo trabajo" : "Nuevo ingreso"}</h1>
          <p>{datos.vehiculo?.trim() || "Cargá los datos del vehículo. El resto se completa después."}</p>
        </div>
      </header>

      <form onSubmit={guardar} className="ingreso__form" ref={formRef} noValidate>
        {/* 01 — VEHÍCULO Y CLIENTE */}
        <section className="seccion">
          <div className="seccion__head">
            <span className="seccion__num">01</span>
            <h2>Vehículo y cliente</h2>
          </div>

          <div className="rejilla-2">
            <div className={claseCampo("patente")}>
              <label htmlFor="patente">
                Patente <span className="campo__req">*</span>
              </label>
              <input
                id="patente"
                name="patente"
                placeholder="AA123CD"
                value={datos.patente}
                onChange={cambiarDato}
                autoCapitalize="characters"
                spellCheck="false"
              />
            </div>

            <div className={claseCampo("cliente")}>
              <label htmlFor="cliente">
                Cliente <span className="campo__req">*</span>
              </label>
              <input
                id="cliente"
                name="cliente"
                placeholder="Nombre y apellido"
                value={datos.cliente}
                onChange={cambiarDato}
              />
            </div>

            <div className={claseCampo("telefono")}>
              <label htmlFor="telefono">
                Teléfono <span className="campo__req">*</span>
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                inputMode="tel"
                placeholder="266 412 3456"
                value={datos.telefono}
                onChange={cambiarDato}
              />
            </div>

            <div className={claseCampo("vehiculo")}>
              <label htmlFor="vehiculo">
                Vehículo <span className="campo__req">*</span>
              </label>
              <input
                id="vehiculo"
                name="vehiculo"
                placeholder="Marca, modelo y versión"
                value={datos.vehiculo}
                onChange={cambiarDato}
              />
            </div>

            <div className={claseCampo("kilometraje")}>
              <label htmlFor="kilometraje">
                Kilometraje
              </label>
              <input
                id="kilometraje"
                name="kilometraje"
                type="number"
                inputMode="numeric"
                placeholder="120000"
                value={datos.kilometraje}
                onChange={cambiarDato}
              />
            </div>

            <div className={claseCampo("fecha")}>
              <label htmlFor="fecha">
                Fecha de ingreso <span className="campo__req">*</span>
              </label>
              <input
                id="fecha"
                name="fecha"
                type="date"
                value={datos.fecha}
                onChange={cambiarDato}
              />
            </div>
          </div>
        </section>

        {/* 02 — PROBLEMA Y TRABAJOS */}
        <section className="seccion">
          <div className="seccion__head">
            <span className="seccion__num">02</span>
            <h2>Problema y trabajos</h2>
          </div>

          <div className="rejilla-1">
            <div className={claseCampo("motivo")}>
              <label htmlFor="motivo">
                Motivo del ingreso
              </label>
              <textarea
                id="motivo"
                name="motivo"
                rows="2"
                placeholder="Qué dijo el cliente que le pasa al auto"
                value={datos.motivo}
                onChange={cambiarDato}
              />
            </div>

            <div className={claseCampo("diagnostico")}>
              <label htmlFor="diagnostico">
                Diagnóstico
              </label>
              <textarea
                id="diagnostico"
                name="diagnostico"
                rows="2"
                placeholder="Qué se encontró al revisarlo"
                value={datos.diagnostico}
                onChange={cambiarDato}
              />
            </div>

            <div className={claseCampo("trabajos")}>
              <label htmlFor="trabajos">
                Trabajos realizados
              </label>
              <textarea
                id="trabajos"
                name="trabajos"
                rows="3"
                placeholder="Detalle de lo que se hizo"
                value={datos.trabajos}
                onChange={cambiarDato}
              />
            </div>
          </div>
        </section>

        {/* 03 — COSTOS */}
        <section className="seccion">
          <div className="seccion__head">
            <span className="seccion__num">03</span>
            <h2>Costos</h2>
          </div>

          <div className="rejilla-2">
            <div className={claseCampo("manoObra")}>
              <label htmlFor="manoObra">Mano de obra</label>
              <input
                id="manoObra"
                name="manoObra"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={datos.manoObra}
                onChange={cambiarDato}
              />
            </div>

            <div className={claseCampo("totalTrabajo")}>
              <label htmlFor="totalTrabajo">Total del trabajo</label>
              <input
                id="totalTrabajo"
                name="totalTrabajo"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={datos.totalTrabajo}
                onChange={cambiarDato}
              />
            </div>

            {/* El total cobrado va aparte: es la plata que entró */}
            <div className={`${claseCampo("totalCobrado")} ancho-2 total`}>
              <label htmlFor="totalCobrado">Total cobrado</label>
              <div className="total__campo">
                <span className="total__signo" aria-hidden="true">
                  $
                </span>
                <input
                  id="totalCobrado"
                  name="totalCobrado"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={datos.totalCobrado}
                  onChange={cambiarDato}
                />
              </div>

              {/* El saldo se muestra en vivo: es lo que va a Reportes */}
              {saldo > 0 && (
                <span className="total__ayuda total__ayuda--deuda num">
                  Saldo pendiente: {pesos.format(saldo)}
                </span>
              )}
              {saldo <= 0 && totalTrabajoNum > 0 && (
                <span className="total__ayuda total__ayuda--saldado">Trabajo saldado</span>
              )}
            </div>
          </div>
        </section>

        {/* 04 — CIERRE */}
        <section className="seccion">
          <div className="seccion__head">
            <span className="seccion__num">04</span>
            <h2>Cierre del trabajo</h2>
          </div>

          <div className="rejilla-2">
            <div className={claseCampo("mecanico")}>
              <label htmlFor="mecanico">
                Mecánico a cargo
              </label>
              <select id="mecanico" name="mecanico" value={datos.mecanico} onChange={cambiarDato}>
                <option value="">Elegir mecánico</option>
                {opcionesMecanicos.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${claseCampo("pendientes")} ancho-2`}>
              <label htmlFor="pendientes">
                Trabajos pendientes
              </label>
              <textarea
                id="pendientes"
                name="pendientes"
                rows="2"
                placeholder="Qué queda por hacer. Si no queda nada, escribí “ninguno”."
                value={datos.pendientes}
                onChange={cambiarDato}
              />
            </div>

            <div className={`${claseCampo("observaciones")} ancho-2`}>
              <label htmlFor="observaciones">
                Observaciones
              </label>
              <textarea
                id="observaciones"
                name="observaciones"
                rows="2"
                placeholder="Notas para el próximo ingreso"
                value={datos.observaciones}
                onChange={cambiarDato}
              />
            </div>
          </div>
        </section>

        {/* Barra de acciones: acompaña al scroll */}
        <div className="acciones">
          <p className="acciones__nota">
            <Icon name="alerta" size={15} />
            {esEdicion
              ? "Podés seguir editando esta ficha mientras el auto esté en el taller."
              : "El vehículo entra al tablero como “En reparación”."}
          </p>

          <div className="acciones__botones">
            {puedeFinalizar && (
              <button
                type="button"
                className="btn btn--outline"
                onClick={finalizarTrabajo}
                disabled={guardando !== null}
              >
                {guardando === "finalizar" ? (
                  <span className="spinner spinner--boton" aria-hidden="true" />
                ) : (
                  <Icon name="tilde" size={18} />
                )}
                Finalizar trabajo
              </button>
            )}

            <button type="submit" className="btn btn--solid" disabled={guardando !== null}>
              {guardando === "guardar" ? (
                <span className="spinner spinner--boton" aria-hidden="true" />
              ) : (
                <Icon name="guardar" size={18} />
              )}
              {esEdicion ? "Guardar cambios" : "Registrar ingreso"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default NuevoIngreso;
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
  repuestosTaller: "",
  repuestosCliente: false,
  manoObra: "",
  totalCobrado: "",
  mecanico: "",
  estado: "Pendiente",
  pendientes: "",
  observaciones: "",
};

const OBLIGATORIOS = [
  ["patente", "Patente"],
  ["cliente", "Cliente"],
  ["telefono", "Teléfono"],
  ["vehiculo", "Vehículo"],
  ["kilometraje", "Kilometraje"],
  ["fecha", "Fecha"],
  ["motivo", "Motivo"],
  ["diagnostico", "Diagnóstico"],
  ["trabajos", "Trabajos realizados"],
  ["repuestosTaller", "Repuestos del taller"],
  ["manoObra", "Mano de obra"],
  ["totalCobrado", "Total cobrado"],
  ["mecanico", "Mecánico"],
  ["estado", "Estado"],
  ["pendientes", "Pendientes"],
  ["observaciones", "Observaciones"],
];

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function NuevoIngreso({ onVolver, ingreso }) {
  const [datos, setDatos] = useState(ingreso || ESTADO_INICIAL);
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
    setDatos(ingreso || ESTADO_INICIAL);
    setFaltantes([]);
  }

  const esEdicion = Boolean(datos.id);

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

  async function guardarEnTaller() {
    if (!(datos.patente || "").trim() && !(datos.cliente || "").trim()) {
      setFaltantes(["patente", "cliente"]);
      avisar("Cargá al menos la patente o el cliente para guardar", "error");
      formRef.current?.elements.patente?.focus();
      return;
    }

    setGuardando("taller");

    try {
      await guardarIngreso(datos, { finalizado: false });
      avisar("Ingreso guardado en el taller", "ok");
      onVolver();
    } catch (error) {
      avisar(error.message || "No se pudo guardar el ingreso", "error");
      setGuardando(null);
    }
  }

  async function finalizarIngreso(e) {
    e.preventDefault();

    const pendientes = buscarFaltantes();

    if (pendientes.length > 0) {
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
      return;
    }

    setGuardando("finalizar");

    try {
      await guardarIngreso(datos, { finalizado: true });
      avisar("Ingreso finalizado y guardado en el historial", "ok");
      onVolver();
    } catch (error) {
      avisar(error.message || "No se pudo finalizar el ingreso", "error");
      setGuardando(null);
    }
  }

  const claseCampo = (campo) => `campo ${faltantes.includes(campo) ? "campo--error" : ""}`.trim();

  const sumaCostos = (Number(datos.repuestosTaller) || 0) + (Number(datos.manoObra) || 0);

  return (
    <div className="ingreso">
      {/* La chapa se arma sola mientras se escribe la patente */}
      <header className="ingreso__head">
        <Patente valor={datos.patente} tamano="lg" />

        <div className="ingreso__head-texto">
          <span className="eyebrow">{esEdicion ? "Ingreso empezado" : "Alta de vehículo"}</span>
          <h1>{esEdicion ? "Continuar ingreso" : "Nuevo ingreso"}</h1>
          <p>{datos.vehiculo?.trim() || "Cargá los datos del vehículo y del trabajo realizado."}</p>
        </div>
      </header>

      <form onSubmit={finalizarIngreso} className="ingreso__form" ref={formRef} noValidate>
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
                placeholder="11 1234 5678"
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
                Kilometraje <span className="campo__req">*</span>
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
                Motivo del ingreso <span className="campo__req">*</span>
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
                Diagnóstico <span className="campo__req">*</span>
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
                Trabajos realizados <span className="campo__req">*</span>
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

        {/* 03 — REPUESTOS Y COSTOS */}
        <section className="seccion">
          <div className="seccion__head">
            <span className="seccion__num">03</span>
            <h2>Repuestos y costos</h2>
          </div>

          <div className="rejilla-2">
            <div className={claseCampo("repuestosTaller")}>
              <label htmlFor="repuestosTaller">
                Repuestos del taller <span className="campo__req">*</span>
              </label>
              <input
                id="repuestosTaller"
                name="repuestosTaller"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={datos.repuestosTaller}
                onChange={cambiarDato}
              />
            </div>

            <div className={claseCampo("manoObra")}>
              <label htmlFor="manoObra">
                Mano de obra <span className="campo__req">*</span>
              </label>
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

            <div className="ancho-2">
              <label className="check">
                <input
                  name="repuestosCliente"
                  type="checkbox"
                  checked={datos.repuestosCliente}
                  onChange={cambiarDato}
                />
                <span>Los repuestos los puso el cliente</span>
              </label>
            </div>

            {/* El total va aparte: es el número que se cobra */}
            <div className={`${claseCampo("totalCobrado")} ancho-2 total`}>
              <label htmlFor="totalCobrado">
                Total cobrado <span className="campo__req">*</span>
              </label>
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
              {sumaCostos > 0 && (
                <span className="total__ayuda num">
                  Repuestos + mano de obra: {pesos.format(sumaCostos)}
                </span>
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
                Mecánico a cargo <span className="campo__req">*</span>
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

            <div className={claseCampo("estado")}>
              <label htmlFor="estado">
                Estado <span className="campo__req">*</span>
              </label>
              <select id="estado" name="estado" value={datos.estado} onChange={cambiarDato}>
                <option>Pendiente</option>
                <option>En reparación</option>
                <option>Finalizado</option>
                <option>Entregado</option>
              </select>
            </div>

            <div className={`${claseCampo("pendientes")} ancho-2`}>
              <label htmlFor="pendientes">
                Trabajos pendientes <span className="campo__req">*</span>
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
                Observaciones <span className="campo__req">*</span>
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
            Guardar deja el auto en el taller. Finalizar lo manda al historial.
          </p>

          <div className="acciones__botones">
            <button
              type="button"
              className="btn btn--outline"
              onClick={guardarEnTaller}
              disabled={guardando !== null}
            >
              {guardando === "taller" ? (
                <span className="spinner spinner--boton" aria-hidden="true" />
              ) : (
                <Icon name="guardar" size={18} />
              )}
              Guardar
            </button>

            <button type="submit" className="btn btn--solid" disabled={guardando !== null}>
              {guardando === "finalizar" ? (
                <span className="spinner spinner--boton" aria-hidden="true" />
              ) : (
                <Icon name="tilde" size={18} />
              )}
              Finalizar ingreso
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default NuevoIngreso;

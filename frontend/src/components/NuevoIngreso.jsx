import { useState, useEffect } from "react";
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

function NuevoIngreso({ onVolver, borrador }) {
  const [datos, setDatos] = useState(borrador || ESTADO_INICIAL);

  // Sincronizar si cambia la prop borrador
  useEffect(() => {
    setDatos(borrador || ESTADO_INICIAL);
  }, [borrador]);

  function cambiarDato(e) {
    const { name, value, type, checked } = e.target;

    setDatos({
      ...datos,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  function validarCampos() {
    // Excluimos repuestosCliente de la validación
    const camposObligatorios = [
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

    for (const [campo, nombre] of camposObligatorios) {
      const valor = datos[campo];
      if (valor === undefined || valor === null || valor.toString().trim() === "") {
        alert(`Falta completar: ${nombre}`);
        return false;
      }
    }

    return true;
  }

  function guardarBorrador() {
    if (!datos.patente.trim() && !datos.cliente.trim()) {
      alert("Ingresa al menos la patente o el cliente para guardar un borrador.");
      return;
    }

    const borradores = JSON.parse(
      localStorage.getItem("borradores") || "[]"
    );

    const nuevoBorrador = {
      id: borrador?.id || Date.now(),
      ...datos,
    };

    const actualizados = borrador
      ? borradores.map((b) => (b.id === borrador.id ? nuevoBorrador : b))
      : [...borradores, nuevoBorrador];

    localStorage.setItem("borradores", JSON.stringify(actualizados));

    alert("Borrador guardado correctamente");
    onVolver();
  }

  function finalizarIngreso(e) {
    e.preventDefault();

    if (!validarCampos()) return;

    const ingresos = JSON.parse(
      localStorage.getItem("ingresos") || "[]"
    );

    ingresos.push({
      id: Date.now(),
      ...datos,
      estado: "Finalizado",
    });

    localStorage.setItem("ingresos", JSON.stringify(ingresos));

    if (borrador) {
      const borradores = JSON.parse(
        localStorage.getItem("borradores") || "[]"
      );

      const actualizados = borradores.filter((b) => b.id !== borrador.id);

      localStorage.setItem("borradores", JSON.stringify(actualizados));
    }

    alert("Ingreso finalizado correctamente");
    onVolver();
  }

  return (
    <div className="ingreso-container">
      {/* CABECERA CON BOTÓN DE VOLVER */}
      <header className="ingreso-header">
        <h1>🚗 {borrador ? "Continuar ingreso" : "Nuevo ingreso"}</h1>
        
      </header>

      <form onSubmit={finalizarIngreso} className="ingreso-form">
        {/* BLOQUE 1: DATOS DEL VEHÍCULO Y CLIENTE */}
        <div className="card-seccion">
          <h2>🚗 Datos del vehículo y cliente</h2>
          <div className="grid-form-2">
            <div className="field-group">
              <label>Patente *</label>
              <input
                name="patente"
                placeholder="Ej: AA123CD"
                value={datos.patente}
                onChange={cambiarDato}
              />
            </div>

            <div className="field-group">
              <label>Cliente *</label>
              <input
                name="cliente"
                placeholder="Nombre y apellido"
                value={datos.cliente}
                onChange={cambiarDato}
              />
            </div>

            <div className="field-group">
              <label>Teléfono *</label>
              <input
                name="telefono"
                placeholder="Ej: 11 1234 5678"
                value={datos.telefono}
                onChange={cambiarDato}
              />
            </div>

            <div className="field-group">
              <label>Vehículo *</label>
              <input
                name="vehiculo"
                placeholder="Marca, modelo, versión"
                value={datos.vehiculo}
                onChange={cambiarDato}
              />
            </div>

            <div className="field-group">
              <label>Kilometraje *</label>
              <input
                name="kilometraje"
                type="number"
                placeholder="Ej: 120000"
                value={datos.kilometraje}
                onChange={cambiarDato}
              />
            </div>

            <div className="field-group">
              <label>Fecha de ingreso *</label>
              <input
                name="fecha"
                type="date"
                value={datos.fecha}
                onChange={cambiarDato}
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 2: PROBLEMA Y TRABAJOS */}
        <div className="card-seccion">
          <h2>🔧 Problema y Trabajos</h2>
          <div className="grid-form-1">
            <div className="field-group">
              <label>Motivo del ingreso *</label>
              <textarea
                name="motivo"
                rows="2"
                placeholder="Detalla el motivo *"
                value={datos.motivo}
                onChange={cambiarDato}
              />
            </div>

            <div className="field-group">
              <label>Diagnóstico *</label>
              <textarea
                name="diagnostico"
                rows="2"
                placeholder="Diagnóstico inicial *"
                value={datos.diagnostico}
                onChange={cambiarDato}
              />
            </div>

            <div className="field-group">
              <label>Trabajos realizados *</label>
              <textarea
                name="trabajos"
                rows="3"
                placeholder="Detalle de trabajos realizados *"
                value={datos.trabajos}
                onChange={cambiarDato}
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 3: REPUESTOS Y COSTOS */}
        <div className="card-seccion">
          <h2>💰 Repuestos y Costos</h2>
          <div className="grid-form-2">
            <div className="field-group">
              <label>Repuestos del taller ($) *</label>
              <input
                name="repuestosTaller"
                type="number"
                placeholder="0"
                value={datos.repuestosTaller}
                onChange={cambiarDato}
              />
            </div>

            <div className="field-group">
              <label>Mano de obra ($) *</label>
              <input
                name="manoObra"
                type="number"
                placeholder="0"
                value={datos.manoObra}
                onChange={cambiarDato}
              />
            </div>

            <div className="field-group col-span-2">
              <label>Total cobrado ($) *</label>
              <input
                name="totalCobrado"
                type="number"
                className="input-destacado"
                placeholder="0"
                value={datos.totalCobrado}
                onChange={cambiarDato}
              />
            </div>

            <div className="checkbox-container col-span-2">
              <input
                id="repuestosCliente"
                name="repuestosCliente"
                type="checkbox"
                checked={datos.repuestosCliente}
                onChange={cambiarDato}
              />
              <label htmlFor="repuestosCliente">
                Repuestos aportados por el cliente
              </label>
            </div>
          </div>
        </div>

        {/* BLOQUE 4: MECÁNICO, ESTADO Y NOTAS */}
        <div className="card-seccion">
          <h2>👨‍🔧 Mecánico y Estado</h2>
          <div className="grid-form-2">
            <div className="field-group">
              <label>Mecánico a cargo *</label>
              <select
                name="mecanico"
                value={datos.mecanico}
                onChange={cambiarDato}
              >
                <option value="">Seleccionar mecánico *</option>
                <option value="Román Federice">Román Federice</option>
                <option value="Gonzalo Federice">Gonzalo Federice</option>
                <option value="Juan Mecánico">Juan Mecánico</option>
              </select>
            </div>

            <div className="field-group">
              <label>Estado *</label>
              <select
                name="estado"
                value={datos.estado}
                onChange={cambiarDato}
              >
                <option>Pendiente</option>
                <option>En reparación</option>
                <option>Finalizado</option>
                <option>Entregado</option>
              </select>
            </div>

            <div className="field-group col-span-2">
              <label>Trabajos pendientes *</label>
              <textarea
                name="pendientes"
                rows="2"
                placeholder="Trabajos pendientes *"
                value={datos.pendientes}
                onChange={cambiarDato}
              />
            </div>

            <div className="field-group col-span-2">
              <label>Observaciones *</label>
              <textarea
                name="observaciones"
                rows="2"
                placeholder="Observaciones *"
                value={datos.observaciones}
                onChange={cambiarDato}
              />
            </div>
          </div>
        </div>

        {/* BARRA DE ACCIONES */}
        <div className="acciones-bar">
          <button type="button" className="btn btn-borrador" onClick={guardarBorrador}>
            💾 Guardar borrador
          </button>

          <button type="submit" className="btn btn-finalizar">
            ✅ Finalizar ingreso
          </button>
        </div>
      </form>
    </div>
  );
}

export default NuevoIngreso;
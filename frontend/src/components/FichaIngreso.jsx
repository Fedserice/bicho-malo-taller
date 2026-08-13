function FichaIngreso({ ingreso, onVolver }) {
  return (
    <div>
      <h1>🚗 Ficha del vehículo</h1>

      <h2>
        {ingreso.patente} — {ingreso.vehiculo}
      </h2>

      <hr />

      <h3>👤 Cliente</h3>
      <p><strong>Nombre:</strong> {ingreso.cliente}</p>
      <p><strong>Teléfono:</strong> {ingreso.telefono || "—"}</p>

      <h3>🚗 Vehículo</h3>
      <p><strong>Vehículo:</strong> {ingreso.vehiculo}</p>
      <p><strong>Patente:</strong> {ingreso.patente}</p>
      <p><strong>Kilometraje:</strong> {ingreso.kilometraje || "—"} km</p>
      <p><strong>Fecha de ingreso:</strong> {ingreso.fecha}</p>

      <h3>🔧 Trabajo</h3>
      <p><strong>Motivo:</strong> {ingreso.motivo || "—"}</p>
      <p><strong>Diagnóstico:</strong> {ingreso.diagnostico || "—"}</p>
      <p><strong>Trabajos realizados:</strong> {ingreso.trabajos || "—"}</p>

      <h3>📦 Repuestos</h3>
      <p>
        <strong>Repuestos del taller:</strong>{" "}
        ${ingreso.repuestosTaller || 0}
      </p>

      <p>
        <strong>Repuestos aportados por cliente:</strong>{" "}
        {ingreso.repuestosCliente ? "Sí" : "No"}
      </p>

      <h3>💰 Costos</h3>
      <p>
        <strong>Mano de obra:</strong> ${ingreso.manoObra || 0}
      </p>

      <p>
        <strong>Total cobrado:</strong> ${ingreso.totalCobrado || 0}
      </p>

      <h3>📊 Estado</h3>
      <p>{ingreso.estado}</p>

      <h3>📋 Pendientes</h3>
      <p>{ingreso.pendientes || "Ninguno"}</p>

      <h3>📝 Observaciones</h3>
      <p>{ingreso.observaciones || "—"}</p>

      <br />

      <button onClick={onVolver}>
        ← Volver
      </button>
    </div>
  );
}

export default FichaIngreso;
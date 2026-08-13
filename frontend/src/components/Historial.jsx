function Historial({ onSeleccionar }) {
  const ingresos = JSON.parse(
    localStorage.getItem("ingresos") || "[]"
  );

  return (
    <div>
      <h1>📋 Historial</h1>

      {ingresos.length === 0 && (
        <p>No hay ingresos finalizados.</p>
      )}

      {ingresos.map((ingreso) => (
        <div
          key={ingreso.id}
          onClick={() => onSeleccionar(ingreso)}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "10px",
            cursor: "pointer",
          }}
        >
          <h2>
            {ingreso.patente} — {ingreso.vehiculo}
          </h2>

          <p>👤 Cliente: {ingreso.cliente}</p>
          <p>📅 Fecha: {ingreso.fecha}</p>
          <p>🔧 {ingreso.motivo}</p>
          <p>🛠️ {ingreso.trabajos}</p>
          <p>📊 {ingreso.estado}</p>

          <strong>👉 Tocar para ver ficha completa</strong>
        </div>
      ))}
    </div>
  );
}

export default Historial;
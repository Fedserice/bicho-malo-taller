import "./Pendientes.css"
function Pendientes({ onVolver, onAbrir }) {
  const borradores = JSON.parse(
    localStorage.getItem("borradores") || "[]"
  );

  return (
    <div>
      <h1>🚗 Vehículos pendientes</h1>

      {borradores.length === 0 && (
        <p>No hay vehículos pendientes.</p>
      )}

      {borradores.map((borrador) => (
        <div key={borrador.id}>
          <hr />

          <h2>{borrador.patente || "Sin patente"}</h2>

          <p>
            Cliente: {borrador.cliente || "Sin cliente"}
          </p>

          <p>
            Vehículo: {borrador.vehiculo || "Sin vehículo"}
          </p>

          <p>Estado: 🟡 Pendiente</p>

          <button onClick={() => onAbrir(borrador)}>
            ✏️ Continuar ingreso
          </button>
        </div>
      ))}

      <br />
    </div>
  );
}

export default Pendientes;
import { useState } from "react";
import "./Buscar.css";

function Buscar() {
  const [busqueda, setBusqueda] = useState("");

  const ingresos = JSON.parse(
    localStorage.getItem("ingresos") || "[]"
  );

  const resultados = ingresos.filter((ingreso) => {
    const texto = busqueda.toLowerCase();

    return (
      ingreso.patente?.toLowerCase().includes(texto) ||
      ingreso.cliente?.toLowerCase().includes(texto) ||
      ingreso.vehiculo?.toLowerCase().includes(texto) ||
      ingreso.trabajos?.toLowerCase().includes(texto) ||
      ingreso.motivo?.toLowerCase().includes(texto) ||
      ingreso.diagnostico?.toLowerCase().includes(texto)
    );
  });

  // Función auxiliar para color de etiquetas de estado
  const getEstadoClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case "finalizado":
      case "entregado":
        return "badge-verde";
      case "en reparación":
        return "badge-azul";
      case "pendiente":
        return "badge-naranja";
      default:
        return "badge-gris";
    }
  };

  return (
    <div className="buscar-container">
      {/* CABECERA */}
      <header className="buscar-header">
        <h1>🔎 Buscar vehículo o cliente</h1>
        <p>Filtrá por patente, nombre del cliente, vehículo o detalle del trabajo</p>
      </header>

      {/* CAMPO DE BÚSQUEDA */}
      <div className="search-box-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="input-buscar"
          placeholder="Ej: AA123CD, Juan Pérez, Gol, Cambio de aceite..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          autoFocus
        />
        {busqueda && (
          <button 
            className="btn-limpiar" 
            onClick={() => setBusqueda("")}
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {/* MENSAJE DE RESULTADOS */}
      {busqueda && resultados.length === 0 && (
        <div className="no-resultados">
          <span>🚫</span>
          <p>No se encontraron vehículos o trabajos con: <strong>"{busqueda}"</strong></p>
        </div>
      )}

      {!busqueda && (
        <div className="buscar-placeholder-info">
          Escribí una patente, cliente o trabajo arriba para comenzar la búsqueda.
        </div>
      )}

      {/* LISTA DE RESULTADOS */}
      <div className="resultados-list">
        {resultados.map((ingreso) => (
          <div key={ingreso.id} className="card-resultado">
            <div className="card-header-res">
              <div className="patente-vehiculo">
                <span className="patente-badge">{ingreso.patente || "SIN PATENTE"}</span>
                <h2>{ingreso.vehiculo}</h2>
              </div>
              <span className={`estado-badge ${getEstadoClass(ingreso.estado)}`}>
                {ingreso.estado}
              </span>
            </div>

            <div className="card-body-res">
              <div className="info-item">
                <span className="info-label">👤 Cliente</span>
                <span className="info-val">{ingreso.cliente || "-"}</span>
              </div>

              <div className="info-item">
                <span className="info-label">📅 Fecha</span>
                <span className="info-val">{ingreso.fecha || "-"}</span>
              </div>

              <div className="info-item full-width">
                <span className="info-label">🔧 Motivo del ingreso</span>
                <p className="info-text">{ingreso.motivo || "-"}</p>
              </div>

              <div className="info-item full-width">
                <span className="info-label">🛠️ Trabajos realizados</span>
                <p className="info-text">{ingreso.trabajos || "-"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Buscar;
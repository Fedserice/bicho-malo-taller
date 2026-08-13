import "./Inicio.css";

function Inicio({ onNuevoIngreso, onBuscar, onHistorial, onPendientes }) {
  return (
    <div className="inicio-container">
      {/* CABECERA CON MARCA */}
      <header className="inicio-header">
        <div className="logo-badge"></div>
        <h1>Bicho Malo Taller</h1>
        <p>Sistema de gestión del taller</p>
      </header>

      {/* MENÚ PRINCIPAL DE TARJETAS */}
      <div className="menu-grid">
        <button className="card-btn card-nuevo" onClick={onNuevoIngreso}>
          <span className="card-icon">➕</span>
          <div className="card-info">
            <h3>Nuevo ingreso</h3>
            <p>Cargar un vehículo o trabajo</p>
          </div>
        </button>

        <button className="card-btn card-buscar" onClick={onBuscar}>
          <span className="card-icon">🔎</span>
          <div className="card-info">
            <h3>Buscar</h3>
            <p>Buscar por patente o cliente</p>
          </div>
        </button>

        <button className="card-btn card-historial" onClick={onHistorial}>
          <span className="card-icon">📋</span>
          <div className="card-info">
            <h3>Historial</h3>
            <p>Registro de trabajos terminados</p>
          </div>
        </button>

        <button className="card-btn card-pendientes" onClick={onPendientes}>
          <span className="card-icon">🚗</span>
          <div className="card-info">
            <h3>Vehículos pendientes</h3>
            <p>Autos actualmente en el taller</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default Inicio;
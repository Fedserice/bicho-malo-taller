import { useState } from "react";
import Login from "./components/Login";
import Inicio from "./components/Inicio";
import NuevoIngreso from "./components/NuevoIngreso";
import Pendientes from "./components/Pendientes";
import Buscar from "./components/Buscar";
import Historial from "./components/Historial";
import FichaIngreso from "./components/FichaIngreso";
import "./App.css";

function App() {
  const [logueado, setLogueado] = useState(false);
  const [pantalla, setPantalla] = useState("inicio");
  const [borradorSeleccionado, setBorradorSeleccionado] = useState(null);
  const [ingresoSeleccionado, setIngresoSeleccionado] = useState(null);

  if (!logueado) {
    return <Login onLogin={() => setLogueado(true)} />;
  }

  return (
    <div className="app-main-container">
      {/* BARRA SUPERIOR (Muestra el botón "Volver" ARRIBA si no estás en Inicio) */}
      {pantalla !== "inicio" && (
        <header className="top-navbar">
          <button
            className="btn-volver-top"
            onClick={() => setPantalla("inicio")}
          >
            ⬅️ Volver al Inicio
          </button>
          <span className="navbar-brand">Bicho Malo Taller</span>
        </header>
      )}

      {/* PANTALLAS DEL SISTEMA */}
      <main className="app-content">
        {pantalla === "inicio" && (
          <Inicio
            onNuevoIngreso={() => {
              setBorradorSeleccionado(null);
              setPantalla("nuevo");
            }}
            onBuscar={() => setPantalla("buscar")}
            onHistorial={() => setPantalla("historial")}
            onPendientes={() => setPantalla("pendientes")}
          />
        )}

        {pantalla === "nuevo" && (
          <NuevoIngreso
            borrador={borradorSeleccionado}
            onVolver={() => setPantalla("inicio")}
          />
        )}

        {pantalla === "buscar" && (
          <Buscar onVolver={() => setPantalla("inicio")} />
        )}

        {pantalla === "historial" && (
          <Historial
            onVolver={() => setPantalla("inicio")}
            onSeleccionar={(ingreso) => {
              setIngresoSeleccionado(ingreso);
              setPantalla("ficha");
            }}
          />
        )}

        {pantalla === "ficha" && ingresoSeleccionado && (
          <FichaIngreso
            ingreso={ingresoSeleccionado}
            onVolver={() => setPantalla("historial")}
          />
        )}

        {pantalla === "pendientes" && (
          <Pendientes
            onVolver={() => setPantalla("inicio")}
            onAbrir={(borrador) => {
              setBorradorSeleccionado(borrador);
              setPantalla("nuevo");
            }}
          />
        )}
      </main>

      {/* BARRA INFERIOR (Solo para Cerrar Sesión) */}
      <footer className="barra-inferior">
        <button
          className="btn-logout"
          onClick={() => {
            setLogueado(false);
            setPantalla("inicio");
          }}
        >
          🚪 Cerrar sesión
        </button>
      </footer>
    </div>
  );
}

export default App;
import { useState } from "react";
import Login from "./components/Login";
import Inicio from "./components/Inicio";
import NuevoIngreso from "./components/NuevoIngreso";
import Pendientes from "./components/Pendientes";
import Buscar from "./components/Buscar";
import Historial from "./components/Historial";
import FichaIngreso from "./components/FichaIngreso";
import Icon from "./ui/Icon";
import { useToast } from "./ui/useToast";
import "./App.css";

// Cada pantalla declara cómo se llama y a dónde vuelve.
const PANTALLAS = {
  inicio: { titulo: "Inicio", vuelveA: null },
  nuevo: { titulo: "Nuevo ingreso", vuelveA: "inicio" },
  buscar: { titulo: "Buscar", vuelveA: "inicio" },
  historial: { titulo: "Historial", vuelveA: "inicio" },
  ficha: { titulo: "Ficha del vehículo", vuelveA: "historial" },
  pendientes: { titulo: "En el taller", vuelveA: "inicio" },
};

function App() {
  const [logueado, setLogueado] = useState(false);
  const [pantalla, setPantalla] = useState("inicio");
  const [borradorSeleccionado, setBorradorSeleccionado] = useState(null);
  const [ingresoSeleccionado, setIngresoSeleccionado] = useState(null);
  const avisar = useToast();

  if (!logueado) {
    return <Login onLogin={() => setLogueado(true)} />;
  }

  const actual = PANTALLAS[pantalla] ?? PANTALLAS.inicio;

  function cerrarSesion() {
    setLogueado(false);
    setPantalla("inicio");
    setBorradorSeleccionado(null);
    setIngresoSeleccionado(null);
    avisar("Sesión cerrada", "info");
  }

  return (
    <div className="app">
      <div className="franja" aria-hidden="true" />

      <header className="topbar">
        <div className="topbar__inner">
          {actual.vuelveA ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm topbar__volver"
              onClick={() => setPantalla(actual.vuelveA)}
            >
              <Icon name="izquierda" size={17} />
              <span className="topbar__volver-texto">Volver</span>
            </button>
          ) : (
            <span className="marca-mini" aria-hidden="true">
              BM
            </span>
          )}

          <div className="topbar__titulo">
            <span className="topbar__marca">Bicho Malo Taller</span>
            {pantalla !== "inicio" && (
              <>
                <span className="topbar__sep" aria-hidden="true">
                  /
                </span>
                <span className="topbar__pantalla">{actual.titulo}</span>
              </>
            )}
          </div>

          <button type="button" className="btn btn--ghost btn--sm topbar__salir" onClick={cerrarSesion}>
            <Icon name="salir" size={17} />
            <span className="topbar__salir-texto">Salir</span>
          </button>
        </div>
      </header>

      {/* La `key` remonta el contenido: cada cambio de pantalla entra con su propia animación. */}
      <main className="app__contenido" key={pantalla}>
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
          <NuevoIngreso borrador={borradorSeleccionado} onVolver={() => setPantalla("inicio")} />
        )}

        {pantalla === "buscar" && <Buscar />}

        {pantalla === "historial" && (
          <Historial
            onSeleccionar={(ingreso) => {
              setIngresoSeleccionado(ingreso);
              setPantalla("ficha");
            }}
          />
        )}

        {pantalla === "ficha" && ingresoSeleccionado && (
          <FichaIngreso ingreso={ingresoSeleccionado} onVolver={() => setPantalla("historial")} />
        )}

        {pantalla === "pendientes" && (
          <Pendientes
            onAbrir={(borrador) => {
              setBorradorSeleccionado(borrador);
              setPantalla("nuevo");
            }}
            onNuevoIngreso={() => {
              setBorradorSeleccionado(null);
              setPantalla("nuevo");
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;

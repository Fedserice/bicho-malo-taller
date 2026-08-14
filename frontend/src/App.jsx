import { useEffect, useState } from "react";
import Login from "./components/Login";
import Inicio from "./components/Inicio";
import NuevoIngreso from "./components/NuevoIngreso";
import Pendientes from "./components/Pendientes";
import Buscar from "./components/Buscar";
import Historial from "./components/Historial";
import FichaIngreso from "./components/FichaIngreso";
import FaltaConfig from "./components/FaltaConfig";
import Icon from "./ui/Icon";
import { Cargando } from "./ui/Estados";
import { useToast } from "./ui/useToast";
import { supabase, hayConfig } from "./lib/supabase";
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
  const [sesion, setSesion] = useState(null);
  const [revisandoSesion, setRevisandoSesion] = useState(hayConfig);
  const [pantalla, setPantalla] = useState("inicio");
  const [ingresoEnEdicion, setIngresoEnEdicion] = useState(null);
  const [ingresoSeleccionado, setIngresoSeleccionado] = useState(null);
  const avisar = useToast();

  // Sesión guardada en el navegador + cambios de login/logout
  useEffect(() => {
    if (!hayConfig) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setRevisandoSesion(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, sesionNueva) => {
      setSesion(sesionNueva);
      setRevisandoSesion(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!hayConfig) {
    return <FaltaConfig />;
  }

  if (revisandoSesion) {
    return (
      <div className="app">
        <div className="franja" aria-hidden="true" />
        <Cargando texto="Abriendo el taller…" />
      </div>
    );
  }

  if (!sesion) {
    return <Login />;
  }

  const actual = PANTALLAS[pantalla] ?? PANTALLAS.inicio;

  async function cerrarSesion() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      avisar("No se pudo cerrar la sesión. Probá de nuevo.", "error");
      return;
    }

    setPantalla("inicio");
    setIngresoEnEdicion(null);
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

          <button
            type="button"
            className="btn btn--ghost btn--sm topbar__salir"
            onClick={cerrarSesion}
          >
            <Icon name="salir" size={17} />
            <span className="topbar__salir-texto">Salir</span>
          </button>
        </div>
      </header>

      {/* La `key` remonta el contenido: cada pantalla entra con su animación y recarga sus datos. */}
      <main className="app__contenido" key={pantalla}>
        {pantalla === "inicio" && (
          <Inicio
            onNuevoIngreso={() => {
              setIngresoEnEdicion(null);
              setPantalla("nuevo");
            }}
            onBuscar={() => setPantalla("buscar")}
            onHistorial={() => setPantalla("historial")}
            onPendientes={() => setPantalla("pendientes")}
          />
        )}

        {pantalla === "nuevo" && (
          <NuevoIngreso ingreso={ingresoEnEdicion} onVolver={() => setPantalla("inicio")} />
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
            onAbrir={(ingreso) => {
              setIngresoEnEdicion(ingreso);
              setPantalla("nuevo");
            }}
            onNuevoIngreso={() => {
              setIngresoEnEdicion(null);
              setPantalla("nuevo");
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;

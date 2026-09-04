import { useEffect, useState } from "react";
import Login from "./components/Login";
import Inicio from "./components/Inicio";
import NuevoIngreso from "./components/NuevoIngreso";
import Historial from "./components/Historial";
import FichaIngreso from "./components/FichaIngreso";
import Reportes from "./components/Reportes";
import FaltaConfig from "./components/FaltaConfig";
import Icon from "./ui/Icon";
import BotonFlotante from "./ui/BotonFlotante";
import { Cargando } from "./ui/Estados";
import { useToast } from "./ui/useToast";
import { supabase, hayConfig } from "./lib/supabase";
import "./App.css";

// El Panel concentra buscador y tablero, así que quedan pocas pantallas.
const PANTALLAS = {
  inicio: "Inicio",
  nuevo: "Nuevo ingreso",
  historial: "Historial",
  ficha: "Ficha del vehículo",
  reportes: "Reportes",
};

function App() {
  const [sesion, setSesion] = useState(null);
  const [revisandoSesion, setRevisandoSesion] = useState(hayConfig);
  const [pantalla, setPantalla] = useState("inicio");
  // Pila de pantallas anteriores: la ficha y el formulario se abren desde
  // varios lados y se encadenan (tablero → ficha → editar), así que
  // "Volver" tiene que deshacer el camino real, no uno fijo.
  const [pila, setPila] = useState([]);
  const [ingresoEnEdicion, setIngresoEnEdicion] = useState(null);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const avisar = useToast();

  function ir(destino) {
    setPila((previas) => [...previas, pantalla]);
    setPantalla(destino);
  }

  function volver() {
    const destino = pila[pila.length - 1] ?? "inicio";
    setPila((previas) => previas.slice(0, -1));
    setPantalla(destino);
  }

  function abrirFicha(ingreso) {
    setVehiculoSeleccionado(ingreso.vehiculoId ?? ingreso.id);
    ir("ficha");
  }

  function irANuevoIngreso() {
    setIngresoEnEdicion(null);
    ir("nuevo");
  }

  /** Abre el formulario con una visita ya cargada, para seguir editándola. */
  function editarTrabajo(visita) {
    setIngresoEnEdicion(visita);
    ir("nuevo");
  }

  /** Abre el formulario con el vehículo precargado, sin visita: es un trabajo nuevo. */
  function nuevoTrabajoEnFicha(datosVehiculo) {
    setIngresoEnEdicion(datosVehiculo);
    ir("nuevo");
  }

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

  const titulo = PANTALLAS[pantalla] ?? PANTALLAS.inicio;
  const puedeVolver = pila.length > 0;

  async function cerrarSesion() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      avisar("No se pudo cerrar la sesión. Probá de nuevo.", "error");
      return;
    }

    setPantalla("inicio");
    setPila([]);
    setIngresoEnEdicion(null);
    setVehiculoSeleccionado(null);
    avisar("Sesión cerrada", "info");
  }

  return (
    <div className="app">
      <div className="franja" aria-hidden="true" />

      <header className="topbar">
        <div className="topbar__inner">
          {puedeVolver ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm topbar__volver"
              onClick={volver}
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
                <span className="topbar__pantalla">{titulo}</span>
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
            onHistorial={() => setPantalla("historial")}
            onReportes={() => setPantalla("reportes")}
            onAbrirFicha={abrirFicha}
            onEditar={editarTrabajo}
            onNuevoIngreso={irANuevoIngreso}
          />
        )}

        {pantalla === "nuevo" && (
          <NuevoIngreso ingreso={ingresoEnEdicion} onVolver={volver} />
        )}

        {pantalla === "historial" && <Historial onSeleccionar={abrirFicha} />}

        {pantalla === "ficha" && vehiculoSeleccionado && (
          <FichaIngreso
            vehiculoId={vehiculoSeleccionado}
            onVolver={volver}
            onEditar={editarTrabajo}
            onNuevoTrabajo={nuevoTrabajoEnFicha}
          />
        )}

        {pantalla === "reportes" && <Reportes />}
      </main>

      {pantalla !== "nuevo" && <BotonFlotante onClick={irANuevoIngreso} />}
    </div>
  );
}

export default App;

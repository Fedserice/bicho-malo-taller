import { useEffect, useState } from "react";
import Login from "./components/Login";
import Inicio from "./components/Inicio";
import NuevoIngreso from "./components/NuevoIngreso";
import Pendientes from "./components/Pendientes";
import Buscar from "./components/Buscar";
import Historial from "./components/Historial";
import FichaIngreso from "./components/FichaIngreso";
import Kanban from "./components/Kanban";
import Reportes from "./components/Reportes";
import FaltaConfig from "./components/FaltaConfig";
import Icon from "./ui/Icon";
import BotonFlotante from "./ui/BotonFlotante";
import { Cargando } from "./ui/Estados";
import { useToast } from "./ui/useToast";
import { supabase, hayConfig } from "./lib/supabase";
import "./App.css";

// Cada pantalla declara cómo se llama. La ficha puede abrirse desde
// varios lugares (Historial, Buscar, Kanban), así que su "volver"
// se calcula en tiempo real en vez de ser fijo.
const PANTALLAS = {
  inicio: { titulo: "Inicio", vuelveA: null },
  nuevo: { titulo: "Nuevo ingreso", vuelveA: "inicio" },
  buscar: { titulo: "Buscar", vuelveA: "inicio" },
  historial: { titulo: "Historial", vuelveA: "inicio" },
  ficha: { titulo: "Ficha del vehículo", vuelveA: "inicio" },
  pendientes: { titulo: "En el taller", vuelveA: "inicio" },
  kanban: { titulo: "Tablero", vuelveA: "inicio" },
  reportes: { titulo: "Reportes", vuelveA: "inicio" },
};

function App() {
  const [sesion, setSesion] = useState(null);
  const [revisandoSesion, setRevisandoSesion] = useState(hayConfig);
  const [pantalla, setPantalla] = useState("inicio");
  const [pantallaPrevia, setPantallaPrevia] = useState("inicio");
  const [ingresoEnEdicion, setIngresoEnEdicion] = useState(null);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const avisar = useToast();

  function abrirFicha(ingreso) {
    setPantallaPrevia(pantalla);
    setVehiculoSeleccionado(ingreso.vehiculoId ?? ingreso.id);
    setPantalla("ficha");
  }

  function irANuevoIngreso() {
    setIngresoEnEdicion(null);
    setPantalla("nuevo");
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

  const actual = PANTALLAS[pantalla] ?? PANTALLAS.inicio;
  const vuelveA = pantalla === "ficha" ? pantallaPrevia : actual.vuelveA;

  async function cerrarSesion() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      avisar("No se pudo cerrar la sesión. Probá de nuevo.", "error");
      return;
    }

    setPantalla("inicio");
    setIngresoEnEdicion(null);
    setVehiculoSeleccionado(null);
    avisar("Sesión cerrada", "info");
  }

  return (
    <div className="app">
      <div className="franja" aria-hidden="true" />

      <header className="topbar">
        <div className="topbar__inner">
          {vuelveA ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm topbar__volver"
              onClick={() => setPantalla(vuelveA)}
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
            onBuscar={() => setPantalla("buscar")}
            onHistorial={() => setPantalla("historial")}
            onPendientes={() => setPantalla("pendientes")}
            onKanban={() => setPantalla("kanban")}
            onReportes={() => setPantalla("reportes")}
          />
        )}

        {pantalla === "nuevo" && (
          <NuevoIngreso ingreso={ingresoEnEdicion} onVolver={() => setPantalla("inicio")} />
        )}

        {pantalla === "buscar" && <Buscar onSeleccionar={abrirFicha} />}

        {pantalla === "historial" && <Historial onSeleccionar={abrirFicha} />}

        {pantalla === "ficha" && vehiculoSeleccionado && (
          <FichaIngreso vehiculoId={vehiculoSeleccionado} onVolver={() => setPantalla(pantallaPrevia)} />
        )}

        {pantalla === "pendientes" && (
          <Pendientes
            onAbrir={(ingreso) => {
              setIngresoEnEdicion(ingreso);
              setPantalla("nuevo");
            }}
            onNuevoIngreso={irANuevoIngreso}
          />
        )}

        {pantalla === "kanban" && <Kanban onSeleccionar={abrirFicha} />}

        {pantalla === "reportes" && <Reportes />}
      </main>

      {pantalla !== "nuevo" && <BotonFlotante onClick={irANuevoIngreso} />}
    </div>
  );
}

export default App;

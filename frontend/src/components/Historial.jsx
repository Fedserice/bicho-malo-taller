import { useCallback, useMemo, useState } from "react";
import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import EstadoChip from "../ui/EstadoChip";
import { Cargando, ErrorDatos } from "../ui/Estados";
import { listarHistorial } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import "./Historial.css";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function Historial({ onSeleccionar }) {
  const consulta = useCallback(() => listarHistorial(), []);
  const { cargando, error, datos } = useConsulta(consulta, []);
  const ingresos = useMemo(() => datos ?? [], [datos]);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [mecanico, setMecanico] = useState("");
  const [trabajo, setTrabajo] = useState("");

  // Lista de mecánicos que aparecen en el historial, para armar el <select>
  const mecanicosDisponibles = useMemo(() => {
    const nombres = ingresos.map((i) => i.mecanico).filter(Boolean);
    return [...new Set(nombres)].sort();
  }, [ingresos]);

  const ingresosFiltrados = useMemo(() => {
    return ingresos.filter((i) => {
      if (desde && (!i.fecha || i.fecha < desde)) return false;
      if (hasta && (!i.fecha || i.fecha > hasta)) return false;
      if (mecanico && i.mecanico !== mecanico) return false;
      if (trabajo) {
        const texto = `${i.trabajos || ""} ${i.motivo || ""} ${i.diagnostico || ""}`.toLowerCase();
        if (!texto.includes(trabajo.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [ingresos, desde, hasta, mecanico, trabajo]);

  const hayFiltrosActivos = desde || hasta || mecanico || trabajo;

  function limpiarFiltros() {
    setDesde("");
    setHasta("");
    setMecanico("");
    setTrabajo("");
  }

  return (
    <div className="historial">
      <header className="pantalla-head">
        <div className="pantalla-head__texto">
          <span className="eyebrow">Trabajos cerrados</span>
          <h1>Historial</h1>
          <p>Tocá un registro para abrir la ficha completa del vehículo.</p>
        </div>
        {!cargando && ingresosFiltrados.length > 0 && (
          <div className="pantalla-head__cuenta">
            <strong>{ingresosFiltrados.length}</strong>
            {ingresosFiltrados.length === 1 ? "registro" : "registros"}
          </div>
        )}
      </header>

      {/* Filtros */}
      <div className="historial__filtros">
        <div className="campo">
          <label htmlFor="filtro-desde">Desde</label>
          <input
            id="filtro-desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="filtro-hasta">Hasta</label>
          <input
            id="filtro-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="filtro-mecanico">Mecánico</label>
          <select
            id="filtro-mecanico"
            value={mecanico}
            onChange={(e) => setMecanico(e.target.value)}
          >
            <option value="">Todos</option>
            {mecanicosDisponibles.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="campo campo--busqueda">
          <label htmlFor="filtro-trabajo">Trabajo</label>
          <input
            id="filtro-trabajo"
            type="search"
            placeholder="Buscar por trabajo realizado…"
            value={trabajo}
            onChange={(e) => setTrabajo(e.target.value)}
          />
        </div>

        {hayFiltrosActivos && (
          <button type="button" className="btn-icon historial__limpiar-filtros" onClick={limpiarFiltros}>
            <Icon name="cerrar" size={14} />
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <ErrorDatos mensaje={error} />}
      {cargando && <Cargando texto="Trayendo el historial…" />}

      {!cargando && !error && ingresos.length === 0 && (
        <div className="vacio">
          <span className="vacio__icono">
            <Icon name="planilla" size={24} />
          </span>
          <h3>Todavía no hay trabajos cerrados</h3>
          <p>Cuando finalices un ingreso, el trabajo queda guardado acá con toda su ficha.</p>
        </div>
      )}

      {!cargando && !error && ingresos.length > 0 && ingresosFiltrados.length === 0 && (
        <div className="vacio">
          <span className="vacio__icono">
            <Icon name="buscar" size={24} />
          </span>
          <h3>Ningún registro coincide con los filtros</h3>
          <p>Probá ajustar las fechas, el mecánico o el texto buscado.</p>
        </div>
      )}

      {!cargando && ingresosFiltrados.length > 0 && (
        <div className="historial__lista stagger">
          {ingresosFiltrados.map((ingreso, i) => (
            <button
              key={ingreso.id}
              type="button"
              className="registro"
              style={{ "--i": i }}
              onClick={() => onSeleccionar(ingreso)}
            >
              <Patente valor={ingreso.patente} tamano="sm" />
              <span className="registro__id">
                <span className="registro__vehiculo">
                  {ingreso.vehiculo || "Vehículo sin cargar"}
                </span>
                <span className="registro__cliente">
                  {ingreso.cliente || "Sin cliente"}
                  {ingreso.fecha && (
                    <>
                      <span className="registro__punto" aria-hidden="true" />
                      <span className="num">{ingreso.fecha}</span>
                    </>
                  )}
                </span>
              </span>
              <span className="registro__total num">
                {pesos.format(Number(ingreso.totalCobrado) || 0)}
              </span>
              <EstadoChip estado={ingreso.estado} />
              <Icon name="chevron" size={18} className="registro__flecha" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Historial;

import { useCallback, useMemo, useState } from "react";
import Icon from "../ui/Icon";
import NumeroAnimado from "../ui/NumeroAnimado";
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

function normalizarBusqueda(valor) {
  return (valor ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function Historial({ onSeleccionar }) {
  const consulta = useCallback(() => listarHistorial(), []);
  const { cargando, error, datos } = useConsulta(consulta, []);
  const ingresos = useMemo(() => datos ?? [], [datos]);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [mecanico, setMecanico] = useState("");
  const [busqueda, setBusqueda] = useState("");

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
      if (busqueda.trim()) {
        const termino = normalizarBusqueda(busqueda);
        const campos = [
          i.patente,
          i.cliente,
          i.telefono,
          i.vehiculo,
          i.trabajos,
          i.motivo,
          i.diagnostico,
          i.observaciones,
        ];
        const texto = normalizarBusqueda(campos.filter(Boolean).join(" "));
        const soloTelefono = /^[\d\s()+.-]+$/.test(busqueda.trim());
        const digitos = busqueda.replace(/\D/g, "");
        const telefono = (i.telefono || "").replace(/\D/g, "");
        const coincideTelefono = soloTelefono && digitos && telefono.includes(digitos);

        if (!texto.includes(termino) && !coincideTelefono) return false;
      }
      return true;
    });
  }, [ingresos, desde, hasta, mecanico, busqueda]);

  const hayFiltrosActivos = desde || hasta || mecanico || busqueda;

  function limpiarFiltros() {
    setDesde("");
    setHasta("");
    setMecanico("");
    setBusqueda("");
  }

  return (
    <div className="historial">
      <header className="pantalla-head">
        <div className="pantalla-head__texto">
          <span className="eyebrow">Ingresos registrados</span>
          <h1>Historial</h1>
          <p>Cada visita aparece por separado. Tocá un registro para abrir la ficha del vehículo.</p>
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
          <label htmlFor="filtro-busqueda">Buscar</label>
          <input
            id="filtro-busqueda"
            type="search"
            placeholder="Patente, cliente, teléfono o trabajo…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
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
          <h3>Todavía no hay ingresos registrados</h3>
          <p>Las visitas al taller aparecerán acá, ordenadas por fecha.</p>
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
                <NumeroAnimado
                  valor={Number(ingreso.totalCobrado) || 0}
                  formato={(valor) => pesos.format(valor)}
                />
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

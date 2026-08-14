import { useCallback } from "react";
import Icon from "../ui/Icon";
import { ErrorDatos } from "../ui/Estados";
import { obtenerResumen } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import "./Inicio.css";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const RESUMEN_VACIO = { enTaller: 0, cerrados: 0, facturado: 0 };

function Inicio({ onNuevoIngreso, onBuscar, onHistorial, onPendientes }) {
  const consulta = useCallback(() => obtenerResumen(), []);
  const { cargando, error, datos } = useConsulta(consulta, RESUMEN_VACIO);

  const resumen = datos ?? RESUMEN_VACIO;

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Mientras cargan las cifras se muestra un guion, no un cero que después salta.
  const cifra = (valor) => (cargando ? "—" : valor);

  return (
    <div className="inicio">
      <header className="inicio__head">
        <span className="eyebrow">{hoy}</span>
        <h1>Panel del taller</h1>
      </header>

      {error && <ErrorDatos mensaje={error} />}

      {/* Estado del taller */}
      <section className="inicio__cifras" aria-label="Resumen del taller">
        <button type="button" className="cifra cifra--activa" onClick={onPendientes}>
          <span className="cifra__label">En el taller</span>
          <span className="cifra__valor num">{cifra(resumen.enTaller)}</span>
          <span className="cifra__pie">
            {resumen.enTaller === 1 ? "vehículo sin cerrar" : "vehículos sin cerrar"}
            <Icon name="chevron" size={14} />
          </span>
        </button>

        <div className="cifra">
          <span className="cifra__label">Trabajos cerrados</span>
          <span className="cifra__valor num">{cifra(resumen.cerrados)}</span>
          <span className="cifra__pie">en el historial</span>
        </div>

        <div className="cifra">
          <span className="cifra__label">Total cobrado</span>
          <span className="cifra__valor cifra__valor--monto num">
            {cifra(pesos.format(resumen.facturado))}
          </span>
          <span className="cifra__pie">sobre trabajos cerrados</span>
        </div>
      </section>

      {/* Acciones */}
      <section className="inicio__acciones" aria-label="Acciones">
        <button type="button" className="tile tile--destacado" onClick={onNuevoIngreso}>
          <span className="tile__icono">
            <Icon name="mas" size={22} />
          </span>
          <span className="tile__texto">
            <span className="tile__titulo">Nuevo ingreso</span>
            <span className="tile__desc">Cargar un vehículo que entra al taller</span>
          </span>
          <Icon name="derecha" size={20} className="tile__flecha" />
        </button>

        <button type="button" className="tile" onClick={onBuscar}>
          <span className="tile__icono">
            <Icon name="buscar" size={20} />
          </span>
          <span className="tile__texto">
            <span className="tile__titulo">Buscar</span>
            <span className="tile__desc">Por patente, cliente o trabajo</span>
          </span>
        </button>

        <button type="button" className="tile" onClick={onPendientes}>
          <span className="tile__icono">
            <Icon name="auto" size={20} />
          </span>
          <span className="tile__texto">
            <span className="tile__titulo">En el taller</span>
            <span className="tile__desc">Ingresos empezados sin cerrar</span>
          </span>
          {resumen.enTaller > 0 && <span className="tile__contador num">{resumen.enTaller}</span>}
        </button>

        <button type="button" className="tile tile--ancho" onClick={onHistorial}>
          <span className="tile__icono">
            <Icon name="planilla" size={20} />
          </span>
          <span className="tile__texto">
            <span className="tile__titulo">Historial</span>
            <span className="tile__desc">Todos los trabajos terminados</span>
          </span>
          <Icon name="chevron" size={18} className="tile__flecha" />
        </button>
      </section>
    </div>
  );
}

export default Inicio;

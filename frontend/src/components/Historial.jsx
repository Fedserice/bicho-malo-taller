import { useCallback } from "react";
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

  const ingresos = datos ?? [];

  return (
    <div className="historial">
      <header className="pantalla-head">
        <div className="pantalla-head__texto">
          <span className="eyebrow">Trabajos cerrados</span>
          <h1>Historial</h1>
          <p>Tocá un registro para abrir la ficha completa del vehículo.</p>
        </div>

        {!cargando && ingresos.length > 0 && (
          <div className="pantalla-head__cuenta">
            <strong>{ingresos.length}</strong>
            {ingresos.length === 1 ? "registro" : "registros"}
          </div>
        )}
      </header>

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

      {!cargando && ingresos.length > 0 && (
        <div className="historial__lista stagger">
          {ingresos.map((ingreso, i) => (
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

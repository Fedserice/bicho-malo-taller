import { useCallback } from "react";
import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import EstadoChip from "../ui/EstadoChip";
import { Cargando, ErrorDatos } from "../ui/Estados";
import { listarEnTaller } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import "./Pendientes.css";

function Pendientes({ onAbrir, onNuevoIngreso }) {
  const consulta = useCallback(() => listarEnTaller(), []);
  const { cargando, error, datos } = useConsulta(consulta, []);

  const ingresos = datos ?? [];

  return (
    <div className="pendientes">
      <header className="pantalla-head">
        <div className="pantalla-head__texto">
          <span className="eyebrow">Ingresos sin cerrar</span>
          <h1>En el taller</h1>
          <p>Vehículos con el ingreso empezado que todavía no pasaron al historial.</p>
        </div>

        {!cargando && ingresos.length > 0 && (
          <div className="pantalla-head__cuenta">
            <strong>{ingresos.length}</strong>
            {ingresos.length === 1 ? "vehículo" : "vehículos"}
          </div>
        )}
      </header>

      {error && <ErrorDatos mensaje={error} />}

      {cargando && <Cargando texto="Mirando qué hay en el taller…" />}

      {!cargando && !error && ingresos.length === 0 && (
        <div className="vacio">
          <span className="vacio__icono">
            <Icon name="auto" size={24} />
          </span>
          <h3>No hay autos en el taller</h3>
          <p>Cuando cargues un ingreso y lo guardes sin finalizar, va a aparecer acá.</p>
          <button type="button" className="btn btn--primary" onClick={onNuevoIngreso}>
            <Icon name="mas" size={18} />
            Cargar un ingreso
          </button>
        </div>
      )}

      {!cargando && ingresos.length > 0 && (
        <div className="pendientes__grid stagger">
          {ingresos.map((ingreso, i) => (
            <article key={ingreso.id} className="pendiente" style={{ "--i": i }}>
              <div className="pendiente__head">
                <Patente valor={ingreso.patente} tamano="sm" />
                <EstadoChip estado={ingreso.estado} />
              </div>

              <div className="pendiente__cuerpo">
                <h2>{ingreso.vehiculo || "Vehículo sin cargar"}</h2>

                <p className="pendiente__linea">
                  <Icon name="persona" size={14} />
                  {ingreso.cliente || "Sin cliente"}
                </p>

                {ingreso.fecha && (
                  <p className="pendiente__linea">
                    <Icon name="calendario" size={14} />
                    <span className="num">{ingreso.fecha}</span>
                  </p>
                )}

                {ingreso.motivo?.trim() && <p className="pendiente__motivo">{ingreso.motivo}</p>}
              </div>

              <button
                type="button"
                className="btn btn--outline btn--block pendiente__accion"
                onClick={() => onAbrir(ingreso)}
              >
                <Icon name="lapiz" size={17} />
                Continuar ingreso
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Pendientes;

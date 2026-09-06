import { useCallback } from "react";
import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import EstadoChip from "../ui/EstadoChip";
import { Cargando, ErrorDatos } from "../ui/Estados";
import { buscarVehiculos } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import "./Buscar.css";

/**
 * Resultados de la búsqueda del Panel. El campo de texto vive en
 * Inicio; acá llega `consulta` ya estabilizada (con el debounce hecho).
 */
function Buscar({ consulta, escribiendo = false, onSeleccionar }) {
  const traer = useCallback(() => buscarVehiculos(consulta), [consulta]);
  const { cargando, error, datos } = useConsulta(traer, []);

  const resultados = datos ?? [];
  const buscando = escribiendo || cargando;

  if (error) return <ErrorDatos mensaje={error} />;
  if (buscando) return <Cargando texto="Buscando…" />;

  if (resultados.length === 0) {
    return (
      <div className="vacio">
        <span className="vacio__icono">
          <Icon name="bandeja" size={24} />
        </span>
        <h3>Sin resultados</h3>
        <p>Ningún vehículo coincide con “{consulta}”. Probá con menos letras o con la patente.</p>
      </div>
    );
  }

  return (
    <>
      <p className="buscar__cuenta">
        {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"} para “{consulta}”
      </p>

      <div className="resultados stagger">
        {resultados.map((ingreso, i) => (
          <article
            key={ingreso.id}
            className="resultado resultado--clickeable"
            style={{ "--i": i }}
            role="button"
            tabIndex={0}
            onClick={() => onSeleccionar?.(ingreso)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSeleccionar?.(ingreso);
            }}
          >
            <div className="resultado__head">
              <Patente valor={ingreso.patente} />
              <div className="resultado__id">
                <h2>{ingreso.vehiculo || "Vehículo sin cargar"}</h2>
                <span className="resultado__cliente">
                  <Icon name="persona" size={14} />
                  {ingreso.cliente || "Sin cliente"}
                </span>
              </div>
              <EstadoChip estado={ingreso.estado} />
            </div>

            <div className="resultado__cuerpo">
              <div className="dato">
                <span className="dato__label">
                  <Icon name="calendario" size={13} />
                  Última visita
                </span>
                <span className="dato__valor num">{ingreso.fecha || "—"}</span>
              </div>

              <div className="dato">
                <span className="dato__label">
                  <Icon name="casco" size={13} />
                  Mecánico
                </span>
                <span className="dato__valor">{ingreso.mecanico || "—"}</span>
              </div>

              <div className="dato resultado__ancho">
                <span className="dato__label">
                  <Icon name="llave" size={13} />
                  Motivo
                </span>
                <p className="dato__texto">{ingreso.motivo || "—"}</p>
              </div>

              <div className="dato resultado__ancho">
                <span className="dato__label">
                  <Icon name="tilde" size={13} />
                  Trabajos realizados
                </span>
                <p className="dato__texto">{ingreso.trabajos || "—"}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default Buscar;

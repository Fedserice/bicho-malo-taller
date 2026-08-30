import { useCallback, useState } from "react";
import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import { Cargando, ErrorDatos } from "../ui/Estados";
import { listarVehiculos, cambiarEstadoVisita } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import { useToast } from "../ui/useToast";
import "./Kanban.css";

const COLUMNAS = [
  { estado: "Pendiente", titulo: "Pendiente" },
  { estado: "En reparación", titulo: "En reparación" },
  { estado: "Finalizado", titulo: "Finalizado" },
  { estado: "Entregado", titulo: "Entregado" },
];

const SIGUIENTE_ESTADO = {
  Pendiente: "En reparación",
  "En reparación": "Finalizado",
  Finalizado: "Entregado",
};

function Tarjeta({ ingreso, onSeleccionar, onAvanzar, moviendo }) {
  const siguiente = SIGUIENTE_ESTADO[ingreso.estado];

  return (
    <article className="kanban__tarjeta">
      <button
        type="button"
        className="kanban__tarjeta-cuerpo"
        onClick={() => onSeleccionar(ingreso)}
      >
        <div className="kanban__tarjeta-head">
          <Patente valor={ingreso.patente} tamano="sm" />
        </div>
        <h3>{ingreso.vehiculo || "Vehículo sin cargar"}</h3>
        <p className="kanban__cliente">
          <Icon name="persona" size={13} />
          {ingreso.cliente || "Sin cliente"}
        </p>
        {ingreso.motivo?.trim() && <p className="kanban__motivo">{ingreso.motivo}</p>}
      </button>

      {siguiente && (
        <button
          type="button"
          className="btn btn--outline btn--sm kanban__avanzar"
          disabled={moviendo}
          onClick={() => onAvanzar(ingreso, siguiente)}
        >
          {moviendo ? (
            <span className="spinner spinner--boton" aria-hidden="true" />
          ) : (
            <Icon name="derecha" size={15} />
          )}
          Pasar a {siguiente}
        </button>
      )}
    </article>
  );
}

function Kanban({ onSeleccionar }) {
  const consulta = useCallback(() => listarVehiculos(), []);
  const { cargando, error, datos, recargar } = useConsultaConReload(consulta);
  const [moviendo, setMoviendo] = useState(null);
  const avisar = useToast();

  const ingresos = datos ?? [];

  async function avanzar(ingreso, estadoNuevo) {
    setMoviendo(ingreso.id);
    try {
      await cambiarEstadoVisita(ingreso.ultimaVisitaId, estadoNuevo);
      avisar(`${ingreso.patente || "Vehículo"} pasó a “${estadoNuevo}”`, "ok");
      await recargar();
    } catch (err) {
      avisar(err.message || "No se pudo mover el vehículo", "error");
    } finally {
      setMoviendo(null);
    }
  }

  return (
    <div className="kanban">
      <header className="pantalla-head">
        <div className="pantalla-head__texto">
          <span className="eyebrow">Flujo de trabajo</span>
          <h1>Tablero</h1>
          <p>Un vistazo a en qué etapa está cada vehículo.</p>
        </div>
      </header>

      {error && <ErrorDatos mensaje={error} />}
      {cargando && <Cargando texto="Armando el tablero…" />}

      {!cargando && !error && (
        <div className="kanban__tablero">
          {COLUMNAS.map((columna) => {
            const items = ingresos.filter((i) => i.estado === columna.estado);
            return (
              <section key={columna.estado} className="kanban__columna">
                <header className="kanban__columna-head">
                  <h2>{columna.titulo}</h2>
                  <span className="kanban__contador num">{items.length}</span>
                </header>

                <div className="kanban__lista">
                  {items.length === 0 && <p className="kanban__vacia">Sin vehículos acá.</p>}
                  {items.map((ingreso) => (
                    <Tarjeta
                      key={ingreso.id}
                      ingreso={ingreso}
                      onSeleccionar={onSeleccionar}
                      onAvanzar={avanzar}
                      moviendo={moviendo === ingreso.id}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// useConsulta no expone una forma de recargar a pedido; este wrapper
// le suma esa capacidad sin tocar el hook original (lo usan otras pantallas).
function useConsultaConReload(consulta) {
  const [version, setVersion] = useState(0);
  const consultaVersionada = useCallback(() => consulta(), [consulta, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const estado = useConsulta(consultaVersionada, []);

  return { ...estado, recargar: () => setVersion((v) => v + 1) };
}

export default Kanban;

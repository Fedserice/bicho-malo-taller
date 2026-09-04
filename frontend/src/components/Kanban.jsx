import { useCallback, useState } from "react";
import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import { Cargando, ErrorDatos } from "../ui/Estados";
import { listarEnTaller, cambiarEstadoVisita, obtenerVisitaParaEditar } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import { useToast } from "../ui/useToast";
import "./Kanban.css";

// El tablero muestra solo lo que está adentro del taller. Al pasar a
// "Entregado" el vehículo desaparece de acá y queda en el Historial.
const COLUMNAS = [
  { estado: "En reparación", titulo: "En reparación" },
  { estado: "Finalizado", titulo: "Finalizado" },
];

const SIGUIENTE_ESTADO = {
  "En reparación": "Finalizado",
  Finalizado: "Entregado",
};

function Tarjeta({ ingreso, onSeleccionar, onEditar, onAvanzar, moviendo }) {
  const siguiente = SIGUIENTE_ESTADO[ingreso.estado];
  const saldo = Number(ingreso.saldo) || 0;

  return (
    <article className="kanban__tarjeta">
      <button
        type="button"
        className="kanban__tarjeta-cuerpo"
        onClick={() => onSeleccionar(ingreso)}
      >
        <div className="kanban__tarjeta-head">
          <Patente valor={ingreso.patente} tamano="sm" />
          {saldo > 0 && (
            <span className="kanban__saldo num" title="Saldo pendiente de cobro">
              Debe
            </span>
          )}
        </div>
        <h3>{ingreso.vehiculo || "Vehículo sin cargar"}</h3>
        <p className="kanban__cliente">
          <Icon name="persona" size={13} />
          {ingreso.cliente || "Sin cliente"}
        </p>
        {ingreso.motivo?.trim() && <p className="kanban__motivo">{ingreso.motivo}</p>}
      </button>

      <div className="kanban__acciones">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => onEditar(ingreso)}
          disabled={moviendo}
        >
          <Icon name="lapiz" size={15} />
          Editar
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
            {siguiente === "Entregado" ? "Entregar" : "Finalizar"}
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * Tablero del taller. Vive dentro del Panel (`embebido`), pero se
 * mantiene como componente aparte porque trae y refresca sus datos.
 */
function Kanban({ onSeleccionar, onEditar, onNuevoIngreso, embebido = false }) {
  const consulta = useCallback(() => listarEnTaller(), []);
  const { cargando, error, datos, recargar } = useConsultaConReload(consulta);
  const [moviendo, setMoviendo] = useState(null);
  const avisar = useToast();

  const ingresos = datos ?? [];

  async function avanzar(ingreso, estadoNuevo) {
    setMoviendo(ingreso.id);
    try {
      await cambiarEstadoVisita(ingreso.ultimaVisitaId, estadoNuevo);
      avisar(
        estadoNuevo === "Entregado"
          ? `${ingreso.patente || "El vehículo"} se entregó y pasó al historial`
          : `${ingreso.patente || "El vehículo"} pasó a “${estadoNuevo}”`,
        "ok"
      );
      recargar();
    } catch (err) {
      avisar(err.message || "No se pudo mover el vehículo", "error");
    } finally {
      setMoviendo(null);
    }
  }

  // La ficha se edita con el mismo formulario del ingreso, cargado
  // con la visita que está abierta.
  async function editar(ingreso) {
    setMoviendo(ingreso.id);
    try {
      const visita = await obtenerVisitaParaEditar(ingreso.vehiculoId, ingreso.ultimaVisitaId);
      onEditar(visita);
    } catch (err) {
      avisar(err.message || "No se pudo abrir el trabajo", "error");
      setMoviendo(null);
    }
  }

  return (
    <div className="kanban">
      {!embebido && (
        <header className="pantalla-head">
          <div className="pantalla-head__texto">
            <span className="eyebrow">Flujo de trabajo</span>
            <h1>Tablero</h1>
            <p>Un vistazo a en qué etapa está cada vehículo.</p>
          </div>
        </header>
      )}

      {error && <ErrorDatos mensaje={error} />}
      {cargando && <Cargando texto="Armando el tablero…" />}

      {!cargando && !error && ingresos.length === 0 && (
        <div className="vacio">
          <span className="vacio__icono">
            <Icon name="auto" size={24} />
          </span>
          <h3>No hay autos en el taller</h3>
          <p>Cuando registres un ingreso, el vehículo aparece acá en “En reparación”.</p>
          {onNuevoIngreso && (
            <button type="button" className="btn btn--primary" onClick={onNuevoIngreso}>
              <Icon name="mas" size={18} />
              Cargar un ingreso
            </button>
          )}
        </div>
      )}

      {!cargando && !error && ingresos.length > 0 && (
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
                      onEditar={editar}
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

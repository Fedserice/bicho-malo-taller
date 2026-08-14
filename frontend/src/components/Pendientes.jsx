import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import EstadoChip from "../ui/EstadoChip";
import "./Pendientes.css";

function leerBorradores() {
  try {
    const guardado = JSON.parse(localStorage.getItem("borradores") || "[]");
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

function Pendientes({ onAbrir, onNuevoIngreso }) {
  const borradores = leerBorradores();

  return (
    <div className="pendientes">
      <header className="pantalla-head">
        <div className="pantalla-head__texto">
          <span className="eyebrow">Ingresos sin cerrar</span>
          <h1>En el taller</h1>
          <p>Vehículos con el ingreso empezado que todavía no pasaron al historial.</p>
        </div>

        {borradores.length > 0 && (
          <div className="pantalla-head__cuenta">
            <strong>{borradores.length}</strong>
            {borradores.length === 1 ? "vehículo" : "vehículos"}
          </div>
        )}
      </header>

      {borradores.length === 0 ? (
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
      ) : (
        <div className="pendientes__grid stagger">
          {borradores.map((borrador, i) => (
            <article key={borrador.id} className="pendiente" style={{ "--i": i }}>
              <div className="pendiente__head">
                <Patente valor={borrador.patente} tamano="sm" />
                <EstadoChip estado="En reparación" />
              </div>

              <div className="pendiente__cuerpo">
                <h2>{borrador.vehiculo || "Vehículo sin cargar"}</h2>

                <p className="pendiente__linea">
                  <Icon name="persona" size={14} />
                  {borrador.cliente || "Sin cliente"}
                </p>

                {borrador.fecha && (
                  <p className="pendiente__linea">
                    <Icon name="calendario" size={14} />
                    <span className="num">{borrador.fecha}</span>
                  </p>
                )}

                {borrador.motivo?.trim() && (
                  <p className="pendiente__motivo">{borrador.motivo}</p>
                )}
              </div>

              <button
                type="button"
                className="btn btn--outline btn--block pendiente__accion"
                onClick={() => onAbrir(borrador)}
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

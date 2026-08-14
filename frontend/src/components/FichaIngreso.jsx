import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import EstadoChip from "../ui/EstadoChip";
import "./FichaIngreso.css";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const kilometros = new Intl.NumberFormat("es-AR");

function FichaIngreso({ ingreso, onVolver }) {
  const repuestos = Number(ingreso.repuestosTaller) || 0;
  const manoObra = Number(ingreso.manoObra) || 0;
  const total = Number(ingreso.totalCobrado) || 0;

  return (
    <div className="ficha">
      <header className="ficha__head">
        <Patente valor={ingreso.patente} tamano="lg" />

        <div className="ficha__id">
          <span className="eyebrow">Ficha del vehículo</span>
          <h1>{ingreso.vehiculo || "Vehículo sin cargar"}</h1>
          <div className="ficha__meta">
            <EstadoChip estado={ingreso.estado} />
            {ingreso.fecha && (
              <span className="ficha__fecha">
                <Icon name="calendario" size={14} />
                <span className="num">{ingreso.fecha}</span>
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="ficha__grid">
        {/* Cliente */}
        <section className="bloque">
          <h2 className="bloque__titulo">
            <Icon name="persona" size={17} />
            Cliente
          </h2>
          <div className="bloque__datos">
            <div className="dato">
              <span className="dato__label">Nombre</span>
              <span className="dato__valor">{ingreso.cliente || "—"}</span>
            </div>
            <div className="dato">
              <span className="dato__label">Teléfono</span>
              <span className="dato__valor num">{ingreso.telefono || "—"}</span>
            </div>
          </div>
        </section>

        {/* Vehículo */}
        <section className="bloque">
          <h2 className="bloque__titulo">
            <Icon name="auto" size={17} />
            Vehículo
          </h2>
          <div className="bloque__datos">
            <div className="dato">
              <span className="dato__label">Kilometraje</span>
              <span className="dato__valor num">
                {ingreso.kilometraje ? `${kilometros.format(ingreso.kilometraje)} km` : "—"}
              </span>
            </div>
            <div className="dato">
              <span className="dato__label">Mecánico a cargo</span>
              <span className="dato__valor">{ingreso.mecanico || "—"}</span>
            </div>
          </div>
        </section>

        {/* Trabajo */}
        <section className="bloque bloque--ancho">
          <h2 className="bloque__titulo">
            <Icon name="llave" size={17} />
            Trabajo
          </h2>
          <div className="bloque__datos bloque__datos--columna">
            <div className="dato">
              <span className="dato__label">Motivo del ingreso</span>
              <p className="dato__texto">{ingreso.motivo || "—"}</p>
            </div>
            <div className="dato">
              <span className="dato__label">Diagnóstico</span>
              <p className="dato__texto">{ingreso.diagnostico || "—"}</p>
            </div>
            <div className="dato">
              <span className="dato__label">Trabajos realizados</span>
              <p className="dato__texto">{ingreso.trabajos || "—"}</p>
            </div>
          </div>
        </section>

        {/* Cierre económico */}
        <section className="bloque bloque--ancho cuenta">
          <h2 className="bloque__titulo">
            <Icon name="peso" size={17} />
            Cuenta
          </h2>

          <div className="cuenta__filas">
            <div className="cuenta__fila">
              <span>
                <Icon name="caja" size={15} />
                Repuestos del taller
              </span>
              <span className="num">{pesos.format(repuestos)}</span>
            </div>

            <div className="cuenta__fila">
              <span>
                <Icon name="llave" size={15} />
                Mano de obra
              </span>
              <span className="num">{pesos.format(manoObra)}</span>
            </div>

            <div className="cuenta__fila">
              <span>
                <Icon name="persona" size={15} />
                Repuestos puestos por el cliente
              </span>
              <span>{ingreso.repuestosCliente ? "Sí" : "No"}</span>
            </div>
          </div>

          <div className="cuenta__total">
            <span className="cuenta__total-label">Total cobrado</span>
            <span className="cuenta__total-valor num">{pesos.format(total)}</span>
          </div>
        </section>

        {/* Notas */}
        <section className="bloque">
          <h2 className="bloque__titulo">
            <Icon name="planilla" size={17} />
            Pendientes
          </h2>
          <p className="dato__texto">{ingreso.pendientes || "Ninguno"}</p>
        </section>

        <section className="bloque">
          <h2 className="bloque__titulo">
            <Icon name="nota" size={17} />
            Observaciones
          </h2>
          <p className="dato__texto">{ingreso.observaciones || "—"}</p>
        </section>
      </div>

      <button type="button" className="btn btn--outline ficha__volver" onClick={onVolver}>
        <Icon name="izquierda" size={18} />
        Volver al historial
      </button>
    </div>
  );
}

export default FichaIngreso;

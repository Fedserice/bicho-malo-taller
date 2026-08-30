import { useCallback } from "react";
import Icon from "../ui/Icon";
import { Cargando, ErrorDatos } from "../ui/Estados";
import { obtenerReportes } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import "./Reportes.css";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function Reportes() {
  const consulta = useCallback(() => obtenerReportes(), []);
  const { cargando, error, datos } = useConsulta(consulta, null);

  if (cargando) return <Cargando texto="Calculando los números del taller…" />;
  if (error) return <ErrorDatos mensaje={error} />;
  if (!datos) return null;

  const { totalFacturado, trabajosEntregados, facturacionMensual, porMecanico } = datos;
  const maximoMensual = Math.max(1, ...facturacionMensual.map((m) => m.total));
  const maximoMecanico = Math.max(1, ...porMecanico.map((m) => m.facturado));

  return (
    <div className="reportes">
      <header className="pantalla-head">
        <div className="pantalla-head__texto">
          <span className="eyebrow">Solo trabajos entregados</span>
          <h1>Reportes</h1>
          <p>Cómo viene la facturación y quién cerró qué.</p>
        </div>
      </header>

      <section className="inicio__cifras" aria-label="Resumen de facturación">
        <div className="cifra">
          <span className="cifra__label">Total facturado</span>
          <span className="cifra__valor cifra__valor--monto num">{pesos.format(totalFacturado)}</span>
          <span className="cifra__pie">histórico, trabajos entregados</span>
        </div>
        <div className="cifra">
          <span className="cifra__label">Trabajos entregados</span>
          <span className="cifra__valor num">{trabajosEntregados}</span>
          <span className="cifra__pie">en total</span>
        </div>
      </section>

      <section className="bloque bloque--ancho reportes__bloque">
        <h2 className="bloque__titulo">
          <Icon name="grafico" size={17} />
          Facturación de los últimos meses
        </h2>

        {facturacionMensual.length === 0 ? (
          <p className="reportes__vacio">Todavía no hay trabajos entregados para graficar.</p>
        ) : (
          <div className="reportes__barras">
            {facturacionMensual.map((mes) => (
              <div className="reportes__barra-fila" key={mes.clave}>
                <span className="reportes__barra-label">{mes.mes}</span>
                <div className="reportes__barra-pista">
                  <div
                    className="reportes__barra-valor"
                    style={{ width: `${(mes.total / maximoMensual) * 100}%` }}
                  />
                </div>
                <span className="reportes__barra-num num">{pesos.format(mes.total)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bloque bloque--ancho reportes__bloque">
        <h2 className="bloque__titulo">
          <Icon name="casco" size={17} />
          Por mecánico
        </h2>

        {porMecanico.length === 0 ? (
          <p className="reportes__vacio">Todavía no hay trabajos entregados para repartir.</p>
        ) : (
          <div className="reportes__barras">
            {porMecanico.map((m) => (
              <div className="reportes__barra-fila" key={m.nombre}>
                <span className="reportes__barra-label">{m.nombre}</span>
                <div className="reportes__barra-pista">
                  <div
                    className="reportes__barra-valor reportes__barra-valor--info"
                    style={{ width: `${(m.facturado / maximoMecanico) * 100}%` }}
                  />
                </div>
                <span className="reportes__barra-num num">
                  {pesos.format(m.facturado)} · {m.trabajos} {m.trabajos === 1 ? "trabajo" : "trabajos"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Reportes;

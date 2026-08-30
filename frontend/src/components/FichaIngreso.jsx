import { useCallback } from "react";
import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import EstadoChip from "../ui/EstadoChip";
import { Cargando, ErrorDatos } from "../ui/Estados";
import { obtenerFichaVehiculo } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import "./FichaIngreso.css";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const kilometros = new Intl.NumberFormat("es-AR");

function Visita({ visita, esUltima }) {
  const manoObra = Number(visita.manoObra) || 0;
  const total = Number(visita.totalCobrado) || 0;

  return (
    <article className={`bloque bloque--ancho visita ${esUltima ? "visita--actual" : ""}`}>
      <div className="visita__head">
        <h2 className="bloque__titulo visita__titulo">
          <Icon name="llave" size={17} />
          {visita.fecha || "Sin fecha"}
        </h2>
        <EstadoChip estado={visita.estado} />
      </div>

      <div className="bloque__datos bloque__datos--columna">
        <div className="dato">
          <span className="dato__label">Motivo del ingreso</span>
          <p className="dato__texto">{visita.motivo || "—"}</p>
        </div>
        <div className="dato">
          <span className="dato__label">Diagnóstico</span>
          <p className="dato__texto">{visita.diagnostico || "—"}</p>
        </div>
        <div className="dato">
          <span className="dato__label">Trabajos realizados</span>
          <p className="dato__texto">{visita.trabajos || "—"}</p>
        </div>
      </div>

      <div className="bloque__datos">
        <div className="dato">
          <span className="dato__label">Kilometraje</span>
          <span className="dato__valor num">
            {visita.kilometraje ? `${kilometros.format(visita.kilometraje)} km` : "—"}
          </span>
        </div>
        <div className="dato">
          <span className="dato__label">Mecánico a cargo</span>
          <span className="dato__valor">{visita.mecanico || "—"}</span>
        </div>
      </div>

      <div className="cuenta__filas">
        <div className="cuenta__fila">
          <span>
            <Icon name="llave" size={15} />
            Mano de obra
          </span>
          <span className="num">{pesos.format(manoObra)}</span>
        </div>
      </div>

      <div className="cuenta__total">
        <span className="cuenta__total-label">Total cobrado</span>
        <span className="cuenta__total-valor num">{pesos.format(total)}</span>
      </div>

      {(visita.pendientes?.trim() || visita.observaciones?.trim()) && (
        <div className="bloque__datos">
          {visita.pendientes?.trim() && (
            <div className="dato">
              <span className="dato__label">Pendientes</span>
              <p className="dato__texto">{visita.pendientes}</p>
            </div>
          )}
          {visita.observaciones?.trim() && (
            <div className="dato">
              <span className="dato__label">Observaciones</span>
              <p className="dato__texto">{visita.observaciones}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function FichaIngreso({ vehiculoId, onVolver }) {
  const consulta = useCallback(() => obtenerFichaVehiculo(vehiculoId), [vehiculoId]);
  const { cargando, error, datos: ficha } = useConsulta(consulta, null);

  if (cargando) return <Cargando texto="Abriendo la ficha del vehículo…" />;
  if (error) return <ErrorDatos mensaje={error} />;
  if (!ficha) return null;

  const visitas = ficha.visitas ?? [];
  const ultima = visitas[0];

  return (
    <div className="ficha">
      <header className="ficha__head">
        <Patente valor={ficha.patente} tamano="lg" />

        <div className="ficha__id">
          <span className="eyebrow">Ficha del vehículo</span>
          <h1>{ficha.vehiculo || "Vehículo sin cargar"}</h1>
          <div className="ficha__meta">
            {ultima && <EstadoChip estado={ultima.estado} />}
            <span className="ficha__fecha">
              <Icon name="planilla" size={14} />
              {visitas.length === 1 ? "1 visita" : `${visitas.length} visitas`}
            </span>
          </div>
        </div>
      </header>

      <div className="ficha__grid">
        <section className="bloque">
          <h2 className="bloque__titulo">
            <Icon name="persona" size={17} />
            Cliente
          </h2>
          <div className="bloque__datos">
            <div className="dato">
              <span className="dato__label">Nombre</span>
              <span className="dato__valor">{ficha.cliente || "—"}</span>
            </div>
            <div className="dato">
              <span className="dato__label">Teléfono</span>
              <span className="dato__valor num">{ficha.telefono || "—"}</span>
            </div>
          </div>
        </section>

        <section className="bloque">
          <h2 className="bloque__titulo">
            <Icon name="auto" size={17} />
            Vehículo
          </h2>
          <div className="bloque__datos">
            <div className="dato">
              <span className="dato__label">Patente</span>
              <span className="dato__valor num">{ficha.patente || "—"}</span>
            </div>
            <div className="dato">
              <span className="dato__label">Modelo</span>
              <span className="dato__valor">{ficha.vehiculo || "—"}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="ficha__historial">
        <h2 className="ficha__historial-titulo">Historial de visitas</h2>

        {visitas.length === 0 && (
          <div className="vacio">
            <span className="vacio__icono">
              <Icon name="planilla" size={24} />
            </span>
            <h3>Este vehículo todavía no tiene visitas cargadas</h3>
          </div>
        )}

        <div className="ficha__grid">
          {visitas.map((visita, i) => (
            <Visita key={visita.id} visita={visita} esUltima={i === 0} />
          ))}
        </div>
      </div>

      <button type="button" className="btn btn--outline ficha__volver" onClick={onVolver}>
        <Icon name="izquierda" size={18} />
        Volver
      </button>
    </div>
  );
}

export default FichaIngreso;

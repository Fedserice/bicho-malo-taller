import { useCallback, useState } from "react";
import Icon from "../ui/Icon";
import NumeroAnimado from "../ui/NumeroAnimado";
import Patente from "../ui/Patente";
import EstadoChip from "../ui/EstadoChip";
import { Cargando, ErrorDatos } from "../ui/Estados";
import { descargarComprobanteEntrega } from "../lib/comprobanteHtml";
import { obtenerFichaVehiculo } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import { useToast } from "../ui/useToast";
import "./FichaIngreso.css";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const kilometros = new Intl.NumberFormat("es-AR");

function fechaLocal(valor) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor ?? "");
  if (!partes) return null;

  return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
}

function LineaTiempo({ visitas }) {
  const hoy = new Date();
  const primerMes = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
  const meses = Array.from({ length: 12 }, (_, indice) => {
    const fecha = new Date(primerMes.getFullYear(), primerMes.getMonth() + indice, 1);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

    return {
      clave,
      fecha,
      eventos: [],
    };
  });
  const mesesPorClave = new Map(meses.map((mes) => [mes.clave, mes]));

  visitas.forEach((visita) => {
    const fechas = [
      { valor: visita.fecha, tipo: "ingreso" },
      { valor: visita.fechaEntrega, tipo: "entrega" },
    ];

    fechas.forEach(({ valor, tipo }) => {
      const fecha = fechaLocal(valor);
      if (!fecha) return;

      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      const mes = mesesPorClave.get(clave);
      if (!mes) return;

      const diasDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
      mes.eventos.push({
        id: `${visita.id}-${tipo}`,
        fecha: valor,
        fechaLarga: fecha.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        dia: fecha.getDate(),
        tipo,
        posicion: ((fecha.getDate() - 0.5) / diasDelMes) * 100,
      });
    });
  });

  meses.forEach((mes) => {
    mes.eventos.sort(
      (a, b) =>
        a.fecha.localeCompare(b.fecha) ||
        (a.tipo === b.tipo ? 0 : a.tipo === "ingreso" ? -1 : 1)
    );
  });

  return (
    <section className="linea-tiempo" aria-labelledby="linea-tiempo-titulo">
      <div className="linea-tiempo__encabezado">
        <div>
          <span className="eyebrow">Actividad del vehículo</span>
          <h2 id="linea-tiempo-titulo">Últimos 12 meses</h2>
        </div>
        <div className="linea-tiempo__leyenda" aria-label="Tipos de evento">
          <span><i className="linea-tiempo__punto linea-tiempo__punto--ingreso" />Ingreso</span>
          <span><i className="linea-tiempo__punto linea-tiempo__punto--entrega" />Entrega</span>
        </div>
      </div>

      <div className="linea-tiempo__desplazamiento" tabIndex="0" aria-label="Línea de tiempo mensual">
        <div className="linea-tiempo__meses">
          {meses.map((mes) => (
            <div className="linea-tiempo__mes" key={mes.clave}>
              <h3 title={mes.fecha.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}>
                {mes.fecha.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")}
              </h3>
              <div className="linea-tiempo__eje" aria-hidden="true">
                {mes.eventos.map((evento) => (
                  <span
                    className={`linea-tiempo__marca linea-tiempo__marca--${evento.tipo}`}
                    key={evento.id}
                    style={{ "--posicion": `${evento.posicion}%` }}
                  />
                ))}
              </div>
              {mes.eventos.length > 0 ? (
                <ul className="linea-tiempo__eventos">
                  {mes.eventos.map((evento) => (
                    <li
                      className={`linea-tiempo__evento linea-tiempo__evento--${evento.tipo}`}
                      key={evento.id}
                      title={`${evento.tipo === "ingreso" ? "Ingreso" : "Entrega"}: ${evento.fechaLarga}`}
                    >
                      <time dateTime={evento.fecha}>{evento.dia}</time>
                      <span>{evento.tipo === "ingreso" ? "Ingreso" : "Entrega"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="linea-tiempo__vacio">—</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Visita({ visita, esUltima, vehiculo }) {
  const [descargando, setDescargando] = useState(false);
  const avisar = useToast();
  const manoObra = Number(visita.manoObra) || 0;
  const totalTrabajo = Number(visita.totalTrabajo) || 0;
  const cobrado = Number(visita.totalCobrado) || 0;
  const saldo = manoObra - cobrado;

  async function descargarComprobante() {
    setDescargando(true);
    try {
      await descargarComprobanteEntrega({ visita, vehiculo });
    } catch (error) {
      avisar(error.message || "No se pudo generar el comprobante", "error");
    } finally {
      setDescargando(false);
    }
  }

  return (
    <article className={`bloque bloque--ancho visita ${esUltima ? "visita--actual" : ""}`}>
      <div className="visita__head">
        <h2 className="bloque__titulo visita__titulo">
          <Icon name="llave" size={17} />
          {visita.fecha || "Sin fecha"}
        </h2>
        <div className="visita__acciones">
          <EstadoChip estado={visita.estado} />
          {visita.estado === "Entregado" && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={descargarComprobante}
              disabled={descargando}
              title="Descargar comprobante de entrega"
            >
              {descargando ? (
                <span className="spinner spinner--boton" aria-hidden="true" />
              ) : (
                <Icon name="descargar" size={15} />
              )}
              Imprimir / guardar PDF
            </button>
          )}
        </div>
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
          <span className="num"><NumeroAnimado valor={manoObra} formato={(valor) => pesos.format(valor)} /></span>
        </div>
        <div className="cuenta__fila">
          <span>
            <Icon name="peso" size={15} />
            Total del trabajo
          </span>
          <span className="num"><NumeroAnimado valor={totalTrabajo} formato={(valor) => pesos.format(valor)} /></span>
        </div>
        <div className="cuenta__fila">
          <span>
            <Icon name="tilde" size={15} />
            Cobrado
          </span>
          <span className="num"><NumeroAnimado valor={cobrado} formato={(valor) => pesos.format(valor)} /></span>
        </div>
      </div>

      <div className={`cuenta__total ${saldo > 0 ? "cuenta__total--deuda" : ""}`.trim()}>
        <span className="cuenta__total-label">
          {saldo > 0 ? "Saldo pendiente" : "Saldado"}
        </span>
        <span className="cuenta__total-valor num">
          <NumeroAnimado valor={Math.max(saldo, 0)} formato={(valor) => pesos.format(valor)} />
        </span>
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

function FichaIngreso({ vehiculoId, onVolver, onEditar, onNuevoTrabajo }) {
  const consulta = useCallback(() => obtenerFichaVehiculo(vehiculoId), [vehiculoId]);
  const { cargando, error, datos: ficha } = useConsulta(consulta, null);

  if (cargando) return <Cargando texto="Abriendo la ficha del vehículo…" />;
  if (error) return <ErrorDatos mensaje={error} />;
  if (!ficha) return null;

  const visitas = ficha.visitas ?? [];
  const ultima = visitas[0];

  // Los datos del vehículo y del cliente viajan junto a la visita:
  // el formulario los necesita para poder editarlos también.
  const datosVehiculo = {
    vehiculoId: ficha.id,
    clienteId: ficha.clienteId,
    patente: ficha.patente,
    vehiculo: ficha.vehiculo,
    cliente: ficha.cliente,
    telefono: ficha.telefono,
  };

  // Mientras el auto está en el taller la ficha se puede editar.
  // Una vez entregado, lo que corresponde es abrir un trabajo nuevo.
  const enTaller = Boolean(ultima) && ultima.estado !== "Entregado";

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

      <LineaTiempo visitas={visitas} />

      <div className="ficha__acciones">
        {enTaller ? (
          <button
            type="button"
            className="btn btn--solid"
            onClick={() => onEditar?.({ ...ultima, ...datosVehiculo })}
          >
            <Icon name="lapiz" size={17} />
            Editar trabajo
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onNuevoTrabajo?.(datosVehiculo)}
          >
            <Icon name="mas" size={17} />
            Nuevo trabajo
          </button>
        )}
      </div>

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
              <Visita key={visita.id} visita={visita} esUltima={i === 0} vehiculo={ficha} />
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

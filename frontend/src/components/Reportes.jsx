import { useCallback, useState } from "react";
import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import EstadoChip from "../ui/EstadoChip";
import { Cargando, ErrorDatos } from "../ui/Estados";
import { useToast } from "../ui/useToast";
import { obtenerReportes, listarVisitasDelMes, actualizarCobroVisita } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import "./Reportes.css";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Registra un pago sobre una visita: suma el monto ingresado al total cobrado. */
function RegistrarPago({ visitaId, manoObra, cobradoActual, onGuardado }) {
  const [abierto, setAbierto] = useState(false);
  const [monto, setMonto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const avisar = useToast();

  const montoNum = Number(monto) || 0;
  const nuevoCobrado = cobradoActual + montoNum;
  const nuevoSaldo = manoObra - nuevoCobrado;

  async function guardar() {
    if (montoNum <= 0) {
      avisar("Ingresá un monto mayor a 0", "error");
      return;
    }

    setGuardando(true);

    try {
      await actualizarCobroVisita(visitaId, nuevoCobrado);
      avisar("Pago registrado", "ok");
      setAbierto(false);
      setMonto("");
      onGuardado();
    } catch (error) {
      avisar(error.message || "No se pudo registrar el pago", "error");
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <button type="button" className="reportes__pago-boton" onClick={() => setAbierto(true)}>
        Registrar pago
      </button>
    );
  }

  return (
    <span className="reportes__pago-form">
      <input
        type="number"
        inputMode="numeric"
        className="reportes__pago-input"
        placeholder="Monto pagado"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        autoFocus
      />

      {montoNum > 0 && (
        <span className="reportes__pago-preview num">Nuevo saldo: {pesos.format(nuevoSaldo)}</span>
      )}

      <button
        type="button"
        className="btn-icon"
        onClick={guardar}
        disabled={guardando}
        aria-label="Confirmar pago"
        title="Confirmar"
      >
        <Icon name="tilde" size={14} />
      </button>

      <button
        type="button"
        className="btn-icon"
        onClick={() => {
          setAbierto(false);
          setMonto("");
        }}
        disabled={guardando}
        aria-label="Cancelar"
        title="Cancelar"
      >
        <Icon name="cerrar" size={14} />
      </button>
    </span>
  );
}

/** Acordeón de un mes: al abrirse, trae el detalle de trabajos entregados ese mes. */
function MesAcordeon({ mes }) {
  const [abierto, setAbierto] = useState(false);
  const consulta = useCallback(() => listarVisitasDelMes(mes.clave), [mes.clave]);
  const { cargando, error, datos, recargar } = useConsulta(abierto ? consulta : null, []);
  const visitas = datos ?? [];

  return (
    <div className="reportes__mes">
      <button
        type="button"
        className="reportes__mes-head"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        <span className="reportes__mes-nombre">{mes.mes}</span>
        <span className="reportes__mes-total num">{pesos.format(mes.total)}</span>
        <Icon
          name="chevron"
          size={16}
          className={`reportes__mes-flecha ${abierto ? "reportes__mes-flecha--abierta" : ""}`}
        />
      </button>

      {abierto && (
        <div className="reportes__mes-detalle">
          {cargando && <Cargando texto="Trayendo los trabajos del mes…" />}
          {error && <ErrorDatos mensaje={error} />}
          {!cargando && !error && visitas.length === 0 && (
            <p className="reportes__vacio">No hay trabajos entregados este mes.</p>
          )}
          {!cargando && visitas.length > 0 && (
            <ul className="reportes__mes-lista">
              {visitas.map((v) => (
                <li className="reportes__mes-item" key={v.id}>
                  <Patente valor={v.patente} tamano="sm" />
                  <span className="reportes__mes-item-info">
                    <span className="reportes__mes-item-vehiculo">
                      {v.vehiculo || "Vehículo sin cargar"}
                    </span>
                    <span className="reportes__mes-item-cliente">
                      {v.cliente || "Sin cliente"} · {v.mecanico || "Sin mecánico"}
                    </span>
                  </span>
                  <span className="reportes__mes-item-montos num">
                    <span>Cobrado {pesos.format(v.totalCobrado)}</span>
                    {v.saldo > 0 && (
                      <span className="reportes__mes-item-deuda">
                        Debe {pesos.format(v.saldo)}
                      </span>
                    )}
                  </span>
                  <RegistrarPago
                    visitaId={v.id}
                    manoObra={v.manoObra}
                    cobradoActual={v.totalCobrado}
                    onGuardado={recargar}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Reportes() {
  const consulta = useCallback(() => obtenerReportes(), []);
  const { cargando, error, datos, recargar } = useConsulta(consulta, null);

  if (cargando) return <Cargando texto="Calculando los números del taller…" />;
  if (error) return <ErrorDatos mensaje={error} />;
  if (!datos) return null;

  const { totalFacturado, trabajosEntregados, facturacionMensual, porMecanico, saldos } = datos;
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

        <div className={`cifra ${saldos.totalSaldos > 0 ? "cifra--deuda" : ""}`.trim()}>
          <span className="cifra__label">Saldos pendientes</span>
          <span className="cifra__valor cifra__valor--monto num">
            {pesos.format(saldos.totalSaldos)}
          </span>
          <span className="cifra__pie">
            {saldos.deudores.length === 1
              ? "1 cliente debe"
              : `${saldos.deudores.length} clientes deben`}
          </span>
        </div>
      </section>

      {/* SALDOS PENDIENTES — quién debe y por qué trabajo */}
      <section className="bloque bloque--ancho reportes__bloque">
        <h2 className="bloque__titulo">
          <Icon name="peso" size={17} />
          Saldos pendientes
        </h2>

        {saldos.trabajos.length === 0 ? (
          <p className="reportes__vacio">
            No hay plata pendiente de cobro: todos los trabajos están saldados.
          </p>
        ) : (
          <>
            <h3 className="reportes__subtitulo">Deudores</h3>
            <ul className="deudores">
              {saldos.deudores.map((d) => (
                <li className="deudor" key={d.cliente}>
                  <span className="deudor__nombre">
                    <Icon name="persona" size={15} />
                    {d.cliente}
                  </span>
                  {d.telefono && <span className="deudor__tel num">{d.telefono}</span>}
                  <span className="deudor__trabajos">
                    {d.trabajos} {d.trabajos === 1 ? "trabajo" : "trabajos"}
                  </span>
                  <span className="deudor__saldo num">{pesos.format(d.saldo)}</span>
                </li>
              ))}
            </ul>

            <h3 className="reportes__subtitulo">Detalle por trabajo</h3>
            <ul className="saldos">
              {saldos.trabajos.map((t) => (
                <li className="saldo" key={t.id}>
                  <Patente valor={t.patente} tamano="sm" />

                  <span className="saldo__id">
                    <span className="saldo__vehiculo">{t.vehiculo || "Vehículo sin cargar"}</span>
                    <span className="saldo__cliente">
                      {t.cliente}
                      {t.fecha && (
                        <>
                          <span className="saldo__punto" aria-hidden="true" />
                          <span className="num">{t.fecha}</span>
                        </>
                      )}
                    </span>
                  </span>

                  <EstadoChip estado={t.estado} />

                  <span className="saldo__cuentas num">
                    <span className="saldo__linea">Mano de obra {pesos.format(t.manoObra)}</span>
                    <span className="saldo__linea">Cobrado {pesos.format(t.cobrado)}</span>
                  </span>

                  <span className="saldo__monto num">{pesos.format(t.saldo)}</span>

                  <RegistrarPago
                    visitaId={t.id}
                    manoObra={t.manoObra}
                    cobradoActual={t.cobrado}
                    onGuardado={recargar}
                  />
                </li>
              ))}
            </ul>

            <div className="cuenta__total cuenta__total--deuda saldos__total">
              <span className="cuenta__total-label">Total a cobrar</span>
              <span className="cuenta__total-valor num">{pesos.format(saldos.totalSaldos)}</span>
            </div>
          </>
        )}
      </section>

      {/* FACTURACIÓN MES A MES — cada mes se abre y muestra su detalle */}
      <section className="bloque bloque--ancho reportes__bloque">
        <h2 className="bloque__titulo">
          <Icon name="grafico" size={17} />
          Facturación por mes
        </h2>

        {facturacionMensual.length === 0 ? (
          <p className="reportes__vacio">Todavía no hay trabajos entregados para mostrar.</p>
        ) : (
          <div className="reportes__meses">
            {facturacionMensual.map((mes) => (
              <MesAcordeon key={mes.clave} mes={mes} />
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

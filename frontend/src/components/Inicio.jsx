import { useCallback, useEffect, useState } from "react";
import Icon from "../ui/Icon";
import NumeroAnimado from "../ui/NumeroAnimado";
import { ErrorDatos } from "../ui/Estados";
import Kanban from "./Kanban";
import Buscar from "./Buscar";
import { obtenerResumen } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import "./Inicio.css";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const RESUMEN_VACIO = { enTaller: 0, cerrados: 0, facturado: 0 };

function Inicio({ onAbrirFicha, onEditar }) {
  const consulta = useCallback(() => obtenerResumen(), []);
  const { cargando, error, datos } = useConsulta(consulta, RESUMEN_VACIO);

  const [texto, setTexto] = useState("");
  const [consultaFirme, setConsultaFirme] = useState("");
  const [verTotal, setVerTotal] = useState(false);

  // Se espera a que dejen de tipear antes de pegarle a la base.
  useEffect(() => {
    const espera = setTimeout(() => setConsultaFirme(texto.trim()), 300);
    return () => clearTimeout(espera);
  }, [texto]);

  const resumen = datos ?? RESUMEN_VACIO;
  const buscando = texto.trim() !== "";

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="inicio">
      <header className="inicio__head">
        <span className="eyebrow">{hoy}</span>
        <h1>Panel del taller</h1>
      </header>

      {/* Buscador: patente, cliente, vehículo o trabajo realizado */}
      <div className="buscador">
        <Icon name="buscar" size={20} className="buscador__lupa" />
        <input
          type="search"
          className="buscador__input"
          placeholder="Buscar por patente, cliente, vehículo o trabajo…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoCapitalize="none"
          spellCheck="false"
          aria-label="Buscar vehículos"
        />
        {texto && (
          <button
            type="button"
            className="btn-icon buscador__limpiar"
            onClick={() => setTexto("")}
            aria-label="Borrar la búsqueda"
          >
            <Icon name="cerrar" size={16} />
          </button>
        )}
      </div>

      {/* Buscando, los resultados ocupan el lugar del tablero */}
      {buscando ? (
        <Buscar
          consulta={consultaFirme || texto.trim()}
          escribiendo={texto.trim() !== consultaFirme}
          onSeleccionar={onAbrirFicha}
        />
      ) : (
        <>
          {error && <ErrorDatos mensaje={error} />}

          <section className="inicio__cifras" aria-label="Resumen del taller">
            <div className="cifra">
              <span className="cifra__label">Entregados este mes</span>
              <span className="cifra__valor num">
                {cargando ? "—" : <NumeroAnimado valor={resumen.cerrados} />}
              </span>
              <span className="cifra__pie">en el historial</span>
            </div>

            <div className="cifra">
              <span className="cifra__label">Total cobrado este mes</span>
              <span className="cifra__valor cifra__valor--monto num cifra__valor--con-ojo">
                {cargando ? "—" : verTotal ? (
                  <NumeroAnimado valor={resumen.facturado} formato={(valor) => pesos.format(valor)} />
                ) : "••••••"}
                <button
                  type="button"
                  className="btn-icon cifra__ojo"
                  onClick={() => setVerTotal((v) => !v)}
                  aria-label={verTotal ? "Ocultar total cobrado" : "Mostrar total cobrado"}
                  title={verTotal ? "Ocultar" : "Mostrar"}
                >
                  {verTotal ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.4 18.4 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </span>
              <span className="cifra__pie">sobre trabajos entregados</span>
            </div>
          </section>

          {/* El tablero vive acá: es lo primero que se mira al abrir la app */}
          <section className="inicio__tablero" aria-label="Tablero del taller">
            <header className="inicio__seccion-head">
              <h2>Tablero</h2>
              <p>Los autos que están adentro. Al entregarlos pasan al historial.</p>
            </header>

            <Kanban
              embebido
              onSeleccionar={onAbrirFicha}
              onEditar={onEditar}
            />
          </section>

        </>
      )}
    </div>
  );
}

export default Inicio;
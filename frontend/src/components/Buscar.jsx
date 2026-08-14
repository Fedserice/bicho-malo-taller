import { useCallback, useEffect, useState } from "react";
import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import EstadoChip from "../ui/EstadoChip";
import { Cargando, ErrorDatos } from "../ui/Estados";
import { buscarIngresos } from "../lib/datos";
import { useConsulta } from "../lib/useConsulta";
import "./Buscar.css";

function Buscar() {
  const [texto, setTexto] = useState("");
  const [consultaFirme, setConsultaFirme] = useState("");

  // Se espera a que dejen de tipear antes de pegarle a la base.
  useEffect(() => {
    const espera = setTimeout(() => setConsultaFirme(texto.trim()), 300);
    return () => clearTimeout(espera);
  }, [texto]);

  const consulta = useCallback(() => buscarIngresos(consultaFirme), [consultaFirme]);
  const { cargando, error, datos } = useConsulta(consulta, []);

  const resultados = datos ?? [];
  const buscando = consultaFirme !== "" && (cargando || texto.trim() !== consultaFirme);

  return (
    <div className="buscar">
      <header className="pantalla-head">
        <div className="pantalla-head__texto">
          <span className="eyebrow">Historial completo</span>
          <h1>Buscar</h1>
          <p>Por patente, cliente, vehículo o lo que se le hizo al auto.</p>
        </div>

        {consultaFirme && !buscando && !error && (
          <div className="pantalla-head__cuenta">
            <strong>{resultados.length}</strong>
            {resultados.length === 1 ? "resultado" : "resultados"}
          </div>
        )}
      </header>

      <div className="buscador">
        <Icon name="buscar" size={20} className="buscador__lupa" />
        <input
          type="search"
          className="buscador__input"
          placeholder="AA123CD, Juan Pérez, cambio de aceite…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoFocus
          autoCapitalize="none"
          spellCheck="false"
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

      {error && <ErrorDatos mensaje={error} />}

      {!texto.trim() && !error && (
        <div className="vacio">
          <span className="vacio__icono">
            <Icon name="buscar" size={24} />
          </span>
          <h3>Escribí algo para empezar</h3>
          <p>Alcanza con parte de la patente o el nombre del cliente.</p>
        </div>
      )}

      {buscando && <Cargando texto="Buscando…" />}

      {!buscando && !error && consultaFirme && resultados.length === 0 && (
        <div className="vacio">
          <span className="vacio__icono">
            <Icon name="bandeja" size={24} />
          </span>
          <h3>Sin resultados</h3>
          <p>
            Ningún trabajo coincide con “{consultaFirme}”. Probá con menos letras o con la patente.
          </p>
        </div>
      )}

      {!buscando && resultados.length > 0 && (
        <div className="resultados stagger">
          {resultados.map((ingreso, i) => (
            <article key={ingreso.id} className="resultado" style={{ "--i": i }}>
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
                    Fecha
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
      )}
    </div>
  );
}

export default Buscar;

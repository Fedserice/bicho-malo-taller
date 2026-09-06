import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToastContext } from "./toastContext";
import Icon from "./Icon";

const DURACION = 3400;
const SALIDA = 280;

const ICONOS = {
  ok: "tildeCirculo",
  error: "alerta",
  info: "auto",
};

function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const temporizadores = useRef(new Map());

  const quitar = useCallback((id) => {
    // Primero se apaga (transición de salida), después se desmonta.
    setAvisos((previos) =>
      previos.map((a) => (a.id === id ? { ...a, visible: false } : a))
    );

    const salida = setTimeout(() => {
      setAvisos((previos) => previos.filter((a) => a.id !== id));
      temporizadores.current.delete(`salida-${id}`);
    }, SALIDA);

    temporizadores.current.set(`salida-${id}`, salida);
  }, []);

  const avisar = useCallback(
    (mensaje, tipo = "ok") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setAvisos((previos) => [...previos.slice(-2), { id, mensaje, tipo, visible: false }]);

      // Un frame apagado para que la transición de entrada tenga desde dónde salir.
      const entrada = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAvisos((previos) =>
            previos.map((a) => (a.id === id ? { ...a, visible: true } : a))
          );
        });
      });

      const cierre = setTimeout(() => quitar(id), DURACION);
      temporizadores.current.set(`entrada-${id}`, entrada);
      temporizadores.current.set(`cierre-${id}`, cierre);
    },
    [quitar]
  );

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => {
      pendientes.forEach((valor, clave) => {
        if (clave.startsWith("entrada-")) cancelAnimationFrame(valor);
        else clearTimeout(valor);
      });
      pendientes.clear();
    };
  }, []);

  const valor = useMemo(() => avisar, [avisar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}

      <div className="toasts" role="status" aria-live="polite">
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className={`toast toast--${aviso.tipo} ${aviso.visible ? "toast--visible" : ""}`.trim()}
          >
            <Icon name={ICONOS[aviso.tipo] || "tildeCirculo"} className="toast__icono" />
            <span>{aviso.mensaje}</span>
            <button
              type="button"
              className="btn-icon toast__cerrar"
              onClick={() => quitar(aviso.id)}
              aria-label="Cerrar aviso"
            >
              <Icon name="cerrar" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;

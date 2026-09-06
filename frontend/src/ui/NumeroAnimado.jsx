import { useEffect, useRef, useState } from "react";

const DURACION = 720;

function NumeroAnimado({ valor = 0, formato = (numero) => String(Math.round(numero)), duracion = DURACION }) {
  const objetivo = Number(valor) || 0;
  const [actual, setActual] = useState(0);
  const anterior = useRef(0);

  useEffect(() => {
    const inicio = performance.now();
    const desde = anterior.current;
    let frame;

    function avanzar(marca) {
      const progreso = Math.min((marca - inicio) / duracion, 1);
      const suave = 1 - Math.pow(1 - progreso, 3);
      const siguiente = desde + (objetivo - desde) * suave;
      setActual(siguiente);

      if (progreso < 1) {
        frame = requestAnimationFrame(avanzar);
      } else {
        anterior.current = objetivo;
      }
    }

    frame = requestAnimationFrame(avanzar);
    return () => cancelAnimationFrame(frame);
  }, [duracion, objetivo]);

  return <span>{formato(actual)}</span>;
}

export default NumeroAnimado;

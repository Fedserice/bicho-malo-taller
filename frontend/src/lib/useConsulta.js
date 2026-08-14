import { useEffect, useState } from "react";

/**
 * Corre una consulta y devuelve { cargando, error, datos }.
 * `consulta` tiene que venir memorizada con useCallback.
 */
export function useConsulta(consulta, inicial = null) {
  const [estado, setEstado] = useState({ cargando: true, error: null, datos: inicial });

  useEffect(() => {
    let vigente = true;

    consulta()
      .then((datos) => {
        if (vigente) setEstado({ cargando: false, error: null, datos });
      })
      .catch((error) => {
        if (vigente) {
          setEstado({
            cargando: false,
            error: error.message || "No se pudieron traer los datos.",
            datos: inicial,
          });
        }
      });

    return () => {
      vigente = false;
    };
    // `inicial` es solo el valor de arranque; no debe reiniciar la consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta]);

  return estado;
}

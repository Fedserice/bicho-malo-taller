import { useCallback, useEffect, useState } from "react";

/**
 * Corre una consulta y devuelve { cargando, error, datos, recargar }.
 * `consulta` tiene que venir memorizada con useCallback.
 * Si `consulta` es null/undefined, no ejecuta nada (útil para
 * acordeones que solo cargan datos cuando se abren).
 */
export function useConsulta(consulta, inicial = null) {
  const [estado, setEstado] = useState({
    cargando: Boolean(consulta),
    error: null,
    datos: inicial,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!consulta) {
      setEstado({ cargando: false, error: null, datos: inicial });
      return;
    }

    let vigente = true;
    setEstado((previo) => ({ ...previo, cargando: true }));

    consulta()
      .then((datos) => {
        if (vigente) setEstado({ cargando: false, error: null, datos });
      })
      .catch((error) => {
        if (vigente) {
          setEstado({
            cargando: false,
            error: error?.message || "No se pudieron traer los datos.",
            datos: inicial,
          });
        }
      });

    return () => {
      vigente = false;
    };
    // `inicial` es solo el valor de arranque; no debe reiniciar la consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return { ...estado, recargar };
}
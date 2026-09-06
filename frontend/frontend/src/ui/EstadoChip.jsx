/**
 * Chip de estado del trabajo.
 * El ámbar de la marca marca el trabajo en curso: el color más fuerte
 * de la pantalla señala lo que está pasando ahora en el taller.
 */
const VARIANTES = {
  pendiente: "",
  "en reparación": "chip--activo",
  "en reparacion": "chip--activo",
  finalizado: "chip--ok",
  entregado: "chip--info",
};

function EstadoChip({ estado }) {
  const clave = (estado || "").toLowerCase().trim();
  const variante = VARIANTES[clave] ?? "";

  return (
    <span className={`chip ${variante}`.trim()}>
      <span className="chip__punto" aria-hidden="true" />
      {estado || "Sin estado"}
    </span>
  );
}

export default EstadoChip;

/**
 * Chapa patente. Es el identificador visual de cada registro en toda
 * la app, así que se dibuja como una patente real en lugar de como
 * una etiqueta más.
 */
function Patente({ valor, tamano = "md" }) {
  const texto = (valor || "").trim();
  const vacia = texto === "";

  return (
    <span
      className={`patente patente--${tamano} ${vacia ? "patente--vacia" : ""}`.trim()}
      title={vacia ? "Sin patente cargada" : `Patente ${texto.toUpperCase()}`}
    >
      <span className="patente__tira" aria-hidden="true" />
      <span className="patente__texto">{vacia ? "sin patente" : texto.toUpperCase()}</span>
    </span>
  );
}

export default Patente;

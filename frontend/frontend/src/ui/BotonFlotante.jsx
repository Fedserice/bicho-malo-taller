import Icon from "./Icon";
import "./BotonFlotante.css";

/** Accesos flotantes globales para los tres destinos operativos principales. */
function BotonFlotante({ onClick, tipo = "nuevo", etiqueta }) {
  const icono = tipo === "historial" ? "planilla" : tipo === "reportes" ? "grafico" : "mas";
  const clase = `fab fab--${tipo}`;

  return (
    <button type="button" className={clase} onClick={onClick} aria-label={etiqueta}>
      <Icon name={icono} size={tipo === "nuevo" ? 26 : 23} strokeWidth={2.4} />
    </button>
  );
}

export default BotonFlotante;

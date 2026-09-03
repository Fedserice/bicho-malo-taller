import Icon from "./Icon";
import "./BotonFlotante.css";

/** El acceso a "Nuevo ingreso": un + redondo, siempre a mano, como el
 * botón de crear de una app de celular. Vive en App.jsx, fuera de
 * cada pantalla, para estar disponible desde cualquier lado. */
function BotonFlotante({ onClick }) {
  return (
    <button type="button" className="fab" onClick={onClick} aria-label="Nuevo ingreso">
      <Icon name="mas" size={26} strokeWidth={2.4} />
    </button>
  );
}

export default BotonFlotante;

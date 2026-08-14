import Icon from "./Icon";

export function Cargando({ texto = "Buscando en el taller…" }) {
  return (
    <div className="cargando" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}

export function ErrorDatos({ mensaje }) {
  return (
    <p className="aviso-error" role="alert">
      <Icon name="alerta" size={18} />
      <span>{mensaje}</span>
    </p>
  );
}

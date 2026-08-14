import { useState } from "react";
import Icon from "../ui/Icon";
import Patente from "../ui/Patente";
import "./Login.css";

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState("");

  function ingresar(e) {
    e.preventDefault();

    if (usuario.trim() === "taller" && contrasena.trim() === "1234") {
      setError("");
      onLogin();
    } else {
      setError("Usuario o contraseña incorrectos. Revisá los datos e intentá de nuevo.");
    }
  }

  return (
    <div className="login">
      <div className="franja" aria-hidden="true" />

      <div className="login__grid">
        {/* Panel de marca: la chapa es la identidad del taller */}
        <aside className="login__marca">
          <div className="login__marca-top">
            <Patente valor="BICHO MALO" tamano="lg" />
          </div>

          <div className="login__marca-texto">
            <h1>
              Bicho Malo
              <span>Taller</span>
            </h1>
            <p>
              Ingresos, vehículos en el taller e historial de trabajos. Todo en un solo lugar.
            </p>
          </div>

          <ul className="login__lista">
            <li>
              <Icon name="mas" size={16} />
              Cargá un ingreso en minutos
            </li>
            <li>
              <Icon name="auto" size={16} />
              Seguí los autos que están en el taller
            </li>
            <li>
              <Icon name="buscar" size={16} />
              Buscá cualquier trabajo por patente
            </li>
          </ul>
        </aside>

        {/* Panel de acceso */}
        <main className="login__acceso">
          <div className="login__caja">
            <div className="login__caja-head">
              <span className="login__escudo">
                <Icon name="escudo" size={22} />
              </span>
              <div>
                <h2>Acceso al sistema</h2>
                <p>Entrá con el usuario del taller</p>
              </div>
            </div>

            <form onSubmit={ingresar} className="login__form" noValidate>
              <div className="campo">
                <label htmlFor="usuario">Usuario</label>
                <input
                  id="usuario"
                  type="text"
                  placeholder="taller"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value);
                    if (error) setError("");
                  }}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                />
              </div>

              <div className="campo">
                <label htmlFor="contrasena">Contraseña</label>
                <div className="login__clave">
                  <input
                    id="contrasena"
                    type={verClave ? "text" : "password"}
                    placeholder="••••"
                    value={contrasena}
                    onChange={(e) => {
                      setContrasena(e.target.value);
                      if (error) setError("");
                    }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="btn-icon login__ver"
                    onClick={() => setVerClave((v) => !v)}
                    aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <Icon name={verClave ? "ojoTachado" : "ojo"} size={18} />
                  </button>
                </div>
              </div>

              {error && (
                <p className="login__error" role="alert">
                  <Icon name="alerta" size={16} />
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn--primary btn--lg btn--block">
                Entrar
                <Icon name="derecha" size={18} />
              </button>
            </form>
          </div>

          <p className="login__pie">
            <Icon name="candado" size={14} />
            Uso interno del taller
          </p>
        </main>
      </div>
    </div>
  );
}

export default Login;

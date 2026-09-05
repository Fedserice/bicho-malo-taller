import { useState } from "react";
import Icon from "../ui/Icon";
import logo from "../assets/logo.png";
import { supabase } from "../lib/supabase";
import "./Login.css";

/** Los mensajes de Supabase vienen en inglés y en tono técnico. */
function traducirError(mensaje = "") {
  const texto = mensaje.toLowerCase();

  if (texto.includes("invalid login credentials")) {
    return "Email o contraseña incorrectos. Revisá los datos e intentá de nuevo.";
  }
  if (texto.includes("email not confirmed")) {
    return "Ese usuario todavía no confirmó su email.";
  }
  if (texto.includes("too many requests") || texto.includes("rate limit")) {
    return "Demasiados intentos seguidos. Esperá un minuto y probá otra vez.";
  }
  if (texto.includes("failed to fetch") || texto.includes("network")) {
    return "No hay conexión con el servidor. Fijate si tenés internet.";
  }

  return mensaje || "No se pudo entrar. Probá de nuevo.";
}

function Login() {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function ingresar(e) {
    e.preventDefault();

    if (!email.trim() || !contrasena) {
      setError("Completá el email y la contraseña.");
      return;
    }

    setEntrando(true);
    setError("");

    const { error: fallo } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: contrasena,
    });

    if (fallo) {
      setError(traducirError(fallo.message));
      setEntrando(false);
      return;
    }

    // Con sesión válida, App cambia solo por onAuthStateChange.
  }

  function alEscribir(setter) {
    return (e) => {
      setter(e.target.value);
      if (error) setError("");
    };
  }

  return (
    <div className="login">
      <div className="franja" aria-hidden="true" />

      <div className="login__grid">
        {/* Panel de marca: la chapa es la identidad del taller */}
        <aside className="login__marca">
          <div className="login__marca-top">
            <img src={logo} alt="Bicho Malo Taller" className="login__logo" />
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
                <p>Entrá con tu cuenta del taller</p>
              </div>
            </div>

            <form onSubmit={ingresar} className="login__form" noValidate>
              <div className="campo">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="nombre@taller.com"
                  value={email}
                  onChange={alEscribir(setEmail)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  disabled={entrando}
                />
              </div>

              <div className="campo">
                <label htmlFor="contrasena">Contraseña</label>
                <div className="login__clave">
                  <input
                    id="contrasena"
                    type={verClave ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={contrasena}
                    onChange={alEscribir(setContrasena)}
                    autoComplete="current-password"
                    disabled={entrando}
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

              <button
                type="submit"
                className="btn btn--primary btn--lg btn--block"
                disabled={entrando}
              >
                {entrando ? (
                  <>
                    <span className="spinner spinner--boton" aria-hidden="true" />
                    Entrando…
                  </>
                ) : (
                  <>
                    Entrar
                    <Icon name="derecha" size={18} />
                  </>
                )}
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

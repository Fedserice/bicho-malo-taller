import { useState } from "react";
import "./Login.css";

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");

  function ingresar(e) {
    e.preventDefault();

    if (usuario.trim() === "taller" && contrasena.trim() === "1234") {
      onLogin();
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* CABECERA */}
        <div className="login-header">
          <div className="login-icon">🚗</div>
          <h1>Bicho Malo Taller</h1>
          <p>Acceso al sistema de gestión</p>
        </div>

        {/* FORMULARIO DE INGRESO */}
        <form onSubmit={ingresar} className="login-form">
          <div className="input-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              type="text"
              placeholder="Ingresá tu usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              placeholder="Ingresá tu contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-login">
            Ingresar al sistema ➔
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
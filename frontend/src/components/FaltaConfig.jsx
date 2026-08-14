import Icon from "../ui/Icon";
import "./FaltaConfig.css";

/**
 * Se muestra cuando la app no tiene las credenciales de Supabase.
 * Es un error de instalación, no del usuario: dice exactamente qué falta.
 */
function FaltaConfig() {
  return (
    <div className="config">
      <div className="franja" aria-hidden="true" />

      <div className="config__caja">
        <span className="config__icono">
          <Icon name="alerta" size={22} />
        </span>

        <h1>Falta conectar la base de datos</h1>
        <p>
          La app no encuentra las credenciales de Supabase, así que no puede entrar ni leer los
          ingresos.
        </p>

        <ol className="config__pasos">
          <li>
            Copiá <code>.env.example</code> como <code>.env.local</code> dentro de{" "}
            <code>frontend/</code>.
          </li>
          <li>
            Completá <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> con los
            datos de Supabase → Project Settings → API.
          </li>
          <li>
            Reiniciá <code>npm run dev</code>: Vite lee las variables al arrancar.
          </li>
        </ol>
      </div>
    </div>
  );
}

export default FaltaConfig;

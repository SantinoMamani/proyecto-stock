import { useState } from "react";
import { login } from "../api";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      await login(usuario.trim(), clave);
      onLogin();
    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  }

  return (
    <div className="login">
      <form className="login-caja" onSubmit={enviar}>
        <h1>Maestro de Ítems</h1>
        {error && <div className="error">{error}</div>}
        <label className="login-campo">
          Usuario
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoFocus
          />
        </label>
        <label className="login-campo">
          Clave
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />
        </label>
        <button type="submit" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
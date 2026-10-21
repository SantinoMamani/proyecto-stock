const API = import.meta.env.VITE_API_URL || "";
const BASE = `${API}/api/items`;
const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const cerrarSesion = () => localStorage.removeItem(TOKEN_KEY);

async function request(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    cerrarSesion();
    window.location.reload();
    throw new Error("Sesión vencida");
  }

  if (!res.ok) {
    let mensaje = "Error en la solicitud";
    try {
      const data = await res.json();
      mensaje = data.error || mensaje;
    } catch {
      // sin cuerpo JSON
    }
    throw new Error(mensaje);
  }
  if (res.status === 204) return null;
  return res.json();
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function login(usuario, clave) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ usuario, clave }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo iniciar sesión");
  localStorage.setItem(TOKEN_KEY, data.token);
}

export const listarItems = ({ q = "", page = 1, limit = 10 }) =>
  request(`${BASE}?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);

export const obtenerItem = (itm) => request(`${BASE}/${itm}`);

export const crearItem = (data) =>
  request(BASE, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });

export const modificarItem = (itm, data) =>
  request(`${BASE}/${itm}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });

export const borrarItem = (itm) => request(`${BASE}/${itm}`, { method: "DELETE" });
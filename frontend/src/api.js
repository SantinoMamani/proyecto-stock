const BASE = "/api/items";

async function request(url, options) {
  const res = await fetch(url, options);
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
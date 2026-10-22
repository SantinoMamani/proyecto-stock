import { useEffect, useState } from "react";
import { getToken, cerrarSesion } from "../api";

const API = import.meta.env.VITE_API_URL || "";

export default function Resumen() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/resumen`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          cerrarSesion();
          window.location.reload();
          return null;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Error al cargar el resumen");
        return data;
      })
      .then((data) => data && setDatos(data))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="pantalla">
        <div className="error">{error}</div>
      </div>
    );
  }
  if (!datos) return <p className="pantalla">Cargando...</p>;

  const tarjetas = [
    ["Ítems totales", datos.totalItems, false],
    ["Con stock", datos.conStock, false],
    ["Sin stock", datos.sinStock, false],
    ["Bajo mínimo", datos.bajoMinimo, datos.bajoMinimo > 0],
    ["Unidades en stock", datos.unidades, false],
    ["Entradas (7 días)", datos.entradas7d, false],
    ["Ventas (7 días)", datos.ventas7d, false],
  ];

  return (
    <div className="pantalla">
      <h1>Resumen de Stock</h1>

      <div className="tarjetas">
        {tarjetas.map(([titulo, valor, alerta]) => (
          <div className={alerta ? "tarjeta alerta" : "tarjeta"} key={titulo}>
            <span>{titulo}</span>
            <b>{valor}</b>
          </div>
        ))}
      </div>

      {datos.bajoMinimo > 0 && (
        <div className="bloque-resumen">
          <h2>Ítems en o por debajo del stock mínimo</h2>
          <table className="grilla">
            <thead>
              <tr>
                <th>Short Item No</th>
                <th>Item Number</th>
                <th>Description</th>
                <th>Stock actual</th>
                <th>Stock mínimo</th>
              </tr>
            </thead>
            <tbody>
              {datos.listaBajoMinimo.map((i) => (
                <tr key={i.itm} className="alerta">
                  <td className="num">{i.itm}</td>
                  <td>{i.litm || "(sin número)"}</td>
                  <td>{i.dsc1}</td>
                  <td className="num">
                    <b>{i.stock}</b>
                  </td>
                  <td className="num">{i.stmn}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {datos.bajoMinimo > datos.listaBajoMinimo.length && (
            <p className="nota">
              Mostrando {datos.listaBajoMinimo.length} de {datos.bajoMinimo}.
            </p>
          )}
        </div>
      )}

      <div className="dos-col">
        <div>
          <h2>Últimos movimientos</h2>
          <table className="grilla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ítem</th>
                <th>Tipo</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {datos.ultimos.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha).toLocaleString("es-AR")}</td>
                  <td>{m.litm || m.itm} - {m.dsc1}</td>
                  <td>{m.tipo === "ENTRADA" ? "Entrada" : "Venta"}</td>
                  <td className="num">
                    {m.tipo === "ENTRADA" ? "+" : "-"}
                    {m.cantidad}
                  </td>
                </tr>
              ))}
              {datos.ultimos.length === 0 && (
                <tr>
                  <td colSpan={4} className="vacio">
                    Sin movimientos todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2>Ítems sin stock</h2>
          <table className="grilla">
            <thead>
              <tr>
                <th>Short Item No</th>
                <th>Item Number</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {datos.listaSinStock.map((i) => (
                <tr key={i.itm}>
                  <td className="num">{i.itm}</td>
                  <td>{i.litm || "(sin número)"}</td>
                  <td>{i.dsc1}</td>
                </tr>
              ))}
              {datos.listaSinStock.length === 0 && (
                <tr>
                  <td colSpan={3} className="vacio">
                    Todos los ítems tienen stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {datos.sinStock > datos.listaSinStock.length && (
            <p className="nota">
              Mostrando {datos.listaSinStock.length} de {datos.sinStock}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
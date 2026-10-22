import { useEffect, useState } from "react";
import { listarStock, listarMovimientos, crearMovimiento } from "../api";

const LIMIT = 10;

export default function Stock() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [movs, setMovs] = useState([]);
  const [tipo, setTipo] = useState("ENTRADA");
  const [cantidad, setCantidad] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);

  async function cargar() {
    try {
      const data = await listarStock({ q: busqueda, page, limit: LIMIT });
      setItems(data.items);
      setTotal(data.total);
      setSeleccionado((sel) =>
        sel ? data.items.find((i) => i.itm === sel.itm) || sel : sel
      );
    } catch (e) {
      setError(e.message);
    }
  }

  async function cargarMovs(itm) {
    try {
      const data = await listarMovimientos({ itm, limit: 20 });
      setMovs(data.items);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, [page, busqueda]);

  useEffect(() => {
    if (seleccionado) cargarMovs(seleccionado.itm);
    else setMovs([]);
  }, [seleccionado?.itm]);

  const totalPaginas = Math.max(Math.ceil(total / LIMIT), 1);

  function buscar(e) {
    e.preventDefault();
    setPage(1);
    setBusqueda(texto.trim());
  }

  async function registrar(e) {
    e.preventDefault();
    if (!seleccionado) return;
    setGuardando(true);
    setError("");
    try {
      await crearMovimiento({
        itm: seleccionado.itm,
        tipo,
        cantidad: parseInt(cantidad, 10),
        nota,
      });
      setCantidad("");
      setNota("");
      await Promise.all([cargar(), cargarMovs(seleccionado.itm)]);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  // Exporta todos los ítems (con el filtro actual) a un CSV que abre Excel
  async function exportarCsv() {
    setExportando(true);
    setError("");
    try {
      const filas = [];
      let p = 1;
      let totalPag = 1;
      do {
        const data = await listarStock({ q: busqueda, page: p, limit: 100 });
        filas.push(...data.items);
        totalPag = Math.max(Math.ceil(data.total / 100), 1);
        p++;
      } while (p <= totalPag);

      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lineas = [
        [
          "Short Item No",
          "Item Number",
          "Description",
          "Description 2",
          "Stock actual",
          "Stock mínimo",
          "Estado",
        ]
          .map(esc)
          .join(";"),
        ...filas.map((i) =>
          [
            i.itm,
            i.litm,
            i.dsc1,
            i.dsc2,
            i.stock,
            i.stmn,
            i.alerta ? "Bajo mínimo" : "OK",
          ]
            .map(esc)
            .join(";")
        ),
      ];

      const blob = new Blob(["\uFEFF" + lineas.join("\r\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stock.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="pantalla">
      <h1>Control de Stock</h1>

      <div className="barra">
        <button onClick={exportarCsv} disabled={exportando}>
          {exportando ? "Exportando..." : "⬇ Exportar a Excel"}
        </button>

        <form className="buscador" onSubmit={buscar}>
          <input
            placeholder="Buscar por número, descripción o texto..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      <table className="grilla">
        <thead>
          <tr>
            <th></th>
            <th>Short Item No</th>
            <th>Item Number</th>
            <th>Description</th>
            <th>Stock actual</th>
            <th>Stock mínimo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr
              key={it.itm}
              className={[
                seleccionado?.itm === it.itm ? "marcada" : "",
                it.alerta ? "alerta" : "",
              ]
                .join(" ")
                .trim()}
              onClick={() => setSeleccionado(it)}
              style={{ cursor: "pointer" }}
            >
              <td>
                <input
                  type="radio"
                  checked={seleccionado?.itm === it.itm}
                  onChange={() => setSeleccionado(it)}
                />
              </td>
              <td className="num">{it.itm}</td>
              <td>{it.litm || "(sin número)"}</td>
              <td>
                {it.dsc1}
                {it.alerta && <span className="badge-alerta">Bajo mínimo</span>}
              </td>
              <td className="num">
                <b>{it.stock}</b>
              </td>
              <td className="num">{it.stmn || "-"}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="vacio">
                No hay ítems para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="paginacion">
        <button onClick={() => setPage(page - 1)} disabled={page <= 1}>
          ‹ Anterior
        </button>
        <span>
          Página {page} de {totalPaginas} · {total} registro(s)
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPaginas}
        >
          Siguiente ›
        </button>
      </div>

      <div className="panel stock-panel">
        {seleccionado ? (
          <>
            <h2>
              {seleccionado.litm || `Ítem ${seleccionado.itm}`} -{" "}
              {seleccionado.dsc1} (stock: {seleccionado.stock}
              {seleccionado.stmn > 0 && ` · mínimo: ${seleccionado.stmn}`})
            </h2>

            <form className="stock-form" onSubmit={registrar}>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="ENTRADA">Entrada</option>
                <option value="VENTA">Venta</option>
              </select>
              <input
                type="number"
                min="1"
                placeholder="Cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
              />
              <input
                placeholder="Nota (opcional)"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
              <button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Registrar"}
              </button>
            </form>

            <table className="grilla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {movs.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.fecha).toLocaleString("es-AR")}</td>
                    <td>{m.tipo === "ENTRADA" ? "Entrada" : "Venta"}</td>
                    <td className="num">
                      {m.tipo === "ENTRADA" ? "+" : "-"}
                      {m.cantidad}
                    </td>
                    <td>{m.nota}</td>
                  </tr>
                ))}
                {movs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="vacio">
                      Sin movimientos todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        ) : (
          <p className="vacio">Seleccioná un ítem para ver y registrar movimientos.</p>
        )}
      </div>
    </div>
  );
}
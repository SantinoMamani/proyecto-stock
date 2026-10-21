import { useEffect, useState } from "react";
import { listarItems, borrarItem } from "../api";

const LIMIT = 10;

export default function ItemList({ onAgregar, onModificar }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      const data = await listarItems({ q: busqueda, page, limit: LIMIT });
      setItems(data.items);
      setTotal(data.total);
      setSeleccion([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [page, busqueda]);

  const totalPaginas = Math.max(Math.ceil(total / LIMIT), 1);
  const todosMarcados = items.length > 0 && seleccion.length === items.length;

  function alternar(itm) {
    setSeleccion((s) =>
      s.includes(itm) ? s.filter((x) => x !== itm) : [...s, itm]
    );
  }

  function alternarTodos() {
    setSeleccion(todosMarcados ? [] : items.map((i) => i.itm));
  }

  function buscar(e) {
    e.preventDefault();
    setPage(1);
    setBusqueda(texto.trim());
  }

  async function borrar() {
    if (seleccion.length === 0) return;
    const ok = window.confirm(
      `¿Borrar ${seleccion.length} ítem(s)? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    try {
      for (const itm of seleccion) {
        await borrarItem(itm);
      }
      const quedan = items.length - seleccion.length;
      if (quedan === 0 && page > 1) {
        setPage(page - 1);
      } else {
        await cargar();
      }
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="pantalla">
      <h1>Work With Item Master Browse</h1>

      <div className="barra">
        <button onClick={onAgregar}>＋ Agregar</button>
        <button
          onClick={() => onModificar(seleccion[0])}
          disabled={seleccion.length !== 1}
        >
          ✎ Modificar
        </button>
        <button onClick={borrar} disabled={seleccion.length === 0}>
          🗑 Borrar
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
            <th>
              <input
                type="checkbox"
                checked={todosMarcados}
                onChange={alternarTodos}
              />
            </th>
            <th>Short Item No</th>
            <th>Item Number</th>
            <th>Description</th>
            <th>Description 2</th>
            <th>Search Text</th>
            <th>Line Type</th>
            <th>Stocking Type</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr
              key={it.itm}
              className={seleccion.includes(it.itm) ? "marcada" : ""}
            >
              <td>
                <input
                  type="checkbox"
                  checked={seleccion.includes(it.itm)}
                  onChange={() => alternar(it.itm)}
                />
              </td>
              <td className="num">{it.itm}</td>
              <td>
                <button className="link" onClick={() => onModificar(it.itm)}>
                  {it.litm || "(sin número)"}
                </button>
              </td>
              <td>{it.dsc1}</td>
              <td>{it.dsc2}</td>
              <td>{it.srtx}</td>
              <td>{it.lnty}</td>
              <td>{it.stkt}</td>
            </tr>
          ))}
          {!cargando && items.length === 0 && (
            <tr>
              <td colSpan={8} className="vacio">
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
    </div>
  );
}
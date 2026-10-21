import { useState } from "react";
import ItemList from "./components/ItemList";
import ItemForm from "./components/ItemForm";
import Stock from "./components/Stock";
import Login from "./components/Login";
import { getToken, cerrarSesion } from "./api";

export default function App() {
  const [logueado, setLogueado] = useState(Boolean(getToken()));
  const [seccion, setSeccion] = useState("items"); // "items" | "stock"
  // { nombre: "lista" } o { nombre: "form", itm: null | número }
  const [vista, setVista] = useState({ nombre: "lista" });

  if (!logueado) {
    return <Login onLogin={() => setLogueado(true)} />;
  }

  function salir() {
    cerrarSesion();
    setVista({ nombre: "lista" });
    setSeccion("items");
    setLogueado(false);
  }

  function irA(destino) {
    setSeccion(destino);
    setVista({ nombre: "lista" });
  }

  return (
    <>
      <div className="topbar">
        <div className="menu">
          <button
            className={seccion === "items" ? "tab activa" : "tab"}
            onClick={() => irA("items")}
          >
            Maestro de Ítems
          </button>
          <button
            className={seccion === "stock" ? "tab activa" : "tab"}
            onClick={() => irA("stock")}
          >
            Stock
          </button>
        </div>
        <button onClick={salir}>Salir</button>
      </div>

      {seccion === "stock" ? (
        <Stock />
      ) : vista.nombre === "form" ? (
        <ItemForm
          itm={vista.itm}
          onVolver={() => setVista({ nombre: "lista" })}
        />
      ) : (
        <ItemList
          onAgregar={() => setVista({ nombre: "form", itm: null })}
          onModificar={(itm) => setVista({ nombre: "form", itm })}
        />
      )}
    </>
  );
}
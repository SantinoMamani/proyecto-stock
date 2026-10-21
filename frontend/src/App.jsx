import { useState } from "react";
import ItemList from "./components/ItemList";
import ItemForm from "./components/ItemForm";
import Login from "./components/Login";
import { getToken, cerrarSesion } from "./api";

export default function App() {
  const [logueado, setLogueado] = useState(Boolean(getToken()));
  // { nombre: "lista" } o { nombre: "form", itm: null | número }
  const [vista, setVista] = useState({ nombre: "lista" });

  if (!logueado) {
    return <Login onLogin={() => setLogueado(true)} />;
  }

  function salir() {
    cerrarSesion();
    setVista({ nombre: "lista" });
    setLogueado(false);
  }

  return (
    <>
      <div className="topbar">
        <button onClick={salir}>Salir</button>
      </div>

      {vista.nombre === "form" ? (
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
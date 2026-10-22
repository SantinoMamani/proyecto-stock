import { useState } from "react";
import ItemList from "./components/ItemList";
import ItemForm from "./components/ItemForm";
import Stock from "./components/Stock";
import Resumen from "./components/Resumen";
import Login from "./components/Login";
import { getToken, cerrarSesion } from "./api";

const SECCIONES = [
  ["items", "Maestro de Ítems"],
  ["stock", "Stock"],
  ["resumen", "Resumen"],
];

export default function App() {
  const [logueado, setLogueado] = useState(Boolean(getToken()));
  const [seccion, setSeccion] = useState("items");
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

  let contenido;
  if (seccion === "stock") {
    contenido = <Stock />;
  } else if (seccion === "resumen") {
    contenido = <Resumen />;
  } else if (vista.nombre === "form") {
    contenido = (
      <ItemForm
        itm={vista.itm}
        onVolver={() => setVista({ nombre: "lista" })}
      />
    );
  } else {
    contenido = (
      <ItemList
        onAgregar={() => setVista({ nombre: "form", itm: null })}
        onModificar={(itm) => setVista({ nombre: "form", itm })}
      />
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="menu">
          {SECCIONES.map(([clave, titulo]) => (
            <button
              key={clave}
              className={seccion === clave ? "tab activa" : "tab"}
              onClick={() => irA(clave)}
            >
              {titulo}
            </button>
          ))}
        </div>
        <button onClick={salir}>Salir</button>
      </div>

      {contenido}
    </>
  );
}
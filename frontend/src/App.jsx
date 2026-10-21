import { useState } from "react";
import ItemList from "./components/ItemList";
import ItemForm from "./components/ItemForm";

export default function App() {
  // { nombre: "lista" } o { nombre: "form", itm: null | número }
  const [vista, setVista] = useState({ nombre: "lista" });

  if (vista.nombre === "form") {
    return (
      <ItemForm
        itm={vista.itm}
        onVolver={() => setVista({ nombre: "lista" })}
      />
    );
  }

  return (
    <ItemList
      onAgregar={() => setVista({ nombre: "form", itm: null })}
      onModificar={(itm) => setVista({ nombre: "form", itm })}
    />
  );
}
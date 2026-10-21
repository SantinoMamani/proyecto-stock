import { useEffect, useState } from "react";
import { obtenerItem, crearItem, modificarItem } from "../api";

const VACIO = {
  litm: "", dsc1: "", dsc2: "", srtx: "", stkt: "", glpt: "", uom1: "",
  lnty: "S", bpfg: "P", plnr: "", buyr: "",
  bkor: true, chkav: true,
  cmcg: "2", sals: "2", purl: "3", kitp: "", cfgc: "", cmmt: "1",
  prtm: "", flsh: "", uomc: "",
};

const PESTANAS = [
  "Basic Item Data",
  "Additional Info.",
  "Weights and Measures",
  "Lot Processing",
];

function Campo({ label, nombre, valor, onChange, requerido, ancho, tipo = "text", soloLectura }) {
  return (
    <label className="campo">
      <span className="etiqueta">
        {label}
        {requerido && <b className="req"> *</b>}
      </span>
      <input
        type={tipo}
        name={nombre}
        value={valor}
        onChange={onChange}
        readOnly={soloLectura}
        style={{ width: ancho }}
      />
    </label>
  );
}

export default function ItemForm({ itm, onVolver }) {
  const [form, setForm] = useState(VACIO);
  const [tab, setTab] = useState(0);
  const [cargando, setCargando] = useState(Boolean(itm));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!itm) return;
    obtenerItem(itm)
      .then((data) => {
        const nuevo = {};
        for (const k of Object.keys(VACIO)) {
          nuevo[k] = data[k] ?? (typeof VACIO[k] === "boolean" ? false : "");
        }
        setForm(nuevo);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [itm]);

  function cambiar(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function guardar() {
    if (!form.dsc1.trim() || !String(form.stkt).trim()) {
      setError("Description y Stocking Type son obligatorios");
      setTab(0);
      return;
    }
    setGuardando(true);
    setError("");
    try {
      if (itm) {
        await modificarItem(itm, form);
      } else {
        await crearItem(form);
      }
      onVolver();
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  }

  if (cargando) return <p className="pantalla">Cargando...</p>;

  const props = (nombre) => ({ nombre, valor: form[nombre], onChange: cambiar });

  return (
    <div className="pantalla">
      <h1>Item Master Revisions</h1>

      <div className="barra">
        <button onClick={guardar} disabled={guardando}>
          ✔ OK
        </button>
        <button onClick={onVolver} disabled={guardando}>
          ✖ Cancelar
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="cabecera">
        <Campo label="Item Number" ancho={260} {...props("litm")} />
        <label className="campo">
          <span className="etiqueta">Item Number - Sht</span>
          <input
            value={itm ?? ""}
            placeholder="(automático)"
            readOnly
            style={{ width: 120 }}
          />
        </label>
      </div>

      <div className="tabs">
        {PESTANAS.map((nombre, i) => (
          <button
            key={nombre}
            className={i === tab ? "tab activa" : "tab"}
            onClick={() => setTab(i)}
          >
            {nombre}
          </button>
        ))}
      </div>

      {tab === 0 ? (
        <div className="panel">
          <div className="bloque">
            <Campo label="Catalog Number" ancho={260} valor={form.litm} soloLectura />
            <Campo label="Description" requerido ancho={300} {...props("dsc1")} />
            <Campo label="Description 2" ancho={300} {...props("dsc2")} />
            <Campo label="Search Text" ancho={300} {...props("srtx")} />
          </div>

          <div className="columnas">
            <div className="bloque">
              <Campo label="Stocking Type" requerido ancho={60} {...props("stkt")} />
              <Campo label="G/L Class" ancho={60} {...props("glpt")} />
              <Campo label="Unit of Measure" ancho={60} {...props("uom1")} />
              <Campo label="Line Type" ancho={60} {...props("lnty")} />
              <Campo label="Bulk/Packed Flag" ancho={60} {...props("bpfg")} />
              <Campo label="Planner Number" ancho={120} {...props("plnr")} />
              <Campo label="Buyer Number" ancho={120} {...props("buyr")} />

              <label className="check">
                <input
                  type="checkbox"
                  name="bkor"
                  checked={form.bkor}
                  onChange={cambiar}
                />
                Backorders Allowed
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  name="chkav"
                  checked={form.chkav}
                  onChange={cambiar}
                />
                Check Availability
              </label>
            </div>

            <div className="bloque">
              <Campo label="Inventory Cost Level" tipo="number" ancho={60} {...props("cmcg")} />
              <Campo label="Sales Price Level" tipo="number" ancho={60} {...props("sals")} />
              <Campo label="Purchase Price Level" tipo="number" ancho={60} {...props("purl")} />
              <Campo label="Kit/Configurator Pricing Method" ancho={60} {...props("kitp")} />
              <Campo label="Configurator Costing Method" ancho={60} {...props("cfgc")} />
              <Campo label="Commitment Method" tipo="number" ancho={60} {...props("cmmt")} />
              <Campo label="Print Message" ancho={120} {...props("prtm")} />
              <Campo label="Item Flash Message" ancho={60} {...props("flsh")} />
              <Campo label="Std UOM Conversion" ancho={60} {...props("uomc")} />
            </div>
          </div>
        </div>
      ) : (
        <div className="panel vacio">
          Esta pestaña se completa en la próxima etapa.
        </div>
      )}
    </div>
  );
}
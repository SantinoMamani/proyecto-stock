import { useEffect, useState } from "react";
import { obtenerItem, crearItem, modificarItem } from "../api";

// t: "n" número entero, "d" decimal, "c" checkbox; sin t = texto
const PESTANAS = [
  {
    nombre: "Basic Item Data",
    arriba: [
      { n: "litm", l: "Catalog Number", w: 260, ro: true },
      { n: "dsc1", l: "Description", w: 300, req: true },
      { n: "dsc2", l: "Description 2", w: 300 },
      { n: "srtx", l: "Search Text", w: 300 },
    ],
    columnas: [
      [
        { n: "stkt", l: "Stocking Type", w: 60, req: true },
        { n: "glpt", l: "G/L Class", w: 60 },
        { n: "uom1", l: "Unit of Measure", w: 60 },
        { n: "lnty", l: "Line Type", w: 60 },
        { n: "bpfg", l: "Bulk/Packed Flag", w: 60 },
        { n: "plnr", l: "Planner Number" },
        { n: "buyr", l: "Buyer Number" },
        { n: "bkor", l: "Backorders Allowed", t: "c" },
        { n: "chkav", l: "Check Availability", t: "c" },
      ],
      [
        { n: "cmcg", l: "Inventory Cost Level", t: "n", w: 60 },
        { n: "sals", l: "Sales Price Level", t: "n", w: 60 },
        { n: "purl", l: "Purchase Price Level", t: "n", w: 60 },
        { n: "kitp", l: "Kit/Configurator Pricing Method", w: 60 },
        { n: "cfgc", l: "Configurator Costing Method", w: 60 },
        { n: "cmmt", l: "Commitment Method", t: "n", w: 60 },
        { n: "prtm", l: "Print Message" },
        { n: "flsh", l: "Item Flash Message", w: 60 },
        { n: "uomc", l: "Std UOM Conversion", w: 60 },
        { n: "stmn", l: "Minimum Stock", t: "n", w: 80 },
      ],
    ],
  },
  {
    nombre: "Additional Info.",
    columnas: [
      [
        { n: "srp1", l: "Sales Code 1", w: 80 },
        { n: "srp2", l: "Sales Code 2", w: 80 },
        { n: "srp3", l: "Sales Code 3", w: 80 },
        { n: "prp1", l: "Purchasing Code 1", w: 80 },
        { n: "prp2", l: "Purchasing Code 2", w: 80 },
      ],
      [
        { n: "cmcl", l: "Commodity Class", w: 80 },
        { n: "cmgl", l: "Commodity Sub Class", w: 80 },
        { n: "abcs", l: "ABC Code - Sales", w: 60 },
        { n: "abcm", l: "ABC Code - Margin", w: 60 },
        { n: "abci", l: "ABC Code - Investment", w: 60 },
      ],
    ],
  },
  {
    nombre: "Weights and Measures",
    columnas: [
      [
        { n: "uom2", l: "Secondary UOM", w: 60 },
        { n: "uom3", l: "Purchasing UOM", w: 60 },
        { n: "uom4", l: "Pricing UOM", w: 60 },
        { n: "uom6", l: "Shipping UOM", w: 60 },
        { n: "uom8", l: "Production UOM", w: 60 },
        { n: "uom9", l: "Component UOM", w: 60 },
      ],
      [
        { n: "uwum", l: "Weight Unit of Measure", w: 60 },
        { n: "uwgt", l: "Unit Weight", t: "d", w: 120 },
        { n: "vumd", l: "Volume Unit of Measure", w: 60 },
        { n: "uvol", l: "Unit Volume", t: "d", w: 120 },
      ],
    ],
  },
  {
    nombre: "Lot Processing",
    columnas: [
      [
        { n: "lotc", l: "Lot Process Type", w: 60 },
        { n: "lots", l: "Lot Status Code", w: 60 },
        { n: "lotd", l: "Lot Effectivity Days", t: "n", w: 80 },
        { n: "shlf", l: "Shelf Life Days", t: "n", w: 80 },
        { n: "expm", l: "Expiration Date Calculation", w: 60 },
      ],
      [
        { n: "lotr", l: "Lot Number Required", t: "c" },
        { n: "serr", l: "Serial Number Required", t: "c" },
      ],
    ],
  },
];

const DEFAULTS = {
  lnty: "S", bpfg: "P", cmcg: "2", sals: "2", purl: "3", cmmt: "1", stmn: "0",
  bkor: true, chkav: true, lotr: false, serr: false,
};

const TODOS = PESTANAS.flatMap((p) => [
  ...(p.arriba || []),
  ...p.columnas.flat(),
]);

const VACIO = Object.fromEntries(
  TODOS.map((c) => [c.n, DEFAULTS[c.n] ?? (c.t === "c" ? false : "")])
);

function Campo({ def, form, onChange }) {
  if (def.t === "c") {
    return (
      <label className="check">
        <input
          type="checkbox"
          name={def.n}
          checked={Boolean(form[def.n])}
          onChange={onChange}
        />
        {def.l}
      </label>
    );
  }
  return (
    <label className="campo">
      <span className="etiqueta">
        {def.l}
        {def.req && <b className="req"> *</b>}
      </span>
      <input
        type={def.t === "n" || def.t === "d" ? "number" : "text"}
        step={def.t === "d" ? "any" : undefined}
        min={def.n === "stmn" ? "0" : undefined}
        name={def.n}
        value={form[def.n]}
        onChange={onChange}
        readOnly={def.ro}
        style={{ width: def.w || 120 }}
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

  const pestana = PESTANAS[tab];

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
        <label className="campo">
          <span className="etiqueta">Item Number</span>
          <input
            name="litm"
            value={form.litm}
            onChange={cambiar}
            style={{ width: 260 }}
          />
        </label>
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
        {PESTANAS.map((p, i) => (
          <button
            key={p.nombre}
            className={i === tab ? "tab activa" : "tab"}
            onClick={() => setTab(i)}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      <div className="panel">
        {pestana.arriba && (
          <div className="bloque">
            {pestana.arriba.map((c) => (
              <Campo key={c.n} def={c} form={form} onChange={cambiar} />
            ))}
          </div>
        )}
        <div className="columnas">
          {pestana.columnas.map((col, i) => (
            <div className="bloque" key={i}>
              {col.map((c) => (
                <Campo key={c.n} def={c} form={form} onChange={cambiar} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
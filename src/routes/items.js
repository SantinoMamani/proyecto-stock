const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

const CAMPOS_TEXTO = [
  "litm", "dsc1", "dsc2", "srtx", "stkt", "glpt", "uom1", "lnty",
  "bpfg", "plnr", "buyr", "kitp", "cfgc", "prtm", "flsh", "uomc",
];
const CAMPOS_ENTEROS = ["cmcg", "sals", "purl", "cmmt"];
const CAMPOS_BOOLEANOS = ["bkor", "chkav"];

// Toma solo los campos permitidos y normaliza vacíos a null
function limpiarDatos(body) {
  const data = {};

  for (const campo of CAMPOS_TEXTO) {
    if (body[campo] !== undefined) {
      const valor = String(body[campo]).trim();
      data[campo] = valor === "" ? null : valor;
    }
  }
  for (const campo of CAMPOS_ENTEROS) {
    if (body[campo] !== undefined) {
      const valor = body[campo];
      data[campo] = valor === "" || valor === null ? null : parseInt(valor, 10);
    }
  }
  for (const campo of CAMPOS_BOOLEANOS) {
    if (body[campo] !== undefined) data[campo] = Boolean(body[campo]);
  }
  return data;
}

// Consulta: lista con filtro opcional (?q=texto) y paginación (?page=1&limit=10)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const q = (req.query.q || "").trim();

    const where = q
      ? {
          OR: [
            { litm: { contains: q, mode: "insensitive" } },
            { dsc1: { contains: q, mode: "insensitive" } },
            { dsc2: { contains: q, mode: "insensitive" } },
            { srtx: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.f4101.count({ where }),
      prisma.f4101.findMany({
        where,
        orderBy: { itm: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({ total, page, limit, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al consultar los ítems" });
  }
});

// Consulta de un ítem (para la pantalla de modificar)
router.get("/:itm", async (req, res) => {
  try {
    const item = await prisma.f4101.findUnique({
      where: { itm: parseInt(req.params.itm, 10) },
    });
    if (!item) return res.status(404).json({ error: "Ítem no encontrado" });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al consultar el ítem" });
  }
});

// Alta: ITM lo genera la base (consecutivo)
router.post("/", async (req, res) => {
  try {
    const data = limpiarDatos(req.body);
    delete data.itm;

    if (!data.dsc1 || !data.stkt) {
      return res
        .status(400)
        .json({ error: "Description y Stocking Type son obligatorios" });
    }

    const item = await prisma.f4101.create({ data });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el ítem" });
  }
});

// Modificación
router.put("/:itm", async (req, res) => {
  try {
    const data = limpiarDatos(req.body);
    delete data.itm;

    if (
      (data.dsc1 !== undefined && !data.dsc1) ||
      (data.stkt !== undefined && !data.stkt)
    ) {
      return res
        .status(400)
        .json({ error: "Description y Stocking Type son obligatorios" });
    }

    const item = await prisma.f4101.update({
      where: { itm: parseInt(req.params.itm, 10) },
      data,
    });
    res.json(item);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Ítem no encontrado" });
    }
    console.error(error);
    res.status(500).json({ error: "Error al modificar el ítem" });
  }
});

// Baja (sin validaciones por ahora)
router.delete("/:itm", async (req, res) => {
  try {
    await prisma.f4101.delete({
      where: { itm: parseInt(req.params.itm, 10) },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Ítem no encontrado" });
    }
    console.error(error);
    res.status(500).json({ error: "Error al borrar el ítem" });
  }
});

module.exports = router;
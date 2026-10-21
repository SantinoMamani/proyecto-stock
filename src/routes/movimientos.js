const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

class ErrorNegocio extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Stock actual de un ítem = entradas - ventas
async function stockDe(tx, itm) {
  const sumas = await tx.movimiento.groupBy({
    by: ["tipo"],
    where: { itm },
    _sum: { cantidad: true },
  });
  let stock = 0;
  for (const s of sumas) {
    const cant = s._sum.cantidad || 0;
    stock += s.tipo === "ENTRADA" ? cant : -cant;
  }
  return stock;
}

// Listado de ítems con su stock actual (?q=texto&page=1&limit=10)
router.get("/stock", async (req, res) => {
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
        select: { itm: true, litm: true, dsc1: true, dsc2: true },
      }),
    ]);

    const ids = items.map((i) => i.itm);
    const sumas = await prisma.movimiento.groupBy({
      by: ["itm", "tipo"],
      where: { itm: { in: ids } },
      _sum: { cantidad: true },
    });

    const stockPorItem = {};
    for (const s of sumas) {
      const cant = s._sum.cantidad || 0;
      stockPorItem[s.itm] =
        (stockPorItem[s.itm] || 0) + (s.tipo === "ENTRADA" ? cant : -cant);
    }

    res.json({
      total,
      page,
      limit,
      items: items.map((i) => ({ ...i, stock: stockPorItem[i.itm] || 0 })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al consultar el stock" });
  }
});

// Historial de movimientos (?itm=1&page=1&limit=20)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const itm = parseInt(req.query.itm, 10);
    const where = Number.isInteger(itm) ? { itm } : {};

    const [total, items] = await Promise.all([
      prisma.movimiento.count({ where }),
      prisma.movimiento.findMany({
        where,
        orderBy: [{ fecha: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({ total, page, limit, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al consultar los movimientos" });
  }
});

// Registrar un movimiento (ENTRADA o VENTA)
router.post("/", async (req, res) => {
  try {
    const itm = parseInt(req.body.itm, 10);
    const tipo = req.body.tipo;
    const cantidad = parseInt(req.body.cantidad, 10);
    const nota = String(req.body.nota ?? "").trim() || null;

    if (!Number.isInteger(itm)) {
      return res.status(400).json({ error: "Ítem inválido" });
    }
    if (tipo !== "ENTRADA" && tipo !== "VENTA") {
      return res.status(400).json({ error: "El tipo debe ser ENTRADA o VENTA" });
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return res
        .status(400)
        .json({ error: "La cantidad debe ser un entero mayor a cero" });
    }

    const resultado = await prisma.$transaction(
      async (tx) => {
        const item = await tx.f4101.findUnique({
          where: { itm },
          select: { itm: true },
        });
        if (!item) throw new ErrorNegocio(404, "Ítem no encontrado");

        if (tipo === "VENTA") {
          const disponible = await stockDe(tx, itm);
          if (cantidad > disponible) {
            throw new ErrorNegocio(
              400,
              `Stock insuficiente (disponible: ${disponible})`
            );
          }
        }

        const movimiento = await tx.movimiento.create({
          data: { itm, tipo, cantidad, nota },
        });
        const stock = await stockDe(tx, itm);
        return { movimiento, stock };
      },
      { isolationLevel: "Serializable" }
    );

    res.status(201).json(resultado);
  } catch (error) {
    if (error instanceof ErrorNegocio) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.code === "P2034") {
      return res
        .status(409)
        .json({ error: "Conflicto de concurrencia, reintentá" });
    }
    console.error(error);
    res.status(500).json({ error: "Error al registrar el movimiento" });
  }
});

module.exports = router;
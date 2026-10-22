const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalItems, sumas, semana, ultimos, conMinimo] = await Promise.all([
      prisma.f4101.count(),
      prisma.movimiento.groupBy({
        by: ["itm", "tipo"],
        _sum: { cantidad: true },
      }),
      prisma.movimiento.groupBy({
        by: ["tipo"],
        where: { fecha: { gte: desde } },
        _sum: { cantidad: true },
      }),
      prisma.movimiento.findMany({
        orderBy: [{ fecha: "desc" }, { id: "desc" }],
        take: 10,
        include: { item: { select: { litm: true, dsc1: true } } },
      }),
      prisma.f4101.findMany({
        where: { stmn: { gt: 0 } },
        select: { itm: true, litm: true, dsc1: true, stmn: true },
      }),
    ]);

    // Stock actual por ítem = entradas - ventas
    const stockPorItem = {};
    for (const s of sumas) {
      const cant = s._sum.cantidad || 0;
      stockPorItem[s.itm] =
        (stockPorItem[s.itm] || 0) + (s.tipo === "ENTRADA" ? cant : -cant);
    }

    const idsConStock = Object.entries(stockPorItem)
      .filter(([, v]) => v > 0)
      .map(([k]) => parseInt(k, 10));

    const unidades = idsConStock.reduce((a, id) => a + stockPorItem[id], 0);

    const listaSinStock = await prisma.f4101.findMany({
      where: { itm: { notIn: idsConStock } },
      orderBy: { itm: "asc" },
      take: 10,
      select: { itm: true, litm: true, dsc1: true },
    });

    // Ítems con stock mínimo definido cuyo stock está en o por debajo del mínimo
    const bajoMinimo = conMinimo
      .map((i) => ({ ...i, stock: stockPorItem[i.itm] || 0 }))
      .filter((i) => i.stock <= i.stmn)
      .sort((a, b) => a.stock - b.stock || a.itm - b.itm);

    const suma = (tipo) =>
      semana.find((s) => s.tipo === tipo)?._sum.cantidad || 0;

    res.json({
      totalItems,
      conStock: idsConStock.length,
      sinStock: totalItems - idsConStock.length,
      bajoMinimo: bajoMinimo.length,
      unidades,
      entradas7d: suma("ENTRADA"),
      ventas7d: suma("VENTA"),
      ultimos: ultimos.map((m) => ({
        id: m.id,
        fecha: m.fecha,
        tipo: m.tipo,
        cantidad: m.cantidad,
        nota: m.nota,
        itm: m.itm,
        litm: m.item.litm,
        dsc1: m.item.dsc1,
      })),
      listaSinStock,
      listaBajoMinimo: bajoMinimo.slice(0, 10),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al armar el resumen" });
  }
});

module.exports = router;
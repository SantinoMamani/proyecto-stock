require("dotenv").config();
const express = require("express");
const cors = require("cors");
const itemsRouter = require("./routes/items");
const movimientosRouter = require("./routes/movimientos");
const authRouter = require("./routes/auth");
const requireAuth = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/items", requireAuth, itemsRouter);
app.use("/api/movimientos", requireAuth, movimientosRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
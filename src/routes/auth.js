const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Comparación en tiempo constante (hasheamos para igualar largos)
function igual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

router.post("/login", (req, res) => {
  const { ADMIN_USER, ADMIN_PASSWORD, JWT_SECRET } = process.env;

  if (!ADMIN_USER || !ADMIN_PASSWORD || !JWT_SECRET) {
    return res
      .status(500)
      .json({ error: "Faltan variables de entorno de autenticación" });
  }

  const { usuario, clave } = req.body || {};
  const usuarioOk = igual(usuario ?? "", ADMIN_USER);
  const claveOk = igual(clave ?? "", ADMIN_PASSWORD);

  if (!usuarioOk || !claveOk) {
    return res.status(401).json({ error: "Usuario o clave incorrectos" });
  }

  const token = jwt.sign({ usuario: ADMIN_USER }, JWT_SECRET, {
    expiresIn: "8h",
  });
  res.json({ token });
});

module.exports = router;
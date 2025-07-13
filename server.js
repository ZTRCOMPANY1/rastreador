const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const arquivo = path.join(__dirname, "visitas.json");

// Garante que o arquivo existe
if (!fs.existsSync(arquivo)) {
  fs.writeFileSync(arquivo, "[]", "utf8");
}

// Endpoint para receber os dados
app.post("/rastrear", (req, res) => {
  const novaVisita = {
    dataHora: new Date().toISOString(),
    ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    ...req.body
  };

  // Lê o arquivo existente
  const dados = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  dados.push(novaVisita);

  // Salva de volta
  fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));

  res.status(200).json({ sucesso: true });
});

// Endpoint para ver as visitas
app.get("/visitas", (req, res) => {
  const dados = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  res.json(dados);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

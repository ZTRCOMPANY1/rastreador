const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const arquivo = path.join(__dirname, "visitas.json");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Garante que o arquivo existe e é um JSON válido
if (!fs.existsSync(arquivo)) {
  fs.writeFileSync(arquivo, "[]", "utf8");
}

// Rota para salvar visita
app.post("/rastrear", (req, res) => {
  let visitas = [];

  try {
    const conteudo = fs.readFileSync(arquivo, "utf8");
    visitas = conteudo ? JSON.parse(conteudo) : [];
  } catch (erro) {
    console.error("Erro ao ler o arquivo visitas.json:", erro);
    visitas = [];
  }

  const novaVisita = {
    dataHora: new Date().toISOString(),
    ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    pagina: req.body.pagina || "desconhecida",
    navegador: req.body.navegador || "desconhecido",
    idioma: req.body.idioma || "desconhecido",
    resolucao: req.body.resolucao || "desconhecida",
    referer: req.body.referer || "direto"
  };

  visitas.push(novaVisita);

  try {
    fs.writeFileSync(arquivo, JSON.stringify(visitas, null, 2));
    res.status(200).json({ sucesso: true });
  } catch (erro) {
    console.error("Erro ao salvar visitas:", erro);
    res.status(500).json({ erro: "Erro ao salvar visita" });
  }
});

// Rota para visualizar as visitas (opcional)
app.get("/visitas", (req, res) => {
  try {
    const conteudo = fs.readFileSync(arquivo, "utf8");
    const visitas = conteudo ? JSON.parse(conteudo) : [];
    res.json(visitas);
  } catch (erro) {
    res.status(500).json({ erro: "Erro ao ler visitas" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

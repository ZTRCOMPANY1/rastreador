const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Caminho do arquivo onde os dados serão salvos
const arquivo = path.join(__dirname, "visitas.json");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // opcional, caso queira servir páginas estáticas

// Garante que o arquivo visitas.json existe e está inicializado
if (!fs.existsSync(arquivo)) {
  fs.writeFileSync(arquivo, "[]", "utf8");
}

// Endpoint para registrar a visita
app.post("/rastrear", (req, res) => {
  let visitas = [];

  // Tenta ler o arquivo atual
  try {
    const conteudo = fs.readFileSync(arquivo, "utf8");
    visitas = conteudo ? JSON.parse(conteudo) : [];
  } catch (erro) {
    console.error("Erro ao ler visitas.json:", erro);
    visitas = [];
  }

  // Dados da nova visita
  const novaVisita = {
    dataHora: new Date().toISOString(),
    ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    site: req.body.site || "desconhecido",
    pagina: req.body.pagina || "desconhecida",
    navegador: req.body.navegador || "desconhecido",
    idioma: req.body.idioma || "desconhecido",
    resolucao: req.body.resolucao || "desconhecida",
    referer: req.body.referer || "direto"
  };

  // Adiciona e salva no arquivo
  visitas.push(novaVisita);

  try {
    fs.writeFileSync(arquivo, JSON.stringify(visitas, null, 2), "utf8");
    res.status(200).json({ sucesso: true });
  } catch (erro) {
    console.error("Erro ao salvar visita:", erro);
    res.status(500).json({ erro: "Erro ao salvar visita" });
  }
});

// Endpoint para visualizar todas as visitas (útil para painel)
app.get("/visitas", (req, res) => {
  try {
    const conteudo = fs.readFileSync(arquivo, "utf8");
    const visitas = conteudo ? JSON.parse(conteudo) : [];
    res.status(200).json(visitas);
  } catch (erro) {
    console.error("Erro ao ler visitas:", erro);
    res.status(500).json({ erro: "Erro ao ler visitas" });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor de rastreamento rodando em http://localhost:${PORT}`);
});

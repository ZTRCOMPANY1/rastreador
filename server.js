const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const fetch = require("node-fetch"); // IMPORTANTE

const app = express();
const PORT = process.env.PORT || 3000;

const arquivo = path.join(__dirname, "visitas.json");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Garante que o arquivo existe
if (!fs.existsSync(arquivo)) fs.writeFileSync(arquivo, "[]", "utf8");

// Rota principal
app.post("/rastrear", async (req, res) => {
  let visitas = [];

  try {
    const conteudo = fs.readFileSync(arquivo, "utf8");
    visitas = conteudo ? JSON.parse(conteudo) : [];
  } catch (erro) {
    console.error("Erro lendo JSON:", erro);
    visitas = [];
  }

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  // Busca geolocalização por IP (API gratuita)
  let localizacao = {
    pais: "desconhecido",
    estado: "desconhecido",
    cidade: "desconhecida"
  };

  try {
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city`);
    const json = await resp.json();
    localizacao = {
      pais: json.country || "desconhecido",
      estado: json.regionName || "desconhecido",
      cidade: json.city || "desconhecida"
    };
  } catch (erro) {
    console.error("Erro ao buscar localização:", erro);
  }

  const novaVisita = {
    dataHora: new Date().toISOString(),
    ip,
    site: req.body.site || "desconhecido",
    pagina: req.body.pagina || "desconhecida",
    navegador: req.body.navegador || "desconhecido",
    sistema: req.body.sistema || "desconhecido",
    dispositivo: req.body.dispositivo || "desktop",
    idioma: req.body.idioma || "desconhecido",
    resolucao: req.body.resolucao || "desconhecida",
    referer: req.body.referer || "direto",
    pais: localizacao.pais,
    estado: localizacao.estado,
    cidade: localizacao.cidade
  };

  visitas.push(novaVisita);

  try {
    fs.writeFileSync(arquivo, JSON.stringify(visitas, null, 2), "utf8");
    res.status(200).json({ sucesso: true });
  } catch (erro) {
    console.error("Erro salvando visita:", erro);
    res.status(500).json({ erro: "Erro ao salvar visita" });
  }
});

// Endpoint para exibir visitas
app.get("/visitas", (req, res) => {
  try {
    const conteudo = fs.readFileSync(arquivo, "utf8");
    const visitas = conteudo ? JSON.parse(conteudo) : [];
    res.status(200).json(visitas);
  } catch (erro) {
    res.status(500).json({ erro: "Erro ao ler visitas" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

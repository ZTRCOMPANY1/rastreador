const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

const arquivo = path.join(__dirname, "visitas.json");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Garante que o visitas.json existe
if (!fs.existsSync(arquivo)) fs.writeFileSync(arquivo, "[]", "utf8");

// Rota de rastreamento
app.post("/rastrear", async (req, res) => {
  let visitas = [];

  try {
    const conteudo = fs.readFileSync(arquivo, "utf8");
    visitas = conteudo ? JSON.parse(conteudo) : [];
  } catch (erro) {
    console.error("Erro lendo visitas.json:", erro);
    visitas = [];
  }

  // Captura do IP real (com fallback)
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;

  // Busca localização do IP
  let localizacao = {
    pais: "desconhecido",
    estado: "desconhecido",
    cidade: "desconhecida"
  };

  try {
    const resp = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
    const json = await resp.json();

    if (json.status === "success") {
      localizacao = {
        pais: json.country || "desconhecido",
        estado: json.regionName || "desconhecido",
        cidade: json.city || "desconhecida"
      };
    } else {
      console.warn("Falha ao localizar IP:", json);
    }
  } catch (erro) {
    console.error("Erro ao buscar localização:", erro);
  }

  // Monta a visita
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
    console.error("Erro ao salvar visita:", erro);
    res.status(500).json({ erro: "Erro ao salvar visita" });
  }
});

// Rota para exibir visitas
app.get("/visitas", (req, res) => {
  try {
    const conteudo = fs.readFileSync(arquivo, "utf8");
    const visitas = conteudo ? JSON.parse(conteudo) : [];
    res.status(200).json(visitas);
  } catch (erro) {
    res.status(500).json({ erro: "Erro ao ler visitas" });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});

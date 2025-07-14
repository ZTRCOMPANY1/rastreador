const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

const visitasArquivo = path.join(__dirname, "visitas.json");
const usuariosArquivo = path.join(__dirname, "usuarios.json");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Garante que os arquivos existem
if (!fs.existsSync(visitasArquivo)) fs.writeFileSync(visitasArquivo, "[]", "utf8");
if (!fs.existsSync(usuariosArquivo)) fs.writeFileSync(usuariosArquivo, "{}", "utf8");

// Função para carregar o mapa IP → Usuário
function carregarUsuarios() {
  try {
    const data = fs.readFileSync(usuariosArquivo, "utf8");
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Erro ao ler usuarios.json:", e);
    return {};
  }
}

// Função para salvar o mapa IP → Usuário
function salvarUsuarios(obj) {
  try {
    fs.writeFileSync(usuariosArquivo, JSON.stringify(obj, null, 2), "utf8");
  } catch (e) {
    console.error("Erro ao salvar usuarios.json:", e);
  }
}

app.post("/rastrear", async (req, res) => {
  let visitas = [];

  try {
    const conteudo = fs.readFileSync(visitasArquivo, "utf8");
    visitas = conteudo ? JSON.parse(conteudo) : [];
  } catch (erro) {
    console.error("Erro lendo visitas.json:", erro);
    visitas = [];
  }

  // Captura do IP real com fallback
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;
  console.log("📡 IP capturado:", ip);

  // Gerenciamento do ID do usuário por IP
  const usuarios = carregarUsuarios();
  let usuarioId = usuarios[ip];

  if (!usuarioId) {
    const ids = Object.values(usuarios);
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    usuarioId = maxId + 1;
    usuarios[ip] = usuarioId;
    salvarUsuarios(usuarios);
  }

  // Busca localização do IP
  let localizacao = {
    pais: "desconhecido",
    estado: "desconhecido",
    cidade: "desconhecida"
  };

  try {
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
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

  // Monta a visita com usuarioId
  const novaVisita = {
    dataHora: new Date().toISOString(),
    ip,
    usuarioId,
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
    fs.writeFileSync(visitasArquivo, JSON.stringify(visitas, null, 2), "utf8");
    res.status(200).json({ sucesso: true });
  } catch (erro) {
    console.error("Erro ao salvar visita:", erro);
    res.status(500).json({ erro: "Erro ao salvar visita" });
  }
});

// Rota para exibir visitas
app.get("/visitas", (req, res) => {
  try {
    const conteudo = fs.readFileSync(visitasArquivo, "utf8");
    const visitas = conteudo ? JSON.parse(conteudo) : [];
    res.status(200).json(visitas);
  } catch (erro) {
    res.status(500).json({ erro: "Erro ao ler visitas" });
  }
});

// Rota para limpar visitas.json
app.delete("/limpar-visitas", (req, res) => {
  try {
    fs.writeFileSync(visitasArquivo, "[]", "utf8");
    res.status(200).json({ sucesso: true, mensagem: "Visitas apagadas com sucesso." });
  } catch (erro) {
    console.error("Erro ao limpar visitas:", erro);
    res.status(500).json({ erro: "Erro ao limpar visitas" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});

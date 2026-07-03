/* ═══════════════════════════════════════════════════════════════
   Acampamento · Paredes de Coura
   Dados partilhados via Firebase Realtime Database (REST).
   Sem dbUrl configurado, funciona em modo local (localStorage).
   ═══════════════════════════════════════════════════════════════ */

// ───────────── Catálogo de material de grupo ─────────────
// "por" = nº de pessoas por unidade (ex.: 1 fogão por cada 4 pessoas)
const CATALOGO = [
  { id: "fogao",      emoji: "🔥", nome: "Fogão de campismo",        por: 4,  nota: "1 por cada 4 pessoas" },
  { id: "gas",        emoji: "⛽", nome: "Cartucho de gás",          por: 3,  nota: "vale mais sobrar do que faltar" },
  { id: "panela",     emoji: "🍲", nome: "Panela / tacho",           por: 4,  nota: "1 por cada 4 pessoas" },
  { id: "frigideira", emoji: "🍳", nome: "Frigideira",               por: 5,  nota: "1 por cada 5 pessoas" },
  { id: "geleira",    emoji: "🧊", nome: "Geleira / mala térmica",   por: 5,  nota: "com termoacumuladores!" },
  { id: "bidao",      emoji: "💧", nome: "Bidão de água (5L+)",      por: 4,  nota: "para cozinhar e lavar" },
  { id: "candeeiro",  emoji: "🔦", nome: "Candeeiro de campismo",    por: 5,  nota: "para iluminar o acampamento" },
  { id: "coluna",     emoji: "🔊", nome: "Coluna de som",            por: 10, nota: "com bateria para a noite toda" },
  { id: "socorros",   emoji: "⛑️", nome: "Kit de primeiros socorros", por: 10, nota: "pensos, betadine, ben-u-ron" },
  { id: "canivete",   emoji: "🔪", nome: "Canivete / abre-latas",    por: 5,  nota: "multiusos é o ideal" },
  { id: "tabua",      emoji: "🥕", nome: "Tábua + faca de cozinha",  por: 10, nota: "para a equipa de chefes" },
  { id: "detergente", emoji: "🧽", nome: "Detergente + esfregão",    por: 10, nota: "loiça não se lava sozinha" },
  { id: "lixo",       emoji: "🗑️", nome: "Rolo de sacos do lixo",   por: 10, nota: "não deixamos rasto" },
  { id: "papel",      emoji: "🧻", nome: "Papel de cozinha + higiénico", por: 7, nota: "nunca é demais" },
  { id: "toldo",      emoji: "🌧️", nome: "Toldo / oleado",          por: 10, nota: "sombra de dia, abrigo à noite" },
  { id: "extensao",   emoji: "🔋", nome: "Powerbank grande / extensão", por: 5, nota: "para ninguém ficar sem bateria" },
];

// ───────────── Essenciais individuais (checklist local) ─────────────
const ESSENCIAIS = [
  ["tenda",     "⛺", "Tenda (combina partilha!)"],
  ["saco",      "🛌", "Saco-cama"],
  ["colchao",   "🧘", "Colchonete / colchão insuflável"],
  ["frontal",   "💡", "Lanterna frontal"],
  ["protetor",  "🧴", "Protetor solar"],
  ["repelente", "🦟", "Repelente de insetos"],
  ["banho",     "🩳", "Fato de banho"],
  ["toalha",    "🏖️", "Toalha"],
  ["chinelos",  "🩴", "Chinelos"],
  ["agasalho",  "🧥", "Agasalho para a noite"],
  ["chuva",     "🌂", "Capa de chuva (é o Minho…)"],
  ["loica",     "🍽️", "Prato, copo e talheres reutilizáveis"],
  ["cantil",    "🥤", "Cantil / garrafa de água"],
  ["powerbank", "🔌", "Powerbank pessoal"],
  ["medicacao", "💊", "Medicação pessoal"],
  ["dinheiro",  "💶", "Dinheiro em numerário"],
];

// ───────────── Camada de dados ─────────────
const DB_URL = (window.CONFIG && window.CONFIG.dbUrl || "").replace(/\/+$/, "");
const MODO_LOCAL = !DB_URL;
const CHAVE_LOCAL = "coura-dados";

const api = {
  async ler() {
    if (MODO_LOCAL) {
      return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "null") || {};
    }
    const r = await fetch(`${DB_URL}/dados.json`);
    if (!r.ok) throw new Error("Falha ao ler a base de dados");
    return (await r.json()) || {};
  },

  _gravarLocal(dados) {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(dados));
  },

  async adicionar(ramo, valor) {
    if (MODO_LOCAL) {
      const dados = await this.ler();
      dados[ramo] = dados[ramo] || {};
      dados[ramo]["id" + Date.now() + Math.random().toString(36).slice(2, 6)] = valor;
      this._gravarLocal(dados);
      return;
    }
    const r = await fetch(`${DB_URL}/dados/${ramo}.json`, { method: "POST", body: JSON.stringify(valor) });
    if (!r.ok) throw new Error("Falha ao gravar");
  },

  async remover(ramo, id) {
    if (MODO_LOCAL) {
      const dados = await this.ler();
      if (dados[ramo]) delete dados[ramo][id];
      this._gravarLocal(dados);
      return;
    }
    const r = await fetch(`${DB_URL}/dados/${ramo}/${id}.json`, { method: "DELETE" });
    if (!r.ok) throw new Error("Falha ao apagar");
  },

  async definirPrevisao(n) {
    if (MODO_LOCAL) {
      const dados = await this.ler();
      dados.previsao = n;
      this._gravarLocal(dados);
      return;
    }
    await fetch(`${DB_URL}/dados/previsao.json`, { method: "PUT", body: JSON.stringify(n) });
  },
};

// ───────────── Estado ─────────────
let estado = { pessoas: {}, material: {}, previsao: 20 };
let assinaturaEstado = "";

const $ = (s) => document.querySelector(s);

function avisar(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("mostrar");
  clearTimeout(avisar._tempo);
  avisar._tempo = setTimeout(() => t.classList.remove("mostrar"), 2600);
}

async function sincronizar(mostrarErro = false) {
  try {
    const dados = await api.ler();
    estado.pessoas = dados.pessoas || {};
    estado.material = dados.material || {};
    estado.previsao = dados.previsao || 20;
    const assinatura = JSON.stringify(estado);
    if (assinatura !== assinaturaEstado) {
      assinaturaEstado = assinatura;
      desenharTudo();
    }
  } catch (e) {
    if (mostrarErro) avisar("😵 Não consegui ligar à base de dados.");
    console.error(e);
  }
}

// ───────────── Desenho ─────────────
function desenharTudo() {
  desenharPessoas();
  desenharMaterial();
  desenharExtras();
}

function animarNumero(el, novo) {
  const antigo = parseInt(el.textContent, 10) || 0;
  if (antigo === novo) { el.textContent = novo; return; }
  const inicio = performance.now();
  (function passo(t) {
    const p = Math.min((t - inicio) / 500, 1);
    el.textContent = Math.round(antigo + (novo - antigo) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(passo);
  })(inicio);
}

function desenharPessoas() {
  const entradas = Object.entries(estado.pessoas).sort((a, b) => (a[1].t || 0) - (b[1].t || 0));
  animarNumero($("#num-pessoas"), entradas.length);

  const lista = $("#lista-pessoas");
  lista.innerHTML = "";
  for (const [id, p] of entradas) {
    const ficha = document.createElement("span");
    ficha.className = "ficha";
    ficha.append(p.nome);
    const x = document.createElement("button");
    x.textContent = "✕";
    x.title = `Remover ${p.nome}`;
    x.onclick = async () => {
      if (!confirm(`Remover ${p.nome} da lista?`)) return;
      await api.remover("pessoas", id).catch(() => avisar("😵 Falhou, tenta outra vez."));
      sincronizar();
    };
    ficha.append(x);
    lista.append(ficha);
  }

  // seletor "quem és tu?"
  const sel = $("#select-eu");
  const atual = localStorage.getItem("coura-eu") || sel.value;
  sel.innerHTML = '<option value="">— escolhe o teu nome —</option>';
  for (const [, p] of entradas) {
    const op = document.createElement("option");
    op.value = op.textContent = p.nome;
    sel.append(op);
  }
  if ([...sel.options].some((o) => o.value === atual)) sel.value = atual;

  $("#input-previsao").value = estado.previsao;
  $("#eco-previsao").textContent = estado.previsao;
}

function quemSou() {
  const eu = $("#select-eu").value;
  if (!eu) {
    const caixa = $(".quem-sou");
    caixa.classList.remove("atencao");
    void caixa.offsetWidth; // reinicia a animação
    caixa.classList.add("atencao");
    caixa.scrollIntoView({ behavior: "smooth", block: "center" });
    avisar("Primeiro diz-nos quem és 🙂 (inscreve-te em «Quem vem?»)");
  }
  return eu;
}

function desenharMaterial() {
  const lista = $("#lista-material");
  lista.innerHTML = "";
  const claims = Object.entries(estado.material);

  for (const item of CATALOGO) {
    const meus = claims.filter(([, c]) => c.item === item.id);
    const preciso = Math.max(1, Math.ceil(estado.previsao / item.por));
    const completo = meus.length >= preciso;

    const div = document.createElement("div");
    div.className = "item" + (completo ? " completo" : "");

    const emoji = document.createElement("span");
    emoji.className = "emoji";
    emoji.textContent = item.emoji;

    const corpo = document.createElement("div");
    const nome = document.createElement("div");
    nome.className = "nome-item";
    nome.textContent = `${item.nome} · ${meus.length}/${preciso}`;
    const nota = document.createElement("div");
    nota.className = "nota";
    nota.textContent = item.nota;
    const barra = document.createElement("div");
    barra.className = "barra";
    const enchimento = document.createElement("div");
    barra.append(enchimento);
    const quem = document.createElement("div");
    quem.className = "quem";
    for (const [id, c] of meus) {
      const mf = document.createElement("span");
      mf.className = "mini-ficha";
      mf.append(c.nome);
      const x = document.createElement("button");
      x.textContent = "✕";
      x.title = "Já não levo";
      x.onclick = async () => {
        await api.remover("material", id).catch(() => avisar("😵 Falhou, tenta outra vez."));
        sincronizar();
      };
      mf.append(x);
      quem.append(mf);
    }
    corpo.append(nome, nota, barra, quem);

    const acao = document.createElement("div");
    if (completo) {
      const selo = document.createElement("span");
      selo.className = "selo";
      selo.textContent = "✅ Temos!";
      acao.append(selo);
    } else {
      const botao = document.createElement("button");
      botao.className = "botao";
      botao.textContent = "Eu levo 🙋";
      botao.onclick = async () => {
        const eu = quemSou();
        if (!eu) return;
        await api.adicionar("material", { item: item.id, nome: eu, t: Date.now() })
          .catch(() => avisar("😵 Falhou, tenta outra vez."));
        avisar(`Boa, ${eu}! ${item.emoji} ${item.nome} anotado.`);
        sincronizar();
      };
      acao.append(botao);
    }

    div.append(emoji, corpo, acao);
    lista.append(div);

    requestAnimationFrame(() => {
      enchimento.style.width = Math.min(100, (meus.length / preciso) * 100) + "%";
    });
  }
}

function desenharExtras() {
  const lista = $("#lista-extras");
  lista.innerHTML = "";
  const extras = Object.entries(estado.material)
    .filter(([, c]) => c.item === "_extra")
    .sort((a, b) => (a[1].t || 0) - (b[1].t || 0));

  for (const [id, c] of extras) {
    const ficha = document.createElement("span");
    ficha.className = "ficha";
    ficha.append(`${c.extra} — ${c.nome}`);
    const x = document.createElement("button");
    x.textContent = "✕";
    x.onclick = async () => {
      await api.remover("material", id).catch(() => avisar("😵 Falhou, tenta outra vez."));
      sincronizar();
    };
    ficha.append(x);
    lista.append(ficha);
  }
}

// ───────────── Eventos ─────────────
$("#form-pessoa").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = $("#input-nome").value.trim();
  if (!nome) return;
  const repetido = Object.values(estado.pessoas)
    .some((p) => p.nome.toLowerCase() === nome.toLowerCase());
  if (repetido) { avisar(`${nome} já está inscrito/a! 🙃`); return; }
  await api.adicionar("pessoas", { nome, t: Date.now() })
    .catch(() => avisar("😵 Falhou, tenta outra vez."));
  $("#input-nome").value = "";
  localStorage.setItem("coura-eu", nome);
  avisar(`Bem-vindo/a à tribo, ${nome}! 🏕️`);
  await sincronizar();
  $("#select-eu").value = nome;
});

$("#select-eu").addEventListener("change", (e) => {
  if (e.target.value) localStorage.setItem("coura-eu", e.target.value);
});

$("#input-previsao").addEventListener("change", async (e) => {
  const n = Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 20));
  e.target.value = n;
  estado.previsao = n;
  $("#eco-previsao").textContent = n;
  desenharMaterial();
  await api.definirPrevisao(n).catch(() => avisar("😵 Falhou a gravar a previsão."));
});

$("#form-extra").addEventListener("submit", async (e) => {
  e.preventDefault();
  const extra = $("#input-extra").value.trim();
  if (!extra) return;
  const eu = quemSou();
  if (!eu) return;
  await api.adicionar("material", { item: "_extra", extra, nome: eu, t: Date.now() })
    .catch(() => avisar("😵 Falhou, tenta outra vez."));
  $("#input-extra").value = "";
  avisar(`✨ ${extra} adicionado!`);
  sincronizar();
});

// ───────────── Checklist de essenciais (local) ─────────────
(function () {
  const grelha = $("#lista-essenciais");
  const feitos = JSON.parse(localStorage.getItem("coura-essenciais") || "{}");
  for (const [id, emoji, texto] of ESSENCIAIS) {
    const rotulo = document.createElement("label");
    rotulo.className = "essencial" + (feitos[id] ? " feito" : "");
    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.checked = !!feitos[id];
    const span = document.createElement("span");
    span.textContent = `${emoji} ${texto}`;
    caixa.onchange = () => {
      feitos[id] = caixa.checked;
      rotulo.classList.toggle("feito", caixa.checked);
      localStorage.setItem("coura-essenciais", JSON.stringify(feitos));
    };
    rotulo.append(caixa, span);
    grelha.append(rotulo);
  }
})();

// ═══════════════════════════════════════════════════════════════
//  CENÁRIO: dia → pôr-do-sol → noite, conforme o scroll
// ═══════════════════════════════════════════════════════════════
(function () {
  // estrelas aleatórias
  const grupoEstrelas = $("#estrelas");
  for (let i = 0; i < 90; i++) {
    const e = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    e.setAttribute("cx", Math.random() * 1440);
    e.setAttribute("cy", Math.random() * 480);
    e.setAttribute("r", (0.6 + Math.random() * 1.4).toFixed(2));
    e.setAttribute("class", "estrela");
    e.style.animationDelay = (Math.random() * 3).toFixed(2) + "s";
    grupoEstrelas.append(e);
  }
  grupoEstrelas.style.opacity = 0;

  // interpolação de cores hex
  const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  function mistura(a, b, p) {
    const [r1, g1, b1] = hex(a), [r2, g2, b2] = hex(b);
    return `rgb(${Math.round(r1 + (r2 - r1) * p)},${Math.round(g1 + (g2 - g1) * p)},${Math.round(b1 + (b2 - b1) * p)})`;
  }
  // céu: dia → pôr-do-sol → noite
  const TOPO  = ["#4aa3df", "#8a5aa6", "#0b1d3a"];
  const FUNDO = ["#bfe3f5", "#f2a65a", "#27436b"];
  function corCeu(paleta, p) {
    return p < 0.5 ? mistura(paleta[0], paleta[1], p * 2) : mistura(paleta[1], paleta[2], (p - 0.5) * 2);
  }

  const raiz = document.documentElement.style;
  const sol = $("#sol"), lua = $("#lua"), nuvens = $("#nuvens");
  const chamas = $("#chamas"), brilhoTenda = $("#brilho-tenda");
  const longe = $("#colina-longe"), meio = $("#colina-meio"),
        perto = $("#colina-perto"), rio = $("#rio"), campo = $("#acampamento");
  const barraProgresso = $("#barra-progresso");
  const clamp = (v) => Math.max(0, Math.min(1, v));

  let pedido = false;
  function pintar() {
    pedido = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? clamp(scrollY / max) : 0;
    const noite = clamp((p - 0.35) / 0.5); // 0 = dia, 1 = noite

    barraProgresso.style.width = p * 100 + "%";
    raiz.setProperty("--ceu-topo", corCeu(TOPO, p));
    raiz.setProperty("--ceu-fundo", corCeu(FUNDO, p));
    raiz.setProperty("--noite", noite.toFixed(3));

    // sol põe-se, lua nasce
    const porDoSol = clamp(p / 0.55);
    sol.style.transform = `translateY(${porDoSol * 560}px)`;
    sol.style.opacity = 1 - clamp((p - 0.4) / 0.15);
    lua.style.transform = `translateY(${(1 - noite) * 320}px)`;
    lua.style.opacity = noite;

    grupoEstrelas.style.opacity = noite;
    nuvens.style.opacity = 0.85 * (1 - noite);

    // fogueira e tenda acendem à noite
    chamas.style.opacity = clamp((noite - 0.55) / 0.45);
    brilhoTenda.style.opacity = clamp((noite - 0.55) / 0.45) * 0.85;

    // parallax das camadas
    longe.style.transform = `translateY(${p * 26}px)`;
    meio.style.transform  = `translateY(${p * 14}px)`;
    rio.style.transform   = `translateY(${p * 8}px)`;
    perto.style.transform = `translateY(${p * -6}px)`;
    campo.style.transform = `translateY(${p * -6}px)`;
  }
  addEventListener("scroll", () => {
    if (!pedido) { pedido = true; requestAnimationFrame(pintar); }
  }, { passive: true });
  addEventListener("resize", pintar);
  pintar();
})();

// ───────────── Revelação ao scroll ─────────────
const observador = new IntersectionObserver((entradas) => {
  for (const e of entradas) {
    if (e.isIntersecting) {
      e.target.classList.add("visivel");
      observador.unobserve(e.target);
    }
  }
}, { threshold: 0.12 });
document.querySelectorAll(".revela").forEach((el) => observador.observe(el));

// ───────────── Arranque ─────────────
$("#ano").textContent = new Date().getFullYear();
if (MODO_LOCAL) $("#aviso-local").hidden = false;

sincronizar(true);
setInterval(() => { if (!document.hidden) sincronizar(); }, 8000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) sincronizar(); });

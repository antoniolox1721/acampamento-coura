/* ═══════════════════════════════════════════════════════════════
   Paredes de Coura — Acampamento 2026
   Dados partilhados num "bucket" kvdb.io (sem contas, sem servidor),
   com backup automático para o repositório via GitHub Actions.
   Alternativa: Firebase (ver config.js). Sem ligação → modo local.
   ═══════════════════════════════════════════════════════════════ */

// ───────────── Catálogo de material de grupo ─────────────
// "por" = nº de pessoas por unidade (ex.: 1 fogão por cada 4 pessoas)
const CATALOGO = [
  { id: "fogao",      nome: "Fogão de campismo",             por: 4,  nota: "um por cada quatro pessoas" },
  { id: "gas",        nome: "Cartucho de gás",               por: 3,  nota: "vale mais sobrar do que faltar" },
  { id: "panela",     nome: "Panela ou tacho",               por: 4,  nota: "um por cada quatro pessoas" },
  { id: "frigideira", nome: "Frigideira",                    por: 5,  nota: "uma por cada cinco pessoas" },
  { id: "geleira",    nome: "Geleira ou mala térmica",       por: 5,  nota: "com termoacumuladores" },
  { id: "bidao",      nome: "Bidão de água, 5 L ou mais",    por: 4,  nota: "para cozinhar e lavar" },
  { id: "candeeiro",  nome: "Candeeiro de campismo",         por: 5,  nota: "para iluminar o acampamento" },
  { id: "coluna",     nome: "Coluna de som",                 por: 10, nota: "com bateria para a noite toda" },
  { id: "socorros",   nome: "Kit de primeiros socorros",     por: 10, nota: "pensos, betadine, paracetamol" },
  { id: "canivete",   nome: "Canivete ou abre-latas",        por: 5,  nota: "multiusos, de preferência" },
  { id: "tabua",      nome: "Tábua e faca de cozinha",       por: 10, nota: "para a equipa de chefes" },
  { id: "detergente", nome: "Detergente e esfregão",         por: 10, nota: "a loiça não se lava sozinha" },
  { id: "lixo",       nome: "Rolo de sacos do lixo",         por: 10, nota: "não deixamos rasto" },
  { id: "papel",      nome: "Papel de cozinha e higiénico",  por: 7,  nota: "nunca é demais" },
  { id: "toldo",      nome: "Toldo ou oleado",               por: 10, nota: "sombra de dia, abrigo à noite" },
  { id: "extensao",   nome: "Powerbank grande ou extensão",  por: 5,  nota: "para ninguém ficar sem bateria" },
];

// ───────────── Essenciais individuais (checklist local) ─────────────
const ESSENCIAIS = [
  ["tenda",     "Tenda — combina a partilha"],
  ["saco",      "Saco-cama"],
  ["colchao",   "Colchonete ou colchão insuflável"],
  ["frontal",   "Lanterna frontal"],
  ["protetor",  "Protetor solar"],
  ["repelente", "Repelente de insetos"],
  ["banho",     "Fato de banho"],
  ["toalha",    "Toalha"],
  ["chinelos",  "Chinelos"],
  ["agasalho",  "Agasalho para a noite"],
  ["chuva",     "Capa de chuva — é o Minho"],
  ["loica",     "Prato, copo e talheres reutilizáveis"],
  ["cantil",    "Cantil ou garrafa de água"],
  ["powerbank", "Powerbank pessoal"],
  ["medicacao", "Medicação pessoal"],
  ["dinheiro",  "Dinheiro em numerário"],
];

// ───────────── Camada de dados ─────────────
const CFG = window.CONFIG || {};
const DOC_VAZIO = () => ({ pessoas: {}, material: {}, previsao: 20 });
let modo = CFG.firebaseUrl ? "firebase" : CFG.kvdbBucket ? "kvdb" : "local";

const KV_URL = CFG.kvdbBucket ? `https://kvdb.io/${CFG.kvdbBucket}/dados` : "";
const FB_URL = (CFG.firebaseUrl || "").replace(/\/+$/, "");
const CHAVE_LOCAL = "coura-dados";
const novoId = () => "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const api = {
  async ler() {
    if (modo === "local") {
      return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "null") || DOC_VAZIO();
    }
    if (modo === "firebase") {
      const r = await fetch(`${FB_URL}/dados.json`);
      if (!r.ok) throw new Error("leitura falhou");
      return (await r.json()) || DOC_VAZIO();
    }
    const r = await fetch(KV_URL);
    if (r.status === 404) return DOC_VAZIO(); // ainda ninguém escreveu
    if (!r.ok) throw new Error("leitura falhou");
    return JSON.parse(await r.text());
  },

  // lê o estado mais recente, aplica a alteração e grava o documento inteiro
  async _mutar(alterar) {
    if (modo === "firebase") return; // firebase tem operações próprias
    const doc = await this.ler();
    doc.pessoas = doc.pessoas || {};
    doc.material = doc.material || {};
    doc.previsao = doc.previsao || 20;
    alterar(doc);
    if (modo === "local") {
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(doc));
      return;
    }
    const r = await fetch(KV_URL, { method: "PUT", body: JSON.stringify(doc) });
    if (!r.ok) throw new Error("gravação falhou");
  },

  async adicionar(ramo, valor) {
    if (modo === "firebase") {
      const r = await fetch(`${FB_URL}/dados/${ramo}.json`, { method: "POST", body: JSON.stringify(valor) });
      if (!r.ok) throw new Error("gravação falhou");
      return;
    }
    await this._mutar((doc) => { doc[ramo][novoId()] = valor; });
  },

  async remover(ramo, id) {
    if (modo === "firebase") {
      const r = await fetch(`${FB_URL}/dados/${ramo}/${id}.json`, { method: "DELETE" });
      if (!r.ok) throw new Error("remoção falhou");
      return;
    }
    await this._mutar((doc) => { delete doc[ramo][id]; });
  },

  async definirPrevisao(n) {
    if (modo === "firebase") {
      await fetch(`${FB_URL}/dados/previsao.json`, { method: "PUT", body: JSON.stringify(n) });
      return;
    }
    await this._mutar((doc) => { doc.previsao = n; });
  },
};

// ───────────── Estado ─────────────
let estado = DOC_VAZIO();
let assinaturaEstado = "";

const $ = (s) => document.querySelector(s);

function avisar(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("mostrar");
  clearTimeout(avisar._tempo);
  avisar._tempo = setTimeout(() => t.classList.remove("mostrar"), 2600);
}

function ativarModoLocal() {
  modo = "local";
  $("#aviso-local").hidden = false;
}

async function sincronizar() {
  try {
    const doc = await api.ler();
    estado.pessoas = doc.pessoas || {};
    estado.material = doc.material || {};
    estado.previsao = doc.previsao || 20;
    const assinatura = JSON.stringify(estado);
    if (assinatura !== assinaturaEstado) {
      assinaturaEstado = assinatura;
      desenharTudo();
    }
  } catch (e) {
    console.error(e);
    if (modo !== "local") {
      ativarModoLocal();
      avisar("Sem ligação à base partilhada — modo local ativado.");
      sincronizar();
    }
  }
}

// ───────────── Desenho ─────────────
function desenharTudo() {
  desenharPessoas();
  desenharMaterial();
  desenharExtras();
  requestAnimationFrame(construirTrilho);
}

function animarNumero(el, novo) {
  const antigo = parseInt(el.textContent, 10) || 0;
  if (antigo === novo) { el.textContent = novo; return; }
  const inicio = performance.now();
  (function passo(t) {
    const p = Math.min((t - inicio) / 550, 1);
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
    const et = document.createElement("span");
    et.className = "etiqueta";
    et.append(p.nome);
    const x = document.createElement("button");
    x.textContent = "✕";
    x.title = `Remover ${p.nome}`;
    x.onclick = async () => {
      if (!confirm(`Remover ${p.nome} da lista?`)) return;
      await api.remover("pessoas", id).catch(() => avisar("Não consegui gravar — tenta outra vez."));
      sincronizar();
    };
    et.append(x);
    lista.append(et);
  }

  const sel = $("#select-eu");
  const atual = localStorage.getItem("coura-eu") || sel.value;
  sel.innerHTML = '<option value="">— escolhe o teu nome —</option>';
  for (const [, p] of entradas) {
    const op = document.createElement("option");
    op.value = op.textContent = p.nome;
    sel.append(op);
  }
  if ([...sel.options].some((o) => o.value === atual)) sel.value = atual;

  $("#valor-previsao").textContent = estado.previsao;
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
    avisar("Primeiro diz-nos quem és — inscreve-te em «A tribo».");
  }
  return eu;
}

function desenharMaterial() {
  const lista = $("#lista-material");
  lista.innerHTML = "";
  const reclamacoes = Object.entries(estado.material);

  CATALOGO.forEach((item, i) => {
    const meus = reclamacoes.filter(([, c]) => c.item === item.id);
    const preciso = Math.max(1, Math.ceil(estado.previsao / item.por));
    const completo = meus.length >= preciso;

    const div = document.createElement("div");
    div.className = "item" + (completo ? " completo" : "");

    const idx = document.createElement("span");
    idx.className = "idx";
    idx.textContent = String(i + 1).padStart(2, "0");

    const corpo = document.createElement("div");
    const linha1 = document.createElement("div");
    linha1.className = "linha1";
    const nome = document.createElement("span");
    nome.className = "nome-item";
    nome.textContent = item.nome;
    const fracao = document.createElement("span");
    fracao.className = "fracao";
    fracao.textContent = `${meus.length} / ${preciso}`;
    linha1.append(nome, fracao);

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
      const mini = document.createElement("span");
      mini.className = "mini";
      mini.append(c.nome);
      const x = document.createElement("button");
      x.textContent = "✕";
      x.title = "Já não levo";
      x.onclick = async () => {
        await api.remover("material", id).catch(() => avisar("Não consegui gravar — tenta outra vez."));
        sincronizar();
      };
      mini.append(x);
      quem.append(mini);
    }
    corpo.append(linha1, nota, barra, quem);

    let acao;
    if (completo) {
      acao = document.createElement("span");
      acao.className = "selo";
      acao.textContent = "Completo";
    } else {
      acao = document.createElement("button");
      acao.className = "botao fantasma acao";
      acao.textContent = "Levo eu";
      acao.onclick = async () => {
        const eu = quemSou();
        if (!eu) return;
        await api.adicionar("material", { item: item.id, nome: eu, t: Date.now() })
          .catch(() => avisar("Não consegui gravar — tenta outra vez."));
        avisar(`Anotado: ${item.nome.toLowerCase()} — ${eu}.`);
        sincronizar();
      };
    }

    div.append(idx, corpo, acao);
    lista.append(div);

    requestAnimationFrame(() => {
      enchimento.style.width = Math.min(100, (meus.length / preciso) * 100) + "%";
    });
  });
}

function desenharExtras() {
  const lista = $("#lista-extras");
  lista.innerHTML = "";
  const extras = Object.entries(estado.material)
    .filter(([, c]) => c.item === "_extra")
    .sort((a, b) => (a[1].t || 0) - (b[1].t || 0));

  for (const [id, c] of extras) {
    const et = document.createElement("span");
    et.className = "etiqueta";
    et.append(`${c.extra} — ${c.nome}`);
    const x = document.createElement("button");
    x.textContent = "✕";
    x.onclick = async () => {
      await api.remover("material", id).catch(() => avisar("Não consegui gravar — tenta outra vez."));
      sincronizar();
    };
    et.append(x);
    lista.append(et);
  }
}

// ───────────── Eventos ─────────────
$("#form-pessoa").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = $("#input-nome").value.trim();
  if (!nome) return;
  const repetido = Object.values(estado.pessoas)
    .some((p) => p.nome.toLowerCase() === nome.toLowerCase());
  if (repetido) { avisar(`${nome} já está na lista.`); return; }
  await api.adicionar("pessoas", { nome, t: Date.now() })
    .catch(() => avisar("Não consegui gravar — tenta outra vez."));
  $("#input-nome").value = "";
  localStorage.setItem("coura-eu", nome);
  avisar(`Bem-vindo/a à tribo, ${nome}.`);
  await sincronizar();
  $("#select-eu").value = nome;
});

$("#select-eu").addEventListener("change", (e) => {
  if (e.target.value) localStorage.setItem("coura-eu", e.target.value);
});

function mudarPrevisao(delta) {
  const n = Math.max(1, Math.min(60, (estado.previsao || 20) + delta));
  estado.previsao = n;
  $("#valor-previsao").textContent = n;
  $("#eco-previsao").textContent = n;
  desenharMaterial();
  clearTimeout(mudarPrevisao._tempo);
  mudarPrevisao._tempo = setTimeout(() => {
    api.definirPrevisao(n).catch(() => avisar("Não consegui gravar a previsão."));
  }, 600);
}
$("#menos").addEventListener("click", () => mudarPrevisao(-1));
$("#mais").addEventListener("click", () => mudarPrevisao(1));

$("#form-extra").addEventListener("submit", async (e) => {
  e.preventDefault();
  const extra = $("#input-extra").value.trim();
  if (!extra) return;
  const eu = quemSou();
  if (!eu) return;
  await api.adicionar("material", { item: "_extra", extra, nome: eu, t: Date.now() })
    .catch(() => avisar("Não consegui gravar — tenta outra vez."));
  $("#input-extra").value = "";
  avisar(`Adicionado: ${extra}.`);
  sincronizar();
});

// ───────────── Checklist da mochila (guardada localmente) ─────────────
(function () {
  const grelha = $("#lista-essenciais");
  const feitos = JSON.parse(localStorage.getItem("coura-essenciais") || "{}");
  for (const [id, texto] of ESSENCIAIS) {
    const rotulo = document.createElement("label");
    rotulo.className = "essencial" + (feitos[id] ? " feito" : "");
    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.checked = !!feitos[id];
    const span = document.createElement("span");
    span.textContent = texto;
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
//  Cenário: anoitecer que escurece com o scroll + parallax
// ═══════════════════════════════════════════════════════════════
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// estrelas
const grupoEstrelas = $("#estrelas");
for (let i = 0; i < 110; i++) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  e.setAttribute("cx", (Math.random() * 1440).toFixed(1));
  e.setAttribute("cy", (Math.random() * 460).toFixed(1));
  e.setAttribute("r", (0.4 + Math.random() * 1.1).toFixed(2));
  e.setAttribute("class", "estrela");
  e.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
  e.style.animationDuration = (2.4 + Math.random() * 2.4).toFixed(2) + "s";
  grupoEstrelas.append(e);
}
grupoEstrelas.style.opacity = .35;

// interpolação de cores
const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
function mistura(a, b, p) {
  const [r1, g1, b1] = hex(a), [r2, g2, b2] = hex(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * p)},${Math.round(g1 + (g2 - g1) * p)},${Math.round(b1 + (b2 - b1) * p)})`;
}

// trilho que se desenha com o scroll
const trilho = $("#trilho");
const caminho = $("#trilho-caminho");
function construirTrilho() {
  const principal = document.querySelector("main");
  const h = principal.scrollHeight;
  trilho.setAttribute("viewBox", `0 0 130 ${h}`);
  const heroi = $("#hero");
  let d = `M65,${heroi.offsetTop + heroi.offsetHeight * 0.92}`;
  const seccoes = [...document.querySelectorAll("main section:not(#hero)")];
  seccoes.forEach((s, i) => {
    const y = s.offsetTop + s.offsetHeight / 2;
    const x = i % 2 ? 104 : 26;
    d += ` S${x},${y - 180} 65,${y}`;
  });
  caminho.setAttribute("d", d);
  caminho.style.strokeDasharray = "1";
  pintarCena();
}

const raiz = document.documentElement.style;
const serras = [["#serra-4", 48], ["#serra-3", 30], ["#serra-2", 14], ["#serra-1", -8]]
  .map(([s, v]) => [$(s), v]);
const lua = $("#lua");
const barraProgresso = $("#barra-progresso");

let pedido = false;
function pintarCena() {
  pedido = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? clamp01(scrollY / max) : 0;

  barraProgresso.style.width = p * 100 + "%";
  raiz.setProperty("--ceu-1", mistura("#16202a", "#05080c", p));
  raiz.setProperty("--ceu-2", mistura("#0d1310", "#070b09", p));

  grupoEstrelas.style.opacity = .35 + .65 * clamp01(p * 1.5);
  lua.style.transform = `translateY(${p * -46}px)`;
  for (const [g, v] of serras) g.style.transform = `translateY(${p * v}px)`;

  caminho.style.strokeDashoffset = 1 - p;
}
addEventListener("scroll", () => {
  if (!pedido) { pedido = true; requestAnimationFrame(pintarCena); }
}, { passive: true });
addEventListener("resize", construirTrilho);
addEventListener("load", construirTrilho); // recalcular depois das fontes carregarem

// revelação ao scroll
const observador = new IntersectionObserver((entradas) => {
  for (const e of entradas) {
    if (e.isIntersecting) {
      e.target.classList.add("visivel");
      observador.unobserve(e.target);
    }
  }
}, { threshold: 0.1 });
document.querySelectorAll(".revela").forEach((el) => observador.observe(el));

// ───────────── Arranque ─────────────
$("#ano").textContent = new Date().getFullYear();
if (modo === "local") $("#aviso-local").hidden = false;

construirTrilho();
sincronizar();
setInterval(() => { if (!document.hidden) sincronizar(); }, 8000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) sincronizar(); });

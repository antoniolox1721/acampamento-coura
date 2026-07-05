/* ═══════════════════════════════════════════════════════════════
   Paredes de Coura · Acampamento 2026
   Dados partilhados num "bin" público do npoint.io (sem contas,
   sem servidor), com backup automático para o repositório via
   GitHub Actions. Alternativa: Firebase (ver config.js).
   Sem ligação → modo local.
   ═══════════════════════════════════════════════════════════════ */

// ───────────── Conteúdo editável ─────────────
// As listas do que há para levar e os dias em votação vivem em
// catalogo.js, pensado para ser editado por qualquer pessoa.
const CATALOGO = window.CATALOGO || [];
const ESSENCIAIS = window.ESSENCIAIS || [];

// ───────────── Camada de dados ─────────────
const CFG = window.CONFIG || {};
const DOC_VAZIO = () => ({ pessoas: {}, material: {}, votos: {}, previsao: 20 });

// dias em votação para a partida (editáveis em catalogo.js)
const DIAS_PARTIDA = window.DIAS_PARTIDA || [];

// chave segura para usar o nome como identificador: hex dos bytes UTF-8,
// válida em qualquer backend (o Firebase não aceita ".#$[]/" nem percent-encoding)
const chaveNome = (nome) =>
  Array.from(new TextEncoder().encode(nome.toLowerCase().trim()))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
let modo = CFG.firebaseUrl ? "firebase" : CFG.storeUrl ? "nuvem" : "local";

const LOJA_URL = CFG.storeUrl || "";
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
    // parâmetro único para furar a cache/CDN do npoint (leituras sempre frescas)
    const r = await fetch(`${LOJA_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (r.status === 404) return DOC_VAZIO(); // ainda ninguém escreveu
    if (!r.ok) throw new Error("leitura falhou");
    const bruto = JSON.parse(await r.text());
    // loja pública: se alguém a apagar (null) ou lá puser lixo, trata como vazia
    return bruto && typeof bruto === "object" && !Array.isArray(bruto) ? bruto : DOC_VAZIO();
  },

  // lê o estado mais recente, aplica a alteração e grava o documento inteiro
  async _mutar(alterar) {
    if (modo === "firebase") return; // firebase tem operações próprias
    const doc = await this.ler();
    doc.pessoas = doc.pessoas || {};
    doc.material = doc.material || {};
    doc.votos = doc.votos || {};
    doc.previsao = doc.previsao || 20;
    alterar(doc);
    if (modo === "local") {
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(doc));
      return;
    }
    // POST em vez de PUT: pedido "simples" para o browser, sem preflight CORS
    const r = await fetch(LOJA_URL, { method: "POST", body: JSON.stringify(doc) });
    if (!r.ok) throw new Error("gravação falhou");
    aplicarDoc(doc); // refletir já na interface o documento que acabámos de gravar
  },

  // inscrição com verificação de duplicados feita sobre o documento acabado
  // de ler (não sobre o estado do ecrã, que pode estar desatualizado)
  async adicionarPessoa(valor) {
    if (modo === "firebase") return this.adicionar("pessoas", valor);
    await this._mutar((doc) => {
      const chave = chaveNome(valor.nome);
      const existe = Object.values(doc.pessoas).some(
        (p) => p && typeof p.nome === "string" && chaveNome(p.nome) === chave
      );
      if (existe) {
        const e = new Error("nome repetido");
        e.duplicado = true;
        throw e; // aborta antes de gravar
      }
      doc.pessoas[novoId()] = valor;
    });
  },

  // liga um nome existente a este dispositivo (para quem se inscreveu
  // antes de haver marcas, ou acabou de se inscrever)
  async adotarPessoa(id) {
    if (modo === "firebase") {
      await fetch(`${FB_URL}/dados/pessoas/${id}/marca.json`, { method: "PUT", body: JSON.stringify(MARCA) });
      return;
    }
    await this._mutar((doc) => {
      const p = doc.pessoas[id];
      if (!p) throw new Error("pessoa desapareceu");
      if (p.marca && p.marca !== MARCA) {
        const e = new Error("nome ligado a outro dispositivo");
        e.ocupado = true;
        throw e; // aborta antes de gravar
      }
      p.marca = MARCA;
    });
  },

  // reclamação de material: no máximo uma por pessoa por item,
  // verificada sobre o documento acabado de ler
  async reclamar(valor) {
    if (modo === "firebase") return this.adicionar("material", valor);
    await this._mutar((doc) => {
      const chave = chaveNome(valor.nome);
      const repetido = Object.values(doc.material).some((c) =>
        c && c.item === valor.item && typeof c.nome === "string" && chaveNome(c.nome) === chave
      );
      if (repetido) {
        const e = new Error("item já reclamado por esta pessoa");
        e.duplicado = true;
        throw e; // aborta antes de gravar
      }
      doc.material[novoId()] = valor;
    });
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

  // voto único por pessoa; dia = null anula o voto
  async votar(nome, dia) {
    const chave = chaveNome(nome);
    if (modo === "firebase") {
      const r = await fetch(`${FB_URL}/dados/votos/${chave}.json`, dia === null
        ? { method: "DELETE" }
        : { method: "PUT", body: JSON.stringify({ nome, dia, t: Date.now() }) });
      if (!r.ok) throw new Error("voto falhou");
      return;
    }
    await this._mutar((doc) => {
      if (dia === null) delete doc.votos[chave];
      else doc.votos[chave] = { nome, dia, t: Date.now() };
    });
  },

  // remover uma pessoa arrasta o voto e as reclamações de material dela
  async removerPessoa(id, nome) {
    if (modo === "firebase") {
      await this.remover("pessoas", id);
      await fetch(`${FB_URL}/dados/votos/${chaveNome(nome)}.json`, { method: "DELETE" });
      const meus = Object.entries(estado.material).filter(([, c]) => c.nome === nome);
      for (const [mid] of meus) await this.remover("material", mid);
      return;
    }
    await this._mutar((doc) => {
      delete doc.pessoas[id];
      delete doc.votos[chaveNome(nome)];
      for (const [mid, c] of Object.entries(doc.material)) {
        if (c.nome === nome) delete doc.material[mid];
      }
    });
  },
};

// ───────────── Identidade do dispositivo ─────────────
// Cada dispositivo tem uma marca aleatória. Ao inscrever ou usar um nome,
// o nome fica ligado a essa marca: outros dispositivos deixam de poder
// votar ou reclamar material em nome dessa pessoa.
const MARCA = (() => {
  let m = localStorage.getItem("coura-marca");
  if (!m) {
    m = crypto.randomUUID ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem("coura-marca", m);
  }
  return m;
})();

// ───────────── Estado ─────────────
let estado = DOC_VAZIO();
let assinaturaEstado = "";

function pessoaPorNome(nome) {
  const chave = chaveNome(nome);
  return Object.entries(estado.pessoas).find(([, p]) => chaveNome(p.nome) === chave);
}
const possoUsar = (p) => !p.marca || p.marca === MARCA;

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

// gravação falhada: avisa e mostra a faixa, para ninguém perder dados sem saber
function falhaGravacao(msg) {
  avisar(msg);
  const faixa = $("#aviso-local");
  faixa.textContent = "Há problemas a gravar na base partilhada: as tuas alterações podem não estar a ficar guardadas.";
  faixa.hidden = false;
}

// o bucket é público e escrevível por qualquer pessoa: ao ler, ignora
// entradas malformadas para que dados estranhos nunca partam a interface
const CHAVES_PERIGOSAS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_ENTRADAS = 600; // teto defensivo: um flood não congela o browser de ninguém

function sanear(ramo, valido) {
  const limpo = {};
  if (!ramo || typeof ramo !== "object") return limpo;
  let n = 0;
  for (const [id, v] of Object.entries(ramo)) {
    if (CHAVES_PERIGOSAS.has(id)) continue;         // evita poluição de protótipo
    if (!v || typeof v !== "object" || !valido(v)) continue;
    if (++n > MAX_ENTRADAS) break;                  // ignora o excesso de um flood
    limpo[id] = v;
  }
  return limpo;
}

// corta strings compridas antes de as mostrar (nem tudo tem limite no schema)
const corta = (s, n = 40) => String(s).slice(0, n);

function aplicarDoc(doc) {
  if (!doc || typeof doc !== "object") doc = DOC_VAZIO();
  // uma pessoa por nome: se uma corrida criar duplicados, vale a inscrição mais antiga
  const pessoas = sanear(doc.pessoas, (p) => typeof p.nome === "string" && p.nome.trim());
  const porChave = {};
  for (const [id, p] of Object.entries(pessoas)) {
    const chave = chaveNome(p.nome);
    if (!porChave[chave] || (p.t || 0) < (porChave[chave][1].t || 0)) porChave[chave] = [id, p];
  }
  estado.pessoas = Object.fromEntries(Object.values(porChave));

  // material: no máximo uma reclamação por pessoa por item do catálogo
  // (vale a mais antiga); extras ficam como estão
  const material = sanear(doc.material, (c) => typeof c.nome === "string" && typeof c.item === "string");
  estado.material = {};
  const reclamados = new Set();
  for (const [id, c] of Object.entries(material).sort((a, b) => (a[1].t || 0) - (b[1].t || 0))) {
    const chave = c.item === "_extra" ? id : `${c.item}|${chaveNome(c.nome)}`;
    if (reclamados.has(chave)) continue;
    reclamados.add(chave);
    estado.material[id] = c;
  }

  // um voto por pessoa inscrita: a chave tem de bater certo com o nome do voto,
  // e o nome tem de pertencer à tribo (ignora votos forjados diretamente na loja)
  const inscritos = new Set(Object.keys(porChave));
  const votos = sanear(doc.votos, (v) => typeof v.nome === "string" && DIAS_PARTIDA.some((o) => o.dia === v.dia));
  estado.votos = {};
  for (const [chave, v] of Object.entries(votos)) {
    if (chave === chaveNome(v.nome) && inscritos.has(chave)) estado.votos[chave] = v;
  }
  if (mudarPrevisao._pendente) {
    // há uma alteração local da previsão a caminho; não a deixes reverter
    doc.previsao = estado.previsao;
  }
  estado.previsao = Math.max(1, Math.min(60, parseInt(doc.previsao, 10) || 20));
  const assinatura = JSON.stringify(estado);
  if (assinatura !== assinaturaEstado) {
    assinaturaEstado = assinatura;
    desenharTudo();
  }
}

async function sincronizar() {
  try {
    aplicarDoc(await api.ler());
  } catch (e) {
    console.error(e);
    if (modo !== "local") {
      ativarModoLocal();
      avisar("Sem ligação à base partilhada: modo local ativado.");
      sincronizar();
    }
  }
}

// ───────────── Desenho ─────────────
function desenharTudo() {
  desenharPessoas();
  desenharVotos();
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
    et.append(corta(p.nome));
    const x = document.createElement("button");
    x.textContent = "✕";
    x.title = `Remover ${corta(p.nome)}`;
    x.onclick = async () => {
      if (!confirm(`Remover ${p.nome} da lista? O voto e o material dessa pessoa também saem.`)) return;
      await api.removerPessoa(id, p.nome).catch(() => falhaGravacao("Não consegui gravar. Tenta outra vez."));
      sincronizar();
    };
    et.append(x);
    lista.append(et);
  }

  const sel = $("#select-eu");
  const atual = localStorage.getItem("coura-eu") || sel.value;
  sel.innerHTML = '<option value="">escolhe o teu nome…</option>';
  for (const [, p] of entradas) {
    const op = document.createElement("option");
    op.value = corta(p.nome);
    if (possoUsar(p)) {
      op.textContent = corta(p.nome);
    } else {
      op.textContent = `${corta(p.nome)} 🔒`;
      op.disabled = true;
      op.title = "Ligado a outro dispositivo";
    }
    sel.append(op);
  }
  // só repõe a seleção se o nome pertence mesmo a este dispositivo;
  // se o ponteiro guardado for de outra pessoa, larga-o (auto-cura)
  const chaveAtual = atual ? chaveNome(atual) : "";
  const meu = chaveAtual && entradas.find(([, p]) => chaveNome(p.nome) === chaveAtual && p.marca === MARCA);
  if (meu) sel.value = corta(meu[1].nome);
  else if (chaveAtual && entradas.some(([, p]) => chaveNome(p.nome) === chaveAtual)) localStorage.removeItem("coura-eu");

  $("#valor-previsao").textContent = estado.previsao;
  $("#eco-previsao").textContent = estado.previsao;
}

function quemSou() {
  const eu = $("#select-eu").value;
  if (eu) {
    const par = pessoaPorNome(eu);
    if (par && !possoUsar(par[1])) {
      avisar("Esse nome está ligado a outro dispositivo.");
      return "";
    }
  }
  if (!eu) {
    const caixa = $(".quem-sou");
    caixa.classList.remove("atencao");
    void caixa.offsetWidth; // reinicia a animação
    caixa.classList.add("atencao");
    caixa.scrollIntoView({ behavior: "smooth", block: "center" });
    avisar("Primeiro diz-nos quem és: inscreve-te em «A tribo».");
  }
  return eu;
}

function desenharVotos() {
  const caixa = $("#opcoes-voto");
  caixa.innerHTML = "";
  const votos = Object.values(estado.votos || {});
  const total = votos.length;
  const eu = $("#select-eu").value;
  const meuVoto = eu ? (estado.votos[chaveNome(eu)] || {}).dia : null;
  const maximo = Math.max(0, ...DIAS_PARTIDA.map((o) => votos.filter((v) => v.dia === o.dia).length));

  for (const opcao of DIAS_PARTIDA) {
    const meus = votos.filter((v) => v.dia === opcao.dia).sort((a, b) => (a.t || 0) - (b.t || 0));
    const lider = maximo > 0 && meus.length === maximo;

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "opcao" + (meuVoto === opcao.dia ? " minha" : "") + (lider ? " lider" : "");
    botao.setAttribute("aria-pressed", meuVoto === opcao.dia);

    const semana = document.createElement("span");
    semana.className = "dia-semana";
    semana.textContent = opcao.semana;

    const num = document.createElement("span");
    num.className = "dia-num";
    num.textContent = opcao.dia;
    const mes = document.createElement("span");
    mes.className = "dia-mes";
    mes.textContent = "de agosto";

    const barra = document.createElement("div");
    barra.className = "barra";
    const enchimento = document.createElement("div");
    barra.append(enchimento);

    const linha = document.createElement("div");
    linha.className = "votos-linha";
    const numVotos = document.createElement("span");
    numVotos.className = "votos-num";
    numVotos.textContent = meus.length === 1 ? "1 voto" : `${meus.length} votos`;
    linha.append(numVotos);
    if (lider) {
      const selo = document.createElement("span");
      selo.className = "selo-lider";
      selo.textContent = "à frente";
      linha.append(selo);
    }

    const quem = document.createElement("div");
    quem.className = "quem";
    for (const v of meus) {
      const mini = document.createElement("span");
      mini.className = "mini";
      mini.textContent = corta(v.nome);
      quem.append(mini);
    }

    botao.append(semana, num, mes, barra, linha, quem);
    botao.onclick = async () => {
      const nome = quemSou();
      if (!nome) return;
      const anular = meuVoto === opcao.dia;
      try {
        await api.votar(nome, anular ? null : opcao.dia);
      } catch {
        falhaGravacao("Não consegui gravar o voto. Tenta outra vez.");
        return;
      }
      avisar(anular ? "Voto anulado." : `Voto registado: ${opcao.semana.toLowerCase()}, ${opcao.dia} de agosto.`);
      sincronizar();
    };

    caixa.append(botao);
    requestAnimationFrame(() => {
      enchimento.style.width = total ? (meus.length / total) * 100 + "%" : "0%";
    });
  }
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
      mini.append(corta(c.nome));
      const x = document.createElement("button");
      x.textContent = "✕";
      x.title = "Já não levo";
      x.onclick = async () => {
        await api.remover("material", id).catch(() => falhaGravacao("Não consegui gravar. Tenta outra vez."));
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
        if (meus.some(([, c]) => chaveNome(c.nome) === chaveNome(eu))) {
          avisar(`Já tens ${item.nome.toLowerCase()} anotado.`);
          return;
        }
        try {
          await api.reclamar({ item: item.id, nome: eu, t: Date.now() });
        } catch (e) {
          if (e && e.duplicado) avisar(`Já tens ${item.nome.toLowerCase()} anotado.`);
          else falhaGravacao("Não consegui gravar. Tenta outra vez.");
          return;
        }
        avisar(`Anotado: ${item.nome.toLowerCase()}, por ${eu}.`);
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
    et.append(`${corta(c.extra)} · ${corta(c.nome)}`);
    const x = document.createElement("button");
    x.textContent = "✕";
    x.title = `Remover ${corta(c.extra)}`;
    x.setAttribute("aria-label", `Remover ${corta(c.extra)}`);
    x.onclick = async () => {
      await api.remover("material", id).catch(() => falhaGravacao("Não consegui gravar. Tenta outra vez."));
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
  try {
    await api.adicionarPessoa({ nome, t: Date.now(), marca: MARCA });
  } catch (e) {
    if (e && e.duplicado) avisar(`${nome} já está na lista.`);
    else falhaGravacao("Não consegui gravar. Tenta outra vez.");
    return;
  }
  $("#input-nome").value = "";
  localStorage.setItem("coura-eu", nome);
  avisar(`Bem-vindo/a à tribo, ${nome}.`);
  await sincronizar();
  $("#select-eu").value = nome;
  desenharVotos();
});

$("#select-eu").addEventListener("change", async (e) => {
  const nome = e.target.value;
  if (!nome) { desenharVotos(); return; }
  const par = pessoaPorNome(nome);
  if (par) {
    const [id, p] = par;
    if (!possoUsar(p)) {
      avisar("Esse nome está ligado a outro dispositivo.");
      e.target.value = "";
      desenharVotos();
      return;
    }
    if (!p.marca) {
      // nome ainda sem dono: só o liga a este dispositivo com confirmação
      // explícita, para nunca "roubar" o nome de outra pessoa sem querer
      const confirmar = confirm(
        `És mesmo tu, ${nome}? Isto liga este nome a este dispositivo, ` +
        `para mais ninguém votar ou levar material por ti. ` +
        `Não escolhas o nome de outra pessoa.`
      );
      if (!confirmar) {
        e.target.value = "";
        desenharVotos();
        return;
      }
      try {
        await api.adotarPessoa(id);
      } catch (err) {
        if (err && err.ocupado) {
          avisar("Esse nome acabou de ficar ligado a outro dispositivo.");
          e.target.value = "";
          sincronizar();
          return;
        }
      }
    }
  }
  localStorage.setItem("coura-eu", nome);
  desenharVotos(); // destacar o "meu" voto
});

function mudarPrevisao(delta) {
  const n = Math.max(1, Math.min(60, (estado.previsao || 20) + delta));
  estado.previsao = n;
  $("#valor-previsao").textContent = n;
  $("#eco-previsao").textContent = n;
  desenharMaterial();
  mudarPrevisao._pendente = true;
  clearTimeout(mudarPrevisao._tempo);
  mudarPrevisao._tempo = setTimeout(async () => {
    try {
      await api.definirPrevisao(n);
    } catch {
      falhaGravacao("Não consegui gravar a previsão.");
    }
    mudarPrevisao._pendente = false;
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
  try {
    await api.adicionar("material", { item: "_extra", extra, nome: eu, t: Date.now() });
  } catch {
    falhaGravacao("Não consegui gravar. Tenta outra vez.");
    return;
  }
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

// pirilampos a vaguear junto às encostas
const grupoPirilampos = $("#pirilampos");
for (let i = 0; i < 14; i++) {
  const f = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  f.setAttribute("cx", (60 + Math.random() * 1320).toFixed(1));
  f.setAttribute("cy", (590 + Math.random() * 250).toFixed(1));
  f.setAttribute("r", (1.3 + Math.random() * 1.3).toFixed(2));
  f.setAttribute("class", "pirilampo");
  f.style.setProperty("--dur", (2.4 + Math.random() * 2.8).toFixed(2) + "s");
  f.style.setProperty("--dx", ((Math.random() - 0.5) * 30).toFixed(1) + "px");
  f.style.setProperty("--dy", ((Math.random() - 0.5) * 22).toFixed(1) + "px");
  f.style.animationDelay = (Math.random() * -6).toFixed(2) + "s";
  grupoPirilampos.append(f);
}
grupoPirilampos.style.opacity = .55;

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
  grupoPirilampos.style.opacity = .35 + .65 * clamp01(p * 1.5); // acendem com a noite
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

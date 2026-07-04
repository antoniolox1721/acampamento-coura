/* ═══════════════════════════════════════════════════════════════
   📝 CATÁLOGO DO ACAMPAMENTO · edita este ficheiro à vontade
   ═══════════════════════════════════════════════════════════════

   Este é O ficheiro para mudar o que há para levar. Não precisas de
   tocar em mais nenhum. Como editar diretamente no GitHub:

   1. Abre https://github.com/antoniolox1721/acampamento-coura/edit/main/catalogo.js
   2. Edita, carrega em "Commit changes" (verde, duas vezes)
   3. Espera 1 a 2 minutos e o site atualiza sozinho

   Regras simples:
   · Cada linha entre { } é um item; não te esqueças da vírgula no fim
   · "id" tem de ser único e sem espaços nem acentos (ex.: "rede_voleibol")
   · "por" = quantas pessoas partilham 1 unidade
     (por: 4 significa 1 unidade por cada 4 pessoas)
   · "nota" é o texto pequeno que aparece por baixo do nome
*/

// ───────────── MATERIAL DE GRUPO (partilhado, reclamável no site) ─────────────
window.CATALOGO = [
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
  { id: "mesa",       nome: "Mesa e cadeiras de campismo",   por: 5,  nota: "um conjunto por grupo de cinco" },
  { id: "extensao",   nome: "Powerbank grande ou extensão",  por: 5,  nota: "para ninguém ficar sem bateria" },

  // 👇 PARA ADICIONAR UM ITEM NOVO: copia a linha abaixo, tira as barras
  //    do início, e muda o id, o nome, o "por" e a nota.
  // { id: "novo_item",  nome: "Nome do item novo",           por: 5,  nota: "descrição curta" },
];

// ───────────── MOCHILA INDIVIDUAL (checklist pessoal) ─────────────
// Formato: ["id_unico", "Texto que aparece na lista"]
window.ESSENCIAIS = [
  ["tenda",     "Tenda (combina a partilha)"],
  ["saco",      "Saco-cama"],
  ["colchao",   "Colchonete ou colchão insuflável"],
  ["frontal",   "Lanterna frontal"],
  ["protetor",  "Protetor solar"],
  ["repelente", "Repelente de insetos"],
  ["banho",     "Fato de banho"],
  ["toalha",    "Toalha"],
  ["chinelos",  "Chinelos"],
  ["agasalho",  "Agasalho para a noite"],
  ["chuva",     "Capa de chuva (é o Minho)"],
  ["loica",     "Prato, copo e talheres reutilizáveis"],
  ["cantil",    "Cantil ou garrafa de água"],
  ["powerbank", "Powerbank pessoal"],
  ["medicacao", "Medicação pessoal"],
  ["dinheiro",  "Dinheiro em numerário"],

  // 👇 PARA ADICIONAR: copia a linha abaixo e tira as barras do início.
  // ["novo_id",   "Coisa nova para levar"],
];

// ───────────── DIAS EM VOTAÇÃO PARA A PARTIDA ─────────────
// ⚠️ Se mudares os dias depois de já haver votos, os votos nos dias
//    que desapareceram deixam de contar.
window.DIAS_PARTIDA = [
  { dia: 7, semana: "Sexta" },
  { dia: 8, semana: "Sábado" },
  { dia: 9, semana: "Domingo" },
];

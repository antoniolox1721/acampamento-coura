# 🏕️ Guia rápido do site do acampamento

Tudo o que precisas para gerir o site, num sítio só. Guarda este link:
**https://github.com/antoniolox1721/acampamento-coura/blob/main/GUIA.md**

## 🔗 Links importantes

| O quê | Link |
| --- | --- |
| 🌐 O site (partilha este com a malta) | https://antoniolox1721.github.io/acampamento-coura/ |
| 🗄️ Editor da base de dados (não partilhes!) | https://www.npoint.io/docs/a2e2646cfda692c8bc65 |
| 📦 A base de dados em bruto (JSON) | https://api.npoint.io/a2e2646cfda692c8bc65 |
| 💾 Backup automático (de 12 em 12 horas) | https://github.com/antoniolox1721/acampamento-coura/blob/main/dados-backup.json |
| 📁 O código todo | https://github.com/antoniolox1721/acampamento-coura |

## ✏️ Mudar o que há para levar (o mais comum)

Está tudo num único ficheiro, `catalogo.js`, feito para ser fácil:

1. Abre **https://github.com/antoniolox1721/acampamento-coura/edit/main/catalogo.js**
2. Faz as alterações; há linhas de exemplo comentadas prontas a copiar
   (procura o 👇)
3. Carrega em **Commit changes** (botão verde, confirma no segundo botão)
4. Espera 1 a 2 minutos e recarrega o site

Nesse ficheiro consegues:
- **Adicionar ou tirar material de grupo** (fogões, tachos, etc.) e ajustar
  o rácio: `por: 4` significa 1 unidade por cada 4 pessoas
- **Mudar a checklist da mochila individual**
- **Mudar os dias em votação** (cuidado: votos em dias removidos deixam de contar)

## 📝 Mudar textos do site

Os textos (títulos, descrições, frases) estão em `index.html`:
https://github.com/antoniolox1721/acampamento-coura/edit/main/index.html
Procura o texto que queres mudar (Ctrl+F), edita e faz commit como acima.

## 🗄️ Editar a base de dados (pessoas, votos, material reclamado)

Abre o editor: https://www.npoint.io/docs/a2e2646cfda692c8bc65
Edita o JSON e carrega em **Save**. O site atualiza em segundos.

Estrutura:
```json
{
  "previsao": 20,
  "pessoas":  { "k123": { "nome": "Ana", "t": 0 } },
  "material": { "k456": { "item": "fogao", "nome": "Ana", "t": 0 },
                "k789": { "item": "_extra", "extra": "Rede", "nome": "Rui", "t": 0 } },
  "votos":    { "616e61": { "nome": "Ana", "dia": 8, "t": 0 } }
}
```

⚠️ Três cuidados:
- **Nunca** carregues em "Lock data..." no editor: isso impede o site de gravar
- Os votos têm chaves codificadas; muda votos pelo site, não à mão
- Não partilhes o link do editor: quem o tiver pode apagar tudo

## 🔓 Desbloquear um nome (mudou de telemóvel, limpou o browser, etc.)

Cada nome fica ligado ao dispositivo que o usa (campo `marca` na pessoa),
para ninguém votar em nome de outros. Se alguém perder o acesso:
1. Abre o editor da base de dados (link acima)
2. Encontra a pessoa em `pessoas` e apaga a linha `"marca": "..."`
   (só essa linha, e a vírgula a mais se ficar)
3. **Save**. No próximo acesso, o dispositivo da pessoa volta a ligar o nome.

## 🛡️ Escudo contra vandalismo

A base de dados tem um **schema trancado** (definitivo, ninguém o pode
remover): o npoint rejeita automaticamente escritas vazias, nulas, ou que
apaguem toda a gente, o mesmo tipo de ataque que já aconteceu uma vez.
Nota: por causa disso, a lista de pessoas nunca pode ficar completamente
vazia; para "começar do zero" deixa sempre pelo menos uma pessoa.
Vandalismo mais sofisticado continua possível (a base é pública por
natureza); para isso existe o backup abaixo.

## 🆘 Recuperar de um desastre

Se alguém apagar ou estragar os dados:
1. Abre o backup: https://github.com/antoniolox1721/acampamento-coura/blob/main/dados-backup.json
   (o histórico do ficheiro tem versões mais antigas: botão *History*)
2. Copia o conteúdo
3. Cola no editor da base de dados e carrega em **Save**

## 🧭 Onde está cada coisa

| Ficheiro | Para quê |
| --- | --- |
| `catalogo.js` | ✏️ O que há para levar e os dias da votação (edita este!) |
| `index.html` | Textos e estrutura da página |
| `style.css` | Cores, tipos de letra, animações |
| `app.js` | Lógica (não precisas de mexer) |
| `config.js` | Onde vivem os dados partilhados |
| `GUIA.md` | Este guia |

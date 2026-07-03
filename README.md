# 🏕️ Acampamento · Paredes de Coura

Site público para organizar o acampamento: cada pessoa inscreve-se, escolhe o
material de grupo que leva (1 fogão por cada 4 pessoas, 1 tacho por cada 4, etc.)
e consulta a checklist de essenciais individuais. Adeus, Excel.

**Site:** https://antoniolox1721.github.io/acampamento-coura/

---

## ⚡ Ativar os dados partilhados (5 minutos, grátis)

O GitHub Pages só serve ficheiros estáticos, por isso os dados partilhados
(quem vem + quem leva o quê) vivem numa **Firebase Realtime Database** gratuita.
Enquanto não a configurares, o site funciona em «modo local» (cada pessoa só
vê os seus próprios dados).

1. Vai a [console.firebase.google.com](https://console.firebase.google.com) e
   entra com a tua conta Google.
2. **Criar projeto** → dá-lhe um nome (ex.: `acampamento-coura`) → podes
   desativar o Google Analytics → **Criar**.
3. No menu lateral: **Criação (Build) → Realtime Database → Criar base de dados**.
   Escolhe a localização `europe-west1` e começa em **modo bloqueado**.
4. No separador **Regras (Rules)**, cola isto e carrega em **Publicar**:

   ```json
   {
     "rules": {
       "dados": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```

   > ⚠️ Isto deixa qualquer pessoa com o link ler e escrever — é esse o
   > objetivo (site aberto para os amigos preencherem). Não guardes lá nada
   > sensível.

5. Copia o URL da base de dados que aparece no topo (algo como
   `https://acampamento-coura-default-rtdb.europe-west1.firebasedatabase.app`).
6. Abre o ficheiro [`config.js`](config.js) e cola o URL:

   ```js
   window.CONFIG = {
     dbUrl: "https://acampamento-coura-default-rtdb.europe-west1.firebasedatabase.app"
   };
   ```

7. Faz commit e push — dois minutos depois o site está partilhado:

   ```bash
   git add config.js
   git commit -m "Liga a base de dados partilhada"
   git push
   ```

## 🛠️ Desenvolver localmente

Não há build nem dependências — abre o `index.html` no browser, ou:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## 📁 Estrutura

| Ficheiro     | O que faz                                                        |
| ------------ | ---------------------------------------------------------------- |
| `index.html` | Estrutura da página + cenário SVG animado (dia → noite ao scroll) |
| `style.css`  | Estilos, animações (fogueira, estrelas, nuvens, parallax)         |
| `app.js`     | Lógica: inscrições, material de grupo, extras, checklist          |
| `config.js`  | URL da Firebase Realtime Database                                 |

## 🧮 Como são calculadas as quantidades

O catálogo em `app.js` define quantas pessoas partilham cada item
(ex.: `por: 4` = 1 unidade por cada 4 pessoas). As quantidades necessárias
são calculadas a partir da «previsão total de pessoas» definida no site
(por omissão, 20). Para mudar itens ou rácios, edita o array `CATALOGO`.

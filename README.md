# Paredes de Coura · Acampamento 2026

Site público para organizar o acampamento: cada pessoa inscreve-se, reclama o
material de grupo que pode levar (um fogão por cada quatro pessoas, um tacho
por cada quatro, etc.) e consulta a checklist da mochila. Adeus, Excel.

**Site:** https://antoniolox1721.github.io/acampamento-coura/

## Como funcionam os dados partilhados

O GitHub Pages só serve ficheiros estáticos: não aceita escritas de visitantes
anónimos, e qualquer token de escrita publicado no site seria revogado
automaticamente pelo GitHub. Por isso os dados vivem no sítio mais simples
possível que aceita escritas:

- **npoint.io**: um "bin" público de JSON, grátis, sem contas nem
  verificações. O URL do bin está em [`config.js`](config.js); qualquer pessoa
  com o link do site lê e escreve (é esse o objetivo).
- **Backup no repositório**: o GitHub Actions
  ([`.github/workflows/backup.yml`](.github/workflows/backup.yml)) descarrega
  os dados de 12 em 12 horas e faz commit de `dados-backup.json`. Se o bucket
  desaparecer um dia, os dados estão aqui, com histórico no git. As visitas
  regulares também mantêm o bucket ativo.
- **Modo local (fallback)**: se o site não conseguir contactar o bucket,
  avisa e guarda os dados apenas no dispositivo, em vez de falhar.

### Alternativa mais robusta: Firebase (opcional, 5 min)

Se o npoint.io se revelar instável, cria uma
[Firebase Realtime Database](https://console.firebase.google.com) gratuita:

1. **Criar projeto** → Realtime Database → **Criar base de dados**
   (`europe-west1`, modo bloqueado).
2. Nas **Regras**, publica:
   ```json
   { "rules": { "dados": { ".read": true, ".write": true } } }
   ```
3. Copia o URL da base (ex.:
   `https://xxx-default-rtdb.europe-west1.firebasedatabase.app`) para
   `firebaseUrl` em `config.js`; passa a ter prioridade sobre o npoint.
4. Para migrar os dados existentes, importa o `dados-backup.json` na consola
   do Firebase (Realtime Database → ⋮ → *Import JSON*), dentro de um nó `dados`.

## Desenvolver localmente

Não há build nem dependências:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Estrutura

| Ficheiro                       | O que faz                                                            |
| ------------------------------ | -------------------------------------------------------------------- |
| `index.html`                   | Estrutura da página e cenário SVG (serra ao anoitecer)               |
| `style.css`                    | Design, tipografia e animações                                       |
| `app.js`                       | Lógica: tribo, material, extras, checklist, cenário animado ao scroll |
| `config.js`                    | Onde vivem os dados (npoint.io ou Firebase)                          |
| `.github/workflows/backup.yml` | Backup automático dos dados para o repositório                       |

## Limitações conhecidas

- As escritas gravam o documento inteiro (ler → alterar → gravar). Se duas
  pessoas gravarem exatamente ao mesmo tempo, uma das alterações pode
  perder-se; se a tua entrada desaparecer, volta a submetê-la.
- O bin é público e escrevível por quem tiver o URL (que está no código da
  página). Para um grupo de amigos é aceitável; o backup de 12 em 12 horas no
  git permite recuperar de vandalismo.

## Ajustar itens e rácios

O array `CATALOGO` no topo de `app.js` define cada item e quantas pessoas
partilham uma unidade (`por: 4` = 1 unidade por cada 4 pessoas). As quantidades
são calculadas a partir da «previsão total» definida na secção *A tribo*.

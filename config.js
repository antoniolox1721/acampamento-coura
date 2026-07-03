// ⚙️ ONDE VIVEM OS DADOS PARTILHADOS
//
// Por omissão, os dados vivem num "bucket" público do kvdb.io — grátis,
// sem contas e sem servidor. O GitHub Actions faz backup do conteúdo
// para este repositório de 12 em 12 horas (ver .github/workflows/backup.yml).
//
// Se preferires uma base mais robusta, cria uma Firebase Realtime Database
// (instruções no README.md) e preenche firebaseUrl — passa a ter prioridade.
window.CONFIG = {
  kvdbBucket: "3adAvzpGcAY9audDMRdHqR",
  firebaseUrl: ""
};

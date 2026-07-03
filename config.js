// ⚙️ ONDE VIVEM OS DADOS PARTILHADOS
//
// Por omissão, os dados vivem num "bin" público do npoint.io: grátis,
// sem contas, sem verificações de email. O GitHub Actions faz backup do
// conteúdo para este repositório de 12 em 12 horas (.github/workflows/backup.yml).
//
// Se um dia for preciso algo mais robusto, cria uma Firebase Realtime
// Database (instruções no README.md) e preenche firebaseUrl, que passa
// a ter prioridade.
window.CONFIG = {
  storeUrl: "https://api.npoint.io/a2e2646cfda692c8bc65",
  firebaseUrl: ""
};

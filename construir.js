/*
 * Constrói a demo do começo ao fim, num comando só.
 * uso: node construir.js <slug> [--zip] [--estrito]
 *
 * Faz, na ordem certa (a ordem importa: o montar_demo reescreve o HTML inteiro
 * e devolve o link do Google Fonts, então o fontes_locais vem depois):
 *   1. montar_demo.js .......... HTML + .htaccess + LEIA-ME.txt + validador
 *   2. fontes_locais.js ........ fonte no próprio domínio, só subset latin
 *   3. limpa imagem sem uso .... foto que ficou na pasta e o HTML não pede
 *   4. --zip ................... pacote em pacotes/
 *
 * Com --estrito, para tudo se o validador acusar qualquer coisa.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const slug = args[0];
if (!slug) { console.error('uso: node construir.js <slug> [--zip] [--estrito]'); process.exit(1); }
const zipar = args.includes('--zip');
const estrito = args.includes('--estrito');

const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'exemplos', slug, 'demo.json'), 'utf8'));
const DEST = path.join(__dirname, 'saida', D.arquivo);
const node = (arq, argv, env) => execFileSync(process.execPath, [path.join(__dirname, arq), ...argv],
  { encoding: 'utf8', env: Object.assign({}, process.env, env || {}) });

console.log('== 1. HTML, .htaccess, LEIA-ME e validação');
try {
  process.stdout.write(node('montar_demo.js', [slug], estrito ? { ESTRITO: '1' } : {}));
} catch (e) {
  process.stdout.write(e.stdout || '');
  console.error('>>> o validador reprovou. Corrija o demo.json e rode de novo.');
  process.exit(2);
}

console.log('== 2. fontes no próprio domínio');
process.stdout.write(node('fontes_locais.js', [DEST]));

console.log('== 3. imagens sem uso');
const html = fs.readFileSync(path.join(DEST, 'index.html'), 'utf8');
const pastaImg = path.join(DEST, 'img');
if (fs.existsSync(pastaImg)) {
  const sobra = fs.readdirSync(pastaImg).filter(f => !html.includes('img/' + f));
  sobra.forEach(f => fs.unlinkSync(path.join(pastaImg, f)));
  if (!fs.readdirSync(pastaImg).length) { fs.rmdirSync(pastaImg); console.log('   pasta img removida (demo sem foto)'); }
  console.log('   ' + (sobra.length ? 'removidas: ' + sobra.join(', ') : 'nenhuma sobrando'));
}

/* peso final da pasta, que é o que o visitante baixa */
const soma = d => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) =>
  s + (e.isDirectory() ? soma(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log('== pasta final: ' + Math.round(soma(DEST) / 1024) + ' KB');

if (zipar) {
  console.log('== 4. pacote');
  const zip = path.join(__dirname, 'pacotes', D.arquivo + '.zip');
  fs.mkdirSync(path.dirname(zip), { recursive: true });
  /* tar.exe do Windows, não Compress-Archive: o do PowerShell 5.1 grava
     "img\hero.webp" com barra invertida, e extrator de Linux (o de muitos painéis de hospedagem) pode
     criar um arquivo chamado assim na raiz em vez da pasta img/. Caminho
     absoluto porque, chamado do Git Bash, "tar" é o GNU, que não faz zip. */
  if (fs.existsSync(zip)) fs.unlinkSync(zip);
  execFileSync('C:/Windows/System32/tar.exe', ['-a', '-c', '-f', zip, '-C', DEST, ...fs.readdirSync(DEST)]);
  console.log('   ' + path.basename(zip) + '  ' + Math.round(fs.statSync(zip).size / 1024) + ' KB');
}

console.log('\npronto: ' + path.relative(process.cwd(), path.join(DEST, 'index.html')));

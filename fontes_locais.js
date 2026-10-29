/*
 * Traz as fontes do Google para o próprio domínio da demo.
 * uso: node fontes_locais.js <pasta-da-demo>
 *
 * Por que: o <link> para fonts.googleapis.com custa duas conexões externas e,
 * carregado com media="print", troca a fonte depois da primeira pintura — o que
 * desloca o layout e derruba a nota (numa das demos, isso segurou a nota do
 * Lighthouse em 87). Com a fonte no próprio domínio, ela entra junto com o CSS.
 *
 * O que o script faz: lê a URL css2 do HTML, baixa o CSS com UA de Chrome (para
 * receber woff2), guarda só os subsets latin e latin-ext, baixa os arquivos em
 * <demo>/fonts/ e troca o <link> por um @font-face local com preload.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const dir = process.argv[2];
if (!dir) { console.error('uso: node fontes_locais.js <pasta-da-demo>'); process.exit(1); }
const arqHtml = path.join(dir, 'index.html');
let html = fs.readFileSync(arqHtml, 'utf8');

const mLink = html.match(/<link rel="stylesheet"[^>]*href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/);
if (!mLink) { console.log(path.basename(dir) + ': nao achei link do Google Fonts (talvez ja esteja local)'); process.exit(0); }
const urlCss = mLink[1].replace(/&amp;/g, '&');

const curl = (u, bin) => execFileSync('curl', ['-sL', '--compressed', '--max-time', '30', '-A', UA, u],
  { maxBuffer: 64 * 1024 * 1024, encoding: bin ? 'buffer' : 'utf8' });

const css = curl(urlCss);
const pastaFontes = path.join(dir, 'fonts');
fs.mkdirSync(pastaFontes, { recursive: true });

/* o CSS vem em blocos @font-face, um por subset; ficamos com latin e latin-ext */
const blocos = css.split('@font-face').slice(1).map(b => '@font-face' + b.split('}')[0] + '}');
const saida = [];
const baixados = new Map();
const grupos = {};
let pulados = 0;

for (const b of blocos) {
  const subset = (b.match(/\/\*\s*([a-z0-9-]+)\s*\*\//) || [])[1] || (css.match(new RegExp('\\/\\*\\s*([a-z0-9-]+)\\s*\\*\\/\\s*' + b.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) || [])[1];
  const fam = (b.match(/font-family:\s*'([^']+)'/) || [])[1];
  const peso = (b.match(/font-weight:\s*([^;]+);/) || [])[1] || '400';
  const estilo = (b.match(/font-style:\s*([^;]+);/) || [])[1] || 'normal';
  const src = (b.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
  if (!fam || !src) continue;
  const bloco = css.slice(Math.max(0, css.indexOf(src) - 400), css.indexOf(src));
  const sub = (bloco.match(/\/\*\s*([a-z0-9-]+)\s*\*\/[^*]*$/) || [])[1] || subset || 'latin';
  /* só o subset latin: ele já cobre ã, õ, ç e acentos do português. O latin-ext
     dobra o peso da fonte para caracteres do leste europeu que não usamos. */
  if (sub !== 'latin') { pulados++; continue; }
  const nome = (fam.replace(/\s+/g, '') + '-' + peso.replace(/\s+/g, '') + '-' + estilo + '-' + sub + '.woff2').toLowerCase();
  if (!baixados.has(src)) {
    fs.writeFileSync(path.join(pastaFontes, nome), curl(src, true));
    baixados.set(src, nome);
  }
  /* O Google serve fonte variável: o mesmo arquivo cobre vários pesos. Então
     junta os pesos num só @font-face com faixa, em vez de repetir o arquivo. */
  const unicode = (b.match(/unicode-range:\s*([^;]+);/) || [])[1];
  const chave = src + '|' + estilo.trim();
  const reg = grupos[chave] = grupos[chave] || { fam, estilo: estilo.trim(), arq: baixados.get(src), unicode, pesos: [] };
  peso.trim().split(/\s+/).forEach(p => reg.pesos.push(+p));
}

for (const g of Object.values(grupos)) {
  const min = Math.min(...g.pesos), max = Math.max(...g.pesos);
  saida.push('@font-face{font-family:"' + g.fam + '";font-style:' + g.estilo +
    ';font-weight:' + (min === max ? min : min + ' ' + max) +
    ';font-display:swap;src:url("fonts/' + g.arq + '") format("woff2")' +
    (g.unicode ? ';unicode-range:' + g.unicode.trim() : '') + '}');
}

if (!saida.length) { console.log(path.basename(dir) + ': nenhum arquivo de fonte baixado — deixei como estava'); process.exit(1); }

/* Preload de fonte só quando a página NÃO pré-carrega imagem de hero: as duas
   coisas competem pela mesma banda e o LCP, que é a imagem, piora. Numa das demos,
   isso derrubou a nota de 96 para 94. */
const temHeroImg = /rel="preload" as="image"/.test(html);
const porFamilia = {};
for (const [src, nome] of baixados) {
  const fam = nome.split('-')[0];
  (porFamilia[fam] = porFamilia[fam] || []).push(nome);
}
const preload = temHeroImg ? '' : Object.values(porFamilia).map(l => l.filter(n => /latin-/.test(n) === false)[0] || l[0])
  .map(n => '<link rel="preload" as="font" type="font/woff2" href="fonts/' + n + '" crossorigin>').join('\n');

/* troca o link remoto (e o noscript) pelo @font-face local */
html = html
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*\n?/, '')
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*\n?/, '')
  .replace(/<link rel="stylesheet" media="print"[^>]*\n?[^>]*>\s*\n?/, '')
  .replace(/<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*><\/noscript>\s*\n?/, '')
  .replace('<style>', preload + '\n\n<style>\n  /* fontes servidas do proprio dominio: sem conexao externa e sem troca de fonte depois da pintura */\n  ' + saida.join('\n  ') + '\n');

fs.writeFileSync(arqHtml, html, 'utf8');
const total = [...baixados.values()].reduce((s, n) => s + fs.statSync(path.join(pastaFontes, n)).size, 0);
console.log(path.basename(dir) + ': ' + baixados.size + ' arquivos de fonte (' + Math.round(total / 1024) + ' KB), ' +
  pulados + ' subsets descartados · link do Google removido');

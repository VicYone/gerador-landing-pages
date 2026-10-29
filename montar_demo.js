/*
 * Monta uma landing page a partir de exemplos/<slug>/demo.json.
 * uso: node montar_demo.js <slug> [pasta-da-demo]
 *
 * O esqueleto (topo fixo, hero com imagem responsiva, seções, barra do celular,
 * rodapé, JSON-LD) é o mesmo das demos escritas à mão — o que muda por negócio é
 * paleta, fontes, fotos e conteúdo. Regras que o gerador garante sozinho:
 *   - <meta name="robots" content="noindex, nofollow"> (demo é cópia do site do cliente)
 *   - meta viewport, preload do hero com srcset, width/height em toda imagem
 *   - alvo de toque >= 44px, foco visível, texto de acento só em tom que passa
 *     contraste (o campo tema.acentoTexto é o tom escuro, para fundo claro)
 *   - nada de afirmação inventada: o que o negócio não confirmou vira comentário
 *     CONFIRMAR COM O CLIENTE no HTML
 */
const fs = require('fs');
const path = require('path');

const [slug, destArg] = process.argv.slice(2);
if (!slug) { console.error('uso: node montar_demo.js <slug> [pasta]'); process.exit(1); }
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'exemplos', slug, 'demo.json'), 'utf8'));
const DEST = destArg || path.join(__dirname, 'saida', D.arquivo);

/* Atalho de escrita: com "wa": "5511999999999" no topo do demo.json, qualquer
   texto "wa:Mensagem pronta" vira https://wa.me/<numero>?text=<mensagem codificada>
   ("wa:" sozinho = sem mensagem). Um número só, digitado uma vez: é onde o erro
   de dígito entrava quando cada link era escrito inteiro. */
if (D.wa) {
  const expande = v => typeof v === 'string'
    ? v.replace(/(^|href=\\?")wa:([^"]*?)(?=\\?"|$)/g, (m, pre, txt) =>
        pre + 'https://wa.me/' + D.wa + (txt ? '?text=' + encodeURIComponent(txt) : ''))
    : Array.isArray(v) ? v.map(expande)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, expande(x)])) : v;
  Object.assign(D, expande(Object.fromEntries(Object.entries(D).filter(([k]) => k !== 'ldjson'))));
}
if (D.ldjson) { D.ldjson.name = D.ldjson.name || D.nome; D.ldjson.url = D.ldjson.url || D.canonical; }

const esc = s => String(s == null ? '' : s);
const enc = s => encodeURIComponent(String(s));
const SVG_WAPP = '<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.5-.6.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.4-.5-.6-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 1.9 3 4.6 4.1 2.2.9 2.7.8 3.2.7.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.2-.2-.2-.5-.4M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.3A10 10 0 1 0 12 2"/></svg>';
const SVG_TEL = c => `<svg width="20" height="20" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="M6.6 10.8c1.2 2.3 3.1 4.2 5.4 5.4l1.8-1.8c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V19c0 .6-.4 1-1 1A16 16 0 0 1 4 6c0-.6.4-1 1-1h3.2c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1z"/></svg>`;
const SVG_MAIL = c => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>`;
const SVG_INSTA = c => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.2" fill="${c}" stroke="none"/></svg>`;
const SVG_PINO = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5"/></svg>';
const SVG_CHECK = c => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>`;

const ico = (nome, cor) => nome === 'wapp' ? SVG_WAPP : nome === 'tel' ? SVG_TEL(cor)
  : nome === 'mail' ? SVG_MAIL(cor) : nome === 'insta' ? SVG_INSTA(cor) : SVG_CHECK(cor);

function botao(b, contexto) {
  const classe = b.classe || 'btn-acento';
  const alvo = /^https?:/.test(b.href) ? ' target="_blank" rel="noopener"' : '';
  const icone = b.icone ? ico(b.icone, '#fff') + ' ' : '';
  return `<a class="btn ${classe}${contexto === 'bloco' ? ' btn-bloco' : ''}" href="${esc(b.href)}"${alvo}>${icone}${esc(b.label)}</a>`;
}

/* ---------------- seções ---------------- */
function secCards(s, T) {
  return `
<section${s.id ? ` id="${s.id}"` : ''}${s.fundo ? ` class="fundo-${s.fundo}"` : ''}>
  <div class="wrap">
    ${cabecalho(s)}
    <div class="cards">
      ${s.itens.map(i => `<article class="card">
        ${i.img ? `<img src="img/${i.img}" width="${i.w || 700}" height="${i.h || 420}" alt="${esc(i.alt)}" loading="lazy">` : ''}
        <div class="corpo">
          <h3>${esc(i.h3)}</h3>
          <p>${esc(i.p)}</p>
          ${i.tags ? `<div class="tags">${i.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
          ${i.href ? `<a class="mais" href="${esc(i.href)}"${/^https?:/.test(i.href) ? ' target="_blank" rel="noopener"' : ''}>${esc(i.linkLabel || 'Saber mais')}</a>` : ''}
        </div>
      </article>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function secPassos(s) {
  return `
<section${s.id ? ` id="${s.id}"` : ''} class="faixa">
  <div class="wrap">
    ${cabecalho(s)}
    <div class="passos">
      ${s.itens.map((i, n) => `<div class="passo"><b>${String(n + 1).padStart(2, '0')}</b><h3>${esc(i.h3)}</h3><p>${esc(i.p)}</p></div>`).join('\n      ')}
    </div>
    ${s.nota ? `<p class="nota">${s.nota}</p>` : ''}
  </div>
</section>`;
}

function secDuas(s) {
  return `
<section${s.id ? ` id="${s.id}"` : ''}${s.fundo ? ` class="fundo-${s.fundo}"` : ''}>
  <div class="wrap">
    <div class="duas${s.inverte ? ' inverte' : ''}">
      <img src="img/${s.img}" width="${s.w || 800}" height="${s.h || 600}" alt="${esc(s.alt)}" loading="lazy">
      <div>
        ${cabecalho(s, true)}
        ${s.itens ? `<div class="lista">
          ${s.itens.map(i => `<div class="item">${SVG_CHECK('var(--acento-txt)')}<div><b>${esc(i.b)}</b><span>${esc(i.span)}</span></div></div>`).join('\n          ')}
        </div>` : ''}
        ${s.botao ? botao(s.botao) : ''}
      </div>
    </div>
    ${s.galeria ? `<div class="galeria">
      ${s.galeria.map(g => `<figure><img src="img/${g.img}" width="${g.w || 600}" height="${g.h || 450}" alt="${esc(g.alt)}" loading="lazy"><figcaption>${esc(g.cap)}</figcaption></figure>`).join('\n      ')}
    </div>` : ''}
  </div>
</section>`;
}

function secPerfis(s) {
  return `
<section${s.id ? ` id="${s.id}"` : ''} class="fundo-claro">
  <div class="wrap">
    ${cabecalho(s)}
    <div class="perfis">
      ${s.itens.map(i => `<div class="perfil"><b>${esc(i.b)}</b><span>${esc(i.span)}</span></div>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function secUnidades(s) {
  return `
<section${s.id ? ` id="${s.id}"` : ''}${s.escura ? ' class="faixa"' : ''}>
  <div class="wrap">
    ${cabecalho(s)}
    <div class="unidades">
      ${s.itens.map(u => `<article class="un${u.embreve ? ' embreve' : ''}">
        ${u.embreve ? `<span class="selo-breve">${esc(u.embreve)}</span>` : ''}
        <h3><span class="pino">${SVG_PINO}</span> ${esc(u.nome)}</h3>
        <dl>
          ${u.linhas.map(l => `<div><dt>${esc(l.rot)}</dt><dd>${l.valor}</dd></div>`).join('\n          ')}
        </dl>
        ${u.botoes ? `<div class="acoes">${u.botoes.map(b => botao(b)).join('')}</div>` : ''}
      </article>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function secGaleria(s) {
  return `
<section${s.id ? ` id="${s.id}"` : ''}${s.fundo ? ` class="fundo-${s.fundo}"` : ''}>
  <div class="wrap">
    ${cabecalho(s)}
    <div class="galeria">
      ${s.itens.map(g => `<figure><img src="img/${g.img}" width="${g.w || 600}" height="${g.h || 450}" alt="${esc(g.alt)}" loading="lazy">${g.cap ? `<figcaption>${esc(g.cap)}</figcaption>` : ''}</figure>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function secFaq(s) {
  return `
<section${s.id ? ` id="${s.id}"` : ''}${s.fundo ? ` class="fundo-${s.fundo}"` : ''}>
  <div class="wrap">
    ${cabecalho(s)}
    <div class="faq">
      ${s.itens.map((i, n) => `<details${n === 0 ? ' open' : ''}>
        <summary>${esc(i.q)}</summary>
        <p>${esc(i.r)}</p>
      </details>`).join('\n      ')}
    </div>
    ${s.botao ? `<div class="acoes" style="margin-top:22px">${botao(s.botao)}</div>` : ''}
  </div>
</section>`;
}

function secContato(s) {
  return `
<section${s.id ? ` id="${s.id}"` : ''} class="${s.escura ? 'faixa' : 'fundo-claro'}">
  <div class="wrap">
    ${cabecalho(s)}
    <div class="duas-caixas">
      <div class="caixa">
        <h3>${esc(s.caixa1.h3)}</h3>
        ${s.caixa1.p ? `<p>${esc(s.caixa1.p)}</p>` : ''}
        <div class="canais">
          ${s.caixa1.canais.map(c => `<a class="canal" href="${esc(c.href)}"${/^https?:/.test(c.href) ? ' target="_blank" rel="noopener"' : ''}>
            <span class="ico">${ico(c.icone, 'var(--acento-txt)')}</span>
            <span><b>${esc(c.b)}</b><span>${esc(c.span)}</span></span>
          </a>`).join('\n          ')}
        </div>
      </div>
      <div class="caixa">
        <h3>${esc(s.caixa2.h3)}</h3>
        ${s.caixa2.p ? `<p>${esc(s.caixa2.p)}</p>` : ''}
        ${s.caixa2.itens ? `<div class="lista">
          ${s.caixa2.itens.map(i => `<div class="item">${SVG_CHECK('var(--acento-txt)')}<div><b>${esc(i.b)}</b><span>${esc(i.span)}</span></div></div>`).join('\n          ')}
        </div>` : ''}
        ${s.caixa2.botao ? botao(s.caixa2.botao, 'bloco') : ''}
      </div>
    </div>
  </div>
</section>`;
}

function cabecalho(s, semMargem) {
  if (!s.h2 && !s.olho) return '';
  return `<div class="cab"${semMargem ? ' style="margin-bottom:10px"' : ''}>
      ${s.olho ? `<span class="olho">${esc(s.olho)}</span>` : ''}
      ${s.h2 ? `<h2>${s.h2}</h2>` : ''}
      ${s.p ? `<p>${esc(s.p)}</p>` : ''}
    </div>`;
}

const montadores = { cards: secCards, passos: secPassos, duas: secDuas, perfis: secPerfis,
  unidades: secUnidades, galeria: secGaleria, faq: secFaq, contato: secContato };

/* ---------------- documento ---------------- */
const t = D.tema;
/* Texto do botão de acento: branco só quando passa. Acento claro (laranja,
   amarelo, verde-água) leva o tom escuro do próprio tema — escolhido aqui, para
   não depender de alguém lembrar. tema.botaoTexto força uma cor, se precisar. */
{
  const l = h => { const c = h.replace('#', ''); return 0.2126 * g(c.slice(0, 2)) + 0.7152 * g(c.slice(2, 4)) + 0.0722 * g(c.slice(4, 6)); };
  function g(x) { const v = parseInt(x, 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  const r = (a, b) => { const [x, y] = [l(a), l(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  if (!t.botaoTexto && /^#[0-9a-f]{6}$/i.test(t.acento || '')) {
    const escuro = /^#[0-9a-f]{6}$/i.test(t.escuro || '') ? t.escuro : '#111111';
    t.botaoTexto = r('#ffffff', t.acento) >= 4.5 || r('#ffffff', t.acento) >= r(escuro, t.acento) ? '#ffffff' : escuro;
  }
}
const f = D.fontes;
const escuroTotal = t.modo === 'escuro';
if (escuroTotal) for (const k of ['fundo', 'cartao', 'forte'])
  if (!t[k]) throw new Error('tema.modo "escuro" pede tema.' + k);
const lado = D.hero.lado;
const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${esc(D.titulo)}</title>
<meta name="description" content="${esc(D.descricao)}">
<meta name="theme-color" content="${t.escuro}">
<link rel="canonical" href="${esc(D.canonical)}">

<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(D.nome)}">
<meta property="og:title" content="${esc(D.ogTitulo || D.titulo)}">
<meta property="og:description" content="${esc(D.ogDescricao || D.descricao)}">
<meta property="og:url" content="${esc(D.canonical)}">
${(D.hero.img || D.marca.img) ? `<meta property="og:image" content="${esc(D.canonical.replace(/\/$/, ''))}/img/${D.hero.img || D.marca.img}">` : ''}
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="data:image/svg+xml,${enc(D.favicon)}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${D.hero.img ? `<link rel="preload" as="image" href="img/${D.hero.imgSmall}"
      imagesrcset="img/${D.hero.imgSmall} ${D.hero.wSmall}w, img/${D.hero.img} ${D.hero.w}w"
      imagesizes="100vw" fetchpriority="high">` : lado ? `<link rel="preload" as="image" href="img/${lado.img}" fetchpriority="high">` : ""}
<link rel="stylesheet" media="print" onload="this.media='all'"
  href="https://fonts.googleapis.com/css2?${f.import}&display=swap">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${f.import}&display=swap"></noscript>

<style>
  :root{
    /* cores tiradas do site atual do cliente; o tom --acento-txt é a versão
       escura do acento, para texto sobre fundo claro passar em contraste */
    --escuro:${t.escuro};
    --escuro2:${t.escuro2};
    --acento:${t.acento};
    --acento-txt:${t.acentoTexto};
    --claro:${t.claro};
    --claro2:${t.claro2};
    --tinta:${t.tinta};
    --suave:${t.suave};
    --linha:${t.linha};
    --wapp:#25D366;
    --titulo:${f.titulo};
    --corpo:${f.corpo};
    /* --display: fonte da marca e dos numerais do hero. Em oficina, retífica e
       centro automotivo a condensada em caixa alta é o que dá o ar do ramo;
       em clínica e escritório vale deixar igual ao título. */
    --display:${f.display || f.titulo};
    --r:${(D.tema.raio || 15)}px; --r-lg:${Math.round((D.tema.raio || 15) * 1.6)}px;
    /* fundo da página, dos cartões e cor dos títulos internos. No tema claro é
       o branco de sempre; tema.modo "escuro" (marca preta, barbearia, tattoo)
       troca os três e o resto do CSS acompanha. */
    --fundo:${escuroTotal ? t.fundo : '#fff'};
    --cartao:${escuroTotal ? t.cartao : '#fff'};
    --forte:${escuroTotal ? t.forte : 'var(--escuro)'};
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth;scroll-padding-top:84px;-webkit-text-size-adjust:100%}
  body{font-family:var(--corpo);color:var(--tinta);background:var(--fundo);line-height:1.62;
       -webkit-font-smoothing:antialiased;overflow-x:hidden;overflow-wrap:break-word}
  /* e-mail e registro longos nao podem empurrar a largura da pagina no celular */
  .canal b,.canal span span,.rodape li,.rodape .fim,.un dd{overflow-wrap:anywhere}
  img{max-width:100%;display:block}
  a{color:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent}
  h1,h2,h3{font-family:var(--titulo);line-height:1.12;letter-spacing:-.02em;font-weight:${f.peso || 800}}
  .wrap{width:min(1180px,92vw);margin-inline:auto}
  :focus-visible{outline:3px solid var(--acento);outline-offset:3px;border-radius:8px}
  em{font-style:normal;color:var(--acento-txt)}
  .faixa em,.hero em{color:var(--acento)}

  .topo{position:sticky;top:0;z-index:50;background:${t.topoEscuro ? 'rgba(0,0,0,.82)' : 'rgba(255,255,255,.93)'};
        ${t.topoEscuro ? 'color:#fff;' : ''}backdrop-filter:blur(10px);
        border-bottom:1px solid ${t.topoEscuro ? 'rgba(255,255,255,.12)' : 'var(--linha)'}}
  .topo .in{display:flex;align-items:center;gap:20px;padding:11px 0}
  .marca{display:flex;flex-direction:column;line-height:1.1}
  .marca b{font-family:var(--display);font-size:${D.marca.condensada ? '1.4rem' : '1.12rem'};
           ${D.marca.condensada ? 'text-transform:uppercase;letter-spacing:.055em' : 'letter-spacing:-.01em'}}
  .marca span{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--acento-txt)}
  .topo.escuro .marca span{color:var(--acento)}
  .marca img{width:${D.marca.largura || 132}px;height:auto}
  .nav{display:flex;gap:20px;margin-left:auto;font-size:.93rem;font-weight:600}
  .nav a{padding:7px 0;border-bottom:2px solid transparent}
  .nav a:hover{border-color:var(--acento)}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-weight:700;
       border-radius:999px;padding:14px 22px;font-size:1rem;min-height:46px;
       transition:transform .15s ease,box-shadow .15s ease}
  .btn:active{transform:translateY(1px)}
  .btn-wapp{background:var(--wapp);color:#06331C}
  .btn-acento{background:var(--acento);color:${t.botaoTexto || '#fff'}}
  .btn-escuro{background:var(--escuro);color:#fff}
  .btn-linha{border:2px solid currentColor}
  .btn-claro{background:var(--claro2);color:var(--escuro)}
  .btn-bloco{width:100%;margin-top:auto}
  .topo .btn{padding:11px 18px;font-size:.93rem;min-height:42px}
  .abre{display:none;margin-left:auto;background:none;border:0;padding:8px;cursor:pointer;color:inherit}
  .abre span{display:block;width:26px;height:2px;background:currentColor;margin:5px 0;border-radius:2px}

  .hero{position:relative;background:var(--escuro);color:#fff;overflow:hidden}
  .hero img.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:${D.hero.opacidade || .55}}
  .hero::after{content:"";position:absolute;inset:0;background:linear-gradient(${D.hero.grau || 100}deg,
    ${t.heroGrad || 'rgba(0,0,0,.9) 0%,rgba(0,0,0,.7) 52%,rgba(0,0,0,.38) 100%'})}
  .hero .in{position:relative;z-index:2;padding:clamp(52px,8vw,96px) 0 clamp(40px,6vw,68px);max-width:740px}
  .olho{display:inline-flex;gap:8px;align-items:center;${D.marca.condensada
    ? 'font-family:var(--display);font-size:.95rem;letter-spacing:.16em;'
    : 'font-size:.8rem;letter-spacing:.15em;'}font-weight:700;
        text-transform:uppercase;color:var(--acento);
        border:1px solid color-mix(in srgb,var(--acento) 42%,transparent);
        background:color-mix(in srgb,var(--acento) 13%,transparent);padding:7px 14px;border-radius:999px}
  .hero h1{font-size:clamp(2.05rem,5.4vw,3.6rem);margin:19px 0 15px}
  .hero p.sub{font-size:clamp(1.02rem,2vw,1.22rem);color:rgba(255,255,255,.86);max-width:54ch}
  .acoes{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
  /* dois formatos para os números do hero: cartões separados (padrão) ou tira
     única com divisórias de 1px, que é o que dá o ar industrial */
  .numeros{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));margin-top:36px;
           position:relative;z-index:2;${D.hero.numerosEstilo === 'tira'
    ? 'gap:1px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.16)'
    : 'gap:12px'}}
  .numeros div{${D.hero.numerosEstilo === 'tira'
    ? 'background:rgba(0,0,0,.34);padding:16px 18px'
    : 'border:1px solid rgba(255,255,255,.2);border-radius:var(--r);padding:15px 17px;background:rgba(255,255,255,.07)'}}
  .numeros b{display:block;font-family:var(--display);color:var(--acento);line-height:1.05;
             /* palavra longa ("Especialidades") não pode quebrar no meio do quadro */
             overflow-wrap:normal;word-break:keep-all;hyphens:none;
             font-size:${D.hero.numerosEstilo === 'tira' ? 'clamp(1.5rem,2.6vw,2.05rem)' : 'clamp(1.08rem,1.9vw,1.3rem)'}
             ${D.marca.condensada ? ';letter-spacing:.01em' : ''}}
  .numeros span{font-size:.87rem;color:rgba(255,255,255,.8)}
  .aviso{background:var(--claro2);color:var(--escuro);font-weight:600;text-align:center;
         padding:11px 16px;font-size:.95rem}

  section{padding:clamp(50px,7vw,84px) 0}
  .fundo-claro{background:var(--claro)}
  .cab{max-width:62ch;margin-bottom:32px}
  .cab .olho{color:var(--acento-txt);border-color:color-mix(in srgb,var(--acento-txt) 30%,transparent);
             background:color-mix(in srgb,var(--acento) 12%,transparent)}
  .cab h2{font-size:clamp(1.72rem,3.9vw,2.6rem);margin:15px 0 12px}
  .cab p{color:var(--suave);font-size:1.04rem}

  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:19px}
  .card{background:var(--cartao);border:1px solid var(--linha);border-radius:var(--r-lg);overflow:hidden;
        display:flex;flex-direction:column;transition:transform .18s ease,box-shadow .18s ease}
  .card:hover{transform:translateY(-4px);box-shadow:0 18px 38px rgba(0,0,0,.1)}
  .card img{width:100%;height:178px;object-fit:cover;background:var(--claro2)}
  .card .corpo{padding:18px 20px 22px;display:flex;flex-direction:column;gap:9px;flex:1}
  .card h3{font-size:1.16rem;color:var(--forte)}
  .card p{font-size:.95rem;color:var(--suave);flex:1}
  .card .tags{display:flex;flex-wrap:wrap;gap:6px}
  .card .tags span{font-size:.75rem;font-weight:700;color:var(--acento-txt);
                   background:color-mix(in srgb,var(--acento) 14%,transparent);
                   border-radius:999px;padding:3px 10px}
  .card a.mais{font-weight:700;color:var(--forte);font-size:.94rem;display:inline-flex;gap:6px;align-items:center}
  .card a.mais::after{content:"→";transition:transform .15s ease}
  .card a.mais:hover::after{transform:translateX(4px)}

  .faixa{background:var(--escuro);color:#fff}
  .faixa .cab p{color:rgba(255,255,255,.78)}
  .faixa .cab .olho{color:var(--acento);border-color:color-mix(in srgb,var(--acento) 42%,transparent);
                    background:color-mix(in srgb,var(--acento) 14%,transparent)}
  .passos{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:18px}
  .passo{border:1px solid rgba(255,255,255,.17);border-radius:var(--r);padding:20px}
  .passo b{display:block;font-family:var(--titulo);font-size:1.6rem;color:var(--acento);line-height:1;margin-bottom:9px}
  .passo h3{font-size:1.03rem;margin-bottom:6px}
  .passo p{font-size:.9rem;color:rgba(255,255,255,.76)}
  .nota{margin-top:26px;border-left:3px solid var(--acento);padding:14px 18px;
        background:color-mix(in srgb,var(--acento) 10%,transparent);font-size:.97rem;color:rgba(255,255,255,.9)}
  .faixa .nota b{color:#fff}

  .duas{display:grid;grid-template-columns:1fr 1fr;gap:clamp(22px,4vw,48px);align-items:center}
  .duas.inverte img{order:2}
  .duas img{border-radius:var(--r-lg);width:100%;max-height:540px;object-fit:cover}
  .lista{display:grid;gap:14px;margin-top:20px}
  .item{display:flex;gap:12px;align-items:flex-start}
  .item svg{flex:0 0 22px;margin-top:3px}
  .item b{display:block;color:var(--forte)}
  .item span{color:var(--suave);font-size:.95rem}
  .galeria{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:30px}
  .galeria figure{border-radius:var(--r);overflow:hidden;border:1px solid var(--linha);background:var(--cartao)}
  .galeria img{width:100%;height:190px;object-fit:cover}
  .galeria figcaption{padding:10px 13px;font-size:.88rem;color:var(--suave);font-weight:500}

  .perfis{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:14px}
  .perfil{background:var(--cartao);border:1px solid var(--linha);border-radius:var(--r);padding:18px 20px}
  .perfil b{display:block;font-family:var(--titulo);font-size:1.02rem;margin-bottom:5px;color:var(--forte)}
  .perfil span{font-size:.92rem;color:var(--suave)}

  .unidades{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:20px}
  .un{background:var(--cartao);border:1px solid var(--linha);border-radius:var(--r-lg);padding:24px;
      display:flex;flex-direction:column;gap:13px}
  .faixa .un{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.18)}
  .un h3{font-size:1.3rem;display:flex;align-items:center;gap:10px;color:var(--forte)}
  .faixa .un h3{color:#fff}
  .un h3 .pino{width:30px;height:30px;border-radius:50%;background:var(--acento);display:grid;
               place-items:center;flex:0 0 30px}
  .un dl{display:grid;gap:11px}
  .un dt{font-size:.76rem;letter-spacing:.11em;text-transform:uppercase;color:var(--suave);font-weight:700}
  .faixa .un dt{color:rgba(255,255,255,.66)}
  .un dd{font-size:1.01rem}
  .un dd a{border-bottom:1px solid color-mix(in srgb,var(--acento) 55%,transparent)}
  .un .acoes{margin-top:auto;gap:10px}
  .un .btn{padding:12px 18px;font-size:.94rem}

  .duas-caixas{display:grid;grid-template-columns:1fr 1fr;gap:clamp(20px,3.5vw,42px)}
  .caixa{background:var(--cartao);border:1px solid var(--linha);border-radius:var(--r-lg);padding:26px;
         display:flex;flex-direction:column;gap:12px}
  .faixa .caixa{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.18)}
  .caixa h3{font-size:1.24rem;color:var(--forte)}
  .faixa .caixa h3{color:#fff}
  .caixa p{color:var(--suave);font-size:.98rem}
  .faixa .caixa p{color:rgba(255,255,255,.78)}
  .canais{display:grid;gap:11px;margin-top:4px}
  .canal{display:flex;align-items:center;gap:14px;border:1px solid var(--linha);border-radius:var(--r);
         padding:14px 16px;background:var(--claro);min-height:56px;
         transition:border-color .15s ease,transform .15s ease}
  .faixa .canal{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.18)}
  .canal:hover{border-color:var(--acento);transform:translateX(3px)}
  .canal .ico{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex:0 0 40px;
              background:color-mix(in srgb,var(--acento) 16%,transparent)}
  .canal b{display:block;color:var(--forte)}
  .faixa .canal b{color:#fff}
  .canal span span{font-size:.88rem;color:var(--suave)}
  .faixa .canal span span{color:rgba(255,255,255,.72)}

  /* duvidas: <details> nativo — abre e fecha sem JavaScript */
  .faq{display:grid;gap:10px;max-width:70ch}
  .faq details{border:1px solid var(--linha);border-radius:var(--r);background:var(--cartao);overflow:hidden}
  .faixa .faq details{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.18)}
  .faq summary{cursor:pointer;padding:16px 18px;font-weight:700;color:var(--forte);
               list-style:none;display:flex;justify-content:space-between;gap:12px;align-items:center;
               min-height:56px}
  .faixa .faq summary{color:#fff}
  .faq summary::-webkit-details-marker{display:none}
  .faq summary::after{content:"+";font-family:var(--display);font-size:1.5rem;line-height:1;
                      color:var(--acento-txt);flex:0 0 auto}
  .faixa .faq summary::after{color:var(--acento)}
  .faq details[open] summary::after{content:"–"}
  .faq details p{padding:0 18px 18px;color:var(--suave);font-size:.97rem}
  .faixa .faq details p{color:rgba(255,255,255,.78)}

  .rodape{background:var(--escuro);color:rgba(255,255,255,.7);padding:48px 0 24px;font-size:.93rem}
  .rodape .grade{display:grid;grid-template-columns:${D.rodape.colunas.length === 3 ? '1.4fr 1fr 1fr' : '1.3fr 1fr'};gap:32px}
  .rodape img{width:${D.marca.larguraRodape || 150}px;margin-bottom:14px}
  .rodape .nm{font-family:var(--titulo);font-size:1.12rem;color:#fff;margin-bottom:8px}
  .rodape h4{color:#fff;font-size:.97rem;margin-bottom:11px}
  .rodape ul{list-style:none;display:grid;gap:8px}
  .rodape a:hover{color:var(--acento)}
  .rodape .fim{border-top:1px solid rgba(255,255,255,.13);margin-top:32px;padding-top:17px;
               display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;
               font-size:.86rem;color:rgba(255,255,255,.55)}

  .barra{position:fixed;left:0;right:0;bottom:0;z-index:60;display:none;gap:10px;padding:10px 14px;
         background:rgba(255,255,255,.97);backdrop-filter:blur(10px);border-top:1px solid var(--linha)}
  .barra .btn{flex:1;padding:14px 10px;font-size:.95rem}

  @media (max-width:920px){
    .nav{display:none}
    .nav.aberto{display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;gap:0;
                background:${t.topoEscuro ? 'var(--escuro)' : '#fff'};padding:6px 5vw 16px;
                border-bottom:1px solid ${t.topoEscuro ? 'rgba(255,255,255,.14)' : 'var(--linha)'}}
    .nav.aberto a{padding:14px 0;border-bottom:1px solid ${t.topoEscuro ? 'rgba(255,255,255,.12)' : 'var(--linha)'}}
    .abre{display:block}
    .topo .btn{display:none}
    .duas,.duas-caixas{grid-template-columns:1fr}
    .duas.inverte img{order:0}
    .rodape .grade{grid-template-columns:1fr;gap:26px}
    .barra{display:flex}
    body{padding-bottom:78px}
  }
  /* atalho de teclado: primeiro Tab pula o menu e vai para o conteúdo */
  .pular{position:absolute;left:-9999px;top:0;z-index:99;background:var(--escuro);color:#fff;
         padding:12px 18px;border-radius:0 0 10px 0;font-weight:700}
  .pular:focus{left:0}
  /* quem pediu menos animação no sistema não recebe transição nenhuma */
  @media (prefers-reduced-motion:reduce){
    *{animation:none!important;transition:none!important}
    html{scroll-behavior:auto}
  }
  /* hero com emblema ao lado (logo grande, selo): texto à esquerda, imagem à
     direita; no celular o emblema sobe, menor, acima do título */
  .hero .in.com-lado{max-width:none;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);
                     gap:clamp(24px,5vw,64px);align-items:center}
  .hero .lado{justify-self:center;width:min(100%,380px);height:auto}
  /* unidade que ainda não tem endereço: caixa tracejada com selo "em breve" */
  .un.embreve{border-style:dashed;border-width:2px}
  .un .selo-breve{align-self:flex-start;font-size:.74rem;font-weight:700;letter-spacing:.14em;
                  text-transform:uppercase;color:var(--acento);border:1px solid var(--acento);
                  border-radius:999px;padding:4px 12px}
  /* botão redondo de WhatsApp no computador; no celular já existe a barra */
  .flutuante{position:fixed;right:22px;bottom:22px;z-index:61;width:60px;height:60px;border-radius:50%;
             background:var(--wapp);color:#06331C;display:grid;place-items:center;
             box-shadow:0 10px 28px rgba(0,0,0,.35);transition:transform .15s ease}
  .flutuante:hover{transform:scale(1.07)}
  .flutuante svg{width:30px;height:30px}
  @media (max-width:920px){
    .flutuante{display:none}
    .hero .in.com-lado{grid-template-columns:1fr;gap:6px}
    .hero .lado{order:-1;width:170px;justify-self:start}
  }
${escuroTotal ? `  /* tema.modo escuro: o que no tema claro é branco fixo */
  .barra{background:${t.barra || 'rgba(0,0,0,.92)'};border-top-color:var(--linha)}
  .btn-claro{background:transparent;color:var(--forte);border:2px solid var(--linha)}
  .aviso{background:var(--cartao);color:var(--forte)}
  .card:hover{box-shadow:0 18px 38px rgba(0,0,0,.5)}
  .canal{background:var(--fundo)}
` : ''}  @supports not (background:color-mix(in srgb,red 10%,transparent)){
    .olho{background:rgba(127,127,127,.12)}
    .card .tags span{background:rgba(127,127,127,.12)}
    .canal .ico{background:rgba(127,127,127,.14)}
  }
${D.css ? '  /* identidade própria deste cliente (demo.json, campo css) */\n  ' + D.css + '\n' : ''}</style>
</head>
<body>

<a class="pular" href="#conteudo">Pular para o conteúdo</a>

<header class="topo${t.topoEscuro ? ' escuro' : ''}">
  <div class="wrap in">
    <a class="marca" href="#topo" aria-label="${esc(D.nome)}, página inicial">
      ${D.marca.tipo === 'img'
        ? `<img src="img/${D.marca.img}" width="${D.marca.w}" height="${D.marca.h}" alt="${esc(D.nome)}">`
        : `<b>${esc(D.marca.linha1)}</b><span>${esc(D.marca.linha2)}</span>`}
    </a>
    <nav class="nav" id="nav">
      ${D.nav.map(([href, rot]) => `<a href="${href}">${esc(rot)}</a>`).join('\n      ')}
    </nav>
    <button class="abre" id="abre" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav">
      <span></span><span></span><span></span>
    </button>
    ${botao(D.topoBotao)}
  </div>
</header>

<section class="hero" id="topo">
  ${D.hero.img ? `<img class="bg" src="img/${D.hero.imgSmall}" width="${D.hero.wSmall}" height="${D.hero.hSmall}"
       srcset="img/${D.hero.imgSmall} ${D.hero.wSmall}w, img/${D.hero.img} ${D.hero.w}w" sizes="100vw"
       alt="${esc(D.hero.alt)}" fetchpriority="high" decoding="async">` : ""}
  <div class="wrap in${lado ? ' com-lado' : ''}">
    ${lado ? '<div>' : ''}
    ${D.hero.olho ? `<span class="olho">${esc(D.hero.olho)}</span>` : ''}
    <h1>${D.hero.h1}</h1>
    <p class="sub">${esc(D.hero.sub)}</p>
    <div class="acoes">
      ${D.hero.acoes.map(b => botao(b)).join('\n      ')}
    </div>
    ${D.hero.numeros ? `<div class="numeros">
      ${D.hero.numeros.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('\n      ')}
    </div>` : ''}
    ${lado ? `</div>
    <img class="lado" src="img/${lado.img}" width="${lado.w}" height="${lado.h}" alt="${esc(lado.alt)}" fetchpriority="high">` : ''}
  </div>
</section>
${D.aviso ? `\n<div class="aviso">${esc(D.aviso)}</div>` : ''}

<!-- CONFIRMAR COM O CLIENTE:
${(D.confirmar || []).map((c, i) => `     ${i + 1}. ${c}`).join('\n')}
-->
<main id="conteudo">
${D.secoes.map(s => montadores[s.tipo](s)).join('\n')}
</main>

<footer class="rodape">
  <div class="wrap">
    <div class="grade">
      ${D.rodape.colunas.map((c, i) => i === 0 ? `<div>
        ${D.marca.tipo === 'img' && !D.marca.rodapeTexto ? /* logo escuro some no rodapé escuro: rodapeTexto usa o nome */ `<img src="img/${D.marca.img}" width="${D.marca.w}" height="${D.marca.h}" alt="${esc(D.nome)}">`
          : `<div class="nm">${esc(D.nome)}</div>`}
        <p>${esc(c.p)}</p>
      </div>` : `<div>
        <h4>${esc(c.h4)}</h4>
        <ul>${c.itens.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>`).join('\n      ')}
    </div>
    <div class="fim">
      <span>© <span id="ano">2026</span> ${esc(D.nome)}${D.rodape.selo ? ' · ' + esc(D.rodape.selo) : ''}</span>
      <span>${(D.rodape.fim || []).join(' · ')}</span>
    </div>
  </div>
</footer>

<div class="barra" role="group" aria-label="Contato rápido">
  ${D.barra.map(b => botao(b)).join('\n  ')}
</div>
${D.flutuante ? `<a class="flutuante" href="${esc(D.flutuante.href)}" target="_blank" rel="noopener" aria-label="${esc(D.flutuante.label)}">${SVG_WAPP}</a>\n` : ''}
<script>
  document.getElementById('ano').textContent = new Date().getFullYear();
  var b = document.getElementById('abre'), n = document.getElementById('nav');
  b.addEventListener('click', function () {
    var aberto = n.classList.toggle('aberto');
    b.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  });
  n.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { n.classList.remove('aberto'); b.setAttribute('aria-expanded', 'false'); }
  });
</script>

<script type="application/ld+json">
${JSON.stringify(D.ldjson, null, 2)}
</script>
${(() => {
  /* Se a demo tem seção de dúvidas, o FAQPage sai junto: é o dado estruturado
     que o Google usa para mostrar a pergunta direto no resultado da busca. */
  const f = (D.secoes || []).find(s => s.tipo === 'faq');
  if (!f) return '';
  const ld = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: f.itens.map(i => ({
      '@type': 'Question', name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.r }
    }))
  };
  return '<script type="application/ld+json">\n' + JSON.stringify(ld, null, 2) + '\n</script>';
})()}
</body>
</html>
`;

fs.mkdirSync(DEST, { recursive: true });
fs.writeFileSync(path.join(DEST, 'index.html'), html, 'utf8');

/* ---------------- arquivos que acompanham a demo ---------------- */
/* .htaccess: a demo é cópia do site do cliente e não pode ser indexada nem
   competir com o site real dele na busca. Sai junto do HTML, sempre. */
fs.writeFileSync(path.join(DEST, '.htaccess'), `# Demo do cliente: nao indexar, nao competir com o site real.
Header set X-Robots-Tag "noindex, nofollow"
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 month"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
</IfModule>
`, 'utf8');

/* LEIA-ME: o que perguntar ao cliente e como publicar, junto do material */
let medido = '';
try {
  const a = JSON.parse(fs.readFileSync(path.join(__dirname, 'medicoes', 'medicao_' + slug + '.json'), 'utf8'));
  const n = JSON.parse(fs.readFileSync(path.join(__dirname, 'medicoes', 'medicao_' + slug + '_novo.json'), 'utf8'));
  const f = x => x.toFixed(1).replace('.', ',');
  medido = `MEDIDO NO LIGHTHOUSE (uso interno)\n` +
    `  site atual: nota ${Math.round(a.nota)} · LCP ${f(a.lcp)}s · ${Math.round(a.peso_kb)} KB · ${Math.round(a.requisicoes)} arquivos\n` +
    `  esta demo : nota ${Math.round(n.nota)} · LCP ${f(n.lcp)}s · ${Math.round(n.peso_kb)} KB · ${Math.round(n.requisicoes)} arquivos\n` +
    `  No material do cliente vai so o compromisso (90+), nunca a nota daqui.\n\n`;
} catch (_) {}

fs.writeFileSync(path.join(DEST, 'LEIA-ME.txt'),
`${D.nome} — demo
${'='.repeat(60)}

O QUE E ISTO
  Uma versao nova da pagina inicial de ${D.canonical.replace(/^https?:\/\//, '').replace(/\/$/, '')},
  montada com as fotos e os textos do proprio site do cliente. Nada de conteudo
  inventado: o que nao estava confirmado virou pergunta na lista abaixo.

${medido}CONFIRMAR COM O CLIENTE ANTES DE PUBLICAR
${(D.confirmar || []).map((c, i) => '  ' + (i + 1) + '. ' + c).join('\n') || '  (nada pendente)'}

COMO PUBLICAR
  Envie o conteudo desta pasta para a hospedagem (por exemplo, para
  public_html/demos/${D.arquivo}/) e extraia o zip la dentro.
  O .htaccess desta pasta ja manda noindex por cabecalho.
  Quando a demo nao for mais usada, apague a pasta.

ARQUIVOS
  index.html   a pagina
  img/         fotos convertidas em WebP, no tamanho em que aparecem
  fonts/       fontes servidas do proprio dominio (sem Google Fonts)
  .htaccess    noindex, compressao e cache
`, 'utf8');

/* ---------------- conferências do próprio gerador ---------------- */
const avisos = [];

/* contraste WCAG: o tom de acento usado em texto precisa passar sobre o fundo claro */
const lum = hex => {
  const c = hex.replace('#', '');
  const v = [0, 2, 4].map(i => {
    const x = parseInt(c.slice(i, i + 2), 16) / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const razao = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const conf = [
  ['acentoTexto sobre claro', t.acentoTexto, t.claro, 4.5],
  /* no tema escuro o cartão não é branco: confere contra a cor dele */
  ['acentoTexto sobre ' + (escuroTotal ? 'cartao' : 'branco'), t.acentoTexto, escuroTotal ? t.cartao : '#ffffff', 4.5],
  ...(escuroTotal ? [['suave sobre cartao', t.suave, t.cartao, 4.5], ['forte sobre cartao', t.forte, t.cartao, 4.5],
    ['tinta sobre fundo', t.tinta, t.fundo, 4.5]] : []),
  ['tinta sobre claro', t.tinta, t.claro, 4.5],
  ['suave sobre claro', t.suave, t.claro, 4.5],
  ['acento sobre escuro', t.acento, t.escuro, 4.5],
  ['acento sobre escuro2', t.acento, t.escuro2, 3],
  /* o botão principal escreve em branco sobre o acento (ou em tema.botaoTexto):
     acento claro — laranja, amarelo, verde-água — reprovava e nada avisava.
     Texto de 16px em negrito não conta como "grande" no WCAG; 3 é o piso para
     componente de interface, e é o que se cobra aqui. */
  ['texto do botao sobre acento', t.botaoTexto || '#ffffff', t.acento, 3]
];
for (const [nome, cor1, cor2, minimo] of conf) {
  if (!/^#[0-9a-f]{6}$/i.test(cor1 || '') || !/^#[0-9a-f]{6}$/i.test(cor2 || '')) continue;
  const r = razao(cor1, cor2);
  if (r < minimo) avisos.push(`contraste reprova: ${nome} = ${r.toFixed(2)} (minimo ${minimo})`);
}

/* telefone e WhatsApp: erro clássico (número sem o 55) */
[...html.matchAll(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?\d+)/g)].forEach(m => {
  const n = m[1].replace('+', '');
  if (!/^55\d{10,11}$/.test(n)) avisos.push('WhatsApp fora do padrao 55+DDD+numero: ' + n);
});
[...html.matchAll(/href="tel:([^"]+)"/g)].forEach(m => {
  if (!/^\+55\d{10,11}$/.test(m[1])) avisos.push('tel: sem +55 ou com digito errado: ' + m[1]);
});

/* navegação: todo link interno (menu, botões do hero, cards) tem de achar a seção */
[...new Set([...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]))].forEach(id => {
  if (!new RegExp('id="' + id + '"').test(html)) avisos.push('link aponta para #' + id + ', que nao existe');
});
/* e-mail e telefone do JSON-LD precisam bater com os da página */
const ldTxt = JSON.stringify(D.ldjson || {});
const ldTel = (ldTxt.match(/"telephone":"([^"]+)"/) || [])[1];
if (ldTel && !html.includes('tel:' + ldTel.replace(/[^\d+]/g, ''))) avisos.push('telefone do JSON-LD (' + ldTel + ') nao aparece como link tel: na pagina');
const ldMail = (ldTxt.match(/"email":"([^"]+)"/) || [])[1];
if (ldMail && !html.includes('mailto:' + ldMail)) avisos.push('e-mail do JSON-LD (' + ldMail + ') nao aparece como mailto: na pagina');
/* texto de modelo esquecido — defeito comum em site feito a partir de template */
const semComent = html.replace(/<!--[\s\S]*?-->/g, '');
/* XXXX e TODO só em maiúscula: com /i, "todo o Brasil" passava por marcador */
const modelo = semComent.match(/lorem ipsum|john doe|seu texto aqui|t[íi]tulo do slide/i) || semComent.match(/XXXX|\bTODO\b/);
if (modelo) avisos.push('texto de modelo na pagina: "' + modelo[0] + '"');

/* promessa de resultado em area regulada (CFM, CFO, OAB, COFFITO, CRMV) */
const regulado = /Dentist|MedicalClinic|MedicalBusiness|Physician|Physiotherapy|VeterinaryCare|LegalService|Attorney|HealthAndBeauty|AccountingService/i
  .test(JSON.stringify(D.ldjson || {}));
if (regulado) {
  const proibido = /\b(garantido|garantia de resultado|melhor (cl[íi]nica|dentista|advogado)|sem dor|resultado imediato|antes e depois|100% de sucesso)\b/i;
  const texto = html.replace(/<[^>]+>/g, ' ');
  const m = texto.match(proibido);
  if (m) avisos.push('area regulada: expressao de risco no texto — "' + m[0] + '"');
  /* com fronteira de palavra e maiúscula: sem isso "MICRO Som" passava por CRO */
  if (!/\b(CRM|CRO|CRMV|OAB|CREFITO|RQE|CRC|CRP)\b|[Rr]espons[áa]vel [Tt][ée]cnic/.test(texto))
    avisos.push('area regulada: nenhum registro profissional (CRM/CRO/CRMV/OAB/CRC) aparece na pagina');
}

/* peso: o que estraga demo rápida é foto grande entrando sem ninguém olhar */
const pastaImg = path.join(DEST, 'img');
if (fs.existsSync(pastaImg)) {
  let total = 0;
  for (const f of fs.readdirSync(pastaImg)) {
    const kb = fs.statSync(path.join(pastaImg, f)).size / 1024;
    total += kb;
    if (kb > 250) avisos.push(`imagem pesada: ${f} com ${Math.round(kb)} KB (limite 250)`);
  }
  if (total > 900) avisos.push(`soma das imagens em ${Math.round(total)} KB (limite 900)`);
}

/* a largura declarada no srcset tem de ser a do arquivo: numa das demos o
   hero.webp tinha 1300 px e ia declarado como 760w */
const larguraWebp = arq => {
  try {
    const b = fs.readFileSync(arq); const tipo = b.toString('ascii', 12, 16);
    if (tipo === 'VP8X') return 1 + b.readUIntLE(24, 3);
    if (tipo === 'VP8L') return 1 + (b.readUInt16LE(21) & 0x3fff);
    if (tipo === 'VP8 ') return b.readUInt16LE(26) & 0x3fff;
  } catch (_) {}
  return null;
};
if (D.hero.img) for (const [a, w] of [[D.hero.img, D.hero.w], [D.hero.imgSmall, D.hero.wSmall]]) {
  const real = larguraWebp(path.join(DEST, 'img', a || ''));
  if (real && w && real !== w) avisos.push(`hero: ${a} tem ${real} px mas o srcset declara ${w}w`);
}
/* o hero precisa das duas larguras, senão o celular baixa a imagem grande */
if (D.hero.img && !/srcset="img\//.test(html)) avisos.push('hero sem srcset: o celular vai baixar a imagem inteira');
if (!(D.confirmar || []).length) avisos.push('lista CONFIRMAR vazia: toda demo tem pelo menos uma pergunta ao cliente');
const abertas = (html.match(/<(section|article|div|figure|dl|ul)\b/g) || []).length;
const fechadas = (html.match(/<\/(section|article|div|figure|dl|ul)>/g) || []).length;
if (abertas !== fechadas) avisos.push(`tags desbalanceadas: ${abertas} abrem, ${fechadas} fecham`);
if (!/<meta name="viewport"/.test(html)) avisos.push('sem viewport');
if (!/noindex/.test(html)) avisos.push('sem noindex');
[...html.matchAll(/<img (?![^>]*width=)[^>]*>/g)].forEach(m => avisos.push('img sem width: ' + m[0].slice(0, 60)));
const faltando = [...new Set([...html.matchAll(/src="img\/([^"]+)"/g)].map(m => m[1]))]
  .filter(a => !fs.existsSync(path.join(DEST, 'img', a)));
if (faltando.length) avisos.push('imagens que faltam: ' + faltando.join(', '));
try { JSON.parse(JSON.stringify(D.ldjson)); } catch (_) { avisos.push('ldjson inválido'); }

console.log(`${D.arquivo}: ${(html.length / 1024).toFixed(1)} KB · ${D.secoes.length} seções · ` +
  `${faltando.length ? 'FALTA IMAGEM' : 'imagens ok'} · ${avisos.length ? avisos.length + ' aviso(s)' : 'sem avisos'}`);
avisos.forEach(a => console.log('  !! ' + a));
/* sai com código de erro se algo reprovou: assim o construir.js para antes de
   embalar uma demo com contraste ruim ou WhatsApp sem o 55 */
if (avisos.length && process.env.ESTRITO === '1') process.exit(2);

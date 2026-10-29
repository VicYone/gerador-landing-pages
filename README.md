# Gerador de landing pages

Gerador em **Node.js** que transforma um arquivo de dados (`demo.json`) numa landing page pronta para publicar: HTML único, fontes servidas do próprio domínio, `.htaccess` e um validador que reprova a página antes que ela vá para o ar com defeito. Ele já gerou mais de 150 páginas.

| Computador | Celular |
|---|---|
| ![Página de exemplo no computador](docs/exemplo-desktop.png) | ![Página de exemplo no celular](docs/exemplo-celular.png) |

*A padaria do exemplo é fictícia.*

## O problema

Montar a página de um pequeno negócio à mão leva horas, e os erros se repetem: WhatsApp sem o 55, contraste ilegível, imagem de 2 MB no topo, link do menu apontando para uma seção que não existe. A ideia foi separar o que muda de um negócio para outro (cores, fontes, textos, seções) do que nunca deveria mudar (estrutura, acessibilidade, desempenho) e deixar o gerador conferir o resto.

## O que o gerador garante sozinho

- **Validação automática** antes de publicar:
  - contraste WCAG de cada par de cores do tema;
  - WhatsApp e telefone no formato 55 + DDD + número;
  - todo link interno achando a sua seção;
  - imagens com largura e altura declaradas e dentro do limite de peso;
  - texto de modelo esquecido ("lorem ipsum");
  - em áreas reguladas (saúde, advocacia), promessas proibidas e falta de registro profissional.
- **Desempenho:** fontes baixadas para o próprio domínio (só o subset latin), imagem do topo com `srcset` e pré-carregamento, imagens sem uso apagadas.
- **SEO e acessibilidade:** JSON-LD do negócio e da seção de dúvidas (`FAQPage`), alvo de toque de 44 px, foco visível, `noindex` nas páginas de demonstração.
- **Nada inventado:** o que o negócio ainda não confirmou vira uma lista `confirmar`, que sai como comentário no HTML e no `LEIA-ME.txt`.

## Como usar

Requer Node.js 18+ e `curl`, que vem no Windows 10/11, no macOS e no Linux.

```bash
node construir.js padaria-vila-aurora
```

A página sai em `saida/padaria-vila-aurora/`. Com `--estrito`, o processo para se o validador apontar qualquer problema. No Windows, `--zip` também gera o pacote para upload em `pacotes/`.

Para criar uma página nova, copie `exemplos/padaria-vila-aurora/` com outro nome e edite o `demo.json`:

| Campo | O que define |
|---|---|
| `tema`, `fontes`, `marca` | Paleta, tipografia e logo em texto ou imagem |
| `hero` | Título, subtítulo, botões e números de destaque |
| `secoes` | Lista de seções: `cards`, `passos`, `duas`, `perfis`, `unidades`, `galeria`, `faq`, `contato` |
| `wa` | O número de WhatsApp, digitado uma vez. Qualquer link `wa:Mensagem` vira `https://wa.me/<número>?text=...` |
| `confirmar` | O que ainda falta o dono do negócio confirmar |

## Arquivos

| Arquivo | O que faz |
|---|---|
| `construir.js` | Roda tudo na ordem certa: monta, traz as fontes, limpa imagens e, opcionalmente, empacota |
| `montar_demo.js` | Gera o HTML, o `.htaccess` e o `LEIA-ME.txt` e roda o validador |
| `fontes_locais.js` | Troca o Google Fonts por arquivos `woff2` locais |
| `exemplos/` | Um `demo.json` por página |

Construído com o Claude Code, a partir de páginas que antes eram feitas à mão.

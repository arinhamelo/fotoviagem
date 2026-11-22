# Stickers by Arinha Melo (FotoViagem)

Editor de fotografias com stickers PNG. A foto fica no navegador; os stickers vêm de uma biblioteca organizada por categorias, gerenciada em um painel administrativo (`#admin`).

## Arquitetura

- `worker.js`: Cloudflare Worker. Serve a interface (constante `APP_HTML`) e a API (`/api/*`).
- `index.html`: cópia legível da interface embutida em `APP_HTML` (o Worker não a serve; mantenha as duas em sincronia).
- Cloudflare KV `STICKERS`: lista de categorias (inclui hash da senha das categorias protegidas).
- Cloudflare R2 `STICKERS_FILES`: arquivos PNG, organizados em `<id-da-categoria>/<arquivo>.png`.
- Secret `ADMIN_PASSWORD`: senha do painel administrativo.
- Binding `AI`: usado apenas pelo endpoint legado `/api/generate` (a interface atual não o utiliza).

## Carregamento

Ao abrir o site, o navegador busca só a lista de categorias (`/api/library?view=categories`) e, em segundo plano, já carrega os stickers das categorias abertas. Ao escolher uma categoria, os stickers aparecem na hora. Categorias protegidas só carregam após informar a senha.

## Desenvolvimento e publicação

- `npx wrangler dev`
- `npx wrangler deploy`

Atenção: `wrangler deploy` aplica os bindings de `wrangler.jsonc`; confira se eles correspondem aos usados no painel da Cloudflare.

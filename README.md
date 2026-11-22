# Stickers by Arinha Melo (FotoViagem)

Editor de fotografias com stickers PNG. A foto fica no navegador; os stickers vêm de uma biblioteca organizada por categorias, gerenciada em um painel administrativo (`#admin`).

## Arquitetura

- `worker.js`: Cloudflare Worker. Serve a interface (constante `APP_HTML`) e a API (`/api/*`).
- `index.html`: fonte legível da interface. Depois de editar, rode `node scripts/sync-html.mjs` para copiá-la para `APP_HTML` em `worker.js` (o Worker não serve o arquivo direto).
- Cloudflare KV `STICKERS`: lista de categorias (inclui hash da senha das categorias protegidas).
- Cloudflare R2 `STICKERS_FILES`: arquivos PNG, organizados em `<id-da-categoria>/<arquivo>.png`.
- Secret `ADMIN_PASSWORD`: senha do painel administrativo.

## Painel administrativo (`#admin`)

Lista de categorias à esquerda e detalhes à direita. Por categoria: mostrar/ocultar no editor (a chave), renomear, definir/trocar/remover senha, enviar e excluir stickers (arrastando PNGs), excluir a categoria e mudar a ordem. Categorias ocultas ficam guardadas, mas somem do editor e seus arquivos deixam de ser servidos ao público. Senhas de categoria usam PBKDF2 com sal (as antigas, em SHA-256, continuam valendo até serem trocadas).

## Carregamento

Ao abrir o site, o navegador busca só a lista de categorias (`/api/library?view=categories`) e, em segundo plano, já carrega os stickers das categorias abertas. Ao escolher uma categoria, os stickers aparecem na hora. Categorias protegidas só carregam após informar a senha.

## Desenvolvimento e publicação

- `npx wrangler dev`
- `npx wrangler deploy`

Atenção: `wrangler deploy` aplica os bindings de `wrangler.jsonc`; confira se eles correspondem aos usados no painel da Cloudflare.

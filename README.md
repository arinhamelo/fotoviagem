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

## GIFs animados e exportação em MP4

O admin aceita PNG e GIF (até 8 MB). GIFs são guardados sem recorte, como `.gif`. Se a foto tiver ao menos um GIF, o botão de salvar vira "Salvar vídeo MP4": o navegador decodifica os quadros (gifuct-js), compõe foto + stickers quadro a quadro e codifica H.264 com WebCodecs (mp4-muxer). Nada é enviado ao servidor. A resolução da foto é mantida (até 4096 px no lado maior; se o aparelho não suportar, reduz o mínimo necessário e avisa). Loop de pelo menos 6 s, 30 fps. Sem GIF, continua saindo PNG na resolução original. No celular, o vídeo é entregue pela folha de compartilhamento ("Salvar vídeo"). As duas bibliotecas são carregadas sob demanda do jsDelivr, em versão fixa.

## Carregamento

Ao abrir o site, o navegador busca só a lista de categorias (`/api/library?view=categories`) e, em segundo plano, já carrega os stickers das categorias abertas. Ao escolher uma categoria, os stickers aparecem na hora. Categorias protegidas só carregam após informar a senha.

## Desenvolvimento e publicação

- `npx wrangler dev`
- `npx wrangler deploy`

Atenção: `wrangler deploy` aplica os bindings de `wrangler.jsonc`; confira se eles correspondem aos usados no painel da Cloudflare.

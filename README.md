# FotoViagem

Editor de fotografias com lettering gerado pelo Gemini.

## Arquitetura

- Interface em HTML/CSS/JavaScript, sem dependências de build.
- Cloudflare Worker para intermediar chamadas ao Gemini.
- Chave Gemini mantida como secret do Worker.
- Cloudflare KV para armazenar o prompt administrativo.
- A fotografia original permanece no navegador e não é enviada ao Gemini.
- O lettering é gerado como imagem isolada sobre fundo chroma key, convertido para PNG com transparência no navegador.
- Composição e exportação acontecem localmente, mantendo as dimensões em pixels da fotografia original.

## Configuração necessária

Configure estes secrets no Worker:

- `GEMINI_API_KEY`: chave da API Google Gemini.
- `ADMIN_PASSWORD`: senha forte para acessar o painel administrativo.

O namespace KV `FOTOVIAGEM_PROMPTS` já está declarado em `wrangler.jsonc`.

## Desenvolvimento e publicação

Use Wrangler para executar localmente e publicar:

- `npx wrangler dev`
- `npx wrangler deploy`

Antes de publicar, configure os dois secrets. Nunca coloque a chave Gemini no HTML, em arquivos públicos ou no GitHub.

## Observações técnicas

A API de geração de imagens do Gemini não garante transparência nativa. O aplicativo pede um fundo chroma key uniforme e o remove por processamento de pixels no navegador. A qualidade da máscara depende de o modelo respeitar o fundo solicitado; confira o resultado visual e gere novamente se houver resíduos de cor.

O modelo configurado é `gemini-3.1-flash-image`. Disponibilidade, limites e cobrança dependem do projeto Google AI e da cota vigente da API.

# FotoViagem

Editor de fotografias com lettering raster gerado pelo FLUX.1 Schnell, via Cloudflare Workers AI.

## Arquitetura

- Interface em HTML/CSS/JavaScript.
- Cloudflare Worker com binding Workers AI (sem chave externa).
- Modelo de imagem: `@cf/black-forest-labs/flux-1-schnell`.
- Cloudflare KV para prompt administrativo e contador diário.
- A fotografia original permanece no navegador e não é enviada ao modelo.
- O lettering é gerado como imagem raster JPEG sobre fundo chroma key e convertido em PNG com transparência no navegador.
- Composição e exportação acontecem localmente, mantendo as dimensões em pixels da fotografia original.

## Limites de custo

Workers AI inclui 10.000 Neurons por dia sem custo. No plano Workers Free, novas solicitações são interrompidas quando a cota diária é atingida. No Workers Paid, o consumo acima da cota gratuita pode ser cobrado. O FotoViagem também limita suas próprias gerações a 50 por dia, mas esse contador não mede o uso de outros projetos na mesma conta Cloudflare.

## Configuração

- Binding Workers AI: `AI`.
- KV namespace: `PROMPTS`.
- Secret `ADMIN_PASSWORD`: senha forte para o painel administrativo.

Não é necessária chave Gemini nem chave externa de inferência.

## Desenvolvimento e publicação

- `npx wrangler dev`
- `npx wrangler deploy`

## Observações

A geração de imagem não garante que o modelo respeite perfeitamente o texto solicitado ou o fundo chroma key. O editor remove o verde por processamento de pixels; confira o resultado antes de exportar. FLUX.1 Schnell retorna imagem raster, não SVG.

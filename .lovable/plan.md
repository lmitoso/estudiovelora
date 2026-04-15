

# Melhorar o Prompt do Sales-Agent

## Objetivo
Enriquecer o `SYSTEM_PROMPT` da edge function `sales-agent` com informações detalhadas sobre pacotes, portfólio, diferenciais e gatilhos de conversão da Velora.

## O que muda

**Arquivo**: `supabase/functions/sales-agent/index.ts` (apenas o `SYSTEM_PROMPT`, linhas 11-39)

### Seções a adicionar/expandir no prompt:

1. **Pacotes estruturados** — Substituir preços avulsos por pacotes nomeados com ancoragem de valor:
   - **Essencial** (3 fotos): R$ 97
   - **Impacto** (5 fotos + 2 vídeos): R$ 247
   - **Campanha Completa** (10 fotos + 5 vídeos + direção criativa): R$ 497
   - Avulso: Foto R$ 29,90 | Vídeo R$ 49,90

2. **Portfólio e referências visuais** — Descrever o estilo editorial (Silent Luxury, lentes 70-85mm, referências Saint Laurent/Bottega Veneta) e direcionar ao Instagram @velora.direction

3. **Gatilhos de conversão** — Técnicas que o agente deve usar contextualmente:
   - Ancoragem: "Um ensaio tradicional custa R$ 3.000-5.000. Na Velora, a partir de R$ 97"
   - Escassez: "Trabalhamos com limite de projetos por semana para manter a qualidade"
   - Prova social: "Marcas de moda e beleza já usam IA para campanhas editoriais"
   - Reciprocidade: Oferecer 1 foto de teste gratuita para briefings completos
   - Urgência suave: "Se fechar hoje, consigo priorizar a entrega em 24h"

4. **Objeções comuns** — Respostas prontas para:
   - "É IA, não é real" → Explicar que grandes marcas já usam, qualidade editorial indistinguível
   - "Está caro" → Comparar com fotógrafo tradicional, sugerir pacote menor
   - "Preciso pensar" → Oferecer foto teste ou prazo especial

5. **Fluxo de briefing** — Perguntas estruturadas que o agente deve fazer na fase de descoberta (nome da marca, produto, público, referências visuais, onde vai usar as fotos)

## Detalhes técnicos
- Apenas o conteúdo da constante `SYSTEM_PROMPT` será editado
- Nenhuma mudança em lógica, banco de dados ou outros arquivos
- A edge function será redeployada após a edição


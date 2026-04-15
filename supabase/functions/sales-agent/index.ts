import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `Você é a assistente de vendas da Velora — um estúdio de direção de arte que cria fotos e vídeos editoriais profissionais para marcas usando inteligência artificial.

## Sua identidade
- Nome: Velora (fale em primeira pessoa como "nós" ou "a Velora")
- Tom: Consultivo, elegante, educado. Luxo silencioso — nunca desesperado por venda
- Estilo: Frases curtas e diretas. Sem excesso de emojis (máximo 1-2 por mensagem). Sem linguagem de influencer
- Instagram: @velora.direction (use para enviar portfólio quando relevante)

## O que a Velora oferece
- Fotos editoriais profissionais com modelos IA (feminino, masculino ou casal)
- Vídeos curtos (reels/stories) com a mesma qualidade editorial
- Campanhas visuais completas para marcas de moda, beleza, lifestyle e luxo
- Direção de arte personalizada para cada marca

## Estilo visual (Silent Luxury)
- Referências: Saint Laurent, Bottega Veneta, The Row, Celine
- Fotografia simulada com lentes 70-85mm, iluminação natural suave, tons terrosos e neutros
- Cenários minimalistas com texturas ricas (mármore, linho, madeira escura)
- Modelos com expressão contida, poses editoriais — nunca comercial genérico

## Pacotes e preços

### Pacote Essencial — R$ 97
- 3 fotos editoriais com modelo IA
- Direção de arte básica
- Entrega em até 48h úteis
- Ideal para: testar o serviço, posts de feed

### Pacote Impacto — R$ 247 (mais vendido)
- 5 fotos editoriais + 2 vídeos curtos (reels/stories)
- Direção de arte personalizada
- Entrega em até 48h úteis
- Ideal para: lançamentos, campanhas de temporada

### Pacote Campanha Completa — R$ 497
- 10 fotos editoriais + 5 vídeos curtos
- Direção criativa completa com moodboard
- Prioridade na entrega (24-48h)
- Ideal para: marcas que querem presença visual consistente

### Avulso
- Foto editorial: R$ 29,90 cada
- Vídeo curto: R$ 49,90 cada

## Etapas de venda (siga na ordem)

### 1. DESCOBERTA (perguntas obrigatórias)
Faça estas perguntas de forma natural e conversacional (não como lista):
- Qual o nome da sua marca?
- O que vocês vendem? (produto principal)
- Quem é o público-alvo? (idade, estilo, poder aquisitivo)
- Têm referências visuais? (marcas que admiram, fotos que gostam)
- Onde vão usar as fotos/vídeos? (Instagram, site, e-commerce, anúncios)
- Qual o objetivo? (lançamento, rebranding, conteúdo recorrente)

### 2. PROPOSTA
Com base no briefing, recomende O PACOTE mais adequado. Justifique a escolha.
Exemplo: "Para o lançamento da sua marca de joias, recomendo o Pacote Impacto — as 5 fotos cobrem feed e destaque, e os 2 vídeos são perfeitos para reels de lançamento."

### 3. ORÇAMENTO
Apresente o valor com ancoragem:
"Um ensaio editorial com fotógrafo, modelo e estúdio custa entre R$ 3.000 e R$ 5.000. Na Velora, você tem o mesmo nível visual por R$ [valor do pacote]."

### 4. FECHAMENTO
Se o cliente aceitar, diga que vai enviar o link de pagamento.
Se hesitar, use um gatilho de conversão apropriado.

## Gatilhos de conversão (use contextualmente, nunca todos de uma vez)

1. **Ancoragem de valor**: "Um ensaio tradicional custa R$ 3.000-5.000. Na Velora, a partir de R$ 97."
2. **Escassez**: "Trabalhamos com limite de projetos por semana para manter a qualidade editorial."
3. **Prova social**: "Marcas de moda e beleza já estão usando IA para campanhas editoriais — é o futuro do conteúdo visual."
4. **Reciprocidade**: "Se você me enviar um briefing completo agora, posso criar 1 foto de teste gratuita para você ver a qualidade."
5. **Urgência suave**: "Se fechar hoje, consigo priorizar a entrega em 24h."
6. **Downsell**: Se o pacote sugerido for caro demais, ofereça o pacote menor ou avulso.

## Objeções comuns

### "É IA, não parece real"
→ "Entendo a preocupação. Nosso diferencial é justamente a direção de arte — não é IA genérica. Cada foto é dirigida como um editorial de moda real, com referências de Saint Laurent e Bottega Veneta. O resultado é indistinguível de um ensaio profissional. Posso te mostrar exemplos no nosso Instagram @velora.direction."

### "Está caro"
→ "Comparando com um ensaio tradicional (fotógrafo + modelo + estúdio + edição), que custa R$ 3.000-5.000, o pacote de R$ [valor] é um investimento muito menor com resultado equivalente. Mas se preferir testar primeiro, posso sugerir o Pacote Essencial de R$ 97 com 3 fotos."

### "Preciso pensar"
→ "Claro, sem pressa. Que tal eu criar uma foto de teste gratuita com base no que conversamos? Assim você vê a qualidade antes de decidir."

### "Não conheço a Velora"
→ "Somos um estúdio de direção de arte especializado em conteúdo editorial com IA. Pode ver nosso trabalho no Instagram @velora.direction. Trabalhamos com marcas de moda, beleza e lifestyle que buscam visual premium sem o custo de produções tradicionais."

## Regras importantes
- NUNCA invente preços diferentes dos listados
- NUNCA prometa prazos menores que 24h
- Prazo padrão: "em até 48h úteis"
- Se o cliente não responder, sugira um follow-up educado após algumas horas
- Se perguntar sobre algo que você não sabe, diga "Vou verificar com nossa equipe e já te retorno"
- Sempre encerre com uma pergunta ou call-to-action suave
- Máximo 1 gatilho de conversão por mensagem — nunca pareça vendedor agressivo
- Adapte a linguagem ao tom do cliente (mais formal ou mais casual)

## Contexto da conversa
Use o resumo do contexto e o histórico de mensagens para manter continuidade. Nunca repita perguntas já respondidas.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { conversationId, inboundMessage } = await req.json();

    if (!conversationId || !inboundMessage) {
      return new Response(JSON.stringify({ error: "Missing conversationId or inboundMessage" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get conversation context
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*, leads(*)")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get recent message history (last 20 messages)
    const { data: messages } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Build conversation history for AI
    const chatHistory = (messages || []).map((m: any) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content,
    }));

    // Add context summary if available
    let contextInfo = "";
    if (conversation.context_summary) {
      contextInfo += `\n\nResumo do contexto: ${conversation.context_summary}`;
    }
    if (conversation.leads) {
      contextInfo += `\nNome do lead: ${conversation.leads.name}`;
      contextInfo += `\nE-mail: ${conversation.leads.email}`;
    }
    contextInfo += `\nEstágio atual: ${conversation.stage}`;
    contextInfo += `\nStatus: ${conversation.status}`;

    // Call AI
    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextInfo },
          ...chatHistory,
          { role: "user", content: inboundMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const aiData = await aiResponse.json();
    if (!aiResponse.ok) {
      throw new Error(`AI Gateway error [${aiResponse.status}]: ${JSON.stringify(aiData)}`);
    }

    const reply = aiData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem. Vou encaminhar para nossa equipe.";

    // Update context summary with AI (lightweight)
    const newSummary = conversation.context_summary
      ? `${conversation.context_summary}\nCliente: ${inboundMessage.substring(0, 100)}\nVelora: ${reply.substring(0, 100)}`
      : `Cliente: ${inboundMessage.substring(0, 100)}\nVelora: ${reply.substring(0, 100)}`;

    // Detect stage changes based on keywords
    let newStage = conversation.stage;
    const lowerReply = reply.toLowerCase();
    const lowerMsg = inboundMessage.toLowerCase();
    if (conversation.stage === "greeting" && (lowerMsg.includes("marca") || lowerMsg.includes("produto") || lowerReply.includes("conte-me"))) {
      newStage = "discovery";
    } else if (conversation.stage === "discovery" && (lowerReply.includes("recomendo") || lowerReply.includes("sugiro"))) {
      newStage = "proposal";
    } else if (lowerReply.includes("r$") || lowerReply.includes("valor") || lowerReply.includes("preço")) {
      if (conversation.stage === "proposal") newStage = "closing";
    }

    // Update conversation
    await supabase
      .from("conversations")
      .update({
        context_summary: newSummary.substring(0, 2000),
        stage: newStage,
        status: conversation.status === "new" ? "active" : conversation.status,
        last_message_at: new Date().toISOString(),
        next_follow_up_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4h follow-up
      })
      .eq("id", conversationId);

    // Schedule follow-up if needed
    if (newStage !== "closing") {
      await supabase.from("follow_up_schedule").insert({
        conversation_id: conversationId,
        scheduled_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        type: "check_in",
        message_content: null, // Will be generated at send time
      });
    }

    return new Response(JSON.stringify({ reply, stage: newStage }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sales-agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

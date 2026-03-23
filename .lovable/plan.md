

## Plano: Aprimorar Landing Page /aprender

### Mudanças no `src/pages/Aprender.tsx`

#### 1. Pricing — Ancoragem de preço e urgência
- Preço "normal" de **R$4.000** riscado
- Preço promocional **R$497** para os primeiros 50 alunos
- Badge: "Para os primeiros 50 alunos do Método Velora"
- Texto: "Depois, o preço volta para R$4.000"

#### 2. Selo de Garantia de 7 dias
- Seção com ícone de escudo
- "Garantia incondicional de 7 dias. Acesse o curso, e se não for o que esperava, peça reembolso completo. A compra é feita pela Kiwify, que garante todos os direitos do consumidor."

#### 3. FAQ — Perguntas Frequentes
- Accordion com objeções de compra:
  - "Preciso ter experiência com IA?"
  - "Funciona para qualquer nicho?"
  - "Quanto tempo tenho de acesso?"
  - "E se eu não gostar?"
  - "Preciso de equipamentos caros?"
  - "Como recebo o acesso?"

#### 4. Botão WhatsApp flutuante
- Fixo no canto inferior direito, cor verde
- Link: `https://wa.me/5598991722040?text=Olá, quero saber mais sobre o Método Velora`

#### 5. Sem galeria visual
- Sem fotos de exemplo e sem vídeos — página focada em copy e conversão

#### 6. Estrutura final
```text
Hero
A Nova Era
O Problema
O Método
Curso (conteúdo)
Oportunidade
Bônus
Garantia 7 dias
Preço (R$4.000 → R$497 para 50 primeiros)
FAQ
CTA Final
Botão WhatsApp (flutuante)
```

### Detalhes Técnicos
- FAQ usa componente Accordion existente
- WhatsApp: `5598991722040`
- Arquivo editado: `src/pages/Aprender.tsx`


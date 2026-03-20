

## Plano: Transformar em CRM de Captura de Leads + Landing Page de Curso

### Resumo

Substituir o funil de geração de conteúdo por IA por dois fluxos:
1. **"Criar minha campanha"** → Formulário simples (nome, email, WhatsApp) → Mensagem de confirmação → Dados vão para o CRM admin
2. **"Aprender"** → Landing page de venda do curso (R$497) com toda a estrutura fornecida

### Mudanças

#### 1. Reescrever a página inicial (`src/pages/Index.tsx`)
- Manter o hero atual (VELORA, animações, estética)
- Remover todo o fluxo multi-step (modelo, campanha, pacote, checkout)
- **Botão "Criar minha campanha"** → Mostra formulário inline com 3 campos: Nome, Email, WhatsApp
- Ao submeter, insere na tabela `orders` (reaproveitando os campos `customer_name`, `email`, `whatsapp`) com status `lead`
- Após envio, exibe mensagem de confirmação: "Recebemos seus dados! Um de nossos diretores de arte entrará em contato pelo WhatsApp. Aguarde!"
- **Botão "Aprender"** → Navega para `/aprender`
- Remover o texto "A partir de R$27 por foto" e substituir por algo alinhado ao novo posicionamento

#### 2. Criar nova página `/aprender` (`src/pages/Aprender.tsx`)
- Landing page longa com toda a estrutura de copy fornecida
- Seções: Hero, A Nova Era, O Método, Conteúdo do Curso, Oportunidade, Bônus (6 bônus), Preço, CTA final
- Visual alinhado ao design system Velora (dark, gold, tipografia editorial)
- Botões "COMEÇAR AGORA" abrirão link externo de pagamento (placeholder configurável)
- Responsiva para mobile

#### 3. Criar migration para tabela `leads`
- Nova tabela `leads` com: `id`, `name`, `email`, `whatsapp`, `created_at`, `source` (ex: "campanha", "aprender")
- RLS: INSERT público, SELECT bloqueado (acesso só via Edge Function admin)
- Separar leads do fluxo de orders para não poluir a tabela existente

#### 4. Atualizar o Admin (`src/pages/Admin.tsx`)
- Adicionar nova aba "Leads" com tabela mostrando: Nome, Email, WhatsApp, Data, Fonte
- Manter abas existentes (Pedidos, Clientes) para dados históricos
- Exportação CSV para leads

#### 5. Atualizar rotas (`src/App.tsx`)
- Adicionar rota `/aprender` → `Aprender`

#### 6. Limpeza
- Os componentes step (StepModel, StepCampaign, StepPackage, StepCheckout, StepIndicator) podem ser mantidos por enquanto mas não serão mais usados na Index

### Detalhes Tecnicosx

- **Tabela `leads`**: campos `name text`, `email text not null`, `whatsapp text`, `source text default 'campanha'`, `created_at timestamptz default now()`
- **RLS**: `INSERT` público (`WITH CHECK(true)`), `SELECT` bloqueado (`USING(false)`)
- **Admin**: Edge Function `admin-data` será atualizada para também retornar leads
- **Landing page**: Componente React puro, sem backend, apenas scroll com seções e CTAs


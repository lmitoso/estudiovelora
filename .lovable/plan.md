

## Corrigir credenciais do Twilio

### O problema
O erro `twilio/phone-numbers/active-numbers/list is missing` indica que a chave API usada não tem permissão suficiente. Isso acontece quando se usa uma API Key secundária com escopo limitado.

### O que você precisa fazer no Twilio Console

1. Acesse [console.twilio.com](https://console.twilio.com/)
2. Na página inicial, copie o **Account SID** e o **Auth Token** (clique para revelar). Esses são as credenciais principais da conta, que têm todas as permissões.
3. Se você criou uma API Key separada (em Account > API Keys), ela pode ter permissões limitadas. Use o **Auth Token** da conta principal.

### Depois de ter as credenciais corretas

1. Vou solicitar a conexão do Twilio novamente
2. Ao preencher, use:
   - **Account SID**: começa com `AC...`
   - **Auth Token**: o token principal da conta (não uma API Key secundária)
3. Com a conexão feita, seguimos para criar as tabelas e edge functions

### Segurança pós-conexão
Após conectar, recomendo ativar no Twilio Console:
- **SMS Pumping Protection** (proteção contra fraude)
- **SMS Geo Permissions** (liberar apenas Brasil)


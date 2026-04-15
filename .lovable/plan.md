

## Plano: Redirecionar para WhatsApp após cadastro

Após o lead preencher o formulário na home (`/`), em vez de apenas mostrar a mensagem de sucesso, o sistema abrirá automaticamente uma conversa no WhatsApp com uma mensagem personalizada usando o nome do lead.

### Mudança em `src/pages/Index.tsx`

Após o `insert` no banco ser bem-sucedido, abrir em nova aba:

```
https://wa.me/5598991722040?text=Olá, meu nome é {nome} e quero criar minha campanha na Velora!
```

O fluxo:
1. Lead preenche nome, e-mail e WhatsApp
2. Dados são salvos no banco (como já funciona)
3. Tela de sucesso aparece normalmente
4. Ao mesmo tempo, abre o WhatsApp Web/app com a mensagem pré-preenchida

Isso é gratuito, sem API externa, e funciona tanto no celular (abre o app) quanto no desktop (abre WhatsApp Web).


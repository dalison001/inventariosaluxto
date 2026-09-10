# Inventario TI Saluxx

## Deploy na Vercel com Supabase

1. No projeto da Vercel, conecte a integracao do Supabase ao projeto desejado.
2. Confirme que a Vercel criou `SUPABASE_URL` e uma chave publica (`SUPABASE_ANON_KEY` ou `SUPABASE_PUBLISHABLE_KEY`) para os ambientes de Production e Preview.
3. Faca um novo deploy. O Vite converte essas variaveis para o formato publico usado pelo navegador durante o build.
4. No Supabase, em Authentication > URL Configuration, inclua a URL da Vercel em `Site URL` e em `Redirect URLs`, com o sufixo `/login`.
5. Aplique as migrations em `supabase/migrations`, na ordem numerica. A `003_triggers.sql` cria automaticamente o perfil quando uma conta e cadastrada.

Em Supabase > Authentication > Providers > Email, desative `Confirm email` para que contas novas entrem imediatamente apos o cadastro.

Nunca use `SUPABASE_SERVICE_ROLE_KEY` no frontend ou em uma variavel `VITE_*`: ela concede acesso administrativo ao banco.

## Desenvolvimento local

Para executar localmente, use as variaveis publicas no `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

```bash
npm install
npm run dev
```

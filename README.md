# BVN PCP (Vite + React + PWA)

Este projeto transforma o seu `pcp-bvn.jsx` em um aplicativo web (instalável como PWA).

## Requisitos
- Node.js 18+ (recomendado 20+)

## Rodar localmente
```bash
npm install
npm run dev
```
Abra o endereço exibido no terminal.

## Gerar versão de produção
```bash
npm run build
npm run preview
```

## Instalar como aplicativo (PWA)
- No Chrome/Edge (PC): menu do navegador → **Instalar**.
- No Android (Chrome): menu → **Adicionar à tela inicial**.

> Observação: a instalação PWA funciona melhor após publicar a versão de produção (HTTPS).

## Logins (demo)
As credenciais iniciais estão no próprio código:
- admin / admin123
- gestor / gestor123
- operador / operador123
- operador2 / operador123

## Próximo passo recomendado
Persistir os dados (pedidos/itens/configurações) em `localStorage` ou em um backend (ex.: Firebase/Supabase/API própria), para não perder ao recarregar a página.

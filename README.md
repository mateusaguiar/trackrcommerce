# TrackrCommerce

Plataforma completa para rastrear ROI de influenciadores, gerenciar campanhas e otimizar sua estratégia de marketing em tempo real.

## 🚀 Funcionalidades

- ✅ Dashboard com métricas em tempo real
- ✅ Rastreamento de influenciadores
- ✅ Análise de ROI
- ✅ Integração com Nuvemshop
- ✅ Gestão de equipe
- ✅ Relatórios personalizados

## 🛠️ Instalação Local

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Visualizar build
npm run preview
```

## 📋 Configuração

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Configure suas credenciais Supabase:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

Você pode encontrar essas informações em: `Supabase Dashboard > Settings > API`

## 🌐 Deploy no Vercel

1. Conecte seu repositório no [Vercel Dashboard](https://vercel.com)
2. Vercel detectará automaticamente o Vite
3. Adicione as variáveis de ambiente no Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique em "Deploy"

## 📦 Stack Tecnológico

- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Recharts** - Charts
- **Supabase** - Backend & Auth

## 📝 Estrutura do Projeto

```
.
├── index.html              # HTML principal
├── src/
│   ├── main.jsx           # Entry point
│   ├── app.jsx            # Componente principal
│   ├── index.css          # Estilos globais
│   └── lib/
│       └── supabaseClient.js
├── tailwind.config.js     # Configuração Tailwind
├── postcss.config.js      # Configuração PostCSS
├── vite.config.js         # Configuração Vite
├── vercel.json            # Configuração Vercel
└── package.json           # Dependências
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou pull request.

## 📄 Licença

MIT

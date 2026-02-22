<<<<<<< HEAD
# Zeladoria Pública

Um sistema de zeladoria urbana focado na gestão e reporte de incidentes nas cidades, conectando cidadãos e a administração pública.

## 🚀 Sobre o Projeto

Este projeto tem como objetivo principal simplificar e digitalizar o processo de denúncias e solicitações de zeladoria, permitindo que cidadãos apontem problemas como buracos na via, iluminação com defeito e acúmulo de lixo. A plataforma permite à prefeitura visualizar todos esses apontamentos em tempo real em um mapa interativo.

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React.js** com **TypeScript**
- **Vite** como bundler
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **Leaflet** e **React-Leaflet** para os mapas interativos
- **Lucide React** para os ícones
- **Supabase** para Autenticação e Backend as a Service (BaaS)

### Backend (Em desenvolvimento)
- **.NET 8** (C#)
- **Clean Architecture** e **Domain-Driven Design (DDD)**
- **Entity Framework Core**
- **SQLite** (ambiente de desenvolvimento)

## 📦 Como executar localmente

1. Clone o repositório:
```bash
git clone https://github.com/gabrielvilela12/Projeto-Fiap-main.git
cd Projeto-Fiap-main
```

2. Instale as dependências do Frontend:
```bash
npm install
```

3. Configure as variáveis de ambiente baseadas no `.env.example`. Crie um arquivo `.env.local`:
```env
VITE_SUPABASE_URL="sua_url_aqui"
VITE_SUPABASE_ANON_KEY="sua_key_aqui"
```

4. Execute o projeto localmente:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## 🔒 Autenticação

A aplicação possui um sistema de login integrado ao **Supabase**. Dependendo do perfil do usuário cadastrado no banco, as permissões e redirecionamentos no sistema mudam:
- **Cidadãos**: Acesso a tela de reportar incidentes e acompanhar o status dos chamados.
- **Administradores (Prefeitura)**: Acesso à dashboard administrativa e mapa geral das ocorrências da cidade.

## 👨‍💻 Autor

Feito com dedicação para a otimização da zeladoria pública.
=======
1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
>>>>>>> b294b06c3aaee6ed3b6fcfc4aee82bb826897ef2

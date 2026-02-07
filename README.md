# SeriesBox - Plataforma de Avaliação de Séries

Uma plataforma web completa para avaliar e descobrir séries de TV, inspirada no Letterboxd.

![SeriesBox](https://img.shields.io/badge/Status-Completo-success)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Funcionalidades

- **Sistema de Autenticação Completo**
  - Cadastro e login de usuários
  - Sessões persistentes
  - Perfis personalizáveis

-  **Exploração de Séries**
  - Séries populares do momento
  - Top séries mais bem avaliadas
  - Lançamentos e novidades
  - Busca por nome

-  **Sistema de Avaliação**
  - Avaliação por estrelas (0-5)
  - Reviews textuais
  - Status (assistindo, completou, planeja assistir, dropou)
  - Estatísticas de avaliações

-  **Perfis de Usuário**
  - Bio personalizada
  - Upload de avatar
  - Histórico de avaliações
  - Estatísticas pessoais

-  **Feed de Atividades**
  - Visualize avaliações recentes da comunidade
  - Descubra novas séries através de outros usuários

-  **Design Moderno**
  - Interface dark elegante
  - Totalmente responsivo (mobile/tablet/desktop)
  - Animações suaves
  - Experiência de usuário intuitiva

##  Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna com variáveis e animações
- **JavaScript (Vanilla)** - Lógica e interatividade

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **SQLite** - Banco de dados
- **Bcrypt** - Hash de senhas
- **Multer** - Upload de arquivos
- **Express Session** - Gerenciamento de sessões

### API Externa
- **TMDB API** - Dados de séries, posters, informações

## Pré-requisitos

- Node.js v14 ou superior
- NPM (geralmente vem com Node.js)

## Instalação

1. **Clone ou baixe o projeto**

cd seriesbox

2. **Instale as dependências**

npm install


3. **Inicie o servidor**

npm start


4. **Acesse no navegador**

http://localhost:3000


## Estrutura do Projeto


seriesbox/
├── public/                 # Arquivos públicos (frontend)
│   ├── css/
│   │   └── styles.css     # Estilos da aplicação
│   ├── js/
│   │   ├── app.js         # Controle principal
│   │   ├── api.js         # Funções de API
│   │   ├── auth.js        # Autenticação
│   │   ├── config.js      # Configurações
│   │   ├── profile.js     # Gerenciamento de perfil
│   │   └── series.js      # Gerenciamento de séries
│   ├── uploads/           # Avatares dos usuários
│   └── index.html         # Página principal
├── server.js              # Servidor Express
├── package.json           # Dependências do projeto
├── seriesbox.db           # Banco de dados SQLite (criado automaticamente)
└── README.md              # Este arquivo
```

## Como Usar

### 1. Criar uma Conta
- Clique em "Cadastrar" no canto superior direito
- Preencha seus dados (username, email, senha)
- Faça login automaticamente

### 2. Explorar Séries
- Navegue pelas seções: Populares, Top Avaliadas, Novidades
- Use a barra de busca para encontrar séries específicas
- Clique em uma série para ver detalhes completos

### 3. Avaliar Séries
- Abra a página de detalhes de uma série
- Selecione suas estrelas (1-5)
- Escolha o status (assistindo, completou, etc.)
- Escreva uma review (opcional)
- Clique em "Salvar Avaliação"

### 4. Personalizar Perfil
- Clique no seu avatar no canto superior direito
- Selecione "Meu Perfil"
- Faça upload de uma foto de perfil
- Escreva uma bio sobre você
- Veja suas estatísticas e avaliações

### 5. Descobrir Conteúdo
- Role até o feed de atividades na página inicial
- Veja o que outros usuários estão assistindo
- Clique em uma atividade para ver a série



## Banco de Dados

O banco de dados SQLite é criado automaticamente na primeira execução. Ele contém três tabelas:

- **users** - Informações dos usuários
- **ratings** - Avaliações de séries
- **watchlist** - Lista de séries (planejado para expansão futura)

## Rotas da API

### Autenticação
- `POST /api/register` - Cadastrar novo usuário
- `POST /api/login` - Fazer login
- `POST /api/logout` - Fazer logout
- `GET /api/check-session` - Verificar sessão atual

### Usuário
- `GET /api/user/:id` - Obter perfil do usuário
- `PUT /api/user/profile` - Atualizar bio
- `POST /api/user/avatar` - Upload de avatar

### Avaliações
- `POST /api/rating` - Adicionar/atualizar avaliação
- `GET /api/rating/:seriesId` - Obter avaliação do usuário
- `GET /api/user/:id/ratings` - Obter todas as avaliações do usuário
- `GET /api/series/:id/ratings` - Obter avaliações de uma série
- `DELETE /api/rating/:seriesId` - Deletar avaliação

### Atividades
- `GET /api/recent-activity` - Obter atividades recentes


## Segurança

- Senhas são criptografadas com bcrypt 
- Sessões são gerenciadas com express-session
- Validações de entrada no cliente e servidor

## Melhorias Futuras

Algumas ideias para expandir o projeto:

- [ ] Sistema de listas personalizadas
- [ ] Seguir outros usuários
- [ ] Feed personalizado
- [ ] Notificações
- [ ] Comentários em reviews
- [ ] Sistema de likes
- [ ] Integração com mais APIs (IMDb, Trakt)
- [ ] Recomendações personalizadas
- [ ] Tradução multilíngue

## 🐛 Resolução de Problemas

### O servidor não inicia
- Verifique se a porta 3000 está livre
- Certifique-se de que as dependências foram instaladas (`npm install`)

### Imagens não aparecem
- Verifique sua conexão com a internet (imagens vêm da API TMDB)
- Certifique-se de que a pasta `public/uploads` existe

### Erro ao fazer login
- Verifique se o banco de dados foi criado (`seriesbox.db`)
- Tente excluir o banco e reiniciar o servidor



## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

# Portal do Cliente & Help Desk para Sites por Assinatura

Sistema web completo e moderno de **Portal do Cliente + Central de Atendimento (Help Desk)** desenvolvido especificamente para agências de desenvolvimento de sites por assinatura.

Permite que os clientes solicitem alterações em seus sites contratados e acompanhem o progresso em tempo real, enquanto a equipe da agência gerencia todas as demandas em uma fila unificada com **Quadro Kanban**, **Notas Internas confidenciais**, apontamento de horas e relatórios operacionais.

---

## 🛡️ Regra de Segurança Central: Isolamento Total Multi-Tenant

O sistema implementa uma arquitetura rigorosa de **Defesa em Profundidade**:
- **Scoping Mandatório**: Usuários com perfil `CLIENT` têm suas consultas filtradas automaticamente no servidor pelo `companyId` da sessão assinada criptograficamente com JWT.
- **Proteção contra Enumeração de IDs**: Tentativas de acessar chamados de outra empresa resultam em `404 Not Found`.
- **Sigilo Absoluto de Notas Internas**: O campo `isInternal: true` em comentários é filtrado no backend; o cliente nunca recebe notas técnicas da equipe na resposta JSON.
- **Download Seguro de Arquivos**: Os anexos são servidos via `/api/attachments/[id]`, validando sessão e vínculo de tenant antes de entregar o fluxo de bytes.
- **Testes Automatizados**: Suíte de testes em `tests/tenant-isolation.test.ts` comprovando o isolamento entre empresas.

---

## 👥 Perfis de Usuário e Credenciais de Demonstração (Seed)

O banco de dados já vem populado com dados fictícios de duas empresas clientes para testes imediatos. Na tela de login (`/login`), há botões de **preenchimento rápido com 1 clique** para cada perfil:

| Perfil | Nome | E-mail de Acesso | Senha Padrão | Escopo / Vínculo |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Geral** | Victor Admin | `admin@agencia.com` | `Admin@123456` | Dono da agência (Acesso irrestrito a todas as áreas e empresas) |
| **Equipe Suporte** | Carlos Suporte | `suporte@agencia.com` | `Equipe@123456` | Atendimento da agência (Kanban, chamados, notas internas) |
| **Cliente 1 (Sócio)** | Dra. Ana Paula | `ana@acmeodonto.com.br` | `Cliente@123456` | **Acme Odontologia** (Acesso apenas aos sites e chamados da Acme) |
| **Cliente 1 (Marketing)** | Lucas Marketing | `lucas@acmeodonto.com.br` | `Cliente@123456` | **Acme Odontologia** (Mesma empresa, múltiplos usuários) |
| **Cliente 2 (Diretor)** | Marcos Silva | `marcos@techflow.com.br` | `Cliente@123456` | **TechFlow Logística** (Acesso isolado apenas aos seus chamados) |

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos
- Node.js LTS (v20 ou superior)
- Git

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Inicialização do Banco de Dados e Carga Inicial (Seed)
O banco local padrão utiliza SQLite (`prisma/dev.db`), permitindo rodar imediatamente sem necessidade de instalar PostgreSQL ou Docker localmente:
```bash
# Sincroniza o schema com o banco
npx prisma db push

# Popula o banco com os planos, empresas fictícias, usuários e chamados
node prisma/seed.js
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse no seu navegador: **[http://localhost:3000](http://localhost:3000)**.

### 5. Executar os Testes Automatizados de Isolamento Multi-Tenant
```bash
npm test
```

---

## 🧪 Como Testar o Isolamento Entre Clientes

1. Abra uma aba anônima e faça login como **Cliente 1 (Acme Odonto)** (`ana@acmeodonto.com.br`).
   - Observe que a Ana visualiza os sites `acmeodonto.com.br` e `blog.acmeodonto.com.br`.
   - Veja que ela visualiza apenas os chamados `#1001` e `#1002`.
   - No chamado `#1001`, observe que ela **NÃO** visualiza a nota técnica interna da equipe.
   - No chamado `#1002`, clique em **"Aprovar Alteração"** ou **"Solicitar Ajustes"**.
2. Tente forçar o acesso direto pela URL ao chamado `#1003` (pertencente à TechFlow Logística):
   - Navegue para `/portal/solicitacoes/[id-do-chamado-1003]`
   - O sistema retornará **404 Not Found**, impedindo qualquer vazamento de dados.
3. Em outra aba, faça login como **Admin da Agência** (`admin@agencia.com`):
   - Acesse `/admin/solicitacoes` e alterne entre a visualização em **Tabela** e **Quadro Kanban**.
   - Abra o chamado `#1001`: veja a **Nota Interna destacada em dourado** e use a aba "Nota Interna" para adicionar novos apontamentos confidenciais.
   - Aponte horas gastas na tarefa com o contador de tempo.
   - Acesse `/admin/clientes` para cadastrar novas empresas ou gerar links de convite.
   - Acesse `/admin/relatorios` para ver métricas de demanda e tempo médio de conclusão (SLA).

---

## 🛠️ Stack Tecnológica

- **Full-Stack Framework**: Next.js 15 (App Router, Server Actions, Server Components)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS com componentes responsivos
- **ORM & Banco de Dados**: Prisma ORM com SQLite (local) e 100% preparado para PostgreSQL em produção (Supabase, Neon, Railway)
- **Autenticação**: Sessão com tokens JWT assinados via `jose` e cookies HTTP-only seguros, com hashing bcrypt
- **Armazenamento de Arquivos**: Upload validado com streaming seguro via endpoint autenticado (`/api/attachments/[id]`)
- **Testes**: Vitest

---

## 🌐 Guia de Deploy em Produção (Econômico)

1. **Hospedagem Frontend/Backend**:
   - Faça deploy na **Vercel** (plano gratuito/hobby) ou **Railway / Render / VPS**.
2. **Banco de Dados PostgreSQL**:
   - Crie um banco PostgreSQL gratuito no **Supabase** ou **Neon.tech**.
   - No arquivo `prisma/schema.prisma`, altere o provider para `provider = "postgresql"`.
   - Configure a variável `DATABASE_URL` no painel da Vercel/hospedagem com a string de conexão do PostgreSQL.
   - Execute `npx prisma db push` e `node prisma/seed.js` para inicializar a base em produção.
3. **Variáveis de Ambiente Recomendadas em Produção**:
   - `DATABASE_URL`: String de conexão PostgreSQL
   - `JWT_SECRET`: Chave aleatória segura de 64 caracteres
   - `NEXT_PUBLIC_APP_URL`: Domínio da sua aplicação (ex: `https://helpdesk.suaagencia.com.br`)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Credenciais do seu servidor de e-mail (ou Resend / Mailgun)

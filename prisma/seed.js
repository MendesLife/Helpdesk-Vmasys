const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Limpeza prévia para garantir idempotência
  await prisma.timeLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.companySite.deleteMany();
  await prisma.company.deleteMany();
  await prisma.plan.deleteMany();

  // 1. Planos
  const planoStart = await prisma.plan.create({
    data: {
      name: "Plano Start",
      description: "Manutenção essencial com 1 site incluso e até 4 alterações mensais.",
      maxSites: 1,
    },
  });

  const planoPro = await prisma.plan.create({
    data: {
      name: "Plano Pro",
      description: "Manutenção avançada com até 3 sites inclusos, prioridade normal/alta e suporte contínuo.",
      maxSites: 3,
    },
  });

  const planoEnterprise = await prisma.plan.create({
    data: {
      name: "Plano Enterprise",
      description: "Sites ilimitados, SLA de resposta rápida em até 4 horas e consultoria mensal.",
      maxSites: 10,
    },
  });

  console.log("✓ Planos criados com sucesso.");

  // 2. Empresas Clientes
  const empresaAcme = await prisma.company.create({
    data: {
      name: "Acme Odontologia",
      document: "12.345.678/0001-90",
      status: "ACTIVE",
      planId: planoPro.id,
      notes: "Cliente exigente com padrões visuais e paleta de cores azul/branco.",
    },
  });

  const empresaTechFlow = await prisma.company.create({
    data: {
      name: "TechFlow Logística",
      document: "98.765.432/0001-11",
      status: "ACTIVE",
      planId: planoStart.id,
      notes: "Foco em páginas de conversão e rastreamento de cargas.",
    },
  });

  console.log("✓ Empresas criadas com sucesso.");

  // 3. Sites das Empresas
  const siteAcmePrincipal = await prisma.companySite.create({
    data: {
      companyId: empresaAcme.id,
      name: "Site Institucional",
      domainUrl: "https://acmeodonto.com.br",
      isPrimary: true,
    },
  });

  const siteAcmeBlog = await prisma.companySite.create({
    data: {
      companyId: empresaAcme.id,
      name: "Blog Odonto & Saúde",
      domainUrl: "https://blog.acmeodonto.com.br",
      isPrimary: false,
    },
  });

  const siteTechFlow = await prisma.companySite.create({
    data: {
      companyId: empresaTechFlow.id,
      name: "Portal Corporativo",
      domainUrl: "https://techflowlog.com.br",
      isPrimary: true,
    },
  });

  console.log("✓ Sites vinculados com sucesso.");

  // 4. Usuários
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 10);
  const equipePasswordHash = await bcrypt.hash("Equipe@123456", 10);
  const clientePasswordHash = await bcrypt.hash("Cliente@123456", 10);

  // Admin Agência
  const userAdmin = await prisma.user.create({
    data: {
      name: "Victor Admin",
      email: "admin@agencia.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  // Equipe / Suporte Agência
  const userEquipe = await prisma.user.create({
    data: {
      name: "Carlos Suporte",
      email: "suporte@agencia.com",
      passwordHash: equipePasswordHash,
      role: "EQUIPE",
    },
  });

  // Cliente 1 (Acme - Sócio)
  const userAcme1 = await prisma.user.create({
    data: {
      name: "Dra. Ana Paula",
      email: "ana@acmeodonto.com.br",
      passwordHash: clientePasswordHash,
      role: "CLIENT",
      companyId: empresaAcme.id,
    },
  });

  // Cliente 1 (Acme - Marketing)
  const userAcme2 = await prisma.user.create({
    data: {
      name: "Lucas Marketing",
      email: "lucas@acmeodonto.com.br",
      passwordHash: clientePasswordHash,
      role: "CLIENT",
      companyId: empresaAcme.id,
    },
  });

  // Cliente 2 (TechFlow - Diretor)
  const userTechFlow = await prisma.user.create({
    data: {
      name: "Marcos Silva",
      email: "marcos@techflow.com.br",
      passwordHash: clientePasswordHash,
      role: "CLIENT",
      companyId: empresaTechFlow.id,
    },
  });

  console.log("✓ Usuários criados com sucesso.");

  // 5. Chamados de Teste
  // Ticket 1: Acme - Em Execução (com nota interna da equipe que a cliente NÃO vê!)
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 1001,
      companyId: empresaAcme.id,
      siteId: siteAcmePrincipal.id,
      createdById: userAcme2.id,
      assignedToId: userEquipe.id,
      title: "Alteração do banner de clareamento dental",
      targetUrl: "https://acmeodonto.com.br",
      changeType: "IMAGEM",
      urgency: "NORMAL",
      status: "EM_EXECUCAO",
      description: "Gostaria de substituir a imagem do topo pela nova foto enviada da campanha de clareamento a laser, ajustando também o botão para direcionar direto ao nosso WhatsApp.",
      referenceLinks: "https://wa.me/5511999998888?text=Ola%20quero%20agendar",
      deadline: new Date(Date.now() + 48 * 3600 * 1000), // daqui a 2 dias
    },
  });

  // Comentário visível ao cliente
  await prisma.ticketComment.create({
    data: {
      ticketId: ticket1.id,
      authorId: userEquipe.id,
      content: "Olá Lucas! Já iniciamos a substituição do banner. A nova imagem já foi tratada para não perder qualidade.",
      isInternal: false,
    },
  });

  // NOTA INTERNA (estritamente confidencial - cliente jamais vê)
  await prisma.ticketComment.create({
    data: {
      ticketId: ticket1.id,
      authorId: userEquipe.id,
      content: "NOTA INTERNA: O link do WhatsApp precisa ser configurado com o pixel do Meta antes de subir em produção.",
      isInternal: true,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket1.id,
      authorId: userAcme2.id,
      action: "CREATED",
      newValue: "NOVO",
      notes: "Chamado aberto pelo cliente",
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket1.id,
      authorId: userEquipe.id,
      action: "STATUS_CHANGE",
      oldValue: "NOVO",
      newValue: "EM_EXECUCAO",
      notes: "Iniciada a edição do banner",
    },
  });

  // Ticket 2: Acme - Em Revisão (Pronto para o cliente Aprovar ou Solicitar Ajustes!)
  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 1002,
      companyId: empresaAcme.id,
      siteId: siteAcmePrincipal.id,
      createdById: userAcme1.id,
      assignedToId: userAdmin.id,
      title: "Atualização de endereço e horário na página de contato",
      targetUrl: "https://acmeodonto.com.br/contato",
      changeType: "TEXTO",
      urgency: "NORMAL",
      status: "EM_REVISAO",
      description: "Mudamos de sala no prédio comercial. Agora estamos no 8º andar, sala 804. Favor atualizar o texto e o horário de sábado (agora das 08h às 12h).",
      deadline: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  await prisma.ticketComment.create({
    data: {
      ticketId: ticket2.id,
      authorId: userAdmin.id,
      content: "Dra. Ana Paula, os novos horários e o endereço da sala 804 já foram atualizados no site! Por favor, confira e clique em 'Aprovar Alteração' para concluirmos.",
      isInternal: false,
    },
  });

  // Ticket 3: TechFlow Logística - Novo (Para testar isolamento absoluto entre empresas!)
  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 1003,
      companyId: empresaTechFlow.id,
      siteId: siteTechFlow.id,
      createdById: userTechFlow.id,
      title: "Correção no botão de rastreamento do site",
      targetUrl: "https://techflowlog.com.br/rastreio",
      changeType: "CORRECAO_ERRO",
      urgency: "ALTA",
      status: "NOVO",
      description: "Quando o cliente digita o código do frete e clica em Buscar, a página recarrega sem exibir o resultado.",
    },
  });

  console.log("✓ Chamados de teste criados.");
  console.log("\n=======================================================");
  console.log("SEED CONCLUÍDO COM SUCESSO!");
  console.log("Credenciais para teste:");
  console.log("1. Admin Geral:      admin@agencia.com       | Senha: Admin@123456");
  console.log("2. Equipe Suporte:   suporte@agencia.com     | Senha: Equipe@123456");
  console.log("3. Cliente Acme 1:   ana@acmeodonto.com.br   | Senha: Cliente@123456");
  console.log("4. Cliente Acme 2:   lucas@acmeodonto.com.br | Senha: Cliente@123456");
  console.log("5. Cliente TechFlow: marcos@techflow.com.br  | Senha: Cliente@123456");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

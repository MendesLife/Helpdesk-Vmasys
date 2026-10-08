"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function createCompanyAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas o Administrador Geral pode cadastrar novas empresas." };
  }

  const name = formData.get("name")?.toString().trim();
  const document = formData.get("document")?.toString().trim();
  const planId = formData.get("planId")?.toString();
  const notes = formData.get("notes")?.toString().trim();
  const siteName = formData.get("siteName")?.toString().trim() || "Site Principal";
  const domainUrl = formData.get("domainUrl")?.toString().trim();

  // Dados Financeiros & Contrato
  const contractStartDateRaw = formData.get("contractStartDate")?.toString();
  const contractStartDate = contractStartDateRaw ? new Date(contractStartDateRaw) : null;
  const billingDayRaw = formData.get("billingDay")?.toString();
  const billingDay = billingDayRaw ? parseInt(billingDayRaw, 10) : null;
  const customPriceRaw = formData.get("customPrice")?.toString().replace(",", ".");
  const customPrice = customPriceRaw ? parseFloat(customPriceRaw) : null;
  const paymentMethod = formData.get("paymentMethod")?.toString() || "PIX";
  const financialStatus = formData.get("financialStatus")?.toString() || "EM_DIA";

  if (!name) return { error: "Nome da empresa é obrigatório." };
  if (!domainUrl) return { error: "URL do site principal é obrigatória." };

  try {
    const company = await prisma.company.create({
      data: {
        name,
        document: document || null,
        planId: planId || null,
        notes: notes || null,
        contractStartDate,
        billingDay,
        customPrice: isNaN(customPrice as any) ? null : customPrice,
        paymentMethod,
        financialStatus,
        sites: {
          create: {
            name: siteName,
            domainUrl: domainUrl.startsWith("http") ? domainUrl : `https://${domainUrl}`,
            isPrimary: true,
          },
        },
      },
      include: { sites: true, plan: true },
    });

    // Se a empresa possui plano ou valor definido, gera a 1ª Fatura de ativação
    const initialPrice = company.customPrice || company.plan?.price || 0;
    if (initialPrice > 0) {
      const now = new Date();
      const dueDate =
        company.contractStartDate ||
        new Date(now.setDate(now.getDate() + 3));

      await prisma.invoice.create({
        data: {
          companyId: company.id,
          amount: initialPrice,
          dueDate,
          paymentMethod: company.paymentMethod || "PIX",
          status: company.financialStatus === "EM_DIA" ? "PAID" : "PENDING",
          paidAt: company.financialStatus === "EM_DIA" ? new Date() : null,
        },
      });
    }

    revalidatePath("/admin/clientes");
    return { success: true, companyId: company.id };
  } catch (err: any) {
    console.error("Erro ao criar empresa:", err);
    return { error: "Erro interno ao cadastrar empresa." };
  }
}

export async function addCompanySiteAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Não autorizado." };
  }

  const companyId = formData.get("companyId")?.toString();
  const name = formData.get("name")?.toString().trim();
  const domainUrl = formData.get("domainUrl")?.toString().trim();

  if (!companyId || !name || !domainUrl) {
    return { error: "Preencha todos os campos do site." };
  }

  try {
    await prisma.companySite.create({
      data: {
        companyId,
        name,
        domainUrl: domainUrl.startsWith("http") ? domainUrl : `https://${domainUrl}`,
        isPrimary: false,
      },
    });

    revalidatePath(`/admin/clientes/${companyId}`);
    return { success: true };
  } catch (err: any) {
    return { error: "Erro ao adicionar site à empresa." };
  }
}

export async function createInvitationAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Não autorizado." };
  }

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const companyId = formData.get("companyId")?.toString();
  const role = (formData.get("role")?.toString() || "CLIENT") as "CLIENT" | "EQUIPE" | "ADMIN";

  if (!email) return { error: "Informe o e-mail do convidado." };

  // Verifica se o usuário já existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (companyId && existingUser.role === "CLIENT") {
      return {
        error: `O usuário ${existingUser.name} (${existingUser.email}) já possui cadastro. Use a opção "+ Vincular Usuário Já Cadastrado" abaixo para associá-lo a esta empresa.`,
      };
    }
    return { error: "Já existe um usuário cadastrado com este e-mail." };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 dias

  try {
    const invite = await prisma.invitation.create({
      data: {
        email,
        companyId: role === "CLIENT" ? companyId : null,
        role,
        token,
        expiresAt,
        createdById: session.userId,
      },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/convite/${token}`;

    if (companyId) revalidatePath(`/admin/clientes/${companyId}`);
    revalidatePath("/admin/equipe");

    return {
      success: true,
      inviteLink,
      message: `Convite gerado com sucesso! Link: ${inviteLink}`,
    };
  } catch (err: any) {
    console.error("Erro ao gerar convite:", err);
    return { error: "Erro ao cadastrar convite." };
  }
}

export async function createTeamMemberAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas o Administrador pode cadastrar membros da equipe." };
  }

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const role = (formData.get("role")?.toString() || "EQUIPE") as "EQUIPE" | "ADMIN";

  if (!name || !email || !password) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário com este e-mail." };
  }

  const passwordHash = await hashPassword(password);

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    revalidatePath("/admin/equipe");
    return { success: true };
  } catch (err: any) {
    return { error: "Erro ao cadastrar membro da equipe." };
  }
}

export async function testSmtpAction() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Não autorizado." };
  }

  const { testSmtpConnection } = await import("@/lib/email");
  return testSmtpConnection();
}

export async function sendTestEmailAction(toEmail: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Não autorizado." };
  }

  if (!toEmail || !toEmail.includes("@")) {
    return { error: "Informe um e-mail válido para o teste." };
  }

  const { sendNotificationEmail } = await import("@/lib/email");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return sendNotificationEmail({
    to: toEmail.trim().toLowerCase(),
    recipientName: session.name,
    subject: `[VMASYS Teste] Disparo de E-mail de Teste`,
    title: "Configuração de E-mail Funcionando com Sucesso!",
    message: "Este é um e-mail de teste disparado pelo painel da VMASYS para confirmar que o servidor SMTP está ativo e pronto para notificações em produção.",
    ticketNumber: 1000,
    ticketTitle: "Verificação de Sistema",
    actionUrl: `${appUrl}/admin/configuracoes/email`,
  });
}

export async function updateCompanyAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas Administradores podem editar empresas." };
  }

  const companyId = formData.get("companyId")?.toString();
  const name = formData.get("name")?.toString().trim();
  const document = formData.get("document")?.toString().trim();
  const planId = formData.get("planId")?.toString() || null;
  const status = formData.get("status")?.toString() || "ACTIVE";
  const notes = formData.get("notes")?.toString().trim() || null;

  // Dados Financeiros & Contrato
  const contractStartDateRaw = formData.get("contractStartDate")?.toString();
  const contractStartDate = contractStartDateRaw ? new Date(contractStartDateRaw) : null;
  const billingDayRaw = formData.get("billingDay")?.toString();
  const billingDay = billingDayRaw ? parseInt(billingDayRaw, 10) : null;
  const customPriceRaw = formData.get("customPrice")?.toString().replace(",", ".");
  const customPrice = customPriceRaw ? parseFloat(customPriceRaw) : null;
  const paymentMethod = formData.get("paymentMethod")?.toString() || "PIX";
  const financialStatus = formData.get("financialStatus")?.toString() || "EM_DIA";
  const onboardingStage = formData.get("onboardingStage")?.toString() || undefined;

  if (!companyId || !name) {
    return { error: "Identificador e nome da empresa são obrigatórios." };
  }

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        document: document || null,
        planId: planId || null,
        status,
        notes,
        contractStartDate,
        billingDay,
        customPrice: isNaN(customPrice as any) ? null : customPrice,
        paymentMethod,
        financialStatus,
        ...(onboardingStage ? { onboardingStage } : {}),
      },
    });

    revalidatePath("/admin/clientes");
    revalidatePath(`/admin/clientes/${companyId}`);
    return { success: true, message: "Empresa atualizada com sucesso!" };
  } catch (err: any) {
    console.error("Erro ao atualizar empresa:", err);
    return { error: "Erro ao atualizar dados da empresa." };
  }
}

export async function deleteCompanyAction(companyId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas o Administrador pode excluir empresas." };
  }

  if (!companyId) return { error: "ID da empresa não informado." };

  try {
    // 1. Desativa e desvincula os usuários clientes vinculados a esta empresa
    await prisma.user.updateMany({
      where: { companyId, role: "CLIENT" },
      data: { isActive: false, companyId: null },
    });

    // 2. Exclui a empresa (cascateia sites, tickets, convites automaticamente pelo banco)
    await prisma.company.delete({
      where: { id: companyId },
    });

    revalidatePath("/admin/clientes");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/solicitacoes");

    return { success: true, message: "Empresa excluída com sucesso!" };
  } catch (err: any) {
    console.error("Erro ao excluir empresa:", err);
    return { error: "Erro ao excluir empresa: " + (err.message || "Falha interna.") };
  }
}

export async function toggleUserStatusAction(userId: string) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Não autorizado." };
  }

  if (session.userId === userId) {
    return { error: "Você não pode desativar seu próprio acesso enquanto logado." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "Usuário não encontrado." };

    if (session.role === "EQUIPE" && user.role !== "CLIENT") {
      return { error: "Apenas Administradores podem gerenciar membros da equipe." };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    if (user.companyId) revalidatePath(`/admin/clientes/${user.companyId}`);
    revalidatePath("/admin/clientes");
    revalidatePath("/admin/equipe");

    return {
      success: true,
      isActive: updated.isActive,
      message: updated.isActive
        ? `Acesso de ${updated.name} reativado!`
        : `Acesso de ${updated.name} bloqueado!`,
    };
  } catch (err: any) {
    console.error("Erro ao alterar status do usuário:", err);
    return { error: "Erro ao atualizar status do usuário." };
  }
}

export async function removeUserAccessAction(userId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas Administradores podem remover acessos de usuários." };
  }

  if (session.userId === userId) {
    return { error: "Você não pode remover seu próprio acesso." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        createdTickets: { select: { id: true }, take: 1 },
        comments: { select: { id: true }, take: 1 },
      },
    });

    if (!user) return { error: "Usuário não encontrado." };

    const companyId = user.companyId;

    if (user.createdTickets.length > 0 || user.comments.length > 0) {
      await prisma.companyMember.deleteMany({ where: { userId } });
      await prisma.user.update({
        where: { id: userId },
        data: {
          companyId: null,
          isActive: false,
        },
      });
    } else {
      await prisma.companyMember.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }

    if (companyId) revalidatePath(`/admin/clientes/${companyId}`);
    revalidatePath("/admin/clientes");
    revalidatePath("/admin/equipe");

    return { success: true, message: `Acesso de ${user.name} removido com sucesso.` };
  } catch (err: any) {
    console.error("Erro ao remover usuário:", err);
    return { error: "Erro ao remover acesso do usuário." };
  }
}

export async function deleteInvitationAction(invitationId: string) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Não autorizado." };
  }

  try {
    const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!inv) return { error: "Convite não encontrado." };

    const companyId = inv.companyId;
    await prisma.invitation.delete({ where: { id: invitationId } });

    if (companyId) revalidatePath(`/admin/clientes/${companyId}`);
    revalidatePath("/admin/equipe");

    return { success: true, message: "Convite cancelado com sucesso." };
  } catch (err: any) {
    console.error("Erro ao cancelar convite:", err);
    return { error: "Erro ao cancelar convite." };
  }
}

export async function updateTeamMemberAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas Administradores podem editar membros da equipe." };
  }

  const userId = formData.get("userId")?.toString();
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const role = (formData.get("role")?.toString() || "EQUIPE") as "EQUIPE" | "ADMIN";
  const password = formData.get("password")?.toString();

  if (!userId || !name || !email) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  try {
    const dataToUpdate: any = {
      name,
      email,
      role,
    };

    if (password && password.trim().length >= 6) {
      dataToUpdate.passwordHash = await hashPassword(password.trim());
    }

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    revalidatePath("/admin/equipe");
    return { success: true, message: "Membro da equipe atualizado com sucesso!" };
  } catch (err: any) {
    console.error("Erro ao atualizar membro da equipe:", err);
    return { error: "Erro ao atualizar membro da equipe." };
  }
}

export async function linkUserToCompanyAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Não autorizado." };
  }

  const companyId = formData.get("companyId")?.toString();
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!companyId || !email) {
    return { error: "Informe o e-mail do usuário e a empresa." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        error:
          "Nenhum usuário cadastrado com este e-mail. Para convidar um novo cliente, use o formulário 'Convidar Novo Usuário'.",
      };
    }

    if (user.role !== "CLIENT") {
      return {
        error: "Apenas contas com perfil de Cliente podem ser vinculadas a empresas.",
      };
    }

    // Cria associação na tabela CompanyMember
    await prisma.companyMember.upsert({
      where: {
        companyId_userId: { companyId, userId: user.id },
      },
      update: {},
      create: {
        companyId,
        userId: user.id,
        role: "CLIENT",
      },
    });

    // Se o usuário não tinha empresa primária, define esta
    if (!user.companyId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { companyId },
      });
    }

    revalidatePath(`/admin/clientes/${companyId}`);
    return {
      success: true,
      message: `Usuário ${user.name} (${user.email}) vinculado com sucesso a esta empresa!`,
    };
  } catch (err: any) {
    console.error("Erro ao vincular usuário à empresa:", err);
    return { error: "Erro ao vincular usuário à empresa." };
  }
}

export async function unlinkUserFromCompanyAction(companyId: string, userId: string) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Não autorizado." };
  }

  try {
    // 1. Remove da tabela CompanyMember
    await prisma.companyMember.deleteMany({
      where: { companyId, userId },
    });

    // 2. Se esta for a empresa primária, busca outra empresa que o usuário participe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { companyMemberships: true },
    });

    if (user && user.companyId === companyId) {
      const nextMembership = user.companyMemberships.find((m) => m.companyId !== companyId);
      await prisma.user.update({
        where: { id: userId },
        data: { companyId: nextMembership ? nextMembership.companyId : null },
      });
    }

    revalidatePath(`/admin/clientes/${companyId}`);
    return { success: true, message: "Acesso à empresa desvinculado com sucesso." };
  } catch (err: any) {
    console.error("Erro ao desvincular usuário:", err);
    return { error: "Erro ao desvincular usuário da empresa." };
  }
}

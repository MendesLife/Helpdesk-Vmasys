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

  if (!name) return { error: "Nome da empresa é obrigatório." };
  if (!domainUrl) return { error: "URL do site principal é obrigatória." };

  try {
    const company = await prisma.company.create({
      data: {
        name,
        document: document || null,
        planId: planId || null,
        notes: notes || null,
        sites: {
          create: {
            name: siteName,
            domainUrl: domainUrl.startsWith("http") ? domainUrl : `https://${domainUrl}`,
            isPrimary: true,
          },
        },
      },
      include: { sites: true },
    });

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

"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateTenantAccess } from "@/lib/tenant";
import { saveUploadedFile } from "@/lib/file-storage";
import { sendNotificationEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { getOnboardingGateStatus } from "@/lib/onboarding-gate";

const CreateTicketSchema = z.object({
  siteId: z.string().min(1, "Selecione o site"),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descreva detalhadamente a alteração desejada"),
  changeType: z.enum([
    "TEXTO",
    "IMAGEM",
    "LAYOUT",
    "NOVA_SECAO",
    "CORRECAO_ERRO",
    "SEO",
    "OUTRO",
  ]),
  urgency: z.enum(["BAIXA", "NORMAL", "ALTA"]),
  targetUrl: z.string().optional(),
  referenceLinks: z.string().optional(),
});

export async function createTicketAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  // Resolve a empresa dona do chamado
  let companyId = session.companyId;
  if (!companyId && (session.role === "ADMIN" || session.role === "EQUIPE")) {
    const customCompanyId = formData.get("companyId")?.toString();
    companyId = customCompanyId || null;
  }

  if (!companyId) {
    return { error: "Empresa não identificada para este chamado." };
  }

  const raw = {
    siteId: formData.get("siteId")?.toString() || "",
    title: formData.get("title")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    changeType: formData.get("changeType")?.toString() as any,
    urgency: formData.get("urgency")?.toString() as any,
    targetUrl: formData.get("targetUrl")?.toString() || undefined,
    referenceLinks: formData.get("referenceLinks")?.toString() || undefined,
  };

  const validated = CreateTicketSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || "Dados inválidos." };
  }

  // Valida permissão de abertura de chamados (Onboarding e Inadimplência)
  if (session.role === "CLIENT") {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { contract: true, briefing: true, invoices: true },
    });
    const gate = getOnboardingGateStatus(company as any, session.role);
    if (!gate.canAccessTickets) {
      return {
        error:
          gate.financialAlert?.message ||
          "Abertura de chamados suspensa por pendência financeira. Regularize seu pagamento para reativar o atendimento.",
      };
    }
  }

  // Valida que o site realmente pertence a esta empresa
  const site = await prisma.companySite.findFirst({
    where: {
      id: validated.data.siteId,
      companyId: companyId,
    },
  });

  if (!site) {
    return { error: "Site inválido para a sua empresa." };
  }

  try {
    // Próximo número de chamado incremental
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { ticketNumber: "desc" },
      select: { ticketNumber: true },
    });
    const nextNumber = (lastTicket?.ticketNumber || 1000) + 1;

    // Cria o chamado
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber,
        companyId,
        siteId: site.id,
        createdById: session.userId,
        title: validated.data.title,
        description: validated.data.description,
        changeType: validated.data.changeType,
        urgency: validated.data.urgency,
        targetUrl: validated.data.targetUrl,
        referenceLinks: validated.data.referenceLinks,
        status: "NOVO",
      },
    });

    // Processa arquivos anexados (se houver)
    const files = formData.getAll("files") as File[];
    for (const file of files) {
      if (file && file.size > 0 && file.name) {
        try {
          const stored = await saveUploadedFile(file);
          await prisma.attachment.create({
            data: {
              ticketId: ticket.id,
              fileName: stored.fileName,
              storedName: stored.storedName,
              fileType: stored.fileType,
              fileSize: stored.fileSize,
              uploadedById: session.userId,
            },
          });
        } catch (fileErr: any) {
          console.warn("Falha no upload de arquivo:", fileErr.message);
        }
      }
    }

    // Registra histórico
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        authorId: session.userId,
        action: "CREATED",
        newValue: "NOVO",
        notes: "Solicitação aberta pelo cliente",
      },
    });

    revalidatePath("/portal/dashboard");
    revalidatePath("/portal/solicitacoes");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/solicitacoes");

    return { success: true, ticketId: ticket.id };
  } catch (err: any) {
    console.error("Erro ao criar ticket:", err);
    return { error: "Erro interno ao cadastrar solicitação." };
  }
}

export async function addCommentAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const ticketId = formData.get("ticketId")?.toString();
  const content = formData.get("content")?.toString().trim();
  const isInternal =
    formData.get("isInternal")?.toString() === "true" &&
    (session.role === "ADMIN" || session.role === "EQUIPE");

  if (!ticketId || !content) {
    return { error: "Mensagem não pode ser vazia." };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { createdBy: true, assignedTo: true, company: true },
  });

  if (!ticket) {
    return { error: "Solicitação não encontrada." };
  }

  // Validação de isolamento do cliente
  validateTenantAccess(session, ticket.companyId);

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId: ticket.id,
      authorId: session.userId,
      content,
      isInternal,
    },
  });

  // Disparo de notificação por e-mail para respostas públicas
  if (!isInternal) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (session.role === "CLIENT") {
      // Cliente respondeu: notificar responsável ou suporte
      const recipientEmail = ticket.assignedTo?.email || "suporte@agencia.com";
      await sendNotificationEmail({
        to: recipientEmail,
        recipientName: ticket.assignedTo?.name || "Equipe de Suporte",
        subject: `Nova resposta do cliente no chamado #${ticket.ticketNumber}`,
        title: "O cliente respondeu à solicitação",
        message: `${session.name} respondeu: "${content.substring(0, 150)}..."`,
        ticketNumber: ticket.ticketNumber,
        ticketTitle: ticket.title,
        actionUrl: `${appUrl}/admin/solicitacoes/${ticket.id}`,
      });
    } else {
      // Equipe respondeu ao cliente
      await sendNotificationEmail({
        to: ticket.createdBy.email,
        recipientName: ticket.createdBy.name,
        subject: `Atualização no seu chamado #${ticket.ticketNumber} - ${ticket.company.name}`,
        title: "Você recebeu uma resposta da nossa equipe",
        message: `Nossa equipe respondeu: "${content.substring(0, 150)}..."`,
        ticketNumber: ticket.ticketNumber,
        ticketTitle: ticket.title,
        actionUrl: `${appUrl}/portal/solicitacoes/${ticket.id}`,
      });
    }
  }

  // Upload de anexo no comentário (se houver)
  const files = formData.getAll("files") as File[];
  for (const file of files) {
    if (file && file.size > 0 && file.name) {
      try {
        const stored = await saveUploadedFile(file);
        await prisma.attachment.create({
          data: {
            ticketId: ticket.id,
            commentId: comment.id,
            fileName: stored.fileName,
            storedName: stored.storedName,
            fileType: stored.fileType,
            fileSize: stored.fileSize,
            uploadedById: session.userId,
          },
        });
      } catch (e: any) {
        console.warn("Falha no upload do anexo do comentário:", e.message);
      }
    }
  }

  // Se o cliente respondeu e o chamado estava aguardando cliente, volta para em análise
  if (session.role === "CLIENT" && ticket.status === "AGUARDANDO_CLIENTE") {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "EM_ANALISE" },
    });
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        authorId: session.userId,
        action: "STATUS_CHANGE",
        oldValue: "AGUARDANDO_CLIENTE",
        newValue: "EM_ANALISE",
        notes: "Cliente respondeu ao chamado",
      },
    });
  }

  revalidatePath(`/portal/solicitacoes/${ticketId}`);
  revalidatePath(`/admin/solicitacoes/${ticketId}`);

  return { success: true };
}

export async function approveTicketAction(ticketId: string) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) return { error: "Solicitação não encontrada." };
  validateTenantAccess(session, ticket.companyId);

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: "CONCLUIDO",
      completedAt: new Date(),
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      authorId: session.userId,
      action: "APPROVAL",
      oldValue: ticket.status,
      newValue: "CONCLUIDO",
      notes: "Cliente aprovou as alterações realizadas",
    },
  });

  revalidatePath(`/portal/solicitacoes/${ticketId}`);
  revalidatePath(`/portal/dashboard`);
  revalidatePath(`/admin/solicitacoes/${ticketId}`);
  return { success: true };
}

export async function requestRevisionAction(ticketId: string, reason: string) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  if (!reason || reason.trim().length < 5) {
    return { error: "Por favor, explique o que ainda precisa ser ajustado." };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) return { error: "Solicitação não encontrada." };
  validateTenantAccess(session, ticket.companyId);

  // Retorna para Em Execução
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "EM_EXECUCAO" },
  });

  // Cria comentário com o pedido de ajuste
  await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId: session.userId,
      content: `⚠️ SOLICITAÇÃO DE AJUSTE: ${reason}`,
      isInternal: false,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      authorId: session.userId,
      action: "REVISION_REQUEST",
      oldValue: ticket.status,
      newValue: "EM_EXECUCAO",
      notes: reason,
    },
  });

  revalidatePath(`/portal/solicitacoes/${ticketId}`);
  revalidatePath(`/admin/solicitacoes/${ticketId}`);
  return { success: true };
}

export async function adminUpdateTicketAction(
  ticketId: string,
  data: {
    status?: string;
    urgency?: string;
    assignedToId?: string | null;
    deadline?: string | null;
  }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Apenas membros da equipe da agência podem alterar chamados." };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { createdBy: true, company: true },
  });
  if (!ticket) return { error: "Chamado não encontrado." };

  const updateData: any = {};
  if (data.status && data.status !== ticket.status) {
    updateData.status = data.status;
    if (data.status === "CONCLUIDO") {
      updateData.completedAt = new Date();
    }
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        authorId: session.userId,
        action: "STATUS_CHANGE",
        oldValue: ticket.status,
        newValue: data.status,
        notes: "Status atualizado pela equipe",
      },
    });

    // Notificar cliente da mudança de status
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendNotificationEmail({
      to: ticket.createdBy.email,
      recipientName: ticket.createdBy.name,
      subject: `Status alterado: Chamado #${ticket.ticketNumber} agora está [${data.status}]`,
      title: "Mudança no andamento da sua solicitação",
      message: `O chamado "${ticket.title}" avançou para o status: ${data.status}.`,
      ticketNumber: ticket.ticketNumber,
      ticketTitle: ticket.title,
      actionUrl: `${appUrl}/portal/solicitacoes/${ticket.id}`,
    });
  }

  if (data.urgency && data.urgency !== ticket.urgency) {
    updateData.urgency = data.urgency;
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        authorId: session.userId,
        action: "URGENCY_UPDATED",
        oldValue: ticket.urgency,
        newValue: data.urgency,
      },
    });
  }

  if (data.assignedToId !== undefined && data.assignedToId !== ticket.assignedToId) {
    updateData.assignedToId = data.assignedToId || null;
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        authorId: session.userId,
        action: "ASSIGNED",
        newValue: data.assignedToId || "Nenhum",
      },
    });
  }

  if (data.deadline !== undefined) {
    updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        authorId: session.userId,
        action: "DEADLINE_UPDATED",
        newValue: data.deadline || "Sem prazo",
      },
    });
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: updateData,
  });

  revalidatePath(`/admin/solicitacoes`);
  revalidatePath(`/admin/solicitacoes/${ticketId}`);
  revalidatePath(`/portal/solicitacoes/${ticketId}`);
  revalidatePath(`/portal/dashboard`);

  return { success: true };
}

export async function adminAddTimeLogAction(
  ticketId: string,
  minutesSpent: number,
  description?: string
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Não autorizado." };
  }

  if (!minutesSpent || minutesSpent <= 0) {
    return { error: "Informe um tempo válido em minutos." };
  }

  await prisma.timeLog.create({
    data: {
      ticketId,
      userId: session.userId,
      minutesSpent,
      description,
    },
  });

  revalidatePath(`/admin/solicitacoes/${ticketId}`);
  return { success: true };
}

"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveBriefingAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Não autorizado. Faça login para continuar." };
  }

  const companyId = formData.get("companyId")?.toString();
  const actionType = formData.get("actionType")?.toString() || "SAVE_DRAFT"; // SAVE_DRAFT | SUBMIT

  if (!companyId) {
    return { error: "Identificador da empresa não informado." };
  }

  // Se for cliente, valida se tem acesso à empresa
  if (session.role === "CLIENT") {
    const hasMembership = await prisma.companyMember.findFirst({
      where: { companyId, userId: session.userId },
    });
    const isDirectCompany = session.companyId === companyId;

    if (!hasMembership && !isDirectCompany) {
      return { error: "Você não possui permissão para editar o briefing desta empresa." };
    }
  }

  const businessOverview = formData.get("businessOverview")?.toString().trim() || null;
  const targetAudience = formData.get("targetAudience")?.toString().trim() || null;
  const visualStyle = formData.get("visualStyle")?.toString().trim() || null;
  const competitors = formData.get("competitors")?.toString().trim() || null;
  const requiredPages = formData.get("requiredPages")?.toString().trim() || null;
  const features = formData.get("features")?.toString().trim() || null;
  const contentDriveUrl = formData.get("contentDriveUrl")?.toString().trim() || null;

  const isSubmit = actionType === "SUBMIT";

  if (isSubmit && (!businessOverview || !requiredPages)) {
    return {
      error:
        "Para enviar o briefing, preencha pelo menos a Visão Geral do Negócio e as Páginas Desejadas.",
    };
  }

  try {
    const existing = await prisma.projectBriefing.findUnique({
      where: { companyId },
    });

    const newStatus = isSubmit ? "SUBMITTED" : existing?.status === "APPROVED" ? "APPROVED" : "DRAFT";
    const submittedAt = isSubmit ? new Date() : existing?.submittedAt || null;

    await prisma.projectBriefing.upsert({
      where: { companyId },
      update: {
        businessOverview,
        targetAudience,
        visualStyle,
        competitors,
        requiredPages,
        features,
        contentDriveUrl,
        status: newStatus,
        submittedAt,
      },
      create: {
        companyId,
        businessOverview,
        targetAudience,
        visualStyle,
        competitors,
        requiredPages,
        features,
        contentDriveUrl,
        status: newStatus,
        submittedAt,
      },
    });

    // Se foi submetido pelo cliente, avança o estágio da empresa para BRIEFING_EM_ANALISE se estiver pendente
    if (isSubmit) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (
        company &&
        (company.onboardingStage === "BRIEFING_PENDENTE" ||
          !company.onboardingStage)
      ) {
        await prisma.company.update({
          where: { id: companyId },
          data: { onboardingStage: "BRIEFING_EM_ANALISE" },
        });
      }
    }

    revalidatePath("/portal/briefing");
    revalidatePath("/portal/dashboard");
    revalidatePath(`/admin/clientes/${companyId}`);
    revalidatePath("/admin/clientes");

    return {
      success: true,
      message: isSubmit
        ? "Briefing enviado com sucesso! Nossa equipe analisará as informações para iniciar a criação do seu site."
        : "Rascunho do briefing salvo com sucesso. Você pode continuar preenchendo a qualquer momento.",
    };
  } catch (err: any) {
    console.error("Erro ao salvar briefing:", err);
    return { error: "Erro interno ao salvar dados do briefing." };
  }
}

export async function reviewBriefingAction(
  companyId: string,
  decision: "APPROVE" | "REQUEST_REVISION",
  adminNotes?: string
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Apenas membros da equipe VMASYS podem avaliar briefings." };
  }

  try {
    const briefing = await prisma.projectBriefing.findUnique({
      where: { companyId },
    });

    if (!briefing) {
      return { error: "Briefing não encontrado para esta empresa." };
    }

    if (decision === "APPROVE") {
      await prisma.projectBriefing.update({
        where: { companyId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          adminNotes: adminNotes?.trim() || briefing.adminNotes,
        },
      });

      // Avança automaticamente o estágio para EM_DESENVOLVIMENTO
      await prisma.company.update({
        where: { id: companyId },
        data: { onboardingStage: "EM_DESENVOLVIMENTO" },
      });

      revalidatePath(`/admin/clientes/${companyId}`);
      revalidatePath("/admin/clientes");
      revalidatePath("/portal/dashboard");
      revalidatePath("/portal/briefing");

      return {
        success: true,
        message:
          "Briefing aprovado com sucesso! O projeto avançou automaticamente para a etapa 'Em Desenvolvimento'.",
      };
    } else {
      // REQUEST_REVISION
      await prisma.projectBriefing.update({
        where: { companyId },
        data: {
          status: "REVISION_REQUESTED",
          adminNotes: adminNotes?.trim() || "Por favor, revise os dados apontados pela equipe.",
        },
      });

      // Retorna para BRIEFING_PENDENTE
      await prisma.company.update({
        where: { id: companyId },
        data: { onboardingStage: "BRIEFING_PENDENTE" },
      });

      revalidatePath(`/admin/clientes/${companyId}`);
      revalidatePath("/admin/clientes");
      revalidatePath("/portal/dashboard");
      revalidatePath("/portal/briefing");

      return {
        success: true,
        message: "Solicitação de ajustes registrada e enviada ao cliente com sucesso.",
      };
    }
  } catch (err: any) {
    console.error("Erro ao avaliar briefing:", err);
    return { error: "Erro interno ao processar avaliação do briefing." };
  }
}

export async function updateOnboardingStageAction(
  companyId: string,
  onboardingStage: string
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Apenas administradores e equipe podem alterar a etapa do projeto." };
  }

  const validStages = [
    "BRIEFING_PENDENTE",
    "BRIEFING_EM_ANALISE",
    "EM_DESENVOLVIMENTO",
    "EM_HOMOLOGACAO",
    "ATIVO_MANUTENCAO",
  ];

  if (!validStages.includes(onboardingStage)) {
    return { error: "Etapa de projeto inválida." };
  }

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { onboardingStage },
    });

    revalidatePath("/admin/clientes");
    revalidatePath(`/admin/clientes/${companyId}`);
    revalidatePath("/portal/dashboard");

    return { success: true, message: "Etapa do projeto atualizada com sucesso!" };
  } catch (err: any) {
    console.error("Erro ao atualizar etapa do projeto:", err);
    return { error: "Erro interno ao atualizar etapa." };
  }
}

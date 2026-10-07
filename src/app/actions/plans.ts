"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPlanAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas o Administrador Geral pode criar planos." };
  }

  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priceRaw = formData.get("price")?.toString().replace(",", ".");
  const price = priceRaw ? parseFloat(priceRaw) : 0;
  const maxSites = parseInt(formData.get("maxSites")?.toString() || "1", 10);
  
  const requestsLimitRaw = formData.get("monthlyRequestsLimit")?.toString();
  const monthlyRequestsLimit = requestsLimitRaw && requestsLimitRaw !== "0" && requestsLimitRaw !== "" 
    ? parseInt(requestsLimitRaw, 10) 
    : null;

  const maxPagesRaw = formData.get("maxPages")?.toString();
  const maxPages = maxPagesRaw && maxPagesRaw !== "0" && maxPagesRaw !== "" 
    ? parseInt(maxPagesRaw, 10) 
    : null;

  const slaHoursRaw = formData.get("slaHours")?.toString();
  const slaHours = slaHoursRaw ? parseInt(slaHoursRaw, 10) : 48;

  const features = formData.get("features")?.toString().trim() || null;
  const isActive = formData.get("isActive") !== "false";

  if (!name) {
    return { error: "O nome do plano é obrigatório." };
  }

  try {
    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        price: isNaN(price) ? 0 : price,
        maxSites: isNaN(maxSites) || maxSites < 1 ? 1 : maxSites,
        monthlyRequestsLimit: isNaN(monthlyRequestsLimit as any) ? null : monthlyRequestsLimit,
        maxPages: isNaN(maxPages as any) ? null : maxPages,
        slaHours: isNaN(slaHours) ? 48 : slaHours,
        features,
        isActive,
      },
    });

    revalidatePath("/admin/planos");
    revalidatePath("/admin/clientes");
    return { success: true, planId: plan.id, message: "Plano criado com sucesso!" };
  } catch (err: any) {
    console.error("Erro ao criar plano:", err);
    return { error: "Erro ao cadastrar plano: " + (err.message || "Falha interna.") };
  }
}

export async function updatePlanAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas o Administrador Geral pode editar planos." };
  }

  const planId = formData.get("planId")?.toString();
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priceRaw = formData.get("price")?.toString().replace(",", ".");
  const price = priceRaw ? parseFloat(priceRaw) : 0;
  const maxSites = parseInt(formData.get("maxSites")?.toString() || "1", 10);
  
  const requestsLimitRaw = formData.get("monthlyRequestsLimit")?.toString();
  const monthlyRequestsLimit = requestsLimitRaw && requestsLimitRaw !== "0" && requestsLimitRaw !== "" 
    ? parseInt(requestsLimitRaw, 10) 
    : null;

  const maxPagesRaw = formData.get("maxPages")?.toString();
  const maxPages = maxPagesRaw && maxPagesRaw !== "0" && maxPagesRaw !== "" 
    ? parseInt(maxPagesRaw, 10) 
    : null;

  const slaHoursRaw = formData.get("slaHours")?.toString();
  const slaHours = slaHoursRaw ? parseInt(slaHoursRaw, 10) : 48;

  const features = formData.get("features")?.toString().trim() || null;
  const isActive = formData.get("isActive") === "true";

  if (!planId || !name) {
    return { error: "Identificador e nome do plano são obrigatórios." };
  }

  try {
    await prisma.plan.update({
      where: { id: planId },
      data: {
        name,
        description,
        price: isNaN(price) ? 0 : price,
        maxSites: isNaN(maxSites) || maxSites < 1 ? 1 : maxSites,
        monthlyRequestsLimit: isNaN(monthlyRequestsLimit as any) ? null : monthlyRequestsLimit,
        maxPages: isNaN(maxPages as any) ? null : maxPages,
        slaHours: isNaN(slaHours) ? 48 : slaHours,
        features,
        isActive,
      },
    });

    revalidatePath("/admin/planos");
    revalidatePath("/admin/clientes");
    return { success: true, message: "Plano atualizado com sucesso!" };
  } catch (err: any) {
    console.error("Erro ao atualizar plano:", err);
    return { error: "Erro ao atualizar dados do plano." };
  }
}

export async function deletePlanAction(planId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas o Administrador Geral pode excluir planos." };
  }

  if (!planId) return { error: "ID do plano não informado." };

  try {
    // 1. Desvincula o plano das empresas que o utilizam
    await prisma.company.updateMany({
      where: { planId },
      data: { planId: null },
    });

    // 2. Exclui o plano
    await prisma.plan.delete({
      where: { id: planId },
    });

    revalidatePath("/admin/planos");
    revalidatePath("/admin/clientes");
    return { success: true, message: "Plano excluído com sucesso!" };
  } catch (err: any) {
    console.error("Erro ao excluir plano:", err);
    return { error: "Erro ao excluir plano: " + (err.message || "Falha interna.") };
  }
}

export async function togglePlanStatusAction(planId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas o Administrador Geral pode alterar o status do plano." };
  }

  try {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return { error: "Plano não encontrado." };

    const updated = await prisma.plan.update({
      where: { id: planId },
      data: { isActive: !plan.isActive },
    });

    revalidatePath("/admin/planos");
    revalidatePath("/admin/clientes");
    return {
      success: true,
      message: updated.isActive ? "Plano ativado com sucesso!" : "Plano desativado com sucesso!",
    };
  } catch (err: any) {
    console.error("Erro ao alternar status do plano:", err);
    return { error: "Erro ao alterar status do plano." };
  }
}

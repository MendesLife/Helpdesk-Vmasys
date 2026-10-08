"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { stripe, isStripeConfigured } from "@/lib/stripe";

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
  const stripePriceId = formData.get("stripePriceId")?.toString().trim() || null;
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
        stripePriceId,
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
  const stripePriceId = formData.get("stripePriceId")?.toString().trim() || null;
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
        stripePriceId,
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

export async function syncPlanWithStripeAction(planId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas o Administrador Geral pode sincronizar planos com o Stripe." };
  }

  if (!isStripeConfigured || !stripe) {
    return {
      error:
        "O Stripe não está configurado. Por favor, adicione a chave STRIPE_SECRET_KEY no painel da Vercel ou no arquivo .env.",
    };
  }

  try {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return { error: "Plano não encontrado." };

    // 1. Cria Produto no Stripe
    const product = await stripe.products.create({
      name: `VMASYS: ${plan.name}`,
      description:
        plan.description ||
        `Assinatura de desenvolvimento e manutenção contínua: ${plan.name}`,
      metadata: {
        planId: plan.id,
      },
    });

    // 2. Cria Preço Recorrente Mensal (BRL)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round((plan.price || 0) * 100),
      currency: "brl",
      recurring: {
        interval: "month",
      },
      metadata: {
        planId: plan.id,
      },
    });

    // 3. Atualiza o banco com o ID do Preço Stripe
    await prisma.plan.update({
      where: { id: planId },
      data: {
        stripePriceId: price.id,
      },
    });

    revalidatePath("/admin/planos");
    revalidatePath("/admin/clientes");
    revalidatePath("/portal/pagamento");

    return {
      success: true,
      message: `Plano '${plan.name}' vinculado com sucesso ao Stripe! ID: ${price.id}`,
      stripePriceId: price.id,
    };
  } catch (err: any) {
    console.error("Erro ao sincronizar plano com Stripe:", err);
    return {
      error: "Falha na API do Stripe: " + (err.message || "Erro desconhecido"),
    };
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

export async function savePlanBriefingQuestionsAction(
  planId: string,
  questionsJson: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return {
      error: "Apenas o Administrador Geral pode configurar perguntas de briefing dos planos.",
    };
  }

  if (!planId) {
    return { error: "ID do plano não informado." };
  }

  try {
    // Valida se o formato JSON é válido
    if (questionsJson && questionsJson.trim()) {
      JSON.parse(questionsJson);
    }

    await prisma.plan.update({
      where: { id: planId },
      data: {
        briefingQuestions: questionsJson || null,
      },
    });

    revalidatePath("/admin/planos");
    revalidatePath("/portal/briefing");
    revalidatePath("/admin/clientes");

    return {
      success: true,
      message: "Perguntas de briefing do pacote atualizadas com sucesso!",
    };
  } catch (err: any) {
    console.error("Erro ao salvar perguntas de briefing do plano:", err);
    return {
      error: "Erro ao salvar perguntas: formato inválido ou falha no banco de dados.",
    };
  }
}


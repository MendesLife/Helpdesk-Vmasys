"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { stripe, isStripeConfigured } from "@/lib/stripe";

export async function createInvoiceAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Apenas membros da equipe VMASYS podem gerar faturas." };
  }

  const companyId = formData.get("companyId")?.toString();
  const amountRaw = formData.get("amount")?.toString().replace(",", ".");
  const amount = amountRaw ? parseFloat(amountRaw) : 0;
  const dueDateRaw = formData.get("dueDate")?.toString();
  const paymentMethod = formData.get("paymentMethod")?.toString() || "PIX";
  const hostedInvoiceUrl = formData.get("hostedInvoiceUrl")?.toString().trim() || null;
  const status = formData.get("status")?.toString() || "PENDING";

  if (!companyId || isNaN(amount) || amount <= 0 || !dueDateRaw) {
    return { error: "Por favor, preencha o valor e a data de vencimento corretamente." };
  }

  try {
    const dueDate = new Date(dueDateRaw);

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        amount,
        dueDate,
        paymentMethod,
        hostedInvoiceUrl,
        status,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });

    // Se a fatura foi criada já como PAGA, garante que a empresa fica EM_DIA
    if (status === "PAID") {
      await prisma.company.update({
        where: { id: companyId },
        data: { financialStatus: "EM_DIA" },
      });
    }

    revalidatePath(`/admin/clientes/${companyId}`);
    revalidatePath("/admin/clientes");
    revalidatePath("/portal/dashboard");
    revalidatePath("/portal/faturas");

    return { success: true, message: "Fatura gerada com sucesso!", invoiceId: invoice.id };
  } catch (err: any) {
    console.error("Erro ao criar fatura:", err);
    return { error: "Erro interno ao cadastrar fatura: " + (err.message || "") };
  }
}

export async function markInvoiceAsPaidAction(invoiceId: string) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Apenas administradores podem marcar faturas como pagas." };
  }

  if (!invoiceId) return { error: "ID da fatura não informado." };

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) return { error: "Fatura não encontrada." };

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // Atualiza o status financeiro da empresa para EM_DIA
    await prisma.company.update({
      where: { id: invoice.companyId },
      data: { financialStatus: "EM_DIA" },
    });

    revalidatePath(`/admin/clientes/${invoice.companyId}`);
    revalidatePath("/admin/clientes");
    revalidatePath("/portal/dashboard");
    revalidatePath("/portal/faturas");

    return { success: true, message: "Fatura confirmada como paga! Empresa atualizada para 'Em dia'." };
  } catch (err: any) {
    console.error("Erro ao liquidar fatura:", err);
    return { error: "Erro interno ao processar baixa da fatura." };
  }
}

export async function deleteInvoiceAction(invoiceId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas o Administrador Geral pode excluir faturas." };
  }

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return { error: "Fatura não encontrada." };

    await prisma.invoice.delete({ where: { id: invoiceId } });

    revalidatePath(`/admin/clientes/${invoice.companyId}`);
    revalidatePath("/portal/dashboard");

    return { success: true, message: "Fatura excluída com sucesso." };
  } catch (err: any) {
    console.error("Erro ao excluir fatura:", err);
    return { error: "Erro interno ao remover fatura." };
  }
}

export async function createStripeCheckoutAction(companyId: string, invoiceId?: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Não autorizado." };
  }

  if (!isStripeConfigured || !stripe) {
    return {
      error:
        "O pagamento online via Stripe não está ativo no momento. As chaves de integração precisam ser configuradas no painel da VMASYS.",
    };
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });

    if (!company) return { error: "Empresa não encontrada." };

    const origin = process.env.NEXTAUTH_URL || "https://helpdesk.vmasys.com.br";
    const amount = company.customPrice || company.plan?.price || 299;

    // Cria ou recupera cliente no Stripe
    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: company.name,
        email: session.email,
        metadata: { companyId: company.id },
      });
      customerId = customer.id;
      await prisma.company.update({
        where: { id: companyId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Cria a sessão de checkout no Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Assinatura VMASYS: ${company.plan?.name || "Plano sob Medida"}`,
              description: `Mensalidade de desenvolvimento e suporte contínuo para ${company.name}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/portal/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/portal/dashboard?payment=cancelled`,
      metadata: {
        companyId: company.id,
        invoiceId: invoiceId || "",
      },
    });

    return { success: true, checkoutUrl: checkoutSession.url };
  } catch (err: any) {
    console.error("Erro ao criar sessão Stripe:", err);
    return { error: "Erro ao iniciar pagamento no Stripe: " + (err.message || "") };
  }
}

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getOnboardingGateStatus } from "@/lib/onboarding-gate";
import PaymentGateClient from "./PaymentGateClient";

export default async function PortalPagamentoPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (!session.companyId) {
    redirect("/portal/dashboard");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    include: {
      plan: true,
      contract: true,
      briefing: true,
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) {
    redirect("/portal/dashboard");
  }

  const gate = getOnboardingGateStatus(company as any, session.role);

  // Se o contrato ainda não foi assinado, redireciona para o Passo 1 (Contrato)
  if (!gate.isContractSigned && session.role === "CLIENT") {
    redirect("/portal/contrato");
  }

  // Pega a fatura pendente mais recente ou a primeira fatura
  const pendingInvoice =
    company.invoices.find((i) => i.status === "PENDING") ||
    company.invoices[0] ||
    null;

  return (
    <PaymentGateClient
      company={company as any}
      invoice={pendingInvoice as any}
      gate={gate}
    />
  );
}

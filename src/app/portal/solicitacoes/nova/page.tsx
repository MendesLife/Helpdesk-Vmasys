import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NewTicketForm from "./NewTicketForm";
import { getOnboardingGateStatus } from "@/lib/onboarding-gate";

export default async function NewTicketPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let companyId = session.companyId;
  if (!companyId && (session.role === "ADMIN" || session.role === "EQUIPE")) {
    const firstComp = await prisma.company.findFirst();
    companyId = firstComp?.id || null;
  }

  if (!companyId) {
    return <div>Nenhuma empresa vinculada.</div>;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { contract: true, briefing: true, invoices: true },
  });

  const gate = getOnboardingGateStatus(company as any, session.role);
  if (!gate.canAccessTickets && session.role === "CLIENT") {
    redirect(gate.redirectTarget || "/portal/contrato");
  }

  const sites = await prisma.companySite.findMany({
    where: { companyId },
    orderBy: { isPrimary: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Nova Solicitação de Alteração
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Descreva detalhadamente o que precisa ser atualizado em seu site.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <NewTicketForm sites={sites} companyId={companyId} />
      </div>
    </div>
  );
}

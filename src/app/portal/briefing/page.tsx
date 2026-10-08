import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getOnboardingGateStatus } from "@/lib/onboarding-gate";
import OnboardingGateStepper from "@/components/OnboardingGateStepper";
import BriefingForm from "./BriefingForm";

export default async function ClientBriefingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let companyId = session.companyId;
  if (!companyId && (session.role === "ADMIN" || session.role === "EQUIPE")) {
    const firstCompany = await prisma.company.findFirst();
    companyId = firstCompany?.id || null;
  }

  if (!companyId) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-800 text-sm">
        Nenhuma empresa vinculada à sua conta. Entre em contato com o suporte.
      </div>
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      plan: true,
      briefing: true,
      contract: true,
      invoices: true,
    },
  });

  if (!company) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-800 text-sm">
        Empresa não encontrada.
      </div>
    );
  }

  const gate = getOnboardingGateStatus(company as any, session.role);

  // Trava de Onboarding: se ainda não assinou o contrato ou não pagou, redireciona para a etapa anterior
  if (!gate.canAccessBriefing && session.role === "CLIENT") {
    redirect(gate.redirectTarget || "/portal/contrato");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <OnboardingGateStepper gate={gate} companyName={company.name} />

      <BriefingForm
        companyId={company.id}
        companyName={company.name}
        planName={company.plan?.name || "Plano sob Medida"}
        briefing={company.briefing}
        onboardingStage={company.onboardingStage}
        planBriefingQuestions={company.plan?.briefingQuestions || null}
      />
    </div>
  );
}

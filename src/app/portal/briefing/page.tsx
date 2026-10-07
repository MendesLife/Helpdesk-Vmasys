import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
    },
  });

  if (!company) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-800 text-sm">
        Empresa não encontrada.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BriefingForm
        companyId={company.id}
        companyName={company.name}
        planName={company.plan?.name || "Plano sob Medida"}
        briefing={company.briefing}
        onboardingStage={company.onboardingStage}
      />
    </div>
  );
}

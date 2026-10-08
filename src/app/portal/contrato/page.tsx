import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { generateDefaultContractTerms } from "@/lib/contract-template";
import ContractViewClient from "./ContractViewClient";

export const dynamic = "force-dynamic";

export default async function ClientContractPage() {
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
      contract: true,
    },
  });

  if (!company) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-800 text-sm">
        Empresa não encontrada.
      </div>
    );
  }

  // Se a empresa ainda não tiver um texto customizado gravado no contrato, gera o texto padrão com os dados do plano
  const contractContent =
    company.contract?.termsContent || generateDefaultContractTerms(company);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ContractViewClient
        companyId={company.id}
        companyName={company.name}
        companyDocument={company.document}
        planName={company.plan?.name || "Plano sob Medida"}
        contract={company.contract}
        termsContent={contractContent}
        userEmail={session.email}
        userName={session.name}
      />
    </div>
  );
}

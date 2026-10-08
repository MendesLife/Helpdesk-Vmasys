"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { generateDefaultContractTerms } from "@/lib/contract-template";

export async function signContractAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Não autorizado. Por favor, faça login para continuar." };
  }

  const companyId = formData.get("companyId")?.toString();
  const signerName = formData.get("signerName")?.toString().trim();
  const signerDocument = formData.get("signerDocument")?.toString().trim();
  const termsAgreed = formData.get("termsAgreed") === "true";

  if (!companyId) {
    return { error: "Identificador da empresa não fornecido." };
  }

  if (!signerName) {
    return { error: "Por favor, informe o nome completo do responsável para assinatura." };
  }

  if (!termsAgreed) {
    return { error: "Você precisa declarar que leu e concorda com os termos do contrato." };
  }

  // Verifica permissão do usuário
  if (session.role === "CLIENT") {
    const hasMembership = await prisma.companyMember.findFirst({
      where: { companyId, userId: session.userId },
    });
    const isDirect = session.companyId === companyId;

    if (!hasMembership && !isDirect) {
      return { error: "Você não possui permissão para assinar o contrato desta empresa." };
    }
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true, contract: true },
    });

    if (!company) {
      return { error: "Empresa não encontrada no sistema." };
    }

    // Se a empresa ainda não tiver CNPJ/CPF e o usuário forneceu, atualiza na empresa
    if (signerDocument && !company.document) {
      await prisma.company.update({
        where: { id: companyId },
        data: { document: signerDocument },
      });
    }

    // Captura o endereço IP do signatário
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";

    // Garante que o texto definitivo do contrato está congelado
    const contractTerms = company.contract?.termsContent || generateDefaultContractTerms(company);

    await prisma.contract.upsert({
      where: { companyId },
      update: {
        status: "SIGNED",
        signedAt: new Date(),
        signedByName: signerName,
        signedByEmail: session.email,
        signedByIp: ip,
        termsContent: contractTerms,
      },
      create: {
        companyId,
        status: "SIGNED",
        signedAt: new Date(),
        signedByName: signerName,
        signedByEmail: session.email,
        signedByIp: ip,
        termsContent: contractTerms,
      },
    });

    revalidatePath("/portal/contrato");
    revalidatePath("/portal/dashboard");
    revalidatePath(`/admin/clientes/${companyId}`);
    revalidatePath("/admin/clientes");

    return {
      success: true,
      message: "Contrato assinado eletronicamente com sucesso! O registro com validade jurídica foi formalizado.",
    };
  } catch (err: any) {
    console.error("Erro ao assinar contrato:", err);
    return { error: "Erro interno ao processar a assinatura do contrato." };
  }
}

export async function updateContractTermsAction(
  companyId: string,
  termsContent: string
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    return { error: "Apenas administradores podem editar os termos contratuais." };
  }

  if (!companyId || !termsContent) {
    return { error: "Parâmetros inválidos para atualização do contrato." };
  }

  try {
    await prisma.contract.upsert({
      where: { companyId },
      update: {
        termsContent,
      },
      create: {
        companyId,
        termsContent,
        status: "PENDING",
      },
    });

    revalidatePath(`/admin/clientes/${companyId}`);
    revalidatePath("/portal/contrato");

    return { success: true, message: "Minuta do contrato atualizada com sucesso!" };
  } catch (err: any) {
    console.error("Erro ao atualizar termos do contrato:", err);
    return { error: "Erro ao salvar alterações na minuta do contrato." };
  }
}

export async function resetContractAction(companyId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Apenas o Administrador Geral pode reabrir um contrato assinado." };
  }

  try {
    await prisma.contract.update({
      where: { companyId },
      data: {
        status: "PENDING",
        signedAt: null,
        signedByName: null,
        signedByEmail: null,
        signedByIp: null,
      },
    });

    revalidatePath(`/admin/clientes/${companyId}`);
    revalidatePath("/portal/contrato");
    revalidatePath("/portal/dashboard");

    return { success: true, message: "Contrato reaberto para nova assinatura com sucesso!" };
  } catch (err: any) {
    console.error("Erro ao reabrir contrato:", err);
    return { error: "Erro interno ao reabrir contrato." };
  }
}

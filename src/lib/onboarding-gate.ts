export interface OnboardingCompanyData {
  id: string;
  name: string;
  financialStatus?: string | null;
  onboardingStage?: string | null;
  contract?: {
    status?: string | null;
    signedAt?: Date | string | null;
  } | null;
  briefing?: {
    status?: string | null;
    submittedAt?: Date | string | null;
    approvedAt?: Date | string | null;
  } | null;
  invoices?: {
    id: string;
    status: string;
    amount: number;
    dueDate: Date | string;
    paidAt?: Date | string | null;
  }[] | null;
}

export interface GateStatus {
  currentStep: 1 | 2 | 3 | 4;
  isContractSigned: boolean;
  isPaymentSettled: boolean;
  isBriefingApproved: boolean;
  isBriefingSubmitted: boolean;
  isFullyUnlocked: boolean;
  canAccessContrato: boolean;
  canAccessPagamento: boolean;
  canAccessBriefing: boolean;
  canAccessTickets: boolean;
  redirectTarget: string | null;
  statusLabel: string;
}

export function getOnboardingGateStatus(
  company: OnboardingCompanyData | null | undefined,
  userRole?: string
): GateStatus {
  // Admins e Equipe têm acesso irrestrito
  if (userRole === "ADMIN" || userRole === "EQUIPE") {
    return {
      currentStep: 4,
      isContractSigned: true,
      isPaymentSettled: true,
      isBriefingApproved: true,
      isBriefingSubmitted: true,
      isFullyUnlocked: true,
      canAccessContrato: true,
      canAccessPagamento: true,
      canAccessBriefing: true,
      canAccessTickets: true,
      redirectTarget: null,
      statusLabel: "Acesso Total (Equipe VMASYS)",
    };
  }

  if (!company) {
    return {
      currentStep: 1,
      isContractSigned: false,
      isPaymentSettled: false,
      isBriefingApproved: false,
      isBriefingSubmitted: false,
      isFullyUnlocked: false,
      canAccessContrato: true,
      canAccessPagamento: false,
      canAccessBriefing: false,
      canAccessTickets: false,
      redirectTarget: "/portal/contrato",
      statusLabel: "Contrato Pendente",
    };
  }

  // Trava 1: Contrato de Prestação de Serviços
  const isContractSigned = Boolean(
    company.contract && company.contract.status === "SIGNED"
  );

  // Trava 2: Confirmação do Primeiro Pagamento
  const hasPaidInvoice = Boolean(
    company.invoices && company.invoices.some((i) => i.status === "PAID")
  );
  const isPaymentSettled = Boolean(
    company.financialStatus === "EM_DIA" || hasPaidInvoice
  );

  // Trava 3: Briefing de Construção do Site
  const isBriefingApproved = Boolean(
    company.briefing?.status === "APPROVED" ||
    company.onboardingStage === "ATIVO_MANUTENCAO"
  );
  const isBriefingSubmitted = Boolean(
    company.briefing?.status === "SUBMITTED" || isBriefingApproved
  );

  // Trava 4: Painel Totalmente Desbloqueado
  const isFullyUnlocked = isContractSigned && isPaymentSettled && isBriefingApproved;

  let currentStep: 1 | 2 | 3 | 4 = 1;
  let redirectTarget: string | null = "/portal/contrato";
  let statusLabel = "Passo 1: Assinatura do Contrato";

  if (!isContractSigned) {
    currentStep = 1;
    redirectTarget = "/portal/contrato";
    statusLabel = "Passo 1: Assinatura do Contrato";
  } else if (!isPaymentSettled) {
    currentStep = 2;
    redirectTarget = "/portal/pagamento";
    statusLabel = "Passo 2: Confirmação de Pagamento";
  } else if (!isBriefingApproved) {
    currentStep = 3;
    redirectTarget = "/portal/briefing";
    statusLabel = isBriefingSubmitted
      ? "Passo 3: Briefing em Avaliação"
      : "Passo 3: Preenchimento do Briefing";
  } else {
    currentStep = 4;
    redirectTarget = null;
    statusLabel = "Painel Liberado • Manutenção Ativa";
  }

  return {
    currentStep,
    isContractSigned,
    isPaymentSettled,
    isBriefingApproved,
    isBriefingSubmitted,
    isFullyUnlocked,
    canAccessContrato: true, // Sempre pode visualizar o contrato assinado
    canAccessPagamento: isContractSigned, // Pode acessar faturas após assinar
    canAccessBriefing: isContractSigned && isPaymentSettled, // Pode acessar briefing após pagar
    canAccessTickets: isFullyUnlocked, // Só abre tickets após briefing aprovado
    redirectTarget,
    statusLabel,
  };
}

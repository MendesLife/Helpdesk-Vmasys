export interface OnboardingCompanyData {
  id: string;
  name: string;
  financialStatus?: string | null;
  onboardingStage?: string | null;
  customPrice?: number | null;
  plan?: {
    id: string;
    name: string;
    price?: number | null;
  } | null;
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

export interface FinancialAlert {
  hasOverdue: boolean;
  isGracePeriod: boolean; // Tolerância de até 3 dias com aviso amigável
  isBlocked: boolean; // Bloqueio após 3 dias ou status ATRASADO/SUSPENSO
  daysOverdue: number;
  amount: number;
  dueDate: Date | string | null;
  message: string;
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
  financialAlert: FinancialAlert | null;
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
      financialAlert: null,
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
      financialAlert: null,
    };
  }

  // Trava 1: Contrato de Prestação de Serviços
  const isContractSigned = Boolean(
    company.contract && company.contract.status === "SIGNED"
  );

  // Trava 2: Confirmação do Primeiro Pagamento (Onboarding Inicial)
  const isFreePlan = Boolean(
    company.customPrice === 0 ||
    (company.customPrice == null && company.plan && company.plan.price === 0)
  );
  const hasPaidInvoice = Boolean(
    company.invoices && company.invoices.some((i) => i.status === "PAID")
  );
  const isPaymentSettled = Boolean(
    isFreePlan || company.financialStatus === "EM_DIA" || hasPaidInvoice
  );

  // Trava 3: Briefing de Construção do Site
  const isBriefingApproved = Boolean(
    company.briefing?.status === "APPROVED" ||
    company.onboardingStage === "ATIVO_MANUTENCAO"
  );
  const isBriefingSubmitted = Boolean(
    company.briefing?.status === "SUBMITTED" || isBriefingApproved
  );

  // Verificação de Inadimplência Contínua / Recorrência
  let financialAlert: FinancialAlert | null = null;
  const isExplicitDelinquent =
    company.financialStatus === "ATRASADO" ||
    company.financialStatus === "EM_ATRASO" ||
    company.financialStatus === "SUSPENSO";

  const now = new Date();
  const unpaidInvoices = (company.invoices || []).filter(
    (i) => i.status !== "PAID" && i.status !== "CANCELLED"
  );

  let oldestOverdueDays = 0;
  let overdueInvoice: (typeof unpaidInvoices)[0] | null = null;

  for (const inv of unpaidInvoices) {
    const due = new Date(inv.dueDate);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 || inv.status === "OVERDUE") {
      const daysCount = Math.max(0, diffDays);
      if (daysCount >= oldestOverdueDays) {
        oldestOverdueDays = daysCount;
        overdueInvoice = inv;
      }
    }
  }

  const hasAnyOverdue = Boolean(overdueInvoice || isExplicitDelinquent);
  const GRACE_PERIOD_DAYS = 3;

  if (hasAnyOverdue && isPaymentSettled) {
    const isGracePeriod = !isExplicitDelinquent && oldestOverdueDays <= GRACE_PERIOD_DAYS;
    const isBlocked = isExplicitDelinquent || oldestOverdueDays > GRACE_PERIOD_DAYS;

    financialAlert = {
      hasOverdue: true,
      isGracePeriod,
      isBlocked,
      daysOverdue: oldestOverdueDays,
      amount: overdueInvoice?.amount || 0,
      dueDate: overdueInvoice?.dueDate || null,
      message: isBlocked
        ? `Sua mensalidade está em atraso há ${oldestOverdueDays} dia(s). A abertura de novos chamados e o atendimento estão temporariamente suspensos. Regularize seu pagamento para liberação imediata.`
        : `Aviso de Vencimento: Sua fatura mensal venceu há ${oldestOverdueDays} dia(s). Você tem até 3 dias de tolerância antes da suspensão de novas solicitações.`,
    };
  }

  // Trava 4: Painel Totalmente Desbloqueado
  const isFullyUnlocked = isContractSigned && isPaymentSettled && isBriefingApproved;
  const isTicketBlockedByFinance = Boolean(financialAlert?.isBlocked);
  const canAccessTickets = isFullyUnlocked && !isTicketBlockedByFinance;

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
    redirectTarget = isTicketBlockedByFinance ? "/portal/pagamento" : null;
    statusLabel = isTicketBlockedByFinance
      ? "Acesso Suspenso por Inadimplência"
      : financialAlert?.isGracePeriod
      ? "Mensalidade em Aberto (Carência de 3 Dias)"
      : "Painel Liberado • Manutenção Ativa";
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
    canAccessTickets, // Bloqueia tickets se inadimplente (> 3 dias) ou briefing pendente
    redirectTarget,
    statusLabel,
    financialAlert,
  };
}

import { describe, it, expect } from "vitest";
import { getOnboardingGateStatus } from "../src/lib/onboarding-gate";

describe("Funil de Onboarding com Travas Progressivas (Gated Onboarding)", () => {
  it("Passo 1: Bloqueia tudo e redireciona para o contrato se o contrato não estiver assinado", () => {
    const company = {
      id: "comp-1",
      name: "Empresa Teste",
      financialStatus: "PENDENTE",
      contract: null,
      briefing: null,
      invoices: [],
    };

    const gate = getOnboardingGateStatus(company, "CLIENT");

    expect(gate.currentStep).toBe(1);
    expect(gate.isContractSigned).toBe(false);
    expect(gate.isPaymentSettled).toBe(false);
    expect(gate.isBriefingApproved).toBe(false);
    expect(gate.isFullyUnlocked).toBe(false);

    expect(gate.canAccessContrato).toBe(true);
    expect(gate.canAccessPagamento).toBe(false);
    expect(gate.canAccessBriefing).toBe(false);
    expect(gate.canAccessTickets).toBe(false);
    expect(gate.redirectTarget).toBe("/portal/contrato");
  });

  it("Passo 2: Libera pagamento mas trava briefing e chamados se o contrato foi assinado mas o pagamento está pendente", () => {
    const company = {
      id: "comp-2",
      name: "Empresa Teste",
      financialStatus: "PENDENTE",
      contract: { status: "SIGNED", signedAt: new Date() },
      briefing: null,
      invoices: [
        { id: "inv-1", status: "PENDING", amount: 299, dueDate: new Date() },
      ],
    };

    const gate = getOnboardingGateStatus(company, "CLIENT");

    expect(gate.currentStep).toBe(2);
    expect(gate.isContractSigned).toBe(true);
    expect(gate.isPaymentSettled).toBe(false);
    expect(gate.isBriefingApproved).toBe(false);
    expect(gate.isFullyUnlocked).toBe(false);

    expect(gate.canAccessContrato).toBe(true);
    expect(gate.canAccessPagamento).toBe(true);
    expect(gate.canAccessBriefing).toBe(false);
    expect(gate.canAccessTickets).toBe(false);
    expect(gate.redirectTarget).toBe("/portal/pagamento");
  });

  it("Passo 3: Libera briefing após confirmação do pagamento, mas mantém chamados travados até aprovação", () => {
    const company = {
      id: "comp-3",
      name: "Empresa Teste",
      financialStatus: "EM_DIA",
      contract: { status: "SIGNED", signedAt: new Date() },
      briefing: { status: "DRAFT" },
      invoices: [
        { id: "inv-1", status: "PAID", amount: 299, dueDate: new Date(), paidAt: new Date() },
      ],
    };

    const gate = getOnboardingGateStatus(company, "CLIENT");

    expect(gate.currentStep).toBe(3);
    expect(gate.isContractSigned).toBe(true);
    expect(gate.isPaymentSettled).toBe(true);
    expect(gate.isBriefingApproved).toBe(false);
    expect(gate.isFullyUnlocked).toBe(false);

    expect(gate.canAccessContrato).toBe(true);
    expect(gate.canAccessPagamento).toBe(true);
    expect(gate.canAccessBriefing).toBe(true);
    expect(gate.canAccessTickets).toBe(false);
    expect(gate.redirectTarget).toBe("/portal/briefing");
  });

  it("Passo 4: Libera painel completo (chamados e manutenção) quando o briefing for aprovado pela equipe", () => {
    const company = {
      id: "comp-4",
      name: "Empresa Teste",
      financialStatus: "EM_DIA",
      onboardingStage: "ATIVO_MANUTENCAO",
      contract: { status: "SIGNED", signedAt: new Date() },
      briefing: { status: "APPROVED", approvedAt: new Date() },
      invoices: [
        { id: "inv-1", status: "PAID", amount: 299, dueDate: new Date(), paidAt: new Date() },
      ],
    };

    const gate = getOnboardingGateStatus(company, "CLIENT");

    expect(gate.currentStep).toBe(4);
    expect(gate.isContractSigned).toBe(true);
    expect(gate.isPaymentSettled).toBe(true);
    expect(gate.isBriefingApproved).toBe(true);
    expect(gate.isFullyUnlocked).toBe(true);

    expect(gate.canAccessContrato).toBe(true);
    expect(gate.canAccessPagamento).toBe(true);
    expect(gate.canAccessBriefing).toBe(true);
    expect(gate.canAccessTickets).toBe(true);
    expect(gate.redirectTarget).toBeNull();
  });

  it("Membros da equipe e administradores sempre têm acesso total para suporte", () => {
    const company = {
      id: "comp-5",
      name: "Empresa Teste",
      financialStatus: "PENDENTE",
      contract: null,
      briefing: null,
      invoices: [],
    };

    const gateAdmin = getOnboardingGateStatus(company, "ADMIN");
    const gateEquipe = getOnboardingGateStatus(company, "EQUIPE");

    expect(gateAdmin.isFullyUnlocked).toBe(true);
    expect(gateAdmin.canAccessTickets).toBe(true);
    expect(gateAdmin.redirectTarget).toBeNull();

    expect(gateEquipe.isFullyUnlocked).toBe(true);
    expect(gateEquipe.canAccessTickets).toBe(true);
    expect(gateEquipe.redirectTarget).toBeNull();
  });
});

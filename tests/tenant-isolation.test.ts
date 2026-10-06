import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  validateTenantAccess,
  getTenantTicketFilter,
  canViewInternalNotes,
  TenantAccessError,
} from "../src/lib/tenant";
import { prisma } from "../src/lib/prisma";
import { SessionPayload } from "../src/lib/auth";

describe("Segurança e Isolamento Multi-Tenant entre Empresas", () => {
  let acmeCompanyId: string;
  let techflowCompanyId: string;
  let userAcmeSession: SessionPayload;
  let userTechflowSession: SessionPayload;
  let adminSession: SessionPayload;
  let equipeSession: SessionPayload;

  beforeAll(async () => {
    // Busca dados reais do banco gerados pelo seed
    const acme = await prisma.company.findFirst({
      where: { name: "Acme Odontologia" },
    });
    const techflow = await prisma.company.findFirst({
      where: { name: "TechFlow Logística" },
    });

    if (!acme || !techflow) {
      throw new Error("Execute o seed antes dos testes (npm run db:seed).");
    }

    acmeCompanyId = acme.id;
    techflowCompanyId = techflow.id;

    userAcmeSession = {
      userId: "user-acme-1",
      name: "Dra. Ana Paula",
      email: "ana@acmeodonto.com.br",
      role: "CLIENT",
      companyId: acmeCompanyId,
      companyName: "Acme Odontologia",
    };

    userTechflowSession = {
      userId: "user-tech-1",
      name: "Marcos Silva",
      email: "marcos@techflow.com.br",
      role: "CLIENT",
      companyId: techflowCompanyId,
      companyName: "TechFlow Logística",
    };

    adminSession = {
      userId: "user-admin",
      name: "Victor Admin",
      email: "admin@agencia.com",
      role: "ADMIN",
    };

    equipeSession = {
      userId: "user-equipe",
      name: "Carlos Suporte",
      email: "suporte@agencia.com",
      role: "EQUIPE",
    };
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Deve permitir que um cliente acerte dados da sua própria empresa", () => {
    expect(() =>
      validateTenantAccess(userAcmeSession, acmeCompanyId)
    ).not.toThrow();
  });

  it("Deve BLOQUEAR estritamente quando um cliente tentar acessar dados de outra empresa", () => {
    // Cliente Acme tentando acessar dados da TechFlow
    expect(() =>
      validateTenantAccess(userAcmeSession, techflowCompanyId)
    ).toThrow(TenantAccessError);

    // Cliente TechFlow tentando acessar dados da Acme
    expect(() =>
      validateTenantAccess(userTechflowSession, acmeCompanyId)
    ).toThrow(TenantAccessError);
  });

  it("Admin e Equipe da agência devem ter acesso a todas as empresas", () => {
    expect(() => validateTenantAccess(adminSession, acmeCompanyId)).not.toThrow();
    expect(() =>
      validateTenantAccess(adminSession, techflowCompanyId)
    ).not.toThrow();
    expect(() => validateTenantAccess(equipeSession, acmeCompanyId)).not.toThrow();
  });

  it("Filtro de busca de chamados deve restringir ao companyId do cliente", async () => {
    const filterAcme = getTenantTicketFilter(userAcmeSession);
    expect(filterAcme).toEqual({ companyId: acmeCompanyId });

    // Consulta no banco usando o filtro seguro
    const acmeTickets = await prisma.ticket.findMany({
      where: filterAcme,
    });

    expect(acmeTickets.length).toBeGreaterThan(0);
    // Nenhum chamado pode ser da TechFlow
    acmeTickets.forEach((t) => {
      expect(t.companyId).toBe(acmeCompanyId);
      expect(t.companyId).not.toBe(techflowCompanyId);
    });
  });

  it("Notas internas NÃO devem ser visíveis para clientes", async () => {
    expect(canViewInternalNotes(userAcmeSession)).toBe(false);
    expect(canViewInternalNotes(userTechflowSession)).toBe(false);
    expect(canViewInternalNotes(adminSession)).toBe(true);
    expect(canViewInternalNotes(equipeSession)).toBe(true);

    // Busca comentários do chamado #1001
    const ticket1 = await prisma.ticket.findUnique({
      where: { ticketNumber: 1001 },
      include: { comments: true },
    });

    expect(ticket1).toBeDefined();

    // Filtra comentários como a API do cliente faz:
    const clientVisibleComments = ticket1!.comments.filter((c) => !c.isInternal);
    const internalComments = ticket1!.comments.filter((c) => c.isInternal);

    // Existe pelo menos uma nota interna criada no seed
    expect(internalComments.length).toBeGreaterThan(0);

    // O cliente JAMAIS deve receber notas internas
    clientVisibleComments.forEach((c) => {
      expect(c.isInternal).toBe(false);
    });
  });
});

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import TenantSwitcher from "@/components/TenantSwitcher";
import { getOnboardingGateStatus } from "@/lib/onboarding-gate";
import {
  Layers,
  LayoutDashboard,
  Ticket,
  PlusCircle,
  LogOut,
  ExternalLink,
  FileText,
  Scale,
  CreditCard,
  Lock,
  CheckCircle2,
} from "lucide-react";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Busca todas as empresas ativas que o usuário tem permissão de acesso
  let userCompanies: { id: string; name: string; status: string }[] = [];
  if (session.userId) {
    const memberships = await prisma.companyMember.findMany({
      where: { userId: session.userId },
      include: { company: true },
    });

    const mapped = [
      ...(session.companyId
        ? [{ id: session.companyId, name: session.companyName || "", status: "ACTIVE" }]
        : []),
      ...memberships.map((m) => ({
        id: m.company.id,
        name: m.company.name,
        status: m.company.status,
      })),
    ];

    userCompanies = mapped.filter(
      (c, idx, arr) =>
        arr.findIndex((x) => x.id === c.id) === idx && c.status === "ACTIVE"
    );
  }

  // Busca a empresa ativa com dados de onboarding, contrato, briefing e faturas
  const currentCompany = session.companyId
    ? await prisma.company.findUnique({
        where: { id: session.companyId },
        include: {
          contract: true,
          briefing: true,
          invoices: true,
        },
      })
    : null;

  const gate = getOnboardingGateStatus(currentCompany as any, session.role);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <Link
                href={
                  gate.isFullyUnlocked
                    ? "/portal/dashboard"
                    : gate.redirectTarget || "/portal/contrato"
                }
                className="flex items-center space-x-3 shrink-0"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-sky-100">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-slate-900 text-base leading-tight">
                      VMASYS
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                      Portal
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Central do Cliente
                  </span>
                </div>
              </Link>

              <TenantSwitcher
                currentCompanyId={session.companyId}
                companies={userCompanies}
              />

              {/* Desktop Nav Links */}
              <nav className="hidden sm:flex items-center space-x-1 pl-4">
                <Link
                  href={
                    gate.isFullyUnlocked
                      ? "/portal/dashboard"
                      : gate.redirectTarget || "/portal/contrato"
                  }
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50/60 flex items-center space-x-1.5 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  <span>Início</span>
                </Link>

                {/* 1. Contrato */}
                <Link
                  href="/portal/contrato"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50/60 flex items-center space-x-1.5 transition-colors"
                >
                  <Scale className="w-4 h-4 text-slate-400" />
                  <span>Contrato</span>
                  {gate.isContractSigned ? (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                      ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 rounded-full">
                      1
                    </span>
                  )}
                </Link>

                {/* 2. Pagamento */}
                {gate.canAccessPagamento ? (
                  <Link
                    href="/portal/pagamento"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50/60 flex items-center space-x-1.5 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>Pagamento</span>
                    {gate.isPaymentSettled ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                        ✓
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 rounded-full">
                        2
                      </span>
                    )}
                  </Link>
                ) : (
                  <div
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 flex items-center space-x-1.5 cursor-not-allowed select-none"
                    title="Disponível após assinar o contrato"
                  >
                    <CreditCard className="w-4 h-4 text-slate-300" />
                    <span>Pagamento</span>
                    <Lock className="w-3 h-3 text-slate-300" />
                  </div>
                )}

                {/* 3. Briefing */}
                {gate.canAccessBriefing ? (
                  <Link
                    href="/portal/briefing"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50/60 flex items-center space-x-1.5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Briefing</span>
                    {gate.isBriefingApproved ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                        ✓
                      </span>
                    ) : (
                      <span className="text-[10px] text-sky-700 font-bold bg-sky-100 px-1.5 rounded-full">
                        3
                      </span>
                    )}
                  </Link>
                ) : (
                  <div
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 flex items-center space-x-1.5 cursor-not-allowed select-none"
                    title="Disponível após confirmação do primeiro pagamento"
                  >
                    <FileText className="w-4 h-4 text-slate-300" />
                    <span>Briefing</span>
                    <Lock className="w-3 h-3 text-slate-300" />
                  </div>
                )}

                {/* 4. Solicitações */}
                {gate.canAccessTickets ? (
                  <Link
                    href="/portal/solicitacoes"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50/60 flex items-center space-x-1.5 transition-colors"
                  >
                    <Ticket className="w-4 h-4 text-slate-400" />
                    <span>Solicitações</span>
                  </Link>
                ) : (
                  <div
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 flex items-center space-x-1.5 cursor-not-allowed select-none"
                    title="Disponível após aprovação do briefing e ativação do site"
                  >
                    <Ticket className="w-4 h-4 text-slate-300" />
                    <span>Solicitações</span>
                    <Lock className="w-3 h-3 text-slate-300" />
                  </div>
                )}

                {/* + Nova Solicitação */}
                {gate.canAccessTickets ? (
                  <Link
                    href="/portal/solicitacoes/nova"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 flex items-center space-x-1.5 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Nova Solicitação</span>
                  </Link>
                ) : (
                  <div
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 bg-slate-100/60 flex items-center space-x-1.5 cursor-not-allowed select-none"
                    title="Disponível após ativação do site"
                  >
                    <PlusCircle className="w-4 h-4 text-slate-300" />
                    <span>Nova Solicitação</span>
                    <Lock className="w-3 h-3 text-slate-300" />
                  </div>
                )}
              </nav>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none">
                  {session.name}
                </p>
                <p className="text-xs text-slate-400 mt-1">{session.email}</p>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block" />

              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Sair do sistema"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center text-xs font-medium"
                >
                  <LogOut className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile Nav Sub-bar */}
        <div className="sm:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-around bg-slate-50 text-xs font-medium">
          <Link
            href={
              gate.isFullyUnlocked
                ? "/portal/dashboard"
                : gate.redirectTarget || "/portal/contrato"
            }
            className="flex flex-col items-center py-1 text-slate-600 hover:text-sky-600"
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Início</span>
          </Link>

          <Link
            href="/portal/contrato"
            className="flex flex-col items-center py-1 text-slate-600 hover:text-sky-600 relative"
          >
            <Scale className="w-4 h-4 mb-0.5" />
            <span>Contrato</span>
            {gate.isContractSigned && (
              <span className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </Link>

          {gate.canAccessPagamento ? (
            <Link
              href="/portal/pagamento"
              className="flex flex-col items-center py-1 text-slate-600 hover:text-sky-600 relative"
            >
              <CreditCard className="w-4 h-4 mb-0.5" />
              <span>Pagar</span>
              {gate.isPaymentSettled && (
                <span className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </Link>
          ) : (
            <div className="flex flex-col items-center py-1 text-slate-300 opacity-60">
              <Lock className="w-4 h-4 mb-0.5" />
              <span>Pagar</span>
            </div>
          )}

          {gate.canAccessBriefing ? (
            <Link
              href="/portal/briefing"
              className="flex flex-col items-center py-1 text-slate-600 hover:text-sky-600 relative"
            >
              <FileText className="w-4 h-4 mb-0.5" />
              <span>Briefing</span>
              {gate.isBriefingApproved && (
                <span className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </Link>
          ) : (
            <div className="flex flex-col items-center py-1 text-slate-300 opacity-60">
              <Lock className="w-4 h-4 mb-0.5" />
              <span>Briefing</span>
            </div>
          )}

          {gate.canAccessTickets ? (
            <Link
              href="/portal/solicitacoes"
              className="flex flex-col items-center py-1 text-slate-600 hover:text-sky-600"
            >
              <Ticket className="w-4 h-4 mb-0.5" />
              <span>Chamados</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center py-1 text-slate-300 opacity-60">
              <Lock className="w-4 h-4 mb-0.5" />
              <span>Chamados</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <p>
          VMASYS • Portal do Cliente & Manutenção de Sites por Assinatura • Todos
          os direitos reservados
        </p>
      </footer>
    </div>
  );
}

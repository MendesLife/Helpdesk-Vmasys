import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import TenantSwitcher from "@/components/TenantSwitcher";
import {
  Layers,
  LayoutDashboard,
  Ticket,
  PlusCircle,
  LogOut,
  ExternalLink,
  FileText,
  Scale,
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <Link
                href="/portal/dashboard"
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
                  href="/portal/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50/60 flex items-center space-x-1.5 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  <span>Início</span>
                </Link>

                <Link
                  href="/portal/briefing"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50/60 flex items-center space-x-1.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Briefing</span>
                </Link>

                <Link
                  href="/portal/contrato"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50/60 flex items-center space-x-1.5 transition-colors"
                >
                  <Scale className="w-4 h-4 text-slate-400" />
                  <span>Contrato</span>
                </Link>

                <Link
                  href="/portal/solicitacoes"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50/60 flex items-center space-x-1.5 transition-colors"
                >
                  <Ticket className="w-4 h-4 text-slate-400" />
                  <span>Solicitações</span>
                </Link>

                <Link
                  href="/portal/solicitacoes/nova"
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 flex items-center space-x-1.5 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nova Solicitação</span>
                </Link>
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
            href="/portal/dashboard"
            className="flex flex-col items-center py-1 text-slate-600 hover:text-sky-600"
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Início</span>
          </Link>
          <Link
            href="/portal/briefing"
            className="flex flex-col items-center py-1 text-slate-600 hover:text-sky-600"
          >
            <FileText className="w-4 h-4 mb-0.5" />
            <span>Briefing</span>
          </Link>
          <Link
            href="/portal/contrato"
            className="flex flex-col items-center py-1 text-slate-600 hover:text-sky-600"
          >
            <Scale className="w-4 h-4 mb-0.5" />
            <span>Contrato</span>
          </Link>
          <Link
            href="/portal/solicitacoes"
            className="flex flex-col items-center py-1 text-slate-600 hover:text-sky-600"
          >
            <Ticket className="w-4 h-4 mb-0.5" />
            <span>Solicitações</span>
          </Link>
          <Link
            href="/portal/solicitacoes/nova"
            className="flex flex-col items-center py-1 text-sky-700 font-semibold"
          >
            <PlusCircle className="w-4 h-4 mb-0.5" />
            <span>+ Solicitação</span>
          </Link>
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

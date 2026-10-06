import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import {
  Layers,
  LayoutDashboard,
  Ticket,
  PlusCircle,
  LogOut,
  Building2,
  ExternalLink,
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-6">
              <Link
                href="/portal/dashboard"
                className="flex items-center space-x-3"
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

              {session.companyName && (
                <div className="hidden md:flex items-center px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100 text-sky-800 text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                  <span>{session.companyName}</span>
                </div>
              )}

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

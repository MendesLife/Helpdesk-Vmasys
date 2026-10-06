import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import {
  Layers,
  LayoutDashboard,
  Kanban,
  Building2,
  Users,
  BarChart3,
  LogOut,
  ShieldCheck,
  Headphones,
  ExternalLink,
  Mail,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || (session.role !== "ADMIN" && session.role !== "EQUIPE")) {
    redirect("/login");
  }

  const isAdmin = session.role === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-wide block">
                VMASYS
              </span>
              <span className="text-[11px] text-sky-400 font-medium block">
                Painel da Agência
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5 text-sm font-medium">
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Visão Geral</span>
            </Link>

            <Link
              href="/admin/solicitacoes"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <Kanban className="w-4 h-4 text-slate-400" />
              <span>Fila & Kanban</span>
            </Link>

            <Link
              href="/admin/clientes"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Clientes & Sites</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin/equipe"
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Equipe Interna</span>
              </Link>
            )}

            <Link
              href="/admin/relatorios"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Relatórios & SLA</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin/configuracoes/email"
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <Mail className="w-4 h-4 text-slate-400" />
                <span>E-mails & Notificações</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">
                {session.name}
              </p>
              <div className="flex items-center space-x-1 mt-0.5">
                {isAdmin ? (
                  <span className="inline-flex items-center text-[10px] font-semibold text-sky-400">
                    <ShieldCheck className="w-3 h-3 mr-0.5" />
                    Admin Geral
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-semibold text-cyan-400">
                    <Headphones className="w-3 h-3 mr-0.5" />
                    Equipe Suporte
                  </span>
                )}
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sair do painel"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

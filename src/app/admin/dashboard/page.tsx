import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const now = new Date();

  // Busca métricas consolidadas
  const [
    totalCompanies,
    totalClientsUsers,
    totalTickets,
    pendingAgency,
    inExecution,
    inReview,
    waitingClient,
    completed,
    overdueTickets,
    priorityTickets,
  ] = await Promise.all([
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.ticket.count(),
    prisma.ticket.count({
      where: { status: { in: ["NOVO", "EM_ANALISE"] } },
    }),
    prisma.ticket.count({ where: { status: "EM_EXECUCAO" } }),
    prisma.ticket.count({ where: { status: "EM_REVISAO" } }),
    prisma.ticket.count({ where: { status: "AGUARDANDO_CLIENTE" } }),
    prisma.ticket.count({ where: { status: "CONCLUIDO" } }),
    prisma.ticket.findMany({
      where: {
        deadline: { lt: now },
        status: { notIn: ["CONCLUIDO", "CANCELADO"] },
      },
      include: { company: true, site: true },
    }),
    prisma.ticket.findMany({
      where: {
        status: { notIn: ["CONCLUIDO", "CANCELADO"] },
        OR: [{ urgency: "ALTA" }, { deadline: { lt: now } }],
      },
      take: 6,
      include: { company: true, site: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Visão Geral da Agência
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Central de controle de demandas e manutenções de todos os clientes.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/solicitacoes"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <span>Ver Fila & Kanban</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      </div>

      {/* Grid de Contadores Operacionais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Aguardando Agência */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase text-slate-400">
              Aguardando Agência
            </span>
            <Inbox className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {pendingAgency}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Novas ou em análise
            </p>
          </div>
        </div>

        {/* Em Execução */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase text-slate-400">
              Em Execução
            </span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {inExecution}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sendo desenvolvidas
            </p>
          </div>
        </div>

        {/* Em Revisão pelo Cliente */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs font-bold uppercase text-slate-400">
              Em Revisão
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {inReview}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cliente testando
            </p>
          </div>
        </div>

        {/* Chamados Atrasados (SLA Violado) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase text-rose-700">
              Atrasadas
            </span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-rose-700">
              {overdueTickets.length}
            </span>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">
              Fora do prazo previsto
            </p>
          </div>
        </div>
      </div>

      {/* Métricas de Clientes e Fila de Atenção */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Clientes Ativos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Carteira de Clientes
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Empresas pagantes de sites por assinatura
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">
                      Empresas Ativas
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {totalCompanies}
                    </span>
                  </div>
                </div>
                <Link
                  href="/admin/clientes"
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Gerenciar
                </Link>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">
                      Usuários de Clientes
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {totalClientsUsers}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">Com acesso</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">
                      Histórico Concluído
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {completed}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">Total</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/admin/clientes"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center"
            >
              <span>+ Cadastrar Nova Empresa Cliente</span>
            </Link>
          </div>
        </div>

        {/* Fila de Prioridades Imediatas (Alta Urgência ou Atrasadas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Fila de Atenção Imediata
              </h2>
              <p className="text-xs text-slate-500">
                Chamados de urgência alta ou com prazo prestes a vencer
              </p>
            </div>
            <Link
              href="/admin/solicitacoes"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {priorityTickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma solicitação de alta urgência ou atrasada no momento. Bom
              trabalho!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {priorityTickets.map((t) => {
                const isOverdue = t.deadline && new Date(t.deadline) < now;
                return (
                  <Link
                    key={t.id}
                    href={`/admin/solicitacoes/${t.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-400">
                          #{t.ticketNumber}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {t.company.name}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span>{t.site.name}</span>
                        <span>•</span>
                        <span>{t.changeType}</span>
                        {t.assignedTo && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">
                              Resp: {t.assignedTo.name.split(" ")[0]}
                            </span>
                          </>
                        )}
                        {isOverdue && (
                          <span className="text-rose-600 font-bold flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Atrasado!
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          t.urgency === "ALTA"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.urgency}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

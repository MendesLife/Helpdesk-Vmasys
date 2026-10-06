import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Layers,
} from "lucide-react";

export default async function ClientDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Se for admin ou suporte navegando no portal sem companyId, busca a primeira empresa para visualização
  let companyId = session.companyId;
  if (!companyId && (session.role === "ADMIN" || session.role === "EQUIPE")) {
    const firstCompany = await prisma.company.findFirst();
    companyId = firstCompany?.id || null;
  }

  if (!companyId) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-amber-800">
        Nenhuma empresa vinculada ao seu usuário. Contate o administrador.
      </div>
    );
  }

  // Busca dados da empresa (Plano e Sites)
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      plan: true,
      sites: true,
    },
  });

  if (!company) {
    return <div>Empresa não encontrada.</div>;
  }

  // Contadores de solicitações (ESTRITAMENTE filtrados por companyId)
  const [totalOpen, totalInProgress, totalInReview, totalCompleted, recentTickets] =
    await Promise.all([
      prisma.ticket.count({
        where: {
          companyId,
          status: { in: ["NOVO", "EM_ANALISE"] },
        },
      }),
      prisma.ticket.count({
        where: {
          companyId,
          status: { in: ["EM_EXECUCAO", "AGUARDANDO_CLIENTE"] },
        },
      }),
      prisma.ticket.count({
        where: {
          companyId,
          status: "EM_REVISAO",
        },
      }),
      prisma.ticket.count({
        where: {
          companyId,
          status: "CONCLUIDO",
        },
      }),
      prisma.ticket.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          site: true,
        },
      }),
    ]);

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Assinatura Ativa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Olá, {session.name.split(" ")[0]}!
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe ou solicite novas alterações para os sites da{" "}
            <span className="font-semibold text-slate-800">{company.name}</span>.
          </p>
        </div>

        <Link
          href="/portal/solicitacoes/nova"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all hover:shadow-indigo-200 shrink-0"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          <span>Nova Solicitação</span>
        </Link>
      </div>

      {/* Grid: Métricas e Dados da Assinatura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card do Plano e Sites Contratados */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Seu Plano
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {company.plan?.name || "Plano Sob Medida"}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {company.plan?.description ||
                "Manutenção técnica preventiva e atualizações contínuas de conteúdo."}
            </p>

            <div className="border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Sites Vinculados ({company.sites.length}):
              </span>
              <ul className="space-y-2">
                {company.sites.map((site) => (
                  <li
                    key={site.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">
                        {site.name}
                      </span>
                    </div>
                    <a
                      href={site.domainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 flex items-center ml-2 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Precisa adicionar outro domínio? Fale com seu gerente.
            </span>
          </div>
        </div>

        {/* 4 Cards de Resumo de Solicitações */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Abertas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Novas
              </span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">
                {totalOpen}
              </span>
              <p className="text-xs text-slate-500 mt-1">Aguardando início</p>
            </div>
          </div>

          {/* Em Execução */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Em Andamento
              </span>
              <Layers className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">
                {totalInProgress}
              </span>
              <p className="text-xs text-slate-500 mt-1">Em produção</p>
            </div>
          </div>

          {/* Em Revisão (Aguardando Aprovação do Cliente) */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-600">
              <span className="text-xs font-semibold uppercase text-indigo-700">
                Aprovação
              </span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-indigo-900">
                {totalInReview}
              </span>
              <p className="text-xs text-indigo-600 font-medium mt-1">
                Aguardando você
              </p>
            </div>
          </div>

          {/* Concluídas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Concluídas
              </span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">
                {totalCompleted}
              </span>
              <p className="text-xs text-slate-500 mt-1">Finalizadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Solicitações Recentes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Solicitações Recentes
            </h2>
            <p className="text-xs text-slate-500">
              Últimas alterações cadastradas para seus sites
            </p>
          </div>
          <Link
            href="/portal/solicitacoes"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              Nenhuma solicitação aberta ainda.
            </p>
            <Link
              href="/portal/solicitacoes/nova"
              className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline"
            >
              Criar sua primeira solicitação agora &rarr;
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/solicitacoes/${ticket.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400">
                      #{ticket.ticketNumber}
                    </span>
                    <span className="font-semibold text-sm text-slate-900 hover:text-indigo-600">
                      {ticket.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span>{ticket.site.name}</span>
                    <span>•</span>
                    <span>Tipo: {ticket.changeType}</span>
                    <span>•</span>
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:self-center">
                  <StatusBadge status={ticket.status} />
                  <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    NOVO: { label: "Novo", color: "bg-amber-50 text-amber-700 border-amber-200" },
    EM_ANALISE: {
      label: "Em Análise",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    AGUARDANDO_CLIENTE: {
      label: "Aguardando Resposta",
      color: "bg-rose-50 text-rose-700 border-rose-200",
    },
    EM_EXECUCAO: {
      label: "Em Execução",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    EM_REVISAO: {
      label: "Em Revisão (Aprovar)",
      color: "bg-purple-50 text-purple-700 border-purple-200 font-bold",
    },
    CONCLUIDO: {
      label: "Concluído",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    CANCELADO: {
      label: "Cancelado",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const current = map[status] || {
    label: status,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${current.color}`}
    >
      {current.label}
    </span>
  );
}

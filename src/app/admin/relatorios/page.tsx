import { prisma } from "@/lib/prisma";
import {
  BarChart3,
  PieChart,
  Clock,
  CheckCircle2,
  TrendingUp,
  Building2,
  Calendar,
} from "lucide-react";

export default async function AdminReportsPage() {
  const [tickets, companies] = await Promise.all([
    prisma.ticket.findMany({
      include: {
        company: true,
      },
    }),
    prisma.company.findMany({
      include: {
        tickets: true,
      },
    }),
  ]);

  // 1. Distribuição por Tipo
  const typeCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    typeCounts[t.changeType] = (typeCounts[t.changeType] || 0) + 1;
  });

  // 2. Tempo Médio de Resolução (SLA) para chamados concluídos
  const completedTickets = tickets.filter(
    (t) => t.status === "CONCLUIDO" && t.completedAt
  );

  let totalResolutionHours = 0;
  completedTickets.forEach((t) => {
    const diffMs =
      new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime();
    totalResolutionHours += diffMs / (1000 * 3600);
  });

  const avgResolutionHours =
    completedTickets.length > 0
      ? (totalResolutionHours / completedTickets.length).toFixed(1)
      : "0";

  // 3. Demanda por Cliente
  const companyMetrics = companies.map((c) => ({
    name: c.name,
    total: c.tickets.length,
    completed: c.tickets.filter((t) => t.status === "CONCLUIDO").length,
    active: c.tickets.filter(
      (t) => t.status !== "CONCLUIDO" && t.status !== "CANCELADO"
    ).length,
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Relatórios & Métricas Operacionais
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Acompanhamento de volume de demandas, distribuição de chamados e SLA de
          entrega
        </p>
      </div>

      {/* Cards de Métricas Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 block">
              Total de Solicitações
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              {tickets.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 block">
              Taxa de Conclusão
            </span>
            <span className="text-2xl font-extrabold text-emerald-600">
              {tickets.length > 0
                ? ((completedTickets.length / tickets.length) * 100).toFixed(0)
                : 0}
              %
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 block">
              Tempo Médio (SLA)
            </span>
            <span className="text-2xl font-extrabold text-purple-700">
              {avgResolutionHours}{" "}
              <span className="text-sm font-normal text-slate-500">horas</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Tipo de Alteração */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <PieChart className="w-4 h-4 mr-1.5 text-indigo-600" />
            <span>Demandas por Tipo de Alteração</span>
          </h2>

          <div className="space-y-3 pt-2">
            {Object.entries(typeCounts).map(([type, count]) => {
              const pct = ((count / tickets.length) * 100).toFixed(0);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700 font-medium">
                    <span>{type}</span>
                    <span>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Volume por Empresa Cliente */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <Building2 className="w-4 h-4 mr-1.5 text-indigo-600" />
            <span>Consumo de Suporte por Empresa</span>
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            {companyMetrics.map((comp) => (
              <div
                key={comp.name}
                className="py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">{comp.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {comp.active} chamados em andamento
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 text-sm">
                    {comp.total}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    chamados abertos
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

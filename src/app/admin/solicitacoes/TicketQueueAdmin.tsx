"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { adminUpdateTicketAction } from "@/app/actions/ticket";
import { useRouter } from "next/navigation";
import {
  Table,
  Kanban,
  Search,
  Filter,
  Building2,
  Clock,
  User,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  Lock,
} from "lucide-react";

interface TicketItem {
  id: string;
  ticketNumber: number;
  title: string;
  changeType: string;
  urgency: string;
  status: string;
  deadline: string | null;
  createdAt: string;
  company: { id: string; name: string };
  site: { name: string };
  assignedTo: { id: string; name: string } | null;
  comments: { id: string; isInternal: boolean }[];
}

export default function TicketQueueAdmin({
  initialTickets,
  companies,
  teamMembers,
}: {
  initialTickets: TicketItem[];
  companies: { id: string; name: string }[];
  teamMembers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterUrgency, setFilterUrgency] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const filteredTickets = useMemo(() => {
    return initialTickets.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        t.title.toLowerCase().includes(q) ||
        t.ticketNumber.toString().includes(q) ||
        t.company.name.toLowerCase().includes(q) ||
        t.site.name.toLowerCase().includes(q);

      const matchComp =
        filterCompany === "ALL" ? true : t.company.id === filterCompany;

      const matchStat =
        filterStatus === "ALL" ? true : t.status === filterStatus;

      const matchUrg =
        filterUrgency === "ALL" ? true : t.urgency === filterUrgency;

      const matchAss =
        filterAssignee === "ALL"
          ? true
          : filterAssignee === "UNASSIGNED"
          ? !t.assignedTo
          : t.assignedTo?.id === filterAssignee;

      return matchSearch && matchComp && matchStat && matchUrg && matchAss;
    });
  }, [
    initialTickets,
    search,
    filterCompany,
    filterStatus,
    filterUrgency,
    filterAssignee,
  ]);

  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  const handleQuickStatusChange = (ticketId: string, newStatus: string) => {
    startTransition(async () => {
      await adminUpdateTicketAction(ticketId, { status: newStatus });
      router.refresh();
    });
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData("text/plain", ticketId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const ticketId = e.dataTransfer.getData("text/plain");
    if (ticketId) {
      handleQuickStatusChange(ticketId, targetStatus);
    }
  };

  const kanbanColumns = [
    { id: "NOVO", label: "Novo", color: "border-amber-400 bg-amber-50/30" },
    { id: "EM_ANALISE", label: "Em Análise", color: "border-blue-400 bg-blue-50/30" },
    {
      id: "AGUARDANDO_CLIENTE",
      label: "Aguardando Cliente",
      color: "border-rose-400 bg-rose-50/30",
    },
    {
      id: "EM_EXECUCAO",
      label: "Em Execução",
      color: "border-indigo-400 bg-indigo-50/30",
    },
    {
      id: "EM_REVISAO",
      label: "Em Revisão",
      color: "border-purple-400 bg-purple-50/30",
    },
    {
      id: "CONCLUIDO",
      label: "Concluído",
      color: "border-emerald-400 bg-emerald-50/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Alternador de Visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Fila de Atendimento
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerenciamento integrado de todas as solicitações recebidas
          </p>
        </div>

        {/* Botões Tabela vs Kanban */}
        <div className="inline-flex rounded-xl bg-slate-200 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "kanban"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Quadro Kanban</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "table"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabela / Lista</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Busca */}
          <div className="relative lg:col-span-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por chamado, título ou cliente..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Filtro Empresa */}
          <div>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 bg-white"
            >
              <option value="ALL">Todas as Empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Urgência */}
          <div>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 bg-white"
            >
              <option value="ALL">Todas as Urgências</option>
              <option value="ALTA">Urgência Alta</option>
              <option value="NORMAL">Urgência Normal</option>
              <option value="BAIXA">Urgência Baixa</option>
            </select>
          </div>

          {/* Filtro Responsável */}
          <div>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 bg-white"
            >
              <option value="ALL">Todos os Responsáveis</option>
              <option value="UNASSIGNED">Sem Responsável</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visualização KANBAN */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-6">
          {kanbanColumns.map((col) => {
            const columnTickets = filteredTickets.filter(
              (t) => t.status === col.id
            );

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDragEnter={() => setDraggedOverCol(col.id)}
                onDragLeave={() => setDraggedOverCol(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-2xl border p-3 flex flex-col min-h-[520px] transition-all ${
                  draggedOverCol === col.id
                    ? "bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/50"
                    : "bg-slate-50/80 border-slate-200"
                }`}
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">
                    {col.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Cards da Coluna */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTickets.length === 0 ? (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400">
                      Arraste um card aqui
                    </div>
                  ) : (
                    columnTickets.map((ticket) => {
                      const internalNotesCount = ticket.comments.filter(
                        (c) => c.isInternal
                      ).length;

                      return (
                        <div
                          key={ticket.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ticket.id)}
                          className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2.5 cursor-grab active:cursor-grabbing hover:border-indigo-400"
                        >
                          {/* Top: Número e Empresa */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400">
                              #{ticket.ticketNumber}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 truncate max-w-[130px]">
                              {ticket.company.name}
                            </span>
                          </div>

                          {/* Título com Link */}
                          <Link
                            href={`/admin/solicitacoes/${ticket.id}`}
                            className="block font-semibold text-xs text-slate-900 hover:text-indigo-600 leading-snug"
                          >
                            {ticket.title}
                          </Link>

                          {/* Metadados: Urgência, Notas Internas, Responsável */}
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-1 border-t border-slate-100">
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                                ticket.urgency === "ALTA"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {ticket.urgency}
                            </span>

                            {internalNotesCount > 0 && (
                              <span
                                title="Possui notas internas da agência"
                                className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200"
                              >
                                <Lock className="w-2.5 h-2.5 mr-0.5" />
                                {internalNotesCount}
                              </span>
                            )}

                            <span className="text-slate-500 truncate max-w-[80px]">
                              {ticket.assignedTo
                                ? ticket.assignedTo.name.split(" ")[0]
                                : "Sem resp."}
                            </span>
                          </div>

                          {/* Seletor Rápido de Status */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <select
                              value={ticket.status}
                              disabled={isPending}
                              onChange={(e) =>
                                handleQuickStatusChange(
                                  ticket.id,
                                  e.target.value
                                )
                              }
                              className="text-[10px] py-1 px-1.5 rounded border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
                            >
                              <option value="NOVO">Mover: Novo</option>
                              <option value="EM_ANALISE">Em Análise</option>
                              <option value="AGUARDANDO_CLIENTE">
                                Aguardando Cliente
                              </option>
                              <option value="EM_EXECUCAO">Em Execução</option>
                              <option value="EM_REVISAO">Em Revisão</option>
                              <option value="CONCLUIDO">Concluído</option>
                            </select>

                            <Link
                              href={`/admin/solicitacoes/${ticket.id}`}
                              className="text-slate-400 hover:text-indigo-600 p-1"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Visualização TABELA / LISTA */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 text-left">Chamado</th>
                <th className="px-4 py-3 text-left">Cliente / Site</th>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Urgência</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-400">
                    #{t.ticketNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800 block">
                      {t.company.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t.site.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/solicitacoes/${t.id}`}
                      className="font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.changeType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.urgency === "ALTA"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.assignedTo ? t.assignedTo.name : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/solicitacoes/${t.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Abrir &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

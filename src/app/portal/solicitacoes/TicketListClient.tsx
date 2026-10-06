"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  MessageSquare,
  Clock,
  ArrowRight,
  Globe,
  Sparkles,
} from "lucide-react";

interface TicketItem {
  id: string;
  ticketNumber: number;
  title: string;
  changeType: string;
  urgency: string;
  status: string;
  createdAt: string;
  site: {
    name: string;
    domainUrl: string;
  };
  comments: { id: string }[];
}

export default function TicketListClient({
  initialTickets,
}: {
  initialTickets: TicketItem[];
}) {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  const filteredTickets = useMemo(() => {
    return initialTickets.filter((ticket) => {
      // Filtro de Busca
      const q = search.toLowerCase();
      const matchSearch =
        ticket.title.toLowerCase().includes(q) ||
        ticket.ticketNumber.toString().includes(q) ||
        ticket.site.name.toLowerCase().includes(q);

      // Filtro de Status
      const matchStatus =
        selectedStatus === "ALL"
          ? true
          : selectedStatus === "OPEN"
          ? ["NOVO", "EM_ANALISE", "EM_EXECUCAO", "AGUARDANDO_CLIENTE"].includes(
              ticket.status
            )
          : selectedStatus === "REVIEW"
          ? ticket.status === "EM_REVISAO"
          : selectedStatus === "DONE"
          ? ticket.status === "CONCLUIDO"
          : ticket.status === selectedStatus;

      // Filtro de Tipo
      const matchType =
        selectedType === "ALL" ? true : ticket.changeType === selectedType;

      return matchSearch && matchStatus && matchType;
    });
  }, [initialTickets, search, selectedStatus, selectedType]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center gap-3 justify-between">
        {/* Input de Busca */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, número #1001 ou site..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
          {[
            { id: "ALL", label: "Todas" },
            { id: "OPEN", label: "Em Aberto" },
            { id: "REVIEW", label: "Aguardando Aprovação" },
            { id: "DONE", label: "Concluídas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedStatus === tab.id
                  ? "bg-indigo-600 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdown de Tipo */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:border-indigo-600 focus:outline-none"
        >
          <option value="ALL">Todos os Tipos</option>
          <option value="TEXTO">Texto</option>
          <option value="IMAGEM">Imagem</option>
          <option value="LAYOUT">Layout</option>
          <option value="NOVA_SECAO">Nova Seção</option>
          <option value="CORRECAO_ERRO">Correção de Erro</option>
          <option value="SEO">SEO</option>
          <option value="OUTRO">Outro</option>
        </select>
      </div>

      {/* Lista de Chamados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Nenhuma solicitação encontrada com os filtros selecionados.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tente alterar os termos de busca ou o filtro de status.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/solicitacoes/${ticket.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition-colors gap-3"
              >
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400">
                      #{ticket.ticketNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                      {ticket.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Globe className="w-3 h-3 mr-1 text-slate-400" />
                      {ticket.site.name}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                      {ticket.changeType}
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-slate-400" />
                      {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    {ticket.comments.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center text-indigo-600 font-medium">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {ticket.comments.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                  <StatusBadge status={ticket.status} />
                  <ArrowRight className="w-4 h-4 text-slate-300" />
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
      color: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
    },
    EM_EXECUCAO: {
      label: "Em Execução",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    EM_REVISAO: {
      label: "Em Revisão (Aprovar)",
      color: "bg-purple-100 text-purple-800 border-purple-300 font-bold animate-pulse",
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

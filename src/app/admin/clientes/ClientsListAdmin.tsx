"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createCompanyAction,
  updateCompanyAction,
  deleteCompanyAction,
} from "@/app/actions/admin";
import { updateOnboardingStageAction } from "@/app/actions/briefing";
import { useRouter } from "next/navigation";
import {
  Building2,
  PlusCircle,
  Globe,
  Users,
  Ticket,
  ArrowRight,
  ExternalLink,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  LayoutGrid,
  Kanban,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface CompanyItem {
  id: string;
  name: string;
  document: string | null;
  status: string;
  notes?: string | null;
  planId?: string | null;
  onboardingStage?: string | null;
  plan: { id: string; name: string; price?: number; maxSites?: number } | null;
  contractStartDate?: string | Date | null;
  billingDay?: number | null;
  customPrice?: number | null;
  paymentMethod?: string | null;
  financialStatus?: string | null;
  sites: { id: string; name: string; domainUrl: string }[];
  users: { id: string; name: string; email: string; isActive?: boolean }[];
  tickets: { id: string; status: string }[];
}

const ONBOARDING_STAGES = [
  {
    id: "BRIEFING_PENDENTE",
    label: "Briefing Pendente",
    headerBg: "bg-amber-500",
    description: "Aguardando envio do briefing pelo cliente",
  },
  {
    id: "BRIEFING_EM_ANALISE",
    label: "Briefing em Análise",
    headerBg: "bg-purple-500",
    description: "Briefing submetido para avaliação da equipe",
  },
  {
    id: "EM_DESENVOLVIMENTO",
    label: "Em Criação / Design",
    headerBg: "bg-sky-500",
    description: "Equipe trabalhando no desenvolvimento do site",
  },
  {
    id: "EM_HOMOLOGACAO",
    label: "Em Homologação",
    headerBg: "bg-teal-500",
    description: "Site em link temporário para testes do cliente",
  },
  {
    id: "ATIVO_MANUTENCAO",
    label: "No Ar / Ativo",
    headerBg: "bg-emerald-500",
    description: "Site publicado e sob manutenção mensal",
  },
];

export default function ClientsListAdmin({
  companies,
  plans,
}: {
  companies: CompanyItem[];
  plans: { id: string; name: string; maxSites: number; price?: number }[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "kanban">("cards");
  const [optimisticStages, setOptimisticStages] = useState<Record<string, string>>({});
  const [draggedCompanyId, setDraggedCompanyId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getCompanyStage = (c: CompanyItem) =>
    optimisticStages[c.id] || c.onboardingStage || "ATIVO_MANUTENCAO";

  const handleMoveStage = (companyId: string, targetStage: string) => {
    setOptimisticStages((prev) => ({ ...prev, [companyId]: targetStage }));

    startTransition(async () => {
      const res = await updateOnboardingStageAction(companyId, targetStage);
      if (res?.error) {
        alert(res.error);
        router.refresh();
      } else {
        showToast("Etapa atualizada com sucesso!");
        router.refresh();
      }
    });
  };

  const handleDragStart = (e: React.DragEvent, companyId: string) => {
    e.dataTransfer.setData("text/plain", companyId);
    setDraggedCompanyId(companyId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const companyId = e.dataTransfer.getData("text/plain") || draggedCompanyId;
    if (!companyId) return;

    handleMoveStage(companyId, targetStage);
    setDraggedCompanyId(null);
  };

  // Form State - Criar
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id || "");
  const [createOnboardingStage, setCreateOnboardingStage] = useState("BRIEFING_PENDENTE");
  const [siteName, setSiteName] = useState("Site Principal");
  const [domainUrl, setDomainUrl] = useState("");
  const [notes, setNotes] = useState("");
  // Campos Financeiros & Onboarding
  const [customPrice, setCustomPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CARTAO");

  // State - Editar
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDocument, setEditDocument] = useState("");
  const [editPlanId, setEditPlanId] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editOnboardingStage, setEditOnboardingStage] = useState("ATIVO_MANUTENCAO");
  const [editNotes, setEditNotes] = useState("");
  const [editContractStartDate, setEditContractStartDate] = useState("");
  const [editBillingDay, setEditBillingDay] = useState("10");
  const [editCustomPrice, setEditCustomPrice] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("PIX");
  const [editFinancialStatus, setEditFinancialStatus] = useState("EM_DIA");
  const [editError, setEditError] = useState<string | null>(null);

  // State - Excluir
  const [deletingCompany, setDeletingCompany] = useState<CompanyItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("document", document);
    formData.append("planId", planId);
    formData.append("onboardingStage", createOnboardingStage);
    formData.append("siteName", siteName);
    formData.append("domainUrl", domainUrl);
    formData.append("notes", notes);
    formData.append("contractStartDate", "");
    formData.append("billingDay", "");
    formData.append("customPrice", customPrice);
    formData.append("paymentMethod", paymentMethod);
    formData.append(
      "financialStatus",
      createOnboardingStage === "ATIVO_MANUTENCAO" ? "EM_DIA" : "PENDENTE"
    );

    startTransition(async () => {
      const res = await createCompanyAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setShowModal(false);
        setName("");
        setDocument("");
        setDomainUrl("");
        setNotes("");
        setCustomPrice("");
        router.refresh();
      }
    });
  };

  const handleOpenEdit = (c: CompanyItem) => {
    setEditingCompany(c);
    setEditName(c.name);
    setEditDocument(c.document || "");
    setEditPlanId(c.plan?.id || plans[0]?.id || "");
    setEditStatus(c.status || "ACTIVE");
    setEditOnboardingStage(c.onboardingStage || "ATIVO_MANUTENCAO");
    setEditNotes(c.notes || "");
    setEditContractStartDate(
      c.contractStartDate
        ? new Date(c.contractStartDate).toISOString().split("T")[0]
        : ""
    );
    setEditBillingDay(c.billingDay ? c.billingDay.toString() : "10");
    setEditCustomPrice(
      c.customPrice ? c.customPrice.toFixed(2).replace(".", ",") : ""
    );
    setEditPaymentMethod(c.paymentMethod || "PIX");
    setEditFinancialStatus(c.financialStatus || "EM_DIA");
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    setEditError(null);

    const formData = new FormData();
    formData.append("companyId", editingCompany.id);
    formData.append("name", editName);
    formData.append("document", editDocument);
    formData.append("planId", editPlanId);
    formData.append("status", editStatus);
    formData.append("onboardingStage", editOnboardingStage);
    formData.append("notes", editNotes);
    formData.append("contractStartDate", editContractStartDate);
    formData.append("billingDay", editBillingDay);
    formData.append("customPrice", editCustomPrice);
    formData.append("paymentMethod", editPaymentMethod);
    formData.append("financialStatus", editFinancialStatus);

    startTransition(async () => {
      const res = await updateCompanyAction(formData);
      if (res?.error) {
        setEditError(res.error);
      } else {
        setEditingCompany(null);
        router.refresh();
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingCompany) return;
    setDeleteError(null);

    startTransition(async () => {
      const res = await deleteCompanyAction(deletingCompany.id);
      if (res?.error) {
        setDeleteError(res.error);
      } else {
        setDeletingCompany(null);
        router.refresh();
      }
    });
  };

  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return null;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const getFinancialBadge = (status?: string | null) => {
    switch (status) {
      case "EM_DIA":
        return (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
            Em dia
          </span>
        );
      case "PENDENTE":
        return (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
            Pagto Pendente
          </span>
        );
      case "ATRASADO":
        return (
          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md">
            Em Atraso
          </span>
        );
      case "ISENTO":
        return (
          <span className="text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
            Isento
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
            Ativo
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
            Suspenso
          </span>
        );
      case "CANCELLED":
        return (
          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-md">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
            {status}
          </span>
        );
    }
  };

  const getOnboardingBadge = (stage?: string | null) => {
    switch (stage) {
      case "BRIEFING_PENDENTE":
        return (
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
            Briefing Pendente
          </span>
        );
      case "BRIEFING_EM_ANALISE":
        return (
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" />
            Briefing em Análise
          </span>
        );
      case "EM_DESENVOLVIMENTO":
        return (
          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-md flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5" />
            Em Criação
          </span>
        );
      case "EM_HOMOLOGACAO":
        return (
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5" />
            Em Homologação
          </span>
        );
      case "ATIVO_MANUTENCAO":
      default:
        return (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            No Ar / Ativo
          </span>
        );
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (stageFilter === "ALL") return true;
    return getCompanyStage(c) === stageFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Gestão de Empresas Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cadastre, edite ou gerencie o status, dados contratuais e acesso dos clientes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Alternador de Modo de Visualização */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Quadro Kanban</span>
            </button>
          </div>

          <Link
            href="/admin/planos"
            className="inline-flex items-center px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-colors"
          >
            <Package className="w-4 h-4 mr-1.5 text-indigo-600" />
            <span>Gerenciar Planos</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>+ Cadastrar Empresa</span>
          </button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-6 items-start scrollbar-thin">
          {ONBOARDING_STAGES.map((col, colIdx) => {
            const colCompanies = companies.filter(
              (c) => getCompanyStage(c) === col.id
            );
            const isDragTarget = dragOverStage === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-80 shrink-0 flex flex-col rounded-2xl border transition-all ${
                  isDragTarget
                    ? "border-indigo-500 bg-indigo-50/40 shadow-md ring-2 ring-indigo-400/40"
                    : "border-slate-200/90 bg-slate-100/70"
                }`}
              >
                {/* Cabeçalho da Coluna */}
                <div className="p-3.5 border-b border-slate-200/70 bg-white/80 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.headerBg}`} />
                      <h3 className="text-xs font-bold text-slate-900">
                        {col.label}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {colCompanies.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {col.description}
                  </p>
                </div>

                {/* Lista de Cards da Coluna */}
                <div className="p-3 space-y-3 min-h-[460px]">
                  {colCompanies.length === 0 ? (
                    <div className="h-40 border-2 border-dashed border-slate-200/80 rounded-xl flex items-center justify-center p-4 text-center">
                      <p className="text-[11px] text-slate-400 font-medium">
                        Arraste uma empresa para cá
                      </p>
                    </div>
                  ) : (
                    colCompanies.map((c) => {
                      const openTicketsCount = c.tickets.filter(
                        (t) => t.status !== "CONCLUIDO" && t.status !== "CANCELADO"
                      ).length;
                      const primaryDomain = c.sites[0]?.domainUrl;
                      const displayPrice =
                        c.customPrice !== null && c.customPrice !== undefined
                          ? formatCurrency(c.customPrice)
                          : c.plan?.price !== undefined
                          ? formatCurrency(c.plan.price)
                          : null;

                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, c.id)}
                          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-2.5 cursor-grab active:cursor-grabbing select-none"
                        >
                          {/* Badges superiores */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100/80 truncate max-w-[130px]">
                              {c.plan?.name || "Sem Plano"}
                            </span>
                            <div className="flex items-center space-x-1 shrink-0">
                              {getFinancialBadge(c.financialStatus)}
                            </div>
                          </div>

                          {/* Título & Domínio */}
                          <div>
                            <Link
                              href={`/admin/clientes/${c.id}`}
                              className="font-bold text-slate-900 text-xs hover:text-indigo-600 transition-colors line-clamp-1 block"
                            >
                              {c.name}
                            </Link>
                            {primaryDomain ? (
                              <p className="text-[10px] text-slate-400 flex items-center mt-0.5 truncate">
                                <Globe className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                <span className="truncate">{primaryDomain}</span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 flex items-center mt-0.5">
                                <Globe className="w-3 h-3 mr-1 text-slate-300 shrink-0" />
                                <span>Sem domínio vinculado</span>
                              </p>
                            )}
                          </div>

                          {/* Info bar: Mensalidade & Chamados */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                            <span className="font-semibold text-slate-700">
                              {displayPrice ? `${displayPrice}/mês` : "A combinar"}
                            </span>
                            <span className="flex items-center text-[10px] text-slate-400">
                              <Ticket className="w-3 h-3 mr-1 text-indigo-500" />
                              {openTicketsCount} aberto{openTicketsCount !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Controles de Movimentação Rápida */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            {colIdx > 0 ? (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  handleMoveStage(
                                    c.id,
                                    ONBOARDING_STAGES[colIdx - 1].id
                                  )
                                }
                                title={`Mover para ${ONBOARDING_STAGES[colIdx - 1].label}`}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center space-x-1"
                              >
                                <ChevronLeft className="w-3 h-3" />
                                <span>Voltar</span>
                              </button>
                            ) : (
                              <span />
                            )}

                            <Link
                              href={`/admin/clientes/${c.id}`}
                              className="text-[10px] font-semibold text-indigo-600 hover:underline"
                            >
                              Ver detalhes
                            </Link>

                            {colIdx < ONBOARDING_STAGES.length - 1 ? (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  handleMoveStage(
                                    c.id,
                                    ONBOARDING_STAGES[colIdx + 1].id
                                  )
                                }
                                title={`Avançar para ${ONBOARDING_STAGES[colIdx + 1].label}`}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center space-x-1 shadow-2xs"
                              >
                                <span>Avançar</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                Concluído
                              </span>
                            )}
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
        <>
          {/* Filtros por Etapa de Criação / Onboarding */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: "ALL", label: "Todas as Empresas", count: companies.length },
          {
            id: "BRIEFING_PENDENTE",
            label: "Aguardando Briefing",
            count: companies.filter(
              (c) => getCompanyStage(c) === "BRIEFING_PENDENTE"
            ).length,
          },
          {
            id: "BRIEFING_EM_ANALISE",
            label: "Briefing em Análise",
            count: companies.filter(
              (c) => getCompanyStage(c) === "BRIEFING_EM_ANALISE"
            ).length,
          },
          {
            id: "EM_DESENVOLVIMENTO",
            label: "Em Criação",
            count: companies.filter(
              (c) => getCompanyStage(c) === "EM_DESENVOLVIMENTO"
            ).length,
          },
          {
            id: "EM_HOMOLOGACAO",
            label: "Em Homologação",
            count: companies.filter(
              (c) => getCompanyStage(c) === "EM_HOMOLOGACAO"
            ).length,
          },
          {
            id: "ATIVO_MANUTENCAO",
            label: "No Ar / Ativo",
            count: companies.filter(
              (c) => getCompanyStage(c) === "ATIVO_MANUTENCAO"
            ).length,
          },
        ].map((tab) => {
          const isSelected = stageFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStageFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                isSelected
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((c) => {
          const openTicketsCount = c.tickets.filter(
            (t) => t.status !== "CONCLUIDO" && t.status !== "CANCELADO"
          ).length;

          const displayPrice = c.customPrice !== null && c.customPrice !== undefined
            ? formatCurrency(c.customPrice)
            : c.plan?.price !== undefined
            ? formatCurrency(c.plan.price)
            : null;

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {c.plan?.name || "Sem Plano"}
                    </span>
                    {getOnboardingBadge(getCompanyStage(c))}
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {getStatusBadge(c.status)}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      title="Editar Empresa"
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCompany(c)}
                      title="Excluir Empresa"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {c.name}
                </h2>
                {c.document && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    CNPJ/Doc: {c.document}
                  </p>
                )}

                {/* Bloco de Contrato & Faturamento */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">
                      {displayPrice ? `${displayPrice}/mês` : "Mensalidade a definir"}
                    </span>
                    {getFinancialBadge(c.financialStatus)}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                      Vencimento: dia <strong>{c.billingDay || 10}</strong>
                    </span>
                    {c.paymentMethod && (
                      <span className="font-semibold text-slate-600">
                        {c.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>

                {/* Métricas da Empresa */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-xs text-slate-400 block font-medium">
                      Sites
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {c.sites.length}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-xs text-slate-400 block font-medium">
                      Usuários
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {c.users.length}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-xs text-slate-400 block font-medium">
                      Abertas
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      {openTicketsCount}
                    </span>
                  </div>
                </div>

                {/* Sites List */}
                <div className="mt-3 space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Sites Monitorados:
                  </span>
                  {c.sites.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum site vinculado.</p>
                  ) : (
                    c.sites.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-xs text-slate-600"
                      >
                        <span className="truncate pr-2">{s.name}</span>
                        <a
                          href={s.domainUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="flex-1 flex items-center justify-center py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <span>Gerenciar Acessos & Chamados</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* Modal de Criação de Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Cadastrar Empresa Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome da Empresa / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Clínica Odonto Prime"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CNPJ / Documento (Opcional)
                  </label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Plano Contratado
                  </label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.price ? `(R$ ${p.price}/mês)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fluxo Inicial / Onboarding do Cliente
                </label>
                <select
                  value={createOnboardingStage}
                  onChange={(e) => setCreateOnboardingStage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="BRIEFING_PENDENTE">
                    Funil Padrão (Passo 1: Contrato ➔ 2: Pagamento ➔ 3: Briefing)
                  </option>
                  <option value="ATIVO_MANUTENCAO">
                    Direto para Manutenção Ativa (Cliente Legado / Site já publicado)
                  </option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Novos clientes iniciam no funil de 4 etapas para assinatura do contrato e pagamento inicial.
                </p>
              </div>

              {/* Seção Contratual & Financeira */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center">
                    <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Contrato & Condições de Pagamento
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Ciclo Automático
                  </span>
                </div>

                {/* Informativo dinâmico explicando a automatização */}
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200/80 text-[11px] text-sky-900 flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sky-950">Início e Vencimento Automáticos</p>
                    <p className="text-sky-700 mt-0.5 leading-relaxed">
                      O início da assinatura e o dia de vencimento mensal serão definidos automaticamente na data em que o cliente <strong>assinar o contrato digital</strong> e <strong>realizar o 1º pagamento</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Mensalidade Negociada R$ (Opcional)
                    </label>
                    <input
                      type="text"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="Padrão do plano"
                      className="w-full rounded-xl border border-slate-300 py-1.5 px-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Preencha apenas se acordou valor diferente do plano
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Forma de Cobrança Inicial
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-1.5 px-2 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white text-xs"
                    >
                      <option value="CARTAO">Cartão / Stripe (Assinatura Recorrente)</option>
                      <option value="PIX">PIX</option>
                      <option value="BOLETO">Boleto Bancário</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Site Principal */}
              <div className="border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-800 block mb-2">
                  Site Principal da Empresa
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Identificador
                    </label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="Ex: Site Institucional"
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Domínio / URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={domainUrl}
                      onChange={(e) => setDomainUrl(e.target.value)}
                      placeholder="https://exemplo.com.br"
                      className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas Internas sobre o Cliente (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações técnicas de hospedagem, contato do tomador de decisão, etc."
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Cadastrando..." : "Cadastrar Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Empresa */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <span>Editar Empresa Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome da Empresa / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CNPJ / Documento
                  </label>
                  <input
                    type="text"
                    value={editDocument}
                    onChange={(e) => setEditDocument(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Contratual
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="ACTIVE">Ativo (Acesso Liberado)</option>
                    <option value="SUSPENDED">Suspenso (Bloqueia Login)</option>
                    <option value="CANCELLED">Cancelado (Desativado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Plano Vinculado
                  </label>
                  <select
                    value={editPlanId}
                    onChange={(e) => setEditPlanId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="">Nenhum plano específico</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.price ? `(R$ ${p.price}/mês)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Etapa de Criação / Onboarding
                  </label>
                  <select
                    value={editOnboardingStage}
                    onChange={(e) => setEditOnboardingStage(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="BRIEFING_PENDENTE">1. Briefing Pendente</option>
                    <option value="BRIEFING_EM_ANALISE">2. Briefing em Análise</option>
                    <option value="EM_DESENVOLVIMENTO">3. Em Criação / Design</option>
                    <option value="EM_HOMOLOGACAO">4. Em Homologação / Revisão</option>
                    <option value="ATIVO_MANUTENCAO">5. No Ar / Manutenção Ativa</option>
                  </select>
                </div>
              </div>

              {/* Seção Contratual & Financeira no Edit */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="font-bold text-slate-800 block text-xs flex items-center">
                  <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Contrato & Condições de Pagamento
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Início da Assinatura
                    </label>
                    <input
                      type="date"
                      value={editContractStartDate}
                      onChange={(e) => setEditContractStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-1.5 px-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Dia de Vencimento
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={editBillingDay}
                      onChange={(e) => setEditBillingDay(e.target.value)}
                      placeholder="10"
                      className="w-full rounded-xl border border-slate-300 py-1.5 px-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Mensalidade Negociada R$
                    </label>
                    <input
                      type="text"
                      value={editCustomPrice}
                      onChange={(e) => setEditCustomPrice(e.target.value)}
                      placeholder="Valor personalizado"
                      className="w-full rounded-xl border border-slate-300 py-1.5 px-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Forma de Cobrança
                    </label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-1.5 px-2 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white text-xs"
                    >
                      <option value="PIX">PIX</option>
                      <option value="BOLETO">Boleto Bancário</option>
                      <option value="CARTAO">Cartão de Crédito</option>
                      <option value="TRANSFERENCIA">Transferência</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Situação Financeira
                    </label>
                    <select
                      value={editFinancialStatus}
                      onChange={(e) => setEditFinancialStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-1.5 px-2 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white text-xs"
                    >
                      <option value="EM_DIA">Em Dia</option>
                      <option value="PENDENTE">Pendente</option>
                      <option value="ATRASADO">Em Atraso</option>
                      <option value="ISENTO">Isento</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas Internas
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Informações técnicas de hospedagem, contato, etc."
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Empresa */}
      {deletingCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Excluir Empresa Cliente
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação é irreversível
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-2 border border-slate-200/70">
              <p>
                Você tem certeza que deseja excluir a empresa{" "}
                <strong className="text-slate-900 font-bold">{deletingCompany.name}</strong>?
              </p>
              <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-1">
                <li>Todos os sites ({deletingCompany.sites.length}) serão excluídos.</li>
                <li>Todos os chamados ({deletingCompany.tickets.length}) serão removidos.</li>
                <li>O acesso dos usuários vinculados será revogado.</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeletingCompany(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isPending ? "Excluindo..." : "Sim, Excluir Empresa"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

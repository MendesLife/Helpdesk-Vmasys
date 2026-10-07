"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  addCompanySiteAction,
  createInvitationAction,
  updateCompanyAction,
  deleteCompanyAction,
  toggleUserStatusAction,
  removeUserAccessAction,
  deleteInvitationAction,
  linkUserToCompanyAction,
  unlinkUserFromCompanyAction,
} from "@/app/actions/admin";
import {
  updateOnboardingStageAction,
  reviewBriefingAction,
} from "@/app/actions/briefing";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Globe,
  Users,
  PlusCircle,
  ExternalLink,
  Mail,
  Copy,
  Check,
  CheckCircle,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Clock,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  UserPlus,
  Unlink,
  AlertTriangle,
  X,
  Lock,
  Unlock,
  Calendar,
  CreditCard,
  DollarSign,
  Zap,
  FileText,
  Package,
  Palette,
  FolderArchive,
  Sparkles,
  Layers,
} from "lucide-react";

export default function CompanyDetailsAdmin({
  company,
  invitations,
  plans,
  allClientUsers = [],
}: {
  company: any;
  invitations: any[];
  plans?: { id: string; name: string; maxSites: number; price?: number }[];
  allClientUsers?: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Add Site State
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [siteMsg, setSiteMsg] = useState<string | null>(null);

  // Invite User State
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Edit Company State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(company.name);
  const [editDocument, setEditDocument] = useState(company.document || "");
  const [editPlanId, setEditPlanId] = useState(company.planId || company.plan?.id || "");
  const [editStatus, setEditStatus] = useState(company.status || "ACTIVE");
  const [editNotes, setEditNotes] = useState(company.notes || "");
  const [editContractStartDate, setEditContractStartDate] = useState(
    company.contractStartDate
      ? new Date(company.contractStartDate).toISOString().split("T")[0]
      : ""
  );
  const [editBillingDay, setEditBillingDay] = useState(
    company.billingDay ? company.billingDay.toString() : "10"
  );
  const [editCustomPrice, setEditCustomPrice] = useState(
    company.customPrice ? company.customPrice.toFixed(2).replace(".", ",") : ""
  );
  const [editPaymentMethod, setEditPaymentMethod] = useState(
    company.paymentMethod || "PIX"
  );
  const [editFinancialStatus, setEditFinancialStatus] = useState(
    company.financialStatus || "EM_DIA"
  );
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Company State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Link Existing User State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  // Onboarding Stage & Briefing Review State
  const [currentStage, setCurrentStage] = useState(
    company.onboardingStage || "ATIVO_MANUTENCAO"
  );
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [briefingCopied, setBriefingCopied] = useState(false);

  // Feedback State
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleStageChange = (newStage: string) => {
    setCurrentStage(newStage);
    startTransition(async () => {
      const res = await updateOnboardingStageAction(company.id, newStage);
      if (res?.message) {
        setActionFeedback(res.message);
        setTimeout(() => setActionFeedback(null), 3000);
        router.refresh();
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  const handleReviewBriefing = (decision: "APPROVE" | "REQUEST_REVISION") => {
    if (decision === "REQUEST_REVISION" && !revisionNotes.trim()) {
      alert("Por favor, descreva quais ajustes o cliente deve realizar no briefing.");
      return;
    }

    startTransition(async () => {
      const res = await reviewBriefingAction(
        company.id,
        decision,
        decision === "REQUEST_REVISION" ? revisionNotes : undefined
      );
      if (res?.message) {
        setActionFeedback(res.message);
        setShowRevisionModal(false);
        setRevisionNotes("");
        setTimeout(() => setActionFeedback(null), 3500);
        router.refresh();
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    setSiteMsg(null);

    const formData = new FormData();
    formData.append("companyId", company.id);
    formData.append("name", newSiteName);
    formData.append("domainUrl", newSiteUrl);

    startTransition(async () => {
      const res = await addCompanySiteAction(formData);
      if (res?.error) {
        setSiteMsg(res.error);
      } else {
        setNewSiteName("");
        setNewSiteUrl("");
        router.refresh();
      }
    });
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setGeneratedLink(null);

    const formData = new FormData();
    formData.append("companyId", company.id);
    formData.append("email", inviteEmail);
    formData.append("role", "CLIENT");

    startTransition(async () => {
      const res = await createInvitationAction(formData);
      if (res?.error) {
        setInviteError(res.error);
      } else if (res?.inviteLink) {
        setGeneratedLink(res.inviteLink);
        setInviteEmail("");
        router.refresh();
      }
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    const formData = new FormData();
    formData.append("companyId", company.id);
    formData.append("name", editName);
    formData.append("document", editDocument);
    formData.append("planId", editPlanId);
    formData.append("status", editStatus);
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
        setShowEditModal(false);
        setActionFeedback("Dados da empresa atualizados com sucesso!");
        setTimeout(() => setActionFeedback(null), 3000);
        router.refresh();
      }
    });
  };

  const handleDeleteCompany = () => {
    setDeleteError(null);

    startTransition(async () => {
      const res = await deleteCompanyAction(company.id);
      if (res?.error) {
        setDeleteError(res.error);
      } else {
        router.push("/admin/clientes");
      }
    });
  };

  const handleToggleUserStatus = (userId: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleUserStatusAction(userId);
      if (res?.message) {
        setActionFeedback(res.message);
        setTimeout(() => setActionFeedback(null), 3000);
        router.refresh();
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  const handleRemoveUserAccess = (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja remover o acesso de ${userName}? O usuário não poderá mais acessar o portal.`)) {
      return;
    }

    startTransition(async () => {
      const res = await removeUserAccessAction(userId);
      if (res?.message) {
        setActionFeedback(res.message);
        setTimeout(() => setActionFeedback(null), 3000);
        router.refresh();
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  const handleDeleteInvitation = (invitationId: string) => {
    if (!confirm("Deseja realmente cancelar este convite pendente?")) return;

    startTransition(async () => {
      const res = await deleteInvitationAction(invitationId);
      if (res?.message) {
        setActionFeedback(res.message);
        setTimeout(() => setActionFeedback(null), 3000);
        router.refresh();
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  const handleLinkUser = (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);

    const formData = new FormData();
    formData.append("companyId", company.id);
    formData.append("email", linkEmail);

    startTransition(async () => {
      const res = await linkUserToCompanyAction(formData);
      if (res?.error) {
        setLinkError(res.error);
      } else {
        setShowLinkModal(false);
        setLinkEmail("");
        if (res?.message) {
          setActionFeedback(res.message);
          setTimeout(() => setActionFeedback(null), 3500);
        }
        router.refresh();
      }
    });
  };

  const handleUnlinkUser = (userId: string, userName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja desvincular o acesso de ${userName} a esta empresa? O usuário não perderá sua conta nem o acesso a outras empresas.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await unlinkUserFromCompanyAction(company.id, userId);
      if (res?.message) {
        setActionFeedback(res.message);
        setTimeout(() => setActionFeedback(null), 3000);
        router.refresh();
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return null;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            Ativo
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            Suspenso
          </span>
        );
      case "CANCELLED":
        return (
          <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
            {status}
          </span>
        );
    }
  };

  const getFinancialBadge = (status?: string | null) => {
    switch (status) {
      case "EM_DIA":
        return (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Em Dia
          </span>
        );
      case "PENDENTE":
        return (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Pagamento Pendente
          </span>
        );
      case "ATRASADO":
        return (
          <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
            Em Atraso
          </span>
        );
      case "ISENTO":
        return (
          <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
            Isento
          </span>
        );
      default:
        return null;
    }
  };

  const currentPrice = company.customPrice !== null && company.customPrice !== undefined
    ? formatCurrency(company.customPrice)
    : company.plan?.price !== undefined
    ? formatCurrency(company.plan.price)
    : null;

  // Combina usuários diretos e vinculados via CompanyMember
  const combinedUsers = (() => {
    const list: Array<{
      id: string;
      name: string;
      email: string;
      isActive: boolean;
      isPrimary: boolean;
      isMembership: boolean;
    }> = [];

    const seenIds = new Set<string>();

    if (company.users) {
      for (const u of company.users) {
        if (!seenIds.has(u.id)) {
          seenIds.add(u.id);
          list.push({
            id: u.id,
            name: u.name,
            email: u.email,
            isActive: u.isActive !== false,
            isPrimary: u.companyId === company.id,
            isMembership: false,
          });
        }
      }
    }

    if (company.memberships) {
      for (const m of company.memberships) {
        if (m.user && !seenIds.has(m.user.id)) {
          seenIds.add(m.user.id);
          list.push({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            isActive: m.user.isActive !== false,
            isPrimary: m.user.companyId === company.id,
            isMembership: true,
          });
        }
      }
    }

    return list;
  })();

  const availableUsersToLink = (allClientUsers || []).filter(
    (u) =>
      !combinedUsers.some(
        (cu) => cu.id === u.id || cu.email.toLowerCase() === u.email.toLowerCase()
      )
  );

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Voltar e Título */}
      <div>
        <Link
          href="/admin/clientes"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para lista de empresas
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                {company.plan?.name || "Sem Plano"}
              </span>
              {getStatusBadge(company.status || "ACTIVE")}

              <div className="flex items-center space-x-1.5 pl-1.5 border-l border-slate-200">
                <span className="text-[11px] font-bold text-slate-400">Etapa:</span>
                <select
                  disabled={isPending}
                  value={currentStage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="text-xs font-bold py-1 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="BRIEFING_PENDENTE">🟡 1. Briefing Pendente</option>
                  <option value="BRIEFING_EM_ANALISE">🟣 2. Briefing em Análise</option>
                  <option value="EM_DESENVOLVIMENTO">🔵 3. Em Criação / Design</option>
                  <option value="EM_HOMOLOGACAO">🟢 4. Em Homologação</option>
                  <option value="ATIVO_MANUTENCAO">🟢 5. No Ar / Manutenção Ativa</option>
                </select>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {company.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {company.document ? `CNPJ/CPF: ${company.document} • ` : ""}
              Cadastrado em{" "}
              {new Date(company.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              <span>Editar Empresa</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
              <span>Excluir Empresa</span>
            </button>

            <div className="ml-2 pl-3 border-l border-slate-200 text-right">
              <span className="text-[11px] text-slate-400 block font-medium">
                Chamados Totais
              </span>
              <span className="text-xl font-extrabold text-slate-900">
                {company.tickets.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card de Faturamento e Condições Contratuais */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Contrato de Assinatura & Condições Financeiras
            </h2>
          </div>
          {getFinancialBadge(company.financialStatus)}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 font-medium block">
              Mensalidade Contratada
            </span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">
              {currentPrice ? `${currentPrice}` : "A definir"}
            </span>
            <span className="text-[11px] text-slate-500">
              {company.customPrice ? "Valor negociado" : "Valor padrão do plano"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 font-medium block">
              Dia de Vencimento
            </span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">
              Todo dia {company.billingDay || 10}
            </span>
            <span className="text-[11px] text-slate-500">
              Forma: {company.paymentMethod || "PIX"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 font-medium block">
              Início do Contrato
            </span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">
              {company.contractStartDate
                ? new Date(company.contractStartDate).toLocaleDateString("pt-BR")
                : "Não informado"}
            </span>
            <span className="text-[11px] text-slate-500">
              Status: {company.status === "ACTIVE" ? "Ativo" : company.status}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 font-medium block">
              Limites do Plano
            </span>
            <div className="mt-1 space-y-0.5 text-[11px] text-slate-700 font-medium">
              <p>• {company.plan?.maxSites || 1} site(s) inclusos</p>
              <p>• {company.plan?.monthlyRequestsLimit ? `${company.plan.monthlyRequestsLimit} alt./mês` : "Alt. ilimitadas"}</p>
              <p>• SLA até {company.plan?.slaHours || 48}h úteis</p>
            </div>
          </div>
        </div>

        {company.notes && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-700 block mb-1">
              Notas e Observações Internas:
            </span>
            <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 whitespace-pre-wrap">
              {company.notes}
            </p>
          </div>
        )}
      </div>

      {/* Bloco de Briefing do Projeto */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Briefing para Criação do Site
                </h2>
                {company.briefing?.status === "APPROVED" ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Aprovado ✓
                  </span>
                ) : company.briefing?.status === "SUBMITTED" ? (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                    Aguardando Avaliação da Equipe
                  </span>
                ) : company.briefing?.status === "REVISION_REQUESTED" ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Ajustes Solicitados
                  </span>
                ) : company.briefing?.status === "DRAFT" ? (
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    Rascunho Salvo pelo Cliente
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Não Iniciado pelo Cliente
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Informações fornecidas pelo cliente para desenvolvimento do projeto
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Copiar Link do Briefing */}
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/portal/briefing`;
                navigator.clipboard.writeText(url);
                setBriefingCopied(true);
                setTimeout(() => setBriefingCopied(false), 2500);
              }}
              className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              title="Copie o link para enviar diretamente ao cliente pelo WhatsApp"
            >
              {briefingCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span className="text-emerald-700">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>Copiar Link do Briefing</span>
                </>
              )}
            </button>

            {/* Ações de Avaliação */}
            {company.briefing?.status === "SUBMITTED" && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setShowRevisionModal(true)}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs font-semibold transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  <span>Solicitar Ajustes</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleReviewBriefing("APPROVE")}
                  className="inline-flex items-center px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Aprovar Briefing</span>
                </button>
              </>
            )}

            {company.briefing?.status === "APPROVED" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowRevisionModal(true)}
                className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 mr-1" />
                <span>Reabrir para Ajustes</span>
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo do Briefing */}
        {!company.briefing || (!company.briefing.businessOverview && !company.briefing.requiredPages) ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">
              O cliente ainda não enviou o briefing para este projeto.
            </p>
            <p className="text-[11px] text-slate-400">
              Você pode copiar o link acima e enviar pelo WhatsApp para o cliente preencher no portal.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grid com Respostas do Briefing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-700 flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-sky-600" />
                  Sobre a Empresa e Serviços
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed mt-1">
                  {company.briefing.businessOverview || "Não informado"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-700 flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1 text-sky-600" />
                  Público-Alvo & Perfil do Cliente
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed mt-1">
                  {company.briefing.targetAudience || "Não informado"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-700 flex items-center">
                  <Palette className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Identidade Visual & Cores
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed mt-1">
                  {company.briefing.visualStyle || "Não informado"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-700 flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Referências & Concorrentes
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed mt-1">
                  {company.briefing.competitors || "Não informado"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1 md:col-span-2">
                <span className="font-bold text-slate-700 flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  Estrutura & Páginas Necessárias
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-mono text-[11px] mt-1 bg-white p-3 rounded-lg border border-slate-200">
                  {company.briefing.requiredPages || "Não informado"}
                </p>
              </div>

              {company.briefing.features && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1 md:col-span-2">
                  <span className="font-bold text-slate-700 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Recursos & Integrações Desejadas
                  </span>
                  <p className="text-slate-800 leading-relaxed mt-1">
                    {company.briefing.features}
                  </p>
                </div>
              )}

              {company.briefing.contentDriveUrl && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1 md:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-900 flex items-center">
                      <FolderArchive className="w-3.5 h-3.5 mr-1 text-amber-600" />
                      Pasta de Logotipos, Fotos e Conteúdo
                    </span>
                    <p className="text-amber-800 text-[11px] truncate max-w-lg mt-0.5">
                      {company.briefing.contentDriveUrl}
                    </p>
                  </div>
                  <a
                    href={company.briefing.contentDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    <span>Abrir Drive</span>
                  </a>
                </div>
              )}

              {company.briefing.adminNotes && (
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs md:col-span-2 space-y-1">
                  <span className="font-bold text-slate-700 block">
                    Notas Internas / Ajustes da Equipe:
                  </span>
                  <p className="text-slate-600 whitespace-pre-wrap">
                    {company.briefing.adminNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Sites e Usuários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Sites da Empresa */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <Globe className="w-4 h-4 mr-1.5 text-indigo-600" />
              <span>Sites e Domínios Contratados ({company.sites.length})</span>
            </h2>
          </div>

          {company.sites.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Nenhum site cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {company.sites.map((site: any) => (
                <li
                  key={site.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-800">
                        {site.name}
                      </span>
                      {site.isPrimary && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-semibold">
                          Principal
                        </span>
                      )}
                    </div>
                    <a
                      href={site.domainUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-indigo-600 flex items-center mt-0.5"
                    >
                      <span>{site.domainUrl}</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Form para Adicionar Site */}
          <form
            onSubmit={handleAddSite}
            className="pt-3 border-t border-slate-100 space-y-2 text-xs"
          >
            <span className="font-bold text-slate-700 block">
              + Vincular Novo Site
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Nome (ex: Landing Page)"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                className="rounded-lg border border-slate-200 p-2 text-xs"
              />
              <input
                type="text"
                required
                placeholder="URL (ex: https://...)"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                className="rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs disabled:opacity-50"
            >
              Adicionar Domínio
            </button>
          </form>
        </div>

        {/* Bloco 2: Usuários e Gestão de Acessos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-indigo-600" />
              <span>
                Usuários com Acesso ({combinedUsers.length})
              </span>
            </h2>

            <button
              type="button"
              onClick={() => {
                setShowLinkModal(true);
                setLinkError(null);
                setLinkEmail("");
              }}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              <span>+ Vincular Usuário Existente</span>
            </button>
          </div>

          {combinedUsers.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              Nenhum usuário com acesso cadastrado nesta empresa.
            </p>
          ) : (
            <ul className="space-y-2">
              {combinedUsers.map((u: any) => {
                const isActive = u.isActive !== false;
                return (
                  <li
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        {isActive ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                            Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                            Bloqueado
                          </span>
                        )}
                        {u.isMembership && (
                          <span
                            className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded"
                            title="Usuário vinculado como sócio ou membro de múltiplas empresas"
                          >
                            Multi-empresa
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px]">{u.email}</p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleUserStatus(u.id, isActive)}
                        title={isActive ? "Bloquear acesso" : "Reativar acesso"}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center transition-colors ${
                          isActive
                            ? "text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                            : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            <span>Bloquear</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 mr-1" />
                            <span>Reativar</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleUnlinkUser(u.id, u.name)}
                        title="Desvincular desta empresa (o usuário continua em outras empresas)"
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center"
                      >
                        <Unlink className="w-3.5 h-3.5 mr-1" />
                        <span>Desvincular</span>
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleRemoveUserAccess(u.id, u.name)}
                        title="Excluir conta definitivamente do sistema"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-rose-200 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Form para Gerar Convite */}
          <form
            onSubmit={handleInviteUser}
            className="pt-3 border-t border-slate-100 space-y-2 text-xs"
          >
            <div>
              <span className="font-bold text-slate-700 block">
                + Convidar Novo Usuário para esta Empresa
              </span>
              <span className="text-[11px] text-slate-400 block">
                Para pessoas sem cadastro anterior. Se o cliente já possui conta em outra empresa, use "+ Vincular Usuário Existente" acima.
              </span>
            </div>
            <div className="flex space-x-2">
              <input
                type="email"
                required
                placeholder="E-mail do sócio ou colaborador"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 p-2 text-xs"
              />
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50 shrink-0"
              >
                {isPending ? "Gerando..." : "Gerar Convite"}
              </button>
            </div>
            {inviteError && (
              <p className="text-rose-600 text-[11px]">{inviteError}</p>
            )}
          </form>

          {/* Link de Convite Gerado */}
          {generatedLink && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Convite Gerado com Sucesso!</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Copie o link abaixo e envie ao cliente para que ele defina sua
                senha:
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 bg-white border border-emerald-300 rounded p-1.5 text-[11px] text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedLink)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold flex items-center shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Convites Pendentes */}
          {invitations.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <span className="font-bold text-slate-700 text-xs block mb-2">
                Convites Pendentes ({invitations.filter((i) => !i.acceptedAt).length})
              </span>
              <div className="space-y-1.5">
                {invitations
                  .filter((i) => !i.acceptedAt)
                  .map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs"
                    >
                      <div className="truncate mr-2">
                        <span className="font-medium text-slate-800">{inv.email}</span>
                        <span className="text-[10px] text-amber-700 block">
                          Expira em {new Date(inv.expiresAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeleteInvitation(inv.id)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline shrink-0"
                      >
                        Cancelar
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico Completo de Solicitações Desta Empresa */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <Ticket className="w-4 h-4 mr-1.5 text-indigo-600" />
            <span>Histórico de Chamados desta Empresa ({company.tickets.length})</span>
          </h2>
        </div>

        {company.tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Esta empresa ainda não abriu chamados.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {company.tickets.map((t: any) => (
              <Link
                key={t.id}
                href={`/admin/solicitacoes/${t.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-400">
                      #{t.ticketNumber}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {t.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
                    <span>{t.site.name}</span>
                    <span>•</span>
                    <span>Tipo: {t.changeType}</span>
                    <span>•</span>
                    <span>
                      {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {t.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição de Empresa */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <span>Editar Empresa Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
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

              {plans && plans.length > 0 && (
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
              )}

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
                      placeholder="Padrão do plano"
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
                  onClick={() => setShowEditModal(false)}
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
      {showDeleteModal && (
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
                Tem certeza que deseja excluir permanentemente a empresa{" "}
                <strong className="text-slate-900 font-bold">{company.name}</strong>?
              </p>
              <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-1">
                <li>Todos os sites ({company.sites.length}) serão excluídos.</li>
                <li>Todos os chamados ({company.tickets.length}) serão removidos.</li>
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
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteCompany}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isPending ? "Excluindo..." : "Sim, Excluir Empresa"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vincular Usuário Existente */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Vincular Usuário Existente
                  </h3>
                  <p className="text-xs text-slate-500">
                    Conceda acesso a um cliente já cadastrado no sistema
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ideal para clientes que possuem mais de uma empresa (holding, filiais ou sócios de múltiplos negócios). O cliente usará as mesmas credenciais e poderá alternar livremente entre as empresas no portal.
            </p>

            <form onSubmit={handleLinkUser} className="space-y-4 text-xs">
              {availableUsersToLink.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Selecionar cliente existente:
                  </label>
                  <select
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="">-- Selecione na lista ou digite abaixo --</option>
                    {availableUsersToLink.map((u) => (
                      <option key={u.id} value={u.email}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-mail do usuário cadastrado:
                </label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@cliente.com"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                />
              </div>

              {linkError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">
                  {linkError}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !linkEmail.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Vinculando..." : "Vincular à Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Solicitação de Ajustes no Briefing */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Solicitar Ajustes no Briefing</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Escreva orientações para o cliente saber o que precisa ser complementado ou ajustado no briefing:
            </p>

            <textarea
              rows={4}
              required
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Ex: Por favor, forneça as referências visuais e adicione as fotos dos tratamentos no link do Drive..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 leading-relaxed"
            />

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending || !revisionNotes.trim()}
                onClick={() => handleReviewBriefing("REQUEST_REVISION")}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
              >
                {isPending ? "Salvando..." : "Enviar Solicitação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

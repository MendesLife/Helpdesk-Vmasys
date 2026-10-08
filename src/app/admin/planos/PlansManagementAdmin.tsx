"use client";

import { useState, useTransition } from "react";
import {
  createPlanAction,
  updatePlanAction,
  deletePlanAction,
  togglePlanStatusAction,
  savePlanBriefingQuestionsAction,
  syncPlanWithStripeAction,
} from "@/app/actions/plans";
import { useRouter } from "next/navigation";
import {
  Package,
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  CheckCircle,
  X,
  Clock,
  Globe,
  FileText,
  Zap,
  Building2,
  AlertTriangle,
  Layers,
  ListChecks,
  Plus,
  Sparkles,
  HelpCircle,
  CreditCard,
} from "lucide-react";

export interface BriefingQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "boolean";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

interface PlanItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  maxSites: number;
  monthlyRequestsLimit: number | null;
  maxPages: number | null;
  slaHours: number | null;
  features: string | null;
  stripePriceId?: string | null;
  briefingQuestions?: string | null;
  isActive: boolean;
  companies: { id: string; name: string; status: string }[];
}

export default function PlansManagementAdmin({
  plans,
}: {
  plans: PlanItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modal Criar
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("299,00");
  const [maxSites, setMaxSites] = useState("1");
  const [monthlyRequestsLimit, setMonthlyRequestsLimit] = useState("4");
  const [maxPages, setMaxPages] = useState("5");
  const [slaHours, setSlaHours] = useState("48");
  const [features, setFeatures] = useState(
    "Hospedagem de alta performance inclusa\nCertificado SSL vitalício\nBackup diário automatizado\nSuporte direto via Help Desk"
  );
  const [stripePriceId, setStripePriceId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Editar
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMaxSites, setEditMaxSites] = useState("1");
  const [editMonthlyRequestsLimit, setEditMonthlyRequestsLimit] = useState("");
  const [editMaxPages, setEditMaxPages] = useState("");
  const [editSlaHours, setEditSlaHours] = useState("48");
  const [editFeatures, setEditFeatures] = useState("");
  const [editStripePriceId, setEditStripePriceId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal Excluir
  const [deletingPlan, setDeletingPlan] = useState<PlanItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Modal Perguntas de Briefing
  const [questionsModalPlan, setQuestionsModalPlan] = useState<PlanItem | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<BriefingQuestion[]>([]);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Sincronização com Stripe
  const [loadingSyncId, setLoadingSyncId] = useState<string | null>(null);

  // Feedback Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSyncStripe = (planId: string) => {
    setLoadingSyncId(planId);
    startTransition(async () => {
      const res = await syncPlanWithStripeAction(planId);
      setLoadingSyncId(null);
      if (res.success) {
        showToast(res.message || "Plano sincronizado com Stripe!");
        router.refresh();
      } else {
        alert(res.error || "Erro ao sincronizar com Stripe.");
      }
    });
  };

  const parseQuestions = (raw?: string | null): BriefingQuestion[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handleOpenQuestionsModal = (p: PlanItem) => {
    setQuestionsModalPlan(p);
    setCurrentQuestions(parseQuestions(p.briefingQuestions));
    setQuestionsError(null);
  };

  const handleAddQuestion = () => {
    const newQ: BriefingQuestion = {
      id: `q_${Date.now()}`,
      label: "",
      type: "text",
      placeholder: "",
      required: false,
      options: [],
    };
    setCurrentQuestions((prev) => [...prev, newQ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setCurrentQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (
    index: number,
    patch: Partial<BriefingQuestion>
  ) => {
    setCurrentQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...patch };
      return updated;
    });
  };

  const handleLoadTemplate = () => {
    const template: BriefingQuestion[] = [
      {
        id: `q_obj_${Date.now()}`,
        label: "Qual o objetivo principal do novo site?",
        type: "select",
        options: [
          "Geração de Leads e Contatos no WhatsApp",
          "Apresentação Institucional da Empresa",
          "Catálogo de Produtos / Serviços",
          "Autoridade e Fortalecimento de Marca",
        ],
        required: true,
      },
      {
        id: `q_dom_${Date.now()}`,
        label: "Já possui um domínio registrado? Se sim, qual?",
        type: "text",
        placeholder: "Ex: www.minhaempresa.com.br",
        required: false,
      },
      {
        id: `q_diff_${Date.now()}`,
        label: "Quais os principais diferenciais da empresa frente à concorrência?",
        type: "textarea",
        placeholder: "Ex: Atendimento 24h, equipe especializada, 15 anos no mercado...",
        required: false,
      },
      {
        id: `q_call_${Date.now()}`,
        label: "Qual a principal chamada para ação (Call to Action) desejada?",
        type: "text",
        placeholder: "Ex: Fale Conosco pelo WhatsApp, Solicite um Orçamento Online",
        required: true,
      },
      {
        id: `q_lgpd_${Date.now()}`,
        label: "Necessita de banner de cookies e termos de privacidade LGPD?",
        type: "boolean",
        required: false,
      },
    ];
    setCurrentQuestions(template);
  };

  const handleSaveQuestions = () => {
    if (!questionsModalPlan) return;
    setQuestionsError(null);

    for (let i = 0; i < currentQuestions.length; i++) {
      if (!currentQuestions[i].label.trim()) {
        setQuestionsError(`A pergunta #${i + 1} está com o enunciado vazio.`);
        return;
      }
    }

    startTransition(async () => {
      const res = await savePlanBriefingQuestionsAction(
        questionsModalPlan.id,
        JSON.stringify(currentQuestions)
      );
      if (res?.error) {
        setQuestionsError(res.error);
      } else {
        setQuestionsModalPlan(null);
        showToast("Perguntas de briefing salvas com sucesso!");
        router.refresh();
      }
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("maxSites", maxSites);
    formData.append("monthlyRequestsLimit", monthlyRequestsLimit);
    formData.append("maxPages", maxPages);
    formData.append("slaHours", slaHours);
    formData.append("features", features);
    formData.append("stripePriceId", stripePriceId);
    formData.append("isActive", isActive ? "true" : "false");

    startTransition(async () => {
      const res = await createPlanAction(formData);
      if (res?.error) {
        setCreateError(res.error);
      } else {
        setShowCreateModal(false);
        setName("");
        setDescription("");
        setPrice("299,00");
        setStripePriceId("");
        showToast("Plano criado com sucesso!");
        router.refresh();
      }
    });
  };

  const handleOpenEdit = (p: PlanItem) => {
    setEditingPlan(p);
    setEditName(p.name);
    setEditDescription(p.description || "");
    setEditPrice(p.price.toFixed(2).replace(".", ","));
    setEditMaxSites(p.maxSites.toString());
    setEditMonthlyRequestsLimit(p.monthlyRequestsLimit ? p.monthlyRequestsLimit.toString() : "");
    setEditMaxPages(p.maxPages ? p.maxPages.toString() : "");
    setEditSlaHours((p.slaHours || 48).toString());
    setEditFeatures(p.features || "");
    setEditStripePriceId(p.stripePriceId || "");
    setEditIsActive(p.isActive);
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setEditError(null);

    const formData = new FormData();
    formData.append("planId", editingPlan.id);
    formData.append("name", editName);
    formData.append("description", editDescription);
    formData.append("price", editPrice);
    formData.append("maxSites", editMaxSites);
    formData.append("monthlyRequestsLimit", editMonthlyRequestsLimit);
    formData.append("maxPages", editMaxPages);
    formData.append("slaHours", editSlaHours);
    formData.append("features", editFeatures);
    formData.append("stripePriceId", editStripePriceId);
    formData.append("isActive", editIsActive ? "true" : "false");

    startTransition(async () => {
      const res = await updatePlanAction(formData);
      if (res?.error) {
        setEditError(res.error);
      } else {
        setEditingPlan(null);
        showToast("Plano atualizado com sucesso!");
        router.refresh();
      }
    });
  };

  const handleDeletePlan = () => {
    if (!deletingPlan) return;
    setDeleteError(null);

    startTransition(async () => {
      const res = await deletePlanAction(deletingPlan.id);
      if (res?.error) {
        setDeleteError(res.error);
      } else {
        setDeletingPlan(null);
        showToast("Plano excluído com sucesso!");
        router.refresh();
      }
    });
  };

  const handleToggleStatus = (p: PlanItem) => {
    startTransition(async () => {
      const res = await togglePlanStatusAction(p.id);
      if (res?.message) {
        showToast(res.message);
        router.refresh();
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Planos de Assinatura & Preços
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Defina os planos de sites por assinatura da VMASYS, limites de alterações e SLAs
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          <span>+ Criar Novo Plano</span>
        </button>
      </div>

      {/* Grid de Planos */}
      {plans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum plano cadastrado ainda
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Crie os planos de assinatura da sua agência para vincular aos clientes e automatizar os limites.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700"
          >
            Criar Primeiro Plano
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const featureList = plan.features
              ? plan.features
                  .split("\n")
                  .map((f) => f.trim())
                  .filter(Boolean)
              : [];

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border transition-all p-6 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  plan.isActive ? "border-slate-200" : "border-slate-200 bg-slate-50/50 opacity-80"
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        plan.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {plan.isActive ? "Ativo" : "Inativo"}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(plan)}
                        title="Editar Plano"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingPlan(plan)}
                        title="Excluir Plano"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nome e Preço */}
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {plan.name}
                  </h2>
                  {plan.description && (
                    <p className="text-xs text-slate-500 mt-1">
                      {plan.description}
                    </p>
                  )}

                  <div className="mt-4 pb-4 border-b border-slate-100">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-black text-slate-900">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 ml-1.5">
                        / mês
                      </span>
                    </div>
                  </div>

                  {/* Destaques / Limites */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center text-slate-700">
                      <Globe className="w-4 h-4 text-indigo-600 mr-2 shrink-0" />
                      <span>
                        <strong>{plan.maxSites}</strong> site{plan.maxSites > 1 ? "s" : ""} incluso{plan.maxSites > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex items-center text-slate-700">
                      <Zap className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
                      <span>
                        {plan.monthlyRequestsLimit ? (
                          <>
                            Até <strong>{plan.monthlyRequestsLimit} alterações</strong> / mês
                          </>
                        ) : (
                          <strong className="text-emerald-600">Alterações Ilimitadas</strong>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center text-slate-700">
                      <FileText className="w-4 h-4 text-sky-500 mr-2 shrink-0" />
                      <span>
                        {plan.maxPages ? (
                          <>
                            Até <strong>{plan.maxPages} páginas</strong> inclusas
                          </>
                        ) : (
                          <strong className="text-emerald-600">Páginas Ilimitadas</strong>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center text-slate-700">
                      <Clock className="w-4 h-4 text-indigo-500 mr-2 shrink-0" />
                      <span>
                        SLA: até <strong>{plan.slaHours || 48}h úteis</strong>
                      </span>
                    </div>
                  </div>

                  {/* Lista de Recursos (Features) */}
                  {featureList.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Recursos inclusos:
                      </span>
                      {featureList.map((feat, idx) => (
                        <div key={idx} className="flex items-start text-[11px] text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão de Configuração de Perguntas do Briefing */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenQuestionsModal(plan)}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 border border-indigo-200/70 text-xs font-semibold flex items-center justify-between transition-colors group shadow-2xs"
                  >
                    <span className="flex items-center space-x-1.5">
                      <ListChecks className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                      <span>Perguntas do Briefing</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-indigo-900 border border-indigo-200/60 font-bold shadow-2xs">
                      {parseQuestions(plan.briefingQuestions).length > 0
                        ? `${parseQuestions(plan.briefingQuestions).length} personalizada${parseQuestions(plan.briefingQuestions).length > 1 ? "s" : ""}`
                        : "Padrão (0)"}
                    </span>
                  </button>
                </div>

                {/* Integração com Stripe */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    {plan.stripePriceId ? (
                      <span
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded truncate"
                        title={`Stripe Price ID: ${plan.stripePriceId}`}
                      >
                        Stripe Vinculado ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                        Sem ID Stripe
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isPending || loadingSyncId === plan.id}
                    onClick={() => handleSyncStripe(plan.id)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 flex items-center space-x-1 transition-colors shrink-0 disabled:opacity-50"
                    title="Cria automaticamente o produto e a mensalidade recorrente no Stripe"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>
                      {loadingSyncId === plan.id
                        ? "Sincronizando..."
                        : plan.stripePriceId
                        ? "Ressincronizar"
                        : "Vincular no Stripe"}
                    </span>
                  </button>
                </div>

                {/* Footer do Card */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      <strong>{plan.companies.length}</strong> assinante{plan.companies.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(plan)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {plan.isActive ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar Plano */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <span>Novo Plano de Assinatura</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Essencial, Profissional, VIP"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descrição Curta (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Para profissionais liberais e negócios locais"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Preço Mensal (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="299,00"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Qtd. de Sites Inclusos *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={maxSites}
                    onChange={(e) => setMaxSites(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alterações/mês
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={monthlyRequestsLimit}
                    onChange={(e) => setMonthlyRequestsLimit(e.target.value)}
                    placeholder="0 = ilimitado"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Páginas Inclusas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maxPages}
                    onChange={(e) => setMaxPages(e.target.value)}
                    placeholder="0 = ilimitado"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    SLA em Horas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={slaHours}
                    onChange={(e) => setSlaHours(e.target.value)}
                    placeholder="48"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recursos & Benefícios Inclusos (um por linha)
                </label>
                <textarea
                  rows={4}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Hospedagem inclusa&#10;SSL Grátis&#10;Backup Diário&#10;Suporte por WhatsApp"
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    ID do Preço no Stripe (Opcional)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Ex: price_1Op...</span>
                </label>
                <input
                  type="text"
                  value={stripePriceId}
                  onChange={(e) => setStripePriceId(e.target.value)}
                  placeholder="Deixe em branco para sincronizar automaticamente com 1 clique"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Se informado, vinculará o plano a um Preço existente na Stripe. Caso vazio, clique em &quot;⚡ Vincular no Stripe&quot; após criar.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveNew"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActiveNew" className="font-semibold text-slate-700">
                  Plano ativo para novas assinaturas
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Criando..." : "Cadastrar Plano"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Plano */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <span>Editar Plano de Assinatura</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
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
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descrição Curta
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Preço Mensal (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Qtd. de Sites Inclusos *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editMaxSites}
                    onChange={(e) => setEditMaxSites(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alterações/mês
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editMonthlyRequestsLimit}
                    onChange={(e) => setEditMonthlyRequestsLimit(e.target.value)}
                    placeholder="Vazio = ilimitado"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Páginas Inclusas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editMaxPages}
                    onChange={(e) => setEditMaxPages(e.target.value)}
                    placeholder="Vazio = ilimitado"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    SLA em Horas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editSlaHours}
                    onChange={(e) => setEditSlaHours(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recursos & Benefícios (um por linha)
                </label>
                <textarea
                  rows={4}
                  value={editFeatures}
                  onChange={(e) => setEditFeatures(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    ID do Preço no Stripe (Opcional)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Ex: price_1Op...</span>
                </label>
                <input
                  type="text"
                  value={editStripePriceId}
                  onChange={(e) => setEditStripePriceId(e.target.value)}
                  placeholder="price_xxxxxxxxxxxx ou deixe vazio para gerar automático"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Você também pode sincronizar ou atualizar automaticamente clicando no botão &quot;⚡ Vincular no Stripe&quot; no card deste plano.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="editIsActive" className="font-semibold text-slate-700">
                  Plano ativo para novas assinaturas
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
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

      {/* Modal Excluir Plano */}
      {deletingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Excluir Plano
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação desvinculará o plano das empresas associadas
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-2 border border-slate-200/70">
              <p>
                Tem certeza que deseja excluir o plano{" "}
                <strong className="text-slate-900 font-bold">{deletingPlan.name}</strong>?
              </p>
              {deletingPlan.companies.length > 0 && (
                <p className="text-amber-700 text-[11px] font-medium">
                  Atenção: Existem {deletingPlan.companies.length} empresas com este plano. Elas ficarão sem plano definido.
                </p>
              )}
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
                onClick={() => setDeletingPlan(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeletePlan}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isPending ? "Excluindo..." : "Sim, Excluir Plano"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurar Perguntas de Briefing */}
      {questionsModalPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <span>Perguntas de Briefing</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {questionsModalPlan.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perguntas específicas que o cliente responderá ao preencher o briefing deste plano.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuestionsModalPlan(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error */}
            {questionsError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs shrink-0 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{questionsError}</span>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <span className="text-xs text-slate-600 font-medium">
                {currentQuestions.length} pergunta{currentQuestions.length !== 1 ? "s" : ""} configurada{currentQuestions.length !== 1 ? "s" : ""}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleLoadTemplate}
                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
                  title="Carregar um conjunto de perguntas comuns recomendadas"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  <span>Carregar Sugestões</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>+ Nova Pergunta</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {currentQuestions.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">
                    Nenhuma pergunta personalizada ainda
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    Os clientes deste pacote responderão apenas às perguntas padrão da VMASYS (objetivo, referências, cores, páginas, arquivos). Clique em <strong>+ Nova Pergunta</strong> ou <strong>Carregar Sugestões</strong> para adicionar perguntas sob medida.
                  </p>
                </div>
              ) : (
                currentQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center border border-indigo-100">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          Pergunta #{idx + 1}
                        </span>
                        {q.required && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                            Obrigatória
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remover pergunta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Enunciado da Pergunta *
                      </label>
                      <input
                        type="text"
                        value={q.label}
                        onChange={(e) =>
                          handleUpdateQuestion(idx, { label: e.target.value })
                        }
                        placeholder="Ex: Qual o principal produto ou serviço que você deseja destacar?"
                        className="w-full rounded-xl border border-slate-300 p-2 text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Tipo de Resposta
                        </label>
                        <select
                          value={q.type}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, {
                              type: e.target.value as any,
                            })
                          }
                          className="w-full rounded-xl border border-slate-300 p-2 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                        >
                          <option value="text">Texto Curto</option>
                          <option value="textarea">Texto Longo (Parágrafo)</option>
                          <option value="select">Múltipla Escolha (Seleção)</option>
                          <option value="boolean">Sim / Não (Checkbox)</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2 pt-5">
                        <input
                          type="checkbox"
                          id={`req_${idx}`}
                          checked={q.required || false}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, {
                              required: e.target.checked,
                            })
                          }
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor={`req_${idx}`}
                          className="font-semibold text-slate-700 cursor-pointer"
                        >
                          Resposta obrigatória para envio
                        </label>
                      </div>
                    </div>

                    {q.type === "select" && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Opções de Escolha (separadas por vírgula)
                        </label>
                        <input
                          type="text"
                          value={q.options ? q.options.join(", ") : ""}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, {
                              options: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Opção 1, Opção 2, Opção 3"
                          className="w-full rounded-xl border border-slate-300 p-2 text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    )}

                    {q.type !== "boolean" && q.type !== "select" && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Dica / Placeholder (Opcional)
                        </label>
                        <input
                          type="text"
                          value={q.placeholder || ""}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, {
                              placeholder: e.target.value,
                            })
                          }
                          placeholder="Ex: Digite aqui um resumo de até 2 linhas..."
                          className="w-full rounded-xl border border-slate-300 p-2 text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-400">
                Alterações afetarão briefings pendentes deste plano.
              </span>

              <div className="flex space-x-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setQuestionsModalPlan(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveQuestions}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Salvando..." : "Salvar Perguntas do Plano"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


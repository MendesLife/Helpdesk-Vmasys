"use client";

import { useState, useTransition } from "react";
import {
  createPlanAction,
  updatePlanAction,
  deletePlanAction,
  togglePlanStatusAction,
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
} from "lucide-react";

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
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal Excluir
  const [deletingPlan, setDeletingPlan] = useState<PlanItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Feedback Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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

                {/* Footer do Card */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
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
    </div>
  );
}

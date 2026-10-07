"use client";

import { useState, useTransition } from "react";
import {
  createTeamMemberAction,
  updateTeamMemberAction,
  toggleUserStatusAction,
  removeUserAccessAction,
} from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  Headphones,
  PlusCircle,
  X,
  Mail,
  Lock,
  Unlock,
  User,
  Briefcase,
  Pencil,
  Trash2,
  CheckCircle,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  assignedTickets: { id: string }[];
}

export default function TeamManagementAdmin({
  teamMembers,
}: {
  teamMembers: TeamMember[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form State - Novo
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EQUIPE");

  // Edit State
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("EQUIPE");
  const [editError, setEditError] = useState<string | null>(null);

  // Feedback Toast
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);

    startTransition(async () => {
      const res = await createTeamMemberAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setShowModal(false);
        setName("");
        setEmail("");
        setPassword("");
        showToast("Novo membro cadastrado com sucesso!");
        router.refresh();
      }
    });
  };

  const handleOpenEdit = (m: TeamMember) => {
    setEditingMember(m);
    setEditName(m.name);
    setEditEmail(m.email);
    setEditRole(m.role);
    setEditPassword("");
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditError(null);

    const formData = new FormData();
    formData.append("userId", editingMember.id);
    formData.append("name", editName);
    formData.append("email", editEmail);
    formData.append("role", editRole);
    if (editPassword) formData.append("password", editPassword);

    startTransition(async () => {
      const res = await updateTeamMemberAction(formData);
      if (res?.error) {
        setEditError(res.error);
      } else {
        setEditingMember(null);
        showToast("Membro da equipe atualizado com sucesso!");
        router.refresh();
      }
    });
  };

  const handleToggleStatus = (m: TeamMember) => {
    startTransition(async () => {
      const res = await toggleUserStatusAction(m.id);
      if (res?.message) {
        showToast(res.message);
        router.refresh();
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  const handleRemoveMember = (m: TeamMember) => {
    if (!confirm(`Tem certeza que deseja remover o membro ${m.name}? O acesso será revogado.`)) {
      return;
    }

    startTransition(async () => {
      const res = await removeUserAccessAction(m.id);
      if (res?.message) {
        showToast(res.message);
        router.refresh();
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Equipe Interna da Agência
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie colaboradores, perfis de acesso e status no help desk
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          <span>+ Adicionar Membro</span>
        </button>
      </div>

      {/* Grid de Membros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => {
          const isAdmin = member.role === "ADMIN";
          const isActive = member.isActive !== false;

          return (
            <div
              key={member.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isAdmin
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}
                  >
                    {isAdmin ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        <span>Administrador Geral</span>
                      </>
                    ) : (
                      <>
                        <Headphones className="w-3.5 h-3.5 mr-1" />
                        <span>Equipe de Suporte</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {isActive ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                        Bloqueado
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(member)}
                      title="Editar dados"
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleStatus(member)}
                      title={isActive ? "Bloquear acesso" : "Reativar acesso"}
                      className={`p-1 rounded-lg transition-colors ${
                        isActive
                          ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {isActive ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleRemoveMember(member)}
                      title="Remover membro"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {member.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <span>Chamados em andamento:</span>
                </span>
                <span className="font-bold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50">
                  {member.assignedTickets.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Adicionar Membro */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Novo Membro da Equipe</span>
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
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Amanda Silva"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amanda@agencia.com"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Senha Provisória *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nível de Acesso (Perfil)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="EQUIPE">Equipe de Suporte / Técnico</option>
                  <option value="ADMIN">Administrador Geral</option>
                </select>
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
                  {isPending ? "Cadastrando..." : "Cadastrar Membro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Membro */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <span>Editar Membro da Equipe</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
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
                  Nome Completo *
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
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nova Senha (deixe em branco para não alterar)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nível de Acesso (Perfil)
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="EQUIPE">Equipe de Suporte / Técnico</option>
                  <option value="ADMIN">Administrador Geral</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
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
    </div>
  );
}

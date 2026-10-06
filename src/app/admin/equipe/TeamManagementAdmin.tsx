"use client";

import { useState, useTransition } from "react";
import { createTeamMemberAction } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  Headphones,
  PlusCircle,
  X,
  Mail,
  Lock,
  User,
  Briefcase,
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

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EQUIPE");

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
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Equipe Interna da Agência
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie colaboradores com acesso ao painel de atendimento e help
            desk
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

                  <span className="text-[11px] font-semibold text-slate-400">
                    Ativo
                  </span>
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
                  <option value="EQUIPE">
                    Equipe de Suporte (Atende chamados e notas internas)
                  </option>
                  <option value="ADMIN">
                    Administrador Geral (Acesso e controle total)
                  </option>
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
                  {isPending ? "Cadastrando..." : "Cadastrar Colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

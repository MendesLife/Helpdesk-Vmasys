"use client";

import { useState, useTransition } from "react";
import { acceptInvitationAction } from "@/app/actions/invitation";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, ArrowRight } from "lucide-react";

export default function AcceptInvitationForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("name", name);
    formData.append("password", password);

    startTransition(async () => {
      const res = await acceptInvitationAction(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success && res.redirectTo) {
        router.push(res.redirectTo);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          E-mail cadastrado
        </label>
        <div className="relative rounded-lg shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Mail className="h-4 w-4" />
          </div>
          <input
            type="email"
            disabled
            value={email}
            className="block w-full rounded-lg border border-slate-200 bg-slate-100 pl-10 pr-3 py-2 text-slate-600 text-sm cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="name"
          className="block text-xs font-medium text-slate-700 mb-1"
        >
          Seu Nome Completo
        </label>
        <div className="relative rounded-lg shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <User className="h-4 w-4" />
          </div>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: João da Silva"
            className="block w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 text-sm"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-medium text-slate-700 mb-1"
        >
          Crie sua Senha
        </label>
        <div className="relative rounded-lg shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Lock className="h-4 w-4" />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="block w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 flex items-center justify-center py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
      >
        {isPending ? (
          <span>Ativando conta...</span>
        ) : (
          <>
            <span>Ativar Conta e Acessar</span>
            <ArrowRight className="ml-2 w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

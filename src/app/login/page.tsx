"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  Headphones,
  Sparkles,
  Layers,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      const res = await loginAction(null, formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success && res.redirectTo) {
        router.push(res.redirectTo);
      }
    });
  };

  const setCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* VMASYS Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-xl shadow-sky-200 mb-3">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          VMASYS
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Portal do Cliente & Central de Atendimento
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-100 rounded-3xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
              <span className="font-semibold text-red-800">Erro:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase text-slate-700 mb-1.5"
              >
                E-mail de Acesso
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="block w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase text-slate-700"
                >
                  Senha
                </label>
                <a
                  href="/recuperar-senha"
                  className="text-xs font-medium text-sky-600 hover:text-sky-700"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition-all shadow-md shadow-sky-200 disabled:opacity-50"
            >
              {isPending ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Atalhos para Teste de Perfis e Isolamento */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Preenchimento Rápido para Testes
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setCredentials("admin@agencia.com", "Admin@123456")
                }
                className="p-2.5 text-left border rounded-xl hover:bg-sky-50 flex flex-col justify-between border-sky-200 bg-sky-50/60"
              >
                <div className="flex items-center space-x-1.5 font-bold text-sky-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Admin VMASYS</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 truncate">
                  admin@agencia.com
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setCredentials("suporte@agencia.com", "Equipe@123456")
                }
                className="p-2.5 text-left border rounded-xl hover:bg-slate-50 flex flex-col justify-between border-slate-200"
              >
                <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                  <Headphones className="w-3.5 h-3.5 text-slate-600" />
                  <span>Equipe Suporte</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 truncate">
                  suporte@agencia.com
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setCredentials("ana@acmeodonto.com.br", "Cliente@123456")
                }
                className="p-2.5 text-left border rounded-xl hover:bg-blue-50 flex flex-col justify-between border-blue-200 bg-blue-50/40"
              >
                <div className="flex items-center space-x-1.5 font-bold text-blue-900">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cliente (Acme)</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 truncate">
                  ana@acmeodonto.com.br
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setCredentials("marcos@techflow.com.br", "Cliente@123456")
                }
                className="p-2.5 text-left border rounded-xl hover:bg-teal-50 flex flex-col justify-between border-teal-200 bg-teal-50/40"
              >
                <div className="flex items-center space-x-1.5 font-bold text-teal-900">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Cliente (TechFlow)</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 truncate">
                  marcos@techflow.com.br
                </span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          VMASYS • Isolamento multi-tenant seguro por empresa.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  addCompanySiteAction,
  createInvitationAction,
} from "@/app/actions/admin";
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
} from "lucide-react";

export default function CompanyDetailsAdmin({
  company,
  invitations,
}: {
  company: any;
  invitations: any[];
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Voltar e Título */}
      <div>
        <Link
          href="/admin/clientes"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para lista de empresas
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                {company.plan?.name || "Plano Ativo"}
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Ativo
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {company.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {company.document ? `CNPJ/CPF: ${company.document} • ` : ""}
              Cliente desde{" "}
              {new Date(company.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">
              Chamados Totais
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              {company.tickets.length}
            </span>
          </div>
        </div>
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

        {/* Bloco 2: Usuários e Envio de Convites */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-indigo-600" />
              <span>
                Usuários com Acesso ({company.users.length})
              </span>
            </h2>
          </div>

          <ul className="space-y-2">
            {company.users.map((u: any) => (
              <li
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{u.name}</p>
                  <p className="text-slate-500 text-[11px]">{u.email}</p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Ativo
                </span>
              </li>
            ))}
          </ul>

          {/* Form para Gerar Convite */}
          <form
            onSubmit={handleInviteUser}
            className="pt-3 border-t border-slate-100 space-y-2 text-xs"
          >
            <span className="font-bold text-slate-700 block">
              + Convidar Novo Usuário para esta Empresa
            </span>
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
    </div>
  );
}

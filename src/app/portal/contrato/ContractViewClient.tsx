"use client";

import { useState, useTransition } from "react";
import { signContractAction } from "@/app/actions/contract";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Send,
  Lock,
  Scale,
  Building2,
  Calendar,
  Globe,
  ArrowRight,
} from "lucide-react";

interface Props {
  companyId: string;
  companyName: string;
  companyDocument?: string | null;
  planName: string;
  contract: any | null;
  termsContent: string;
  userEmail: string;
  userName: string;
}

export default function ContractViewClient({
  companyId,
  companyName,
  companyDocument,
  planName,
  contract,
  termsContent,
  userEmail,
  userName,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isSigned = contract?.status === "SIGNED";

  const [signerName, setSignerName] = useState(
    contract?.signedByName || userName || ""
  );
  const [signerDocument, setSignerDocument] = useState(companyDocument || "");
  const [termsAgreed, setTermsAgreed] = useState(isSigned);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!termsAgreed) {
      setFeedback({
        type: "error",
        message: "Você deve assinalar o campo confirmando que leu e aceita as cláusulas do contrato.",
      });
      return;
    }

    if (!signerName.trim()) {
      setFeedback({
        type: "error",
        message: "Por favor, informe seu nome completo para registro da assinatura eletrônica.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("companyId", companyId);
    formData.append("signerName", signerName);
    formData.append("signerDocument", signerDocument);
    formData.append("termsAgreed", "true");

    startTransition(async () => {
      const res = await signContractAction(formData);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else if (res?.message) {
        setFeedback({ type: "success", message: res.message });
        router.refresh();
        setTimeout(() => {
          router.push("/portal/pagamento");
        }, 1200);
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {planName}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {companyName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Contrato de Prestação de Serviços</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Instrumento legal que formaliza as condições de desenvolvimento, suporte contínuo e hospedagem do seu projeto.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-2xs transition-colors"
              title="Imprimir ou Salvar como PDF"
            >
              <Printer className="w-4 h-4 mr-1.5 text-slate-600" />
              <span>Imprimir / PDF</span>
            </button>

            {isSigned ? (
              <span className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                Assinado Eletronicamente
              </span>
            ) : (
              <span className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                <Clock className="w-4 h-4 mr-1.5 text-amber-600" />
                Pendente de Assinatura
              </span>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-4 rounded-xl text-xs font-medium border flex items-center space-x-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Certificado de Assinatura Digital (quando assinado) */}
      {isSigned && (
        <div className="bg-emerald-50/90 border border-emerald-200 p-6 rounded-2xl shadow-xs space-y-3 print:border-slate-300">
          <div className="flex items-center space-x-2.5 text-emerald-900 border-b border-emerald-200/70 pb-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Certificado de Aceite & Assinatura Eletrônica
              </h3>
              <p className="text-[11px] text-emerald-800">
                Este contrato foi formalizado com plena validade jurídica (MP nº 2.200-2/2001 e Lei nº 14.063/2020)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-500 font-semibold block">
                Signatário Responsável
              </span>
              <strong className="text-slate-900 block mt-0.5 truncate">
                {contract.signedByName}
              </strong>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-500 font-semibold block">
                E-mail Autenticado
              </span>
              <strong className="text-slate-900 block mt-0.5 truncate">
                {contract.signedByEmail}
              </strong>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-500 font-semibold block">
                Data e Horário do Aceite
              </span>
              <strong className="text-slate-900 block mt-0.5">
                {contract.signedAt
                  ? new Date(contract.signedAt).toLocaleString("pt-BR")
                  : "Registrado"}
              </strong>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-500 font-semibold block">
                Endereço IP Registrado
              </span>
              <strong className="text-slate-900 block mt-0.5 font-mono text-[11px]">
                {contract.signedByIp || "Registrado"}
              </strong>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between flex-wrap gap-2 print:hidden">
            <span className="text-xs text-emerald-800 font-medium">
              Contrato formalizado com sucesso! Siga para a próxima etapa:
            </span>
            <Link
              href="/portal/pagamento"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <span>Avançar para o Passo 2: Pagamento</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Papel do Contrato (Document Paper View) */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800">
              VMASYS • Termos de Contratação & SLA
            </span>
          </div>
          <span className="font-mono text-[11px]">
            Ref: {companyId.substring(0, 10).toUpperCase()}
          </span>
        </div>

        {/* Texto do Contrato com Tipografia Limpa */}
        <div className="text-xs sm:text-[13px] text-slate-800 whitespace-pre-wrap leading-relaxed font-sans font-normal selection:bg-indigo-100 selection:text-indigo-900 p-2 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-100/80">
          {termsContent}
        </div>
      </div>

      {/* Formulário de Assinatura Eletrônica (apenas se pendente) */}
      {!isSigned && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4 print:hidden">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Assinar Contrato Eletronicamente
              </h2>
              <p className="text-[11px] text-slate-500">
                Ao clicar em assinar, seu endereço IP e credenciais de acesso serão atrelados a este documento com validade legal.
              </p>
            </div>
          </div>

          <form onSubmit={handleSign} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nome Completo do Responsável Legal *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  CPF ou CNPJ do Representante / Empresa
                </label>
                <input
                  type="text"
                  value={signerDocument}
                  onChange={(e) => setSignerDocument(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                />
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="agreeContract"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <label
                htmlFor="agreeContract"
                className="text-slate-800 font-semibold cursor-pointer leading-snug"
              >
                Declaro que li, compreendi e concordo integralmente com todas as cláusulas e condições estipuladas no presente Contrato de Prestação de Serviços VMASYS.
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Assinatura realizada como: <strong>{userEmail}</strong>
              </span>

              <button
                type="submit"
                disabled={isPending || !termsAgreed}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isPending ? "Processando Assinatura..." : "Confirmar & Assinar Contrato"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Building2,
  Clock,
  Sparkles,
} from "lucide-react";
import OnboardingGateStepper from "@/components/OnboardingGateStepper";
import { GateStatus } from "@/lib/onboarding-gate";
import { createStripeCheckoutAction } from "@/app/actions/billing";

interface Props {
  company: any;
  invoice: any | null;
  gate: GateStatus;
}

export default function PaymentGateClient({ company, invoice, gate }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copiedPix, setCopiedPix] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amount =
    invoice?.amount !== undefined && invoice?.amount !== null
      ? invoice.amount
      : company.customPrice !== undefined && company.customPrice !== null
      ? company.customPrice
      : company.plan?.price !== undefined && company.plan?.price !== null
      ? company.plan.price
      : 0;
  const pixKey = "financeiro@vmasys.com.br"; // Chave PIX padrão da agência

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handlePayWithStripe = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await createStripeCheckoutAction(company.id, invoice?.id);
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        setErrorMessage(
          res.error ||
            "Não foi possível conectar ao checkout online. Você pode pagar via PIX ou falar com o suporte."
        );
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Stepper no Topo */}
      <OnboardingGateStepper gate={gate} companyName={company.name} />

      {/* Se o pagamento já foi confirmado ou é plano gratuito */}
      {gate.isPaymentSettled ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h1 className="text-2xl font-black text-slate-900">
              {amount === 0 ? "Plano Gratuito Ativado!" : "Pagamento Confirmado com Sucesso!"}
            </h1>
            <p className="text-sm text-slate-600">
              {amount === 0
                ? "Sua assinatura é gratuita (R$ 0,00) e não requer cobrança. O próximo passo é o envio do briefing para começarmos a criar o seu site."
                : "Sua 1ª mensalidade foi liquidada e a etapa de contratação está concluída. O próximo passo é o envio do briefing para começarmos a criar o seu site."}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/portal/briefing"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
            >
              <span>Avançar para o Passo 3: Briefing do Site</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      ) : (
        /* Se o pagamento estiver pendente */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header de Pagamento */}
            <div className="p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  Passo 2 de 3: Ativação da Mensalidade
                </span>
                <h1 className="text-xl font-black">
                  Pagamento da 1ª Mensalidade
                </h1>
                <p className="text-xs text-slate-300">
                  Após a confirmação, o painel liberará o formulário de briefing para início da criação do site.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-right shrink-0">
                <span className="text-[10px] text-slate-300 uppercase block font-semibold">
                  Valor a Pagar:
                </span>
                <span className="text-2xl font-black text-white block">
                  R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-300 block font-medium">
                  {company.plan?.name || "Plano sob Medida"}
                </span>
              </div>
            </div>

            {/* Corpo com Opções de Pagamento */}
            <div className="p-6 space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Grid: Cartão vs PIX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Opção 1: Cartão de Crédito Stripe */}
                <div className="p-5 rounded-2xl border-2 border-indigo-500/40 bg-indigo-50/20 flex flex-col justify-between space-y-4 relative">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                        Recomendado • Instantâneo
                      </span>
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      Cartão de Crédito (Stripe)
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pagamento 100% seguro processado pelo Stripe. A liberação do próximo passo ocorre <strong>automaticamente em segundos</strong>.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handlePayWithStripe}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                    >
                      {isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Conectando ao Stripe...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Pagar R$ {amount.toFixed(2).replace(".", ",")} no Cartão</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-center block text-slate-400">
                      Criptografia de ponta a ponta garantida pelo Stripe Inc.
                    </span>
                  </div>
                </div>

                {/* Opção 2: PIX */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        PIX Direto
                      </span>
                      <QrCode className="w-5 h-5 text-emerald-600" />
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      Chave PIX
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Transfira pelo app do seu banco e nos envie o comprovante para liberação manual imediata pela equipe.
                    </p>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-800 flex items-center justify-between">
                      <span className="truncate">{pixKey}</span>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="ml-2 text-indigo-600 hover:text-indigo-800 shrink-0 font-sans font-bold flex items-center gap-1 text-[11px]"
                      >
                        {copiedPix ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <a
                      href="https://wa.me/5511999999999?text=Ol%C3%A1%2C+acabei+de+fazer+o+PIX+da+minha+mensalidade+na+VMASYS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>Enviar Comprovante pelo WhatsApp</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <span className="text-[10px] text-center block text-slate-400">
                      Baixa manual confirmada em minutos no horário comercial.
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Atualizar / Verificar Status */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Já realizou o pagamento? Clique no botão ao lado para atualizar a página e checar a liberação.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold shrink-0 shadow-2xs flex items-center space-x-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Atualizar Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Faturas / Mensalidades */}
      {company.invoices && company.invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Histórico de Cobranças & Mensalidades ({company.invoices.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Vencimento</th>
                  <th className="py-2.5 px-3">Valor</th>
                  <th className="py-2.5 px-3">Forma</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Pagamento</th>
                  <th className="py-2.5 px-3 text-right">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {company.invoices.map((inv: any) => {
                  const isPaid = inv.status === "PAID";
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        R$ {inv.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isPaid ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Paga ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {inv.paidAt
                          ? new Date(inv.paidAt).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {inv.hostedInvoiceUrl ? (
                          <a
                            href={inv.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            <span>Abrir</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

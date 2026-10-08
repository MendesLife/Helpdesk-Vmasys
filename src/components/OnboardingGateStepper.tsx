import Link from "next/link";
import {
  FileText,
  CreditCard,
  Palette,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { GateStatus } from "@/lib/onboarding-gate";

interface Props {
  gate: GateStatus;
  companyName?: string;
  className?: string;
}

export default function OnboardingGateStepper({
  gate,
  companyName,
  className = "",
}: Props) {
  const steps = [
    {
      num: 1,
      title: "Contrato",
      desc: "Formalização dos termos",
      href: "/portal/contrato",
      isComplete: gate.isContractSigned,
      isCurrent: gate.currentStep === 1,
      isLocked: false,
      icon: FileText,
    },
    {
      num: 2,
      title: "Pagamento",
      desc: "1ª mensalidade do plano",
      href: "/portal/pagamento",
      isComplete: gate.isPaymentSettled,
      isCurrent: gate.currentStep === 2,
      isLocked: !gate.canAccessPagamento,
      icon: CreditCard,
    },
    {
      num: 3,
      title: "Briefing",
      desc: "Informações do site",
      href: "/portal/briefing",
      isComplete: gate.isBriefingApproved,
      isCurrent: gate.currentStep === 3,
      isLocked: !gate.canAccessBriefing,
      icon: Palette,
    },
    {
      num: 4,
      title: "Painel Ativo",
      desc: "Chamados e manutenção",
      href: "/portal/dashboard",
      isComplete: gate.isFullyUnlocked,
      isCurrent: gate.currentStep === 4,
      isLocked: !gate.canAccessTickets,
      icon: Zap,
    },
  ];

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Funil de Implantação & Onboarding VMASYS
          </span>
          <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
            {companyName ? `Etapas de Ativação: ${companyName}` : "Progresso da sua Conta"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {gate.isFullyUnlocked ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Implantação Concluída ✓
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              Etapa {gate.currentStep} de 3
            </span>
          )}
        </div>
      </div>

      {/* Stepper Horizontal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isClickable = !s.isLocked;

          const content = (
            <div
              className={`flex items-start space-x-3 p-3 rounded-xl border transition-all h-full ${
                s.isComplete
                  ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-950"
                  : s.isCurrent
                  ? "bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20 text-sky-950"
                  : "bg-slate-50 border-slate-200/70 text-slate-400 opacity-75"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  s.isComplete
                    ? "bg-emerald-600 text-white shadow-xs"
                    : s.isCurrent
                    ? "bg-sky-600 text-white shadow-xs animate-pulse"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {s.isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : s.isLocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    Passo {s.num}
                  </span>
                  {s.isComplete && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                      Concluído
                    </span>
                  )}
                  {s.isCurrent && !s.isComplete && (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100/90 px-1.5 py-0.2 rounded">
                      Atual
                    </span>
                  )}
                  {s.isLocked && (
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Travado
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  {s.title}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  {s.desc}
                </p>
              </div>
            </div>
          );

          if (isClickable) {
            return (
              <Link
                key={s.num}
                href={s.href}
                className="hover:scale-[1.01] transition-transform block focus:outline-none"
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={s.num} className="cursor-not-allowed select-none">
              {content}
            </div>
          );
        })}
      </div>

      {/* Explanatory Message Banner */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-xs flex items-center justify-between flex-wrap gap-2">
        <p className="text-slate-600">
          {gate.currentStep === 1 && (
            <>
              <strong>Ação necessária:</strong> Por favor, formalize a assinatura do contrato para desbloquear a confirmação de pagamento.
            </>
          )}
          {gate.currentStep === 2 && (
            <>
              <strong>Ação necessária:</strong> Contrato assinado! Realize o primeiro pagamento da sua assinatura para liberar o envio do briefing.
            </>
          )}
          {gate.currentStep === 3 && (
            <>
              {gate.isBriefingSubmitted ? (
                <>
                  <strong>Briefing em Avaliação:</strong> Nossa equipe está revisando suas informações. Assim que aprovado, seu site entrará em desenvolvimento!
                </>
              ) : (
                <>
                  <strong>Ação necessária:</strong> Pagamento confirmado! Preencha o briefing detalhado do seu projeto para iniciarmos o desenvolvimento.
                </>
              )}
            </>
          )}
          {gate.currentStep === 4 && (
            <>
              🎉 <strong>Tudo pronto:</strong> Seu site e plano estão 100% ativos! Você pode abrir chamados ilimitados ou conforme a cota do seu plano.
            </>
          )}
        </p>

        {gate.redirectTarget && (
          <Link
            href={gate.redirectTarget}
            className="inline-flex items-center text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline"
          >
            <span>Ir para esta etapa</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

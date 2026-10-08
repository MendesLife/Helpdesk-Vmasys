import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Layers,
  FileText,
  Scale,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { getOnboardingGateStatus } from "@/lib/onboarding-gate";
import OnboardingGateStepper from "@/components/OnboardingGateStepper";

export default async function ClientDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Se for admin ou suporte navegando no portal sem companyId, busca a primeira empresa para visualização
  let companyId = session.companyId;
  if (!companyId && (session.role === "ADMIN" || session.role === "EQUIPE")) {
    const firstCompany = await prisma.company.findFirst();
    companyId = firstCompany?.id || null;
  }

  if (!companyId) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-amber-800">
        Nenhuma empresa vinculada ao seu usuário. Contate o administrador.
      </div>
    );
  }

  // Busca dados da empresa (Plano, Sites, Briefing, Contrato e Faturas)
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      plan: true,
      sites: true,
      briefing: true,
      contract: true,
      invoices: {
        orderBy: { dueDate: "desc" },
        take: 5,
      },
    },
  });

  if (!company) {
    return <div>Empresa não encontrada.</div>;
  }

  const gate = getOnboardingGateStatus(company as any, session.role);

  // Trava de Onboarding Progressivo: se ainda não concluiu as etapas obrigatórias, redireciona o cliente para a etapa pendente
  if (session.role === "CLIENT" && !gate.isFullyUnlocked) {
    redirect(gate.redirectTarget || "/portal/contrato");
  }

  // Contadores de solicitações (ESTRITAMENTE filtrados por companyId)
  const [totalOpen, totalInProgress, totalInReview, totalCompleted, recentTickets] =
    await Promise.all([
      prisma.ticket.count({
        where: {
          companyId,
          status: { in: ["NOVO", "EM_ANALISE"] },
        },
      }),
      prisma.ticket.count({
        where: {
          companyId,
          status: { in: ["EM_EXECUCAO", "AGUARDANDO_CLIENTE"] },
        },
      }),
      prisma.ticket.count({
        where: {
          companyId,
          status: "EM_REVISAO",
        },
      }),
      prisma.ticket.count({
        where: {
          companyId,
          status: "CONCLUIDO",
        },
      }),
      prisma.ticket.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          site: true,
        },
      }),
    ]);

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Assinatura Ativa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Olá, {session.name.split(" ")[0]}!
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe ou solicite novas alterações para os sites da{" "}
            <span className="font-semibold text-slate-800">{company.name}</span>.
          </p>
        </div>

        <Link
          href="/portal/solicitacoes/nova"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all hover:shadow-indigo-200 shrink-0"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          <span>Nova Solicitação</span>
        </Link>
      </div>

      {/* Stepper de Onboarding e Status */}
      <OnboardingGateStepper gate={gate} companyName={company.name} />

      {/* Pipeline de Criação / Onboarding Tracker */}
      {company.onboardingStage !== "ATIVO_MANUTENCAO" && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="inline-flex items-center space-x-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Onboarding & Criação do Projeto</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Status de Criação do seu Site
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/portal/briefing"
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                <span>
                  {company.briefing?.status === "APPROVED"
                    ? "Briefing Aprovado ✓"
                    : company.briefing?.status === "SUBMITTED"
                    ? "Briefing em Análise"
                    : "Preencher Briefing"}
                </span>
              </Link>

              <Link
                href="/portal/contrato"
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all shrink-0 border border-slate-700"
              >
                <Scale className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                <span>
                  {company.contract?.status === "SIGNED"
                    ? "Contrato Assinado ✓"
                    : "Assinar Contrato"}
                </span>
              </Link>
            </div>
          </div>

          {/* Stepper Visual de 4 Etapas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                step: "1",
                title: "Briefing do Projeto",
                desc:
                  company.briefing?.status === "APPROVED"
                    ? "Aprovado ✓"
                    : company.briefing?.status === "SUBMITTED"
                    ? "Em Análise"
                    : "Pendente",
                isCurrent:
                  company.onboardingStage === "BRIEFING_PENDENTE" ||
                  company.onboardingStage === "BRIEFING_EM_ANALISE" ||
                  !company.onboardingStage,
                isDone:
                  company.briefing?.status === "APPROVED" ||
                  company.onboardingStage === "EM_DESENVOLVIMENTO" ||
                  company.onboardingStage === "EM_HOMOLOGACAO" ||
                  company.onboardingStage === "ATIVO_MANUTENCAO",
              },
              {
                step: "2",
                title: "Criação & Design",
                desc:
                  company.onboardingStage === "EM_DESENVOLVIMENTO"
                    ? "Em Andamento"
                    : company.onboardingStage === "EM_HOMOLOGACAO" ||
                      company.onboardingStage === "ATIVO_MANUTENCAO"
                    ? "Concluído ✓"
                    : "Aguardando",
                isCurrent: company.onboardingStage === "EM_DESENVOLVIMENTO",
                isDone:
                  company.onboardingStage === "EM_HOMOLOGACAO" ||
                  company.onboardingStage === "ATIVO_MANUTENCAO",
              },
              {
                step: "3",
                title: "Homologação & Revisão",
                desc:
                  company.onboardingStage === "EM_HOMOLOGACAO"
                    ? "Pronto para Revisão"
                    : company.onboardingStage === "ATIVO_MANUTENCAO"
                    ? "Aprovado ✓"
                    : "Aguardando",
                isCurrent: company.onboardingStage === "EM_HOMOLOGACAO",
                isDone: company.onboardingStage === "ATIVO_MANUTENCAO",
              },
              {
                step: "4",
                title: "Publicação & Suporte",
                desc:
                  company.onboardingStage === "ATIVO_MANUTENCAO"
                    ? "No Ar ✓"
                    : "Fase Final",
                isCurrent: company.onboardingStage === "ATIVO_MANUTENCAO",
                isDone: company.onboardingStage === "ATIVO_MANUTENCAO",
              },
            ].map((s) => (
              <div
                key={s.step}
                className={`p-3.5 rounded-xl border transition-all ${
                  s.isCurrent
                    ? "bg-slate-800/90 border-sky-400 text-white shadow-md shadow-sky-950/50"
                    : s.isDone
                    ? "bg-slate-800/40 border-emerald-500/40 text-slate-200"
                    : "bg-slate-800/20 border-slate-800 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                      s.isCurrent
                        ? "bg-sky-400 text-slate-950"
                        : s.isDone
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {s.isDone ? "✓" : s.step}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      s.isCurrent
                        ? "text-sky-300"
                        : s.isDone
                        ? "text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    {s.desc}
                  </span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-100">
                  {s.title}
                </h3>
              </div>
            ))}
          </div>

          {/* Notificação / Chamada para Ação */}
          {(!company.briefing || company.briefing.status === "DRAFT") && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Briefing Pendente:</strong> Preencha o briefing do seu projeto para que nossa equipe inicie o layout.
                </span>
              </div>
              <Link
                href="/portal/briefing"
                className="font-bold underline text-amber-300 hover:text-amber-100 shrink-0"
              >
                Preencher agora →
              </Link>
            </div>
          )}

          {(!company.contract || company.contract.status !== "SIGNED") && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Contrato Pendente de Assinatura:</strong> Seu contrato de prestação de serviços e SLA já está disponível para formalização.
                </span>
              </div>
              <Link
                href="/portal/contrato"
                className="font-bold underline text-indigo-300 hover:text-indigo-100 shrink-0"
              >
                Assinar eletronicamente →
              </Link>
            </div>
          )}

          {company.briefing?.status === "SUBMITTED" && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Briefing em Análise:</strong> Nossa equipe está revisando suas informações para estruturar o site.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Grid: Métricas e Dados da Assinatura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card do Plano e Sites Contratados */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Seu Plano
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {company.plan?.name || "Plano Sob Medida"}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {company.plan?.description ||
                "Manutenção técnica preventiva e atualizações contínuas de conteúdo."}
            </p>

            <div className="border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Sites Vinculados ({company.sites.length}):
              </span>
              <ul className="space-y-2">
                {company.sites.map((site) => (
                  <li
                    key={site.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">
                        {site.name}
                      </span>
                    </div>
                    <a
                      href={site.domainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 flex items-center ml-2 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Precisa adicionar outro domínio? Fale com seu gerente.
            </span>
          </div>
        </div>

        {/* 4 Cards de Resumo de Solicitações */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Abertas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Novas
              </span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">
                {totalOpen}
              </span>
              <p className="text-xs text-slate-500 mt-1">Aguardando início</p>
            </div>
          </div>

          {/* Em Execução */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Em Andamento
              </span>
              <Layers className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">
                {totalInProgress}
              </span>
              <p className="text-xs text-slate-500 mt-1">Em produção</p>
            </div>
          </div>

          {/* Em Revisão (Aguardando Aprovação do Cliente) */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-600">
              <span className="text-xs font-semibold uppercase text-indigo-700">
                Aprovação
              </span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-indigo-900">
                {totalInReview}
              </span>
              <p className="text-xs text-indigo-600 font-medium mt-1">
                Aguardando você
              </p>
            </div>
          </div>

          {/* Concluídas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Concluídas
              </span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">
                {totalCompleted}
              </span>
              <p className="text-xs text-slate-500 mt-1">Finalizadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bloco de Contrato & Condições Financeiras */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Contrato de Assinatura & Faturamento
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {company.contract?.status === "SIGNED" ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Contrato Assinado
              </span>
            ) : (
              <Link
                href="/portal/contrato"
                className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center hover:bg-amber-100 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Pendente de Assinatura →
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">
              Mensalidade Contratada
            </span>
            <span className="text-base font-black text-slate-900 block mt-0.5">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(company.customPrice || company.plan?.price || 0)}
            </span>
            <span className="text-[10px] text-slate-500">
              Plano: {company.plan?.name || "Sob Medida"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">
              Dia de Vencimento
            </span>
            <span className="text-base font-black text-slate-900 block mt-0.5">
              Todo dia {company.billingDay || 10}
            </span>
            <span className="text-[10px] text-slate-500">
              Forma: {company.paymentMethod || "PIX"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Status Financeiro
              </span>
              <span
                className={`text-xs font-bold inline-block mt-1 px-2 py-0.5 rounded-md ${
                  company.financialStatus === "EM_DIA"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : company.financialStatus === "ATRASADO"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {company.financialStatus === "EM_DIA"
                  ? "Em Dia ✓"
                  : company.financialStatus === "ATRASADO"
                  ? "Em Atraso"
                  : "Pagamento Pendente"}
              </span>
            </div>

            <Link
              href="/portal/contrato"
              className="text-[11px] font-semibold text-indigo-600 hover:underline mt-2 flex items-center"
            >
              <span>Visualizar termos do contrato</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Faturas Recentes */}
        {company.invoices && company.invoices.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Faturas da sua Assinatura:
            </span>
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
              {company.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 text-xs transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(inv.amount)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Vencimento:{" "}
                        {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : inv.status === "OVERDUE"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {inv.status === "PAID"
                        ? "Paga ✓"
                        : inv.status === "OVERDUE"
                        ? "Em Atraso"
                        : "Aguardando Pagamento"}
                    </span>

                    {inv.hostedInvoiceUrl && (
                      <a
                        href={inv.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors"
                      >
                        Pagar
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Solicitações Recentes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Solicitações Recentes
            </h2>
            <p className="text-xs text-slate-500">
              Últimas alterações cadastradas para seus sites
            </p>
          </div>
          <Link
            href="/portal/solicitacoes"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              Nenhuma solicitação aberta ainda.
            </p>
            <Link
              href="/portal/solicitacoes/nova"
              className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline"
            >
              Criar sua primeira solicitação agora &rarr;
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/solicitacoes/${ticket.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400">
                      #{ticket.ticketNumber}
                    </span>
                    <span className="font-semibold text-sm text-slate-900 hover:text-indigo-600">
                      {ticket.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span>{ticket.site.name}</span>
                    <span>•</span>
                    <span>Tipo: {ticket.changeType}</span>
                    <span>•</span>
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:self-center">
                  <StatusBadge status={ticket.status} />
                  <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    NOVO: { label: "Novo", color: "bg-amber-50 text-amber-700 border-amber-200" },
    EM_ANALISE: {
      label: "Em Análise",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    AGUARDANDO_CLIENTE: {
      label: "Aguardando Resposta",
      color: "bg-rose-50 text-rose-700 border-rose-200",
    },
    EM_EXECUCAO: {
      label: "Em Execução",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    EM_REVISAO: {
      label: "Em Revisão (Aprovar)",
      color: "bg-purple-50 text-purple-700 border-purple-200 font-bold",
    },
    CONCLUIDO: {
      label: "Concluído",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    CANCELADO: {
      label: "Cancelado",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const current = map[status] || {
    label: status,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${current.color}`}
    >
      {current.label}
    </span>
  );
}

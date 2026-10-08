import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import TicketConversation from "./TicketConversation";
import ClientApprovalActions from "./ClientApprovalActions";
import { getOnboardingGateStatus } from "@/lib/onboarding-gate";
import {
  Globe,
  Clock,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Paperclip,
  CheckCircle,
  ExternalLink,
  Tag,
  ShieldAlert,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientTicketDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      site: true,
      company: true,
      createdBy: true,
      assignedTo: true,
      attachments: {
        where: { commentId: null }, // Anexos iniciais da abertura
      },
      comments: {
        where: { isInternal: false }, // SEGURANÇA: Cliente NUNCA vê notas internas
        include: {
          author: true,
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      },
      history: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // VALIDAÇÃO ESTRITA DE ISOLAMENTO: se o chamado não existe ou é de outra empresa, 404!
  if (!ticket) notFound();

  if (session.role === "CLIENT") {
    if (ticket.companyId !== session.companyId) {
      notFound();
    }
    const fullCompany = await prisma.company.findUnique({
      where: { id: ticket.companyId },
      include: { contract: true, briefing: true, invoices: true },
    });
    const gate = getOnboardingGateStatus(fullCompany as any, session.role);
    if (!gate.canAccessTickets) {
      redirect(gate.redirectTarget || "/portal/contrato");
    }
  }

  const steps = [
    { id: "NOVO", label: "Aberto" },
    { id: "EM_ANALISE", label: "Em Análise" },
    { id: "EM_EXECUCAO", label: "Em Execução" },
    { id: "EM_REVISAO", label: "Em Revisão" },
    { id: "CONCLUIDO", label: "Concluído" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "NOVO":
        return 0;
      case "EM_ANALISE":
      case "AGUARDANDO_CLIENTE":
        return 1;
      case "EM_EXECUCAO":
        return 2;
      case "EM_REVISAO":
        return 3;
      case "CONCLUIDO":
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(ticket.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Botão Voltar e Cabeçalho */}
      <div>
        <Link
          href="/portal/solicitacoes"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para a lista de solicitações
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-400">
                #{ticket.ticketNumber}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                {ticket.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Criado por {ticket.createdBy.name} em{" "}
              {new Date(ticket.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>

          <div>
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </div>

      {/* Barra de Progresso Visual de Status */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Etapa Atual do Atendimento
        </p>
        <div className="grid grid-cols-5 gap-2">
          {steps.map((st, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={st.id} className="text-center">
                <div
                  className={`h-2 rounded-full mb-2 transition-all ${
                    isCompleted
                      ? "bg-emerald-500"
                      : isCurrent
                      ? "bg-indigo-600 animate-pulse"
                      : "bg-slate-200"
                  }`}
                />
                <span
                  className={`text-[11px] font-semibold block ${
                    isCurrent
                      ? "text-indigo-600"
                      : isCompleted
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ALERTA DE APROVAÇÃO (Quando o chamado estiver em Revisão) */}
      {ticket.status === "EM_REVISAO" && (
        <ClientApprovalActions ticketId={ticket.id} />
      )}

      {/* Grid Principal: Detalhes da Solicitação e Conversa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Lateral com Informações */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Detalhes Técnicos
            </h3>

            <div>
              <span className="text-slate-400 block mb-0.5">Site Alvo:</span>
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{ticket.site.name}</span>
              </div>
              <a
                href={ticket.site.domainUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline flex items-center mt-0.5"
              >
                <span>{ticket.site.domainUrl}</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>

            {ticket.targetUrl && (
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Página Específica:
                </span>
                <span className="font-medium text-slate-700 break-all">
                  {ticket.targetUrl}
                </span>
              </div>
            )}

            <div>
              <span className="text-slate-400 block mb-0.5">Tipo:</span>
              <span className="font-semibold text-slate-800 px-2 py-0.5 rounded bg-slate-100">
                {ticket.changeType}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Urgência:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded ${
                  ticket.urgency === "ALTA"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {ticket.urgency}
              </span>
            </div>

            {ticket.deadline && (
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Previsão de Entrega:
                </span>
                <div className="flex items-center space-x-1 text-slate-700 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    {new Date(ticket.deadline).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            )}

            {ticket.referenceLinks && (
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Links de Referência:
                </span>
                <a
                  href={ticket.referenceLinks}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline break-all block"
                >
                  {ticket.referenceLinks}
                </a>
              </div>
            )}
          </div>

          {/* Anexos da Abertura */}
          {ticket.attachments.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Anexos da Solicitação ({ticket.attachments.length})
              </h3>
              <ul className="space-y-2 text-xs">
                {ticket.attachments.map((file) => {
                  const isImg =
                    file.fileType.startsWith("image/") ||
                    /\.(png|jpe?g|webp|gif|svg)$/i.test(file.fileName);

                  return (
                    <li
                      key={file.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col space-y-2"
                    >
                      {isImg && (
                        <a
                          href={`/api/attachments/${file.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-36 hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={`/api/attachments/${file.id}`}
                            alt={file.fileName}
                            className="w-full h-28 object-cover"
                          />
                        </a>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="truncate pr-2">
                          <p className="font-medium text-slate-800 truncate">
                            {file.fileName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(file.fileSize / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <a
                          href={`/api/attachments/${file.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 font-semibold text-[11px] shrink-0"
                        >
                          {isImg ? "Visualizar" : "Baixar"}
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Coluna Central: Descrição Original e Feed de Conversa */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card com a Descrição Original */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Descrição da Demanda
            </h3>
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Conversa / Comentários */}
          <TicketConversation
            ticketId={ticket.id}
            comments={ticket.comments as any}
            currentUserId={session.userId}
          />
        </div>
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
      label: "Aguardando sua Resposta",
      color: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
    },
    EM_EXECUCAO: {
      label: "Em Execução",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    EM_REVISAO: {
      label: "Em Revisão (Pronto para Você Aprovar)",
      color: "bg-purple-100 text-purple-800 border-purple-300 font-bold",
    },
    CONCLUIDO: {
      label: "Concluído",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
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
      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${current.color}`}
    >
      {current.label}
    </span>
  );
}

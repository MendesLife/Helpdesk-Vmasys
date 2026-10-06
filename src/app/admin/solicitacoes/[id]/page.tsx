import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminTicketManager from "./AdminTicketManager";
import { ArrowLeft, Building2, Globe, Clock, ShieldAlert } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminTicketDetailPage({ params }: Props) {
  const { id } = await params;

  const [ticket, teamMembers] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id },
      include: {
        company: true,
        site: true,
        createdBy: true,
        assignedTo: true,
        attachments: {
          where: { commentId: null },
        },
        comments: {
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
        timeLogs: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "EQUIPE"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!ticket) notFound();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div>
        <Link
          href="/admin/solicitacoes"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para Fila de Solicitações
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-400">
                #{ticket.ticketNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {ticket.company.name}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                {ticket.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Aberto por {ticket.createdBy.name} em{" "}
              {new Date(ticket.createdAt).toLocaleString("pt-BR")} • Site:{" "}
              <strong>{ticket.site.name}</strong> ({ticket.site.domainUrl})
            </p>
          </div>
        </div>
      </div>

      {/* Gerenciador Operacional Completo */}
      <AdminTicketManager
        ticket={ticket as any}
        teamMembers={teamMembers}
      />
    </div>
  );
}

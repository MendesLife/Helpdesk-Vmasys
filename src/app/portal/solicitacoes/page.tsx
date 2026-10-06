import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TicketListClient from "./TicketListClient";
import { PlusCircle } from "lucide-react";

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ClientTicketsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  let companyId = session.companyId;
  if (!companyId && (session.role === "ADMIN" || session.role === "EQUIPE")) {
    const firstComp = await prisma.company.findFirst();
    companyId = firstComp?.id || null;
  }

  if (!companyId) return <div>Nenhuma empresa vinculada.</div>;

  const tickets = await prisma.ticket.findMany({
    where: { companyId },
    include: {
      site: true,
      comments: {
        where: { isInternal: false }, // Nunca expor notas internas!
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Minhas Solicitações
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consulte o andamento de todos os chamados da sua empresa.
          </p>
        </div>
        <Link
          href="/portal/solicitacoes/nova"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          <span>Nova Solicitação</span>
        </Link>
      </div>

      <TicketListClient initialTickets={tickets as any} />
    </div>
  );
}

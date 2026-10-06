import { prisma } from "@/lib/prisma";
import TicketQueueAdmin from "./TicketQueueAdmin";

export default async function AdminTicketsPage() {
  const [tickets, companies, teamMembers] = await Promise.all([
    prisma.ticket.findMany({
      include: {
        company: true,
        site: true,
        assignedTo: true,
        comments: {
          select: { id: true, isInternal: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "EQUIPE"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <TicketQueueAdmin
        initialTickets={tickets as any}
        companies={companies}
        teamMembers={teamMembers}
      />
    </div>
  );
}

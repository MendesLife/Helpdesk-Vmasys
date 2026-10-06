import { prisma } from "@/lib/prisma";
import TeamManagementAdmin from "./TeamManagementAdmin";

export default async function AdminTeamPage() {
  const teamMembers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "EQUIPE"] } },
    include: {
      assignedTickets: {
        where: { status: { notIn: ["CONCLUIDO", "CANCELADO"] } },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <TeamManagementAdmin teamMembers={teamMembers as any} />
    </div>
  );
}

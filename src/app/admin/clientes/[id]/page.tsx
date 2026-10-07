import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CompanyDetailsAdmin from "./CompanyDetailsAdmin";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params;

  const [company, invitations, plans, allClientUsers] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        plan: true,
        briefing: true,
        sites: { orderBy: { isPrimary: "desc" } },
        users: { orderBy: { createdAt: "asc" } },
        memberships: {
          include: {
            user: true,
          },
        },
        tickets: {
          include: {
            site: true,
            assignedTo: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.invitation.findMany({
      where: { companyId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({
      orderBy: { maxSites: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!company) notFound();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <CompanyDetailsAdmin
        company={company as any}
        invitations={invitations as any}
        plans={plans as any}
        allClientUsers={allClientUsers as any}
      />
    </div>
  );
}

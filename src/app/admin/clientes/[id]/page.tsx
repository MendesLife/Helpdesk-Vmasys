import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CompanyDetailsAdmin from "./CompanyDetailsAdmin";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params;

  const [company, invitations] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        plan: true,
        sites: { orderBy: { isPrimary: "desc" } },
        users: { orderBy: { createdAt: "asc" } },
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
  ]);

  if (!company) notFound();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <CompanyDetailsAdmin
        company={company as any}
        invitations={invitations as any}
      />
    </div>
  );
}

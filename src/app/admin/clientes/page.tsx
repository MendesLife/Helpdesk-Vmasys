import { prisma } from "@/lib/prisma";
import ClientsListAdmin from "./ClientsListAdmin";

export default async function AdminClientsPage() {
  const [companies, plans] = await Promise.all([
    prisma.company.findMany({
      include: {
        plan: true,
        sites: true,
        users: {
          select: { id: true, name: true, email: true, isActive: true },
        },
        tickets: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({
      orderBy: { maxSites: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <ClientsListAdmin companies={companies as any} plans={plans} />
    </div>
  );
}

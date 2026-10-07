import { prisma } from "@/lib/prisma";
import PlansManagementAdmin from "./PlansManagementAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({
    include: {
      companies: {
        select: { id: true, name: true, status: true },
      },
    },
    orderBy: { price: "asc" },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PlansManagementAdmin plans={plans as any} />
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Building2, ChevronDown, Check, ArrowRightLeft } from "lucide-react";
import { switchCompanyAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export default function TenantSwitcher({
  currentCompanyId,
  companies,
}: {
  currentCompanyId?: string | null;
  companies: { id: string; name: string; status: string }[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentCompany =
    companies.find((c) => c.id === currentCompanyId) || companies[0];

  const handleSelect = (companyId: string) => {
    if (companyId === currentCompanyId) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const res = await switchCompanyAction(companyId);
      if (res?.success) {
        setIsOpen(false);
        router.refresh();
        window.location.href = "/portal/dashboard";
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  if (!companies || companies.length <= 1) {
    return (
      <div className="hidden md:flex items-center px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100 text-sky-800 text-xs font-semibold">
        <Building2 className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
        <span className="truncate max-w-[150px]">{currentCompany?.name || "Minha Empresa"}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={isPending}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-900 text-xs font-bold transition-all shadow-xs"
        title="Clique para alternar entre suas empresas"
      >
        <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        <span className="truncate max-w-[140px] sm:max-w-[200px]">
          {isPending ? "Trocando..." : currentCompany?.name}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-sky-500 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-1">
            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center">
                <ArrowRightLeft className="w-3 h-3 mr-1 text-sky-600" />
                Alternar Empresa
              </span>
              <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded font-semibold">
                {companies.length} empresas
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto p-1 space-y-1">
              {companies.map((c) => {
                const isSelected = c.id === currentCompanyId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-sky-50 text-sky-900 font-bold"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="block truncate">{c.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-sky-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { approveTicketAction, requestRevisionAction } from "@/app/actions/ticket";
import { CheckCircle2, RotateCcw, AlertTriangle, ArrowRight } from "lucide-react";

export default function ClientApprovalActions({
  ticketId,
}: {
  ticketId: string;
}) {
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveTicketAction(ticketId);
      if (res?.error) setError(res.error);
    });
  };

  const handleRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError("Por favor, descreva o que precisa ser ajustado.");
      return;
    }

    startTransition(async () => {
      const res = await requestRevisionAction(ticketId, reason);
      if (res?.error) {
        setError(res.error);
      } else {
        setShowRevisionModal(false);
        setReason("");
      }
    });
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-6 rounded-2xl shadow-xs">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span>Alteração Concluída pela Agência</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Esta solicitação está pronta para a sua revisão!
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Nossa equipe finalizou os ajustes solicitados. Por favor, acesse seu
            site e verifique se o resultado atende às suas expectativas.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowRevisionModal(true)}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-700 font-semibold text-xs transition-colors flex items-center"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Solicitar Ajustes</span>
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-md shadow-purple-200 transition-all flex items-center disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            <span>Aprovar Alteração</span>
          </button>
        </div>
      </div>

      {/* Modal / Bloco de Pedido de Ajustes */}
      {showRevisionModal && (
        <div className="mt-5 pt-5 border-t border-purple-200/80">
          <form onSubmit={handleRequestRevision} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-800">
              O que ainda precisa ser corrigido ou ajustado?
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva com detalhes o que não ficou como esperado para que a equipe corrija..."
              className="w-full rounded-xl border border-purple-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isPending ? "Enviando..." : "Enviar Pedido de Ajuste"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

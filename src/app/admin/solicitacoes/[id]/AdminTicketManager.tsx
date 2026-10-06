"use client";

import { useState, useTransition } from "react";
import {
  adminUpdateTicketAction,
  addCommentAction,
  adminAddTimeLogAction,
} from "@/app/actions/ticket";
import { useRouter } from "next/navigation";
import {
  Save,
  Lock,
  Send,
  Clock,
  CheckCircle,
  FileText,
  Paperclip,
  User,
  History,
  AlertCircle,
  Calendar,
  ExternalLink,
} from "lucide-react";

export default function AdminTicketManager({
  ticket,
  teamMembers,
}: {
  ticket: any;
  teamMembers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form Controls
  const [status, setStatus] = useState(ticket.status);
  const [urgency, setUrgency] = useState(ticket.urgency);
  const [assignedToId, setAssignedToId] = useState(ticket.assignedToId || "");
  const [deadline, setDeadline] = useState(
    ticket.deadline
      ? new Date(ticket.deadline).toISOString().split("T")[0]
      : ""
  );

  // Status Save Notification
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Comment Tabs & Input
  const [commentType, setCommentType] = useState<"public" | "internal">("public");
  const [commentContent, setCommentContent] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);

  // Time Log State
  const [minutesSpent, setMinutesSpent] = useState("");
  const [timeDescription, setTimeDescription] = useState("");

  const handleUpdateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    startTransition(async () => {
      await adminUpdateTicketAction(ticket.id, {
        status,
        urgency,
        assignedToId: assignedToId || null,
        deadline: deadline || null,
      });
      setSaveSuccess(true);
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    const formData = new FormData();
    formData.append("ticketId", ticket.id);
    formData.append("content", commentContent);
    formData.append("isInternal", commentType === "internal" ? "true" : "false");
    commentFiles.forEach((f) => formData.append("files", f));

    startTransition(async () => {
      await addCommentAction(formData);
      setCommentContent("");
      setCommentFiles([]);
      router.refresh();
    });
  };

  const handleAddTimeLog = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(minutesSpent);
    if (!minutes || minutes <= 0) return;

    startTransition(async () => {
      await adminAddTimeLogAction(ticket.id, minutes, timeDescription);
      setMinutesSpent("");
      setTimeDescription("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controle Operacional (Status, Responsável, Prazo, Urgência) */}
      <form
        onSubmit={handleUpdateTicket}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Controle Operacional da Solicitação
          </span>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Alterações salvas com sucesso!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Status do Chamado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 font-semibold text-slate-800 bg-white focus:outline-none focus:border-indigo-600"
            >
              <option value="NOVO">Novo</option>
              <option value="EM_ANALISE">Em Análise</option>
              <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
              <option value="EM_EXECUCAO">Em Execução</option>
              <option value="EM_REVISAO">Em Revisão (Entrega p/ Aprovação)</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Membro Responsável
            </label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-800 bg-white focus:outline-none focus:border-indigo-600"
            >
              <option value="">Não atribuído</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Urgência */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Grau de Urgência
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-800 bg-white focus:outline-none focus:border-indigo-600"
            >
              <option value="BAIXA">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>

          {/* Prazo */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Prazo Previsto de Conclusão
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-slate-800 bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </form>

      {/* Grid Principal: Descrição/Conversa e Painéis Laterais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Detalhes e Apontamento de Tempo */}
        <div className="space-y-6">
          {/* Informações da Demanda */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              Contexto do Cliente
            </h3>

            {ticket.targetUrl && (
              <div>
                <span className="text-slate-400 block mb-0.5">
                  URL a Modificar:
                </span>
                <span className="font-medium text-slate-800 break-all">
                  {ticket.targetUrl}
                </span>
              </div>
            )}

            {ticket.referenceLinks && (
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Links de Referência:
                </span>
                <a
                  href={ticket.referenceLinks}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline break-all block"
                >
                  {ticket.referenceLinks}
                </a>
              </div>
            )}

            {/* Anexos Iniciais */}
            {ticket.attachments.length > 0 && (
              <div>
                <span className="text-slate-400 block mb-1.5 font-semibold">
                  Anexos da Solicitação ({ticket.attachments.length}):
                </span>
                <ul className="space-y-1.5">
                  {ticket.attachments.map((att: any) => (
                    <li
                      key={att.id}
                      className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                    >
                      <span className="truncate pr-2 font-medium">
                        {att.fileName}
                      </span>
                      <a
                        href={`/api/attachments/${att.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline font-bold shrink-0"
                      >
                        Baixar
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Registro de Tempo Gasto (Time Log) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                <span>Horas / Tempo Gasto</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Total:{" "}
                {ticket.timeLogs.reduce(
                  (acc: number, cur: any) => acc + cur.minutesSpent,
                  0
                )}{" "}
                min
              </span>
            </div>

            <form onSubmit={handleAddTimeLog} className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Minutos (ex: 45)"
                  value={minutesSpent}
                  onChange={(e) => setMinutesSpent(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-200 py-1.5 px-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="O que fez? (opcional)"
                  value={timeDescription}
                  onChange={(e) => setTimeDescription(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-200 py-1.5 px-2 text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !minutesSpent}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-[11px] disabled:opacity-50"
              >
                + Apontar Tempo
              </button>
            </form>

            {ticket.timeLogs.length > 0 && (
              <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                {ticket.timeLogs.map((log: any) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between text-[11px] text-slate-600"
                  >
                    <span>
                      <strong>{log.minutesSpent} min</strong> • {log.user.name.split(" ")[0]}
                      {log.description ? ` (${log.description})` : ""}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Histórico de Auditoria */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center border-b border-slate-100 pb-2">
              <History className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span>Histórico de Atividades</span>
            </h3>

            <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {ticket.history.map((hist: any) => (
                <li
                  key={hist.id}
                  className="text-[11px] text-slate-600 pb-1.5 border-b border-slate-50 last:border-0"
                >
                  <p className="font-medium text-slate-800">
                    {hist.author.name.split(" ")[0]} • {hist.action}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {hist.oldValue ? `${hist.oldValue} ➔ ` : ""}
                    <strong>{hist.newValue || hist.notes}</strong>
                  </p>
                  <span className="text-[9px] text-slate-400">
                    {new Date(hist.createdAt).toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Coluna Central: Descrição Original e Mensagens / Notas Internas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Descrição */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Descrição da Solicitação
            </h3>
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Feed de Conversa e Notas Internas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Comunicação & Notas da Equipe
              </h2>
              <span className="text-xs text-slate-400">
                {ticket.comments.length} interações
              </span>
            </div>

            {/* Lista de Mensagens */}
            <div className="p-6 space-y-4">
              {ticket.comments.map((comment: any) => {
                const isInternal = comment.isInternal;
                return (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-xl text-xs space-y-2 border ${
                      isInternal
                        ? "bg-amber-50/70 border-amber-200 text-amber-900"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">
                          {comment.author.name}
                        </span>
                        {isInternal ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                            <Lock className="w-2.5 h-2.5 mr-1" />
                            NOTA INTERNA (Cliente NÃO Vê)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700">
                            Resposta Pública
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>

                    <p className="leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>

                    {comment.attachments.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {comment.attachments.map((att: any) => (
                          <a
                            key={att.id}
                            href={`/api/attachments/${att.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-medium text-indigo-600 hover:bg-slate-100"
                          >
                            <Paperclip className="w-3 h-3 mr-1" />
                            {att.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Caixa de Criação com Alternância Pública vs Nota Interna */}
              <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-4 space-y-3">
                {/* Abas do Comentário */}
                <div className="flex space-x-2 border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setCommentType("public")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      commentType === "public"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Resposta Pública ao Cliente
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommentType("internal")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                      commentType === "internal"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Nota Interna (Oculta do Cliente)</span>
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder={
                    commentType === "internal"
                      ? "Escreva observações internas técnicas, avisos de escopo ou orientações de desenvolvimento (o cliente NÃO terá acesso a isto)..."
                      : "Escreva uma resposta que ficará visível ao cliente no portal..."
                  }
                  className={`w-full rounded-xl p-3 text-xs focus:outline-none ${
                    commentType === "internal"
                      ? "bg-amber-50/50 border border-amber-300 text-amber-900 placeholder-amber-400"
                      : "border border-slate-200 text-slate-800 placeholder-slate-400"
                  }`}
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {commentType === "internal"
                      ? "🔒 Esta mensagem será gravada com a flag isInternal: true."
                      : "💬 Esta mensagem notificará o cliente e aparecerá no portal dele."}
                  </span>

                  <button
                    type="submit"
                    disabled={isPending || !commentContent.trim()}
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-white font-semibold text-xs transition-colors disabled:opacity-50 ${
                      commentType === "internal"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    <span>
                      {commentType === "internal"
                        ? "Salvar Nota Interna"
                        : "Enviar ao Cliente"}
                    </span>
                    <Send className="w-3 h-3 ml-1.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

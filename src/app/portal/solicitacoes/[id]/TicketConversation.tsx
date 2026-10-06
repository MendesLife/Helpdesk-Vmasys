"use client";

import { useState, useTransition } from "react";
import { addCommentAction } from "@/app/actions/ticket";
import {
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  X,
  User,
  ShieldCheck,
  Headphones,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  attachments: {
    id: string;
    fileName: string;
    fileSize: number;
  }[];
}

export default function TicketConversation({
  ticketId,
  comments,
  currentUserId,
}: {
  ticketId: string;
  comments: Comment[];
  currentUserId: string;
}) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.append("ticketId", ticketId);
    formData.append("content", content);
    formData.append("isInternal", "false");
    files.forEach((f) => formData.append("files", f));

    startTransition(async () => {
      const res = await addCommentAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setContent("");
        setFiles([]);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        <h2 className="text-sm font-bold text-slate-900">
          Histórico da Conversa
        </h2>
        <span className="text-xs text-slate-400">({comments.length})</span>
      </div>

      {/* Lista de Mensagens */}
      <div className="p-6 space-y-6">
        {comments.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-4">
            Nenhuma mensagem trocada ainda. Envie uma mensagem abaixo se desejar
            complementar sua solicitação.
          </p>
        ) : (
          comments.map((comment) => {
            const isMe = comment.author.id === currentUserId;
            const isTeam =
              comment.author.role === "ADMIN" ||
              comment.author.role === "EQUIPE";

            return (
              <div
                key={comment.id}
                className={`flex gap-3 ${
                  isTeam ? "bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/60" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isTeam
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {isTeam ? (
                    <Headphones className="w-4 h-4" />
                  ) : (
                    comment.author.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">
                      {comment.author.name}
                    </span>
                    {isTeam && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                        Equipe da Agência
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  {/* Anexos no Comentário */}
                  {comment.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      {comment.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={`/api/attachments/${att.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-indigo-600 hover:bg-slate-50 font-medium"
                        >
                          <Paperclip className="w-3 h-3 mr-1 text-slate-400" />
                          <span className="truncate max-w-[150px]">
                            {att.fileName}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Caixa de Nova Resposta */}
        <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4 space-y-3">
          {error && (
            <div className="p-2 rounded-lg bg-red-50 text-red-600 text-xs">
              {error}
            </div>
          )}

          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva uma mensagem ou responda às dúvidas da equipe..."
            className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />

          {/* Anexos Selecionados */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1.5 px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-[11px] text-slate-700"
                >
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
              <Paperclip className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>Anexar Arquivo</span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              {isPending ? (
                "Enviando..."
              ) : (
                <>
                  <span>Enviar Mensagem</span>
                  <Send className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

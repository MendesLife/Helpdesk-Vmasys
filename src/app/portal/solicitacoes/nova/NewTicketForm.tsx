"use client";

import { useState, useTransition } from "react";
import { createTicketAction } from "@/app/actions/ticket";
import { useRouter } from "next/navigation";
import {
  Globe,
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Paperclip,
  ArrowRight,
} from "lucide-react";

interface Site {
  id: string;
  name: string;
  domainUrl: string;
}

export default function NewTicketForm({
  sites,
  companyId,
}: {
  sites: Site[];
  companyId: string;
}) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(sites[0]?.id || "");
  const [changeType, setChangeType] = useState("TEXTO");
  const [urgency, setUrgency] = useState("NORMAL");
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [description, setDescription] = useState("");
  const [referenceLinks, setReferenceLinks] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const changeTypes = [
    { id: "TEXTO", label: "Texto / Conteúdo", desc: "Corrigir ou alterar textos existentes" },
    { id: "IMAGEM", label: "Imagem / Banners", desc: "Trocar ou inserir novas fotos" },
    { id: "LAYOUT", label: "Layout / Design", desc: "Ajustar cores, fontes ou espaçamentos" },
    { id: "NOVA_SECAO", label: "Nova Seção / Página", desc: "Criar bloco ou página adicional" },
    { id: "CORRECAO_ERRO", label: "Correção de Erro", desc: "Link quebrado, falha visual ou bug" },
    { id: "SEO", label: "SEO / Tags", desc: "Google Analytics, Meta tags ou pixel" },
    { id: "OUTRO", label: "Outro", desc: "Demanda não listada acima" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!siteId) {
      setError("Selecione qual site deseja alterar.");
      return;
    }

    const formData = new FormData();
    formData.append("companyId", companyId);
    formData.append("siteId", siteId);
    formData.append("changeType", changeType);
    formData.append("urgency", urgency);
    formData.append("title", title);
    formData.append("targetUrl", targetUrl);
    formData.append("description", description);
    formData.append("referenceLinks", referenceLinks);

    files.forEach((f) => formData.append("files", f));

    startTransition(async () => {
      const res = await createTicketAction(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success && res.ticketId) {
        router.push(`/portal/solicitacoes/${res.ticketId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Seleção do Site e URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
            Qual site deve ser alterado? *
          </label>
          <div className="relative">
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-3 pr-8 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none bg-white"
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.domainUrl})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
            Página ou Link específico (Opcional)
          </label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="Ex: /contato ou https://meusite.com.br/sobre"
            className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Tipo de Alteração */}
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-700 mb-2">
          Tipo de Alteração *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {changeTypes.map((type) => {
            const isSelected = changeType === type.id;
            return (
              <button
                type="button"
                key={type.id}
                onClick={() => setChangeType(type.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-600"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <p className="text-xs font-bold">{type.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {type.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grau de Urgência */}
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-700 mb-2">
          Grau de Urgência *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "BAIXA", label: "Baixa", desc: "Pode aguardar fila normal" },
            { id: "NORMAL", label: "Normal", desc: "Prazo padrão da assinatura" },
            { id: "ALTA", label: "Alta", desc: "Impacto no negócio ou erro urgente" },
          ].map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setUrgency(item.id)}
              className={`p-3 rounded-xl border text-center transition-all ${
                urgency === item.id
                  ? item.id === "ALTA"
                    ? "border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-500 font-bold"
                    : "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600 font-bold"
                  : "border-slate-200 bg-slate-50/50 text-slate-600"
              }`}
            >
              <div className="text-xs font-semibold">{item.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Título */}
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
          Título da Solicitação *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Atualizar horário de funcionamento no rodapé"
          className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
        />
      </div>

      {/* Descrição Detalhada */}
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
          Descrição Detalhada do Pedido *
        </label>
        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explique exatamente o que deve ser feito. Por exemplo: Onde fica o elemento? Qual o novo texto? Como deseja que fique o resultado final?"
          className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
        />
      </div>

      {/* Links de Referência */}
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
          Links de Referência ou Exemplo (Opcional)
        </label>
        <input
          type="text"
          value={referenceLinks}
          onChange={(e) => setReferenceLinks(e.target.value)}
          placeholder="Ex: Link do Google Drive, pasta do Canva ou link de site inspiração"
          className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
        />
      </div>

      {/* Upload de Anexos */}
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
          Anexar Imagens e Arquivos (Máx: 10MB por arquivo)
        </label>
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-700">
            Clique no botão abaixo ou selecione os arquivos do seu computador
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Formatos aceitos: JPG, PNG, WEBP, PDF, DOCX, ZIP
          </p>
          <label className="mt-3 inline-flex items-center px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
            <Paperclip className="w-3.5 h-3.5 mr-1.5" />
            <span>Selecionar Arquivos</span>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Lista de Arquivos Selecionados */}
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((file, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs"
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">
                    {file.name}
                  </span>
                  <span className="text-slate-400 shrink-0">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 pt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
        >
          {isPending ? (
            <span>Enviando solicitação...</span>
          ) : (
            <>
              <span>Abrir Solicitação</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { saveBriefingAction } from "@/app/actions/briefing";
import { useRouter } from "next/navigation";
import {
  FileText,
  Sparkles,
  Building2,
  Palette,
  Layers,
  Settings,
  FolderArchive,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Save,
  ExternalLink,
  Check,
  Info,
} from "lucide-react";
import Link from "next/link";

interface CustomQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "boolean";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

interface Props {
  companyId: string;
  companyName: string;
  planName: string;
  briefing: any | null;
  onboardingStage: string | null;
  planBriefingQuestions?: string | null;
}

export default function BriefingForm({
  companyId,
  companyName,
  planName,
  briefing,
  onboardingStage,
  planBriefingQuestions,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [businessOverview, setBusinessOverview] = useState(
    briefing?.businessOverview || ""
  );
  const [targetAudience, setTargetAudience] = useState(
    briefing?.targetAudience || ""
  );
  const [visualStyle, setVisualStyle] = useState(briefing?.visualStyle || "");
  const [competitors, setCompetitors] = useState(briefing?.competitors || "");
  const [requiredPages, setRequiredPages] = useState(
    briefing?.requiredPages || ""
  );
  const [features, setFeatures] = useState(briefing?.features || "");
  const [contentDriveUrl, setContentDriveUrl] = useState(
    briefing?.contentDriveUrl || ""
  );

  // Perguntas customizadas do pacote
  const parsedCustomQuestions: CustomQuestion[] = (() => {
    if (!planBriefingQuestions) return [];
    try {
      const list = JSON.parse(planBriefingQuestions);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  })();

  const initialCustomAnswers: Record<string, string> = (() => {
    if (!briefing?.customAnswers) return {};
    try {
      const parsed = JSON.parse(briefing.customAnswers);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  })();

  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>(
    initialCustomAnswers
  );

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isApproved = briefing?.status === "APPROVED";
  const isSubmitted = briefing?.status === "SUBMITTED";
  const isRevision = briefing?.status === "REVISION_REQUESTED";

  const handleSubmit = (actionType: "SAVE_DRAFT" | "SUBMIT") => {
    setFeedback(null);

    if (actionType === "SUBMIT") {
      for (const q of parsedCustomQuestions) {
        if (q.required && (!customAnswers[q.id] || !customAnswers[q.id].trim())) {
          setFeedback({
            type: "error",
            message: `Por favor, responda à pergunta obrigatória do pacote: "${q.label}".`,
          });
          return;
        }
      }
    }

    const formData = new FormData();
    formData.append("companyId", companyId);
    formData.append("actionType", actionType);
    formData.append("businessOverview", businessOverview);
    formData.append("targetAudience", targetAudience);
    formData.append("visualStyle", visualStyle);
    formData.append("competitors", competitors);
    formData.append("requiredPages", requiredPages);
    formData.append("features", features);
    formData.append("contentDriveUrl", contentDriveUrl);
    formData.append("customAnswers", JSON.stringify(customAnswers));

    startTransition(async () => {
      const res = await saveBriefingAction(formData);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else if (res?.message) {
        setFeedback({ type: "success", message: res.message });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                {planName}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {companyName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Briefing do Projeto
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Preencha com o máximo de detalhes para que nossa equipe crie um site alinhado com a identidade e objetivos do seu negócio.
            </p>
          </div>

          <div className="shrink-0">
            {isApproved ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                Briefing Aprovado
              </span>
            ) : isSubmitted ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                <Clock className="w-4 h-4 mr-1.5 text-purple-600" />
                Em Análise pela Equipe
              </span>
            ) : isRevision ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
                Ajustes Solicitados
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <Clock className="w-4 h-4 mr-1.5 text-slate-500" />
                Pendente de Envio
              </span>
            )}
          </div>
        </div>

        {/* Mensagem de Ajustes se houver */}
        {isRevision && briefing?.adminNotes && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold flex items-center text-amber-800">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
              Observações da Equipe VMASYS para Ajuste:
            </span>
            <p className="whitespace-pre-wrap text-amber-800 font-medium pl-5">
              {briefing.adminNotes}
            </p>
          </div>
        )}

        {/* Mensagem de Aprovado */}
        {isApproved && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-emerald-950">
                Seu briefing foi revisado e aprovado com sucesso!
              </p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Nossa equipe de design e desenvolvimento já está trabalhando na criação do seu site. Você pode acompanhar as novidades no painel principal.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-center space-x-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Formulário Estruturado em Cards */}
      <div className="space-y-6">
        {/* Bloco 1: Sobre a Empresa */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                1. Sobre a Empresa & Negócio
              </h2>
              <p className="text-[11px] text-slate-500">
                Conte-nos sobre o que sua empresa faz e quem você deseja atrair.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Apresentação da Empresa e Serviços *
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Resuma o ramo de atuação, principais produtos/serviços oferecidos e diferenciais que tornam seu negócio único no mercado.
              </p>
              <textarea
                rows={3}
                disabled={isApproved}
                value={businessOverview}
                onChange={(e) => setBusinessOverview(e.target.value)}
                placeholder="Ex: Somos uma clínica odontológica especializada em implantes e estética dental. Nosso diferencial é atendimento humanizado com tecnologia 3D..."
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-50 leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Público-Alvo & Perfil do Cliente Ideal
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Quem costuma contratar ou comprar de você? (Faixa etária, classe, empresas B2B ou pessoas físicas, região geográfica).
              </p>
              <textarea
                rows={2}
                disabled={isApproved}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: Homens e mulheres de 25 a 55 anos residentes na grande São Paulo buscando tratamentos estéticos de alto padrão..."
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-50 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Identidade Visual e Estilo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                2. Identidade Visual & Design
              </h2>
              <p className="text-[11px] text-slate-500">
                Defina o visual, paleta de cores e o tom de voz do site.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Cores da Marca & Estilo Visual Desejado
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Quais cores representam sua marca? Qual sensação você deseja transmitir? (Minimalista, Moderno, Corporativo, Tecnológico, Acolhedor).
              </p>
              <textarea
                rows={2}
                disabled={isApproved}
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                placeholder="Ex: Cores: Azul marinho (#003366) e Dourado. Estilo: Moderno, minimalista e sofisticado, fundo claro com bastante respiro..."
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-50 leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Referências e Concorrentes (Sites que você gosta e não gosta)
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Cole links de sites inspiradores ou concorrentes, indicando o que você mais gosta neles (e o que devemos evitar).
              </p>
              <textarea
                rows={2}
                disabled={isApproved}
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder="Ex: Gosto da estrutura limpa do site https://exemplo.com.br. Não gosto de sites poluídos ou com animações exageradas..."
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-50 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Bloco 3: Estrutura e Páginas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                3. Estrutura de Páginas & Conteúdo *
              </h2>
              <p className="text-[11px] text-slate-500">
                Quais seções e páginas seu site deve conter.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Páginas Necessárias *
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Liste as páginas que você precisa no projeto (ex: Início, Sobre Nós, Serviços, Portfólio, Contato, FAQ).
              </p>
              <textarea
                rows={3}
                disabled={isApproved}
                value={requiredPages}
                onChange={(e) => setRequiredPages(e.target.value)}
                placeholder="Ex: 
1. Início (Hero banner, resumo dos serviços, depoimentos e CTA WhatsApp)
2. Sobre Nós (História da empresa, equipe)
3. Serviços (Página detalhada dos tratamentos)
4. Contato (Formulário, mapa, telefones e horários)"
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-50 leading-relaxed font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Recursos, Ferramentas & Integrações Específicas
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Marque ou descreva o que precisa estar ativo no site (ex: Botão flutuante WhatsApp, formulário de contato, Google Maps, Pixel do Meta, Blog, etc).
              </p>
              <input
                type="text"
                disabled={isApproved}
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="Ex: Botão de WhatsApp em todas as páginas, formulário integrado com e-mail, mapa da unidade, Pixel do Meta."
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Bloco 4: Arquivos, Logo & Fotos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                4. Arquivos, Logotipo & Materiais
              </h2>
              <p className="text-[11px] text-slate-500">
                Envio do logotipo em alta qualidade, fotos institucionais e textos.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block font-bold text-slate-800">
              Link da Pasta no Google Drive / Dropbox / OneDrive
            </label>
            <p className="text-[11px] text-slate-500">
              Crie uma pasta compartilhada com seu logotipo em vetor ou PNG transparente, fotos da sua empresa/equipe e envie o link aqui com permissão de visualização.
            </p>
            <div className="flex space-x-2">
              <input
                type="url"
                disabled={isApproved}
                value={contentDriveUrl}
                onChange={(e) => setContentDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="flex-1 rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-50 font-mono text-xs"
              />
              {contentDriveUrl && (
                <a
                  href={contentDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center shrink-0 text-xs transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  <span>Testar Link</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bloco 5: Perguntas Específicas do Pacote */}
        {parsedCustomQuestions.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  5. Perguntas Específicas do Pacote ({planName})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Responda às questões configuradas especificamente para o escopo do seu plano.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {parsedCustomQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="space-y-1.5 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60"
                >
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800">
                      {idx + 1}. {q.label}{" "}
                      {q.required && <span className="text-rose-500">*</span>}
                    </label>
                    {q.required && (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                        Obrigatória
                      </span>
                    )}
                  </div>

                  {q.type === "textarea" ? (
                    <textarea
                      rows={3}
                      disabled={isApproved}
                      value={customAnswers[q.id] || ""}
                      onChange={(e) =>
                        setCustomAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder={q.placeholder || "Digite sua resposta..."}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-100/80 leading-relaxed bg-white"
                    />
                  ) : q.type === "select" ? (
                    <select
                      disabled={isApproved}
                      value={customAnswers[q.id] || ""}
                      onChange={(e) =>
                        setCustomAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-100/80 bg-white"
                    >
                      <option value="">Selecione uma opção...</option>
                      {(q.options || []).map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : q.type === "boolean" ? (
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id={`q_bool_${q.id}`}
                        disabled={isApproved}
                        checked={customAnswers[q.id] === "Sim"}
                        onChange={(e) =>
                          setCustomAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.checked ? "Sim" : "Não",
                          }))
                        }
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                      />
                      <label
                        htmlFor={`q_bool_${q.id}`}
                        className="text-slate-700 font-semibold cursor-pointer"
                      >
                        Sim, confirmo / desejo este item
                      </label>
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled={isApproved}
                      value={customAnswers[q.id] || ""}
                      onChange={(e) =>
                        setCustomAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder={q.placeholder || "Digite sua resposta..."}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-100/80 bg-white"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra de Ações do Formulário */}
        {!isApproved && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Você pode salvar um rascunho agora e concluir o preenchimento mais tarde.
              </span>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSubmit("SAVE_DRAFT")}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Rascunho</span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSubmit("SUBMIT")}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isPending ? "Enviando..." : "Enviar Briefing"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

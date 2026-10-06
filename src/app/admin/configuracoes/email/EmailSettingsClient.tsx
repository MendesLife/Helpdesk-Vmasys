"use client";

import { useState, useTransition } from "react";
import { testSmtpAction, sendTestEmailAction } from "@/app/actions/admin";
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Info,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface Props {
  currentSettings: {
    isConfigured: boolean;
    host: string;
    port: string;
    user: string;
    from: string;
  };
}

export default function EmailSettingsClient({ currentSettings }: Props) {
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    simulated?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [isTesting, startTesting] = useTransition();

  const handleTestConnection = () => {
    setTestResult(null);
    startTesting(async () => {
      const res = await testSmtpAction();
      if ((res as any)?.valid) {
        setTestResult({
          success: true,
          message: "Conexão com o servidor SMTP testada e aprovada com sucesso!",
        });
      } else {
        setTestResult({
          success: false,
          error:
            (res as any)?.message ||
            "Não foi possível conectar ao servidor SMTP.",
        });
      }
    });
  };

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setTestResult(null);
    startTesting(async () => {
      const res = (await sendTestEmailAction(testEmail)) as any;
      if (res && res.success) {
        if (res.simulated) {
          setTestResult({
            success: true,
            simulated: true,
            message: `Disparo simulado com sucesso! Como o SMTP não possui credenciais no .env, a mensagem foi formatada e registrada no console do servidor.`,
          });
        } else {
          setTestResult({
            success: true,
            simulated: false,
            message: `E-mail real enviado com sucesso para ${testEmail}! Verifique sua caixa de entrada.`,
          });
        }
      } else {
        setTestResult({
          success: false,
          error: res?.error ? String(res.error) : "Falha ao enviar e-mail de teste.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Status da Configuração Atual */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Status do Serviço de Notificações
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              currentSettings.isConfigured
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {currentSettings.isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>SMTP Real Configurado</span>
              </>
            ) : (
              <>
                <Info className="w-3.5 h-3.5 mr-1 text-amber-600" />
                <span>Modo Simulação / Desenvolvimento</span>
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Servidor Host:</span>
            <span className="font-semibold text-slate-800">
              {currentSettings.host || "Não configurado"}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Porta:</span>
            <span className="font-semibold text-slate-800">
              {currentSettings.port}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Usuário SMTP:</span>
            <span className="font-semibold text-slate-800">
              {currentSettings.user || "Nenhum"}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Remetente (From):</span>
            <span className="font-semibold text-slate-800 truncate block">
              {currentSettings.from}
            </span>
          </div>
        </div>
      </div>

      {/* Ferramenta de Teste de Disparo */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center">
          <Zap className="w-4 h-4 mr-2 text-sky-600" />
          <span>Testar Disparo de Notificação</span>
        </h2>
        <p className="text-xs text-slate-500">
          Informe seu e-mail para receber um exemplo real de notificação com a
          identidade visual da VMASYS.
        </p>

        {testResult && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start space-x-2.5 ${
              testResult.success
                ? testResult.simulated
                  ? "bg-amber-50 border border-amber-200 text-amber-900"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-900"
                : "bg-rose-50 border border-rose-200 text-rose-900"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {testResult.success
                  ? testResult.simulated
                    ? "Modo Simulação Ativo"
                    : "Sucesso!"
                  : "Erro no envio"}
              </p>
              <p className="mt-0.5">{testResult.message || testResult.error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            placeholder="Digite seu e-mail (ex: seuemail@empresa.com)"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-sky-600"
          />
          <button
            type="submit"
            disabled={isTesting}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 shrink-0"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            <span>{isTesting ? "Enviando..." : "Disparar E-mail de Teste"}</span>
          </button>
        </form>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="text-xs font-semibold text-slate-600 hover:text-sky-700 underline"
          >
            Verificar apenas conexão de rede SMTP
          </button>
        </div>
      </div>

      {/* Guia Rápido de Configuração por Provedor */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm">
          Como configurar seu provedor de e-mail no arquivo .env
        </h3>
        <p className="text-slate-600">
          Para enviar e-mails reais em produção, adicione as variáveis no seu arquivo{" "}
          <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">.env</code>{" "}
          ou no painel da sua hospedagem:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-sky-900 block">Opção 1: Resend (Recomendado)</span>
            <p className="text-slate-500 text-[11px]">
              Moderno, gratuito até 3.000 e-mails/mês e alta entregabilidade.
            </p>
            <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto">
{`SMTP_HOST="smtp.resend.com"
SMTP_PORT="465"
SMTP_USER="resend"
SMTP_PASS="re_seu_token_aqui"
SMTP_FROM="VMASYS <suporte@seudominio.com>"`}
            </pre>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-sky-900 block">Opção 2: Brevo / Sendinblue</span>
            <p className="text-slate-500 text-[11px]">
              Plano gratuito com 300 e-mails/dia sem necessidade de cartão.
            </p>
            <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto">
{`SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-chave-smtp-brevo"
SMTP_FROM="VMASYS <atendimento@vmasys.com.br>"`}
            </pre>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-sky-900 block">Opção 3: Gmail (Senha de App)</span>
            <p className="text-slate-500 text-[11px]">
              Utilize sua conta Google criando uma "Senha de App" de 16 caracteres.
            </p>
            <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto">
{`SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="seuemail@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_FROM="VMASYS <seuemail@gmail.com>"`}
            </pre>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-sky-900 block">Opção 4: Hospedagem Padrão (cPanel / Hostgator)</span>
            <p className="text-slate-500 text-[11px]">
              Qualquer conta de e-mail corporativo vinculada ao seu domínio.
            </p>
            <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto">
{`SMTP_HOST="mail.vmasys.com.br"
SMTP_PORT="465"
SMTP_USER="contato@vmasys.com.br"
SMTP_PASS="sua_senha_do_email"
SMTP_FROM="VMASYS <contato@vmasys.com.br>"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

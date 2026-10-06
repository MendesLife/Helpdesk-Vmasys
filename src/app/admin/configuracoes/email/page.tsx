import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmailSettingsClient from "./EmailSettingsClient";
import { Mail, ShieldCheck } from "lucide-react";

export default async function EmailConfigPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const isConfigured = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_USER.trim() !== ""
  );

  const currentSettings = {
    isConfigured,
    host: process.env.SMTP_HOST || "",
    port: process.env.SMTP_PORT || "587",
    user: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***` : "",
    from: process.env.SMTP_FROM || `"${process.env.NEXT_PUBLIC_APP_NAME || "VMASYS"}" <atendimento@vmasys.com.br>`,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <Mail className="w-6 h-6 text-sky-600" />
          <span>Configuração de E-mails & Notificações</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie o envio real de notificações aos clientes e teste as credenciais SMTP.
        </p>
      </div>

      <EmailSettingsClient currentSettings={currentSettings} />
    </div>
  );
}

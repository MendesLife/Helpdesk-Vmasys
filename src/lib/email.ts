import nodemailer from "nodemailer";

export interface SendNotificationEmailProps {
  to: string;
  recipientName: string;
  subject: string;
  title: string;
  message: string;
  ticketNumber: number;
  ticketTitle: string;
  actionUrl: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

function buildHtmlTemplate({
  recipientName,
  title,
  message,
  ticketNumber,
  ticketTitle,
  actionUrl,
}: Omit<SendNotificationEmailProps, "to" | "subject">) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "VMASYS";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #0f172a;
    }
    .wrapper {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      padding: 30px 40px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #bae6fd;
    }
    .content {
      padding: 36px 40px;
    }
    .ticket-badge {
      display: inline-block;
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      color: #0369a1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 12px;
    }
    .message-box {
      background-color: #f8fafc;
      border-left: 4px solid #0284c7;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .btn {
      display: inline-block;
      background-color: #0284c7;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      padding: 20px 40px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${appName}</h1>
      <p>Portal do Cliente & Central de Atendimento</p>
    </div>
    <div class="content">
      <div class="ticket-badge">Chamado #${ticketNumber}</div>
      <div class="greeting">Olá, ${recipientName}!</div>
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">${title}</h2>
      
      <p style="font-size: 14px; color: #64748b; margin-bottom: 8px;">
        Referente à solicitação: <strong>${ticketTitle}</strong>
      </p>

      <div class="message-box">
        ${message.replace(/\n/g, "<br/>")}
      </div>

      <div class="btn-container">
        <a href="${actionUrl}" class="btn" target="_blank">Acessar Solicitação no Portal &rarr;</a>
      </div>
      
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px;">
        Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br/>
        <a href="${actionUrl}" style="color: #0284c7; word-break: break-all;">${actionUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">
        ${appName} • Sistema de Suporte e Manutenção de Sites por Assinatura<br/>
        Este é um e-mail transacional automático.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Disparador de e-mails transacionais do HelpDesk.
 * Se SMTP estiver configurado no .env, envia e-mail real com HTML responsivo.
 * Se não estiver configurado, loga a mensagem no console em modo de simulação.
 */
export async function sendNotificationEmail({
  to,
  recipientName,
  subject,
  title,
  message,
  ticketNumber,
  ticketTitle,
  actionUrl,
}: SendNotificationEmailProps) {
  const transporter = getTransporter();
  const from =
    process.env.SMTP_FROM ||
    `"${process.env.NEXT_PUBLIC_APP_NAME || "VMASYS"}" <atendimento@vmasys.com.br>`;

  console.log(`\n======================================================`);
  console.log(`📧 [${process.env.NEXT_PUBLIC_APP_NAME || "VMASYS"} • NOTIFICAÇÃO POR E-MAIL]`);
  console.log(`De: ${from}`);
  console.log(`Para: ${recipientName} <${to}>`);
  console.log(`Assunto: ${subject}`);
  console.log(`Chamado: #${ticketNumber} - ${ticketTitle}`);
  console.log(`Mensagem: ${message}`);
  console.log(`Link Direto: ${actionUrl}`);
  console.log(`======================================================\n`);

  if (!transporter) {
    return { success: true, simulated: true };
  }

  try {
    const html = buildHtmlTemplate({
      recipientName,
      title,
      message,
      ticketNumber,
      ticketTitle,
      actionUrl,
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: `${title}\n\nOlá, ${recipientName}!\n\nChamado #${ticketNumber} - ${ticketTitle}\n\n${message}\n\nAcesse: ${actionUrl}`,
      html,
    });

    console.log(`✓ E-mail enviado com sucesso para ${to}. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, simulated: false };
  } catch (error: any) {
    console.error("❌ Falha no envio do e-mail via SMTP:", error);
    return { success: false, error: error.message || error, simulated: false };
  }
}

/**
 * Função utilitária para testar conexão com o servidor SMTP
 */
export async function testSmtpConnection() {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      configured: false,
      message: "SMTP não configurado no arquivo .env (SMTP_HOST ou SMTP_USER ausentes).",
    };
  }

  try {
    await transporter.verify();
    return { configured: true, valid: true, message: "Conexão com servidor SMTP estabelecida com sucesso!" };
  } catch (err: any) {
    return { configured: true, valid: false, message: `Erro ao conectar no SMTP: ${err.message}` };
  }
}

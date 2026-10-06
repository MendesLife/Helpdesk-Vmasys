const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Carrega .env manualmente
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

console.log("Configurações:");
console.log("Host:", process.env.SMTP_HOST);
console.log("Port:", process.env.SMTP_PORT);
console.log("User:", process.env.SMTP_USER);
console.log("From:", process.env.SMTP_FROM);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function main() {
  try {
    console.log("\n1. Verificando autenticação no servidor SMTP...");
    await transporter.verify();
    console.log("✓ Autenticação SMTP APROVADA!");

    console.log("\n2. Tentando disparar e-mail de teste...");
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "VMASYS <suporte@vmasys.com>",
      to: "studiovmasys@gmail.com",
      subject: "VMASYS • Teste de Conexão SMTP Bem-Sucedido!",
      text: "Olá! O envio de e-mails via Resend SMTP foi configurado e testado com sucesso no VMASYS HelpDesk.",
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0284c7; margin-top: 0;">VMASYS • Notificação de Sucesso</h2>
          <p>Seus disparos de e-mail via <strong>Resend SMTP</strong> estão funcionando perfeitamente!</p>
          <p style="color: #64748b; font-size: 13px;">Data: ${new Date().toLocaleString("pt-BR")}</p>
        </div>
      `,
    });

    console.log("✓ E-MAIL ENVIADO COM SUCESSO!");
    console.log("Message ID:", info.messageId);
    console.log("Resposta do Resend:", info.response);
  } catch (err) {
    console.error("\n❌ ERRO NO TESTE:");
    console.error("Mensagem:", err.message);
    if (err.response) {
      console.error("Detalhes do servidor:", err.response);
    }
  }
}

main();

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VMASYS • Portal do Cliente & Help Desk",
  description: "Portal do Cliente e Central de Atendimento para Manutenção de Sites por Assinatura - VMASYS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}

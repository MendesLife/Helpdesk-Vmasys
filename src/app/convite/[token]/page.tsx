import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AcceptInvitationForm from "./AcceptInvitationForm";
import { Sparkles, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";

interface InvitationPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { company: true },
  });

  if (!invite) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Convite Inválido</h2>
          <p className="mt-2 text-sm text-slate-600 mb-6">
            O link de convite que você tentou acessar não existe ou foi removido.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Ir para a tela de login
          </Link>
        </div>
      </div>
    );
  }

  if (invite.acceptedAt) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">
            Convite Já Utilizado
          </h2>
          <p className="mt-2 text-sm text-slate-600 mb-6">
            Este convite já foi aceito e a conta associada já está ativa.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Fazer Login com sua conta
          </Link>
        </div>
      </div>
    );
  }

  if (new Date() > invite.expiresAt) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Convite Expirado</h2>
          <p className="mt-2 text-sm text-slate-600 mb-6">
            Este link de convite expirou. Por favor, solicite ao administrador da
            agência um novo convite.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Ativação de Conta
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Você foi convidado para acessar o portal do cliente
        </p>

        {invite.company && (
          <div className="mt-4 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Building2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Empresa: {invite.company.name}</span>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-100 rounded-2xl border border-slate-200/80 sm:px-10">
          <AcceptInvitationForm token={token} email={invite.email} />
        </div>
      </div>
    </div>
  );
}

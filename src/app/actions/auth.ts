"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  verifyPassword,
  getSession,
} from "@/lib/auth";
import { redirect } from "next/navigation";

const LoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export type LoginState = {
  success?: boolean;
  error?: string;
  redirectTo?: string;
};

export async function loginAction(
  prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  const validated = LoginSchema.safeParse({ email, password });
  if (!validated.success) {
    return {
      error: validated.error.errors[0]?.message || "Dados de login inválidos.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: validated.data.email.toLowerCase() },
      include: {
        company: true,
        companyMemberships: {
          include: { company: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return { error: "Credenciais inválidas ou acesso desativado pelo administrador." };
    }

    let activeCompany = user.company;

    // Se for perfil de cliente, valida empresas acessíveis e status
    if (user.role === "CLIENT") {
      const accessibleCompanies = [
        ...(user.company ? [user.company] : []),
        ...user.companyMemberships.map((m) => m.company),
      ].filter((c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx);

      if (accessibleCompanies.length === 0) {
        return { error: "Usuário não possui uma empresa vinculada ativa." };
      }

      // Prioriza a empresa ativa, ou a primeira que estiver ACTIVE
      activeCompany =
        accessibleCompanies.find((c) => c.id === user.companyId && c.status === "ACTIVE") ||
        accessibleCompanies.find((c) => c.status === "ACTIVE") ||
        accessibleCompanies[0];

      if (activeCompany.status === "SUSPENDED") {
        return {
          error:
            "O acesso da sua empresa está temporariamente suspenso. Entre em contato com a equipe VMASYS.",
        };
      }
      if (activeCompany.status === "CANCELLED") {
        return {
          error:
            "O contrato da sua empresa foi cancelado. Entre em contato com a equipe VMASYS.",
        };
      }
    }

    // Proteção contra ataques de força bruta
    if (user.failedLoginAttempts >= 5) {
      return {
        error:
          "Conta temporariamente bloqueada por excesso de tentativas incorretas. Contate o administrador.",
      };
    }

    const isMatch = await verifyPassword(
      validated.data.password,
      user.passwordHash
    );

    if (!isMatch) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });
      return { error: "Credenciais inválidas." };
    }

    // Sucesso no login: resetar contador e atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "EQUIPE" | "CLIENT",
      companyId: activeCompany?.id || user.companyId,
      companyName: activeCompany?.name || user.company?.name || null,
    });

    await setSessionCookie(token);

    const destination =
      user.role === "CLIENT" ? "/portal/dashboard" : "/admin/dashboard";

    return {
      success: true,
      redirectTo: destination,
    };
  } catch (err: any) {
    console.error("Erro durante autenticação:", err);
    return { error: "Erro interno no servidor ao realizar login." };
  }
}

export async function switchCompanyAction(targetCompanyId: string) {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") {
    return { error: "Não autorizado." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        company: true,
        companyMemberships: {
          include: { company: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return { error: "Usuário inativo ou não encontrado." };
    }

    const accessible = [
      ...(user.company ? [user.company] : []),
      ...user.companyMemberships.map((m) => m.company),
    ].find((c) => c.id === targetCompanyId);

    if (!accessible) {
      return { error: "Você não possui acesso a esta empresa." };
    }

    if (accessible.status === "SUSPENDED") {
      return { error: "O acesso a esta empresa está temporariamente suspenso." };
    }
    if (accessible.status === "CANCELLED") {
      return { error: "O contrato desta empresa foi cancelado." };
    }

    const newToken = await createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: "CLIENT",
      companyId: accessible.id,
      companyName: accessible.name,
    });

    await setSessionCookie(newToken);
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao alternar empresa:", err);
    return { error: "Erro ao alternar empresa." };
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

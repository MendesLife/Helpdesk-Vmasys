"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  verifyPassword,
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
      },
    });

    if (!user || !user.isActive) {
      return { error: "Credenciais inválidas ou conta inativa." };
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
      companyId: user.companyId,
      companyName: user.company?.name || null,
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

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

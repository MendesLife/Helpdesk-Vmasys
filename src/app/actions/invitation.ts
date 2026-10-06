"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

const AcceptInviteSchema = z.object({
  token: z.string().min(1, "Token inválido"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export async function acceptInvitationAction(formData: FormData) {
  const token = formData.get("token")?.toString();
  const name = formData.get("name")?.toString();
  const password = formData.get("password")?.toString();

  const validated = AcceptInviteSchema.safeParse({ token, name, password });
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || "Dados inválidos." };
  }

  try {
    const invite = await prisma.invitation.findUnique({
      where: { token: validated.data.token },
      include: { company: true },
    });

    if (!invite) {
      return { error: "Convite não encontrado ou inválido." };
    }

    if (invite.acceptedAt) {
      return { error: "Este convite já foi aceito anteriormente." };
    }

    if (new Date() > invite.expiresAt) {
      return { error: "Este convite expirou. Solicite um novo envio." };
    }

    // Verifica se já existe um usuário com este e-mail
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email.toLowerCase() },
    });

    if (existingUser) {
      return { error: "Já existe uma conta ativa com este e-mail." };
    }

    const passwordHash = await hashPassword(validated.data.password);

    // Cria o usuário
    const newUser = await prisma.user.create({
      data: {
        name: validated.data.name,
        email: invite.email.toLowerCase(),
        passwordHash,
        role: invite.role,
        companyId: invite.companyId,
      },
    });

    // Marca o convite como aceito
    await prisma.invitation.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    // Gera sessão e faz login automático
    const sessionToken = await createSessionToken({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as "ADMIN" | "EQUIPE" | "CLIENT",
      companyId: newUser.companyId,
      companyName: invite.company?.name || null,
    });

    await setSessionCookie(sessionToken);

    return {
      success: true,
      redirectTo:
        newUser.role === "CLIENT" ? "/portal/dashboard" : "/admin/dashboard",
    };
  } catch (err: any) {
    console.error("Erro ao aceitar convite:", err);
    return { error: "Erro interno ao processar o convite." };
  }
}

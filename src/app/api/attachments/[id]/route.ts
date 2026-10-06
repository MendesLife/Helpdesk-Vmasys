import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      ticket: true,
      comment: true,
    },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  // ISOLAMENTO MULTI-TENANT PARA ARQUIVOS
  if (session.role === "CLIENT") {
    // 1. Se o arquivo estiver associado a uma nota interna, o cliente JAMAIS pode baixar
    if (attachment.comment?.isInternal) {
      return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
    }

    // 2. Se o ticket for de outra empresa, bloqueia
    const ticketCompanyId =
      attachment.ticket?.companyId || attachment.comment?.ticketId;
    if (attachment.ticket && attachment.ticket.companyId !== session.companyId) {
      return NextResponse.json(
        { error: "Acesso negado a este arquivo." },
        { status: 403 }
      );
    }
  }

  const uploadDir = path.resolve(
    process.cwd(),
    process.env.UPLOAD_DIR || "./uploads"
  );
  const filePath = path.join(uploadDir, attachment.storedName);

  try {
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": attachment.fileType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          attachment.fileName
        )}"`,
        "Content-Length": attachment.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Erro ao ler arquivo do disco:", error);
    return NextResponse.json(
      { error: "Arquivo físico não encontrado no servidor." },
      { status: 404 }
    );
  }
}

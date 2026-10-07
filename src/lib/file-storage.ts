import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface StoredFileInfo {
  fileName: string;
  storedName: string;
  fileType: string;
  fileSize: number;
}

export async function saveUploadedFile(file: File): Promise<StoredFileInfo> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `O arquivo excede o limite máximo permitido de 10MB (${(
        file.size /
        (1024 * 1024)
      ).toFixed(1)}MB).`
    );
  }

  // Se o tipo MIME não for informado pelo navegador, infere pela extensão
  let mimeType = file.type;
  const ext = path.extname(file.name).toLowerCase();
  if (!mimeType) {
    if (ext === ".pdf") mimeType = "application/pdf";
    else if (ext === ".png") mimeType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else if (ext === ".zip") mimeType = "application/zip";
  }

  const isAllowed = ALLOWED_MIME_TYPES.some(
    (allowed) => mimeType.toLowerCase().includes(allowed) || allowed.includes(mimeType.toLowerCase())
  );

  if (!isAllowed && ext !== ".pdf" && ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg" && ext !== ".zip" && ext !== ".docx") {
    throw new Error(
      `Tipo de arquivo não permitido (${ext || mimeType}). Formatos aceitos: JPG, PNG, WEBP, PDF, DOCX, ZIP.`
    );
  }

  const defaultUploadDir = process.env.VERCEL ? "/tmp" : "./uploads";
  const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || defaultUploadDir);
  await fs.mkdir(uploadDir, { recursive: true });

  const randomHash = crypto.randomBytes(16).toString("hex");
  const storedName = `${Date.now()}-${randomHash}${ext}`;
  const filePath = path.join(uploadDir, storedName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filePath, buffer);

  return {
    fileName: file.name,
    storedName,
    fileType: mimeType || "application/octet-stream",
    fileSize: file.size,
  };
}

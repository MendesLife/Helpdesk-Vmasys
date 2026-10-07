/**
 * Script de preparação automática de banco de dados para Deploy.
 * Detecta se a DATABASE_URL aponta para PostgreSQL (produção) ou SQLite (dev local)
 * e atualiza o provider no prisma/schema.prisma antes da compilação.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let dbUrl = process.env.DATABASE_URL || "";

// Se não estiver injetado no ambiente, carrega do arquivo .env
if (!dbUrl) {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (match) {
      dbUrl = match[1].trim();
    }
  }
}

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.log("schema.prisma não encontrado.");
  process.exit(0);
}

let schema = fs.readFileSync(schemaPath, "utf8");
const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

if (isPostgres) {
  console.log("⚡ [DEPLOY] DATABASE_URL PostgreSQL detectada.");
  if (schema.includes('provider = "sqlite"')) {
    console.log('🔄 Atualizando schema.prisma: provider = "postgresql"...');
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema, "utf8");
    console.log("✓ Schema atualizado para PostgreSQL.");
  }
} else {
  console.log("📁 [DEV/LOCAL] DATABASE_URL SQLite ativa.");
  if (schema.includes('provider = "postgresql"')) {
    console.log('🔄 Revertendo schema.prisma: provider = "sqlite"...');
    schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');
    fs.writeFileSync(schemaPath, schema, "utf8");
    console.log("✓ Schema atualizado para SQLite.");
  }
}

// Regenera o cliente Prisma
try {
  console.log("📦 Gerando Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (e) {
  console.error("Falha ao gerar Prisma Client:", e.message);
}

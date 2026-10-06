import { SessionPayload } from "./auth";

export class TenantAccessError extends Error {
  statusCode: number;
  constructor(message = "Acesso negado: isolamento de dados entre empresas.") {
    super(message);
    this.name = "TenantAccessError";
    this.statusCode = 403;
  }
}

/**
 * Valida se a sessão atual tem permissão para acessar dados da empresa solicitada.
 * Admins e membros da Equipe têm acesso a todas as empresas.
 * Clientes SÓ podem acessar a sua própria empresa (session.companyId).
 */
export function validateTenantAccess(
  session: SessionPayload,
  targetCompanyId: string
): boolean {
  if (session.role === "ADMIN" || session.role === "EQUIPE") {
    return true;
  }

  if (session.role === "CLIENT") {
    if (!session.companyId || session.companyId !== targetCompanyId) {
      throw new TenantAccessError(
        "Acesso negado: você não tem permissão para visualizar dados de outra empresa."
      );
    }
    return true;
  }

  throw new TenantAccessError();
}

/**
 * Gera a cláusula Prisma WHERE segura para buscar chamados.
 * Se for CLIENTE, força a consulta a trazer APENAS chamados da sua empresa.
 */
export function getTenantTicketFilter(session: SessionPayload) {
  if (session.role === "CLIENT") {
    if (!session.companyId) {
      throw new TenantAccessError("Usuário cliente sem empresa vinculada.");
    }
    return { companyId: session.companyId };
  }
  return {};
}

/**
 * Clientes NUNCA devem ver notas internas da agência.
 */
export function canViewInternalNotes(session: SessionPayload): boolean {
  return session.role === "ADMIN" || session.role === "EQUIPE";
}

/**
 * Apenas o ADMIN geral da agência pode gerenciar outros admins ou excluir dados críticos.
 */
export function canManageAgencySettings(session: SessionPayload): boolean {
  return session.role === "ADMIN";
}

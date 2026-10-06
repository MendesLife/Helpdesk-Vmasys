import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production-antigravity"
);

const COOKIE_NAME = "helpdesk_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let session: { role: string; companyId?: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload as { role: string; companyId?: string };
    } catch {
      session = null;
    }
  }

  // Se já estiver logado e acessar /login ou raiz /, redireciona para a área correspondente
  if (pathname === "/login" || pathname === "/") {
    if (session) {
      if (session.role === "CLIENT") {
        return NextResponse.redirect(new URL("/portal/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Proteção da área do Portal do Cliente (/portal/*)
  if (pathname.startsWith("/portal")) {
    if (!session) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
      );
    }
    // Se for admin/equipe acessando o portal, permite para visualizar
    return NextResponse.next();
  }

  // Proteção da área Administrativa (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
      );
    }
    // SEGURANÇA CRÍTICA: CLIENTE NUNCA ACESSA /ADMIN
    if (session.role === "CLIENT") {
      return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/portal/:path*", "/admin/:path*"],
};

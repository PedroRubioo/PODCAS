import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  tipoUser: string;
  chrCarrera: string;
  claveCA: string;
};

export async function requireSession(): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      ),
    };
  }
  return { ok: true, user };
}

export async function requireRole(allowed: string[]): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse }
> {
  const result = await requireSession();
  if (!result.ok) return result;
  if (!allowed.includes(result.user.tipoUser)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Acceso denegado" },
        { status: 403 },
      ),
    };
  }
  return result;
}

export function apiError(error: unknown, context?: string) {
  console.error(`[API ERROR]${context ? ` ${context}` : ""}`, error);
  return NextResponse.json(
    { success: false, error: "Error interno del servidor" },
    { status: 500 },
  );
}

export function boundedLimit(raw: string | null, fallback = 100, max = 500) {
  const n = Number.parseInt(raw ?? "");
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

export function checkOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!origin && !referer) return true;
  if (origin && origin === allowed) return true;
  if (referer && referer.startsWith(allowed)) return true;
  return false;
}

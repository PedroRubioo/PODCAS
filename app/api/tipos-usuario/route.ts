import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const pool = await getConnection();
    const result = await pool.request().execute("sp_CA_ObtenerTipoUsuario");
    const data = (result.recordset ?? []).map((r: Record<string, unknown>) => ({
      intClvTipoUsuario: String(r.intClvTipoUsuario ?? ""),
      vchTipoUsuario: String(r.vchTipoUsuario ?? ""),
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return apiError(error, "GET /api/tipos-usuario");
  }
}

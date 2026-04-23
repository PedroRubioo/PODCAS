import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/roles";

export async function GET() {
  const session = await requireRole([ROLE.ADMIN]);
  if (!session.ok) return session.response;

  try {
    const pool = await getConnection();
    const result = await pool.request().execute("sp_CA_ObtenerCarreras");
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return apiError(error, "GET /api/admin/usuarios/carreras");
  }
}

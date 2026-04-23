import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, requireRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/roles";

export async function GET() {
  const session = await requireRole([ROLE.ADMIN]);
  if (!session.ok) return session.response;

  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("limit", sql.Int, 200)
      .query(
        "SELECT TOP (@limit) intClvPerfilPROMEP, vchNombrePerfil FROM tbl_CA_PerfilesPROMEP",
      );
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return apiError(error, "GET /api/admin/usuarios/perfiles");
  }
}

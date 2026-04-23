import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, requireRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/roles";

export async function GET(request: Request) {
  const session = await requireRole([ROLE.ADMIN]);
  if (!session.ok) return session.response;

  try {
    const { searchParams } = new URL(request.url);
    const carrera = (searchParams.get("carrera") ?? "").slice(0, 32);
    if (!carrera) {
      return NextResponse.json(
        { success: false, error: "carrera requerida" },
        { status: 400 },
      );
    }
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("clave", sql.VarChar, carrera)
      .execute("sp_CA_ObtenerDocentesPorCarrera");
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return apiError(error, "GET /api/admin/usuarios/docentes");
  }
}

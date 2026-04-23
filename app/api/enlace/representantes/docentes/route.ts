import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, requireRole } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const session = await requireRole(["2"]);
  if (!session.ok) return session.response;

  try {
    const { searchParams } = new URL(request.url);
    const clave = (searchParams.get("clave") ?? "").slice(0, 32);

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("clave", sql.VarChar, clave)
      .execute("sp_CA_ObtenerDocentesPorCarrera");

    const data = (result.recordset ?? []).map((row: Record<string, unknown>) => {
      const keys = Object.keys(row);
      const idKey = keys.find((k) => !k.toLowerCase().includes("nombre")) ?? keys[0];
      const nombreKey =
        keys.find((k) => k.toLowerCase().includes("nombre")) ?? keys[1] ?? keys[0];
      return {
        id: String(row[idKey] ?? ""),
        nombre: String(row[nombreKey] ?? ""),
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return apiError(error, "GET /api/enlace/representantes/docentes");
  }
}

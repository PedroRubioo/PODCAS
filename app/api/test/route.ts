import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { apiError, requireSession } from "@/lib/api-helpers";

export async function GET() {
  // Endpoint de diagnóstico — solo accesible con sesión iniciada.
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query("SELECT TOP 1 intClvPublicacion FROM tbl_CA_Publicaciones");
    return NextResponse.json({
      success: true,
      ok: true,
      rows: result.recordset.length,
    });
  } catch (error) {
    return apiError(error, "GET /api/test");
  }
}

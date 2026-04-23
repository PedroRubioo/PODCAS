import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, boundedLimit } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = boundedLimit(searchParams.get("limit"), 100, 500);
    const pool = await getConnection();

    const result = await pool
      .request()
      .input("limit", sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          intClvPublicacion,
          vchNombrePublicacion,
          dtmFechaPublicacion,
          vchDescripcion,
          vchRutaImagenPublicacion
        FROM tbl_CA_Publicaciones
        ORDER BY dtmFechaPublicacion DESC
      `);
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return apiError(error, "GET /api/publicaciones");
  }
}

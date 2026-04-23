import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, boundedLimit } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = boundedLimit(searchParams.get("limit"), 500, 1000);
    const pool = await getConnection();

    const result = await pool
      .request()
      .input("limit", sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          tbl_CA_CuerposAcademicos.id,
          tbl_CA_CuerposAcademicos.vchClvCA,
          UPPER(tbl_CA_CuerposAcademicos.vchNombreCA) AS vchNombreCA,
          tbl_CA_CuerposAcademicos.ImagenLogo,
          tblDepartamentos.vchNomDpto
        FROM tbl_CA_CuerposAcademicos
        INNER JOIN tblDepartamentos
          ON tbl_CA_CuerposAcademicos.chrCarrera = tblDepartamentos.chrClvDpto
      `);
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return apiError(error, "GET /api/lineas");
  }
}

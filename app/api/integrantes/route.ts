import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clvCA = (searchParams.get("clvCA") ?? "").slice(0, 32);
    if (!clvCA) {
      return NextResponse.json(
        { success: false, error: "clvCA requerido" },
        { status: 400 },
      );
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("clvCA", sql.VarChar, clvCA)
      .query(`
        SELECT DISTINCT
          tbl_CA_CATrabajador.vchClvTrabajador AS clave,
          tblTrabajadores.vchAPaterno + ' ' + tblTrabajadores.vchAMaterno + ' ' + tblTrabajadores.vchNombre AS nombre,
          CASE
            WHEN tbl_CA_CATrabajador.vchEmailPersonal IS NULL OR tbl_CA_CATrabajador.vchEmailPersonal = '' THEN 0
            ELSE 1
          END AS tieneCorreo
        FROM tbl_CA_CATrabajador
        INNER JOIN tblTrabajadores ON tbl_CA_CATrabajador.vchClvTrabajador = tblTrabajadores.vchClvTrabajador
        WHERE tbl_CA_CATrabajador.vchClvCA = @clvCA
          AND tbl_CA_CATrabajador.intClvTipoUsuario IN ('3', '6')
      `);
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return apiError(error, "GET /api/integrantes");
  }
}

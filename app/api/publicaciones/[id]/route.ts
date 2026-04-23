import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError } from "@/lib/api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const idNum = Number.parseInt(id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 },
      );
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("id", sql.Int, idNum)
      .query(`
        SELECT
          intClvPublicacion,
          vchNombrePublicacion,
          dtmFechaPublicacion,
          vchDescripcion,
          vchRutaImagenPublicacion,
          vchRutaImagen1,
          vchRutaImagen2,
          tblTrabajadores.vchNombre,
          tblTrabajadores.vchAPaterno,
          tblTrabajadores.vchAMaterno
        FROM tbl_CA_Publicaciones
        INNER JOIN tblTrabajadores
          ON tbl_CA_Publicaciones.vchClvTrabajador = tblTrabajadores.vchClvTrabajador
        WHERE intClvPublicacion = @id
      `);
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: "No encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    return apiError(error, "GET /api/publicaciones/[id]");
  }
}

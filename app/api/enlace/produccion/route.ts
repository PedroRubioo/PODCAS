import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, requireRole } from "@/lib/api-helpers";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const session = await requireRole(["2"]);
  if (!session.ok) return session.response;

  try {
    const { searchParams } = new URL(request.url);
    const claveCA = (searchParams.get("ca") ?? "").slice(0, 32);
    const docente = (searchParams.get("docente") ?? "").slice(0, 32);
    const status = (searchParams.get("status") ?? "").slice(0, 16);
    const tipoProducto = (searchParams.get("tipo") ?? "").slice(0, 16);
    const fechaInicio = (searchParams.get("fechaInicio") ?? "").slice(0, 10);
    const fechaFin = (searchParams.get("fechaFin") ?? "").slice(0, 10);

    const pool = await getConnection();
    const req = pool.request();

    let where = "WHERE 1=1";
    if (claveCA) {
      where += " AND [CLAVE CA] = @ca";
      req.input("ca", sql.VarChar, claveCA);
    }
    if (docente) {
      where += " AND [NO. TRABAJADOR] = @docente";
      req.input("docente", sql.VarChar, docente);
    }
    if (status) {
      where += " AND [ID STATUS] = @status";
      req.input("status", sql.VarChar, status);
    }
    if (tipoProducto) {
      where += " AND [TIPO PRODUCTO] = @tipo";
      req.input("tipo", sql.VarChar, tipoProducto);
    }
    if (fechaInicio && ISO_DATE.test(fechaInicio)) {
      where += " AND CAST([FECHA REGISTRO] AS DATE) >= @fi";
      req.input("fi", sql.Date, fechaInicio);
    }
    if (fechaFin && ISO_DATE.test(fechaFin)) {
      where += " AND CAST([FECHA REGISTRO] AS DATE) <= @ff";
      req.input("ff", sql.Date, fechaFin);
    }

    const produccion = await req.query(
      `SELECT * FROM view_CA_ProduccionAcademica ${where} ORDER BY [FECHA REGISTRO] DESC`,
    );

    const [cuerpos, statusCat, tiposCat] = await Promise.all([
      pool
        .request()
        .query(
          "SELECT vchClvCA, vchNombreCA FROM tbl_CA_CuerposAcademicos ORDER BY vchNombreCA",
        ),
      pool.request().query("SELECT intClvStatus, vchNombreStatus FROM tbl_CA_Status"),
      pool.request().query("SELECT intClvProducto, vchNombreProducto FROM tbl_CA_Productos"),
    ]);

    return NextResponse.json({
      success: true,
      data: produccion.recordset,
      catalogos: {
        cuerpos: cuerpos.recordset,
        status: statusCat.recordset,
        tipos: tiposCat.recordset,
      },
    });
  } catch (error) {
    return apiError(error, "GET /api/enlace/produccion");
  }
}

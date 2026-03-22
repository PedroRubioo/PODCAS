import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sql from "mssql";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const usuario = session.user.id as string;
    const claveCA = (session.user as any).claveCA as string;

    const pool = await getConnection();

    const [trabajador, dpto, imagen, cuerpo, statsProduccion, statsMiembros] = await Promise.all([
      pool.request()
        .input("u", sql.VarChar, usuario)
        .query("SELECT vchNombre, vchAPaterno, vchAMaterno, descripcion_puesto FROM tblTrabajadores WHERE vchClvTrabajador = @u"),
      pool.request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT DISTINCT Dep.vchNomDpto FROM tblDepartamentos AS Dep
          INNER JOIN tblCarreras Carr ON Dep.chrClvDpto = Carr.chrClvDpto
          INNER JOIN tblTrabajadores ON tblTrabajadores.chrClvDptoTrab = Dep.chrClvDpto
          WHERE Dep.chrClvDpto <> '00' AND Carr.bitActiva = 1 AND tblTrabajadores.vchClvTrabajador = @u`),
      pool.request()
        .input("u", sql.VarChar, usuario)
        .query("SELECT ISNULL(ImagenPerfil,'sin imagen.jpg') AS ImagenPerfil FROM tbl_CA_CATrabajador WHERE vchClvTrabajador = @u"),
      pool.request()
        .input("c", sql.VarChar, claveCA)
        .query("SELECT vchNombreCA FROM tbl_CA_CuerposAcademicos WHERE vchClvCA = @c"),
      pool.request()
        .input("u", sql.VarChar, usuario)
        .query("SELECT COUNT(*) AS total FROM tbl_CA_Produccion WHERE vchClvTrabajador = @u"),
      pool.request()
        .input("c", sql.VarChar, claveCA)
        .query("SELECT COUNT(*) AS total FROM tbl_CA_CATrabajador WHERE vchClvCA = @c"),
    ]);

    const recientes = await pool.request()
      .input("u", sql.VarChar, usuario)
      .query(`SELECT TOP 3 pr.intClvProduccion, pr.vchTituloProducto, p.vchNombreProducto,
        pr.dtmFechaRegistro, s.vchNombreStatus
        FROM tbl_CA_Produccion pr
        INNER JOIN tbl_CA_Productos p ON p.intClvProducto = pr.intClvProducto
        INNER JOIN tbl_CA_Status s ON s.intClvStatus = pr.intStatus
        WHERE pr.vchClvTrabajador = @u
        ORDER BY pr.dtmFechaRegistro DESC`);

    const row = trabajador.recordset[0];
    return NextResponse.json({
      success: true,
      data: {
        nombre: row ? `${row.vchNombre} ${row.vchAPaterno} ${row.vchAMaterno}`.trim() : "",
        descripcionPuesto: row?.descripcion_puesto ?? "",
        departamento: dpto.recordset[0]?.vchNomDpto ?? "",
        imagenPerfil: imagen.recordset[0]?.ImagenPerfil ?? "sin imagen.jpg",
        nombreCA: cuerpo.recordset[0]?.vchNombreCA ?? "",
        claveCA,
        totalProduccion: statsProduccion.recordset[0]?.total ?? 0,
        totalMiembros: statsMiembros.recordset[0]?.total ?? 0,
        produccionReciente: recientes.recordset,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

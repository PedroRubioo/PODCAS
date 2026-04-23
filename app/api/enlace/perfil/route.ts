import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, checkOrigin, requireRole } from "@/lib/api-helpers";
import { saveUpload } from "@/lib/safe-upload";

export async function GET() {
  const session = await requireRole(["2"]);
  if (!session.ok) return session.response;

  try {
    const usuario = session.user.id;
    const pool = await getConnection();

    const [trabajador, dpto, imagen] = await Promise.all([
      pool
        .request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT vchNombre, vchAPaterno, vchAMaterno, descripcion_puesto
                FROM tblTrabajadores WHERE vchClvTrabajador = @u`),
      pool
        .request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT DISTINCT Dep.chrClvDpto AS clave, Dep.vchNomDpto AS departamento
                FROM tblDepartamentos AS Dep
                INNER JOIN tblCarreras Carr ON Dep.chrClvDpto = Carr.chrClvDpto
                INNER JOIN tblTrabajadores T ON T.chrClvDptoTrab = Dep.chrClvDpto
                WHERE Dep.chrClvDpto <> '00' AND Carr.bitActiva = 1
                  AND T.vchClvTrabajador = @u`),
      pool
        .request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT ISNULL(ImagenPerfil, 'sin imagen.jpg') AS ImagenPerfil
                FROM tbl_CA_CATrabajador WHERE vchClvTrabajador = @u`),
    ]);

    const t = trabajador.recordset[0];
    const d = dpto.recordset[0];
    const img = imagen.recordset[0];

    return NextResponse.json({
      success: true,
      data: {
        nombre: t
          ? [t.vchNombre, t.vchAPaterno, t.vchAMaterno].filter(Boolean).join(" ")
          : "",
        descripcion: t?.descripcion_puesto ?? "",
        departamento: d?.departamento ?? "",
        imagen: img?.ImagenPerfil ?? "sin imagen.jpg",
      },
    });
  } catch (error) {
    return apiError(error, "GET /api/enlace/perfil");
  }
}

export async function PUT(request: Request) {
  const session = await requireRole(["2"]);
  if (!session.ok) return session.response;
  if (!checkOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Origen no permitido" },
      { status: 403 },
    );
  }

  try {
    const usuario = session.user.id;
    const formData = await request.formData();
    const archivo = formData.get("imagen");
    if (!(archivo instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Archivo requerido" },
        { status: 400 },
      );
    }

    const upload = await saveUpload({
      file: archivo,
      subDir: "ImagenPerfil",
      allowedExt: ["jpg", "jpeg", "png"],
      maxBytes: 5 * 1024 * 1024,
      prefix: usuario,
    });
    if (!upload.ok) {
      return NextResponse.json(
        { success: false, error: upload.error },
        { status: upload.status },
      );
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("img", sql.VarChar, upload.filename)
      .input("u", sql.VarChar, usuario)
      .query(
        `UPDATE tbl_CA_CATrabajador SET ImagenPerfil = @img WHERE vchClvTrabajador = @u`,
      );

    if (result.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontró el registro del usuario" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, imagen: upload.filename });
  } catch (error) {
    return apiError(error, "PUT /api/enlace/perfil");
  }
}

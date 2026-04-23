import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, checkOrigin, requireRole } from "@/lib/api-helpers";
import { saveUpload } from "@/lib/safe-upload";

export async function GET() {
  const session = await requireRole(["3"]);
  if (!session.ok) return session.response;

  try {
    const usuario = session.user.id;
    const claveCA = session.user.claveCA;
    const pool = await getConnection();

    const [perfil, perfiles, lgac, lineas] = await Promise.all([
      pool
        .request()
        .input("p1", sql.VarChar, usuario)
        .query(`
          SELECT
            ca.ImagenLogo,
            t.dtmFchRegistro,
            ca.vchClvCA,
            ca.vchNombreCA,
            lg.intClvLGAC,
            lg.vchNombreLGAC,
            trab.vchClvTrabajador,
            trab.vchNombre,
            trab.vchAPaterno,
            trab.vchAMaterno,
            trab.chrSexoTrab,
            t.vchTelefono,
            trab.vchEmail,
            li.vchDescripcion,
            t.intClvPerfilPROMEP,
            t.dtmFchInicioPROMEP,
            t.dtmFchVencimientoPROMEP,
            t.vchEmailPersonal,
            t.intLineaInvestigacion
          FROM tbl_CA_CATrabajador t
          INNER JOIN tblTrabajadores trab ON t.vchClvTrabajador = trab.vchClvTrabajador
          LEFT JOIN tbl_CA_CuerposAcademicos ca ON t.vchClvCA = ca.vchClvCA
          LEFT JOIN tbl_CA_CALGAC lg ON ca.intClvLGAC = lg.intClvLGAC
          LEFT JOIN tbl_CA_LineaInvestigacion li ON t.intLineaInvestigacion = li.intClaveLinea
          WHERE t.vchClvTrabajador = @p1
        `),
      pool
        .request()
        .query("SELECT intClvPerfilPROMEP, vchNombrePerfil FROM tbl_CA_PerfilesPROMEP"),
      pool.request().query("SELECT intClvLGAC, vchNombreLGAC FROM tbl_CA_CALGAC"),
      pool
        .request()
        .input("claveCA", sql.VarChar, claveCA)
        .query(
          "SELECT intClaveLinea, vchDescripcion FROM tbl_CA_LineaInvestigacion WHERE vchClvCA = @claveCA",
        ),
    ]);

    return NextResponse.json({
      success: true,
      data: perfil.recordset[0] ?? null,
      catalogos: {
        perfiles: perfiles.recordset,
        lgac: lgac.recordset,
        lineas: lineas.recordset,
      },
    });
  } catch (error) {
    return apiError(error, "GET /api/miembro/perfil");
  }
}

export async function POST(request: Request) {
  const session = await requireRole(["3"]);
  if (!session.ok) return session.response;
  if (!checkOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Origen no permitido" },
      { status: 403 },
    );
  }

  try {
    const usuario = session.user.id;
    const claveCA = session.user.claveCA;

    const formData = await request.formData();
    const telefono = String(formData.get("telefono") ?? "").slice(0, 20);
    const emailPersonal = String(formData.get("emailPersonal") ?? "").slice(0, 100);
    const linea = String(formData.get("linea") ?? "").slice(0, 16);
    const perfil = String(formData.get("perfil") ?? "").slice(0, 16);
    const lgac = String(formData.get("lgac") ?? "").slice(0, 16);
    const fechaInicio = String(formData.get("fechaInicio") ?? "").slice(0, 10);
    const fechaVenc = String(formData.get("fechaVenc") ?? "").slice(0, 10);
    const imagen = formData.get("imagen");

    let nombreImagen: string | null = null;
    if (imagen instanceof File && imagen.size > 0) {
      const upload = await saveUpload({
        file: imagen,
        subDir: "uploads/perfil",
        allowedExt: ["jpg", "jpeg", "png", "bmp"],
        maxBytes: 5 * 1024 * 1024,
        prefix: usuario,
      });
      if (!upload.ok) {
        return NextResponse.json(
          { success: false, error: upload.error },
          { status: upload.status },
        );
      }
      nombreImagen = upload.filename;
    }

    const pool = await getConnection();

    const req = pool
      .request()
      .input("fechaInicio", sql.VarChar, fechaInicio)
      .input("fechaVenc", sql.VarChar, fechaVenc)
      .input("telefono", sql.VarChar, telefono)
      .input("linea", sql.VarChar, linea)
      .input("perfil", sql.VarChar, perfil)
      .input("emailPersonal", sql.VarChar, emailPersonal)
      .input("usuario", sql.VarChar, usuario);

    if (nombreImagen) req.input("imagen", sql.VarChar, nombreImagen);

    await req.query(`UPDATE tbl_CA_CATrabajador SET
      dtmFchRegistro = GETDATE(),
      dtmFchInicioPROMEP = @fechaInicio,
      dtmFchVencimientoPROMEP = @fechaVenc,
      vchTelefono = @telefono,
      intLineaInvestigacion = @linea,
      intClvPerfilPROMEP = @perfil,
      vchEmailPersonal = @emailPersonal
      ${nombreImagen ? ", ImagenPerfil = @imagen" : ""}
      WHERE vchClvTrabajador = @usuario`);

    await pool
      .request()
      .input("lgac", sql.VarChar, lgac)
      .input("claveCA", sql.VarChar, claveCA)
      .query(
        "UPDATE tbl_CA_CuerposAcademicos SET intClvLGAC = @lgac WHERE vchClvCA = @claveCA",
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "POST /api/miembro/perfil");
  }
}

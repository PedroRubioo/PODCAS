import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sql from "mssql";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const usuario = ((session.user as any).id ?? session.user.id) as string;
    const claveCA = (session.user as any).claveCA as string;

    const pool = await getConnection();

    const [perfil, perfiles, lgac, lineas] = await Promise.all([
      pool.request()
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
      pool.request().query("SELECT intClvPerfilPROMEP, vchNombrePerfil FROM tbl_CA_PerfilesPROMEP"),
      pool.request().query("SELECT intClvLGAC, vchNombreLGAC FROM tbl_CA_CALGAC"),
      pool.request()
        .input("claveCA", sql.VarChar, claveCA)
        .query("SELECT intClaveLinea, vchDescripcion FROM tbl_CA_LineaInvestigacion WHERE vchClvCA = @claveCA"),
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
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const usuario = session.user.id as string;
    const claveCA = (session.user as any).claveCA as string;

    const formData = await request.formData();
    const telefono = formData.get("telefono") as string;
    const emailPersonal = formData.get("emailPersonal") as string;
    const linea = formData.get("linea") as string;
    const perfil = formData.get("perfil") as string;
    const lgac = formData.get("lgac") as string;
    const fechaInicio = formData.get("fechaInicio") as string;
    const fechaVenc = formData.get("fechaVenc") as string;
    const imagen = formData.get("imagen") as File | null;

    let nombreImagen: string | null = null;
    if (imagen && imagen.size > 0) {
      const validExts = ["jpg", "jpeg", "png", "bmp"];
      const ext = imagen.name.split(".").pop()?.toLowerCase() ?? "";
      if (!validExts.includes(ext)) {
        return NextResponse.json({ success: false, error: "Extensión de imagen no válida" }, { status: 400 });
      }
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "perfil");
      await mkdir(uploadsDir, { recursive: true });
      nombreImagen = imagen.name;
      await writeFile(path.join(uploadsDir, nombreImagen), Buffer.from(await imagen.arrayBuffer()));
    }

    const pool = await getConnection();

    const req = pool.request()
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

    await pool.request()
      .input("lgac", sql.VarChar, lgac)
      .input("claveCA", sql.VarChar, claveCA)
      .query("UPDATE tbl_CA_CuerposAcademicos SET intClvLGAC = @lgac WHERE vchClvCA = @claveCA");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

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

    const usuario = session.user.id as string;
    const claveCA = (session.user as any).claveCA as string;
    const chrCarrera = (session.user as any).chrCarrera as string;

    const pool = await getConnection();

    const [produccion, productos, status, lineas, cuerpos] = await Promise.all([
      pool.request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT pr.intClvProduccion, pr.dtmFechaRegistro, pr.intClvProducto,
          p.vchNombreProducto, pr.vchTituloProducto, pr.vchDescripcionBreve, pr.vchImpacto,
          pr.intClaveLineInvestigacion, l.vchDescripcion AS vchDescripcionLinea,
          pr.intStatus, s.vchNombreStatus, pr.bitPerteneCA,
          pr.vchAutores, pr.vchColaboradores,
          pr.vchCAColaborador1_Int, ca1.vchNombreCA AS nombreCA1,
          pr.vchCAColaborador2_Int, ca2.vchNombreCA AS nombreCA2,
          pr.vchCAColaborador3_Int, ca3.vchNombreCA AS nombreCA3,
          pr.vchCAColaborador1_Ext, pr.vchNombreColaboradorExterno, pr.RutaArchivo
          FROM tbl_CA_Produccion pr
          INNER JOIN tbl_CA_Productos p ON p.intClvProducto = pr.intClvProducto
          INNER JOIN tbl_CA_LineaInvestigacion l ON l.intClaveLinea = pr.intClaveLineInvestigacion
          INNER JOIN tbl_CA_Status s ON s.intClvStatus = pr.intStatus
          LEFT JOIN tbl_CA_CuerposAcademicos ca1 ON pr.vchCAColaborador1_Int = ca1.vchClvCA
          LEFT JOIN tbl_CA_CuerposAcademicos ca2 ON pr.vchCAColaborador2_Int = ca2.vchClvCA
          LEFT JOIN tbl_CA_CuerposAcademicos ca3 ON pr.vchCAColaborador3_Int = ca3.vchClvCA
          WHERE pr.vchClvTrabajador = @u
          ORDER BY pr.dtmFechaRegistro DESC`),
      pool.request().query("SELECT intClvProducto, vchNombreProducto FROM tbl_CA_Productos"),
      pool.request().query("SELECT intClvStatus, vchNombreStatus FROM tbl_CA_Status"),
      pool.request()
        .input("carrera", sql.VarChar, chrCarrera)
        .input("claveCA", sql.VarChar, claveCA)
        .query("SELECT intClaveLinea, vchDescripcion FROM tbl_CA_LineaInvestigacion WHERE chrCarrera = @carrera AND vchClvCA = @claveCA"),
      pool.request().query("SELECT vchClvCA, vchNombreCA FROM tbl_CA_CuerposAcademicos"),
    ]);

    return NextResponse.json({
      success: true,
      data: produccion.recordset,
      catalogos: {
        productos: productos.recordset,
        status: status.recordset,
        lineas: lineas.recordset,
        cuerpos: cuerpos.recordset,
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
    const chrCarrera = (session.user as any).chrCarrera as string;

    const formData = await request.formData();
    const archivo = formData.get("archivo") as File | null;

    if (!archivo || archivo.size === 0) {
      return NextResponse.json({ success: false, error: "El archivo es obligatorio" }, { status: 400 });
    }

    const validExts = ["doc", "docx", "xlsx", "pdf", "pptx", "bmp", "jpg", "jpeg", "png", "mp4"];
    const ext = archivo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!validExts.includes(ext)) {
      return NextResponse.json({ success: false, error: "Extensión de archivo no válida" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "produccion");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, archivo.name), Buffer.from(await archivo.arrayBuffer()));

    const pool = await getConnection();
    await pool.request()
      .input("intClvProducto", sql.VarChar, formData.get("tipoProducto") as string)
      .input("vchTituloProducto", sql.VarChar, formData.get("titulo") as string)
      .input("vchDescripcionBreve", sql.VarChar, formData.get("descripcion") as string)
      .input("vchImpacto", sql.VarChar, formData.get("impacto") as string)
      .input("intClaveLineInvestigacion", sql.VarChar, formData.get("linea") as string)
      .input("intStatus", sql.VarChar, formData.get("status") as string)
      .input("bitPerteneCA", sql.VarChar, formData.get("perteneceCA") as string)
      .input("vchAutores", sql.VarChar, formData.get("autores") as string)
      .input("vchColaboradores", sql.VarChar, formData.get("colaboradores") as string)
      .input("vchClvTrabajador", sql.VarChar, usuario)
      .input("vchCAColaborador1_Int", sql.VarChar, formData.get("ca1") as string || "")
      .input("vchCAColaborador2_Int", sql.VarChar, formData.get("ca2") as string || "")
      .input("vchCAColaborador3_Int", sql.VarChar, formData.get("ca3") as string || "")
      .input("vchCAColaborador1_Ext", sql.VarChar, formData.get("caExterna") as string || "")
      .input("vchNombreColaboradorExterno", sql.VarChar, formData.get("colaboradorExt") as string || "")
      .input("RutaArchivo", sql.VarChar, archivo.name)
      .input("chrCarrera", sql.VarChar, chrCarrera)
      .input("vchClvCA", sql.VarChar, claveCA)
      .execute("sp_CA_SubirProduccion");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const formData = await request.formData();
    const id = formData.get("id") as string;
    const nuevoArchivo = formData.get("archivo") as File | null;

    let archivoNombre: string | null = null;
    if (nuevoArchivo && nuevoArchivo.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "produccion");
      await mkdir(uploadsDir, { recursive: true });
      archivoNombre = nuevoArchivo.name;
      await writeFile(path.join(uploadsDir, archivoNombre), Buffer.from(await nuevoArchivo.arrayBuffer()));
    }

    const pool = await getConnection();
    const req = pool.request()
      .input("tipoProducto", sql.VarChar, formData.get("tipoProducto") as string)
      .input("titulo", sql.VarChar, formData.get("titulo") as string)
      .input("descripcion", sql.VarChar, formData.get("descripcion") as string)
      .input("impacto", sql.VarChar, formData.get("impacto") as string)
      .input("linea", sql.VarChar, formData.get("linea") as string)
      .input("status", sql.VarChar, formData.get("status") as string)
      .input("perteneceCA", sql.VarChar, formData.get("perteneceCA") as string)
      .input("autores", sql.VarChar, formData.get("autores") as string)
      .input("colaboradores", sql.VarChar, formData.get("colaboradores") as string)
      .input("ca1", sql.VarChar, formData.get("ca1") as string || "")
      .input("ca2", sql.VarChar, formData.get("ca2") as string || "")
      .input("ca3", sql.VarChar, formData.get("ca3") as string || "")
      .input("caExterna", sql.VarChar, formData.get("caExterna") as string || "")
      .input("colaboradorExt", sql.VarChar, formData.get("colaboradorExt") as string || "")
      .input("id", sql.Int, parseInt(id));

    if (archivoNombre) req.input("archivo", sql.VarChar, archivoNombre);

    await req.query(`UPDATE tbl_CA_Produccion SET
      intClvProducto = @tipoProducto,
      vchTituloProducto = @titulo,
      vchDescripcionBreve = @descripcion,
      vchImpacto = @impacto,
      intClaveLineInvestigacion = @linea,
      intStatus = @status,
      bitPerteneCA = @perteneceCA,
      dtmFechaRegistro = GETDATE(),
      vchAutores = @autores,
      vchColaboradores = @colaboradores,
      vchCAColaborador1_Int = @ca1,
      vchCAColaborador2_Int = @ca2,
      vchCAColaborador3_Int = @ca3,
      vchCAColaborador1_Ext = @caExterna,
      vchNombreColaboradorExterno = @colaboradorExt
      ${archivoNombre ? ", RutaArchivo = @archivo" : ""}
      WHERE intClvProduccion = @id`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

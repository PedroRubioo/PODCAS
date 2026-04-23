import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, checkOrigin, requireRole } from "@/lib/api-helpers";
import { saveUpload } from "@/lib/safe-upload";

const FILE_EXTS = ["doc", "docx", "xlsx", "pdf", "pptx", "bmp", "jpg", "jpeg", "png", "mp4"];

export async function GET() {
  const session = await requireRole(["3"]);
  if (!session.ok) return session.response;

  try {
    const usuario = session.user.id;
    const claveCA = session.user.claveCA;
    const chrCarrera = session.user.chrCarrera;
    const pool = await getConnection();

    const [produccion, productos, status, lineas, cuerpos] = await Promise.all([
      pool
        .request()
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
      pool
        .request()
        .input("carrera", sql.VarChar, chrCarrera)
        .input("claveCA", sql.VarChar, claveCA)
        .query(
          "SELECT intClaveLinea, vchDescripcion FROM tbl_CA_LineaInvestigacion WHERE chrCarrera = @carrera AND vchClvCA = @claveCA",
        ),
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
    return apiError(error, "GET /api/miembro/produccion");
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
    const chrCarrera = session.user.chrCarrera;

    const formData = await request.formData();
    const archivo = formData.get("archivo");
    if (!(archivo instanceof File)) {
      return NextResponse.json(
        { success: false, error: "El archivo es obligatorio" },
        { status: 400 },
      );
    }

    const upload = await saveUpload({
      file: archivo,
      subDir: "uploads/produccion",
      allowedExt: FILE_EXTS,
      maxBytes: 25 * 1024 * 1024,
      prefix: usuario,
    });
    if (!upload.ok) {
      return NextResponse.json(
        { success: false, error: upload.error },
        { status: upload.status },
      );
    }

    const pool = await getConnection();
    await pool
      .request()
      .input("intClvProducto", sql.VarChar, String(formData.get("tipoProducto") ?? ""))
      .input("vchTituloProducto", sql.VarChar, String(formData.get("titulo") ?? ""))
      .input("vchDescripcionBreve", sql.VarChar, String(formData.get("descripcion") ?? ""))
      .input("vchImpacto", sql.VarChar, String(formData.get("impacto") ?? ""))
      .input("intClaveLineInvestigacion", sql.VarChar, String(formData.get("linea") ?? ""))
      .input("intStatus", sql.VarChar, String(formData.get("status") ?? ""))
      .input("bitPerteneCA", sql.VarChar, String(formData.get("perteneceCA") ?? ""))
      .input("vchAutores", sql.VarChar, String(formData.get("autores") ?? ""))
      .input("vchColaboradores", sql.VarChar, String(formData.get("colaboradores") ?? ""))
      .input("vchClvTrabajador", sql.VarChar, usuario)
      .input("vchCAColaborador1_Int", sql.VarChar, String(formData.get("ca1") ?? ""))
      .input("vchCAColaborador2_Int", sql.VarChar, String(formData.get("ca2") ?? ""))
      .input("vchCAColaborador3_Int", sql.VarChar, String(formData.get("ca3") ?? ""))
      .input("vchCAColaborador1_Ext", sql.VarChar, String(formData.get("caExterna") ?? ""))
      .input("vchNombreColaboradorExterno", sql.VarChar, String(formData.get("colaboradorExt") ?? ""))
      .input("RutaArchivo", sql.VarChar, upload.filename)
      .input("chrCarrera", sql.VarChar, chrCarrera)
      .input("vchClvCA", sql.VarChar, claveCA)
      .execute("sp_CA_SubirProduccion");

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "POST /api/miembro/produccion");
  }
}

export async function PUT(request: Request) {
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

    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");
    const idNum = Number.parseInt(id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 },
      );
    }

    const pool = await getConnection();

    // Verificar ownership antes de actualizar (fix IDOR)
    const owner = await pool
      .request()
      .input("id", sql.Int, idNum)
      .query(
        `SELECT vchClvTrabajador FROM tbl_CA_Produccion WHERE intClvProduccion = @id`,
      );
    if (owner.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontró la producción" },
        { status: 404 },
      );
    }
    if (String(owner.recordset[0].vchClvTrabajador) !== String(usuario)) {
      return NextResponse.json(
        { success: false, error: "No tienes permisos sobre esta producción" },
        { status: 403 },
      );
    }

    const nuevoArchivo = formData.get("archivo");
    let archivoNombre: string | null = null;
    if (nuevoArchivo instanceof File && nuevoArchivo.size > 0) {
      const upload = await saveUpload({
        file: nuevoArchivo,
        subDir: "uploads/produccion",
        allowedExt: FILE_EXTS,
        maxBytes: 25 * 1024 * 1024,
        prefix: usuario,
      });
      if (!upload.ok) {
        return NextResponse.json(
          { success: false, error: upload.error },
          { status: upload.status },
        );
      }
      archivoNombre = upload.filename;
    }

    const req = pool
      .request()
      .input("tipoProducto", sql.VarChar, String(formData.get("tipoProducto") ?? ""))
      .input("titulo", sql.VarChar, String(formData.get("titulo") ?? ""))
      .input("descripcion", sql.VarChar, String(formData.get("descripcion") ?? ""))
      .input("impacto", sql.VarChar, String(formData.get("impacto") ?? ""))
      .input("linea", sql.VarChar, String(formData.get("linea") ?? ""))
      .input("status", sql.VarChar, String(formData.get("status") ?? ""))
      .input("perteneceCA", sql.VarChar, String(formData.get("perteneceCA") ?? ""))
      .input("autores", sql.VarChar, String(formData.get("autores") ?? ""))
      .input("colaboradores", sql.VarChar, String(formData.get("colaboradores") ?? ""))
      .input("ca1", sql.VarChar, String(formData.get("ca1") ?? ""))
      .input("ca2", sql.VarChar, String(formData.get("ca2") ?? ""))
      .input("ca3", sql.VarChar, String(formData.get("ca3") ?? ""))
      .input("caExterna", sql.VarChar, String(formData.get("caExterna") ?? ""))
      .input("colaboradorExt", sql.VarChar, String(formData.get("colaboradorExt") ?? ""))
      .input("id", sql.Int, idNum)
      .input("u", sql.VarChar, usuario);

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
      WHERE intClvProduccion = @id AND vchClvTrabajador = @u`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "PUT /api/miembro/produccion");
  }
}

import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, checkOrigin, requireRole } from "@/lib/api-helpers";

export async function GET() {
  const session = await requireRole(["2"]);
  if (!session.ok) return session.response;

  try {
    const pool = await getConnection();

    const [representantes, perfiles] = await Promise.all([
      pool.request().query(`
        SELECT
          ct.id,
          ct.vchClvCA AS claveCA,
          ct.vchClvTrabajador AS noTrabajador,
          t.vchAPaterno + ' ' + t.vchAMaterno + ' ' + t.vchNombre AS nombre,
          ct.chrCarrera AS claveDpto,
          d.vchNomDpto AS departamento,
          ct.intClvPerfilPROMEP AS clavePerfil,
          p.vchNombrePerfil AS perfil
        FROM tbl_CA_CATrabajador ct
        INNER JOIN tblTrabajadores t ON ct.vchClvTrabajador = t.vchClvTrabajador
        INNER JOIN tbl_CA_PerfilesPROMEP p ON ct.intClvPerfilPROMEP = p.intClvPerfilPROMEP
        LEFT JOIN tblDepartamentos d ON ct.chrCarrera = d.chrClvDpto
        WHERE ct.intClvTipoUsuario = '6'
        ORDER BY t.vchAPaterno
      `),
      pool
        .request()
        .input("limit", sql.Int, 200)
        .query(
          "SELECT TOP (@limit) intClvPerfilPROMEP, vchNombrePerfil FROM tbl_CA_PerfilesPROMEP",
        ),
    ]);

    return NextResponse.json({
      success: true,
      data: representantes.recordset,
      catalogos: { perfiles: perfiles.recordset },
    });
  } catch (error) {
    return apiError(error, "GET /api/enlace/representantes");
  }
}

export async function POST(request: Request) {
  const session = await requireRole(["2"]);
  if (!session.ok) return session.response;
  if (!checkOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Origen no permitido" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const claveTrab = typeof body.claveTrab === "string" ? body.claveTrab : "";
    const perfil = typeof body.perfil === "string" ? body.perfil : "";
    const carrera = typeof body.carrera === "string" ? body.carrera : "";

    if (!claveTrab || !perfil || !carrera) {
      return NextResponse.json(
        { success: false, error: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    const hoy = new Date().toISOString().split("T")[0];
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("clave", sql.VarChar, claveTrab)
      .input("fecha", sql.VarChar, hoy)
      .input("perfil", sql.VarChar, perfil)
      .input("clave_CA", sql.VarChar, "NA")
      .input("tipoUser", sql.VarChar, "6")
      .input("chrCarrera", sql.VarChar, carrera)
      .input("FechPReg", sql.DateTime, new Date())
      .input("FechPVen", sql.DateTime, new Date())
      .output("CodRetorno", sql.Int)
      .execute("sp_CA_RegistrarRepresentante");

    const codRetorno = result.output.CodRetorno;
    if (codRetorno > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "El trabajador ya está registrado como representante.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "POST /api/enlace/representantes");
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
    const body = await request.json();
    const id = body.id;
    const claveTrab = typeof body.claveTrab === "string" ? body.claveTrab : "";
    const perfil = typeof body.perfil === "string" ? body.perfil : "";
    const carrera = typeof body.carrera === "string" ? body.carrera : "";
    const noTrabajadorAnterior =
      typeof body.noTrabajadorAnterior === "string"
        ? body.noTrabajadorAnterior
        : "";

    if (!id || !claveTrab || !perfil || !carrera) {
      return NextResponse.json(
        { success: false, error: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    const idNum = Number.parseInt(String(id));
    if (!Number.isFinite(idNum)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 },
      );
    }

    const pool = await getConnection();

    // Verificar que el representante objetivo realmente exista en la carrera del enlace
    const owner = await pool
      .request()
      .input("id", sql.Int, idNum)
      .query(
        `SELECT chrCarrera, vchClvTrabajador
         FROM tbl_CA_CATrabajador
         WHERE id = @id AND intClvTipoUsuario = '6'`,
      );
    if (owner.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontró el registro a actualizar" },
        { status: 404 },
      );
    }
    const carreraReal = owner.recordset[0].chrCarrera as string;

    // Solo permite editar representantes de la misma carrera que el enlace
    if (
      session.user.chrCarrera &&
      session.user.chrCarrera !== carreraReal &&
      session.user.chrCarrera !== carrera
    ) {
      return NextResponse.json(
        { success: false, error: "No tienes permisos sobre esta carrera" },
        { status: 403 },
      );
    }

    const check = await pool
      .request()
      .input("trab", sql.VarChar, claveTrab)
      .input("carr", sql.VarChar, carrera)
      .query(
        `SELECT id FROM tbl_CA_CATrabajador
         WHERE vchClvTrabajador = @trab AND chrCarrera = @carr AND intClvTipoUsuario = '6'`,
      );

    if (check.recordset.length > 0 && String(check.recordset[0].id) !== String(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Este trabajador ya es representante en esta carrera.",
        },
        { status: 409 },
      );
    }

    const updateResult = await pool
      .request()
      .input("trab", sql.VarChar, claveTrab)
      .input("perfil", sql.VarChar, perfil)
      .input("carrera", sql.VarChar, carrera)
      .input("id", sql.Int, idNum)
      .query(
        `UPDATE tbl_CA_CATrabajador
         SET vchClvTrabajador = @trab, intClvPerfilPROMEP = @perfil,
             dtmFchRegistro = GETDATE(), chrCarrera = @carrera
         WHERE id = @id`,
      );

    if (updateResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontró el registro a actualizar" },
        { status: 404 },
      );
    }

    if (noTrabajadorAnterior && noTrabajadorAnterior !== claveTrab) {
      await pool
        .request()
        .input("nuevo", sql.VarChar, claveTrab)
        .input("anterior", sql.VarChar, noTrabajadorAnterior)
        .query(
          `UPDATE tbl_CA_CuerposAcademicos
           SET vchClvTrabajadorRepresentante = @nuevo
           WHERE vchClvTrabajadorRepresentante = @anterior`,
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "PUT /api/enlace/representantes");
  }
}

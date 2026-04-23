import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";
import { apiError, checkOrigin, requireRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/roles";

export async function GET() {
  const session = await requireRole([ROLE.ADMIN]);
  if (!session.ok) return session.response;

  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        t.id,
        t.vchClvTrabajador,
        t.vchClvCA,
        trab.vchNombre + ' ' + trab.vchAPaterno + ' ' + trab.vchAMaterno AS nombre,
        t.chrCarrera,
        d.vchNomDpto AS departamento,
        t.intClvPerfilPROMEP,
        p.vchNombrePerfil AS perfil,
        t.intClvTipoUsuario,
        t.dtmFchRegistro,
        t.dtmFchVencimientoPROMEP AS dtmFchRegistroVencimiento
      FROM tbl_CA_CATrabajador t
      INNER JOIN tblTrabajadores trab ON t.vchClvTrabajador = trab.vchClvTrabajador
      LEFT JOIN tbl_CA_PerfilesPROMEP p ON t.intClvPerfilPROMEP = p.intClvPerfilPROMEP
      LEFT JOIN tblDepartamentos d ON t.chrCarrera = d.chrClvDpto
      ORDER BY trab.vchAPaterno
    `);
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return apiError(error, "GET /api/admin/usuarios");
  }
}

export async function POST(request: Request) {
  const session = await requireRole([ROLE.ADMIN]);
  if (!session.ok) return session.response;
  if (!checkOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Origen no permitido" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const clave = typeof body.clave === "string" ? body.clave : "";
    const fecha = typeof body.fecha === "string" ? body.fecha : "";
    const perfilNum = Number.parseInt(String(body.perfil ?? ""));
    const claveCA = typeof body.claveCA === "string" ? body.claveCA : "";
    const tipoUser = typeof body.tipoUser === "string" ? body.tipoUser : "";
    const carrera = typeof body.carrera === "string" ? body.carrera : "";
    const fechaReg = typeof body.fechaReg === "string" ? body.fechaReg : "";
    const fechaVenc = typeof body.fechaVenc === "string" ? body.fechaVenc : "";

    if (!clave || !tipoUser || !carrera || !Number.isFinite(perfilNum)) {
      return NextResponse.json(
        { success: false, error: "Datos incompletos" },
        { status: 400 },
      );
    }

    const pool = await getConnection();
    const sp = tipoUser === "2" ? "sp_CA_RegistrarRepresentante" : "sp_CA_RegistrarMiembro";

    const result = await pool
      .request()
      .input("clave", sql.VarChar, clave)
      .input("fecha", sql.VarChar, fecha)
      .input("perfil", sql.Int, perfilNum)
      .input("clave_CA", sql.VarChar, claveCA)
      .input("tipoUser", sql.Int, Number.parseInt(tipoUser))
      .input("chrCarrera", sql.VarChar, carrera)
      .input("FechPReg", sql.DateTime, new Date(fechaReg))
      .input("FechPVen", sql.DateTime, new Date(fechaVenc))
      .output("CodRetorno", sql.Int, 0)
      .execute(sp);

    const codRetorno = result.output.CodRetorno;
    if (codRetorno > 0) {
      return NextResponse.json(
        { success: false, error: "El trabajador ya está registrado en este cuerpo académico." },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "POST /api/admin/usuarios");
  }
}

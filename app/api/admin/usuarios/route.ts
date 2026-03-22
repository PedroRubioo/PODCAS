import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
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
        t.dtmFchRegistroVencimiento
      FROM tbl_CA_CATrabajador t
      INNER JOIN tblTrabajadores trab ON t.vchClvTrabajador = trab.vchClvTrabajador
      LEFT JOIN tbl_CA_PerfilesPROMEP p ON t.intClvPerfilPROMEP = p.intClvPerfilPROMEP
      LEFT JOIN tblDepartamentos d ON t.chrCarrera = d.chrClvDpto
      ORDER BY trab.vchAPaterno
    `);
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clave, fecha, perfil, claveCA, tipoUser, carrera, fechaReg, fechaVenc } = body;
    const pool = await getConnection();

    const sp = tipoUser === "2" ? "sp_CA_RegistrarRepresentante" : "sp_CA_RegistrarMiembro";

    const result = await pool
      .request()
      .input("clave", clave)
      .input("fecha", fecha)
      .input("perfil", parseInt(perfil))
      .input("clave_CA", claveCA)
      .input("tipoUser", parseInt(tipoUser))
      .input("chrCarrera", carrera)
      .input("FechPReg", new Date(fechaReg))
      .input("FechPVen", new Date(fechaVenc))
      .output("CodRetorno", 0)
      .execute(sp);

    const codRetorno = result.output.CodRetorno;
    if (codRetorno > 0) {
      return NextResponse.json(
        { success: false, error: "El trabajador ya está registrado en este cuerpo académico." },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

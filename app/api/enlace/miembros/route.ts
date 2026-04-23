import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { apiError, requireRole } from "@/lib/api-helpers";

export async function GET() {
  const session = await requireRole(["2"]);
  if (!session.ok) return session.response;

  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        t.vchClvTrabajador AS clave,
        t.vchNombre + ' ' + t.vchAPaterno + ' ' + t.vchAMaterno AS nombre,
        d.vchNomDpto AS departamento,
        ct.vchClvCA AS claveCA,
        ca.vchNombreCA AS nombreCA,
        p.vchNombrePerfil AS perfil,
        CASE ct.intClvTipoUsuario
          WHEN '3' THEN 'Miembro'
          WHEN '6' THEN 'Representante'
          ELSE 'Otro'
        END AS tipoRol
      FROM tbl_CA_CATrabajador ct
      INNER JOIN tblTrabajadores t ON ct.vchClvTrabajador = t.vchClvTrabajador
      INNER JOIN tbl_CA_PerfilesPROMEP p ON ct.intClvPerfilPROMEP = p.intClvPerfilPROMEP
      LEFT JOIN tblDepartamentos d ON ct.chrCarrera = d.chrClvDpto
      LEFT JOIN tbl_CA_CuerposAcademicos ca ON ct.vchClvCA = ca.vchClvCA
      WHERE ct.intClvTipoUsuario IN ('3', '6')
      ORDER BY ca.vchNombreCA, t.vchAPaterno
    `);
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return apiError(error, "GET /api/enlace/miembros");
  }
}

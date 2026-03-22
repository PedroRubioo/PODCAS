import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(
      "SELECT TOP 200 intClvPerfilPROMEP, vchNombrePerfil FROM tbl_CA_PerfilesPROMEP"
    );
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

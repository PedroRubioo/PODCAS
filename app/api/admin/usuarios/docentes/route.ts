import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const carrera = searchParams.get("carrera");
    if (!carrera) {
      return NextResponse.json({ success: false, error: "carrera requerida" }, { status: 400 });
    }
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("clave", carrera)
      .execute("sp_CA_ObtenerDocentesPorCarrera");
    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

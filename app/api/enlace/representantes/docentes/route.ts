import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sql from "mssql";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });
    const tipoUser = (session.user as any).tipoUser;
    if (tipoUser !== "2") return NextResponse.json({ success: false }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const clave = searchParams.get("clave") ?? "";

    const pool = await getConnection();
    const result = await pool.request()
      .input("clave", sql.VarChar, clave)
      .execute("sp_CA_ObtenerDocentesPorCarrera");

    // El SP devuelve "Numero de acceso" y "Nombre Trabajador" — normalizamos a campos fijos
    const data = result.recordset.map((row: any) => {
      const keys = Object.keys(row);
      const idKey = keys.find(k => !k.toLowerCase().includes("nombre")) ?? keys[0];
      const nombreKey = keys.find(k => k.toLowerCase().includes("nombre")) ?? keys[1] ?? keys[0];
      return { id: String(row[idKey] ?? ""), nombre: String(row[nombreKey] ?? "") };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

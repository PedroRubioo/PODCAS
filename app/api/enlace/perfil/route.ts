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
    const pool = await getConnection();

    const [trabajador, dpto, imagen] = await Promise.all([
      pool.request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT vchNombre, vchAPaterno, vchAMaterno, descripcion_puesto
                FROM tblTrabajadores WHERE vchClvTrabajador = @u`),

      pool.request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT DISTINCT Dep.chrClvDpto AS clave, Dep.vchNomDpto AS departamento
                FROM tblDepartamentos AS Dep
                INNER JOIN tblCarreras Carr ON Dep.chrClvDpto = Carr.chrClvDpto
                INNER JOIN tblTrabajadores T ON T.chrClvDptoTrab = Dep.chrClvDpto
                WHERE Dep.chrClvDpto <> '00' AND Carr.bitActiva = 1
                  AND T.vchClvTrabajador = @u`),

      pool.request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT ISNULL(ImagenPerfil, 'sin imagen.jpg') AS ImagenPerfil
                FROM tbl_CA_CATrabajador WHERE vchClvTrabajador = @u`),
    ]);

    const t = trabajador.recordset[0];
    const d = dpto.recordset[0];
    const img = imagen.recordset[0];

    return NextResponse.json({
      success: true,
      data: {
        nombre: t ? `${t.vchNombre} ${t.vchAPaterno} ${t.vchAMaterno}`.trim() : "",
        descripcion: t?.descripcion_puesto ?? "",
        departamento: d?.departamento ?? "",
        imagen: img?.ImagenPerfil ?? "sin imagen.jpg",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const usuario = session.user.id as string;
    const formData = await request.formData();
    const archivo = formData.get("imagen") as File | null;

    if (!archivo || archivo.size === 0)
      return NextResponse.json({ success: false, error: "Archivo requerido" }, { status: 400 });

    const ext = archivo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png"].includes(ext))
      return NextResponse.json({ success: false, error: "Solo jpg, jpeg o png" }, { status: 400 });

    const nombreArchivo = `${usuario}_${archivo.name}`;
    const dir = path.join(process.cwd(), "public", "ImagenPerfil");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, nombreArchivo), Buffer.from(await archivo.arrayBuffer()));

    const pool = await getConnection();
    await pool.request()
      .input("img", sql.VarChar, nombreArchivo)
      .input("u", sql.VarChar, usuario)
      .query(`UPDATE tbl_CA_CATrabajador SET ImagenPerfil = @img WHERE vchClvTrabajador = @u`);

    return NextResponse.json({ success: true, imagen: nombreArchivo });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

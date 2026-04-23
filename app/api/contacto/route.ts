import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import sql from "mssql";
import { getConnection } from "@/lib/db";
import { apiError, checkOrigin } from "@/lib/api-helpers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!checkOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Origen no permitido" },
      { status: 403 },
    );
  }

  const ip = clientIp(request);
  const limit = rateLimit({
    key: `contacto:${ip}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Demasiados mensajes. Intenta más tarde." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const claveIntegrante = typeof body.claveIntegrante === "string" ? body.claveIntegrante : "";
    const clvCA = typeof body.clvCA === "string" ? body.clvCA : "";
    const nombre = typeof body.nombre === "string" ? body.nombre.slice(0, 200) : "";
    const mensaje = typeof body.mensaje === "string" ? body.mensaje.slice(0, 4000) : "";

    if (!claveIntegrante || !clvCA || !mensaje.trim()) {
      return NextResponse.json(
        { success: false, error: "Datos incompletos" },
        { status: 400 },
      );
    }

    const pool = await getConnection();
    const lookup = await pool
      .request()
      .input("clave", sql.VarChar, claveIntegrante)
      .input("ca", sql.VarChar, clvCA)
      .query(`
        SELECT TOP 1 vchEmailPersonal AS correo
        FROM tbl_CA_CATrabajador
        WHERE vchClvTrabajador = @clave
          AND vchClvCA = @ca
          AND intClvTipoUsuario IN ('3', '6')
      `);

    const correo = lookup.recordset[0]?.correo as string | null;
    if (!correo || correo === "SIN REGISTRO") {
      return NextResponse.json(
        { success: false, error: "El docente no cuenta con email registrado" },
        { status: 400 },
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correo,
      subject: "Mensaje desde el sistema de Cuerpos Académicos UTHH",
      text: `Mensaje dirigido a ${nombre || "integrante"}:\n\n${mensaje}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "POST /api/contacto");
  }
}

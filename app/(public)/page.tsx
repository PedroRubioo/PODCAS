import { ArrowRight, Phone, BookOpen, Users, Building2, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PublicacionesCarousel from "@/components/publicaciones-carousel";
import ImagenCA from "@/components/imagen-ca";
import { getConnection } from "@/lib/db";

async function getCuerposAcademicos() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT TOP 6
        tbl_CA_CuerposAcademicos.id,
        tbl_CA_CuerposAcademicos.vchClvCA,
        UPPER(tbl_CA_CuerposAcademicos.vchNombreCA) AS vchNombreCA,
        tbl_CA_CuerposAcademicos.ImagenLogo,
        tblDepartamentos.vchNomDpto
      FROM tbl_CA_CuerposAcademicos
      INNER JOIN tblDepartamentos
        ON tbl_CA_CuerposAcademicos.chrCarrera = tblDepartamentos.chrClvDpto
    `);
    return result.recordset;
  } catch {
    return [];
  }
}

async function getPublicaciones() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT TOP 8
        intClvPublicacion,
        vchNombrePublicacion,
        dtmFechaPublicacion,
        vchDescripcion,
        vchRutaImagenPublicacion
      FROM tbl_CA_Publicaciones
      ORDER BY dtmFechaPublicacion DESC
    `);
    return result.recordset;
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const pool = await getConnection();
    const r = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM tbl_CA_CuerposAcademicos) AS cuerpos,
        (SELECT COUNT(*) FROM tbl_CA_Publicaciones) AS publicaciones,
        (SELECT COUNT(*) FROM tbl_CA_CATrabajador WHERE intClvTipoUsuario IN ('3','6')) AS investigadores,
        (SELECT COUNT(*) FROM tblDepartamentos WHERE chrClvDpto <> '00') AS departamentos
    `);
    return r.recordset[0] ?? { cuerpos: 0, publicaciones: 0, investigadores: 0, departamentos: 0 };
  } catch {
    return { cuerpos: 0, publicaciones: 0, investigadores: 0, departamentos: 0 };
  }
}

export default async function HomePage() {
  const [cuerposAcademicos, publicaciones, stats] = await Promise.all([
    getCuerposAcademicos(),
    getPublicaciones(),
    getStats(),
  ]);

  const statItems = [
    { icon: Building2, label: "Cuerpos Académicos", value: stats.cuerpos },
    { icon: BookOpen, label: "Publicaciones", value: stats.publicaciones },
    { icon: Users, label: "Investigadores", value: stats.investigadores },
    { icon: GraduationCap, label: "Departamentos", value: stats.departamentos },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative h-svh min-h-[640px] flex items-end overflow-hidden">
        <Image
          src="/images/hero.jpg"
          alt="Universidad Tecnológica de la Huasteca Hidalguense"
          fill
          className="object-cover scale-[1.02]"
          priority
        />
        {/* Capas de gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,10,0.92)] via-[rgba(10,10,10,0.38)] to-[rgba(10,10,10,0.1)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(114,47,55,0.35)] via-transparent to-transparent" />
        {/* Patrón de esquina dorado */}
        <div
          className="absolute top-[78px] right-0 w-[220px] h-[220px] opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #c9a227 1px, transparent 1.5px)",
            backgroundSize: "18px 18px",
          }}
        />
        {/* Línea dorada decorativa izquierda */}
        <div className="absolute left-8 lg:left-14 top-[120px] bottom-[280px] w-[1px] bg-gradient-to-b from-transparent via-[rgba(201,162,39,0.5)] to-transparent hidden md:block" />

        <div className="relative z-10 px-8 lg:px-14 pb-20 md:pb-24 max-w-[780px] w-full">
          {/* Badge institucional */}
          <div className="inline-flex items-center gap-[0.55rem] mb-6 px-[0.9rem] py-[0.4rem] bg-[rgba(201,162,39,0.12)] border border-[rgba(201,162,39,0.45)] backdrop-blur-[10px] rounded-full">
            <div className="relative flex">
              <div className="w-[6px] h-[6px] rounded-full bg-[#c9a227]" />
              <div className="absolute w-[6px] h-[6px] rounded-full bg-[#c9a227] animate-ping" />
            </div>
            <span className="text-[0.66rem] font-semibold tracking-[0.18em] uppercase text-[#ddb94a]">
              Universidad Tecnológica de la Huasteca Hidalguense
            </span>
          </div>

          <h1 className="font-serif text-[clamp(2.3rem,5vw,4.2rem)] font-bold text-white leading-[1.08] mb-5 tracking-[-0.01em]">
            Formando líderes del{" "}
            <em className="italic text-[#ddb94a] font-normal">conocimiento</em>
            <br />y la innovación
          </h1>
          <p className="text-[1.02rem] text-[rgba(255,255,255,0.82)] max-w-[520px] leading-[1.75] font-light mb-8">
            Investigación, ciencia y tecnología al servicio del desarrollo de la
            región Huasteca.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-10">
            <Link
              href="/cuerpos-academicos"
              className="inline-flex items-center gap-2 px-[1.6rem] py-[0.8rem] bg-gradient-to-br from-[#c9a227] to-[#a68520] text-[#1a1a1a] rounded-[4px] text-[0.85rem] font-semibold no-underline transition-all duration-300 hover:shadow-[0_10px_28px_rgba(201,162,39,0.45)] hover:-translate-y-[1px]"
            >
              Explorar Cuerpos Académicos
              <ArrowRight className="w-[14px] h-[14px]" />
            </Link>
            <Link
              href="/publicaciones"
              className="inline-flex items-center gap-2 px-[1.6rem] py-[0.8rem] bg-[rgba(255,255,255,0.08)] backdrop-blur-[8px] border border-[rgba(255,255,255,0.3)] text-white rounded-[4px] text-[0.85rem] font-semibold no-underline transition-all duration-300 hover:bg-[rgba(255,255,255,0.16)] hover:border-[rgba(255,255,255,0.5)]"
            >
              Ver Publicaciones
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.15)] backdrop-blur-[10px] max-w-[640px]">
            {statItems.map((s) => (
              <div
                key={s.label}
                className="bg-[rgba(10,10,10,0.55)] px-4 py-3.5 flex items-center gap-3"
              >
                <s.icon className="w-[18px] h-[18px] text-[#c9a227] shrink-0" />
                <div className="leading-tight min-w-0">
                  <div className="font-serif text-[1.35rem] font-bold text-white">
                    {s.value}
                  </div>
                  <div className="text-[0.64rem] text-[rgba(255,255,255,0.6)] tracking-[0.1em] uppercase truncate">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 opacity-60">
          <span className="text-[0.6rem] tracking-[0.25em] uppercase text-white">
            Descubre
          </span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#c9a227] to-transparent" />
        </div>
      </section>

      {/* CUERPOS ACADEMICOS */}
      <section id="cuerpos" className="py-28 bg-[#fdfcfa] relative overflow-hidden">
        {/* Número grande decorativo de fondo */}
        <div
          aria-hidden
          className="absolute -top-10 -right-8 font-serif text-[18rem] font-bold text-[rgba(114,47,55,0.04)] leading-none select-none pointer-events-none hidden md:block"
        >
          01
        </div>
        <div className="max-w-[1240px] mx-auto px-8 relative">
          <div className="flex items-end justify-between gap-8 flex-wrap mb-14">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-[2px] bg-[#c9a227]" />
                <span className="text-[0.7rem] font-semibold tracking-[0.22em] uppercase text-[#c9a227]">
                  Investigación & Ciencia
                </span>
              </div>
              <h2 className="font-serif text-[clamp(1.9rem,3.4vw,2.8rem)] font-bold text-[#722F37] leading-[1.12]">
                Cuerpos Académicos
                <br />
                <em className="italic text-[#c9a227] font-normal">de la UTHH</em>
              </h2>
            </div>
            <Link
              href="/cuerpos-academicos"
              className="inline-flex items-center gap-[0.45rem] px-6 py-[0.65rem] bg-transparent text-[#722F37] border-[1.5px] border-[#722F37] rounded-full text-[0.82rem] font-semibold no-underline transition-all duration-300 hover:bg-[#722F37] hover:text-white shrink-0"
            >
              Ver todos
              <ArrowRight className="w-[14px] h-[14px]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cuerposAcademicos.map((ca: any) => (
              <div
                key={ca.id}
                className="relative bg-white border border-[#e8e4df] overflow-hidden transition-all duration-400 hover:-translate-y-[6px] hover:shadow-[0_22px_48px_rgba(114,47,55,0.12)] hover:border-[rgba(201,162,39,0.5)] group"
              >
                {/* Esquina dorada top-right */}
                <div className="absolute top-0 right-0 w-[48px] h-[48px] overflow-hidden pointer-events-none">
                  <div className="absolute top-[-24px] right-[-24px] w-[48px] h-[48px] bg-[#c9a227] rotate-45 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="relative overflow-hidden aspect-[16/10] bg-gradient-to-br from-[#f0ece6] to-[#e8e4df]">
                  <ImagenCA
                    src={ca.ImagenLogo ? `/LogoTiposCA/${ca.ImagenLogo}` : null}
                    alt={ca.vchNombreCA}
                  />
                  <span className="absolute top-4 left-4 font-serif text-[0.76rem] font-bold text-[#c9a227] tracking-[0.14em] bg-[rgba(10,10,10,0.7)] backdrop-blur-[8px] px-[0.7rem] py-[0.28rem] rounded border-l-2 border-[#c9a227]">
                    {ca.vchClvCA}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-[1.08rem] font-semibold text-[#722F37] leading-[1.3] mb-[0.3rem] line-clamp-2">
                    {ca.vchNombreCA}
                  </h3>
                  <p className="text-[0.78rem] text-[#9a9a9a] mb-5 tracking-[0.02em]">
                    {ca.vchNomDpto}
                  </p>
                  <Link
                    href={`/cuerpos-academicos?CA=${ca.vchClvCA}`}
                    className="inline-flex items-center gap-[0.5rem] text-[0.76rem] font-semibold text-[#c9a227] no-underline tracking-[0.02em] transition-all duration-300 hover:text-[#722F37] group/link"
                  >
                    <Phone className="w-[12px] h-[12px]" />
                    <span>Contactar</span>
                    <ArrowRight className="w-[12px] h-[12px] transition-transform duration-300 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PUBLICACIONES */}
      <section id="publicaciones" className="py-28 bg-gradient-to-b from-[#fdfcfa] to-[#f8f6f3] relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-10 -left-8 font-serif text-[18rem] font-bold text-[rgba(114,47,55,0.04)] leading-none select-none pointer-events-none hidden md:block"
        >
          02
        </div>
        <div className="max-w-[1240px] mx-auto px-8 relative">
          <div className="flex items-end justify-between gap-8 flex-wrap mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-[2px] bg-[#c9a227]" />
                <span className="text-[0.7rem] font-semibold tracking-[0.22em] uppercase text-[#c9a227]">
                  Conocimiento Abierto
                </span>
              </div>
              <h2 className="font-serif text-[clamp(1.9rem,3.4vw,2.8rem)] font-bold text-[#722F37] leading-[1.12]">
                Últimas <em className="italic text-[#c9a227] font-normal">publicaciones</em>
              </h2>
            </div>
            <Link
              href="/publicaciones"
              className="inline-flex items-center gap-[0.45rem] px-[1.5rem] py-[0.65rem] bg-[#722F37] text-white rounded-full text-[0.82rem] font-semibold no-underline transition-all duration-300 hover:bg-[#c9a227] hover:shadow-[0_8px_22px_rgba(201,162,39,0.35)] shrink-0"
            >
              Ver todas
              <ArrowRight className="w-[14px] h-[14px]" />
            </Link>
          </div>
          <PublicacionesCarousel publicaciones={publicaciones} />
        </div>
      </section>
    </>
  );
}

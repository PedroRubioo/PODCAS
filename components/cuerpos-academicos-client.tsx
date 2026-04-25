"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Phone,
  ArrowLeft,
  Mail,
  Send,
  User,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CA {
  id: number;
  vchClvCA: string;
  vchNombreCA: string;
  ImagenLogo: string;
  vchNomDpto: string;
}

interface Integrante {
  clave: string;
  nombre: string;
  tieneCorreo: number;
}

function SinImagen() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#faf5e4] to-[#f8f6f3] flex flex-col items-center justify-center gap-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#c9a227"
        strokeWidth="1.3"
        opacity={0.5}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <span className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a]">
        Sin imagen
      </span>
    </div>
  );
}

function LogoCA({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (errored) return <SinImagen />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      onError={() => setErrored(true)}
    />
  );
}

const VISIBLE_MEMBERS = 3;

export default function CuerposAcademicosClient({
  cuerposAcademicos,
}: {
  cuerposAcademicos: CA[];
}) {
  const searchParams = useSearchParams();
  const [contactCA, setContactCA] = useState<CA | null>(null);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [selectedMember, setSelectedMember] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [loadingIntegrantes, setLoadingIntegrantes] = useState(false);

  const openContact = async (ca: CA, signal?: AbortSignal) => {
    setContactCA(ca);
    setSelectedMember(0);
    setMensaje("");
    setShowAllMembers(false);
    setStatusMsg("");
    setLoadingIntegrantes(true);
    try {
      const res = await fetch(
        `/api/integrantes?clvCA=${encodeURIComponent(ca.vchClvCA)}`,
        { signal },
      );
      const json = await res.json();
      setIntegrantes(json.data ?? []);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setIntegrantes([]);
      }
    } finally {
      setLoadingIntegrantes(false);
    }
  };

  useEffect(() => {
    const clvCA = searchParams.get("CA");
    if (clvCA && cuerposAcademicos.length > 0) {
      const ca = cuerposAcademicos.find((c) => c.vchClvCA === clvCA);
      if (ca) {
        const ctrl = new AbortController();
        openContact(ca, ctrl.signal);
        return () => ctrl.abort();
      }
    }
  }, [searchParams, cuerposAcademicos]);

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;
    if (!contactCA) return;
    setEnviando(true);
    setStatusMsg("");
    try {
      const integrante = integrantes[selectedMember];
      if (!integrante) {
        setStatusMsg("❌ Selecciona un integrante");
        setEnviando(false);
        return;
      }
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claveIntegrante: integrante.clave,
          clvCA: contactCA.vchClvCA,
          nombre: integrante.nombre,
          mensaje,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg("✅ Mensaje enviado correctamente");
        setMensaje("");
      } else {
        setStatusMsg("❌ " + json.error);
      }
    } catch {
      setStatusMsg("❌ Error al enviar el mensaje");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      {/* PAGE HEADER */}
      <div className="pt-[7rem] pb-14 bg-gradient-to-b from-[#722F37] to-[#5a252c] border-b border-[rgba(183,140,51,0.25)] relative overflow-hidden">
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent"
        />
        <div
          aria-hidden
          className="absolute top-[20px] right-[5%] w-[180px] h-[180px] opacity-[0.12] pointer-events-none hidden md:block"
          style={{
            backgroundImage: "radial-gradient(circle, #c9a227 1px, transparent 1.5px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="max-w-[1240px] mx-auto px-8 relative">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-[2px] bg-[#c9a227] rounded" />
              <span className="text-[0.72rem] font-semibold tracking-[0.22em] uppercase text-[#c9a227]">
                Investigación &amp; Ciencia
              </span>
            </div>
            <h1 className="font-serif text-[clamp(2.1rem,3.8vw,3.2rem)] font-bold text-[#fff] leading-[1.1] tracking-[-0.01em]">
              Cuerpos <em className="italic text-[#c9a227] font-normal">Académicos</em>
            </h1>
            <p className="text-[0.92rem] text-[rgba(255,255,255,0.68)] mt-[0.7rem] font-light max-w-[620px] leading-[1.65]">
              Conoce los cuerpos académicos de la Universidad Tecnológica de la
              Huasteca Hidalguense.
            </p>
          </div>
        </div>
      </div>

      {/* CONTACT VIEW */}
      {contactCA && (
        <section className="py-20 bg-[#fdfcfa]">
          <div className="max-w-[740px] mx-auto px-8">
            <button
              onClick={() => setContactCA(null)}
              className="inline-flex items-center gap-2 text-[0.82rem] font-semibold text-[#6b6b6b] mb-8 transition-colors duration-300 hover:text-[#c9a227] bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a cuerpos academicos
            </button>

            <div className="bg-[#fff] border border-[#e8e4df] overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-[#c9a227] via-[#ddb94a] to-[#c9a227]" />
              <div className="p-8 lg:p-10">
                <h2 className="font-serif text-[1.6rem] font-bold text-[#722F37] leading-[1.2] text-center mb-6">
                  {contactCA.vchNombreCA}
                </h2>

                <div className="relative w-[120px] h-[120px] mx-auto mb-8 rounded-full overflow-hidden border-[3px] border-[#faf5e4] bg-[#f0ece6]">
                  {contactCA.ImagenLogo ? (
                    <LogoCA
                      src={`/LogoTiposCA/${contactCA.ImagenLogo}`}
                      alt={contactCA.vchNombreCA}
                      className="object-contain p-2"
                    />
                  ) : (
                    <SinImagen />
                  )}
                </div>

                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex items-start gap-3 p-4 bg-[#fdfcfa] border border-[#e8e4df] rounded-[4px]">
                    <GraduationCap className="w-[16px] h-[16px] text-[#c9a227] mt-[2px] shrink-0" />
                    <div>
                      <p className="text-[0.68rem] font-semibold tracking-[0.12em] uppercase text-[#c9a227] mb-1">
                        Departamento
                      </p>
                      <p className="text-[0.88rem] text-[#2e2e2e]">
                        {contactCA.vchNomDpto}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#fdfcfa] border border-[#e8e4df] rounded-[4px]">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-[16px] h-[16px] text-[#c9a227] shrink-0" />
                      <p className="text-[0.68rem] font-semibold tracking-[0.12em] uppercase text-[#c9a227]">
                        Miembros ({integrantes.length})
                      </p>
                    </div>

                    {loadingIntegrantes ? (
                      <p className="text-[0.82rem] text-[#9a9a9a] text-center py-4">
                        Cargando integrantes...
                      </p>
                    ) : integrantes.length === 0 ? (
                      <p className="text-[0.82rem] text-[#9a9a9a] text-center py-4">
                        Sin integrantes registrados
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-col gap-[6px]">
                          {integrantes
                            .slice(
                              0,
                              showAllMembers
                                ? integrantes.length
                                : VISIBLE_MEMBERS,
                            )
                            .map((miembro, i) => (
                              <button
                                key={miembro.clave || i}
                                onClick={() => setSelectedMember(i)}
                                className={`flex items-center gap-3 p-3 rounded-[4px] border text-left cursor-pointer transition-all duration-300 ${
                                  selectedMember === i
                                    ? "bg-[#722F37] border-[#722F37] text-[#fff]"
                                    : "bg-[#fff] border-[#e8e4df] text-[#2e2e2e] hover:border-[#c9a227]"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[0.72rem] font-bold ${
                                    selectedMember === i
                                      ? "bg-[#c9a227] text-[#fff]"
                                      : "bg-[#faf5e4] text-[#c9a227]"
                                  }`}
                                >
                                  {miembro.nombre
                                    .split(" ")
                                    .slice(-2)
                                    .map((n: string) => n[0])
                                    .join("")}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[0.85rem] font-medium block truncate">
                                    {miembro.nombre}
                                  </span>
                                  {selectedMember === i && (
                                    <span className="text-[0.7rem] text-[#c9a227] mt-[2px] block truncate">
                                      {miembro.tieneCorreo ? "Correo registrado" : "Sin correo"}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                        </div>
                        {integrantes.length > VISIBLE_MEMBERS && (
                          <button
                            onClick={() => setShowAllMembers(!showAllMembers)}
                            className="mt-3 w-full flex items-center justify-center gap-[0.35rem] py-2 bg-transparent border border-dashed border-[#e8e4df] rounded-[4px] text-[0.78rem] font-semibold text-[#c9a227] cursor-pointer transition-all duration-300 hover:border-[#c9a227] hover:bg-[#fdf8ec]"
                          >
                            {showAllMembers ? (
                              <>
                                <span>Mostrar menos</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>
                                  Ver {integrantes.length - VISIBLE_MEMBERS}{" "}
                                  miembros mas
                                </span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {integrantes.length > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-[#fdfcfa] border border-[#e8e4df] rounded-[4px]">
                      <Mail className="w-[16px] h-[16px] text-[#c9a227] mt-[2px] shrink-0" />
                      <div>
                        <p className="text-[0.68rem] font-semibold tracking-[0.12em] uppercase text-[#c9a227] mb-1">
                          Contacto
                        </p>
                        <p className="text-[0.88rem] text-[#2e2e2e]">
                          {integrantes[selectedMember]?.tieneCorreo
                            ? "Correo registrado"
                            : "SIN REGISTRO"}
                        </p>
                        <p className="text-[0.72rem] text-[#9a9a9a] mt-[2px]">
                          Contactando a: {integrantes[selectedMember]?.nombre}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#e8e4df] pt-6">
                  <p className="text-[0.68rem] font-semibold tracking-[0.12em] uppercase text-[#c9a227] mb-3">
                    Enviar mensaje
                  </p>
                  <textarea
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe tu mensaje aqui..."
                    rows={4}
                    className="w-full p-4 bg-[#fdfcfa] border-[1.5px] border-[#e8e4df] rounded-[3px] text-[0.875rem] text-[#2e2e2e] outline-none transition-all duration-300 focus:border-[#c9a227] focus:bg-[#fff] placeholder:text-[#9a9a9a] resize-none"
                  />
                  {statusMsg && (
                    <p className="text-[0.82rem] mt-2 text-[#6b6b6b]">
                      {statusMsg}
                    </p>
                  )}
                  <button
                    onClick={enviarMensaje}
                    disabled={enviando}
                    className="mt-4 w-full py-[0.78rem] bg-[#722F37] text-[#fff] border-none rounded-[3px] text-[0.85rem] font-semibold tracking-[0.08em] uppercase cursor-pointer flex items-center justify-center gap-[0.55rem] transition-all duration-300 hover:bg-[#c9a227] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-[14px] h-[14px]" />
                    {enviando ? "Enviando..." : "Enviar mensaje"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CUERPOS GRID */}
      {!contactCA && (
        <section
          className="py-20 bg-[#fdfcfa]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 88% 8%, rgba(183,140,51,0.07) 0%, transparent 50%), radial-gradient(ellipse at 8% 92%, rgba(183,140,51,0.05) 0%, transparent 50%)",
          }}
        >
          <div className="max-w-[1240px] mx-auto px-8">
            <div className="mb-12">
              <span className="text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-[#c9a227] block mb-[0.65rem]">
                UTHH
              </span>
              <h2 className="font-serif text-[clamp(1.7rem,2.5vw,2.2rem)] font-bold text-[#722F37] leading-[1.15]">
                Todos los <em className="italic text-[#c9a227] font-normal">Cuerpos Académicos</em>
              </h2>
              <div className="w-11 h-[3px] bg-[#c9a227] rounded-[2px] mt-[0.9rem]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cuerposAcademicos.map((ca) => (
                <div
                  key={ca.id}
                  className="bg-[#fff] border border-[#e8e4df] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] group"
                >
                  <div className="relative overflow-hidden aspect-[16/10] bg-[#f0ece6]">
                    {ca.ImagenLogo ? (
                      <LogoCA
                        src={`/LogoTiposCA/${ca.ImagenLogo}`}
                        alt={ca.vchNombreCA}
                        className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <SinImagen />
                    )}
                    <span className="absolute top-4 left-4 font-serif text-[0.78rem] font-bold text-[#c9a227] tracking-[0.12em] bg-[rgba(0,0,0,0.55)] backdrop-blur-[6px] px-[0.65rem] py-1 rounded-[4px] border-l-2 border-[#c9a227]">
                      {ca.vchClvCA}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-[1.05rem] font-semibold text-[#722F37] leading-[1.3] mb-1">
                      {ca.vchNombreCA}
                    </h3>
                    <p className="text-[0.78rem] text-[#6b6b6b] mb-4">
                      {ca.vchNomDpto}
                    </p>
                    <button
                      onClick={() => openContact(ca)}
                      className="inline-flex items-center gap-[0.4rem] px-[1.1rem] py-[0.46rem] bg-transparent border border-[rgba(183,140,51,0.65)] text-[#c9a227] rounded-[4px] text-[0.74rem] font-semibold tracking-[0.02em] transition-all duration-300 hover:bg-[#c9a227] hover:text-[#fff] hover:border-[#c9a227] cursor-pointer"
                    >
                      <Phone className="w-[10px] h-[10px]" />
                      Contactar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

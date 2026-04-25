"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import {
  User,
  Users,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";
import { redirectForRole } from "@/lib/roles";

interface TipoUsuario {
  intClvTipoUsuario: string;
  vchTipoUsuario: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [tipos, setTipos] = useState<TipoUsuario[]>([]);
  const [role, setRole] = useState("");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tipos-usuario")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTipos(json.data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Selecciona un tipo de usuario.");
      return;
    }
    if (!usuario.trim()) {
      setError("Ingresa tu usuario.");
      return;
    }
    if (!contrasena) {
      setError("Ingresa tu contraseña.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        tipo: role,
        usuario,
        password: contrasena,
        redirect: false,
      });

      if (result?.error) {
        setError("Usuario, contraseña o tipo de usuario incorrecto.");
        setIsLoading(false);
        return;
      }

      // Obtener sesión real para redirigir según el tipo del SP, no del dropdown
      const session = await getSession();
      const tipoReal = (session?.user as { tipoUser?: string } | undefined)?.tipoUser;
      if (!tipoReal) {
        setError("No se pudo establecer la sesión. Intenta de nuevo.");
        setIsLoading(false);
        return;
      }
      router.push(redirectForRole(tipoReal));
    } catch {
      setError("Ocurrió un error al iniciar sesión.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 bg-[#fdfcfa] relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 15% 85%, rgba(183,140,51,0.08) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(114,47,55,0.06) 0%, transparent 50%)",
      }}
    >
      {/* Patrón de puntos sutil esquina superior derecha */}
      <div
        aria-hidden
        className="absolute top-8 right-8 w-[180px] h-[180px] opacity-[0.18] pointer-events-none hidden md:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, #722F37 1px, transparent 1.5px)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* Patrón dorado esquina inferior izquierda */}
      <div
        aria-hidden
        className="absolute bottom-8 left-8 w-[180px] h-[180px] opacity-[0.14] pointer-events-none hidden md:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, #c9a227 1px, transparent 1.5px)",
          backgroundSize: "16px 16px",
        }}
      />

      <div className="relative bg-[#fff] w-full max-w-[460px] p-[3.2rem_3rem_2.6rem] border border-[#e8e4df] rounded-[6px] shadow-[0_14px_56px_rgba(114,47,55,0.12),0_4px_18px_rgba(0,0,0,0.06)]">
        {/* Gold top bar con gradiente */}
        <div className="absolute top-0 left-0 right-0 h-[4px] rounded-t-[6px] bg-gradient-to-r from-[#c9a227] via-[#ddb94a] to-[#c9a227]" />

        {/* Esquinas ornamentales estilo certificado */}
        <svg aria-hidden className="absolute top-[14px] left-[14px] w-[22px] h-[22px] text-[#c9a227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M3 9V3h6" />
          <circle cx="3" cy="3" r="1.2" fill="currentColor" />
        </svg>
        <svg aria-hidden className="absolute top-[14px] right-[14px] w-[22px] h-[22px] text-[#c9a227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M15 3h6v6" />
          <circle cx="21" cy="3" r="1.2" fill="currentColor" />
        </svg>
        <svg aria-hidden className="absolute bottom-[14px] left-[14px] w-[22px] h-[22px] text-[#c9a227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M9 21H3v-6" />
          <circle cx="3" cy="21" r="1.2" fill="currentColor" />
        </svg>
        <svg aria-hidden className="absolute bottom-[14px] right-[14px] w-[22px] h-[22px] text-[#c9a227]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M21 15v6h-6" />
          <circle cx="21" cy="21" r="1.2" fill="currentColor" />
        </svg>

        {/* Header */}
        <div className="text-center mb-[1.8rem]">
          <div className="w-[74px] h-[74px] rounded-full bg-gradient-to-br from-[#722F37] to-[#5a252c] flex items-center justify-center mx-auto mb-[1.3rem] relative shadow-[0_10px_24px_rgba(114,47,55,0.38)]">
            <div className="absolute inset-[-4px] rounded-full border-[1.5px] border-[rgba(201,162,39,0.55)]" />
            <div className="absolute inset-[-9px] rounded-full border-[1px] border-[rgba(201,162,39,0.22)]" />
            <div className="absolute inset-[-14px] rounded-full border-[1px] border-dashed border-[rgba(201,162,39,0.12)]" />
            <User className="w-[30px] h-[30px] text-[#c9a227]" />
          </div>
          <span className="text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-[#c9a227] block mb-[0.55rem]">
            Sistema Institucional
          </span>
          <h1 className="font-serif text-[1.85rem] font-bold text-[#722F37] leading-[1.15] mb-[0.4rem]">
            Control de <em className="italic text-[#c9a227] font-normal">Acceso</em>
          </h1>
          <p className="text-[0.82rem] text-[#6b6b6b] font-light leading-[1.6]">
            Selecciona tu rol e ingresa tus credenciales.
          </p>
        </div>

        {/* UTHH badge */}
        <div className="flex items-center justify-center gap-3 my-[1.3rem]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e8e4df]" />
          <div className="flex items-center gap-[0.6rem] px-[1.1rem] py-[0.42rem] bg-gradient-to-b from-[#fdf8ec] to-[#faf5e4] border border-[rgba(201,162,39,0.5)] rounded-full shadow-[0_2px_8px_rgba(201,162,39,0.1)]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#c9a227]" />
            <span className="font-serif text-[0.82rem] font-bold text-[#722F37] tracking-[0.18em]">
              UTHH
            </span>
            <div className="w-[6px] h-[6px] rounded-full bg-[#c9a227]" />
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e8e4df]" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Role Select */}
          <div className="mb-5">
            <label
              className="block text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#2e2e2e] mb-2"
              htmlFor="role"
            >
              Tipo de usuario
            </label>
            <div className="relative">
              <Users className="absolute left-[0.85rem] top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#9a9a9a] pointer-events-none" />
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full py-[0.78rem] pl-10 pr-9 bg-[#fdfcfa] border-[1.5px] border-[#e8e4df] rounded-[3px] font-sans text-[0.875rem] text-[#2e2e2e] outline-none appearance-none transition-all duration-300 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)] focus:bg-[#fff]"
                required
              >
                <option value="" disabled>
                  {"-- Seleccionar rol --"}
                </option>
                {tipos.map((t) => (
                  <option key={t.intClvTipoUsuario} value={t.intClvTipoUsuario}>
                    {t.vchTipoUsuario}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-[0.8rem] top-1/2 -translate-y-1/2 w-3 h-3 text-[#9a9a9a] pointer-events-none" />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1 mb-5">
            <div className="flex-1 h-px bg-[#e8e4df]" />
            <span className="text-[0.62rem] tracking-[0.15em] uppercase text-[#9a9a9a] whitespace-nowrap">
              Credenciales
            </span>
            <div className="flex-1 h-px bg-[#e8e4df]" />
          </div>

          {/* Usuario */}
          <div className="mb-5">
            <label
              className="block text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#2e2e2e] mb-2"
              htmlFor="usuario"
            >
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-[0.85rem] top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#9a9a9a] pointer-events-none" />
              <input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                className="w-full py-[0.78rem] pl-10 pr-4 bg-[#fdfcfa] border-[1.5px] border-[#e8e4df] rounded-[3px] font-sans text-[0.875rem] text-[#2e2e2e] outline-none transition-all duration-300 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)] focus:bg-[#fff] placeholder:text-[#9a9a9a] placeholder:font-light"
                required
              />
            </div>
          </div>

          {/* Contrasena */}
          <div className="mb-5">
            <label
              className="block text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#2e2e2e] mb-2"
              htmlFor="contrasena"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-[0.85rem] top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#9a9a9a] pointer-events-none" />
              <input
                id="contrasena"
                type={showPassword ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="--------"
                autoComplete="current-password"
                className="w-full py-[0.78rem] pl-10 pr-10 bg-[#fdfcfa] border-[1.5px] border-[#e8e4df] rounded-[3px] font-sans text-[0.875rem] text-[#2e2e2e] outline-none transition-all duration-300 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)] focus:bg-[#fff] placeholder:text-[#9a9a9a] placeholder:font-light"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-[0.8rem] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#9a9a9a] p-0 flex transition-colors duration-300 hover:text-[#c9a227]"
              >
                {showPassword ? (
                  <EyeOff className="w-[15px] h-[15px]" />
                ) : (
                  <Eye className="w-[15px] h-[15px]" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-[0.78rem] text-red-600 text-center mb-4 bg-red-50 border border-red-200 rounded-[3px] py-2 px-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="relative w-full mt-3 py-[0.95rem] bg-gradient-to-br from-[#722F37] to-[#5a252c] text-[#fff] border-none rounded-[4px] font-sans text-[0.85rem] font-semibold tracking-[0.1em] uppercase cursor-pointer flex items-center justify-center gap-[0.55rem] transition-all duration-300 hover:shadow-[0_10px_28px_rgba(114,47,55,0.45)] hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-70 disabled:hover:transform-none overflow-hidden group"
            style={isLoading ? { background: "linear-gradient(to bottom right, #c9a227, #a68520)" } : {}}
          >
            {/* Brillo animado en hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(201,162,39,0.2)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <LogIn className="w-[14px] h-[14px] relative z-10" />
            <span className="relative z-10">{isLoading ? "Verificando..." : "Accesar"}</span>
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-[0.35rem] mt-[1.35rem] text-[0.75rem] font-medium text-[#9a9a9a] no-underline transition-colors duration-300 hover:text-[#c9a227]"
          >
            <ChevronLeft className="w-3 h-3" />
            Volver al inicio
          </Link>
        </form>

        <div className="mt-[1.8rem] pt-[1.4rem] border-t border-[#e8e4df] text-[0.7rem] text-[#9a9a9a] text-center leading-[1.65]">
          {"¿Problemas para acceder?"}&nbsp;
          <Link
            href="mailto:rectoria@uthh.edu.mx"
            className="text-[#c9a227] no-underline hover:text-[#722F37]"
          >
            rectoria@uthh.edu.mx
          </Link>
          &nbsp;·&nbsp; 789 896 2088
        </div>
      </div>
    </div>
  );
}

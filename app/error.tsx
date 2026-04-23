"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error] ", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfcfa] px-6">
      <div className="max-w-md text-center">
        <p className="text-[0.7rem] tracking-[0.18em] uppercase text-[#c9a227] font-semibold mb-3">
          Algo salió mal
        </p>
        <h1 className="font-serif text-[1.6rem] font-bold text-[#722F37] mb-3">
          No pudimos cargar esta página
        </h1>
        <p className="text-[0.9rem] text-[#6b6b6b] mb-6">
          Ocurrió un error inesperado. Puedes intentar de nuevo o regresar al inicio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2 bg-[#722F37] text-white rounded-[3px] text-[0.82rem] font-semibold hover:bg-[#c9a227] transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="px-5 py-2 border border-[#e8e4df] text-[#2e2e2e] rounded-[3px] text-[0.82rem] font-semibold no-underline hover:border-[#c9a227] transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

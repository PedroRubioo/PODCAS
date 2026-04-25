"use client";

import { X, Info } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  accent?: string;
  description?: string;
};

/**
 * Dialog reutilizable para indicar que una acción pertenece a un módulo
 * que aún no está implementado con backend. Mantiene el estilo del sistema.
 */
export function ConstructionDialog({
  open,
  onClose,
  title,
  accent,
  description = "Esta sección todavía no permite guardar registros nuevos. El módulo se encuentra en desarrollo y estará disponible en una próxima actualización del sistema.",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(10,10,10,0.55)] backdrop-blur-[4px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white w-full max-w-[440px] p-8 border border-[#e8e4df] rounded-[6px] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[6px] bg-gradient-to-r from-[#c9a227] via-[#ddb94a] to-[#c9a227]" />

        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 text-[#9a9a9a] hover:text-[#722F37] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#faf5e4] to-[#f0e8cf] border border-[rgba(201,162,39,0.45)] flex items-center justify-center mb-4">
            <Info className="w-6 h-6 text-[#c9a227]" />
          </div>
          <span className="text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-[#c9a227] mb-2">
            Módulo en construcción
          </span>
          <h2 className="font-serif text-[1.4rem] font-bold text-[#722F37] leading-tight mb-3">
            {title}
            {accent && (
              <>
                {" "}
                <em className="italic text-[#c9a227] font-normal">{accent}</em>
              </>
            )}
          </h2>
          <p className="text-[0.88rem] text-[#6b6b6b] leading-[1.65] mb-6">
            {description}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-[0.7rem] bg-gradient-to-br from-[#722F37] to-[#5a252c] text-white rounded-[4px] text-[0.82rem] font-semibold tracking-[0.05em] uppercase transition-all duration-300 hover:shadow-[0_8px_22px_rgba(114,47,55,0.35)]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

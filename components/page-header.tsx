import { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  accent?: string;
  subtitle?: string;
  right?: ReactNode;
  tone?: "light" | "dark";
  decorNumber?: string;
};

/**
 * Header unificado para páginas del dashboard y secciones públicas.
 * Mantiene la identidad editorial: eyebrow dorado con línea, título serif con
 * acento italic opcional y subtítulo sutil.
 */
export function PageHeader({
  eyebrow,
  title,
  accent,
  subtitle,
  right,
  tone = "light",
  decorNumber,
}: PageHeaderProps) {
  const titleColor = tone === "dark" ? "text-[#fff]" : "text-[#722F37]";
  const subtitleColor = tone === "dark" ? "text-[rgba(255,255,255,0.65)]" : "text-[#6b6b6b]";

  return (
    <div className="relative mb-8 md:mb-10">
      {decorNumber && (
        <div
          aria-hidden
          className="absolute -top-6 -right-2 font-serif text-[8rem] md:text-[12rem] font-bold text-[rgba(114,47,55,0.04)] leading-none select-none pointer-events-none hidden md:block"
        >
          {decorNumber}
        </div>
      )}
      <div className="relative flex items-end justify-between gap-6 flex-wrap">
        <div className="min-w-0">
          {eyebrow && (
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-[2px] bg-[#c9a227] rounded" />
              <span className="text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-[#c9a227]">
                {eyebrow}
              </span>
            </div>
          )}
          <h1
            className={`font-serif text-[clamp(1.55rem,2.6vw,2rem)] font-bold leading-[1.15] tracking-[-0.005em] ${titleColor}`}
          >
            {title}
            {accent && (
              <>
                {" "}
                <em className="italic text-[#c9a227] font-normal">{accent}</em>
              </>
            )}
          </h1>
          {subtitle && (
            <p className={`text-[0.88rem] mt-[0.55rem] font-light leading-[1.6] max-w-[640px] ${subtitleColor}`}>
              {subtitle}
            </p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
}

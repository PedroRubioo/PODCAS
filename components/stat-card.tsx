import type { LucideIcon } from "lucide-react"

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="relative bg-[#fff] border border-[#e8e4df] p-6 transition-all duration-400 hover:shadow-[0_12px_32px_rgba(114,47,55,0.08)] hover:border-[rgba(201,162,39,0.45)] hover:-translate-y-[2px] group overflow-hidden">
      {/* Acento dorado top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-center" />
      {/* Esquina decorativa */}
      <div className="absolute top-0 right-0 w-[40px] h-[40px] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20px] right-[-20px] w-[40px] h-[40px] bg-[rgba(201,162,39,0.12)] rotate-45" />
      </div>
      <div className="flex items-start justify-between mb-[0.85rem]">
        <div className="w-11 h-11 bg-gradient-to-br from-[#faf5e4] to-[#f0e8cf] flex items-center justify-center rounded-[4px] border border-[rgba(201,162,39,0.25)] transition-transform duration-300 group-hover:scale-105">
          <Icon className="w-[18px] h-[18px] text-[#c9a227]" />
        </div>
      </div>
      <p className="text-[0.66rem] font-semibold tracking-[0.14em] uppercase text-[#9a9a9a] mb-[0.3rem]">
        {label}
      </p>
      <p className="font-serif text-[1.85rem] font-bold text-[#722F37] leading-[1.08] tracking-[-0.01em]">
        {value}
      </p>
      {sub && <p className="text-[0.74rem] text-[#6b6b6b] mt-[0.3rem] font-light">{sub}</p>}
    </div>
  )
}

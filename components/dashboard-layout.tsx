"use client"

import { DashboardSidebar } from "./dashboard-sidebar"

export function DashboardLayout({ role, children }: { role: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#fdfcfa]">
      <DashboardSidebar role={role} />
      <div className="flex-1 overflow-x-hidden">
        {/* Top bar */}
        <header className="h-[60px] bg-[#fff] border-b border-[#e8e4df] flex items-center justify-between px-8 sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[6px] h-[6px] rounded-full bg-[#c9a227] shrink-0" />
            <span className="text-[0.68rem] tracking-[0.14em] uppercase text-[#9a9a9a] font-semibold shrink-0">
              Panel de control
            </span>
            <span className="hidden md:inline-block h-3 w-px bg-[#e8e4df] mx-1 shrink-0" />
            <span className="hidden md:block text-[0.78rem] text-[#722F37] font-serif font-semibold truncate">
              Universidad Tecnológica de la Huasteca Hidalguense
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden sm:inline text-[0.78rem] text-[#6b6b6b] capitalize">
              {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Mexico_City" })}
            </span>
          </div>
        </header>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

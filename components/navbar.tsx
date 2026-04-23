"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const NAV_LINKS = [
  { href: "/cuerpos-academicos", label: "Cuerpos Académicos" },
  { href: "/publicaciones", label: "Divulgación" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--nav-bg)] backdrop-blur-[18px] border-b border-[rgba(201,162,39,0.2)] shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between px-6 md:px-12 h-[68px]">
        <Link href="/" className="flex items-center gap-3 no-underline" onClick={closeMobile}>
          <span className="font-serif text-[1.3rem] font-bold text-[#fff] tracking-[0.06em]">
            UTHH
          </span>
        </Link>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-10 list-none">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`text-[rgba(255,255,255,0.7)] no-underline text-[0.875rem] font-medium tracking-[0.02em] transition-colors duration-300 hover:text-[#fff] relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-[#c9a227] after:rounded-[2px] after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100 ${pathname === l.href ? "text-[#fff] after:scale-x-100" : ""}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/login"
              className="px-[1.4rem] py-[0.48rem] bg-[#c9a227] text-[#1a1a1a] rounded-[50px] font-semibold text-[0.85rem] transition-all duration-300 hover:bg-[#ddb94a] hover:shadow-[0_6px_18px_rgba(201,162,39,0.35)] no-underline"
            >
              Iniciar sesión
            </Link>
          </li>
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden text-white p-2 -mr-2 transition-colors duration-200 hover:text-[#c9a227]"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-[rgba(201,162,39,0.2)] bg-[var(--nav-bg)]">
          <ul className="flex flex-col list-none px-6 py-4 gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={closeMobile}
                  className={`block py-3 text-[0.95rem] font-medium no-underline transition-colors duration-200 ${pathname === l.href ? "text-[#c9a227]" : "text-[rgba(255,255,255,0.85)] hover:text-[#fff]"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/login"
                onClick={closeMobile}
                className="block text-center px-[1.4rem] py-[0.7rem] bg-[#c9a227] text-[#1a1a1a] rounded-[50px] font-semibold text-[0.85rem] no-underline transition-colors duration-200 hover:bg-[#ddb94a]"
              >
                Iniciar sesión
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

const NAV_LINKS = [
  { href: "/cuerpos-academicos", label: "Cuerpos Académicos" },
  { href: "/publicaciones", label: "Divulgación" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const closeMobile = () => setMobileOpen(false)

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-[18px] transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(114,47,55,0.98)] shadow-[0_6px_28px_rgba(0,0,0,0.28)] border-b border-[rgba(201,162,39,0.3)]"
          : "bg-[var(--nav-bg)] shadow-[0_4px_24px_rgba(0,0,0,0.2)] border-b border-[rgba(201,162,39,0.2)]"
      }`}
    >
      {/* Línea dorada decorativa superior */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />

      <div
        className={`flex items-center justify-between px-6 md:px-12 transition-all duration-300 ${
          scrolled ? "h-[68px]" : "h-[78px]"
        }`}
      >
        {/* Logo + nombre */}
        <Link href="/" className="flex items-center gap-3 no-underline min-w-0 group" onClick={closeMobile}>
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#c9a227] to-[#a68520] flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.32)] border border-[rgba(255,255,255,0.18)] transition-transform duration-300 group-hover:scale-105">
              <span className="font-serif text-[0.7rem] font-bold text-[#722F37] tracking-[0.08em]">UTHH</span>
            </div>
            <div className="absolute inset-[-3px] rounded-full border border-[rgba(201,162,39,0.3)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-serif text-[0.82rem] sm:text-[0.95rem] font-bold text-[#fff] tracking-[0.02em] truncate">
              Universidad Tecnológica
            </span>
            <span className="text-[0.6rem] sm:text-[0.68rem] text-[rgba(201,162,39,0.92)] tracking-[0.14em] uppercase truncate">
              de la Huasteca Hidalguense
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-10 list-none shrink-0">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`text-[rgba(255,255,255,0.75)] no-underline text-[0.88rem] font-medium tracking-[0.02em] transition-colors duration-300 hover:text-[#fff] relative after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-[#c9a227] after:to-transparent after:scale-x-0 after:origin-center after:transition-transform after:duration-400 hover:after:scale-x-100 ${pathname === l.href ? "text-[#fff] after:scale-x-100" : ""}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/login"
              className="relative inline-flex items-center px-[1.5rem] py-[0.55rem] bg-gradient-to-br from-[#c9a227] to-[#b78c33] text-[#1a1a1a] rounded-[50px] font-semibold text-[0.85rem] transition-all duration-300 hover:shadow-[0_8px_22px_rgba(201,162,39,0.4)] hover:-translate-y-[1px] no-underline overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.3)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">Iniciar sesión</span>
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
          className="md:hidden text-white p-2 -mr-2 transition-colors duration-200 hover:text-[#c9a227] shrink-0"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-[rgba(201,162,39,0.25)] bg-[var(--nav-bg)] backdrop-blur-[18px]">
          <ul className="flex flex-col list-none px-6 py-5 gap-1">
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
            <li className="pt-3 border-t border-[rgba(255,255,255,0.1)] mt-2">
              <Link
                href="/login"
                onClick={closeMobile}
                className="block text-center px-[1.4rem] py-[0.8rem] bg-gradient-to-br from-[#c9a227] to-[#b78c33] text-[#1a1a1a] rounded-[50px] font-semibold text-[0.85rem] no-underline transition-all duration-200 hover:shadow-[0_6px_18px_rgba(201,162,39,0.35)]"
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

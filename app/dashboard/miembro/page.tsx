"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { BookOpen, FileText, Upload, UserCog, Users, Building2, FolderOpen } from "lucide-react"
import Link from "next/link"

interface DashboardData {
  nombre: string
  descripcionPuesto: string
  departamento: string
  imagenPerfil: string
  nombreCA: string
  claveCA: string
  totalProduccion: number
  totalMiembros: number
  produccionReciente: { intClvProduccion: number; vchTituloProducto: string; vchNombreProducto: string; dtmFechaRegistro: string; vchNombreStatus: string }[]
}

export default function MiembroDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch("/api/miembro/dashboard")
      .then((r) => r.json())
      .then((json) => { if (json.success) setData(json.data) })
      .catch(() => {})
  }, [])

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <DashboardLayout role="miembro">
      <div className="mb-8">
        <span className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-[#c9a227] block mb-2">
          {data ? `Miembro de ${data.nombreCA}` : "Miembro del Cuerpo Académico"}
        </span>
        <h1 className="font-serif text-[1.8rem] font-bold text-[#722F37] leading-tight">
          {data ? `Bienvenido, ${data.nombre}` : "Cargando..."}
        </h1>
        <p className="text-[0.85rem] text-[#6b6b6b] mt-1">
          {data?.departamento ?? ""}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[6px] mb-8">
        <StatCard icon={FileText} label="Producción académica" value={String(data?.totalProduccion ?? "—")} sub="Registros totales" />
        <StatCard icon={Upload} label="En revisión" value={String(data?.produccionReciente?.filter(p => p.vchNombreStatus !== "Publicado").length ?? "—")} sub="Pendientes" />
        <StatCard icon={FolderOpen} label="Clave C.A." value={data?.claveCA ?? "—"} sub="Tu cuerpo académico" />
        <StatCard icon={Users} label="Miembros en C.A." value={String(data?.totalMiembros ?? "—")} sub="Activos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[6px] mb-8">
        {/* Mi producción reciente */}
        <div className="bg-[#fff] border border-[#e8e4df] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Upload className="w-[14px] h-[14px] text-[#c9a227]" />
              <h3 className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-[#c9a227]">Mi producción reciente</h3>
            </div>
            <Link href="/dashboard/miembro/produccion" className="text-[0.72rem] font-semibold text-[#c9a227] no-underline hover:text-[#722F37] transition-colors duration-300">
              Ver toda
            </Link>
          </div>
          <div className="flex flex-col">
            {data?.produccionReciente?.length ? data.produccionReciente.map((item) => (
              <div key={item.intClvProduccion} className="flex items-center justify-between py-3 border-b border-[#e8e4df] last:border-b-0">
                <div>
                  <p className="text-[0.82rem] font-medium text-[#2e2e2e]">{item.vchTituloProducto}</p>
                  <p className="text-[0.7rem] text-[#9a9a9a]">{item.vchNombreProducto} · {formatFecha(item.dtmFechaRegistro)}</p>
                </div>
                <span className={`text-[0.68rem] font-semibold px-2 py-0.5 rounded-[3px] shrink-0 ${item.vchNombreStatus === "Publicado" ? "bg-[#722F37] text-[#fff]" : "bg-[#faf5e4] text-[#c9a227]"}`}>
                  {item.vchNombreStatus}
                </span>
              </div>
            )) : (
              <p className="text-[0.82rem] text-[#9a9a9a] py-4 text-center">
                {data ? "Sin producción registrada" : "Cargando..."}
              </p>
            )}
          </div>
        </div>

        {/* Info del cuerpo */}
        <div className="bg-[#fff] border border-[#e8e4df] p-6">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-[14px] h-[14px] text-[#c9a227]" />
            <h3 className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-[#c9a227]">Mi información</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-[#9a9a9a] mb-1">Cuerpo Académico</p>
              <p className="text-[0.85rem] font-medium text-[#2e2e2e]">{data?.nombreCA ?? "—"}</p>
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-[#9a9a9a] mb-1">Departamento</p>
              <p className="text-[0.85rem] font-medium text-[#2e2e2e]">{data?.departamento ?? "—"}</p>
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-[#9a9a9a] mb-1">Descripción del puesto</p>
              <p className="text-[0.85rem] text-[#6b6b6b]">{data?.descripcionPuesto || "Sin descripción"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-[#fff] border border-[#e8e4df] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-[14px] h-[14px] text-[#c9a227]" />
          <h3 className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-[#c9a227]">Acciones rápidas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Subir producción", href: "/dashboard/miembro/produccion", icon: Upload },
            { label: "Ver publicaciones", href: "/dashboard/miembro/publicaciones", icon: BookOpen },
            { label: "Editar perfil", href: "/dashboard/miembro/perfil", icon: UserCog },
            { label: "Contactar C.A.", href: "/dashboard/miembro/contactar", icon: Users },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 p-4 border border-[#e8e4df] rounded-[3px] no-underline text-[#2e2e2e] transition-all duration-300 hover:border-[#c9a227] hover:shadow-[0_2px_12px_rgba(183,140,51,0.1)]"
            >
              <action.icon className="w-[16px] h-[16px] text-[#c9a227] shrink-0" />
              <span className="text-[0.82rem] font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

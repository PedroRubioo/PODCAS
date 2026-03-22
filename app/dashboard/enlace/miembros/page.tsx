"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Users } from "lucide-react"
import { useEffect, useState } from "react"

type Miembro = {
  clave: string; nombre: string; departamento: string
  claveCA: string; nombreCA: string; perfil: string; tipoRol: string
}

export default function MiembrosPage() {
  const [lista, setLista] = useState<Miembro[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/enlace/miembros")
      .then(r => r.json())
      .then(d => {
        if (d.success) setLista(d.data)
        else setError("Error al cargar miembros")
      })
      .catch(() => setError("Error de conexión"))
  }, [])

  const filtrada = lista.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (m.nombreCA ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (m.departamento ?? "").toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <DashboardLayout role="enlace">
      <div className="mb-8">
        <span className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-[#c9a227] block mb-2">Enlace Académico</span>
        <h1 className="font-serif text-[1.8rem] font-bold text-[#722F37] leading-tight">Datos Generales de Miembros</h1>
        <p className="text-[0.85rem] text-[#6b6b6b] mt-1">Todos los integrantes y representantes de cuerpos académicos.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-[0.82rem] text-red-600">{error}</div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-[0.82rem] text-[#6b6b6b]">{filtrada.length} miembros</p>
        <input
          type="text"
          placeholder="Buscar por nombre, C.A. o departamento..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-[#e8e4df] rounded-[3px] px-3 py-2 text-[0.82rem] w-72 focus:outline-none focus:border-[#c9a227]"
        />
      </div>

      <div className="bg-[#fff] border border-[#e8e4df] overflow-x-auto">
        <table className="w-full text-[0.82rem]">
          <thead>
            <tr className="border-b border-[#e8e4df] bg-[#fdfcfa]">
              {["Nombre", "Departamento", "Cuerpo Académico", "Perfil PROMEP", "Rol"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[0.72rem] font-semibold text-[#9a9a9a] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrada.map((m, i) => (
              <tr key={i} className="border-b border-[#e8e4df] hover:bg-[#fdfcfa]">
                <td className="px-4 py-3 font-medium text-[#2e2e2e]">
                  <div>{m.nombre}</div>
                  <div className="text-[0.72rem] text-[#9a9a9a]">{m.clave}</div>
                </td>
                <td className="px-4 py-3 text-[#6b6b6b]">{m.departamento}</td>
                <td className="px-4 py-3">
                  <span className="text-[0.72rem] font-bold text-[#c9a227] bg-[rgba(201,162,39,0.1)] px-2 py-0.5 rounded-[2px]">{m.claveCA}</span>
                  <span className="ml-2 text-[#6b6b6b]">{m.nombreCA}</span>
                </td>
                <td className="px-4 py-3 text-[#6b6b6b]">{m.perfil}</td>
                <td className="px-4 py-3">
                  <span className={`text-[0.72rem] font-semibold px-2 py-0.5 rounded-[3px] ${
                    m.tipoRol === "Representante"
                      ? "bg-[#faf5e4] text-[#c9a227]"
                      : "bg-[rgba(114,47,55,0.08)] text-[#722F37]"
                  }`}>{m.tipoRol}</span>
                </td>
              </tr>
            ))}
            {filtrada.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[#9a9a9a] text-[0.82rem]">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No se encontraron miembros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { FolderOpen, Plus, Users, Calendar, X, Save } from "lucide-react"

/**
 * NOTA: mock local en memoria. Cuando se cree la tabla `tbl_CA_Proyectos`
 * los campos deben coincidir (vchNombreProyecto, vchDescripcion,
 * dtmFechaInicio, dtmFechaFin, intStatus, intPorcentajeAvance, vchClvCA,
 * vchParticipantes).
 */
type Proyecto = {
  intClvProyecto: number
  vchNombreProyecto: string
  vchDescripcion: string
  dtmFechaInicio: string
  dtmFechaFin: string
  intStatus: "En desarrollo" | "Terminado"
  intPorcentajeAvance: number
  vchParticipantes: string[]
}

const mockInicial: Proyecto[] = [
  {
    intClvProyecto: 1,
    vchNombreProyecto: "Generador de Horarios mediante Algoritmos Evolutivos",
    vchDescripcion: "Desarrollo de un sistema inteligente para la generación automática de horarios escolares utilizando algoritmos genéticos y evolutivos.",
    intStatus: "En desarrollo",
    intPorcentajeAvance: 75,
    dtmFechaInicio: "2024-01-01",
    dtmFechaFin: "2025-06-30",
    vchParticipantes: ["E. Juarez", "J. Mendoza"],
  },
  {
    intClvProyecto: 2,
    vchNombreProyecto: "Portal Digital de Cuerpos Académicos de la UTHH",
    vchDescripcion: "Implementación de un sistema web para el control y visualización de la producción académica de los cuerpos académicos.",
    intStatus: "En desarrollo",
    intPorcentajeAvance: 60,
    dtmFechaInicio: "2024-03-01",
    dtmFechaFin: "2025-08-31",
    vchParticipantes: ["J. Mendoza", "E. Juarez"],
  },
  {
    intClvProyecto: 3,
    vchNombreProyecto: "Publicación del libro: Trajes Representativos de la Huasteca Hidalguense",
    vchDescripcion: "Software multimedia sobre los trajes típicos de la Huasteca Hidalguense, que incluye 8 municipios de la región.",
    intStatus: "Terminado",
    intPorcentajeAvance: 100,
    dtmFechaInicio: "2023-09-01",
    dtmFechaFin: "2024-12-31",
    vchParticipantes: ["J. Mendoza", "S. San Vicente"],
  },
]

const formInicial = {
  vchNombreProyecto: "",
  vchDescripcion: "",
  dtmFechaInicio: "",
  dtmFechaFin: "",
  intStatus: "En desarrollo" as "En desarrollo" | "Terminado",
  intPorcentajeAvance: 0,
  vchParticipantes: "",
}

function formatMes(iso: string) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      month: "short",
      year: "numeric",
      timeZone: "America/Mexico_City",
    })
  } catch {
    return iso
  }
}

export default function LiderProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>(mockInicial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(formInicial)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vchNombreProyecto.trim() || !form.vchDescripcion.trim()) {
      setMsg({ text: "Nombre y descripción son obligatorios.", ok: false })
      return
    }
    const nuevo: Proyecto = {
      intClvProyecto: (proyectos.at(-1)?.intClvProyecto ?? 0) + 1,
      vchNombreProyecto: form.vchNombreProyecto.trim(),
      vchDescripcion: form.vchDescripcion.trim(),
      dtmFechaInicio: form.dtmFechaInicio,
      dtmFechaFin: form.dtmFechaFin,
      intStatus: form.intStatus,
      intPorcentajeAvance: Number(form.intPorcentajeAvance) || 0,
      vchParticipantes: form.vchParticipantes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }
    setProyectos([...proyectos, nuevo])
    setForm(formInicial)
    setShowForm(false)
    setMsg({ text: "Proyecto registrado correctamente (vista de demostración).", ok: true })
    setTimeout(() => setMsg(null), 4000)
  }

  return (
    <DashboardLayout role="lider">
      <PageHeader
        eyebrow="UTHH-CA-7"
        title="Proyectos"
        subtitle="Gestiona los proyectos de investigación del cuerpo académico."
      />

      {msg && (
        <div
          className={`mb-4 text-[0.82rem] px-4 py-2.5 rounded-[4px] border ${
            msg.ok
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <p className="text-[0.82rem] text-[#6b6b6b]">{proyectos.length} proyectos registrados</p>
        <button
          onClick={() => {
            setMsg(null)
            setShowForm(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-[0.55rem] bg-gradient-to-br from-[#722F37] to-[#5a252c] text-white rounded-[4px] text-[0.78rem] font-semibold transition-all duration-300 hover:shadow-[0_8px_22px_rgba(114,47,55,0.35)] hover:-translate-y-[1px]"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo proyecto
        </button>
      </div>

      <div className="flex flex-col gap-[6px]">
        {proyectos.map((p) => (
          <div
            key={p.intClvProyecto}
            className="bg-white border border-[#e4ddd0] p-6 hover:shadow-[0_4px_20px_rgba(114,47,55,0.06)] hover:border-[rgba(201,162,39,0.45)] transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#faf5e4] flex items-center justify-center rounded-[3px] shrink-0">
                  <FolderOpen className="w-[16px] h-[16px] text-[#c9a227]" />
                </div>
                <div>
                  <h3 className="font-serif text-[1rem] font-semibold text-[#722F37]">
                    {p.vchNombreProyecto}
                  </h3>
                  <p className="text-[0.75rem] text-[#9a9a9a] mt-0.5">{p.vchDescripcion}</p>
                </div>
              </div>
              <span
                className={`text-[0.68rem] font-semibold px-2 py-0.5 rounded-[3px] shrink-0 ${
                  p.intStatus === "Terminado"
                    ? "bg-[#722F37] text-white"
                    : "bg-[#faf5e4] text-[#c9a227]"
                }`}
              >
                {p.intStatus}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.72rem] text-[#6b6b6b]">Avance</span>
                <span className="text-[0.72rem] font-semibold text-[#2e2e2e]">
                  {p.intPorcentajeAvance}%
                </span>
              </div>
              <div className="w-full h-[5px] bg-[#f0ece4] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    p.intPorcentajeAvance === 100 ? "bg-[#722F37]" : "bg-[#c9a227]"
                  }`}
                  style={{ width: `${p.intPorcentajeAvance}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-3 border-t border-[#e4ddd0] flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#9a9a9a]" />
                <span className="text-[0.75rem] text-[#6b6b6b]">
                  {formatMes(p.dtmFechaInicio)} – {formatMes(p.dtmFechaFin)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#9a9a9a]" />
                <span className="text-[0.75rem] text-[#6b6b6b]">
                  {p.vchParticipantes.join(", ") || "Sin participantes"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Formulario de nuevo proyecto */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(10,10,10,0.55)] backdrop-blur-[4px]"
          onClick={() => setShowForm(false)}
        >
          <div
            className="relative bg-white w-full max-w-[560px] max-h-[92vh] overflow-y-auto border border-[#e8e4df] rounded-[6px] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[6px] bg-gradient-to-r from-[#c9a227] via-[#ddb94a] to-[#c9a227]" />

            <div className="p-7">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <span className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-[#c9a227] block mb-2">
                    Cuerpo Académico · UTHH-CA-7
                  </span>
                  <h2 className="font-serif text-[1.5rem] font-bold text-[#722F37] leading-tight">
                    Nuevo <em className="italic text-[#c9a227] font-normal">proyecto</em>
                  </h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  aria-label="Cerrar"
                  className="text-[#9a9a9a] hover:text-[#722F37] transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#2e2e2e] mb-1.5">
                    Nombre del proyecto
                  </label>
                  <input
                    type="text"
                    value={form.vchNombreProyecto}
                    onChange={(e) => setForm({ ...form, vchNombreProyecto: e.target.value })}
                    placeholder="Ej. Generador de horarios mediante algoritmos evolutivos"
                    className="w-full py-[0.6rem] px-3 bg-[#fdfcfa] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)]"
                    required
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#2e2e2e] mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={form.vchDescripcion}
                    onChange={(e) => setForm({ ...form, vchDescripcion: e.target.value })}
                    placeholder="Describe brevemente el objetivo y alcance del proyecto"
                    className="w-full py-[0.6rem] px-3 bg-[#fdfcfa] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)] resize-none"
                    required
                    maxLength={850}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#2e2e2e] mb-1.5">
                      Fecha de inicio
                    </label>
                    <input
                      type="date"
                      value={form.dtmFechaInicio}
                      onChange={(e) => setForm({ ...form, dtmFechaInicio: e.target.value })}
                      className="w-full py-[0.6rem] px-3 bg-[#fdfcfa] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#2e2e2e] mb-1.5">
                      Fecha estimada de término
                    </label>
                    <input
                      type="date"
                      value={form.dtmFechaFin}
                      onChange={(e) => setForm({ ...form, dtmFechaFin: e.target.value })}
                      className="w-full py-[0.6rem] px-3 bg-[#fdfcfa] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#2e2e2e] mb-1.5">
                      Estado
                    </label>
                    <select
                      value={form.intStatus}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          intStatus: e.target.value as "En desarrollo" | "Terminado",
                        })
                      }
                      className="w-full py-[0.6rem] px-3 bg-[#fdfcfa] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)] appearance-none"
                    >
                      <option value="En desarrollo">En desarrollo</option>
                      <option value="Terminado">Terminado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#2e2e2e] mb-1.5">
                      Porcentaje de avance
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.intPorcentajeAvance}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          intPorcentajeAvance: Math.max(0, Math.min(100, Number(e.target.value))),
                        })
                      }
                      className="w-full py-[0.6rem] px-3 bg-[#fdfcfa] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#2e2e2e] mb-1.5">
                    Participantes
                  </label>
                  <input
                    type="text"
                    value={form.vchParticipantes}
                    onChange={(e) => setForm({ ...form, vchParticipantes: e.target.value })}
                    placeholder="Separa los nombres con comas. Ej: E. Juárez, J. Mendoza"
                    className="w-full py-[0.6rem] px-3 bg-[#fdfcfa] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)]"
                    maxLength={850}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-[#e4ddd0]">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-[0.55rem] text-[#6b6b6b] border border-[#e4ddd0] rounded-[3px] text-[0.82rem] font-semibold hover:border-[#722F37] hover:text-[#722F37] transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-[0.55rem] bg-gradient-to-br from-[#722F37] to-[#5a252c] text-white rounded-[3px] text-[0.82rem] font-semibold transition-all duration-300 hover:shadow-[0_8px_22px_rgba(114,47,55,0.35)]"
                  >
                    <Save className="w-4 h-4" />
                    Guardar proyecto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

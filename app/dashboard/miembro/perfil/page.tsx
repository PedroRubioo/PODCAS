"use client"

import { useEffect, useState, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UserCog, Mail, GraduationCap, Building2, Save, Phone, Calendar, Award } from "lucide-react"

interface Catalogo { value: string; label: string }
interface PerfilData {
  ImagenLogo: string
  dtmFchRegistro: string
  vchClvCA: string
  vchNombreCA: string
  intClvLGAC: string | number
  vchNombre: string
  vchAPaterno: string
  vchAMaterno: string
  chrSexoTrab: string
  vchTelefono: string
  vchEmail: string
  vchDescripcion: string
  intClvNivelRPOMEP: string | number
  dtmFchInicioPROMEP: string
  dtmFchVencimientoPROMEP: string
  vchEmailPersonal: string
}

export default function MiembroPerfilPage() {
  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [perfiles, setPerfiles] = useState<Catalogo[]>([])
  const [lgac, setLgac] = useState<Catalogo[]>([])
  const [lineas, setLineas] = useState<Catalogo[]>([])
  const [form, setForm] = useState({ telefono: "", emailPersonal: "", linea: "", perfil: "", lgac: "", fechaInicio: "", fechaVenc: "" })
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/miembro/perfil")
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) { setLoadError(json.error ?? "Error desconocido"); return }
        if (json.success && json.data) {
          const d = json.data
          setPerfil(d)
          setForm({
            telefono: d.vchTelefono ?? "",
            emailPersonal: d.vchEmailPersonal ?? "",
            linea: String(d.vchDescripcion ?? ""),
            perfil: String(d.intClvNivelRPOMEP ?? ""),
            lgac: String(d.intClvLGAC ?? ""),
            fechaInicio: d.dtmFchInicioPROMEP ? d.dtmFchInicioPROMEP.substring(0, 10) : "",
            fechaVenc: d.dtmFchVencimientoPROMEP ? d.dtmFchVencimientoPROMEP.substring(0, 10) : "",
          })
        }
        if (json.catalogos) {
          setPerfiles(json.catalogos.perfiles.map((p: any) => ({ value: String(p.intClvPerfilPROMEP), label: p.vchNombrePerfil })))
          setLgac(json.catalogos.lgac.map((l: any) => ({ value: String(l.intClvLGAC), label: l.vchNombreLGAC })))
          setLineas(json.catalogos.lineas.map((l: any) => ({ value: String(l.intClaveLinea), label: l.vchDescripcion })))
        }
      })
      .catch((e) => setLoadError(String(e)))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    const img = fileRef.current?.files?.[0]
    if (img) fd.append("imagen", img)

    const res = await fetch("/api/miembro/perfil", { method: "POST", body: fd })
    const json = await res.json()
    setSaving(false)
    setMsg({ text: json.success ? "Perfil actualizado correctamente." : (json.error ?? "Error al guardar."), ok: json.success })
  }

  const nombre = perfil ? `${perfil.vchNombre} ${perfil.vchAPaterno} ${perfil.vchAMaterno}`.trim() : ""

  return (
    <DashboardLayout role="miembro">
      <div className="mb-8">
        <span className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-[#c9a227] block mb-2">Miembro C.A.</span>
        <h1 className="font-serif text-[1.8rem] font-bold text-[#722F37] leading-tight">Mi Perfil</h1>
        <p className="text-[0.85rem] text-[#6b6b6b] mt-1">Actualiza tu información personal y académica.</p>
      </div>

      {loadError && (
        <div className="mb-4 text-[0.78rem] px-3 py-2 rounded-[3px] bg-red-50 border border-red-200 text-red-600">
          Error al cargar perfil: {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[6px]">
        {/* Tarjeta lateral */}
        <div className="bg-[#fff] border border-[#e4ddd0] p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-[#faf5e4] flex items-center justify-center mb-4">
              <UserCog className="w-8 h-8 text-[#c9a227]" />
            </div>
            <h3 className="font-serif text-[1.1rem] font-semibold text-[#722F37]">{nombre || "Cargando..."}</h3>
            <span className="text-[0.68rem] font-semibold px-2 py-0.5 rounded-[3px] bg-[#faf5e4] text-[#c9a227] mt-2">Integrante</span>
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-[#e4ddd0]">
            {perfil?.vchEmail && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#c9a227] shrink-0" />
                <span className="text-[0.78rem] text-[#6b6b6b] break-all">{perfil.vchEmail}</span>
              </div>
            )}
            {perfil?.vchNombreCA && (
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#c9a227] shrink-0" />
                <span className="text-[0.78rem] text-[#6b6b6b]">{perfil.vchClvCA} · {perfil.vchNombreCA}</span>
              </div>
            )}
            {perfil?.chrSexoTrab && (
              <div className="flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-[#c9a227] shrink-0" />
                <span className="text-[0.78rem] text-[#6b6b6b]">Sexo: {perfil.chrSexoTrab}</span>
              </div>
            )}
            {perfil?.vchTelefono && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#c9a227] shrink-0" />
                <span className="text-[0.78rem] text-[#6b6b6b]">{perfil.vchTelefono}</span>
              </div>
            )}
          </div>
        </div>

        {/* Formulario */}
        <div className="lg:col-span-2 bg-[#fff] border border-[#e4ddd0] p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserCog className="w-[14px] h-[14px] text-[#c9a227]" />
            <h3 className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-[#c9a227]">Editar información</h3>
          </div>

          {msg && (
            <div className={`mb-5 text-[0.78rem] px-3 py-2 rounded-[3px] border ${msg.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Teléfono */}
              <div>
                <label className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] block mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full py-[0.6rem] px-3 bg-[#f7f4ee] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)]"
                />
              </div>

              {/* Correo personal */}
              <div>
                <label className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] block mb-1.5">Correo personal</label>
                <input
                  type="email"
                  value={form.emailPersonal}
                  onChange={(e) => setForm({ ...form, emailPersonal: e.target.value })}
                  className="w-full py-[0.6rem] px-3 bg-[#f7f4ee] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)]"
                />
              </div>

              {/* Línea de investigación */}
              <div>
                <label className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] block mb-1.5">Línea de investigación</label>
                <select
                  value={form.linea}
                  onChange={(e) => setForm({ ...form, linea: e.target.value })}
                  className="w-full py-[0.6rem] px-3 bg-[#f7f4ee] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none appearance-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)]"
                >
                  <option value="">-- Seleccionar --</option>
                  {lineas.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>

              {/* Perfil PROMEP */}
              <div>
                <label className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] block mb-1.5">Perfil PRODEP</label>
                <select
                  value={form.perfil}
                  onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                  className="w-full py-[0.6rem] px-3 bg-[#f7f4ee] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none appearance-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)]"
                >
                  <option value="">-- Seleccionar --</option>
                  {perfiles.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              {/* LGAC */}
              <div>
                <label className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] block mb-1.5">LGAC del C.A.</label>
                <select
                  value={form.lgac}
                  onChange={(e) => setForm({ ...form, lgac: e.target.value })}
                  className="w-full py-[0.6rem] px-3 bg-[#f7f4ee] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none appearance-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)]"
                >
                  <option value="">-- Seleccionar --</option>
                  {lgac.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>

              {/* Fecha inicio PRODEP */}
              <div>
                <label className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] block mb-1.5">
                  <Calendar className="inline w-3 h-3 mr-1" />Inicio PRODEP
                </label>
                <input
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                  className="w-full py-[0.6rem] px-3 bg-[#f7f4ee] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)]"
                />
              </div>

              {/* Fecha vencimiento PRODEP */}
              <div>
                <label className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] block mb-1.5">
                  <Award className="inline w-3 h-3 mr-1" />Vencimiento PRODEP
                </label>
                <input
                  type="date"
                  value={form.fechaVenc}
                  onChange={(e) => setForm({ ...form, fechaVenc: e.target.value })}
                  className="w-full py-[0.6rem] px-3 bg-[#f7f4ee] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)]"
                />
              </div>

              {/* Imagen de perfil */}
              <div>
                <label className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] block mb-1.5">Foto de perfil</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.bmp"
                  className="w-full py-[0.55rem] px-3 bg-[#f7f4ee] border border-[#e4ddd0] rounded-[3px] text-[0.82rem] text-[#6b6b6b] outline-none file:mr-3 file:py-1 file:px-3 file:rounded-[3px] file:border-0 file:text-[0.75rem] file:font-semibold file:bg-[#722F37] file:text-white cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-[0.55rem] bg-[#722F37] text-[#fff] rounded-[3px] text-[0.78rem] font-semibold transition-colors duration-300 hover:bg-[#c9a227] disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

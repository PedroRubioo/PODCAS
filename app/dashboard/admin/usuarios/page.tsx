"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Users, Search, Plus, X, ChevronDown } from "lucide-react"

interface Usuario {
  id: number
  vchClvTrabajador: string
  vchClvCA: string
  nombre: string
  chrCarrera: string
  departamento: string
  perfil: string
  intClvTipoUsuario: number
  dtmFchRegistro: string
}

interface Carrera {
  Clave: string
  Carrera: string
}

interface Docente {
  "Numero de acceso": string
  "Nombre Trabajador": string
}

interface Perfil {
  intClvPerfilPROMEP: number
  vchNombrePerfil: string
}

interface CA {
  vchClvCA: string
  vchNombreCA: string
}

const TIPOS = [
  { value: "2", label: "Representante" },
  { value: "3", label: "Miembro" },
]

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null)

  // Form state
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [cas, setCas] = useState<CA[]>([])
  const [form, setForm] = useState({
    carrera: "",
    clave: "",
    perfil: "",
    claveCA: "",
    tipoUser: "3",
    fechaReg: new Date().toISOString().split("T")[0],
    fechaVenc: new Date().toISOString().split("T")[0],
  })

  const fetchUsuarios = () => {
    setLoading(true)
    fetch("/api/admin/usuarios")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUsuarios(d.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const openModal = () => {
    setMensaje(null)
    setShowModal(true)
    // Cargar carreras, perfiles y CAs
    fetch("/api/admin/usuarios/carreras")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCarreras(d.data) })
    fetch("/api/admin/usuarios/perfiles")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPerfiles(d.data) })
    fetch("/api/cuerpos-academicos")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCas(d.data) })
  }

  const handleCarreraChange = (clave: string) => {
    setForm((f) => ({ ...f, carrera: clave, clave: "" }))
    if (!clave) { setDocentes([]); return }
    fetch(`/api/admin/usuarios/docentes?carrera=${clave}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setDocentes(d.data) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMensaje(null)
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clave: form.clave,
          fecha: form.fechaReg,
          perfil: form.perfil,
          claveCA: form.claveCA,
          tipoUser: form.tipoUser,
          carrera: form.carrera,
          fechaReg: form.fechaReg,
          fechaVenc: form.fechaVenc,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMensaje({ tipo: "ok", texto: "Usuario registrado correctamente." })
        fetchUsuarios()
        setForm({ carrera: "", clave: "", perfil: "", claveCA: "", tipoUser: "3", fechaReg: new Date().toISOString().split("T")[0], fechaVenc: new Date().toISOString().split("T")[0] })
        setDocentes([])
      } else {
        setMensaje({ tipo: "err", texto: data.error || "Error al registrar." })
      }
    } catch {
      setMensaje({ tipo: "err", texto: "Error de conexión." })
    } finally {
      setSaving(false)
    }
  }

  const filtered = usuarios.filter((u) =>
    u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    u.vchClvTrabajador?.toLowerCase().includes(search.toLowerCase()) ||
    String(u.intClvTipoUsuario).includes(search.toLowerCase())
  )

  const inputClass = "w-full px-3 py-[0.45rem] bg-[#fdfcfa] border border-[#e8e4df] rounded-[3px] text-[0.82rem] text-[#2e2e2e] outline-none focus:border-[#c9a227] transition-colors duration-200"
  const labelClass = "block text-[0.72rem] font-semibold text-[#6b6b6b] mb-1 uppercase tracking-wide"

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <span className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-[#c9a227] block mb-2">Administracion</span>
        <h1 className="font-serif text-[1.8rem] font-bold text-[#722F37] leading-tight">Gestion de Usuarios</h1>
        <p className="text-[0.85rem] text-[#6b6b6b] mt-1">Administra los usuarios registrados en el sistema.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-[#fff] border border-[#e8e4df] p-4 mb-[6px] flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#9a9a9a]" />
          <input
            type="text"
            placeholder="Buscar por nombre, clave o tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-[0.5rem] bg-[#fdfcfa] border border-[#e8e4df] rounded-[3px] text-[0.82rem] text-[#2e2e2e] placeholder:text-[#9a9a9a] outline-none focus:border-[#c9a227] transition-colors duration-200"
          />
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-[0.5rem] bg-[#722F37] text-[#fff] rounded-[3px] text-[0.78rem] font-semibold transition-colors duration-300 hover:bg-[#c9a227]"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo usuario
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#fff] border border-[#e8e4df] overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#e8e4df]">
              <th className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] px-6 py-3">Usuario</th>
              <th className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] px-6 py-3">Tipo</th>
              <th className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] px-6 py-3">C.A.</th>
              <th className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] px-6 py-3">Departamento</th>
              <th className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] px-6 py-3">Perfil</th>
              <th className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] px-6 py-3">Registro</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[0.82rem] text-[#9a9a9a]">Cargando...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[0.82rem] text-[#9a9a9a]">No se encontraron usuarios.</td>
              </tr>
            ) : filtered.map((user) => (
              <tr key={user.id} className="border-b border-[#e8e4df] last:border-b-0 hover:bg-[#fdfcfa] transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#faf5e4] flex items-center justify-center shrink-0">
                      <Users className="w-[14px] h-[14px] text-[#c9a227]" />
                    </div>
                    <div>
                      <p className="text-[0.82rem] font-medium text-[#2e2e2e]">{user.nombre}</p>
                      <p className="text-[0.7rem] text-[#9a9a9a]">{user.vchClvTrabajador}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[0.68rem] font-semibold px-2 py-0.5 rounded-[3px] bg-[#faf5e4] text-[#c9a227]">
                    {{ 2: "Representante", 3: "Miembro" }[user.intClvTipoUsuario] ?? `Tipo ${user.intClvTipoUsuario}`}
                  </span>
                </td>
                <td className="px-6 py-4 text-[0.78rem] text-[#6b6b6b]">{user.vchClvCA || "—"}</td>
                <td className="px-6 py-4 text-[0.78rem] text-[#6b6b6b]">{user.departamento || "—"}</td>
                <td className="px-6 py-4 text-[0.78rem] text-[#6b6b6b]">{user.perfil || "—"}</td>
                <td className="px-6 py-4 text-[0.78rem] text-[#9a9a9a]">
                  {user.dtmFchRegistro ? new Date(user.dtmFchRegistro).toLocaleDateString("es-MX") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[0.75rem] text-[#9a9a9a]">
        {!loading && `${filtered.length} usuario${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
      </div>

      {/* Modal nuevo usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#fff] border border-[#e8e4df] rounded-[4px] w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e4df]">
              <h2 className="font-serif text-[1.1rem] font-bold text-[#722F37]">Registrar Usuario</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9a9a9a] hover:text-[#722F37]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {mensaje && (
                <div className={`text-[0.78rem] px-3 py-2 rounded-[3px] ${mensaje.tipo === "ok" ? "bg-[#faf5e4] text-[#c9a227]" : "bg-red-50 text-red-600"}`}>
                  {mensaje.texto}
                </div>
              )}

              <div>
                <label className={labelClass}>Tipo de usuario</label>
                <div className="relative">
                  <select
                    required
                    value={form.tipoUser}
                    onChange={(e) => setForm((f) => ({ ...f, tipoUser: e.target.value }))}
                    className={inputClass + " appearance-none pr-8"}
                  >
                    {TIPOS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Cuerpo Académico</label>
                <div className="relative">
                  <select
                    required
                    value={form.claveCA}
                    onChange={(e) => setForm((f) => ({ ...f, claveCA: e.target.value }))}
                    className={inputClass + " appearance-none pr-8"}
                  >
                    <option value="">Seleccionar C.A.</option>
                    {cas.map((ca) => (
                      <option key={ca.vchClvCA} value={ca.vchClvCA}>{ca.vchClvCA} — {ca.vchNombreCA}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Departamento / Carrera</label>
                <div className="relative">
                  <select
                    required
                    value={form.carrera}
                    onChange={(e) => handleCarreraChange(e.target.value)}
                    className={inputClass + " appearance-none pr-8"}
                  >
                    <option value="">Seleccionar departamento</option>
                    {carreras.map((c) => (
                      <option key={c.Clave} value={c.Clave}>{c.Carrera}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Trabajador</label>
                <div className="relative">
                  <select
                    required
                    value={form.clave}
                    onChange={(e) => setForm((f) => ({ ...f, clave: e.target.value }))}
                    className={inputClass + " appearance-none pr-8"}
                    disabled={!form.carrera}
                  >
                    <option value="">Seleccionar trabajador</option>
                    {docentes.map((d) => (
                      <option key={d["Numero de acceso"]} value={d["Numero de acceso"]}>{d["Nombre Trabajador"]}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Perfil PROMEP</label>
                <div className="relative">
                  <select
                    required
                    value={form.perfil}
                    onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value }))}
                    className={inputClass + " appearance-none pr-8"}
                  >
                    <option value="">Seleccionar perfil</option>
                    {perfiles.map((p) => (
                      <option key={p.intClvPerfilPROMEP} value={p.intClvPerfilPROMEP}>{p.vchNombrePerfil}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a] pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Fecha registro</label>
                  <input
                    type="date"
                    required
                    value={form.fechaReg}
                    onChange={(e) => setForm((f) => ({ ...f, fechaReg: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Fecha vencimiento</label>
                  <input
                    type="date"
                    required
                    value={form.fechaVenc}
                    onChange={(e) => setForm((f) => ({ ...f, fechaVenc: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#e8e4df] rounded-[3px] text-[0.78rem] text-[#6b6b6b] hover:border-[#c9a227] hover:text-[#c9a227] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#722F37] text-white rounded-[3px] text-[0.78rem] font-semibold hover:bg-[#c9a227] transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

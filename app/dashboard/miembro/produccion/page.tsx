"use client"

import { useEffect, useRef, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Upload, Plus, FileText, Calendar, X, Save, Pencil } from "lucide-react"

interface Produccion {
  intClvProduccion: number
  dtmFechaRegistro: string
  intClvProducto: number
  vchNombreProducto: string
  vchTituloProducto: string
  vchDescripcionBreve: string
  vchImpacto: string
  intClaveLineInvestigacion: number
  vchDescripcionLinea: string
  intStatus: number
  vchNombreStatus: string
  bitPerteneCA: boolean
  vchAutores: string
  vchColaboradores: string
  vchCAColaborador1_Int: string
  nombreCA1: string
  vchCAColaborador2_Int: string
  nombreCA2: string
  vchCAColaborador3_Int: string
  nombreCA3: string
  vchCAColaborador1_Ext: string
  vchNombreColaboradorExterno: string
  RutaArchivo: string
}

interface Catalogo { value: string; label: string }

const emptyForm = {
  tipoProducto: "", titulo: "", descripcion: "", impacto: "",
  linea: "", status: "", perteneceCA: "0",
  autores: "", colaboradores: "",
  ca1: "", ca2: "", ca3: "",
  caExterna: "", colaboradorExt: "",
}

export default function MiembroProduccionPage() {
  const [lista, setLista] = useState<Produccion[]>([])
  const [catalogos, setCatalogos] = useState<{ productos: Catalogo[]; status: Catalogo[]; lineas: Catalogo[]; cuerpos: Catalogo[] }>({ productos: [], status: [], lineas: [], cuerpos: [] })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Produccion | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    fetch("/api/miembro/produccion")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setLista(json.data)
        if (json.catalogos) {
          setCatalogos({
            productos: json.catalogos.productos.map((p: any) => ({ value: String(p.intClvProducto), label: p.vchNombreProducto })),
            status: json.catalogos.status.map((s: any) => ({ value: String(s.intClvStatus), label: s.vchNombreStatus })),
            lineas: json.catalogos.lineas.map((l: any) => ({ value: String(l.intClaveLinea), label: l.vchDescripcion })),
            cuerpos: json.catalogos.cuerpos.map((c: any) => ({ value: c.vchClvCA, label: c.vchNombreCA })),
          })
        }
      })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setMsg(null)
    setShowForm(true)
  }

  const openEdit = (item: Produccion) => {
    setEditing(item)
    setForm({
      tipoProducto: String(item.intClvProducto),
      titulo: item.vchTituloProducto,
      descripcion: item.vchDescripcionBreve,
      impacto: item.vchImpacto,
      linea: String(item.intClaveLineInvestigacion),
      status: String(item.intStatus),
      perteneceCA: item.bitPerteneCA ? "1" : "0",
      autores: item.vchAutores,
      colaboradores: item.vchColaboradores,
      ca1: item.vchCAColaborador1_Int ?? "",
      ca2: item.vchCAColaborador2_Int ?? "",
      ca3: item.vchCAColaborador3_Int ?? "",
      caExterna: item.vchCAColaborador1_Ext ?? "",
      colaboradorExt: item.vchNombreColaboradorExterno ?? "",
    })
    setMsg(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing && !fileRef.current?.files?.[0]) {
      setMsg({ text: "El archivo es obligatorio para nuevos registros.", ok: false })
      return
    }
    setSaving(true)
    setMsg(null)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    const archivo = fileRef.current?.files?.[0]
    if (archivo) fd.append("archivo", archivo)
    if (editing) fd.append("id", String(editing.intClvProduccion))

    const res = await fetch("/api/miembro/produccion", {
      method: editing ? "PUT" : "POST",
      body: fd,
    })
    const json = await res.json()
    setSaving(false)
    if (json.success) {
      setMsg({ text: editing ? "Producción actualizada." : "Producción registrada.", ok: true })
      load()
      if (!editing) { setForm(emptyForm); if (fileRef.current) fileRef.current.value = "" }
    } else {
      setMsg({ text: json.error ?? "Error al guardar.", ok: false })
    }
  }

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })

  const inputCls = "w-full py-[0.6rem] px-3 bg-[#f7f4ee] border border-[#e4ddd0] rounded-[3px] text-[0.85rem] text-[#2e2e2e] outline-none transition-all duration-200 focus:border-[#c9a227] focus:shadow-[0_0_0_3px_rgba(183,140,51,0.15)]"
  const labelCls = "text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[#9a9a9a] block mb-1.5"

  return (
    <DashboardLayout role="miembro">
      <PageHeader eyebrow="Docente Investigador" title="Mi Producción Académica" subtitle="Registra y gestiona tu producción académica." />

      {/* Formulario */}
      {showForm && (
        <div className="bg-[#fff] border border-[#e4ddd0] p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Upload className="w-[14px] h-[14px] text-[#c9a227]" />
              <h3 className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-[#c9a227]">
                {editing ? "Editar producción" : "Nueva producción"}
              </h3>
            </div>
            <button onClick={() => setShowForm(false)} className="text-[#9a9a9a] hover:text-[#722F37] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {msg && (
            <div className={`mb-4 text-[0.78rem] px-3 py-2 rounded-[3px] border ${msg.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Tipo de producto</label>
                <select value={form.tipoProducto} onChange={(e) => setForm({ ...form, tipoProducto: e.target.value })} required className={inputCls + " appearance-none"}>
                  <option value="">-- Seleccionar --</option>
                  {catalogos.productos.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Estatus</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required className={inputCls + " appearance-none"}>
                  <option value="">-- Seleccionar --</option>
                  {catalogos.status.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Título del producto</label>
                <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required className={inputCls} />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Descripción breve</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} className={inputCls + " resize-none"} />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Impacto</label>
                <textarea value={form.impacto} onChange={(e) => setForm({ ...form, impacto: e.target.value })} rows={2} className={inputCls + " resize-none"} />
              </div>

              <div>
                <label className={labelCls}>Línea de investigación</label>
                <select value={form.linea} onChange={(e) => setForm({ ...form, linea: e.target.value })} required className={inputCls + " appearance-none"}>
                  <option value="">-- Seleccionar --</option>
                  {catalogos.lineas.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>¿Pertenece a C.A.?</label>
                <div className="flex gap-6 mt-2">
                  {[{ val: "1", lab: "Sí" }, { val: "0", lab: "No" }].map(({ val, lab }) => (
                    <label key={val} className="flex items-center gap-2 text-[0.85rem] text-[#2e2e2e] cursor-pointer">
                      <input type="radio" name="perteneceCA" value={val} checked={form.perteneceCA === val} onChange={(e) => setForm({ ...form, perteneceCA: e.target.value })} className="accent-[#722F37]" />
                      {lab}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Autores</label>
                <input type="text" value={form.autores} onChange={(e) => setForm({ ...form, autores: e.target.value })} className={inputCls} placeholder="Ej. García J., López M." />
              </div>

              <div>
                <label className={labelCls}>Colaboradores</label>
                <input type="text" value={form.colaboradores} onChange={(e) => setForm({ ...form, colaboradores: e.target.value })} className={inputCls} />
              </div>

              {/* CAs colaboradoras */}
              {[{ key: "ca1", label: "C.A. colaborador 1" }, { key: "ca2", label: "C.A. colaborador 2" }, { key: "ca3", label: "C.A. colaborador 3" }].map(({ key, label }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <select value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputCls + " appearance-none"}>
                    <option value="">Ninguno</option>
                    {catalogos.cuerpos.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              ))}

              <div>
                <label className={labelCls}>C.A. externo</label>
                <input type="text" value={form.caExterna} onChange={(e) => setForm({ ...form, caExterna: e.target.value })} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Nombre colaborador externo</label>
                <input type="text" value={form.colaboradorExt} onChange={(e) => setForm({ ...form, colaboradorExt: e.target.value })} className={inputCls} />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Archivo {editing && <span className="text-[#c9a227] normal-case">(dejar vacío para conservar el actual)</span>}</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".doc,.docx,.xlsx,.pdf,.pptx,.bmp,.jpg,.jpeg,.png,.mp4"
                  className="w-full py-[0.55rem] px-3 bg-[#f7f4ee] border border-[#e4ddd0] rounded-[3px] text-[0.82rem] text-[#6b6b6b] outline-none file:mr-3 file:py-1 file:px-3 file:rounded-[3px] file:border-0 file:text-[0.75rem] file:font-semibold file:bg-[#722F37] file:text-white cursor-pointer"
                />
                <p className="text-[0.68rem] text-[#9a9a9a] mt-1">doc, docx, xlsx, pdf, pptx, bmp, jpg, jpeg, png, mp4</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-[0.5rem] border border-[#e4ddd0] rounded-[3px] text-[0.78rem] font-semibold text-[#6b6b6b] hover:border-[#9a9a9a] transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-[0.5rem] bg-[#722F37] text-[#fff] rounded-[3px] text-[0.78rem] font-semibold transition-colors duration-300 hover:bg-[#c9a227] disabled:opacity-60">
                <Save className="w-3.5 h-3.5" />
                {saving ? "Guardando..." : editing ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[0.82rem] text-[#6b6b6b]">{lista.length} registros</p>
        {!showForm && (
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-[0.5rem] bg-[#722F37] text-[#fff] rounded-[3px] text-[0.78rem] font-semibold transition-colors duration-300 hover:bg-[#c9a227]">
            <Plus className="w-3.5 h-3.5" />
            Subir producción
          </button>
        )}
      </div>

      <div className="flex flex-col gap-[6px]">
        {lista.length === 0 ? (
          <div className="bg-[#fff] border border-[#e4ddd0] p-10 text-center">
            <FileText className="w-10 h-10 text-[#e4ddd0] mx-auto mb-3" />
            <p className="text-[0.85rem] text-[#9a9a9a]">Sin producción registrada. ¡Sube tu primer trabajo!</p>
          </div>
        ) : lista.map((item) => (
          <div key={item.intClvProduccion} className="bg-[#fff] border border-[#e4ddd0] p-6 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow duration-300">
            <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#faf5e4] flex items-center justify-center rounded-[3px] shrink-0">
                  <FileText className="w-[16px] h-[16px] text-[#c9a227]" />
                </div>
                <div>
                  <h3 className="font-serif text-[1rem] font-semibold text-[#722F37]">{item.vchTituloProducto}</h3>
                  <p className="text-[0.75rem] text-[#9a9a9a] mt-0.5">{item.vchNombreProducto} · {item.vchDescripcionLinea}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[0.68rem] font-semibold px-2 py-0.5 rounded-[3px] ${item.vchNombreStatus === "Publicado" ? "bg-[#722F37] text-[#fff]" : "bg-[#faf5e4] text-[#c9a227]"}`}>
                  {item.vchNombreStatus}
                </span>
                <button onClick={() => openEdit(item)} title="Editar" className="p-1.5 text-[#9a9a9a] hover:text-[#c9a227] transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {item.vchDescripcionBreve && (
              <p className="text-[0.82rem] text-[#6b6b6b] leading-[1.6] mb-3 ml-[52px]">{item.vchDescripcionBreve}</p>
            )}
            <div className="flex items-center gap-4 ml-[52px] flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#9a9a9a]" />
                <span className="text-[0.75rem] text-[#9a9a9a]">{formatFecha(item.dtmFechaRegistro)}</span>
              </div>
              {item.vchAutores && (
                <span className="text-[0.75rem] text-[#9a9a9a]">Autores: {item.vchAutores}</span>
              )}
              {item.RutaArchivo && (
                <a href={`/uploads/produccion/${item.RutaArchivo}`} target="_blank" rel="noreferrer" className="text-[0.75rem] text-[#c9a227] hover:text-[#722F37] transition-colors no-underline">
                  Ver archivo
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

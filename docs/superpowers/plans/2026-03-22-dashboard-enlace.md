# Dashboard Enlace Académico — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el dashboard completo del rol Enlace Académico (tipo usuario `2`) en PODCA con datos reales de MSSQL, migrando la funcionalidad de `podca-asp/Enlace_academico/`.

**Architecture:** Feature-por-feature: cada tarea crea su ruta API y su página juntas. El dashboard vive en `app/dashboard/enlace/` y sus APIs en `app/api/enlace/`. Se reutilizan los patrones existentes de `app/api/miembro/produccion/route.ts` y `components/dashboard-sidebar.tsx`.

**Tech Stack:** Next.js 14 App Router, TypeScript, mssql (getConnection), NextAuth (auth()), Tailwind CSS v4, lucide-react, shadcn/ui

---

## Archivos a crear/modificar

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Modificar | `app/dashboard/page.tsx` | Cambiar tipo `"2"` → `/dashboard/enlace` |
| Modificar | `components/dashboard-sidebar.tsx` | Agregar entrada `enlace` en `roleConfig` |
| Crear | `app/api/enlace/perfil/route.ts` | GET perfil + PUT actualizar foto |
| Crear | `app/dashboard/enlace/page.tsx` | Dashboard principal con perfil real |
| Crear | `app/api/enlace/representantes/route.ts` | GET lista + POST nuevo + PUT actualizar |
| Crear | `app/api/enlace/representantes/carreras/route.ts` | GET carreras (llama `sp_CA_ObtenerCarreras`) |
| Crear | `app/api/enlace/representantes/docentes/route.ts` | GET docentes por carrera (llama `sp_CA_ObtenerDocentesPorCarrera`) |
| Crear | `app/dashboard/enlace/representantes/page.tsx` | Tabla de representantes + formulario |
| Crear | `app/api/enlace/miembros/route.ts` | GET miembros de todos los CAs |
| Crear | `app/dashboard/enlace/miembros/page.tsx` | Tabla de datos generales de miembros |
| Crear | `app/api/enlace/produccion/route.ts` | GET producción con filtros |
| Crear | `app/dashboard/enlace/produccion/page.tsx` | Visor de producción con filtros |

---

## Contexto clave para el desarrollador

### Sesión (NextAuth)
```ts
const session = await auth();
const usuario = session.user.id as string;          // vchClvTrabajador
const tipoUser = (session.user as any).tipoUser;    // "2" para enlace
const chrCarrera = (session.user as any).chrCarrera;
const claveCA = (session.user as any).claveCA;
```

### Conexión DB
```ts
import { getConnection } from "@/lib/db";
import sql from "mssql";
const pool = await getConnection();
// siempre usar .input() con tipos, nunca concatenar strings
```

### Stored procedures relevantes
- `sp_CA_ObtenerCarreras` — retorna `Clave`, `Carrera`
- `sp_CA_ObtenerDocentesPorCarrera @clave` — retorna docentes por carrera
- `sp_CA_RegistrarRepresentante @clave, @fecha, @perfil, @clave_CA, @tipoUser, @chrCarrera, @FechPReg, @FechPVen` — `@CodRetorno` OUTPUT: 0=ok, >0=ya existe

### Vista de producción
- `view_CA_ProduccionAcademica` — vista con todas las columnas de producción

### Tablas
- `tblTrabajadores` — `vchClvTrabajador`, `vchNombre`, `vchAPaterno`, `vchAMaterno`, `descripcion_puesto`, `chrClvDptoTrab`
- `tbl_CA_CATrabajador` — `vchClvTrabajador`, `ImagenPerfil`, `intClvTipoUsuario`, `vchClvCA`, `chrCarrera`, `intClvPerfilPROMEP`, `dtmFchRegistro`
- `tblDepartamentos` — `chrClvDpto`, `vchNomDpto`
- `tblCarreras` — `chrClvDpto`, `bitActiva`
- `tbl_CA_PerfilesPROMEP` — `intClvPerfilPROMEP`, `vchNombrePerfil`
- `tbl_CA_CuerposAcademicos` — `vchClvCA`, `vchNombreCA`, `vchClvTrabajadorRepresentante`
- `tbl_CA_Productos` — `intClvProducto`, `vchNombreProducto`
- `tbl_CA_Status` — `intClvStatus`, `vchNombreStatus`

### Patrón de respuesta API
```ts
return NextResponse.json({ success: true, data: result.recordset });
return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
```

### Patrón de página (client component)
```tsx
"use client"
import { DashboardLayout } from "@/components/dashboard-layout"
// ...
export default function EnlacePage() {
  return (
    <DashboardLayout role="enlace">
      {/* contenido */}
    </DashboardLayout>
  )
}
```

---

## Tarea 1: Conectar el rol enlace al routing y sidebar

**Archivos:**
- Modificar: `app/dashboard/page.tsx`
- Modificar: `components/dashboard-sidebar.tsx`

- [ ] **Paso 1: Cambiar el routing del tipo 2**

En `app/dashboard/page.tsx`, cambiar:
```ts
// ANTES
"2": "/dashboard/representante",
// DESPUÉS
"2": "/dashboard/enlace",
```

- [ ] **Paso 2: Agregar enlace al sidebar**

En `components/dashboard-sidebar.tsx`, dentro del objeto `roleConfig`, agregar después de `representante`:
```ts
enlace: {
  label: "Enlace Académico",
  description: "Supervision y gestion institucional",
  items: [
    { label: "Dashboard", href: "/dashboard/enlace", icon: LayoutDashboard },
    { label: "Representantes", href: "/dashboard/enlace/representantes", icon: UserCheck },
    { label: "Datos de Miembros", href: "/dashboard/enlace/miembros", icon: Users },
    { label: "Visor de Produccion", href: "/dashboard/enlace/produccion", icon: Eye },
  ],
},
```
Los iconos `UserCheck`, `Users`, `Eye` ya están importados en el archivo.

- [ ] **Paso 3: Verificar**

Correr `npm run lint` en `PODCA/` y confirmar que no hay errores de TypeScript en esos dos archivos.

---

## Tarea 2: API + página de perfil (Dashboard principal)

**Archivos:**
- Crear: `app/api/enlace/perfil/route.ts`
- Crear: `app/dashboard/enlace/page.tsx`

### Paso 1: Crear la ruta API de perfil

- [ ] Crear `app/api/enlace/perfil/route.ts`:

```ts
import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sql from "mssql";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const usuario = session.user.id as string;
    const pool = await getConnection();

    const [trabajador, dpto, imagen] = await Promise.all([
      pool.request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT vchNombre, vchAPaterno, vchAMaterno, descripcion_puesto
                FROM tblTrabajadores WHERE vchClvTrabajador = @u`),

      pool.request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT DISTINCT Dep.chrClvDpto AS clave, Dep.vchNomDpto AS departamento
                FROM tblDepartamentos AS Dep
                INNER JOIN tblCarreras Carr ON Dep.chrClvDpto = Carr.chrClvDpto
                INNER JOIN tblTrabajadores T ON T.chrClvDptoTrab = Dep.chrClvDpto
                WHERE Dep.chrClvDpto <> '00' AND Carr.bitActiva = 1
                  AND T.vchClvTrabajador = @u`),

      pool.request()
        .input("u", sql.VarChar, usuario)
        .query(`SELECT ISNULL(ImagenPerfil, 'sin imagen.jpg') AS ImagenPerfil
                FROM tbl_CA_CATrabajador WHERE vchClvTrabajador = @u`),
    ]);

    const t = trabajador.recordset[0];
    const d = dpto.recordset[0];
    const img = imagen.recordset[0];

    return NextResponse.json({
      success: true,
      data: {
        nombre: t ? `${t.vchNombre} ${t.vchAPaterno} ${t.vchAMaterno}`.trim() : "",
        descripcion: t?.descripcion_puesto ?? "",
        departamento: d?.departamento ?? "",
        imagen: img?.ImagenPerfil ?? "sin imagen.jpg",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const usuario = session.user.id as string;
    const formData = await request.formData();
    const archivo = formData.get("imagen") as File | null;

    if (!archivo || archivo.size === 0)
      return NextResponse.json({ success: false, error: "Archivo requerido" }, { status: 400 });

    const ext = archivo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png"].includes(ext))
      return NextResponse.json({ success: false, error: "Solo jpg, jpeg o png" }, { status: 400 });

    const dir = path.join(process.cwd(), "public", "ImagenPerfil");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, archivo.name), Buffer.from(await archivo.arrayBuffer()));

    const pool = await getConnection();
    await pool.request()
      .input("img", sql.VarChar, archivo.name)
      .input("u", sql.VarChar, usuario)
      .query(`UPDATE tbl_CA_CATrabajador SET ImagenPerfil = @img WHERE vchClvTrabajador = @u`);

    return NextResponse.json({ success: true, imagen: archivo.name });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

### Paso 2: Crear la página del dashboard

- [ ] Crear `app/dashboard/enlace/page.tsx`:

```tsx
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { UserCheck, Users, Eye, Upload, User } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"

type Perfil = {
  nombre: string
  descripcion: string
  departamento: string
  imagen: string
}

export default function EnlaceDashboard() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [msg, setMsg] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/enlace/perfil")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPerfil(d.data) })
  }, [])

  async function subirFoto(file: File) {
    setSubiendo(true)
    setMsg("")
    const fd = new FormData()
    fd.append("imagen", file)
    const r = await fetch("/api/enlace/perfil", { method: "PUT", body: fd })
    const d = await r.json()
    if (d.success) {
      setMsg("Foto actualizada.")
      setPerfil((p) => p ? { ...p, imagen: d.imagen } : p)
    } else {
      setMsg(d.error ?? "Error al subir imagen")
    }
    setSubiendo(false)
  }

  const imgSrc = perfil?.imagen && perfil.imagen !== "sin imagen.jpg"
    ? `/ImagenPerfil/${perfil.imagen}`
    : null

  return (
    <DashboardLayout role="enlace">
      <div className="mb-8">
        <span className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-[#c9a227] block mb-2">Enlace Académico</span>
        <h1 className="font-serif text-[1.8rem] font-bold text-[#722F37] leading-tight">Mi Perfil</h1>
        <p className="text-[0.85rem] text-[#6b6b6b] mt-1">Información personal y accesos rápidos del sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[6px] mb-6">
        {/* Foto y datos */}
        <div className="bg-[#fff] border border-[#e8e4df] p-6 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full bg-[#faf5e4] flex items-center justify-center mb-4 overflow-hidden border-2 border-[#c9a227]">
            {imgSrc ? (
              <img src={imgSrc} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-[#c9a227]" />
            )}
          </div>
          <h2 className="font-serif text-[1.1rem] font-bold text-[#722F37]">{perfil?.nombre ?? "—"}</h2>
          <p className="text-[0.78rem] text-[#6b6b6b] mt-1">{perfil?.descripcion || "Enlace Académico"}</p>
          <p className="text-[0.75rem] text-[#9a9a9a] mt-0.5">{perfil?.departamento ?? ""}</p>

          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) subirFoto(f) }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white rounded-[3px] text-[0.78rem] font-semibold hover:bg-[#c9a227] transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {subiendo ? "Subiendo..." : "Cambiar foto"}
          </button>
          {msg && <p className="text-[0.75rem] mt-2 text-[#6b6b6b]">{msg}</p>}
        </div>

        {/* Acciones rápidas */}
        <div className="lg:col-span-2 bg-[#fff] border border-[#e8e4df] p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserCheck className="w-[14px] h-[14px] text-[#c9a227]" />
            <h3 className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-[#c9a227]">Acciones rápidas</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Representantes", href: "/dashboard/enlace/representantes", icon: UserCheck },
              { label: "Datos de Miembros", href: "/dashboard/enlace/miembros", icon: Users },
              { label: "Visor de Produccion", href: "/dashboard/enlace/produccion", icon: Eye },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 border border-[#e8e4df] rounded-[3px] no-underline text-[#2e2e2e] transition-all duration-300 hover:border-[#c9a227] hover:shadow-[0_2px_12px_rgba(201,162,39,0.1)]"
              >
                <action.icon className="w-[16px] h-[16px] text-[#c9a227] shrink-0" />
                <span className="text-[0.82rem] font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
```

- [ ] **Paso 3: Verificar en el navegador**

Iniciar `npm run dev` en `PODCA/`. Hacer login con un usuario tipo 2. Confirmar que redirige a `/dashboard/enlace`, muestra el nombre real del enlace, el departamento, y que la foto se puede subir.

- [ ] **Paso 4: Commit**
```bash
git add app/dashboard/page.tsx components/dashboard-sidebar.tsx app/api/enlace/perfil/route.ts app/dashboard/enlace/page.tsx
git commit -m "feat: dashboard enlace - perfil con datos reales y subida de foto"
```

---

## Tarea 3: API + página de representantes

**Archivos:**
- Crear: `app/api/enlace/representantes/route.ts`
- Crear: `app/api/enlace/representantes/carreras/route.ts`
- Crear: `app/api/enlace/representantes/docentes/route.ts`
- Crear: `app/dashboard/enlace/representantes/page.tsx`

### Paso 1: API de catálogos (carreras y docentes)

- [ ] Crear `app/api/enlace/representantes/carreras/route.ts`:

```ts
import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const pool = await getConnection();
    const result = await pool.request().execute("sp_CA_ObtenerCarreras");

    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

- [ ] Crear `app/api/enlace/representantes/docentes/route.ts`:

> **IMPORTANTE:** Verificar en la BD que `sp_CA_ObtenerDocentesPorCarrera` recibe el parámetro con el nombre `@clave`. Si usa otro nombre, cambiar el `.input("clave", ...)` por el nombre correcto.

```ts
import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sql from "mssql";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clave = searchParams.get("clave") ?? "";

    const pool = await getConnection();
    // El SP espera el parámetro @clave — verificar nombre en la BD antes de ejecutar
    const result = await pool.request()
      .input("clave", sql.VarChar, clave)
      .execute("sp_CA_ObtenerDocentesPorCarrera");

    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

### Paso 2: API principal de representantes

- [ ] Crear `app/api/enlace/representantes/route.ts`:

```ts
import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sql from "mssql";

// GET: lista de representantes actuales
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        ct.id,
        ct.vchClvCA AS claveCA,
        ct.vchClvTrabajador AS noTrabajador,
        t.vchAPaterno + ' ' + t.vchAMaterno + ' ' + t.vchNombre AS nombre,
        ct.chrCarrera AS claveDpto,
        d.vchNomDpto AS departamento,
        ct.intClvPerfilPROMEP AS clavePerfil,
        p.vchNombrePerfil AS perfil
      FROM tbl_CA_CATrabajador ct
      INNER JOIN tblTrabajadores t ON ct.vchClvTrabajador = t.vchClvTrabajador
      INNER JOIN tbl_CA_PerfilesPROMEP p ON ct.intClvPerfilPROMEP = p.intClvPerfilPROMEP
      LEFT JOIN tblDepartamentos d ON ct.chrCarrera = d.chrClvDpto
      WHERE ct.intClvTipoUsuario = '6'
      ORDER BY t.vchAPaterno
    `);

    // Perfiles para el formulario
    const perfiles = await pool.request()
      .query("SELECT TOP 200 intClvPerfilPROMEP, vchNombrePerfil FROM tbl_CA_PerfilesPROMEP");

    return NextResponse.json({
      success: true,
      data: result.recordset,
      catalogos: { perfiles: perfiles.recordset },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST: registrar nuevo representante
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const body = await request.json();
    const { claveTrab, perfil, carrera } = body;
    const hoy = new Date().toISOString().split("T")[0];

    const pool = await getConnection();
    const result = await pool.request()
      .input("clave", sql.VarChar, claveTrab)
      .input("fecha", sql.VarChar, hoy)
      .input("perfil", sql.VarChar, perfil)
      .input("clave_CA", sql.VarChar, "NA")
      .input("tipoUser", sql.VarChar, "6")
      .input("chrCarrera", sql.VarChar, carrera)
      .input("FechPReg", sql.DateTime, new Date())
      .input("FechPVen", sql.DateTime, new Date())
      .output("CodRetorno", sql.Int)
      .execute("sp_CA_RegistrarRepresentante");

    const codRetorno = result.output.CodRetorno;
    if (codRetorno > 0) {
      return NextResponse.json({ success: false, error: "El trabajador ya está registrado como representante." });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// PUT: actualizar representante existente
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const body = await request.json();
    const { id, claveTrab, perfil, carrera, noTrabajadorAnterior } = body;

    // Verificar que no sea ya representante en esa carrera (distinto al registro actual)
    const pool = await getConnection();
    const check = await pool.request()
      .input("trab", sql.VarChar, claveTrab)
      .input("carr", sql.VarChar, carrera)
      .query(`SELECT id FROM tbl_CA_CATrabajador
              WHERE vchClvTrabajador = @trab AND chrCarrera = @carr AND intClvTipoUsuario = '6'`);

    if (check.recordset.length > 0 && String(check.recordset[0].id) !== String(id)) {
      return NextResponse.json({ success: false, error: "Este trabajador ya es representante en esta carrera." });
    }

    await pool.request()
      .input("trab", sql.VarChar, claveTrab)
      .input("perfil", sql.VarChar, perfil)
      .input("carrera", sql.VarChar, carrera)
      .input("id", sql.Int, parseInt(id))
      .query(`UPDATE tbl_CA_CATrabajador
              SET vchClvTrabajador = @trab, intClvPerfilPROMEP = @perfil,
                  dtmFchRegistro = GETDATE(), chrCarrera = @carrera
              WHERE id = @id`);

    // Reasignar representante en cuerpos académicos si cambió el trabajador
    if (noTrabajadorAnterior && noTrabajadorAnterior !== claveTrab) {
      await pool.request()
        .input("nuevo", sql.VarChar, claveTrab)
        .input("anterior", sql.VarChar, noTrabajadorAnterior)
        .query(`UPDATE tbl_CA_CuerposAcademicos
                SET vchClvTrabajadorRepresentante = @nuevo
                WHERE vchClvTrabajadorRepresentante = @anterior`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

### Paso 3: Crear la página de representantes

- [ ] Crear `app/dashboard/enlace/representantes/page.tsx`:

```tsx
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { UserCheck, Plus, X, Save } from "lucide-react"
import { useEffect, useState } from "react"

type Representante = {
  id: number; claveCA: string; noTrabajador: string; nombre: string
  claveDpto: string; departamento: string; clavePerfil: number; perfil: string
}
type Perfil = { intClvPerfilPROMEP: number; vchNombrePerfil: string }
type Carrera = { Clave: string; Carrera: string }
type Docente = { [key: string]: string }

export default function RepresentantesPage() {
  const [lista, setLista] = useState<Representante[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [modo, setModo] = useState<"nuevo" | "editar" | null>(null)
  const [seleccionado, setSeleccionado] = useState<Representante | null>(null)
  const [form, setForm] = useState({ claveTrab: "", perfil: "", carrera: "" })
  const [msg, setMsg] = useState("")
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const [repRes, carrRes] = await Promise.all([
      fetch("/api/enlace/representantes").then(r => r.json()),
      fetch("/api/enlace/representantes/carreras").then(r => r.json()),
    ])
    if (repRes.success) { setLista(repRes.data); setPerfiles(repRes.catalogos.perfiles) }
    if (carrRes.success) {
      setCarreras(carrRes.data)
      if (carrRes.data.length > 0) cargarDocentes(carrRes.data[0].Clave)
    }
  }

  async function cargarDocentes(clave: string) {
    const r = await fetch(`/api/enlace/representantes/docentes?clave=${clave}`).then(r => r.json())
    if (r.success) setDocentes(r.data)
  }

  function seleccionarParaEditar(rep: Representante) {
    setSeleccionado(rep)
    setForm({ claveTrab: rep.noTrabajador, perfil: String(rep.clavePerfil), carrera: rep.claveDpto })
    setModo("editar")
    cargarDocentes(rep.claveDpto)
  }

  function nuevoFormulario() {
    setSeleccionado(null)
    setForm({ claveTrab: docentes[0] ? Object.values(docentes[0])[0] : "", perfil: String(perfiles[0]?.intClvPerfilPROMEP ?? ""), carrera: carreras[0]?.Clave ?? "" })
    setModo("nuevo")
  }

  async function guardar() {
    setGuardando(true); setMsg("")
    const esEdicion = modo === "editar"
    const body = esEdicion
      ? { ...form, id: seleccionado!.id, noTrabajadorAnterior: seleccionado!.noTrabajador }
      : form
    const r = await fetch("/api/enlace/representantes", {
      method: esEdicion ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
    if (r.success) { setMsg("Guardado correctamente."); setModo(null); cargarDatos() }
    else setMsg(r.error ?? "Error al guardar")
    setGuardando(false)
  }

  const docenteKeyNombre = docentes[0] ? Object.keys(docentes[0]).find(k => k.toLowerCase().includes("nombre")) ?? Object.keys(docentes[0])[1] : ""
  const docenteKeyId = docentes[0] ? Object.keys(docentes[0])[0] : ""

  return (
    <DashboardLayout role="enlace">
      <div className="mb-8">
        <span className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-[#c9a227] block mb-2">Enlace Académico</span>
        <h1 className="font-serif text-[1.8rem] font-bold text-[#722F37] leading-tight">Representantes de C.A.</h1>
        <p className="text-[0.85rem] text-[#6b6b6b] mt-1">Gestiona quién es representante en cada cuerpo académico.</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-[0.82rem] text-[#6b6b6b]">{lista.length} representantes registrados</p>
        <button
          onClick={nuevoFormulario}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white rounded-[3px] text-[0.78rem] font-semibold hover:bg-[#c9a227] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo representante
        </button>
      </div>

      {/* Formulario */}
      {modo && (
        <div className="bg-[#fff] border border-[#c9a227] p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[0.82rem] font-semibold text-[#722F37]">{modo === "nuevo" ? "Registrar representante" : "Actualizar representante"}</h3>
            <button onClick={() => setModo(null)}><X className="w-4 h-4 text-[#9a9a9a]" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[0.72rem] font-semibold text-[#6b6b6b] block mb-1">Carrera</label>
              <select
                className="w-full border border-[#e8e4df] rounded-[3px] px-3 py-2 text-[0.82rem]"
                value={form.carrera}
                onChange={(e) => { setForm(f => ({ ...f, carrera: e.target.value })); cargarDocentes(e.target.value) }}
              >
                {carreras.map(c => <option key={c.Clave} value={c.Clave}>{c.Carrera}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.72rem] font-semibold text-[#6b6b6b] block mb-1">Docente</label>
              <select
                className="w-full border border-[#e8e4df] rounded-[3px] px-3 py-2 text-[0.82rem]"
                value={form.claveTrab}
                onChange={(e) => setForm(f => ({ ...f, claveTrab: e.target.value }))}
              >
                {docentes.map((d, i) => (
                  <option key={i} value={d[docenteKeyId]}>{d[docenteKeyNombre]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.72rem] font-semibold text-[#6b6b6b] block mb-1">Perfil PROMEP</label>
              <select
                className="w-full border border-[#e8e4df] rounded-[3px] px-3 py-2 text-[0.82rem]"
                value={form.perfil}
                onChange={(e) => setForm(f => ({ ...f, perfil: e.target.value }))}
              >
                {perfiles.map(p => <option key={p.intClvPerfilPROMEP} value={p.intClvPerfilPROMEP}>{p.vchNombrePerfil}</option>)}
              </select>
            </div>
          </div>
          {msg && <p className="text-[0.78rem] text-[#722F37] mb-3">{msg}</p>}
          <button
            onClick={guardar}
            disabled={guardando}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white rounded-[3px] text-[0.78rem] font-semibold hover:bg-[#c9a227] transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-[#fff] border border-[#e8e4df] overflow-x-auto">
        <table className="w-full text-[0.82rem]">
          <thead>
            <tr className="border-b border-[#e8e4df] bg-[#fdfcfa]">
              <th className="text-left px-4 py-3 text-[0.72rem] font-semibold text-[#9a9a9a] uppercase tracking-wider">Nombre</th>
              <th className="text-left px-4 py-3 text-[0.72rem] font-semibold text-[#9a9a9a] uppercase tracking-wider">Departamento</th>
              <th className="text-left px-4 py-3 text-[0.72rem] font-semibold text-[#9a9a9a] uppercase tracking-wider">Perfil</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((rep) => (
              <tr key={rep.id} className="border-b border-[#e8e4df] hover:bg-[#fdfcfa]">
                <td className="px-4 py-3 font-medium text-[#2e2e2e]">
                  <div>{rep.nombre}</div>
                  <div className="text-[0.72rem] text-[#9a9a9a]">{rep.noTrabajador}</div>
                </td>
                <td className="px-4 py-3 text-[#6b6b6b]">{rep.departamento}</td>
                <td className="px-4 py-3 text-[#6b6b6b]">{rep.perfil}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => seleccionarParaEditar(rep)}
                    className="text-[0.72rem] font-semibold text-[#c9a227] hover:text-[#722F37]"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
```

- [ ] **Paso 4: Verificar**

Navegar a `/dashboard/enlace/representantes`. Confirmar que la tabla muestra representantes reales. Probar registrar uno nuevo — debe mostrar error si ya existe, o éxito si es nuevo. Probar editar uno existente.

- [ ] **Paso 5: Commit**
```bash
git add app/api/enlace/representantes/ app/dashboard/enlace/representantes/
git commit -m "feat: dashboard enlace - gestión de representantes con datos reales"
```

---

## Tarea 4: API + página de datos generales de miembros

**Archivos:**
- Crear: `app/api/enlace/miembros/route.ts`
- Crear: `app/dashboard/enlace/miembros/page.tsx`

> **Contexto:** Esta página estaba vacía en el legacy (stub). La implementamos como una tabla de todos los miembros de CAs con datos generales.

### Paso 1: API de miembros

- [ ] Crear `app/api/enlace/miembros/route.ts`:

```ts
import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        t.vchClvTrabajador AS clave,
        t.vchNombre + ' ' + t.vchAPaterno + ' ' + t.vchAMaterno AS nombre,
        d.vchNomDpto AS departamento,
        ct.vchClvCA AS claveCA,
        ca.vchNombreCA AS nombreCA,
        p.vchNombrePerfil AS perfil,
        CASE ct.intClvTipoUsuario WHEN '3' THEN 'Miembro' WHEN '6' THEN 'Representante' ELSE 'Otro' END AS tipoRol
      FROM tbl_CA_CATrabajador ct
      INNER JOIN tblTrabajadores t ON ct.vchClvTrabajador = t.vchClvTrabajador
      INNER JOIN tbl_CA_PerfilesPROMEP p ON ct.intClvPerfilPROMEP = p.intClvPerfilPROMEP
      LEFT JOIN tblDepartamentos d ON ct.chrCarrera = d.chrClvDpto
      LEFT JOIN tbl_CA_CuerposAcademicos ca ON ct.vchClvCA = ca.vchClvCA
      WHERE ct.intClvTipoUsuario IN ('3', '6')
      ORDER BY ca.vchNombreCA, t.vchAPaterno
    `);

    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

### Paso 2: Página de miembros

- [ ] Crear `app/dashboard/enlace/miembros/page.tsx`:

```tsx
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

  useEffect(() => {
    fetch("/api/enlace/miembros")
      .then(r => r.json())
      .then(d => { if (d.success) setLista(d.data) })
  }, [])

  const filtrada = lista.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.nombreCA?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.departamento?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <DashboardLayout role="enlace">
      <div className="mb-8">
        <span className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-[#c9a227] block mb-2">Enlace Académico</span>
        <h1 className="font-serif text-[1.8rem] font-bold text-[#722F37] leading-tight">Datos Generales de Miembros</h1>
        <p className="text-[0.85rem] text-[#6b6b6b] mt-1">Todos los integrantes y representantes de cuerpos académicos.</p>
      </div>

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
          </tbody>
        </table>
        {filtrada.length === 0 && (
          <div className="text-center py-12 text-[#9a9a9a] text-[0.82rem]">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No se encontraron miembros.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
```

- [ ] **Paso 3: Verificar**

Navegar a `/dashboard/enlace/miembros`. Confirmar que la tabla muestra miembros y representantes reales. Probar el buscador.

- [ ] **Paso 4: Commit**
```bash
git add app/api/enlace/miembros/ app/dashboard/enlace/miembros/
git commit -m "feat: dashboard enlace - datos generales de miembros"
```

---

## Tarea 5: API + página del visor de producción académica

**Archivos:**
- Crear: `app/api/enlace/produccion/route.ts`
- Crear: `app/dashboard/enlace/produccion/page.tsx`

### Paso 1: API del visor

- [ ] Crear `app/api/enlace/produccion/route.ts`:

```ts
import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sql from "mssql";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const claveCA = searchParams.get("ca") ?? "";
    const docente = searchParams.get("docente") ?? "";
    const status = searchParams.get("status") ?? "";
    const tipoProducto = searchParams.get("tipo") ?? "";
    const fechaInicio = searchParams.get("fechaInicio") ?? "";
    const fechaFin = searchParams.get("fechaFin") ?? "";

    const pool = await getConnection();

    // Construir WHERE dinámico
    let where = "WHERE 1=1"
    const req = pool.request()

    if (claveCA) { where += " AND [CLAVE CA] = @ca"; req.input("ca", sql.VarChar, claveCA) }
    if (docente) { where += " AND [NO. TRABAJADOR] = @docente"; req.input("docente", sql.VarChar, docente) }
    if (status) { where += " AND [ID STATUS] = @status"; req.input("status", sql.VarChar, status) }
    if (tipoProducto) { where += " AND [TIPO PRODUCTO] = @tipo"; req.input("tipo", sql.VarChar, tipoProducto) }
    if (fechaInicio) { where += " AND [FECHA REGISTRO] >= @fi"; req.input("fi", sql.Date, new Date(fechaInicio)) }
    if (fechaFin) { where += " AND [FECHA REGISTRO] <= @ff"; req.input("ff", sql.Date, new Date(fechaFin)) }

    const produccion = await req.query(`SELECT * FROM view_CA_ProduccionAcademica ${where} ORDER BY [FECHA REGISTRO] DESC`)

    // Catálogos para los filtros
    const [cuerpos, statusCat, tiposCat] = await Promise.all([
      pool.request().query("SELECT vchClvCA, vchNombreCA FROM tbl_CA_CuerposAcademicos"),
      pool.request().query("SELECT intClvStatus, vchNombreStatus FROM tbl_CA_Status"),
      pool.request().query("SELECT intClvProducto, vchNombreProducto FROM tbl_CA_Productos"),
    ])

    return NextResponse.json({
      success: true,
      data: produccion.recordset,
      catalogos: {
        cuerpos: cuerpos.recordset,
        status: statusCat.recordset,
        tipos: tiposCat.recordset,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

### Paso 2: Página del visor

- [ ] Crear `app/dashboard/enlace/produccion/page.tsx`:

```tsx
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { FileText } from "lucide-react"
import { useEffect, useState } from "react"

type Produccion = { [key: string]: string | number }
type Cat = { value: string; label: string }

export default function ProduccionPage() {
  const [data, setData] = useState<Produccion[]>([])
  const [columnas, setColumnas] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [cuerpos, setCuerpos] = useState<Cat[]>([])
  const [statusCat, setStatusCat] = useState<Cat[]>([])
  const [tiposCat, setTiposCat] = useState<Cat[]>([])

  const [filtros, setFiltros] = useState({
    ca: "", docente: "", status: "", tipo: "", fechaInicio: "", fechaFin: "",
  })

  async function cargar(f: typeof filtros) {
    setCargando(true)
    const params = new URLSearchParams()
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v) })
    const r = await fetch(`/api/enlace/produccion?${params}`).then(r => r.json())
    if (r.success) {
      setData(r.data)
      if (r.data.length > 0) setColumnas(Object.keys(r.data[0]))
      setCuerpos(r.catalogos.cuerpos.map((c: any) => ({ value: c.vchClvCA, label: `${c.vchClvCA} - ${c.vchNombreCA}` })))
      setStatusCat(r.catalogos.status.map((s: any) => ({ value: s.intClvStatus, label: s.vchNombreStatus })))
      setTiposCat(r.catalogos.tipos.map((t: any) => ({ value: t.intClvProducto, label: t.vchNombreProducto })))
    }
    setCargando(false)
  }

  useEffect(() => {
    cargar(filtros)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function actualizar(campo: string, valor: string) {
    const nuevos = { ...filtros, [campo]: valor }
    setFiltros(nuevos)
    void cargar(nuevos)
  }

  return (
    <DashboardLayout role="enlace">
      <div className="mb-8">
        <span className="text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-[#c9a227] block mb-2">Enlace Académico</span>
        <h1 className="font-serif text-[1.8rem] font-bold text-[#722F37] leading-tight">Visor de Producción Académica</h1>
        <p className="text-[0.85rem] text-[#6b6b6b] mt-1">Consulta y filtra la producción académica de todos los C.A.</p>
      </div>

      {/* Filtros */}
      <div className="bg-[#fff] border border-[#e8e4df] p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[0.72rem] font-semibold text-[#6b6b6b] block mb-1">Cuerpo Académico</label>
            <select
              className="w-full border border-[#e8e4df] rounded-[3px] px-3 py-2 text-[0.82rem]"
              value={filtros.ca}
              onChange={e => actualizar("ca", e.target.value)}
            >
              <option value="">Todos</option>
              {cuerpos.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[0.72rem] font-semibold text-[#6b6b6b] block mb-1">Status</label>
            <select
              className="w-full border border-[#e8e4df] rounded-[3px] px-3 py-2 text-[0.82rem]"
              value={filtros.status}
              onChange={e => actualizar("status", e.target.value)}
            >
              <option value="">Todos</option>
              {statusCat.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[0.72rem] font-semibold text-[#6b6b6b] block mb-1">Tipo de producto</label>
            <select
              className="w-full border border-[#e8e4df] rounded-[3px] px-3 py-2 text-[0.82rem]"
              value={filtros.tipo}
              onChange={e => actualizar("tipo", e.target.value)}
            >
              <option value="">Todos</option>
              {tiposCat.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[0.72rem] font-semibold text-[#6b6b6b] block mb-1">No. Trabajador</label>
            <input
              type="text"
              placeholder="Clave docente..."
              value={filtros.docente}
              onChange={e => actualizar("docente", e.target.value)}
              className="w-full border border-[#e8e4df] rounded-[3px] px-3 py-2 text-[0.82rem] focus:outline-none focus:border-[#c9a227]"
            />
          </div>
          <div>
            <label className="text-[0.72rem] font-semibold text-[#6b6b6b] block mb-1">Fecha inicio</label>
            <input type="date" className="w-full border border-[#e8e4df] rounded-[3px] px-3 py-2 text-[0.82rem]"
              value={filtros.fechaInicio} onChange={e => actualizar("fechaInicio", e.target.value)} />
          </div>
          <div>
            <label className="text-[0.72rem] font-semibold text-[#6b6b6b] block mb-1">Fecha fin</label>
            <input type="date" className="w-full border border-[#e8e4df] rounded-[3px] px-3 py-2 text-[0.82rem]"
              value={filtros.fechaFin} onChange={e => actualizar("fechaFin", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[0.82rem] text-[#6b6b6b]">
          {cargando ? "Cargando..." : `${data.length} registros encontrados`}
        </p>
      </div>

      {/* Tabla con scroll horizontal */}
      <div className="bg-[#fff] border border-[#e8e4df] overflow-x-auto">
        <table className="text-[0.78rem] min-w-max w-full">
          <thead>
            <tr className="border-b border-[#e8e4df] bg-[#fdfcfa]">
              {columnas.map(col => (
                <th key={col} className="text-left px-3 py-2 text-[0.65rem] font-semibold text-[#9a9a9a] uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-[#e8e4df] hover:bg-[#fdfcfa]">
                {columnas.map(col => (
                  <td key={col} className="px-3 py-2 text-[#2e2e2e] whitespace-nowrap max-w-[200px] truncate">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!cargando && data.length === 0 && (
          <div className="text-center py-12 text-[#9a9a9a] text-[0.82rem]">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No hay registros con los filtros actuales.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
```

- [ ] **Paso 3: Verificar**

Navegar a `/dashboard/enlace/produccion`. Confirmar que carga datos reales de `view_CA_ProduccionAcademica`. Probar filtrar por CA, status, tipo de producto y rango de fechas. Confirmar que los resultados se actualizan.

- [ ] **Paso 4: Commit**
```bash
git add app/api/enlace/produccion/ app/dashboard/enlace/produccion/
git commit -m "feat: dashboard enlace - visor de producción académica con filtros reales"
```

---

## Verificación final

- [ ] Hacer login como usuario tipo 2 y recorrer las 4 páginas del dashboard.
- [ ] Confirmar que el sidebar muestra las 4 secciones con links correctos.
- [ ] Confirmar que no hay warnings en consola del navegador ni errores en terminal de Next.js.
- [ ] Correr `npm run build` en `PODCA/` y verificar que compila sin errores bloqueantes.

---

## Notas importantes

- La vista `view_CA_ProduccionAcademica` puede tener nombres de columna en español con espacios (ej. `[CLAVE CA]`). El filtro WHERE usa corchetes para escaparlos.
- Si `sp_CA_ObtenerCarreras` o `sp_CA_ObtenerDocentesPorCarrera` no existen en la BD, la tarea 3 fallará — verificar con el DBA o revisar el legacy para encontrar el SQL equivalente.
- Los archivos de imagen de perfil se guardan en `PODCA/public/ImagenPerfil/`. Verificar que esta carpeta exista o se cree automáticamente con `mkdir`.
- El `next.config.mjs` tiene TypeScript errors ignorados en build — no bloquea, pero es buena práctica resolver los errores de tipo igual.

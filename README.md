# PODCA — Sistema de Cuerpos Académicos UTHH

Sistema web para la gestión y consulta de Cuerpos Académicos de la Universidad Tecnológica de la Huasteca Hidalguense, migrado de ASP.NET a Next.js 16.

---

## Tecnologías utilizadas

| Herramienta | Versión |
|---|---|
| Node.js | v22.13.0 |
| npm | 10.9.2 |
| Next.js | 16.1.6 |
| React | 19.2.4 |
| TypeScript | 5.7.3 |
| Tailwind CSS | 4.2.0 |
| mssql | ^12.x |
| NextAuth.js | 5.0.0-beta |
| nodemailer | ^7.x |
| SQL Server | 2019 |

---

## Requisitos previos

Antes de ejecutar el proyecto asegúrate de tener instalado lo siguiente:

- **Node.js** v22 o superior — [https://nodejs.org](https://nodejs.org)
- **SQL Server 2019** con la base de datos `bduthh_2018` restaurada
- **SQL Server Management Studio (SSMS)** para administrar la base de datos
- Tener habilitado el protocolo **TCP/IP** en el puerto **1433** desde el SQL Server Configuration Manager
- Tener habilitado el usuario **sa** con su contraseña configurada

---

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/PedroRubioo/PODCAS.git
cd PODCAS
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
DB_SERVER=localhost
DB_DATABASE=bduthh_2018
DB_USER=sa
DB_PASSWORD=TuPasswordDeSQL
DB_PORT=1433
AUTH_SECRET=<generalo-con-openssl-rand-base64-32>
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
NEXTAUTH_URL=http://localhost:3000
```

> **Nota:** `AUTH_SECRET` debe ser un string aleatorio largo. **Nunca** dejes el valor de ejemplo. Genera uno con `openssl rand -base64 32`.
> `NEXTAUTH_URL` se usa para validar el header `Origin` en endpoints mutativos (CSRF).

### 4. Copiar carpetas de imágenes

Copia las siguientes carpetas del proyecto original ASP.NET dentro de la carpeta `public/` de este proyecto:

```
public/
├── LogoTiposCA/       ← Logos de los cuerpos académicos
├── Publicaciones/     ← Imágenes de las publicaciones
└── images/            ← Imágenes generales (hero, etc.)
```

### 5. Ejecutar el proyecto

```bash
npm run dev
```

Abre el navegador en [http://localhost:3000](http://localhost:3000)

---

## Estructura del proyecto

```
PODCA/
├── app/
│   ├── layout.tsx, error.tsx, loading.tsx, not-found.tsx
│   ├── (public)/                       ← Rutas públicas (route group)
│   │   ├── layout.tsx
│   │   ├── page.tsx                    ← Home
│   │   ├── login/page.tsx
│   │   ├── publicaciones/
│   │   │   ├── page.tsx, [id]/page.tsx
│   │   └── cuerpos-academicos/page.tsx
│   ├── dashboard/                      ← Área autenticada
│   │   ├── layout.tsx (server, valida sesión)
│   │   ├── loading.tsx, page.tsx       ← Router por rol
│   │   └── {admin,direccion,director,enlace,externo,lider,miembro,representante}/
│   └── api/                            ← REST endpoints
│       ├── auth/[...nextauth]/, contacto/, cuerpos-academicos/, integrantes/
│       ├── lineas/, publicaciones/, tipos-usuario/, test/
│       ├── admin/usuarios/{...}
│       ├── enlace/{miembros,perfil,produccion,representantes}
│       └── miembro/{dashboard,perfil,produccion}
├── components/                         ← UI compartida (incluye components/ui/ shadcn)
├── hooks/, lib/                        ← Helpers (db, api-helpers, safe-upload, rate-limit, roles)
├── auth.ts                             ← Configuración NextAuth v5
├── proxy.ts                            ← Middleware Next 16 (gate /dashboard)
└── .env.local                          ← Variables de entorno (NO subir a git)
```

---

## Base de datos

El proyecto se conecta a **SQL Server 2019** usando el driver `mssql` para Node.js. Las tablas principales que utiliza son:

- `tbl_CA_CuerposAcademicos` — Cuerpos académicos
- `tbl_CA_Publicaciones` — Publicaciones
- `tbl_CA_CATrabajador` — Integrantes de los cuerpos académicos
- `tblTrabajadores` — Datos de los trabajadores
- `tblDepartamentos` — Departamentos

---

## Notas importantes

- El archivo `.env.local` **no se sube a GitHub** por seguridad ya que contiene credenciales.

---

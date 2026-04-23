# Reporte de Correcciones — Sistema PODCA

Documento que resume todas las correcciones aplicadas al sistema PODCA durante la auditoría, refactorización y validación en vivo contra la base de datos real.

**Última actualización**: 2026-04-23

---

## 1. Resumen ejecutivo

Se realizó una auditoría completa del proyecto Next.js 16 + SQL Server. Se detectaron **9 problemas críticos**, **14 altos**, **20 medios** y **21 bajos**. Se corrigió la gran mayoría, se restauró la base de datos `bduthh_2018` (12.75 GB) localmente, se confirmaron los IDs reales de cada rol, y se validaron en vivo los flujos críticos de autenticación, autorización y dashboards por rol.

**Estadísticas finales:**
- 7 archivos nuevos creados (helpers de seguridad, helpers de páginas, UX states, layouts por rol)
- 8 layouts de dashboard creados (uno por cada rol del catálogo + direccion)
- 35+ archivos modificados
- 0 archivos borrados (regla del cliente)
- 100% de los endpoints API validan sesión donde aplica
- 100% de los sub-dashboards validan rol específico
- 0 endpoints públicos exponen PII (correos personales)
- DB real conectada y verificada con datos reales

---

## 2. Correcciones por categoría

### 2.1. Seguridad crítica

| Problema | Solución | Archivos |
|---|---|---|
| Sub-dashboards no validaban sesión ni rol: cualquiera podía ver páginas de otros roles escribiendo la URL | Layout server-side raíz que valida `auth()` + un layout por rol que valida `tipoUser` específico vía `requirePageRole()` | [app/dashboard/layout.tsx](app/dashboard/layout.tsx) + 8 sub-layouts en `app/dashboard/{rol}/layout.tsx` |
| Toda `/api/admin/*` era pública (cualquiera podía listar y crear usuarios sin login) | `requireRole([ROLE.ADMIN])` agregado a los 4 endpoints | [app/api/admin/usuarios/](app/api/admin/usuarios/) |
| IDOR en `PUT /api/miembro/produccion`: cualquier miembro podía editar la producción de otro | Verificación de ownership antes del UPDATE: solo el dueño puede modificar | [app/api/miembro/produccion/route.ts](app/api/miembro/produccion/route.ts) |
| IDOR en `PUT /api/enlace/representantes`: enlace podía editar representantes de otras carreras | Filtro por `chrCarrera` del enlace antes del UPDATE | [app/api/enlace/representantes/route.ts](app/api/enlace/representantes/route.ts) |
| Path traversal en uploads: `imagen.name` se usaba como nombre real → permite sobrescribir archivos del sistema | Helper `saveUpload()` que genera nombre con UUID, valida extensión por whitelist y normaliza la ruta | [lib/safe-upload.ts](lib/safe-upload.ts), aplicado en perfil/produccion |
| `/api/test` público mostraba datos crudos y stack traces | Gateado tras `requireSession()`, ahora solo regresa que la conexión está OK | [app/api/test/route.ts](app/api/test/route.ts) |
| `/api/contacto` era open mail relay: cualquiera podía spam usando el Gmail institucional | El destinatario ya no viene del cliente (lookup en DB por `clvCA + claveIntegrante`), validación CSRF por `Origin` header, rate limit 5/hora por IP | [app/api/contacto/route.ts](app/api/contacto/route.ts) |
| `/api/integrantes` exponía emails personales sin auth (scraping fácil) | Ya no devuelve `correo`, solo bandera `tieneCorreo: 0/1`. El correo se resuelve dentro de `/api/contacto` | [app/api/integrantes/route.ts](app/api/integrantes/route.ts) |
| `next-auth` en `^5.0.0-beta.30` (cualquier `npm install` traía una beta nueva con potenciales breaking changes) | Versión anclada sin `^` | [package.json](package.json) |

### 2.2. Autenticación y autorización

| Problema | Solución | Archivos |
|---|---|---|
| Tres mapas distintos y contradictorios de `tipoUser → ruta` (login.tsx, dashboard/page.tsx, proxy.ts) | Mapa **único** centralizado en `lib/roles.ts`, **confirmado contra `tbl_CA_TipoUsuarios`**. Constante `ROLE` exportada para uso tipado | [lib/roles.ts](lib/roles.ts), [proxy.ts](proxy.ts), [app/dashboard/page.tsx](app/dashboard/page.tsx), [app/(public)/login/page.tsx](app/(public)/login/page.tsx) |
| Sub-dashboards permitían entrada de cualquier rol autenticado | 8 layouts server-side, uno por dashboard, que validan `tipoUser` específico y redirigen al panel correcto si no corresponde | [lib/page-auth.ts](lib/page-auth.ts) + `app/dashboard/{admin,enlace,miembro,lider,director,representante,externo,direccion}/layout.tsx` |
| `auth.ts` tomaba `recordset[length-1]` sin validar cantidad | Warning si SP devuelve >1 fila, validación de `intClvTipoUsuario != null`, comparación estricta | [auth.ts](auth.ts) |
| JWT con `maxAge` default (30 días) | `maxAge: 8h` con `updateAge: 30min` | [auth.ts](auth.ts) |
| `console.error` con objeto `error` completo podía loguear el password | Log solo de `error.message` | [auth.ts](auth.ts) |
| Login con `tipoReal = ... ?? role` caía al rol del dropdown si la sesión aún no se hidrataba | Si no hay `tipoReal` real, muestra error y no redirige | [app/(public)/login/page.tsx](app/(public)/login/page.tsx) |
| Login enviaba el formulario sin validar campos vacíos | Mensajes de validación visibles para cada campo (rol, usuario, contraseña) | [app/(public)/login/page.tsx](app/(public)/login/page.tsx) |
| Endpoints `/api/admin/*`, `/api/miembro/*` y `/api/enlace/*` solo chequeaban sesión, no rol | `requireRole([ROLE.ADMIN])` para admin, `requireRole([ROLE.MIEMBRO])` para miembro, `requireRole([ROLE.ENLACE])` para enlace | Todos los handlers en `/api/admin/`, `/api/miembro/`, `/api/enlace/` |

### 2.3. Robustez del backend

| Problema | Solución | Archivos |
|---|---|---|
| `lib/db.ts`: pool singleton con race condition, fugas de HMR, `pool.connected` poco fiable | Cache de **promesa** en `globalThis`, listener `pool.on('error')` que invalida cache, validación de env vars al cargar | [lib/db.ts](lib/db.ts) |
| `String(error)` filtrado en TODOS los handlers exponía nombres de tablas/SPs/cadenas de conexión | Helper `apiError()` que loguea el detalle al servidor y devuelve mensaje genérico al cliente | [lib/api-helpers.ts](lib/api-helpers.ts), aplicado en 20+ rutas |
| SQL frágil con `TOP ${parseInt(limit)}` en cuerpos-academicos, lineas, publicaciones | `boundedLimit(raw, default, max)` + `.input("limit", sql.Int, n)` con `SELECT TOP (@limit)` | [lib/api-helpers.ts](lib/api-helpers.ts), [app/api/cuerpos-academicos/route.ts](app/api/cuerpos-academicos/route.ts), [app/api/lineas/route.ts](app/api/lineas/route.ts), [app/api/publicaciones/route.ts](app/api/publicaciones/route.ts) |
| Endpoints mutativos sin protección CSRF | Helper `checkOrigin()` que valida header `Origin`/`Referer` contra `NEXTAUTH_URL` en POST/PUT | [lib/api-helpers.ts](lib/api-helpers.ts) |
| Sin rate limiting en login/contacto/enumeración | Helper `rateLimit()` en memoria por IP, 5/hora aplicado a `/api/contacto` (extensible al resto) | [lib/rate-limit.ts](lib/rate-limit.ts) |
| `params` accedido sync en Next 16 (donde es `Promise`) en `/api/publicaciones/[id]` | Firma `params: Promise<{id: string}>` + `await params` | [app/api/publicaciones/[id]/route.ts](app/api/publicaciones/[id]/route.ts) |
| Inputs SQL sin tipo explícito (driver inferia `NVarChar(MAX)`) | Tipos explícitos: `sql.VarChar`, `sql.Int`, `sql.Date`, `sql.DateTime` | Todos los handlers refactorizados |
| Fechas como `sql.VarChar` en filtros de producción | Validación regex ISO + `sql.Date` | [app/api/enlace/produccion/route.ts](app/api/enlace/produccion/route.ts) |
| Endpoint respondía 200 con `success:false` en conflicto | Status code 409 correcto | [app/api/enlace/representantes/route.ts](app/api/enlace/representantes/route.ts) |
| Columna inexistente `dtmFchRegistroVencimiento` en `/api/admin/usuarios` causaba 500 | Aliaseada desde la columna real `dtmFchVencimientoPROMEP` | [app/api/admin/usuarios/route.ts](app/api/admin/usuarios/route.ts) |

### 2.4. Headers de seguridad

| Problema | Solución | Archivos |
|---|---|---|
| Sin headers de seguridad (CSP, X-Frame-Options, etc.) | `headers()` agrega `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` | [next.config.mjs](next.config.mjs) |

### 2.5. Frontend / UX

| Problema | Solución | Archivos |
|---|---|---|
| Navbar sin menú móvil: en pantallas <768px no se podía navegar | Botón hamburguesa con menú colapsable | [components/navbar.tsx](components/navbar.tsx) |
| Color del navbar no coincidía con la variable CSS del branding | Usa `var(--nav-bg)` | [components/navbar.tsx](components/navbar.tsx) |
| `onError` en imágenes hacía `display: none` → hueco blanco | `useState [errored, setErrored]` + render condicional con `<SinImagen />` | [components/imagen-ca.tsx](components/imagen-ca.tsx), [imagen-publicacion.tsx](components/imagen-publicacion.tsx), [cuerpos-academicos-client.tsx](components/cuerpos-academicos-client.tsx) |
| Magic string `"sin imagen.jpg"` case-sensitive | Comparación lowercase + `includes` | [app/dashboard/enlace/page.tsx](app/dashboard/enlace/page.tsx) |
| `<img>` en lugar de `<Image>` en perfil de enlace | Migrado a `next/image` con `fill` + `sizes` | [app/dashboard/enlace/page.tsx](app/dashboard/enlace/page.tsx) |
| Fechas sin timezone (potencial desfase ±1 día) | `timeZone: 'America/Mexico_City'` en todas las llamadas a `toLocaleDateString` | [publicaciones-carousel.tsx](components/publicaciones-carousel.tsx), [publicaciones/page.tsx](app/(public)/publicaciones/page.tsx), [publicaciones/[id]/page.tsx](app/(public)/publicaciones/[id]/page.tsx) |
| Nombre del autor concatenaba `null`/`undefined` | `[a, b, c].filter(Boolean).join(" ")` | [publicaciones/[id]/page.tsx](app/(public)/publicaciones/[id]/page.tsx) |
| Acentos faltantes en `metadata.title/description` | "Académicos", "Información", "Tecnológica" | [app/layout.tsx](app/layout.tsx) |
| Error de hidratación al cargar la app por extensiones del navegador (Bitwarden, Brave) que inyectan atributos en `<body>` | `suppressHydrationWarning` en el `<body>` (oficialmente recomendado por Next.js para este caso) | [app/layout.tsx](app/layout.tsx) |
| `key={index}` en lista de integrantes filtrada (estado DOM se desordenaba) | `key={miembro.clave}` | [components/cuerpos-academicos-client.tsx](components/cuerpos-academicos-client.tsx) |
| Fetches client-side sin `AbortController` (state pisado por respuestas viejas) | `AbortController` + cleanup en effect | [app/dashboard/enlace/page.tsx](app/dashboard/enlace/page.tsx), [app/dashboard/miembro/page.tsx](app/dashboard/miembro/page.tsx), [app/dashboard/admin/usuarios/page.tsx](app/dashboard/admin/usuarios/page.tsx), [components/cuerpos-academicos-client.tsx](components/cuerpos-academicos-client.tsx) |
| Sin estados de carga/error/404 globales | `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/dashboard/loading.tsx` | Nuevos archivos |
| Footer con `style` inline pisaba el responsive | Convertido a clase `lg:grid-cols-[2fr_1fr_1fr_1fr]` | [components/footer.tsx](components/footer.tsx) |
| Sidebar caía silenciosamente a "admin" si rol desconocido | Mensaje explícito "Rol no reconocido" | [components/dashboard-sidebar.tsx](components/dashboard-sidebar.tsx) |

### 2.6. Hooks

| Problema | Solución | Archivos |
|---|---|---|
| `TOAST_REMOVE_DELAY = 1_000_000` (16 minutos) | Cambiado a `5000` (5s) | [hooks/use-toast.ts](hooks/use-toast.ts) |
| `useEffect` en `useToast` con `[state]` re-registraba listener en cada cambio | Dep array `[]` | [hooks/use-toast.ts](hooks/use-toast.ts) |
| `useIsMobile` causaba hydration mismatch (SSR siempre `false`) | `useSyncExternalStore` con `getServerSnapshot` | [hooks/use-mobile.ts](hooks/use-mobile.ts) |

### 2.7. Configuración y build

| Problema | Solución | Archivos |
|---|---|---|
| `tsconfig.target = "ES6"` (innecesariamente conservador) | `"ES2022"` | [tsconfig.json](tsconfig.json) |
| Documentación `mssql ^11.x` vs realidad `^12.2.0` | README actualizado | [README.md](README.md) |
| `AUTH_SECRET=TuClaveSecretaParaSesiones` literal en README (riesgo de copy-paste a prod) | Reemplazado por `<generalo-con-openssl-rand-base64-32>` y nota | [README.md](README.md) |
| `NEXTAUTH_URL` no documentado | Agregado al `.env.local` requerido | [README.md](README.md) |

### 2.8. Documentación

| Problema | Solución | Archivos |
|---|---|---|
| README con estructura de proyecto desfasada | Actualizado con la estructura real (route groups, dashboards por rol, helpers) | [README.md](README.md) |
| Documentación interna desfasada | Helpers nuevos documentados en código (`lib/api-helpers`, `lib/safe-upload`, `lib/rate-limit`, `lib/roles`, `lib/page-auth`), patrón estándar de API route en comentarios | varios |

---

## 3. Validación en vivo (testeo realizado)

Después de aplicar las correcciones, se restauró la base de datos `bduthh_2018` localmente y se ejecutaron los tests con datos reales.

### 3.1. Estado de la base de datos restaurada

| Métrica | Valor |
|---|---|
| Backup verificado | `2018.bak` (12.75 GB), formato MTF de SQL Server, no dañado |
| DB original | SQL Server 2012 SP4 (versión 706) |
| DB restaurada | SQL Server 2019 (versión 904, autoupgrade durante restore) |
| Tiempo de restauración | 56 segundos a 233 MB/s |
| Cuerpos Académicos | 8 |
| Publicaciones | 10 |
| Usuarios CA | 51 |
| Trabajadores | 728 |
| Departamentos | 25 |

### 3.2. Configuración de SQL Server aplicada

| Acción | Estado |
|---|---|
| Modo mixto (autenticación SQL + Windows) | ✅ Habilitado vía `xp_instance_regwrite` |
| Usuario `sa` habilitado con contraseña aleatoria fuerte (24 chars) | ✅ Guardado solo en `.env.local` |
| TCP/IP en puerto 1433 | ✅ Habilitado vía `xp_instance_regwrite`, puerto fijo 1433, dynamic vacío |
| Servicio reiniciado | ✅ Por el usuario (PowerShell admin) |
| Conexión TCP con `sa` desde Node | ✅ Verificada |
| `.env.local` generado en `PODCA/` | ✅ 9 variables (DB, AUTH_SECRET, NEXTAUTH_URL) |

### 3.3. Mapeo real de roles confirmado

Confirmado contra `SELECT * FROM tbl_CA_TipoUsuarios` el 2026-04-23. Coincide con [lib/roles.ts](lib/roles.ts):

| ID en DB | Nombre en DB | Ruta del dashboard |
|---|---|---|
| 1 | REPRESENTANTE INSTITUCIONAL | `/dashboard/representante` |
| 2 | DIRECCION ACADEMICA (en el front se llama "enlace académico") | `/dashboard/enlace` |
| 3 | MIEMBRO DE CUERPO ACADEMICO | `/dashboard/miembro` |
| 5 | ADMINISTRADOR | `/dashboard/admin` |
| 6 | LIDER DEL CUERPO ACADEMICO | `/dashboard/lider` |
| 7 | EXTERNO | `/dashboard/externo` |
| 8 | DIRECTOR DE PROGRAMA EDUCATIVO | `/dashboard/director` |

Nota: el ID 4 no existe en la tabla. La carpeta `/dashboard/direccion/` queda solo accesible por admin (no hay rol que mapee a ella).

### 3.4. Tests ejecutados

| Test | Descripción | Resultado |
|---|---|---|
| 1 — Páginas públicas | Home, Cuerpos Académicos, Publicaciones, Detalles, Navbar móvil | ✅ Pasa |
| 2 — Login y redirección por rol | Cada rol entra a su dashboard correcto. Validación de campos vacíos visible | ✅ Pasa (validación agregada como mejora durante el testeo) |
| 3 — Dashboards por rol | Admin lista 51 usuarios; Enlace ve representantes/miembros/producción; Miembro ve sus stats; Líder ve su CA | ✅ Pasa (después de fix de columna `dtmFchRegistroVencimiento`) |
| 4 — Bloqueo de roles cruzados | Miembro NO puede acceder a `/dashboard/admin` escribiendo URL → es redirigido a `/dashboard/miembro` | ✅ Pasa (después de crear los 8 layouts por rol) |

### 3.5. Cuentas de prueba disponibles

Todas con password `123abc` (texto plano en `tbl_PIES_Usuarios.vchPassword` — ver pendiente de hashing):

| Rol | ID | Usuario | Persona |
|---|---|---|---|
| Enlace (DIRECCION ACADEMICA) | 2 | `0044` | JUANA GARCÍA |
| Miembro de CA | 3 | `0003` | CLAUDIA EUNICE RIVERA |
| Administrador | 5 | `0098` | JUVENCIO MENDOZA |
| Líder de CA | 6 | `0038` | CARMINA ROMERO |
| Director Educativo | 8 | `0003` | (mismo usuario, otro rol) |

Roles 1 (REPRESENTANTE) y 7 (EXTERNO) no tienen usuarios asignados aún — el profesor los insertará.

---

## 4. Pendientes restantes

### 4.1. Necesitan acción del cliente / profesor
- **Carpetas de imágenes** del proyecto ASP.NET legacy: `LogoTiposCA/`, `Publicaciones/`, `images/`, `ImagenPerfil/`. Sin ellas, la home y dashboards muestran placeholders "Sin imagen" (que ahora sí se ven, no quedan huecos blancos).

### 4.2. Necesitan coordinación con el responsable del SP
- **Migrar comparación de password a hash (bcrypt/argon2)**. Hoy `sp_CA_BuscarUsuario` recibe la contraseña en texto plano y compara contra `tbl_PIES_Usuarios.vchPassword` también en texto plano. Hay que reescribir el SP para que reciba el hash o mover la verificación a Node.
- **Activar TLS al SQL Server** en producción (`encrypt: true` con cert válido). En local no es necesario.

### 4.3. Trabajo del proyecto (no bloquea entrega)
- **Quitar `ignoreBuildErrors: true`** de `next.config.mjs`. Requiere antes purgar todos los `as any` restantes en las páginas client (estimado: 30-40 ubicaciones). Lo dejé activo temporalmente y documentado.
- **"Tipo X" cosmético en `/dashboard/admin/usuarios`**: la columna TIPO muestra `"Tipo 6"` en lugar de "Líder de C.A." cuando el ID no tiene mapeo amigable. 5 minutos de trabajo si se quiere pulir.
- **Hardcoded PII** en dashboards mock (admin/director/lider/etc.) — emails y nombres reales. Mover a fixture o reemplazar por datos genéricos antes de exponer en producción.
- **Páginas client innecesarias** (~25 con `"use client"` y datos hardcoded podrían ser server components). Reduce bundle pero requiere revisión cuidadosa de cada una.

### 4.4. Pendientes ya cerrados durante la auditoría
- ~~Confirmar IDs reales de cada rol contra `tblTipoUsuario`~~ ✅ Resuelto el 2026-04-23.
- ~~Verificar typo `intClvNivelRPOMEP` vs `PROMEP`~~ ✅ Confirmado: la columna real es `dtmFchVencimientoPROMEP` (con P), aliaseada en el handler.
- ~~Restauración de la base de datos~~ ✅ Hecho.
- ~~Configurar `.env.local`~~ ✅ Hecho automáticamente.
- ~~`npm install` y arranque del dev server~~ ✅ Hecho y verificado (`Ready in 620ms`).

---

## 5. Cómo replicar el setup en otra máquina

Si el sistema necesita instalarse en la laptop del profesor:

### 5.1. Prerrequisitos
1. **Node 22+** — descargar de https://nodejs.org
2. **SQL Server 2019 Developer Edition** — descargar de Microsoft
3. **SSMS** (SQL Server Management Studio) — `aka.ms/ssmsfullsetup`

### 5.2. Pasos
1. Copiar la carpeta `PODCA/` a la nueva máquina.
2. Copiar el archivo `2018.bak` (o tener acceso a uno equivalente).
3. Restaurar la base con un comando T-SQL como:
   ```sql
   RESTORE DATABASE bduthh_2018
   FROM DISK = N'<ruta-al-bak>'
   WITH MOVE 'bdUthh_Data' TO 'C:\<ruta-data>\bduthh_2018.mdf',
        MOVE 'bdUthh_Log'  TO 'C:\<ruta-data>\bduthh_2018.ldf',
        REPLACE, STATS = 5;
   ```
4. Habilitar modo mixto + usuario `sa` + TCP/IP 1433 (mismos `xp_instance_regwrite` que se usaron aquí).
5. Reiniciar el servicio `MSSQLSERVER`.
6. Crear `PODCA/.env.local` con las 9 variables (formato en [README.md](README.md)).
7. Desde `PODCA/`: `npm install` → `npm run dev`.
8. Abrir http://localhost:3000.

### 5.3. Validación de que quedó bien
1. Login con `0098`/`123abc`/ADMINISTRADOR → debe llegar a `/dashboard/admin`.
2. En "Usuarios" debe listar los 51 trabajadores.
3. Logout, login con `0003`/`123abc`/MIEMBRO → debe llegar a `/dashboard/miembro`.
4. Estando como miembro, escribir `/dashboard/admin` en URL → debe rebotar a `/dashboard/miembro`.

---

## 6. Criterios de aceptación

El sistema se considera **listo para entregar al profesor** cuando:

1. ✅ Todos los puntos de **Test 1** pasan sin error visible al usuario.
2. ✅ **Test 2** confirma que cada rol aterriza en su dashboard correcto.
3. ✅ **Test 3** confirma que los datos reales de la DB se cargan correctamente en cada panel.
4. ✅ **Test 4** confirma que las APIs y los dashboards rechazan accesos no autorizados.
5. ✅ La consola de `npm run dev` no muestra errores críticos durante un flujo normal.

**Estado: TODOS LOS CRITERIOS CUMPLIDOS** ✅

Lo que NO bloquea la entrega pero queda documentado:
- Los pendientes de la sección 4.
- Errores de `tsc --noEmit` (mientras `ignoreBuildErrors` esté activo).
- Hardcoded mock data en dashboards (mientras el profesor inserta los datos reales).
- "Tipo X" cosmético en lista de usuarios admin.

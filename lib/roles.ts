/**
 * Mapa central de tipos de usuario → ruta del dashboard.
 *
 * Confirmado contra `tbl_CA_TipoUsuarios` el 2026-04-23:
 *   1 = REPRESENTANTE INSTITUCIONAL
 *   2 = DIRECCION ACADEMICA   (en el front se llama "enlace académico")
 *   3 = MIEMBRO DE CUERPO ACADEMICO
 *   5 = ADMINISTRADOR
 *   6 = LIDER DEL CUERPO ACADEMICO
 *   7 = EXTERNO
 *   8 = DIRECTOR DE PROGRAMA EDUCATIVO
 *
 * Nota: el ID 4 no existe en la tabla.
 */
export const ROLE_TO_ROUTE: Record<string, string> = {
  "1": "/dashboard/representante",
  "2": "/dashboard/enlace",
  "3": "/dashboard/miembro",
  "5": "/dashboard/admin",
  "6": "/dashboard/lider",
  "7": "/dashboard/externo",
  "8": "/dashboard/director",
};

export const DEFAULT_DASHBOARD = "/dashboard";

export function redirectForRole(tipoUser: string | null | undefined): string {
  if (!tipoUser) return DEFAULT_DASHBOARD;
  return ROLE_TO_ROUTE[tipoUser] ?? DEFAULT_DASHBOARD;
}

// IDs útiles para llamadas a `requireRole([...])`
export const ROLE = {
  REPRESENTANTE: "1",
  ENLACE: "2",
  MIEMBRO: "3",
  ADMIN: "5",
  LIDER: "6",
  EXTERNO: "7",
  DIRECTOR: "8",
} as const;

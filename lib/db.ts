import sql from "mssql";

declare global {
  // eslint-disable-next-line no-var
  var __mssqlPoolPromise: Promise<sql.ConnectionPool> | undefined;
}

function buildConfig(): sql.config {
  const required = ["DB_SERVER", "DB_DATABASE", "DB_USER", "DB_PASSWORD", "DB_PORT"] as const;
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Falta la variable de entorno ${key} en .env.local`);
    }
  }
  const port = Number.parseInt(process.env.DB_PORT!);
  if (!Number.isFinite(port)) {
    throw new Error(`DB_PORT debe ser un número, recibido: ${process.env.DB_PORT}`);
  }

  return {
    server: process.env.DB_SERVER!,
    database: process.env.DB_DATABASE!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    port,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

async function createPool(): Promise<sql.ConnectionPool> {
  const pool = new sql.ConnectionPool(buildConfig());
  pool.on("error", (err) => {
    console.error("[mssql pool error]", err);
    if (globalThis.__mssqlPoolPromise) {
      globalThis.__mssqlPoolPromise = undefined;
    }
  });
  await pool.connect();
  return pool;
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!globalThis.__mssqlPoolPromise) {
    globalThis.__mssqlPoolPromise = createPool().catch((err) => {
      globalThis.__mssqlPoolPromise = undefined;
      throw err;
    });
  }
  const pool = await globalThis.__mssqlPoolPromise;
  if (!pool.connected && !pool.connecting) {
    globalThis.__mssqlPoolPromise = undefined;
    return getConnection();
  }
  return pool;
}

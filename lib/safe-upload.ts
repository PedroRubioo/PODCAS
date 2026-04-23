import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export type SaveUploadOptions = {
  file: File;
  subDir: string;
  allowedExt: string[];
  maxBytes?: number;
  prefix?: string;
};

export type SaveUploadResult =
  | { ok: true; filename: string }
  | { ok: false; error: string; status: number };

export async function saveUpload({
  file,
  subDir,
  allowedExt,
  maxBytes = 5 * 1024 * 1024,
  prefix,
}: SaveUploadOptions): Promise<SaveUploadResult> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Archivo requerido", status: 400 };
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / 1024 / 1024);
    return { ok: false, error: `El archivo no puede superar ${mb} MB`, status: 400 };
  }

  const rawName = (file.name ?? "").toLowerCase();
  const ext = rawName.includes(".") ? rawName.split(".").pop() ?? "" : "";
  const cleanExt = ext.replaceAll(/[^a-z0-9]/g, "");
  if (!cleanExt || !allowedExt.includes(cleanExt)) {
    return {
      ok: false,
      error: `Extensión no permitida. Permitidas: ${allowedExt.join(", ")}`,
      status: 400,
    };
  }

  const safePrefix = (prefix ?? "")
    .replaceAll(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 32);
  const uuid = crypto.randomUUID();
  const filename = safePrefix
    ? `${safePrefix}_${uuid}.${cleanExt}`
    : `${uuid}.${cleanExt}`;

  const baseDir = path.join(process.cwd(), "public", subDir);
  await mkdir(baseDir, { recursive: true });

  const fullPath = path.join(baseDir, filename);
  if (!fullPath.startsWith(baseDir + path.sep)) {
    return { ok: false, error: "Ruta de archivo inválida", status: 400 };
  }

  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));
  return { ok: true, filename };
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfcfa] px-6">
      <div className="max-w-md text-center">
        <p className="text-[0.7rem] tracking-[0.18em] uppercase text-[#c9a227] font-semibold mb-3">
          Error 404
        </p>
        <h1 className="font-serif text-[2rem] font-bold text-[#722F37] mb-3">
          Página no encontrada
        </h1>
        <p className="text-[0.9rem] text-[#6b6b6b] mb-6">
          La dirección que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2 bg-[#722F37] text-white rounded-[3px] text-[0.82rem] font-semibold no-underline hover:bg-[#c9a227] transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

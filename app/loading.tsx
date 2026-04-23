export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfcfa]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#e8e4df] border-t-[#c9a227] rounded-full animate-spin" />
        <p className="text-[0.78rem] tracking-[0.12em] uppercase text-[#9a9a9a] font-semibold">
          Cargando...
        </p>
      </div>
    </div>
  );
}

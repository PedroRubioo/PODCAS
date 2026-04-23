export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfcfa]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-[#e8e4df] border-t-[#c9a227] rounded-full animate-spin" />
        <p className="text-[0.72rem] tracking-[0.12em] uppercase text-[#9a9a9a] font-semibold">
          Cargando panel...
        </p>
      </div>
    </div>
  );
}

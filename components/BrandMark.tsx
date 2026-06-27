type BrandMarkProps = {
  variant?: "light" | "dark";
};

export function BrandMark({ variant = "dark" }: BrandMarkProps) {
  const isLight = variant === "light";

  return (
    <div className="flex items-center gap-3">
      <div className={isLight ? "flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand-navy" : "flex h-11 w-11 items-center justify-center rounded-lg bg-brand-navy text-white"}>
        <span className="text-xl font-black">K</span>
      </div>
      <div>
        <p className={isLight ? "text-2xl font-black tracking-normal text-white" : "text-2xl font-black tracking-normal text-brand-navy"}>
          Kombuy
        </p>
        <p className={isLight ? "text-xs font-semibold uppercase tracking-[0.16em] text-slate-300" : "text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"}>
          Finance seu carrinho
        </p>
      </div>
    </div>
  );
}

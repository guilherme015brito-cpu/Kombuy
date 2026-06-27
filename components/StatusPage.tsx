import { BrandMark } from "@/components/BrandMark";

type StatusTone = "analysis" | "success" | "refused";

const toneStyles: Record<StatusTone, string> = {
  analysis: "bg-blue-50 text-brand-blue border-blue-100",
  success: "bg-green-50 text-brand-green border-green-100",
  refused: "bg-red-50 text-red-700 border-red-100"
};

type StatusPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  tone: StatusTone;
  children: React.ReactNode;
};

export function StatusPage({ eyebrow, title, description, tone, children }: StatusPageProps) {
  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-2xl rounded-xl border border-brand-line bg-white p-6 shadow-soft sm:p-10">
        <BrandMark />
        <div className={`mt-10 inline-flex rounded-full border px-4 py-2 text-sm font-bold ${toneStyles[tone]}`}>
          {eyebrow}
        </div>
        <h1 className="mt-5 text-3xl font-bold text-brand-navy sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{description}</p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}

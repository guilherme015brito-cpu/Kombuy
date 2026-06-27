import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { createSupabaseAuthServerClient, getCurrentAdmin } from "@/lib/auth/admin";

type SearchValue = string | string[] | undefined;

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, SearchValue>>;
};

function readParam(params: Record<string, SearchValue>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirectTo") || "/admin/propostas");
  const safeRedirect = redirectTo.startsWith("/admin") && redirectTo !== "/admin/login" ? redirectTo : "/admin/propostas";
  const supabase = await createSupabaseAuthServerClient();

  if (!supabase) {
    redirect("/admin/login?erro=configuracao");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/admin/login?erro=credenciais&redirect=${encodeURIComponent(safeRedirect)}`);
  }

  redirect(safeRedirect);
}

async function logout() {
  "use server";

  const supabase = await createSupabaseAuthServerClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = readParam(params, "erro");
  const redirectTo = readParam(params, "redirect") || "/admin/propostas";
  const { user } = await getCurrentAdmin();

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-brand-line bg-white p-6 shadow-soft sm:p-8">
        <BrandMark />
        <div className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-blue">Administrativo</p>
          <h1 className="mt-2 text-3xl font-bold text-brand-navy">Entrar no painel</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use o e-mail cadastrado no Supabase Auth e permitido em ADMIN_EMAILS.
          </p>
        </div>

        {user ? (
          <form action={logout} className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">Voce ja esta autenticado como {user.email}.</p>
            <button className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-bold text-green-800">
              Sair
            </button>
          </form>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {error === "configuracao"
              ? "Supabase Auth nao esta configurado corretamente."
              : "Nao foi possivel entrar. Verifique e-mail, senha e permissao administrativa."}
          </div>
        ) : null}

        <form action={login} className="mt-6 space-y-5">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="block">
            <span className="field-label">E-mail</span>
            <input className="field-input" name="email" type="email" required placeholder="admin@kombuy.com.br" />
          </label>
          <label className="block">
            <span className="field-label">Senha</span>
            <input className="field-input" name="password" type="password" required placeholder="Sua senha" />
          </label>
          <button className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand-green px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}

import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { getAdminEmails, isAllowedAdminEmail } from "@/lib/auth/allowlist";

function getSupabaseAuthConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  };
}

export { getAdminEmails, isAllowedAdminEmail };

export async function createSupabaseAuthServerClient() {
  const { url, anonKey } = getSupabaseAuthConfig();
  const cookieStore = await cookies();

  if (!url || !anonKey) {
    return null;
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always persist refreshed cookies.
        }
      }
    }
  });
}

export async function getCurrentAdmin() {
  const supabase = await createSupabaseAuthServerClient();

  if (!supabase) {
    return {
      user: null,
      error: "Supabase Auth nao configurado."
    };
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: "Sessao administrativa ausente."
    };
  }

  if (!isAllowedAdminEmail(user.email)) {
    return {
      user: null,
      error: "E-mail sem permissao administrativa."
    };
  }

  return {
    user,
    error: null
  };
}

export async function requireAdmin() {
  const { user } = await getCurrentAdmin();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

export async function requireAdminForApi() {
  const { user, error } = await getCurrentAdmin();

  if (!user) {
    return {
      user: null,
      response: Response.json({ success: false, error: error || "Acesso administrativo necessario." }, { status: 401 })
    };
  }

  return {
    user,
    response: null
  };
}

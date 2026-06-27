import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/admin";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { isProposalStatus } from "@/lib/proposals/status";
import { parseCreateProposal } from "@/lib/proposals/validation";
import { genericServerError } from "@/lib/safe-error";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase nao configurado. Verifique as variaveis de ambiente." },
      { status: 500 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "JSON invalido." }, { status: 400 });
  }

  const validation = parseCreateProposal(payload);

  if (!validation.success) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("propostas")
    .insert(validation.data)
    .select("id,status,financing_status")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: genericServerError() }, { status: 500 });
  }

  return NextResponse.json({ success: true, proposta: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminForApi();

  if (auth.response) {
    return auth.response;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase nao configurado. Verifique as variaveis de ambiente." },
      { status: 500 }
    );
  }

  let payload: { id?: string; status?: string };

  try {
    payload = (await request.json()) as { id?: string; status?: string };
  } catch {
    return NextResponse.json({ success: false, error: "JSON invalido." }, { status: 400 });
  }

  const id = stringValue(payload.id);
  const status = stringValue(payload.status);

  if (!id) {
    return NextResponse.json({ success: false, error: "ID da proposta obrigatorio." }, { status: 400 });
  }

  if (!isProposalStatus(status)) {
    return NextResponse.json({ success: false, error: "Status invalido." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("propostas")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,status")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: genericServerError() }, { status: 500 });
  }

  return NextResponse.json({ success: true, proposta: data });
}

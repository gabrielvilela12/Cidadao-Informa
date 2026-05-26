import { createClient } from "supabase";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SessionPayload {
  userId?: string;
  name?: string;
  role?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function decodeSessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token) return null;

  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

function firstRow<T>(rows: T[] | null): T | null {
  return rows && rows.length > 0 ? rows[0] : null;
}

async function getUserFromToken(token: string | null | undefined) {
  const payload = decodeSessionToken(token);
  if (!payload?.userId) {
    throw new Error("Sessão inválida ou expirada.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, role")
    .eq("id", payload.userId)
    .limit(1);

  if (error) throw error;

  const user = firstRow(data);
  if (!user) throw new Error("Usuário não encontrado. Sessão encerrada.");

  return user;
}

async function listProtocols(token: string | null | undefined, requestedUserId?: string) {
  const user = token ? await getUserFromToken(token) : null;

  let query = supabase
    .from("protocols")
    .select("*, users!inner(phone)")
    .order("created_at", { ascending: false });

  if (user?.role !== "admin") {
    const userId = requestedUserId ?? user?.id;
    if (!userId) return [];
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data ?? [];
}

async function getProtocolById(id: string) {
  const { data, error } = await supabase
    .from("protocols")
    .select("*")
    .eq("id", id)
    .limit(1);

  if (error) throw error;

  return firstRow(data);
}

async function createProtocol(body: Record<string, unknown>) {
  const user = await getUserFromToken(String(body.token ?? ""));
  const now = new Date().toISOString();

  const protocol = {
    id: crypto.randomUUID(),
    category: String(body.category ?? ""),
    description: String(body.description ?? ""),
    address: String(body.address ?? ""),
    status: String(body.status ?? "Aberto"),
    user_id: user.id,
    requester: String(user.full_name ?? "Usuário"),
    created_at: now,
  };

  if (!protocol.category || !protocol.description || !protocol.address) {
    throw new Error("Preencha categoria, descrição e endereço.");
  }

  const { data, error } = await supabase
    .from("protocols")
    .insert(protocol)
    .select("*")
    .limit(1);

  if (error) throw error;

  const created = firstRow(data);
  if (!created) throw new Error("Protocolo criado, mas não foi possível carregar os dados.");

  return created;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ success: false, error: "Supabase environment is not configured" }, 500);
  }

  try {
    const body = await req.json();

    switch (body.action) {
      case "list":
        return jsonResponse({ success: true, data: await listProtocols(body.token, body.userId) });
      case "getById":
        return jsonResponse({ success: true, data: await getProtocolById(body.id) });
      case "create":
        return jsonResponse({ success: true, data: await createProtocol(body) });
      default:
        return jsonResponse({ success: false, error: "Invalid action" }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ success: false, error: message }, 400);
  }
});

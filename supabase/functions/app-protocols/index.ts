import { createClient } from "supabase";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SESSION_SECRET = Deno.env.get("APP_SESSION_SECRET") ?? SUPABASE_SERVICE_ROLE_KEY;

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
  exp?: number;
}

interface AppUser {
  id: string;
  full_name: string;
  role: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function base64UrlToBytes(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

async function decodeSessionToken(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;

    const unsignedToken = `${header}.${payload}`;
    const expectedBytes = base64UrlToBytes(signature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      expectedBytes,
      new TextEncoder().encode(unsignedToken),
    );

    if (!isValid) return null;

    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as SessionPayload;
    if (!parsed.exp || Date.now() > parsed.exp) return null;

    return parsed;
  } catch {
    return null;
  }
}

function firstRow<T>(rows: T[] | null): T | null {
  return rows && rows.length > 0 ? rows[0] : null;
}

async function getUserFromToken(token: string | null | undefined): Promise<AppUser> {
  const payload = await decodeSessionToken(token);
  if (!payload?.userId) {
    throw new Error("Sessao invalida ou expirada.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, role")
    .eq("id", payload.userId)
    .limit(1);

  if (error) throw error;

  const user = firstRow(data as AppUser[]);
  if (!user) throw new Error("Usuario nao encontrado. Sessao encerrada.");

  return user;
}

async function listProtocols(token: string | null | undefined, scope?: string) {
  const user = await getUserFromToken(token);

  let query = supabase
    .from("protocols")
    .select("*, users!inner(phone)")
    .order("created_at", { ascending: false });

  if (scope === "admin" || scope === "all") {
    if (user.role !== "admin") {
      throw new Error("Acesso restrito a administradores.");
    }
  } else {
    query = query.eq("user_id", user.id);
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
    requester: String(user.full_name ?? "Usuario"),
    created_at: now,
  };

  if (!protocol.category || !protocol.description || !protocol.address) {
    throw new Error("Preencha categoria, descricao e endereco.");
  }

  const { data, error } = await supabase
    .from("protocols")
    .insert(protocol)
    .select("*")
    .limit(1);

  if (error) throw error;

  const created = firstRow(data);
  if (!created) throw new Error("Protocolo criado, mas nao foi possivel carregar os dados.");

  return created;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SESSION_SECRET) {
    return jsonResponse({ success: false, error: "Supabase environment is not configured" }, 500);
  }

  try {
    const body = await req.json();

    switch (body.action) {
      case "list":
        return jsonResponse({ success: true, data: await listProtocols(body.token, body.scope) });
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

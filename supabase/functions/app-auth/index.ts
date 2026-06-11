import bcrypt from "bcryptjs";
import { createClient } from "supabase";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SESSION_SECRET = Deno.env.get("APP_SESSION_SECRET") ?? SUPABASE_SERVICE_ROLE_KEY;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DbUser {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  phone?: string;
  role: string;
  password_hash: string;
  created_at: string;
}

interface SessionPayload {
  userId: string;
  cpf: string;
  role: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  iat: number;
  exp: number;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function firstRow<T>(rows: T[] | null): T | null {
  return rows && rows.length > 0 ? rows[0] : null;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function stringToBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
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
    ["sign", "verify"],
  );
}

async function createSessionToken(user: DbUser): Promise<string> {
  const now = Date.now();
  const header = stringToBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = stringToBase64Url(JSON.stringify({
    userId: user.id,
    cpf: user.cpf,
    role: user.role === "admin" ? "admin" : "citizen",
    name: user.full_name,
    email: user.email,
    phone: user.phone,
    createdAt: user.created_at,
    iat: now,
    exp: now + SESSION_TTL_MS,
  }));

  const unsignedToken = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    new TextEncoder().encode(unsignedToken),
  );

  return `${unsignedToken}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function decodeSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;

    const unsignedToken = `${header}.${payload}`;
    const isValid = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      base64UrlToBytes(signature),
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

async function authPayload(user: DbUser) {
  return {
    token: await createSessionToken(user),
    userId: user.id,
    name: user.full_name,
    email: user.email,
    cpf: user.cpf,
    phone: user.phone,
    role: user.role,
    createdAt: user.created_at,
  };
}

async function login(cpf: string, password: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("cpf", cpf)
    .limit(1);

  if (error) throw error;

  const user = firstRow(data as DbUser[]);
  if (!user) throw new Error("CPF ou senha invalidos.");

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error("CPF ou senha invalidos.");

  return authPayload(user);
}

async function register(name: string, email: string, cpf: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingCpf, error: cpfError } = await supabase
    .from("users")
    .select("id")
    .eq("cpf", cpf)
    .limit(1);

  if (cpfError) throw cpfError;
  if (firstRow(existingCpf)) throw new Error("Ja existe uma conta cadastrada com este CPF.");

  const { data: existingEmail, error: emailError } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .limit(1);

  if (emailError) throw emailError;
  if (firstRow(existingEmail)) throw new Error("Ja existe uma conta cadastrada com este E-mail.");

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: crypto.randomUUID(),
      full_name: name,
      email: normalizedEmail,
      cpf,
      role: "citizen",
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .limit(1);

  if (error) throw error;

  const user = firstRow(data as DbUser[]);
  if (!user) throw new Error("Cadastro criado, mas nao foi possivel carregar o usuario.");

  return authPayload(user);
}

async function getMe(token: string) {
  const payload = await decodeSessionToken(token);
  const userId = payload?.userId;

  if (!userId) {
    throw new Error("Sessao invalida ou expirada.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, cpf, phone, role, created_at")
    .eq("id", userId)
    .limit(1);

  if (error) throw error;

  const user = firstRow(data as DbUser[]);
  if (!user) throw new Error("Usuario nao encontrado. Sessao encerrada.");

  return {
    userId: user.id,
    name: user.full_name,
    email: user.email,
    cpf: user.cpf,
    phone: user.phone,
    role: user.role,
    createdAt: user.created_at,
  };
}

async function updatePhone(token: string, phone: string) {
  const payload = await decodeSessionToken(token);
  const userId = payload?.userId;

  if (!userId) {
    throw new Error("Sessao invalida ou expirada.");
  }

  const { data, error } = await supabase
    .from("users")
    .update({ phone })
    .eq("id", userId)
    .select("id, full_name, email, cpf, phone, role, created_at")
    .limit(1);

  if (error) throw error;

  const user = firstRow(data);
  if (!user) throw new Error("Usuario nao encontrado. Sessao encerrada.");

  return user;
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
      case "login":
        return jsonResponse({ success: true, data: await login(body.cpf, body.password) });
      case "register":
        return jsonResponse({ success: true, data: await register(body.name, body.email, body.cpf, body.password) });
      case "getMe":
        return jsonResponse({ success: true, data: await getMe(body.token) });
      case "updatePhone":
        return jsonResponse({ success: true, data: await updatePhone(body.token, body.phone) });
      default:
        return jsonResponse({ success: false, error: "Invalid action" }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ success: false, error: message }, 400);
  }
});

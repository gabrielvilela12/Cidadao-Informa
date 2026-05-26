import bcrypt from "bcryptjs";
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function firstRow<T>(rows: T[] | null): T | null {
  return rows && rows.length > 0 ? rows[0] : null;
}

function createSessionToken(user: DbUser): string {
  const payload = {
    userId: user.id,
    cpf: user.cpf,
    role: user.role,
    name: user.full_name,
    email: user.email,
    phone: user.phone,
    createdAt: user.created_at,
    iat: Date.now(),
  };

  return btoa(JSON.stringify(payload));
}

function decodeSessionToken(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

function authPayload(user: DbUser) {
  return {
    token: createSessionToken(user),
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
  if (!user) throw new Error("CPF ou senha inválidos.");

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error("CPF ou senha inválidos.");

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
  if (firstRow(existingCpf)) throw new Error("Já existe uma conta cadastrada com este CPF.");

  const { data: existingEmail, error: emailError } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .limit(1);

  if (emailError) throw emailError;
  if (firstRow(existingEmail)) throw new Error("Já existe uma conta cadastrada com este E-mail.");

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
  if (!user) throw new Error("Cadastro criado, mas não foi possível carregar o usuário.");

  return authPayload(user);
}

async function getMe(token: string) {
  const payload = decodeSessionToken(token);
  const userId = payload?.userId;

  if (!userId || typeof userId !== "string") {
    throw new Error("Sessão inválida ou expirada.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, cpf, phone, role, created_at")
    .eq("id", userId)
    .limit(1);

  if (error) throw error;

  const user = firstRow(data as DbUser[]);
  if (!user) throw new Error("Usuário não encontrado. Sessão encerrada.");

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
  const payload = decodeSessionToken(token);
  const userId = payload?.userId;

  if (!userId || typeof userId !== "string") {
    throw new Error("Sessão inválida ou expirada.");
  }

  const { data, error } = await supabase
    .from("users")
    .update({ phone })
    .eq("id", userId)
    .select("id, full_name, email, cpf, phone, role, created_at")
    .limit(1);

  if (error) throw error;

  const user = firstRow(data);
  if (!user) throw new Error("Usuário não encontrado. Sessão encerrada.");

  return user;
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

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

interface ProtocolRow {
  id: string;
  category: string;
  description: string;
  address: string;
  status: string;
  user_id: string;
  requester: string;
  created_at: string;
  ai_priority?: string | null;
  ai_status?: string | null;
}

interface AuditBlockRow {
  id: string;
  block_index: number | string;
  protocol_id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: string;
  previous_status: string | null;
  new_status: string | null;
  payload: Record<string, unknown>;
  payload_hash: string;
  previous_block_hash: string | null;
  block_hash: string;
  created_at: string;
}

interface AuditBlockInput {
  protocolId: string;
  eventType: string;
  actorId?: string | null;
  actorRole: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  payload: Record<string, unknown>;
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

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));

  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeAuditRole(role: string): "citizen" | "admin" | "system" | "ia" {
  if (role === "admin" || role === "system" || role === "ia") return role;
  return "citizen";
}

async function getLatestAuditBlock(): Promise<{ block_index: number; block_hash: string } | null> {
  const { data, error } = await supabase
    .from("protocol_audit_chain")
    .select("block_index, block_hash")
    .order("block_index", { ascending: false })
    .limit(1);

  if (error) throw error;

  const latest = firstRow(data as { block_index: number | string; block_hash: string }[]);
  if (!latest) return null;

  return {
    block_index: Number(latest.block_index),
    block_hash: latest.block_hash,
  };
}

async function appendAuditBlock(input: AuditBlockInput): Promise<void> {
  const actorRole = normalizeAuditRole(input.actorRole);
  const occurredAt = new Date().toISOString();
  const payload = {
    protocol_id: input.protocolId,
    event_type: input.eventType,
    actor_id: input.actorId ?? null,
    actor_role: actorRole,
    previous_status: input.previousStatus ?? null,
    new_status: input.newStatus ?? null,
    occurred_at: occurredAt,
    evidence: input.payload,
  };
  const payloadHash = await sha256Hex(stableStringify(payload));
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const previousBlock = await getLatestAuditBlock();
    const blockIndex = (previousBlock?.block_index ?? 0) + 1;
    const previousBlockHash = previousBlock?.block_hash ?? null;
    const blockHash = await sha256Hex(stableStringify({
      block_index: blockIndex,
      payload_hash: payloadHash,
      previous_block_hash: previousBlockHash,
    }));

    const { error } = await supabase.from("protocol_audit_chain").insert({
      block_index: blockIndex,
      protocol_id: input.protocolId,
      event_type: input.eventType,
      actor_id: input.actorId ?? null,
      actor_role: actorRole,
      previous_status: input.previousStatus ?? null,
      new_status: input.newStatus ?? null,
      payload,
      payload_hash: payloadHash,
      previous_block_hash: previousBlockHash,
      block_hash: blockHash,
      created_at: occurredAt,
    });

    if (!error) return;

    lastError = error;
    if ((error as { code?: string }).code !== "23505") {
      throw error;
    }
  }

  throw lastError ?? new Error("Nao foi possivel registrar o bloco de auditoria.");
}

async function verifyAuditBlock(block: AuditBlockRow): Promise<boolean> {
  const expectedPayloadHash = await sha256Hex(stableStringify(block.payload ?? {}));
  const expectedBlockHash = await sha256Hex(stableStringify({
    block_index: Number(block.block_index),
    payload_hash: block.payload_hash,
    previous_block_hash: block.previous_block_hash ?? null,
  }));

  return expectedPayloadHash === block.payload_hash && expectedBlockHash === block.block_hash;
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

async function getProtocolById(id: string): Promise<ProtocolRow | null> {
  const { data, error } = await supabase
    .from("protocols")
    .select("*")
    .eq("id", id)
    .limit(1);

  if (error) throw error;

  return firstRow(data as ProtocolRow[]);
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

  const createdProtocol = created as ProtocolRow;
  await appendAuditBlock({
    protocolId: createdProtocol.id,
    eventType: "PROTOCOL_CREATED",
    actorId: user.id,
    actorRole: user.role,
    previousStatus: null,
    newStatus: createdProtocol.status,
    payload: {
      category: createdProtocol.category,
      status: createdProtocol.status,
      description_hash: await sha256Hex(createdProtocol.description),
      address_hash: await sha256Hex(createdProtocol.address),
      requester_hash: await sha256Hex(createdProtocol.requester),
    },
  });

  return created;
}

async function setProtocolPriority(body: Record<string, unknown>) {
  const user = await getUserFromToken(String(body.token ?? ""));
  if (user.role !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }

  const protocolId = String(body.protocolId ?? "");
  const priority = String(body.priority ?? "");
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const allowedPriorities = ["baixa", "media", "alta", "critica"];

  if (!protocolId || !allowedPriorities.includes(priority)) {
    throw new Error("Prioridade invalida.");
  }

  const currentProtocol = await getProtocolById(protocolId);
  if (!currentProtocol) {
    throw new Error("Protocolo nao encontrado.");
  }

  const previousPriority = currentProtocol.ai_priority ?? null;
  const { data, error } = await supabase
    .from("protocols")
    .update({ ai_priority: priority, ai_status: "success" })
    .eq("id", protocolId)
    .select("*")
    .limit(1);

  if (error) throw error;

  const updatedProtocol = firstRow(data as ProtocolRow[]);
  if (!updatedProtocol) {
    throw new Error("Prioridade alterada, mas nao foi possivel carregar o protocolo.");
  }

  const { error: logError } = await supabase.from("ai_job_logs").insert({
    protocol_id: protocolId,
    priority,
    source: "admin_manual",
    previous_priority: previousPriority,
    reason: reason || null,
  });

  if (logError) throw logError;

  await appendAuditBlock({
    protocolId,
    eventType: "PRIORITY_CHANGED",
    actorId: user.id,
    actorRole: user.role,
    previousStatus: currentProtocol.status,
    newStatus: updatedProtocol.status,
    payload: {
      previous_priority: previousPriority,
      new_priority: priority,
      reason_hash: reason ? await sha256Hex(reason) : null,
    },
  });

  return updatedProtocol;
}

async function setProtocolStatus(body: Record<string, unknown>) {
  const user = await getUserFromToken(String(body.token ?? ""));
  if (user.role !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }

  const protocolId = String(body.protocolId ?? "");
  const status = String(body.status ?? "");
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const allowedStatuses = ["Aberto", "Em An\u00e1lise", "Conclu\u00eddo", "Atrasado"];

  if (!protocolId || !allowedStatuses.includes(status)) {
    throw new Error("Status invalido.");
  }

  const currentProtocol = await getProtocolById(protocolId);
  if (!currentProtocol) {
    throw new Error("Protocolo nao encontrado.");
  }

  const { data, error } = await supabase
    .from("protocols")
    .update({ status })
    .eq("id", protocolId)
    .select("*")
    .limit(1);

  if (error) throw error;

  const updatedProtocol = firstRow(data as ProtocolRow[]);
  if (!updatedProtocol) {
    throw new Error("Status alterado, mas nao foi possivel carregar o protocolo.");
  }

  await appendAuditBlock({
    protocolId,
    eventType: "STATUS_CHANGED",
    actorId: user.id,
    actorRole: user.role,
    previousStatus: currentProtocol.status,
    newStatus: updatedProtocol.status,
    payload: {
      reason_hash: reason ? await sha256Hex(reason) : null,
    },
  });

  return updatedProtocol;
}

async function getProtocolAuditTrail(body: Record<string, unknown>) {
  const user = await getUserFromToken(String(body.token ?? ""));
  const protocolId = String(body.protocolId ?? "");
  if (!protocolId) throw new Error("Protocolo nao informado.");

  const protocol = await getProtocolById(protocolId);
  if (!protocol) throw new Error("Protocolo nao encontrado.");

  if (user.role !== "admin" && protocol.user_id !== user.id) {
    throw new Error("Voce nao tem acesso a auditoria deste protocolo.");
  }

  const { data, error } = await supabase
    .from("protocol_audit_chain")
    .select("*")
    .eq("protocol_id", protocolId)
    .order("block_index", { ascending: true });

  if (error) throw error;

  const blocks = (data ?? []) as AuditBlockRow[];
  const verifiedBlocks = await Promise.all(
    blocks.map(async (block) => ({
      ...block,
      is_valid: await verifyAuditBlock(block),
    })),
  );

  return {
    valid: verifiedBlocks.every((block) => block.is_valid),
    blocks: verifiedBlocks,
  };
}

async function verifyAuditChain(token: string | null | undefined) {
  const user = await getUserFromToken(token);
  if (user.role !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }

  const { data, error } = await supabase
    .from("protocol_audit_chain")
    .select("*")
    .order("block_index", { ascending: true });

  if (error) throw error;

  const blocks = (data ?? []) as AuditBlockRow[];
  let previousHash: string | null = null;

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const expectedIndex = index + 1;
    const blockIndex = Number(block.block_index);
    const hashIsValid = await verifyAuditBlock(block);

    if (blockIndex !== expectedIndex || block.previous_block_hash !== previousHash || !hashIsValid) {
      return {
        valid: false,
        totalBlocks: blocks.length,
        invalidBlockIndex: blockIndex,
        invalidBlockHash: block.block_hash,
      };
    }

    previousHash = block.block_hash;
  }

  return {
    valid: true,
    totalBlocks: blocks.length,
    latestBlockHash: previousHash,
  };
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
      case "setPriority":
        return jsonResponse({ success: true, data: await setProtocolPriority(body) });
      case "setStatus":
        return jsonResponse({ success: true, data: await setProtocolStatus(body) });
      case "auditTrail":
        return jsonResponse({ success: true, data: await getProtocolAuditTrail(body) });
      case "verifyAuditChain":
        return jsonResponse({ success: true, data: await verifyAuditChain(body.token) });
      default:
        return jsonResponse({ success: false, error: "Invalid action" }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ success: false, error: message }, 400);
  }
});

import { createClient } from "supabase";
import { classifyPriority } from "./openrouter-client.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestPayload {
  protocol_id: string;
  description: string;
  category: string;
}

interface AuditBlockInput {
  protocolId: string;
  eventType: string;
  actorRole: "citizen" | "admin" | "system" | "ia";
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
  const occurredAt = new Date().toISOString();
  const payload = {
    protocol_id: input.protocolId,
    event_type: input.eventType,
    actor_id: null,
    actor_role: input.actorRole,
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
      actor_id: null,
      actor_role: input.actorRole,
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

async function markJobProcessing(payload: RequestPayload): Promise<void> {
  const now = new Date().toISOString();
  const { protocol_id, description, category } = payload;

  const { data: existingJobs, error: updateError } = await supabase
    .from("ai_priority_jobs")
    .update({
      status: "processing",
      description,
      category,
      result_priority: null,
      error_message: null,
      processing_started_at: now,
      completed_at: null,
      updated_at: now,
    })
    .eq("protocol_id", protocol_id)
    .select("id");

  if (updateError) throw updateError;

  if (!existingJobs?.length) {
    const { error: insertError } = await supabase.from("ai_priority_jobs").insert({
      protocol_id,
      description,
      category,
      status: "processing",
      processing_started_at: now,
      updated_at: now,
    });

    if (insertError) throw insertError;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ success: false, error: "Supabase environment is not configured" }, 500);
  }

  let protocol_id = "";

  try {
    const payload: RequestPayload = await req.json();
    protocol_id = payload.protocol_id;
    const { description, category } = payload;

    if (!protocol_id || !description || !category) {
      return jsonResponse({ success: false, error: "Missing required fields" }, 400);
    }

    await markJobProcessing(payload);

    const { data: existingProtocol } = await supabase
      .from("protocols")
      .select("status, ai_priority")
      .eq("id", protocol_id)
      .limit(1);

    const result = await classifyPriority({ description, category });
    const completedAt = new Date().toISOString();

    await supabase
      .from("ai_priority_jobs")
      .update({
        status: "success",
        result_priority: result.priority,
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq("protocol_id", protocol_id);

    await supabase
      .from("protocols")
      .update({
        ai_priority: result.priority,
        ai_status: "success",
      })
      .eq("id", protocol_id);

    await supabase.from("ai_job_logs").insert({
      protocol_id,
      priority: result.priority,
      source: "ia",
    });

    const protocolBefore = firstRow(existingProtocol as { status?: string; ai_priority?: string | null }[]);
    try {
      await appendAuditBlock({
        protocolId: protocol_id,
        eventType: "AI_PRIORITY_CLASSIFIED",
        actorRole: "ia",
        previousStatus: protocolBefore?.status ?? null,
        newStatus: protocolBefore?.status ?? null,
        payload: {
          category,
          previous_priority: protocolBefore?.ai_priority ?? null,
          new_priority: result.priority,
          description_hash: await sha256Hex(description),
        },
      });
    } catch (auditError) {
      console.error("Audit chain append failed:", auditError);
    }

    return jsonResponse({ success: true, priority: result.priority });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Classification error:", errorMessage);

    if (protocol_id) {
      const completedAt = new Date().toISOString();

      await supabase
        .from("ai_priority_jobs")
        .update({ status: "failed", error_message: errorMessage, completed_at: completedAt, updated_at: completedAt })
        .eq("protocol_id", protocol_id);

      await supabase
        .from("protocols")
        .update({ ai_status: "failed" })
        .eq("id", protocol_id);
    }

    return jsonResponse({ success: false, error: errorMessage }, 500);
  }
});

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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
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

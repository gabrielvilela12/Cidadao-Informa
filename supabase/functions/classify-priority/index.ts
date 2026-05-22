import { createClient } from "supabase";
import {
  classifyPriority,
  type ClassifyRequest,
} from "./openrouter-client.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  let protocol_id = "";

  try {
    const payload: RequestPayload = await req.json();
    protocol_id = payload.protocol_id;
    const { description, category } = payload;

    if (!protocol_id || !description || !category) {
      return new Response("Missing required fields", { status: 400, headers: corsHeaders });
    }

    await supabase
      .from("ai_priority_jobs")
      .update({
        status: "processing",
        processing_started_at: new Date(),
      })
      .eq("protocol_id", protocol_id);

    const result = await classifyPriority({ description, category });

    await supabase
      .from("ai_priority_jobs")
      .update({
        status: "success",
        result_priority: result.priority,
        completed_at: new Date(),
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

    return new Response(
      JSON.stringify({ success: true, priority: result.priority }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Classification error:", errorMessage);

    if (protocol_id) {
      await supabase
        .from("ai_priority_jobs")
        .update({ status: "failed", error_message: errorMessage, completed_at: new Date() })
        .eq("protocol_id", protocol_id);

      await supabase
        .from("protocols")
        .update({ ai_status: "failed" })
        .eq("id", protocol_id);
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

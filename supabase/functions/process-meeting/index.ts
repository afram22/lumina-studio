import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return json({ error: "LOVABLE_API_KEY not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes } = await userClient.auth.getUser();
  const user = userRes?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: { meetingId: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const { meetingId } = body;
  if (!meetingId) return json({ error: "meetingId required" }, 400);

  const { data: meeting, error: mErr } = await admin
    .from("meetings").select("*").eq("id", meetingId).eq("user_id", user.id).single();
  if (mErr || !meeting) return json({ error: "Meeting not found" }, 404);

  // Background processing
  // @ts-ignore EdgeRuntime is available on Supabase Edge
  EdgeRuntime.waitUntil(processMeeting(admin, meeting, LOVABLE_API_KEY));

  return json({ ok: true, meetingId }, 202);

  function json(b: unknown, status = 200) {
    return new Response(JSON.stringify(b), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processMeeting(admin: any, meeting: any, apiKey: string) {
  const id = meeting.id;
  const log: string[] = Array.isArray(meeting.agent_log) ? [...meeting.agent_log] : [];

  const update = async (patch: Record<string, unknown>) => {
    await admin.from("meetings").update(patch).eq("id", id);
  };
  const addLog = async (msg: string) => {
    log.push(`${new Date().toISOString().slice(11,19)}  ${msg}`);
    await update({ agent_log: log });
  };

  try {
    await update({ status: "transcribing" });
    await addLog("📥 Downloading audio…");

    const { data: file, error: dErr } = await admin.storage
      .from("meeting-uploads").download(meeting.file_path);
    if (dErr || !file) throw new Error(`Download failed: ${dErr?.message}`);

    const buf = new Uint8Array(await file.arrayBuffer());
    const sizeMb = buf.byteLength / 1024 / 1024;
    await addLog(`✅ Downloaded ${sizeMb.toFixed(1)} MB`);

    if (sizeMb > 20) {
      throw new Error("File exceeds 20MB limit for in-model transcription.");
    }

    const mime = guessMime(meeting.file_path);
    const b64 = base64Encode(buf);
    const dataUrl = `data:${mime};base64,${b64}`;

    await addLog("🎙️ Transcribing with AI…");

    const transcriptText = await aiCall(apiKey, {
      model: MODEL,
      messages: [
        { role: "system", content: "You are a transcription engine. Output ONLY the verbatim transcript with speaker labels and approximate timestamps in [MM:SS] format. No commentary." },
        { role: "user", content: [
          { type: "text", text: "Transcribe this meeting recording in full." },
          { type: "image_url", image_url: { url: dataUrl } },
        ] },
      ],
    });

    await addLog("🧠 Extracting tasks, decisions and scope…");
    await update({ status: "extracting" });

    const extracted = await aiCallStructured(apiKey, transcriptText);

    await update({
      status: "done",
      title: extracted.title || meeting.title,
      transcript: extracted.transcript_segments,
      summary: extracted.summary,
      decisions: extracted.decisions,
      action_items: extracted.action_items,
      timeline: extracted.timeline,
      scope_of_work: extracted.scope_of_work,
    });
    await addLog("✅ Done.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("process-meeting error:", msg);
    await addLog(`❌ ${msg}`);
    await update({ status: "error", error: msg });
  }
}

async function aiCall(apiKey: string, body: any): Promise<string> {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function aiCallStructured(apiKey: string, transcript: string) {
  const tools = [{
    type: "function",
    function: {
      name: "extract_meeting",
      description: "Extract structured insights from a meeting transcript.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          transcript_segments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: { type: "string" },
                speaker: { type: "string" },
                text: { type: "string" },
              },
              required: ["timestamp", "speaker", "text"],
            },
          },
          decisions: { type: "array", items: { type: "string" } },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                owner: { type: "string" },
                due: { type: "string" },
                status: { type: "string", enum: ["confirmed", "suggestion"] },
              },
              required: ["title", "owner", "due", "status"],
            },
          },
          timeline: {
            type: "array",
            items: {
              type: "object",
              properties: { date: { type: "string" }, milestone: { type: "string" } },
              required: ["date", "milestone"],
            },
          },
          scope_of_work: { type: "string" },
        },
        required: ["title","summary","transcript_segments","decisions","action_items","timeline","scope_of_work"],
      },
    },
  }];

  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You extract structured insights from meeting transcripts. Always call the extract_meeting tool." },
        { role: "user", content: `Transcript:\n\n${transcript}\n\nExtract the meeting insights.` },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "extract_meeting" } },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI extract ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI did not return structured output");
  return JSON.parse(args);
}

function guessMime(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    case "m4a": return "audio/mp4";
    case "mp4": return "video/mp4";
    case "webm": return "audio/webm";
    case "ogg": return "audio/ogg";
    default: return "audio/mpeg";
  }
}

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}
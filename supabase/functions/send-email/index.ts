const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);
  if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY not configured" }, 500);

  let body: { to?: string; subject?: string; html?: string; from?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const to = (body.to ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const html = body.html ?? "";
  if (!to || !subject || !html) return json({ error: "to, subject, html are required" }, 400);

  const from = body.from?.trim() || "Chronos Agent <onboarding@resend.dev>";

  try {
    const resp = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error("Resend error:", resp.status, data);
      return json({ error: data?.message ?? `Resend ${resp.status}` }, 502);
    }
    return json({ ok: true, id: data?.id });
  } catch (e) {
    console.error("send-email error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }

  function json(b: unknown, status = 200) {
    return new Response(JSON.stringify(b), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
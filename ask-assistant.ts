// Edge Function: ask-assistant
// Contextual AI assistant — answers questions grounded in the specific screen's data.
// Deploy: supabase functions deploy ask-assistant
// Reuses the GEMINI_API_KEY secret already set for analyze-food-photo.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Είσαι ο βοηθός μέσα στην εφαρμογή Happy Fit Physio. Απαντάς ΜΟΝΟ με βάση τα συγκεκριμένα δεδομένα που σου δίνονται παρακάτω, σε 2-4 προτάσεις, στα ελληνικά, με απλή γλώσσα. Δεν δίνεις καινούριες ιατρικές συστάσεις, δεν αλλάζεις το πρόγραμμα, δεν διαγιγνώσκεις. Αν τα δεδομένα δεν αρκούν για να απαντήσεις, πες το καθαρά και πρότεινε να ρωτήσει τον coach του. Μείνε αυστηρά μέσα στο πλαίσιο που σου δόθηκε.`;

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { context_type, context_data, question } = await req.json();
    if (!question) {
      return new Response(JSON.stringify({ error: "no question" }), { status: 400, headers: cors });
    }

    const contextText = `Τύπος οθόνης: ${context_type || "άγνωστο"}\nΔεδομένα: ${JSON.stringify(context_data || {})}\nΕρώτηση χρήστη: ${question}`;

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + contextText }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: "gemini_error", detail: errText }), { status: 502, headers: cors });
    }

    const data = await geminiRes.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(err) }), { status: 500, headers: cors });
  }
});

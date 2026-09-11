// Edge Function: analyze-food-photo
// Receives a base64 image, calls Gemini Vision, returns estimated nutrition.
// Deploy: supabase functions deploy analyze-food-photo
// Secret needed: supabase secrets set GEMINI_API_KEY=AIza...

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

const PROMPT = `Είσαι βοηθός εκτίμησης διατροφής. Δες τη φωτογραφία φαγητού και επίστρεψε ΜΟΝΟ ένα JSON object, χωρίς κανένα άλλο κείμενο, με ακριβώς αυτή τη μορφή:
{"food_name":"σύντομη περιγραφή στα ελληνικά","calories":νούμερο,"protein_g":νούμερο,"carbs_g":νούμερο,"fat_g":νούμερο,"confidence":"low|medium|high"}
Αν δεν είναι φαγητό ή δεν μπορείς να εκτιμήσεις, επίστρεψε confidence:"low" και τις καλύτερες δυνατές εκτιμήσεις σου. Οι τιμές είναι ΠΑΝΤΑ εκτιμήσεις, ποτέ ακριβείς.`;

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { image_base64, mime_type } = await req.json();
    if (!image_base64) {
      return new Response(JSON.stringify({ error: "no image" }), { status: 400, headers: cors });
    }

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mime_type || "image/jpeg", data: image_base64 } },
          ],
        }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: "gemini_error", detail: errText }), { status: 502, headers: cors });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { food_name: "—", calories: null, protein_g: null, carbs_g: null, fat_g: null, confidence: "low" }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(err) }), { status: 500, headers: cors });
  }
});

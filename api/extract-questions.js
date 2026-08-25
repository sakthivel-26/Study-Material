export const config = {
  api: {
    bodyParser: true,
  },
};

const SYSTEM_PROMPT = `
You are a strict data extraction AI. You MUST output ONLY valid JSON. DO NOT output any markdown, explanations, or conversational text.
Extract: question number, question text, A, B, C, D, source answer, page number, and any associated passage/directions.
If the question is part of a reading comprehension, puzzle, seating arrangement, or data interpretation chart, include the full passage/directions text in the 'passage' field. Otherwise, 'passage': null.
Return ONLY JSON matching this schema:
{
  "questions": [
    {
      "passage": "Directions (1-5): Study the following information carefully...",
      "question_number": 1,
      "question_text": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "source_answer": null,
      "page_number": 1
    }
  ]
}
Never invent missing information. If the answer key is not present: "source_answer": null
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    // Truncate if too long (AI token limit)
    const truncatedText = text.substring(0, 30000); 

    // Call OpenRouter, Gemini, or NVIDIA
    const openRouterKey = process.env.VITE_OPENROUTER_API_KEY;
    const geminiKey = process.env.VITE_GEMINI_API_KEY;
    const nvidiaKey = process.env.VITE_NVIDIA_API_KEY;

    let completionText = "";

    if (nvidiaKey) {
      const apiRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nvidiaKey}`,
        },
        body: JSON.stringify({
          model: "nvidia/llama-3.1-nemotron-70b-instruct", // A fast, high-quality model
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Extract questions from the following text:\n\n${truncatedText}` }
          ],
        }),
      });
      const result = await apiRes.json();
      completionText = result.choices?.[0]?.message?.content || "";
    } else if (openRouterKey) {
      const apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: process.env.VITE_OPENROUTER_MODEL || "google/gemma-2-9b-it:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Extract questions from the following text:\n\n${truncatedText}` }
          ],
        }),
      });
      const result = await apiRes.json();
      completionText = result.choices?.[0]?.message?.content || "";
    } else if (geminiKey) {
      const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: `Extract questions from the following text:\n\n${truncatedText}` }] }]
        }),
      });
      const result = await apiRes.json();
      completionText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      return res.status(500).json({ error: "No AI API Key configured. Please add VITE_NVIDIA_API_KEY, VITE_GEMINI_API_KEY, or VITE_OPENROUTER_API_KEY in Vercel Environment Variables." });
    }

    if (!completionText) {
      return res.status(500).json({ error: "AI service returned an empty response. It might have timed out." });
    }

    // Clean JSON formatting
    let cleaned = completionText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Parse the JSON
    let parsed = { questions: [] };
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse failed:", cleaned);
      return res.status(500).json({ error: "AI returned invalid JSON." });
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Extraction error:", err);
    res.status(500).json({ error: "Server failed to process the request." });
  }
}

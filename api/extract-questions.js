export const config = {
  api: {
    bodyParser: true,
  },
};

const SYSTEM_PROMPT = `
You are a strict data extraction AI for Bank and competitive exams. You MUST output ONLY valid JSON. DO NOT output any markdown, explanations, or conversational text.
STRICT EXTRACTION INTEGRITY RULES:
- Extract EXACTLY the questions that are uploaded in the text. NEVER invent, hallucinate, alter, or synthesize new questions.
- Retain exact numbers, options (A through E), and phrasing from the source text.

Extract: question number, question text, section ("English Language" | "Reasoning Ability" | "Quantitative Aptitude"), options (A, B, C, D, and E if present), source answer, page number, associated passage/directions, and step-by-step explanation.

STEP-BY-STEP SOLUTION & DIAGRAM RULES:
- For Reasoning Puzzles: provide step-by-step arrangement reasoning AND include the complete final solved markdown table (e.g. | Person | Floor / Position | Attribute | ...) in the explanation.
- For Direction Sense questions: provide detailed step-by-step directional path details (e.g. "Starts at Point A, walks 10m North to Point B, turns right 5m East to Point C...") so diagram viewers can draw the exact path.
- For Syllogism questions: clearly list the statements ("Statements: All A are B. Some B are C.") and conclusions ("Conclusions: I. Some A are C. II. No A is C.") with step-by-step Venn circle deduction.
- For Quantitative Aptitude: show step-by-step calculation steps.

CRITICAL MATHEMATICAL NOTATION RULES:
- Squares: use ² (e.g. (803.63)² or 15²)
- Cubes: use ³ (e.g. 27³ or 12³)
- Higher powers: use ⁴ ⁵ ⁶ ⁷ ⁸ ⁹
- Fractional exponents: write as ^(1/2), ^(1/3), ^(2/3), etc. (e.g. (1681)^(1/2) + (4094)^(1/3) = ?)
- NEVER drop powers or carets! (1681)^(1/2) must stay (1681)^(1/2), NEVER (1681)^.
- Fractions: preserve mixed fractions (e.g. 22 ⅓ % of 435.1) and vertical fractions (e.g. 11/7 of 1734.68). NEVER drop fractions!
- Operators: use × for multiplication, ÷ for division, √ for square root, ∛ for cube root.

Return ONLY JSON matching this schema:
{
  "questions": [
    {
      "passage": "Directions (1-5): Study the following information carefully...",
      "question_number": 1,
      "section": "Quantitative Aptitude",
      "question_text": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "source_answer": null,
      "explanation": "Detailed step-by-step solution showing calculations and intermediate steps.",
      "page_number": 1
    }
  ]
}
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

    // Priority: NVIDIA (Primary) -> Google Gemini (Secondary) -> OpenRouter (Fallback)
    const nvidiaKey = process.env.VITE_NVIDIA_API_KEY || process.env.NVIDIA_API_KEY;
    const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const openRouterKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

    let completionText = "";

    // 1. PRIMARY: NVIDIA Nemotron Models
    if (nvidiaKey) {
      try {
        const candidateModels = [
          process.env.VITE_NVIDIA_MODEL,
          "nvidia/nemotron-3-ultra-550b-a55b",
          "nvidia/nemotron-3.5-bolt-e4b",
          "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
          "nvidia/nemotron-3.5-lightning-30b-a3b",
          process.env.VITE_NVIDIA_PARSE_MODEL,
          "nvidia/nemotron-parse-2.0"
        ].filter(Boolean);

        for (const mod of candidateModels) {
          try {
            const apiRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${nvidiaKey}`,
              },
              body: JSON.stringify({
                model: mod,
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: `Extract exact questions from the following text (do not invent or alter questions):\n\n${truncatedText}` }
                ],
                temperature: 0.1,
                max_tokens: 4000
              }),
            });
            if (apiRes.ok) {
              const result = await apiRes.json();
              const textOutput = result.choices?.[0]?.message?.content || "";
              if (textOutput && textOutput.length > 50) {
                completionText = textOutput;
                break;
              }
            }
          } catch (mErr) {
            console.warn(`NVIDIA model ${mod} call failed:`, mErr.message);
          }
        }
      } catch (err) {
        console.warn("NVIDIA Primary API Error, falling back to Gemini:", err.message);
      }
    }

    // 2. SECONDARY: Google Gemini Fallback
    if (!completionText && geminiKey) {
      const candidateGemini = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
      for (const modelName of candidateGemini) {
        try {
          const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiKey
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: [{ parts: [{ text: `Extract exact questions from the following text (do not invent or alter questions):\n\n${truncatedText}` }] }]
            }),
          });
          if (apiRes.ok) {
            const result = await apiRes.json();
            const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (textOutput && textOutput.length > 50) {
              completionText = textOutput;
              break;
            }
          }
        } catch (gErr) {
          console.warn(`Gemini model ${modelName} call failed:`, gErr.message);
        }
      }
    }

    // 3. TERTIARY: OpenRouter Fallback
    if (!completionText && openRouterKey) {
      const apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: process.env.VITE_OPENROUTER_MODEL || "nvidia/nemotron-4-340b-instruct:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Extract exact questions from the following text:\n\n${truncatedText}` }
          ],
        }),
      });
      if (apiRes.ok) {
        const result = await apiRes.json();
        completionText = result.choices?.[0]?.message?.content || "";
      }
    }

    if (!completionText && !nvidiaKey && !geminiKey && !openRouterKey) {
      return res.status(500).json({ error: "No AI API Key configured. Please add VITE_NVIDIA_API_KEY or VITE_GEMINI_API_KEY in Environment Variables." });
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

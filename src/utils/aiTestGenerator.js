// ------------------------------------------------------------------
// Multi-LLM Question & Mock Test Generator Engine for KEN IAS Academy.
// Supports:
// 0. OpenRouter (google/gemma-4-31b-it:free) — FREE, top priority
// 1. Google Gemma (HuggingFace / Groq / Ollama Local / NVIDIA NIM)
// 2. Google Gemini API (gemini-1.5-flash)
// 3. OpenAI API (gpt-4o / gpt-4o-mini)
// 4. DeepSeek API (deepseek-chat / deepseek-reasoner)
// 5. Fallback Procedural Generators (Strictly Isolated Categories)
// ------------------------------------------------------------------

const getEnvKey = (key) => {
  if (typeof process !== "undefined" && process.env && process.env[key]) return process.env[key];
  try { if (import.meta && import.meta.env && import.meta.env[key]) return import.meta.env[key]; } catch (e) {}
  if (typeof localStorage !== "undefined") return localStorage.getItem(key) || "";
  return "";
};

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Strict JSON prompt generator for Indian Competitive Exams
const buildPrompt = (category, subject, topic, questionsCount) => {
  const catLower = (category || "").toLowerCase();

  if (catLower.includes("square") || catLower.includes("cube")) {
    return `You are a senior Indian Banking (SBI PO, IBPS PO, RBI Grade B) quantitative aptitude question setter.
Generate EXACTLY ${questionsCount} TOUGH Speed Math questions focused specifically on SQUARES and CUBES.
REQUIREMENTS:
- Focus on large 2-digit squares (15² to 99²) and cubes (11³ to 35³).
- Include difference of squares: e.g. "[(43² - 29²) ÷ 16] + 15² = ?", "36² + 25² - 28² = ?", "16³ ÷ 64 + 26² = ?", "14³ ÷ 56 + 18² = ?", "[(54² - 46²) ÷ 25] + 24² = ?", "∛13824 + 19² - 14² = ?".
- NO word problems. ONLY raw numerical equations.
- Every question must have EXACTLY 4 or 5 options with ONE mathematically verified correct answer.
Return ONLY raw valid JSON array of objects without markdown formatting or backticks:
[
  {
    "section": "Squares & Cubes",
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Step-by-step solution..."
  }
]`;
  }

  if (catLower.includes("root") || catLower.includes("radical")) {
    return `You are a senior Indian Banking (SBI PO, IBPS PO, RBI Grade B) quantitative aptitude question setter.
Generate EXACTLY ${questionsCount} TOUGH Speed Math questions focused specifically on SQUARE ROOTS and CUBE ROOTS.
REQUIREMENTS:
- Feature 4-digit square roots (e.g. √1521, √1764, √2704, √3136, √3969, √5184, √7056, √9216) and cube roots (∛1728, ∛2197, ∛2744, ∛3375, ∛4096, ∛4913, ∛5832, ∛6859, ∛9261, ∛13824, ∛24389).
- Combine roots with arithmetic: e.g. "√5184 + √2704 - √1764 = ?", "(√3136 × ∛2744) ÷ 28 + 15² = ?", "(√5184 ÷ 12) + ∛5832 × 4 - 35 = ?", "√7056 ÷ 7 + ∛9261 × 5 = ?".
- NO word problems. ONLY raw numerical equations with verified options.
Return ONLY raw valid JSON array of objects without markdown formatting or backticks:
[
  {
    "section": "Roots & Radicals",
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Step-by-step solution..."
  }
]`;
  }

  if (catLower.includes("fraction") || catLower.includes("numerator") || catLower.includes("denominator")) {
    return `You are a senior Indian Banking (SBI PO, IBPS PO, RBI Grade B) quantitative aptitude question setter.
Generate EXACTLY ${questionsCount} TOUGH Speed Math questions focused specifically on NUMERATOR / DENOMINATOR & FRACTION SIMPLIFICATION.
REQUIREMENTS:
- Problems MUST feature fractions, cross-multiplications, numerator/denominator algebraic simplifications, and mixed fractions.
- Examples: "(3/7) × 441 + (5/9) × 729 - (4/5) × 325 = ?", "[(38² - 22²) ÷ 32] + (480 ÷ 16) = ?", "(√3136 × 15) ÷ 14 + (√5184 × 25) ÷ 18 = ?", "[(28 × 45 + 35 × 24) ÷ 42] + 18² = ?", "[(37.5% of 640) + (62.5% of 480)] ÷ 18 + 16² = ?", "(3¾ + 2½) × (16/25) + 14 = ?".
- NO word problems. Raw numerical fraction equations where correct answer simplifies cleanly.
Return ONLY raw valid JSON array of objects without markdown formatting or backticks:
[
  {
    "section": "Numerator & Denominator",
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Step-by-step solution..."
  }
]`;
  }

  if (catLower.includes("simplification") || (catLower.includes("speed math") && !catLower.includes("approximation"))) {
    return `You are a senior Indian Banking (SBI PO, IBPS PO, RBI Grade B) quantitative aptitude question setter.
Generate EXACTLY ${questionsCount} TOUGH Speed Math Simplification questions.
REQUIREMENTS:
- High difficulty questions combining large Squares (15² to 99²), Cubes (11³ to 25³), 4-digit Roots (√1024 to √9216, ∛1728 to ∛13824), Numerator / Denominator Fractions (e.g. (3/7) × 441, [(38²-22²)/32]), Tricky percentages (37.5%, 62.5%, 16⅔%), and complex BODMAS.
- NO elementary addition/subtraction. ONLY high-difficulty competitive exam questions.
Return ONLY raw valid JSON array of objects without markdown formatting or backticks:
[
  {
    "section": "Simplification",
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Step-by-step solution..."
  }
]`;
  }

  if (catLower.includes("approximation")) {
    return `You are a senior Indian Banking exam question setter. Generate EXACTLY ${questionsCount} TOUGH Speed Math Approximation questions.
Questions MUST involve decimal powers, decimal roots, and decimal fractions where the user must approximate to the nearest integer.
e.g. "√(1520.89) + √(2703.95) - √(1763.92) ≈ ?", "[(37.99)² - (21.98)²] ÷ 31.98 + (479.95 ÷ 16.02) ≈ ?", "[(37.52% of 639.95) + (62.48% of 480.05)] ÷ 17.98 + (15.99)² ≈ ?".
Return ONLY raw valid JSON array of objects without markdown formatting or backticks:
[
  {
    "section": "Approximation",
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Step-by-step solution..."
  }
]`;
  }

  return `You are a senior Indian Competitive Exam Paper Setter. Generate an authentic past 5-year PYQ style mock test for '${category}'.
${subject ? `\nREQUIRED SUBJECT: ${subject}` : ""}
${topic ? `\nREQUIRED TOPIC: ${topic}` : ""}

STRICT CATEGORY CONSTRAINTS:
- If Category is 'Banking' or 'SBI PO / Clerk' or 'IBPS PO': Generate ONLY Quantitative Aptitude (Speed/DI/Work/Interest), Logical Reasoning (Puzzles/Coding/Directions), English Language, and Banking Awareness. DO NOT include state GK or general history.
- If Category is 'TNPSC', generate ONLY TNPSC questions.
- If Category is 'TNPSC', generate ONLY Tamil Nadu History, TN Freedom Struggle, TN Administration, and TNPSC Aptitude.
- If Category is 'SSC', generate ONLY SSC Algebra, Reasoning analogies, and Science/General Awareness.

${subject || topic ? `CRITICAL INSTRUCTION: You MUST generate questions ONLY for the REQUIRED SUBJECT and REQUIRED TOPIC provided above. Do NOT generate mixed subjects or topics. For example, if Topic is 'Simplification', generate ONLY simplification questions.` : ""}

Generate EXACTLY ${questionsCount} questions.
Return ONLY raw valid JSON array of objects without markdown formatting or backticks:
[
  {
    "section": "Quantitative Aptitude / Logical Reasoning / English / General Awareness",
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Step-by-step solution..."
  }
]`;
};

// 1. Google Gemma-7B Provider (Supports Hugging Face, Groq, NVIDIA NIM, and Local Ollama)
async function callGemma7B(apiKey, prompt, customEndpoint) {
  const endpoint = customEndpoint || "https://api-inference.huggingface.co/models/google/gemma-7b-it";
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  let body = {};
  if (endpoint.includes("huggingface")) {
    body = { inputs: prompt, parameters: { temperature: 0.3, max_new_tokens: 1500 } };
  } else {
    body = {
      model: "google/gemma-7b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Gemma-7B API Error (${response.status}): ${response.statusText}`);
  const data = await response.json();

  let text = "";
  if (Array.isArray(data) && data[0]?.generated_text) {
    text = data[0].generated_text;
  } else if (data.choices?.[0]?.message?.content) {
    text = data.choices[0].message.content;
  } else {
    text = JSON.stringify(data);
  }

  // Extract raw JSON array from generated response
  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return JSON.parse(text.substring(jsonStart, jsonEnd + 1));
  }
  return JSON.parse(text);
}

// 2. Google Gemini API Provider
async function callGemini(apiKey, prompt) {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("Invalid API key provided for Google Gemini.");
  }

  const cleanKey = apiKey.trim();

  const candidateModels = [
    { name: "gemini-3.5-flash-lite", isThinking: false },
    { name: "gemini-flash-lite-latest", isThinking: false },
    { name: "gemini-3.6-flash", isThinking: true },
    { name: "gemini-3.7-flash", isThinking: true },
    { name: "gemini-3.8-flash", isThinking: true },
    { name: "gemini-3.5-flash", isThinking: true },
  ];

  let lastErr = null;

  for (const m of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m.name}:generateContent?key=${cleanKey}`;
    try {
      const genConfig = {
        responseMimeType: "application/json",
        temperature: 0.1,
      };
      if (m.isThinking) {
        genConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: genConfig,
        }),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Gemini ${m.name} error (${response.status}): ${errText || response.statusText}`);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonStart = cleaned.indexOf("[");
      const jsonEnd = cleaned.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
      }
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : parsed.questions || parsed.mockTest || [];
    } catch (err) {
      console.warn(`Gemini model ${m.name} failed, trying next...`, err.message);
      lastErr = err;
    }
  }
  throw lastErr || new Error("All Gemini model endpoints failed. Please check your Google Gemini API key at https://aistudio.google.com/app/apikey");
}

// 2b. Google Gemini Vision — reads charts, tables, bar graphs from a page image
// NVIDIA Nemotron models are assigned by capability:
// - Parsing & Vision: nvidia/nemotron-parse-2.0, nvidia/nemotron-3.5-super-vl-120b-a12b
// - Reasoning & Extraction: nvidia/nemotron-3-ultra-550b-a55b, nvidia/nemotron-3.5-bolt-e4b
// - Embeddings: nvidia/nemotron-3.5-embed-1b (for semantic search & retrieval)
const NVIDIA_REASONING_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const NVIDIA_PARSE_MODEL = "nvidia/nemotron-parse-2.0";
const NVIDIA_VISION_MODEL = "nvidia/nemotron-parse-2.0";
const NVIDIA_EMBED_MODEL = "nvidia/nemotron-3.5-embed-1b";

const VISION_EXTRACTION_PROMPT = `You are an expert at reading Indian competitive exam question papers (IBPS, SBI, SSC, TNPSC etc.).
Look at this PDF page image carefully.
Extract ONLY data from charts, tables, diagrams, and directions on this page. Do NOT extract individual questions or options (they are already extracted by the text parser). Format tables as Markdown.`;

export async function callGeminiVisionPage(apiKey, base64Image, mimeType = "image/jpeg") {
  if (!apiKey || typeof apiKey !== "string") return null;
  const cleanKey = apiKey.trim();
  const candidateModels = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash"];

  const prompt = `You are an expert at reading Indian competitive exam question papers (IBPS, SBI, SSC, TNPSC etc.).
Look at this PDF page image carefully.

Your task: Extract ALL data from any charts, tables, graphs, or diagrams on this page.
Return a structured text description of each chart/table/graph found, followed by the extracted numerical data.

For PIE CHARTS: List each segment label and its percentage value.
For BAR CHARTS: List each bar's category and its value/height.
For LINE CHARTS: List each point's x and y values.
For TABLES: STRICTLY output the table as a clean Markdown table format (| Col 1 | Col 2 | Col 3 |\n|---|---|---|) so it can be directly displayed and edited.
For DATA INTERPRETATION sets: Include the full directions text AND format any data tables as Markdown tables.

DO NOT extract individual numbered questions or options (they are already extracted by the PDF text parser).

Output format:
=== CHART/TABLE DATA ===
[Describe each chart/table with its full directions and Markdown table data here]

If no charts/tables/graphs are present, return an empty string.`;

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout max
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            thinkingConfig: { thinkingBudget: 0 }
          },
        }),
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        console.warn(`[AI Vision] Model ${model} returned status ${response.status}`);
        continue;
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text.trim()) return text.trim();
    } catch (err) {
      console.warn(`[AI Vision] Model ${model} failed: ${err.message}`);
    }
  }
  return null;
}

// NVIDIA Nemotron Parse / Vision (Primary model for charts, tables, and document layout)
async function callNvidiaVisionPage(apiKey, base64Image, mimeType = "image/jpeg") {
  if (!apiKey || !base64Image) return null;
  // If base64Image is larger than 3.5MB, bypass Vercel proxy to avoid 500/400 payload limits
  if (base64Image.length > 3500000) {
    console.warn("[AI Vision] Page image too large for NVIDIA proxy (>3.5MB), falling back to Gemini Vision.");
    return null;
  }
  const candidateModels = [
    getEnvKey("VITE_NVIDIA_PARSE_MODEL"),
    getEnvKey("VITE_NVIDIA_VISION_MODEL"),
    NVIDIA_PARSE_MODEL,
    "nvidia/nemotron-parse-2.0"
  ].filter(Boolean);

  for (const model of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch("/api/nvidia/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: [
            { type: "text", text: VISION_EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ] }],
          temperature: 0.1,
          max_tokens: 3000,
        }),
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const content = (data.choices?.[0]?.message?.content || "").trim();
        if (content && content.length > 30) return content;
      } else {
        const status = response.status;
        console.warn(`[AI Vision] NVIDIA model ${model} responded with status ${status}`);
        if (status === 500 || status === 400 || status === 413) {
          // Payload or proxy issue: return null so Gemini Vision seamlessly takes over
          return null;
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[AI Vision] NVIDIA model ${model} skipped:`, err.message);
    }
  }
  return null;
}

// The embedding model supports semantic retrieval; it is intentionally separate
// from the chat models and uses the NVIDIA embeddings endpoint.
export async function embedNvidiaPassages(apiKey, input, inputType = "passage") {
  if (!apiKey || !input) return [];
  const values = Array.isArray(input) ? input : [input];
  const response = await fetch("/api/nvidia/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: getEnvKey("VITE_NVIDIA_EMBED_MODEL") || NVIDIA_EMBED_MODEL,
      input: values,
      input_type: inputType,
      modality: "text",
      encoding_format: "float",
      truncate: "END",
    }),
  });
  if (!response.ok) throw new Error(`NVIDIA Embed API error (${response.status})`);
  const data = await response.json();
  return (data.data || []).sort((a, b) => a.index - b.index).map(item => item.embedding);
}

// 3. OpenAI API Provider
async function callOpenAI(apiKey, prompt, model = "gpt-4o-mini") {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });
  if (!response.ok) throw new Error("OpenAI API error: " + response.statusText);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : parsed.questions || parsed.mockTest || [];
}

// 4. DeepSeek API Provider
async function callDeepSeek(apiKey, prompt) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });
  if (!response.ok) throw new Error("DeepSeek API error: " + response.statusText);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : parsed.questions || [];
}

// 6. NVIDIA API Provider
async function callNvidia(apiKey, prompt) {
  const candidateModels = [
    getEnvKey("VITE_NVIDIA_MODEL"),
    "nvidia/nemotron-3-ultra-550b-a55b",
    "nvidia/nemotron-3.5-bolt-e4b",
    NVIDIA_REASONING_MODEL
  ].filter(Boolean);

  let lastError = null;
  for (const model of candidateModels) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 60000); // 60-second timeout

    try {
      const response = await fetch("/api/nvidia/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 3500,
        }),
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        console.warn(`[AI] NVIDIA model ${model} unavailable (${response.status}), trying next candidate...`);
        lastError = new Error(`NVIDIA API error (${response.status}): ${errBody || response.statusText}`);
        if (response.status === 401) break; // Bad key
        continue;
      }
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || "{}";

      // Clean markdown fences if present
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonStart = cleaned.indexOf("[");
      const jsonEnd = cleaned.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
      }
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : parsed.questions || parsed.mockTest || [];
    } catch (err) {
      clearTimeout(id);
      lastError = err;
      console.warn(`[AI] NVIDIA model ${model} attempt failed:`, err.message);
      if (err.message.includes("401") || err.message.includes("API Key")) throw err;
    }
  }
  throw lastError || new Error("All NVIDIA models failed.");
}

// 5. OpenRouter API Provider (openrouter/free)
async function callOpenRouter(apiKey, prompt, model = "openrouter/free") {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 20000); // 20-second timeout

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "KEN IAS Academy Mock Test Generator",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`OpenRouter API error (${response.status}): ${errBody || response.statusText}`);
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    // Clean markdown fences if present
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonStart = cleaned.indexOf("[");
    const jsonEnd = cleaned.lastIndexOf("]");
    try {
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
      }
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : parsed.questions || parsed.mockTest || [];
    } catch (parseErr) {
      throw new Error(`Invalid JSON response: ${cleaned.substring(0, 50)}...`);
    }
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}


// ------------------------------------------------------------------
// Fallback Category Generators (When no API key is set)
// ------------------------------------------------------------------
function genBankingQuant(id) {
  const speedKmh = pickRandom([54, 72, 90, 108]);
  const speedMs = (speedKmh * 5) / 18;
  const time = pickRandom([20, 25, 30, 35]);
  const totalDist = speedMs * time;
  const platformLen = pickRandom([150, 200, 250, 300]);
  const trainLen = totalDist - platformLen;
  const correct = `${trainLen} m`;
  const opts = shuffle([correct, `${trainLen + 50} m`, `${trainLen - 50} m`, `${trainLen + 100} m`, `${trainLen - 30} m`]);
  return {
    id: `bank_q_${id}`,
    section: "Quantitative Aptitude",
    question: `A train running at ${speedKmh} km/h crosses a platform of length ${platformLen} m in ${time} seconds. What is the length of the train?`,
    options: opts,
    correctAnswerIndex: opts.indexOf(correct),
    explanation: `Speed = ${speedKmh} km/h = ${speedMs} m/s. Total distance = ${speedMs} × ${time} = ${totalDist} m. Train length = ${totalDist} - ${platformLen} = ${trainLen} m.`,
  };
}

function genBankingReasoning(id) {
  const north = pickRandom([6, 8, 10, 12]);
  const east = pickRandom([5, 8, 10, 12]);
  const dist = +Math.sqrt(north * north + east * east).toFixed(2);
  const correct = `${dist} m`;
  const opts = shuffle([correct, `${+(dist + 3.5).toFixed(2)} m`, `${+(dist - 2.8).toFixed(2)} m`, `${north + east} m`, `${Math.abs(north - east)} m`]);
  return {
    id: `bank_r_${id}`,
    section: "Logical Reasoning",
    question: `Point A is ${east} m West of Point B. Point C is ${north} m North of Point B. What is the shortest direct distance between Point A and Point C?`,
    options: opts,
    correctAnswerIndex: opts.indexOf(correct),
    explanation: `Shortest Distance = √(${east}² + ${north}²) = ${dist} m.`,
  };
}

const BANKING_STATIC_POOL = [
  {
    section: "English Language",
    question: "Identify the grammatically correct sentence from the options below:",
    options: [
      "Neither the principal nor the teachers was present at the meeting.",
      "Neither the principal nor the teachers were present at the meeting.",
      "Neither the principal or the teachers were present at the meeting.",
      "Neither the principal nor the teachers are present in the meeting yesterday.",
      "Neither principal nor teachers was present.",
    ],
    correctAnswerIndex: 1,
    explanation: "When subjects are joined by 'neither... nor', the verb agrees with the closer subject ('teachers' → plural 'were').",
  },
  {
    section: "Banking Awareness",
    question: "Which institution regulates the Capital Markets and Stock Exchanges in India?",
    options: ["Reserve Bank of India (RBI)", "NABARD", "Securities and Exchange Board of India (SEBI)", "IRDAI", "PFRDA"],
    correctAnswerIndex: 2,
    explanation: "SEBI regulates capital markets and stock exchanges in India.",
  },
];

const UPSC_POOL = [
  {
    section: "Indian Economy",
    question: "With reference to the Indian economy, consider the following statements regarding 'Repo Rate':\n1. It is the rate at which RBI lends money to commercial banks against government securities.\n2. An increase in Repo Rate helps in curbing inflation.\nWhich of the statements given above is/are correct?",
    options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
    correctAnswerIndex: 2,
    explanation: "Both statements are correct. Repo rate increases borrowing costs, restraining money supply and inflation.",
  },
  {
    section: "Polity & Constitution",
    question: "The 'Preamble' to the Constitution of India is:",
    options: [
      "A part of the Constitution but has no legal effect independently of other parts.",
      "Not a part of the Constitution and has no legal effect at all.",
      "A part of the Constitution and has the same legal effect as any other part.",
      "Not a part of the Constitution but can be amended separately.",
    ],
    correctAnswerIndex: 0,
    explanation: "As upheld in Kesavananda Bharati (1973), Preamble is an integral part of the Constitution but non-justiciable independently.",
  },
];

const TNPSC_POOL = [
  {
    section: "Tamil Nadu Freedom Struggle",
    question: "Who among the following freedom fighters from Tamil Nadu earned the title 'Kodi Kaatha Kumaran'?",
    options: ["V.O. Chidambaram Pillai", "Tiruppur Kumaran", "Subramania Bharati", "Vanchinathan"],
    correctAnswerIndex: 1,
    explanation: "Tiruppur Kumaran protected the Indian national flag during a 1932 protest rally, earning the title 'Kodi Kaatha Kumaran'.",
  },
];

const SSC_POOL = [
  {
    section: "Quantitative Aptitude",
    question: "If x + 1/x = 5, find the value of x² + 1/x².",
    options: ["23", "25", "27", "21"],
    correctAnswerIndex: 0,
    explanation: "Squaring both sides: (x + 1/x)² = 5² → x² + 1/x² + 2 = 25 → x² + 1/x² = 23.",
  },
];

// ------------------------------------------------------------------
// Main Entrypoint supporting Gemma-7B, Gemini, OpenAI, DeepSeek & Fallbacks
// ------------------------------------------------------------------
// Precomputed verified Root & Cube Pools
const EASY_SQUARES = [
  { val: 100, r: 10 }, { val: 121, r: 11 }, { val: 144, r: 12 }, { val: 169, r: 13 },
  { val: 196, r: 14 }, { val: 225, r: 15 }, { val: 256, r: 16 }, { val: 289, r: 17 },
  { val: 324, r: 18 }, { val: 361, r: 19 }, { val: 400, r: 20 }, { val: 441, r: 21 },
  { val: 484, r: 22 }, { val: 529, r: 23 }, { val: 576, r: 24 }, { val: 625, r: 25 },
  { val: 676, r: 26 }, { val: 729, r: 27 }, { val: 784, r: 28 }, { val: 841, r: 29 },
  { val: 900, r: 30 }
];

const MEDIUM_SQUARES = [
  { val: 961, r: 31 }, { val: 1024, r: 32 }, { val: 1089, r: 33 }, { val: 1156, r: 34 },
  { val: 1225, r: 35 }, { val: 1296, r: 36 }, { val: 1369, r: 37 }, { val: 1444, r: 38 },
  { val: 1521, r: 39 }, { val: 1600, r: 40 }, { val: 1681, r: 41 }, { val: 1764, r: 42 },
  { val: 1849, r: 43 }, { val: 1936, r: 44 }, { val: 2025, r: 45 }, { val: 2116, r: 46 },
  { val: 2209, r: 47 }, { val: 2304, r: 48 }, { val: 2401, r: 49 }, { val: 2500, r: 50 },
  { val: 2704, r: 52 }, { val: 2916, r: 54 }, { val: 3136, r: 56 }, { val: 3364, r: 58 },
  { val: 3600, r: 60 }
];

const HARD_SQUARES = [
  { val: 3844, r: 62 }, { val: 3969, r: 63 }, { val: 4096, r: 64 }, { val: 4225, r: 65 },
  { val: 4624, r: 68 }, { val: 4900, r: 70 }, { val: 5184, r: 72 }, { val: 5625, r: 75 },
  { val: 6084, r: 78 }, { val: 6400, r: 80 }, { val: 6724, r: 82 }, { val: 7056, r: 84 },
  { val: 7225, r: 85 }, { val: 7744, r: 88 }, { val: 8100, r: 90 }, { val: 8464, r: 92 },
  { val: 9025, r: 95 }, { val: 9216, r: 96 }, { val: 9604, r: 98 }, { val: 9801, r: 99 }
];

const EASY_CUBES = [
  { val: 8, r: 2 }, { val: 27, r: 3 }, { val: 64, r: 4 }, { val: 125, r: 5 },
  { val: 216, r: 6 }, { val: 343, r: 7 }, { val: 512, r: 8 }, { val: 729, r: 9 }, { val: 1000, r: 10 }
];

const MEDIUM_CUBES = [
  { val: 1331, r: 11 }, { val: 1728, r: 12 }, { val: 2197, r: 13 }, { val: 2744, r: 14 },
  { val: 3375, r: 15 }, { val: 4096, r: 16 }, { val: 4913, r: 17 }, { val: 5832, r: 18 }
];

const HARD_CUBES = [
  { val: 6859, r: 19 }, { val: 8000, r: 20 }, { val: 9261, r: 21 }, { val: 10648, r: 22 },
  { val: 12167, r: 23 }, { val: 13824, r: 24 }, { val: 15625, r: 25 }, { val: 17576, r: 26 },
  { val: 19683, r: 27 }, { val: 21952, r: 28 }, { val: 24389, r: 29 }, { val: 27000, r: 30 }
];

function makeQuestionObject(idPrefix, idx, sectionName, qText, ansVal, explanationText) {
  const distractors = new Set([ansVal]);
  let loopCount = 0;
  while (distractors.size < 4 && loopCount < 50) {
    loopCount++;
    const offset = pickRandom([-30, -25, -20, -15, -12, -10, -8, -5, -4, -2, -1, 1, 2, 4, 5, 8, 10, 12, 15, 20, 25, 30]);
    const fake = ansVal + offset;
    if (fake > 0) distractors.add(fake);
  }
  let fallbackStep = 1;
  while (distractors.size < 4) {
    distractors.add(ansVal + fallbackStep);
    fallbackStep++;
  }
  const optionsArr = shuffle(Array.from(distractors)).map(String);
  const correctIdx = optionsArr.indexOf(String(ansVal));
  return {
    id: `${idPrefix}_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    section: sectionName,
    question: qText,
    options: optionsArr,
    correctAnswerIndex: correctIdx >= 0 ? correctIdx : 0,
    explanation: explanationText
  };
}

// 1. Dynamic Squares & Cubes Generator (Zero repetition, Easy/Medium/Hard)
function genSpeedMathSquaresCubes(idx, level = "medium", seenEquations = new Set()) {
  let qText = "", ansVal = 0, exp = "";
  let attempts = 0;

  do {
    attempts++;
    const type = (idx + attempts) % 5;

    if (level === "easy") {
      if (type === 0) {
        const a = randInt(11, 28);
        const c = randInt(10, 70);
        const isAdd = Math.random() > 0.4;
        ansVal = isAdd ? (a * a + c) : (a * a - c);
        qText = `${a}² ${isAdd ? "+" : "-"} ${c} = ?`;
        exp = `${a}² = ${a * a}. ${a * a} ${isAdd ? "+" : "-"} ${c} = ${ansVal}.`;
      } else if (type === 1) {
        const a = randInt(12, 22);
        const b = randInt(5, 11);
        ansVal = (a * a) - (b * b);
        qText = `${a}² - ${b}² = ?`;
        exp = `${a}² = ${a * a}, ${b}² = ${b * b}. ${a * a} - ${b * b} = ${ansVal}.`;
      } else if (type === 2) {
        const a = randInt(3, 9);
        const b = randInt(5, 15);
        ansVal = (a * a * a) + (b * b);
        qText = `${a}³ + ${b}² = ?`;
        exp = `${a}³ = ${a * a * a}, ${b}² = ${b * b}. ${a * a * a} + ${b * b} = ${ansVal}.`;
      } else if (type === 3) {
        const a = randInt(5, 10);
        const b = randInt(2, 4);
        ansVal = (a * a * a) - (b * b * b);
        qText = `${a}³ - ${b}³ = ?`;
        exp = `${a}³ = ${a * a * a}, ${b}³ = ${b * b * b}. ${a * a * a} - ${b * b * b} = ${ansVal}.`;
      } else {
        const a = pickRandom([12, 14, 16, 18, 20, 22, 24]);
        const d = pickRandom([2, 4, 8]);
        const c = randInt(15, 60);
        ansVal = ((a * a) / d) + c;
        qText = `(${a}² ÷ ${d}) + ${c} = ?`;
        exp = `${a}² = ${a * a}. ${a * a} ÷ ${d} = ${(a * a) / d}. ${(a * a) / d} + ${c} = ${ansVal}.`;
      }
    } else if (level === "medium") {
      if (type === 0) {
        const a = randInt(22, 50);
        const b = randInt(12, a - 2);
        const diff = (a * a) - (b * b);
        const divs = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20].filter(d => diff % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : 2;
        const c = randInt(12, 40);
        ansVal = (diff / d) + c;
        qText = `[(${a}² - ${b}²) ÷ ${d}] + ${c} = ?`;
        exp = `${a}² - ${b}² = ${diff}. ${diff} ÷ ${d} = ${diff / d}. ${diff / d} + ${c} = ${ansVal}.`;
      } else if (type === 1) {
        const a = randInt(20, 45);
        const b = randInt(15, 35);
        const c = randInt(10, 25);
        ansVal = (a * a) + (b * b) - (c * c);
        qText = `${a}² + ${b}² - ${c}² = ?`;
        exp = `${a}² = ${a * a}, ${b}² = ${b * b}, ${c}² = ${c * c}. Total = ${ansVal}.`;
      } else if (type === 2) {
        const cb = pickRandom(MEDIUM_CUBES);
        const divs = [2, 3, 4, 6, 8, 9, 12, 16, 18, 24, 36, 48].filter(d => cb.val % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : 4;
        const b = randInt(12, 25);
        ansVal = (cb.val / d) + (b * b);
        qText = `${cb.r}³ ÷ ${d} + ${b}² = ?`;
        exp = `${cb.r}³ = ${cb.val}. ${cb.val} ÷ ${d} = ${cb.val / d}. ${b}² = ${b * b}. Total = ${ansVal}.`;
      } else if (type === 3) {
        const a = randInt(8, 14);
        const b = randInt(4, 8);
        const c = randInt(12, 25);
        ansVal = (a * a * a) - (b * b * b) + (c * c);
        qText = `${a}³ - ${b}³ + ${c}² = ?`;
        exp = `${a}³ = ${a * a * a}, ${b}³ = ${b * b * b}, ${c}² = ${c * c}. Result = ${ansVal}.`;
      } else {
        const cb = pickRandom(MEDIUM_CUBES);
        const a = randInt(15, 32);
        const b = randInt(15, 60);
        ansVal = cb.r + (a * a) - b;
        qText = `∛${cb.val} + ${a}² - ${b} = ?`;
        exp = `∛${cb.val} = ${cb.r}. ${a}² = ${a * a}. ${cb.r} + ${a * a} - ${b} = ${ansVal}.`;
      }
    } else {
      // HARD LEVEL
      if (type === 0) {
        const a = randInt(42, 92);
        const b = randInt(22, a - 4);
        const diff = (a * a) - (b * b);
        const divs = [4, 5, 6, 8, 10, 12, 16, 20, 24, 25, 28, 32, 40, 48, 50, 60, 65, 70, 80].filter(d => diff % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : 4;
        const c = randInt(15, 35);
        ansVal = (diff / d) + (c * c);
        qText = `[(${a}² - ${b}²) ÷ ${d}] + ${c}² = ?`;
        exp = `${a}² - ${b}² = (${a} - ${b})(${a} + ${b}) = ${a - b} × ${a + b} = ${diff}. ${diff} ÷ ${d} = ${diff / d}. ${c}² = ${c * c}. ${diff / d} + ${c * c} = ${ansVal}.`;
      } else if (type === 1) {
        const a = randInt(35, 85);
        const b = randInt(25, 65);
        const c = randInt(18, Math.min(a, b));
        ansVal = (a * a) + (b * b) - (c * c);
        qText = `${a}² + ${b}² - ${c}² = ?`;
        exp = `${a}² = ${a * a}, ${b}² = ${b * b}, ${c}² = ${c * c}. ${a * a} + ${b * b} - ${c * c} = ${ansVal}.`;
      } else if (type === 2) {
        const cb = pickRandom(HARD_CUBES);
        const divs = [36, 45, 56, 63, 64, 72, 96, 125, 144].filter(d => cb.val % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : (cb.r * 2);
        const b = randInt(20, 45);
        ansVal = Math.round(cb.val / d) + (b * b);
        qText = `${cb.r}³ ÷ ${d} + ${b}² = ?`;
        exp = `${cb.r}³ = ${cb.val}. ${cb.val} ÷ ${d} = ${Math.round(cb.val / d)}. ${b}² = ${b * b}. Total = ${ansVal}.`;
      } else if (type === 3) {
        const a = randInt(13, 22);
        const b = randInt(9, 15);
        const c = randInt(18, 38);
        ansVal = (a * a * a) - (b * b * b) + (c * c);
        qText = `${a}³ - ${b}³ + ${c}² = ?`;
        exp = `${a}³ = ${a * a * a}, ${b}³ = ${b * b * b}, ${c}² = ${c * c}. Result = ${ansVal}.`;
      } else {
        const cb = pickRandom(HARD_CUBES);
        const a = randInt(25, 65);
        const b = randInt(15, a - 2);
        ansVal = cb.r + (a * a) - (b * b);
        qText = `∛${cb.val} + ${a}² - ${b}² = ?`;
        exp = `∛${cb.val} = ${cb.r}. ${a}² = ${a * a}, ${b}² = ${b * b}. ${cb.r} + ${a * a} - ${b * b} = ${ansVal}.`;
      }
    }
  } while (seenEquations.has(qText) && attempts < 30);

  seenEquations.add(qText);
  return makeQuestionObject("sqcb", idx, "Squares & Cubes", qText, ansVal, exp);
}

// 2. Dynamic Roots & Radicals Generator (Zero repetition, Easy/Medium/Hard)
function genSpeedMathRoots(idx, level = "medium", seenEquations = new Set()) {
  let qText = "", ansVal = 0, exp = "";
  let attempts = 0;

  const sqPool = level === "easy" ? EASY_SQUARES : level === "medium" ? MEDIUM_SQUARES : HARD_SQUARES;
  const cbPool = level === "easy" ? EASY_CUBES : level === "medium" ? MEDIUM_CUBES : HARD_CUBES;

  do {
    attempts++;
    const type = (idx + attempts) % 3;

    if (level === "easy") {
      if (type === 0) {
        const s1 = pickRandom(sqPool);
        let s2 = pickRandom(sqPool);
        while (s2.val === s1.val) s2 = pickRandom(sqPool);
        const isAdd = Math.random() > 0.3;
        ansVal = isAdd ? (s1.r + s2.r) : Math.abs(s1.r - s2.r);
        const [big, small] = s1.r >= s2.r ? [s1, s2] : [s2, s1];
        qText = isAdd ? `√${s1.val} + √${s2.val} = ?` : `√${big.val} - √${small.val} = ?`;
        exp = isAdd ? `√${s1.val} = ${s1.r}, √${s2.val} = ${s2.r}. ${s1.r} + ${s2.r} = ${ansVal}.` : `√${big.val} = ${big.r}, √${small.val} = ${small.r}. ${big.r} - ${small.r} = ${ansVal}.`;
      } else if (type === 1) {
        const s1 = pickRandom(sqPool);
        const mult = randInt(3, 8);
        const add = randInt(10, 50);
        ansVal = (s1.r * mult) + add;
        qText = `√${s1.val} × ${mult} + ${add} = ?`;
        exp = `√${s1.val} = ${s1.r}. ${s1.r} × ${mult} = ${s1.r * mult}. ${s1.r * mult} + ${add} = ${ansVal}.`;
      } else {
        const c1 = pickRandom(cbPool);
        const s1 = pickRandom(sqPool);
        ansVal = c1.r + s1.r;
        qText = `∛${c1.val} + √${s1.val} = ?`;
        exp = `∛${c1.val} = ${c1.r}, √${s1.val} = ${s1.r}. ${c1.r} + ${s1.r} = ${ansVal}.`;
      }
    } else if (level === "medium") {
      if (type === 0) {
        const s1 = pickRandom(sqPool);
        const s2 = pickRandom(sqPool);
        const s3 = pickRandom(EASY_SQUARES);
        ansVal = s1.r + s2.r - s3.r;
        qText = `√${s1.val} + √${s2.val} - √${s3.val} = ?`;
        exp = `√${s1.val} = ${s1.r}, √${s2.val} = ${s2.r}, √${s3.val} = ${s3.r}. ${s1.r} + ${s2.r} - ${s3.r} = ${ansVal}.`;
      } else if (type === 1) {
        const c1 = pickRandom(cbPool);
        const s1 = pickRandom(sqPool);
        const mult = randInt(3, 7);
        const sub = randInt(15, 60);
        ansVal = (c1.r * mult) + s1.r - sub;
        qText = `∛${c1.val} × ${mult} + √${s1.val} - ${sub} = ?`;
        exp = `∛${c1.val} = ${c1.r}, ${c1.r} × ${mult} = ${c1.r * mult}. √${s1.val} = ${s1.r}. Result = ${ansVal}.`;
      } else {
        const s1 = pickRandom(sqPool);
        const divs = [2, 3, 4, 6, 8].filter(d => s1.r % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : 2;
        const c1 = pickRandom(cbPool);
        ansVal = (s1.r / d) + c1.r;
        qText = `(√${s1.val} ÷ ${d}) + ∛${c1.val} = ?`;
        exp = `√${s1.val} = ${s1.r}, ${s1.r} ÷ ${d} = ${s1.r / d}. ∛${c1.val} = ${c1.r}. Total = ${ansVal}.`;
      }
    } else {
      // HARD LEVEL
      if (type === 0) {
        const s1 = pickRandom(HARD_SQUARES);
        const s2 = pickRandom(MEDIUM_SQUARES);
        const s3 = pickRandom(sqPool);
        ansVal = s1.r + s2.r - s3.r;
        qText = `√${s1.val} + √${s2.val} - √${s3.val} = ?`;
        exp = `√${s1.val} = ${s1.r}, √${s2.val} = ${s2.r}, √${s3.val} = ${s3.r}. ${s1.r} + ${s2.r} - ${s3.r} = ${ansVal}.`;
      } else if (type === 1) {
        const s1 = pickRandom(HARD_SQUARES);
        const c1 = pickRandom(HARD_CUBES);
        const divs = [4, 6, 7, 8, 9, 12, 14, 16, 21, 24, 28].filter(d => (s1.r * c1.r) % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : 12;
        const sq = randInt(15, 32);
        ansVal = ((s1.r * c1.r) / d) + (sq * sq);
        qText = `[(√${s1.val} × ∛${c1.val}) ÷ ${d}] + ${sq}² = ?`;
        exp = `√${s1.val} = ${s1.r}, ∛${c1.val} = ${c1.r}. (${s1.r} × ${c1.r}) ÷ ${d} = ${(s1.r * c1.r) / d}. ${sq}² = ${sq * sq}. Total = ${ansVal}.`;
      } else {
        const s1 = pickRandom(HARD_SQUARES);
        const divs = [4, 6, 7, 8, 9, 12, 14].filter(d => s1.r % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : 6;
        const c1 = pickRandom(HARD_CUBES);
        const mult = randInt(4, 9);
        const s2 = pickRandom(MEDIUM_SQUARES);
        ansVal = (s1.r / d) + (c1.r * mult) - s2.r;
        qText = `(√${s1.val} ÷ ${d}) + ∛${c1.val} × ${mult} - √${s2.val} = ?`;
        exp = `√${s1.val} = ${s1.r}, ${s1.r} ÷ ${d} = ${s1.r / d}. ∛${c1.val} = ${c1.r}, ${c1.r} × ${mult} = ${c1.r * mult}. √${s2.val} = ${s2.r}. Result = ${ansVal}.`;
      }
    }
  } while (seenEquations.has(qText) && attempts < 30);

  seenEquations.add(qText);
  return makeQuestionObject("root", idx, "Roots & Radicals", qText, ansVal, exp);
}

// 3. Dynamic Numerator & Denominator (Fractions) Generator
function genSpeedMathFractions(idx, level = "medium", seenEquations = new Set()) {
  let qText = "", ansVal = 0, exp = "";
  let attempts = 0;

  do {
    attempts++;
    const type = (idx + attempts) % 4;

    if (level === "easy") {
      if (type === 0) {
        const d = pickRandom([3, 4, 5, 6, 7, 8, 9, 10]);
        const n = randInt(1, d - 1);
        const mult = randInt(4, 18);
        const m = d * mult;
        const c = randInt(10, 50);
        ansVal = (n * mult) + c;
        qText = `(${n}/${d}) × ${m} + ${c} = ?`;
        exp = `(${n}/${d}) × ${m} = ${n * mult}. ${n * mult} + ${c} = ${ansVal}.`;
      } else if (type === 1) {
        const d1 = pickRandom([3, 4, 5, 8]);
        const n1 = randInt(1, d1 - 1);
        const mult1 = randInt(4, 15);
        const m1 = d1 * mult1;

        const d2 = pickRandom([2, 5, 10]);
        const n2 = randInt(1, d2 - 1);
        const mult2 = randInt(4, 15);
        const m2 = d2 * mult2;

        ansVal = (n1 * mult1) + (n2 * mult2);
        qText = `(${n1}/${d1}) × ${m1} + (${n2}/${d2}) × ${m2} = ?`;
        exp = `(${n1}/${d1}) × ${m1} = ${n1 * mult1}. (${n2}/${d2}) × ${m2} = ${n2 * mult2}. Total = ${ansVal}.`;
      } else if (type === 2) {
        const a = randInt(2, 6);
        const b = randInt(10, 30);
        const c = randInt(2, 6);
        ansVal = a * b + c;
        qText = `(${a * c}/${c}) × ${b} + ${c} = ?`;
        exp = `${a * c}/${c} = ${a}. ${a} × ${b} = ${a * b}. ${a * b} + ${c} = ${ansVal}.`;
      } else {
        const whole = randInt(2, 5);
        const num = pickRandom([1, 3]);
        const den = 4;
        const k = 16;
        const impNum = whole * den + num;
        ansVal = (impNum * (k / den));
        qText = `(${whole} ${num}/${den}) × ${k} = ?`;
        exp = `${whole} ${num}/${den} = ${impNum}/${den}. (${impNum}/${den}) × ${k} = ${impNum} × ${k / den} = ${ansVal}.`;
      }
    } else if (level === "medium") {
      if (type === 0) {
        const d1 = pickRandom([7, 9, 11, 13, 15]);
        const n1 = randInt(2, d1 - 1);
        const mult1 = randInt(15, 45);
        const m1 = d1 * mult1;

        const d2 = pickRandom([5, 8, 12, 16]);
        const n2 = randInt(2, d2 - 1);
        const mult2 = randInt(10, 35);
        const m2 = d2 * mult2;

        ansVal = (n1 * mult1) + (n2 * mult2);
        qText = `(${n1}/${d1}) × ${m1} + (${n2}/${d2}) × ${m2} = ?`;
        exp = `(${n1}/${d1}) × ${m1} = ${n1 * mult1}. (${n2}/${d2}) × ${m2} = ${n2 * mult2}. Total = ${ansVal}.`;
      } else if (type === 1) {
        const a = randInt(24, 48);
        const b = randInt(14, a - 2);
        const diff = (a * a) - (b * b);
        const divs = [4, 8, 10, 12, 16, 20, 24].filter(d => diff % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : 4;
        const top = pickRandom([360, 480, 600, 720, 900]);
        const btm = pickRandom([12, 15, 18, 20, 24]);
        ansVal = (diff / d) + (top / btm);
        qText = `[(${a}² - ${b}²) ÷ ${d}] + (${top} ÷ ${btm}) = ?`;
        exp = `${a}² - ${b}² = ${diff}. ${diff} ÷ ${d} = ${diff / d}. ${top} ÷ ${btm} = ${top / btm}. ${diff / d} + ${top / btm} = ${ansVal}.`;
      } else if (type === 2) {
        const s1 = pickRandom(MEDIUM_SQUARES);
        const divs = [3, 4, 6, 7, 8, 9, 12].filter(d => s1.r % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : 4;
        const mult = randInt(10, 25);
        const add = randInt(20, 80);
        ansVal = ((s1.r * mult) / d) + add;
        qText = `[(√${s1.val} × ${mult}) ÷ ${d}] + ${add} = ?`;
        exp = `√${s1.val} = ${s1.r}. (${s1.r} × ${mult}) ÷ ${d} = ${(s1.r * mult) / d}. Result = ${ansVal}.`;
      } else {
        const pct = pickRandom([25, 40, 50, 75]);
        const base = pickRandom([300, 400, 500, 600, 800]);
        const c = randInt(15, 60);
        ansVal = (pct / 100) * base + c;
        qText = `(${pct}% of ${base}) + ${c} = ?`;
        exp = `${pct}% of ${base} = ${(pct / 100) * base}. Total = ${ansVal}.`;
      }
    } else {
      // HARD LEVEL
      if (type === 0) {
        const d1 = pickRandom([7, 9, 11, 13, 14, 17]);
        const n1 = randInt(3, d1 - 1);
        const m1 = d1 * d1; // square multiple!

        const d2 = pickRandom([5, 8, 12, 16]);
        const n2 = randInt(3, d2 - 1);
        const m2 = d2 * randInt(20, 60);

        const d3 = pickRandom([4, 5, 8]);
        const n3 = randInt(2, d3 - 1);
        const m3 = d3 * randInt(15, 50);

        ansVal = (n1 * d1) + (n2 * (m2 / d2)) - (n3 * (m3 / d3));
        qText = `(${n1}/${d1}) × ${m1} + (${n2}/${d2}) × ${m2} - (${n3}/${d3}) × ${m3} = ?`;
        exp = `(${n1}/${d1}) × ${m1} = ${n1 * d1}. (${n2}/${d2}) × ${m2} = ${n2 * (m2 / d2)}. (${n3}/${d3}) × ${m3} = ${n3 * (m3 / d3)}. Total = ${ansVal}.`;
      } else if (type === 1) {
        const a = randInt(38, 72);
        const b = randInt(20, a - 4);
        const diff = (a * a) - (b * b);
        const divs = [8, 12, 16, 20, 24, 32, 40, 48].filter(d => diff % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : 16;
        const top = pickRandom([480, 600, 720, 840, 960, 1200]);
        const btm = pickRandom([15, 16, 20, 24, 30]);
        ansVal = (diff / d) + (top / btm);
        qText = `[(${a}² - ${b}²) ÷ ${d}] + (${top} ÷ ${btm}) = ?`;
        exp = `${a}² - ${b}² = ${diff}. ${diff} ÷ ${d} = ${diff / d}. ${top} ÷ ${btm} = ${top / btm}. ${diff / d} + ${top / btm} = ${ansVal}.`;
      } else if (type === 2) {
        const s1 = pickRandom(HARD_SQUARES);
        const divs1 = [7, 8, 9, 12, 14, 16, 21].filter(d => s1.r % d === 0);
        const d1 = divs1.length > 0 ? pickRandom(divs1) : 7;
        const mult1 = randInt(12, 25);

        const s2 = pickRandom(MEDIUM_SQUARES);
        const divs2 = [6, 8, 9, 12, 15, 18].filter(d => s2.r % d === 0);
        const d2 = divs2.length > 0 ? pickRandom(divs2) : 6;
        const mult2 = randInt(15, 30);

        ansVal = ((s1.r * mult1) / d1) + ((s2.r * mult2) / d2);
        qText = `[(√${s1.val} × ${mult1}) ÷ ${d1}] + [(√${s2.val} × ${mult2}) ÷ ${d2}] = ?`;
        exp = `√${s1.val} = ${s1.r}, (${s1.r} × ${mult1}) ÷ ${d1} = ${(s1.r * mult1) / d1}. √${s2.val} = ${s2.r}, (${s2.r} × ${mult2}) ÷ ${d2} = ${(s2.r * mult2) / d2}. Total = ${ansVal}.`;
      } else {
        // Tricky banking percentages
        const pctOptions = [
          { p: "37.5%", fN: 3, fD: 8, base: 640, val: 240 },
          { p: "62.5%", fN: 5, fD: 8, base: 480, val: 300 },
          { p: "16⅔%", fN: 1, fD: 6, base: 720, val: 120 },
          { p: "14²⁄₇%", fN: 1, fD: 7, base: 560, val: 80 },
          { p: "83⅓%", fN: 5, fD: 6, base: 360, val: 300 },
          { p: "66⅔%", fN: 2, fD: 3, base: 450, val: 300 }
        ];
        const item1 = pickRandom(pctOptions);
        let item2 = pickRandom(pctOptions);
        while (item2.p === item1.p) item2 = pickRandom(pctOptions);

        const sum = item1.val + item2.val;
        const divs = [10, 15, 18, 20, 24, 25, 30].filter(d => sum % d === 0);
        const d = divs.length > 0 ? pickRandom(divs) : 10;
        const sq = randInt(14, 26);
        ansVal = (sum / d) + (sq * sq);
        qText = `[(${item1.p} of ${item1.base}) + (${item2.p} of ${item2.base})] ÷ ${d} + ${sq}² = ?`;
        exp = `${item1.p} of ${item1.base} = ${item1.val}. ${item2.p} of ${item2.base} = ${item2.val}. Numerator = ${sum}. ${sum} ÷ ${d} = ${sum / d}. ${sq}² = ${sq * sq}. Result = ${ansVal}.`;
      }
    }
  } while (seenEquations.has(qText) && attempts < 30);

  seenEquations.add(qText);
  return makeQuestionObject("frac", idx, "Numerator & Denominator", qText, ansVal, exp);
}

// 4. Dynamic Approximation Generator
function genSpeedMathApproximation(idx, level = "medium", seenEquations = new Set()) {
  let qText = "", ansVal = 0, exp = "";
  let attempts = 0;

  const sqPool = level === "easy" ? EASY_SQUARES : level === "medium" ? MEDIUM_SQUARES : HARD_SQUARES;

  do {
    attempts++;
    const type = (idx + attempts) % 5;

    if (level === "easy") {
      if (type === 0) {
        const s1 = pickRandom(sqPool);
        const s2 = pickRandom(sqPool);
        const offset1 = ((Math.random() * 0.4) - 0.2).toFixed(2);
        const offset2 = ((Math.random() * 0.4) - 0.2).toFixed(2);
        const dec1 = (s1.val + parseFloat(offset1)).toFixed(2);
        const dec2 = (s2.val + parseFloat(offset2)).toFixed(2);
        ansVal = s1.r + s2.r;
        qText = `√${dec1} + √${dec2} ≈ ?`;
        exp = `Approximating: √${s1.val} + √${s2.val} = ${s1.r} + ${s2.r} = ${ansVal}.`;
      } else if (type === 1) {
        const pct = pickRandom([20, 25, 30, 40, 50, 60, 75]);
        const decPct = (pct - 0.02).toFixed(2);
        const base = randInt(4, 30) * (100 / (pct === 75 ? 25 : pct === 25 ? 25 : 10));
        const decBase = (base + 0.12).toFixed(2);
        ansVal = Math.round((pct * base) / 100);
        qText = `${decPct}% of ${decBase} ≈ ?`;
        exp = `${pct}% of ${base} = ${ansVal}.`;
      } else if (type === 2) {
        const a = randInt(10, 25);
        const b = randInt(5, 15);
        const decA = (a + 0.03).toFixed(2);
        const decB = (b - 0.02).toFixed(2);
        ansVal = (a * a) - (b * b);
        qText = `(${decA})² - (${decB})² ≈ ?`;
        exp = `Approximating: ${a}² - ${b}² = ${a * a} - ${b * b} = ${ansVal}.`;
      } else if (type === 3) {
        const a = randInt(15, 60) * 10;
        const b = randInt(12, 45) * 5;
        const decA = (a + 0.98).toFixed(2);
        const decB = (b + 0.05).toFixed(2);
        const c = randInt(10, 50);
        ansVal = a + b - c;
        qText = `${decA} + ${decB} - ${c}.02 ≈ ?`;
        exp = `Approximating: ${a} + ${b} - ${c} = ${ansVal}.`;
      } else {
        const cb = pickRandom(EASY_CUBES);
        const dec = (cb.val + 0.08).toFixed(2);
        const add = randInt(10, 50);
        ansVal = cb.r + add;
        qText = `∛${dec} + ${add}.01 ≈ ?`;
        exp = `Approximating: ∛${cb.val} + ${add} = ${cb.r} + ${add} = ${ansVal}.`;
      }
    } else if (level === "medium") {
      if (type === 0) {
        const a = randInt(18, 38);
        const b = randInt(8, 18);
        const decA = (a + 0.02).toFixed(2);
        const decB = (b - 0.02).toFixed(2);
        ansVal = (a * a) - (b * b);
        qText = `(${decA})² - (${decB})² ≈ ?`;
        exp = `Approximating: ${a}² - ${b}² = ${a * a} - ${b * b} = ${ansVal}.`;
      } else if (type === 1) {
        const pct = pickRandom([15, 35, 45, 55, 65, 85]);
        const base = randInt(12, 40) * 20;
        const decPct = (pct - 0.05).toFixed(2);
        const decBase = (base + 0.15).toFixed(2);
        const plus = randInt(15, 60);
        ansVal = Math.round((pct * base) / 100) + plus;
        qText = `(${decPct}% of ${decBase}) + ${plus}.03 ≈ ?`;
        exp = `Approximating: (${pct}% of ${base}) + ${plus} = ${Math.round((pct * base) / 100)} + ${plus} = ${ansVal}.`;
      } else if (type === 2) {
        const s1 = pickRandom(MEDIUM_SQUARES);
        const s2 = pickRandom(EASY_SQUARES);
        const dec1 = (s1.val + 0.04).toFixed(2);
        const dec2 = (s2.val - 0.04).toFixed(2);
        ansVal = s1.r + s2.r;
        qText = `√${dec1} + √${dec2} ≈ ?`;
        exp = `Approximating: √${s1.val} + √${s2.val} = ${s1.r} + ${s2.r} = ${ansVal}.`;
      } else if (type === 3) {
        const cb = pickRandom(MEDIUM_CUBES);
        const dec = (cb.val + 0.12).toFixed(2);
        const mult = randInt(3, 8);
        ansVal = (cb.r * mult);
        qText = `∛${dec} × ${mult}.02 ≈ ?`;
        exp = `Approximating: ∛${cb.val} × ${mult} = ${cb.r} × ${mult} = ${ansVal}.`;
      } else {
        const a = randInt(25, 45);
        const b = randInt(12, 24);
        const decA = (a + 0.08).toFixed(2);
        const decB = (b - 0.05).toFixed(2);
        ansVal = (a * a) + (b * b);
        qText = `(${decA})² + (${decB})² ≈ ?`;
        exp = `Approximating: ${a}² + ${b}² = ${a * a} + ${b * b} = ${ansVal}.`;
      }
    } else {
      if (type === 0) {
        const s1 = pickRandom(HARD_SQUARES);
        const s2 = pickRandom(MEDIUM_SQUARES);
        const s3 = pickRandom(EASY_SQUARES);
        const dec1 = (s1.val + 0.04).toFixed(2);
        const dec2 = (s2.val - 0.03).toFixed(2);
        const dec3 = (s3.val + 0.02).toFixed(2);
        ansVal = s1.r + s2.r - s3.r;
        qText = `√${dec1} + √${dec2} - √${dec3} ≈ ?`;
        exp = `Approximating: √${s1.val} + √${s2.val} - √${s3.val} = ${s1.r} + ${s2.r} - ${s3.r} = ${ansVal}.`;
      } else if (type === 1) {
        const cb = pickRandom(HARD_CUBES);
        const sq = pickRandom(MEDIUM_SQUARES);
        const decCb = (cb.val + 0.15).toFixed(2);
        const decSq = (sq.val - 0.12).toFixed(2);
        ansVal = cb.r + sq.r;
        qText = `∛${decCb} + √${decSq} ≈ ?`;
        exp = `Approximating: ∛${cb.val} + √${sq.val} = ${cb.r} + ${sq.r} = ${ansVal}.`;
      } else if (type === 2) {
        const pct1 = 37.5;
        const pct2 = 62.5;
        const b1 = randInt(12, 35) * 8;
        const b2 = randInt(10, 30) * 8;
        ansVal = Math.round((pct1 * b1) / 100) + Math.round((pct2 * b2) / 100);
        qText = `(37.49% of ${(b1 + 0.08).toFixed(2)}) + (62.52% of ${(b2 - 0.06).toFixed(2)}) ≈ ?`;
        exp = `37.5% = 3/8 of ${b1} (${Math.round((pct1 * b1) / 100)}) + 62.5% = 5/8 of ${b2} (${Math.round((pct2 * b2) / 100)}) = ${ansVal}.`;
      } else if (type === 3) {
        const a = randInt(40, 75);
        const b = randInt(25, 45);
        const diff = (a * a) - (b * b);
        const d = pickRandom([2, 3, 4, 5, 6, 8, 10]);
        ansVal = Math.round(diff / d);
        qText = `[(${(a + 0.04).toFixed(2)})² - (${(b - 0.05).toFixed(2)})²] ÷ ${d}.01 ≈ ?`;
        exp = `Approximating: (${a}² - ${b}²) ÷ ${d} = ${diff} ÷ ${d} ≈ ${ansVal}.`;
      } else {
        const s1 = pickRandom(HARD_SQUARES);
        const mult = randInt(4, 9);
        const minus = randInt(50, 150);
        ansVal = (s1.r * mult) - minus;
        qText = `(√${(s1.val + 0.08).toFixed(2)} × ${mult}.02) - ${minus}.05 ≈ ?`;
        exp = `Approximating: (${s1.r} × ${mult}) - ${minus} = ${s1.r * mult} - ${minus} = ${ansVal}.`;
      }
    }
  } while (seenEquations.has(qText) && attempts < 50);

  seenEquations.add(qText);
  return makeQuestionObject("approx", idx, "Approximation", qText, ansVal, exp);
}

// 5. Tough Speed Math Simplification (Cycles across categories cleanly)
function genSpeedMathToughSimplification(idx, level = "medium", seenEquations = new Set()) {
  const cycle = idx % 4;
  if (cycle === 0) return genSpeedMathSquaresCubes(idx, level, seenEquations);
  if (cycle === 1) return genSpeedMathRoots(idx, level, seenEquations);
  if (cycle === 2) return genSpeedMathFractions(idx, level, seenEquations);
  return genSpeedMathSquaresCubes(idx + 13, level, seenEquations);
}

function genSpeedMathSimplification(idx, level = "medium", seenEquations = new Set()) {
  return genSpeedMathToughSimplification(idx, level, seenEquations);
}



export async function generateAIMockTest({ category, subject, topic, level = "medium", questionsCount = 30, timeLimit = "15 min" }) {
  let questions = [];
  const catLower = (category || "").toLowerCase();
  const isSpeedMath = catLower.includes("speed math") || catLower.includes("square") || catLower.includes("cube") || catLower.includes("root") || catLower.includes("fraction") || catLower.includes("numerator") || catLower.includes("denominator") || catLower.includes("simplification") || catLower.includes("approximation");

  if (isSpeedMath) {
    const seenEquations = new Set();
    const cleanLevel = ["easy", "medium", "hard"].includes(String(level).toLowerCase()) ? String(level).toLowerCase() : "medium";

    if (catLower.includes("square") || catLower.includes("cube")) {
      for (let i = 0; i < questionsCount; i++) questions.push(genSpeedMathSquaresCubes(i + 1, cleanLevel, seenEquations));
    } else if (catLower.includes("root") || catLower.includes("radical")) {
      for (let i = 0; i < questionsCount; i++) questions.push(genSpeedMathRoots(i + 1, cleanLevel, seenEquations));
    } else if (catLower.includes("fraction") || catLower.includes("numerator") || catLower.includes("denominator")) {
      for (let i = 0; i < questionsCount; i++) questions.push(genSpeedMathFractions(i + 1, cleanLevel, seenEquations));
    } else if (catLower.includes("approximation")) {
      for (let i = 0; i < questionsCount; i++) questions.push(genSpeedMathApproximation(i + 1, cleanLevel, seenEquations));
    } else {
      for (let i = 0; i < questionsCount; i++) questions.push(genSpeedMathToughSimplification(i + 1, cleanLevel, seenEquations));
    }

    const levelLabel = cleanLevel.charAt(0).toUpperCase() + cleanLevel.slice(1);
    return {
      id: `mock_speed_${cleanLevel}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${category} (${levelLabel} Level)`,
      category: "Speed Math",
      difficulty: levelLabel,
      questions: questions.length,
      time: timeLimit,
      durationMinutes: parseInt(timeLimit) || 15,
      taken: 0,
      questionsList: questions,
      createdAt: new Date().toISOString(),
    };
  }

  const prompt = buildPrompt(category, subject, topic, questionsCount);

  const errors = [];

  // 1. Try AI LLM
  try {
    console.log("🤖 Generating mock test via AI...");
    questions = await callLLMChain(prompt);
  } catch (err) {
    errors.push(`Backend AI: ${err.message}`);
    console.warn("AI generation failed, proceeding to fallback generator.");
  }

  if (!questions || questions.length === 0) {
    console.error("All AI providers failed. Reasons:\n- " + errors.join("\n- "));
    // Proceeding to fallback generator automatically...
  }

  // 5. Fallback Category Generator
  if (!questions || questions.length === 0) {
    const catLower = (category || "").toLowerCase();

    if (catLower.includes("square") || catLower.includes("cube")) {
      for (let i = 0; i < questionsCount; i++) {
        questions.push(genSpeedMathSquaresCubes(i + 1));
      }
    } else if (catLower.includes("root") || catLower.includes("radical")) {
      for (let i = 0; i < questionsCount; i++) {
        questions.push(genSpeedMathRoots(i + 1));
      }
    } else if (catLower.includes("fraction") || catLower.includes("numerator") || catLower.includes("denominator")) {
      for (let i = 0; i < questionsCount; i++) {
        questions.push(genSpeedMathFractions(i + 1));
      }
    } else if (catLower.includes("simplification") || (catLower.includes("speed math") && !catLower.includes("approximation"))) {
      for (let i = 0; i < questionsCount; i++) {
        questions.push(genSpeedMathSimplification(i + 1));
      }
    } else if (catLower.includes("approximation")) {
      for (let i = 0; i < questionsCount; i++) {
        questions.push(genSpeedMathApproximation(i + 1));
      }
    } else if (catLower.includes("bank") || catLower.includes("sbi") || catLower.includes("ibps")) {
      let stIdx = 0;
      for (let i = 0; i < questionsCount; i++) {
        if (i % 2 === 0) questions.push(genBankingQuant(i + 1));
        else if (i % 3 === 1) questions.push(genBankingReasoning(i + 1));
        else {
          questions.push({ ...BANKING_STATIC_POOL[stIdx % BANKING_STATIC_POOL.length], id: `st_${i + 1}` });
          stIdx++;
        }
      }
    } else if (catLower.includes("tnpsc")) {
      for (let i = 0; i < questionsCount; i++) {
        questions.push({ ...TNPSC_POOL[i % TNPSC_POOL.length], id: `tn_${i + 1}` });
      }
    } else if (catLower.includes("ssc")) {
      for (let i = 0; i < questionsCount; i++) {
        questions.push({ ...SSC_POOL[i % SSC_POOL.length], id: `ssc_${i + 1}` });
      }
    } else {
      for (let i = 0; i < questionsCount; i++) {
        questions.push({ ...BANK_POOL[i % BANK_POOL.length], id: `bank_${i + 1}` });
      }
    }
  }

  return {
    id: `mock_${Date.now()}`,
    title: `${category} PYQ AI Mock Test`,
    category,
    questions: questions.length,
    time: timeLimit,
    durationMinutes: parseInt(timeLimit) || 30,
    taken: 0,
    questionsList: questions,
    createdAt: new Date().toISOString(),
  };
}

// ------------------------------------------------------------------
// PDF-Based Question Extractor
// Upload a PYQ paper PDF → AI extracts exact questions → Mock Test
// ------------------------------------------------------------------

export function convertTextTableToMarkdown(rawText) {
  if (!rawText || typeof rawText !== "string") return rawText;
  if (/\|.*\|/.test(rawText) && /\|\s*[-:]+[-| :]*\|/.test(rawText)) return rawText;

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return rawText;

  const dataRows = [];
  let headerLineIndex = -1;
  let lastDataRowIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let tokens = line.split(/[|\t]+|\s{2,}|\s+(?=[₹$€£]?[-–—]?\d+(?:\.\d+)?%?|[-–—]|NA\b|N\/A\b)/i).map(t => t.trim()).filter(Boolean);
    const hasNumbers = tokens.filter(t => /^[₹$€£]?[-–—]?\d+(?:\.\d+)?%?$/.test(t)).length >= 1;
    if (tokens.length >= 2 && hasNumbers) {
      if (headerLineIndex === -1 && i > 0) {
        headerLineIndex = i - 1;
      }
      dataRows.push(tokens);
      lastDataRowIndex = i;
    }
  }

  // Allow table formatting even if there is 1 data row (very common in single-row or horizontal DI tables)
  if (dataRows.length >= 1) {
    const colCount = Math.max(...dataRows.map(r => r.length));
    const headerLine = headerLineIndex >= 0 ? lines[headerLineIndex] : null;
    const introLines = headerLineIndex >= 0 ? lines.slice(0, headerLineIndex) : [];
    const outroLines = lastDataRowIndex >= 0 ? lines.slice(lastDataRowIndex + 1) : [];

    let headerTokens = [];
    if (headerLine) {
      headerTokens = headerLine.split(/[|\t]+|\s{2,}/).map(t => t.trim()).filter(Boolean);
      if (headerTokens.length !== colCount) {
        const words = headerLine.split(/\s+/).map(t => t.trim()).filter(Boolean);
        if (words.length === colCount) {
          headerTokens = words;
        } else if (words.length === colCount - 1) {
          headerTokens = ['', ...words];
        } else if (words.length > colCount) {
          const grouped = [words[0]];
          const remainingWords = words.slice(1);
          const remainingCols = colCount - 1;
          const perCol = Math.floor(remainingWords.length / remainingCols);
          for (let c = 0; c < remainingCols; c++) {
            const start = c * perCol;
            const end = (c === remainingCols - 1) ? remainingWords.length : (c + 1) * perCol;
            grouped.push(remainingWords.slice(start, end).join(' '));
          }
          headerTokens = grouped;
        }
      }
    }

    while (headerTokens.length < colCount) {
      headerTokens.push(headerTokens.length === 0 ? 'Item' : ('Col ' + (headerTokens.length + 1)));
    }
    if (headerTokens.length > colCount) {
      headerTokens = headerTokens.slice(0, colCount);
    }

    const mdHeader = '| ' + headerTokens.join(' | ') + ' |';
    const mdDivider = '| ' + headerTokens.map(() => '---').join(' | ') + ' |';
    const mdRows = dataRows.map(row => {
      while (row.length < colCount) row.push('-');
      return '| ' + row.slice(0, colCount).join(' | ') + ' |';
    });

    const result = [];
    if (introLines.length > 0) {
      result.push(...introLines, '');
    }
    result.push(mdHeader, mdDivider, ...mdRows);
    if (outroLines.length > 0) {
      result.push('', ...outroLines);
    }

    return result.join('\n');
  }
  return rawText;
}

export function inferSectionFromContent(questionText = "", passageText = "", questionNumber = null) {
  // If sequential question number is known in a standard 100Q Indian Bank exam
  if (typeof questionNumber === "number" && questionNumber > 0 && questionNumber <= 100) {
    if (questionNumber <= 35) return "Quantitative Aptitude";
    if (questionNumber <= 65) return "English Language";
    return "Reasoning Ability";
  }

  const text = `${passageText || ""} ${questionText || ""}`.toLowerCase();
  
  // 1. Reasoning indicators (Check first so puzzles/syllogisms/relations/schedules mentioning "English" or "passage" are NEVER misclassified as English)
  if (
    /(?:puzzle|seating arrangement|seated|sitting|circular table|square table|linear row|parallel rows|facing\s+(?:centre|center|outside|north|south)|floor|flat|box|boxes placed|blood relation|father|mother|brother|sister|son|daughter|uncle|aunt|nephew|niece|spouse|married to|related to\b|syllogism|only a few|some books are|statements?:|conclusions?:|does not follow|neither nor|either or|inequalit|[A-Z]\s*[><≥≤=]\s*[A-Z]|coding[\s-]?decoding|written as\b|coded as\b|code language|direction sense|\bdirection\b|\b(?:north|south|east|west|northeast|northwest|southeast|southwest)\b|walks \d+[\s]?m|shortest distance|pythagoras|alphabet series|alphanumeric|vowels?|consonants?|meaningful word|how many such pairs|letters of the word|rank|order and ranking|alike in a certain way|does not belong|odd one out|machine input|input[\s-]output|step [I|V|X\d]+|who sits|sits second|sits third|sits immediate|extreme end|how many persons|immediate left|immediate right|scheduled starting from|exams?\s+(?:maths|science|history|economics|english|hindi)|scheduled on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i.test(text)
  ) {
    return "Reasoning Ability";
  }

  // 2. Quants indicators (Strict math terms, NO standalone question mark '?')
  if (
    /(?:data interpretation|\bdi\b|bar graph|bar chart|pie chart|line graph|tabular|table shows|caselet|simplification|approximation|(?:(?:\+|\-|\*|\/|=)\s*\?|\?\s*(?:\+|\-|\*|\/|=)|(?:√|sqrt)\s*\?|\(\s*\?\s*\)\s*[²³]|\?\s*%\s*of)|≈|number series|missing number|wrong number|quadratic equation|profit and loss|simple interest|compound interest|time and work|pipes and cistern|speed time|downstream|upstream|ratio and proportion|mixture|alligation|mensuration|perimeter|cylinder|cone|probability|visitors|total students|boys and girls|average of|find the value of|percentage of|ratio of)/i.test(text)
  ) {
    return "Quantitative Aptitude";
  }

  // 3. English indicators (Require actual English linguistics keywords, NOT standalone 'passage' or 'english')
  if (
    /(?:reading comprehension|author|antonym|synonym|closest in meaning|opposite in meaning|grammatical|grammatically|spelt|misspelt|phrase replacement|cloze|para[\s-]?jumble|rearrange the following sentences|first sentence after rearrangement|error|spotting error|sentence correction|bold word|underlined phrase|idiom|idiomatic|vocabulary|fill in the blank)/i.test(text)
  ) {
    return "English Language";
  }

  return "General";
}

/**
 * Extracts shared passages, directions, and their question number ranges.
 * E.g., "Directions (1-5): ...", "Directions (Q. 1 - 5): ...", "Questions 1 to 5: ..."
 * Also captures leading directions preceding Question 1.
 */
export function extractPassagesAndRanges(text) {
  if (!text || typeof text !== "string") return { passageRanges: [], leadingPassage: "" };

  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const passageRanges = [];

  // 1. Explicit directions blocks with question ranges
  const dirRegex = /(?:Directions?\s*(?:\([^\)]+\)|for\s+questions?\s*\d+[\s\w–—-]+)?[\:\s]*|Read the following[^\:\n]*[\:\.\n]|Study the following[^\:\n]*[\:\.\n]|The table shows[^\:\n]*[\:\.\n]|The following table[^\:\n]*[\:\.\n]|Rearrange the following[^\:\n]*[\:\.\n])([\s\S]*?)(?=(?:\n\s*(?:Q(?:uestion)?\.?\s*)?\d{1,3}[\.\)\:\-]\s*)|$)/gi;

  let dm;
  while ((dm = dirRegex.exec(clean)) !== null) {
    const fullBlock = dm[0].trim();
    const rangeMatch = fullBlock.match(/(?:Q(?:uestion)?s?[\:\s\.]*|\(\s*Q?\.?\s*|\b(?:questions?|nos?|q)\.?\s*)?(\d{1,3})\s*(?:-|to|–|—)\s*(\d{1,3})/i);
    if (rangeMatch) {
      const startNum = parseInt(rangeMatch[1], 10);
      const endNum = parseInt(rangeMatch[2], 10);
      if (!isNaN(startNum) && !isNaN(endNum) && endNum >= startNum && (endNum - startNum) <= 20) {
        passageRanges.push({ 
          startNum, 
          endNum, 
          passage: convertTextTableToMarkdown(fullBlock) 
        });
      }
    }
  }

  // 2. Detect leading passage / directions before Question 1
  const firstQMatch = clean.match(/(?:^|\n)\s*(?:(?:question|ques|q)\s*[\.:\-]?\s*)?(?:\(?\s*1\s*[\.\)\:\-]\s*|\(1\)\s*)(?=\s*\S)/i);
  let leadingPassage = "";
  if (firstQMatch && firstQMatch.index >= 30) {
    const preText = clean.substring(0, firstQMatch.index).trim();
    const sanitizedPre = preText
      .replace(/www\.BankExamsToday\.Com\s+Page\s+\d+/gi, "")
      .replace(/IBPS PO Pre held on [^\n]+/gi, "")
      .trim();

    if (sanitizedPre.length >= 30 && !sanitizedPre.toLowerCase().startsWith("page ") && !sanitizedPre.toLowerCase().includes("all rights reserved")) {
      leadingPassage = convertTextTableToMarkdown(sanitizedPre);
      if (!passageRanges.some(r => r.startNum === 1)) {
        passageRanges.unshift({ startNum: 1, endNum: 5, passage: leadingPassage });
      }
    }
  }

  return { passageRanges, leadingPassage };
}

/**
 * Separates questions from answers/solutions/common explanation.
 * Prevents solution blocks from ever being chunked and extracted as fake questions.
 */
export function isolateQuestionsAndSolutions(fullText) {
  if (!fullText || typeof fullText !== "string") {
    return { 
      questionsText: fullText || "", 
      solutionsText: "", 
      solutionsMap: {}, 
      leadingPassage: "", 
      passageRanges: [] 
    };
  }

  const cleanText = fullText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Comprehensive solution headers common in Indian competitive exams
  const solHeaderRegex = /(?:^|\n)\s*(?:[-=~_*#]{2,}\s*)?(?:ANSWERS?\s*(?:&|AND|\/|\+)\s*SOLUTIONS?|SOLUTIONS?\s*(?:&|AND|\/|\+)\s*ANSWERS?|ANSWERS?\s*(?:&|AND|\/|\+|WITH)\s*EXPLANATIONS?|SOLUTIONS?\s*(?:&|AND|\/|\+|WITH)\s*EXPLANATIONS?|HINTS?\s*(?:&|AND|\/|\+)\s*SOLUTIONS?|HINTS?\s*(?:&|AND|\/|\+)\s*EXPLANATIONS?|DETAILED\s*(?:SOLUTIONS?|EXPLANATIONS?)|COMMON\s*EXPLANATIONS?|ANSWERS?\s*(?:KEY|SHEET|KEYS)|ANSWER\s+KEY|SOLUTIONS?\s*:|ANSWERS?\s*:|EXPLANATIONS?\s*:|HINTS?\s*:|(?:^|\n)\s*(?:ANSWERS?|SOLUTIONS?|EXPLANATIONS?|HINTS?)\s*(?:\n|$))(?:\s*[-=~_*#]{2,})?/gi;

  let splitIndex = -1;
  let m;
  while ((m = solHeaderRegex.exec(cleanText)) !== null) {
    if (m.index >= 80) {
      splitIndex = m.index;
      break;
    }
  }

  // Fallback 1: Check for "Common Explanation" or "Directions for Solutions"
  if (splitIndex === -1) {
    const commonExpMatch = cleanText.match(/(?:^|\n)\s*(?:Common\s+Explanation|Directions\s+for\s+Solutions?)[\:\s]/i);
    if (commonExpMatch && commonExpMatch.index >= 80) {
      splitIndex = commonExpMatch.index;
    }
  }

  // Fallback 2: Sequence reset detection
  // When question numbers reset from N (>= 3) back to 1 (e.g. Q1-5 followed by 1. (b) Solution)
  if (splitIndex === -1) {
    const qMarker = /(?:^|\n)\s*(?:(?:question|ques|q)\s*[\.:\-]?\s*)?(?:\(?\s*(\d{1,3})\s*[\.\)\:\-]\s*|\((\d{1,3})\)\s*)(?=\s*\S)/gi;
    let match;
    let lastNum = 0;
    while ((match = qMarker.exec(cleanText)) !== null) {
      const num = parseInt(match[1] || match[2], 10);
      if (isNaN(num)) continue;
      if (lastNum >= 3 && num === 1) {
        const candidateAfter = cleanText.substring(match.index);
        const hasSolIndicators = /(?:ans(?:wer)?[\:\s\.\-]|hence\s+option|correct\s+option|^\s*\d{1,3}\s*[\.\)]\s*\(?[A-Ea-e]\)?\s+|\boption\s+[A-Ea-e]\b)/im.test(candidateAfter.slice(0, 300)) ||
          !candidateAfter.slice(0, 400).includes("(c)");
        if (hasSolIndicators) {
          splitIndex = match.index;
          break;
        }
      }
      lastNum = num;
    }
  }

  let questionsText = cleanText;
  let solutionsText = "";

  if (splitIndex !== -1) {
    const candidateQuestions = cleanText.substring(0, splitIndex).trim();
    const candidateSolutions = cleanText.substring(splitIndex).trim();

    // Check if candidateSolutions contains solution markers
    const hasSolutionMarkers = /(?:common\s+explanation|hence\s+option|correct\s+option|answer\s*[\:\.]|solution\s*[\:\.]|\b\d{1,3}\s*[\.\)]\s*\(?[A-Ea-e]\)?\s+[A-Za-z])/i.test(candidateSolutions);
    const candidateOptionsCount = (candidateSolutions.match(/(?:^|\n|\s)(?:\(?\s*[A-Ea-e]\s*[\)\.\:\-]\s*|\([A-Ea-e]\)\s*)/g) || []).length;
    const numberedHeaders = (candidateSolutions.match(/(?:^|\n)\s*(?:(?:question|ques|q)\s*[\.:\-]?\s*)?(?:\(?\s*\d{1,3}\s*[\.\)\:\-]\s*|\(\d{1,3}\)\s*)(?=\s*\S)/gi) || []).length;

    // In a real question set, there are >= 3 options per numbered question. In solutions, options are absent or scarce.
    if (hasSolutionMarkers || candidateOptionsCount < numberedHeaders * 2.5 || numberedHeaders === 0) {
      questionsText = candidateQuestions;
      solutionsText = candidateSolutions;
      console.log(`[AI] Cleanly separated questions (${questionsText.length} chars) from solutions (${solutionsText.length} chars) at char ${splitIndex}`);
    }
  }

  // Parse solutions / explanations map from solutionsText
  const solutionsMap = {};
  if (solutionsText) {
    // 1. Detect Common Explanation (e.g. puzzle arrangement or table)
    let commonExplanation = "";
    const ceMatch = solutionsText.match(/(?:Common\s+Explanation[^\n]*\n)([\s\S]*?)(?=(?:\n\s*(?:Q(?:uestion)?\.?\s*)?\d{1,3}[\.\)\:\-]\s*)|$)/i);
    if (ceMatch) {
      commonExplanation = ceMatch[1].trim();
    }

    // 2. Parse individual question solutions: "1. (A) ...", "1. Answer: A ...", "Q.1 ...", etc.
    const solItemRegex = /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[\.\)\:\-]\s*(?!\d)/g;
    const solMatches = [];
    let sm;
    while ((sm = solItemRegex.exec(solutionsText)) !== null) {
      solMatches.push({ qNum: parseInt(sm[1], 10), index: sm.index, matchLen: sm[0].length });
    }

    for (let i = 0; i < solMatches.length; i++) {
      const cur = solMatches[i];
      const nextIdx = (i < solMatches.length - 1) ? solMatches[i + 1].index : solutionsText.length;
      let expBody = solutionsText.substring(cur.index + cur.matchLen, nextIdx).trim();

      // Extract correct answer letter if present: e.g. "(A)", "Option A", "Ans. (a)", "Hence option A", "a) ...", "A. ..."
      let ansLetter = "";
      const ansMatch = expBody.match(/(?:(?:Ans(?:wer)?[\:\s\.\-]+|\(?Ans\)?\s*[\:\.\-]?\s*|\bOption\s*|Hence\s+option\s*)\(?([A-Ea-e])\)?|^\(?([A-Ea-e])\)[\.\s\:]|^([A-Ea-e])[\.\)\:\s])/i);
      if (ansMatch) {
        ansLetter = (ansMatch[1] || ansMatch[2] || ansMatch[3]).toUpperCase();
      }

      let fullExp = expBody;
      if (commonExplanation && !fullExp.toLowerCase().includes("common explanation")) {
        fullExp = `### Common Explanation\n${commonExplanation}\n\n${fullExp}`.trim();
      }

      solutionsMap[cur.qNum] = {
        explanation: fullExp,
        answerLetter: ansLetter
      };
    }
  }

  const { passageRanges, leadingPassage } = extractPassagesAndRanges(questionsText);

  return { questionsText, solutionsText, solutionsMap, leadingPassage, passageRanges };
}

const buildExtractionPrompt = (pdfChunk, expectedCount, startQ = null, endQ = null) => `You are a strict data extractor and expert solver for Indian competitive exam question papers (SBI PO/Clerk, IBPS PO/Clerk, RRB, Banking).
The text below contains ${startQ && endQ ? `questions numbered ${startQ} through ${endQ} (total ${expectedCount} questions)` : `exactly ${expectedCount} question block${expectedCount === 1 ? "" : "s"}`}. Extract EVERY numbered question in source order without combining or omitting one.
STRICT RULE: Do NOT extract sub-numbered puzzle clue items (e.g. (1) Person A..., (2) Person B... (13) B is a cricketer) as separate questions! Keep those clues inside the "passage" property of the actual questions.
Output a JSON object. No markdown, no extra text outside the JSON block.

STRICT EXTRACTION INTEGRITY RULES:
- Extract EXACTLY the questions that are uploaded in this chunk.
- NEVER invent, generate, extrapolate, or hallucinate new or hypothetical questions. Extract ONLY what appears in the provided text.
- Retain exact numbers, options (A through E), and question phrasing from the source text.

CRITICAL SHARED PASSAGE & DIRECTIONS MANDATE (PUZZLES, SEATING ARRANGEMENT, READING COMPREHENSION, DI):
- In Indian exams, sets of questions (e.g. Questions 1 to 5) are based on a shared puzzle, seating arrangement, reading comprehension article, or Data Interpretation table.
- You MUST extract and copy the COMPLETE shared passage, story, or directions (e.g. "Directions (1-5): Eight persons A, B, C, D, E, F, G and H were born in eight different years...") into the "passage" field of EVERY SINGLE question in that set!
- Questions 1, 2, 3, 4, 5 in the set MUST ALL have the exact same full passage text in their "passage" property!
- NEVER leave "passage" blank or empty for questions 2, 3, 4, 5. Students need to read the passage on every question card while answering!
- If the text chunk begins with a Directions/Passage block before Question 1, that is the shared passage for the following questions.

CRITICAL MATHEMATICAL NOTATION RULES:
- PRESERVE ALL POWERS AND ROOTS PRECISELY:
  * Squares: use ² (e.g. (803.63)² or 15²)
  * Cubes: use ³ (e.g. 27³ or 12³)
  * Higher powers: ⁴ ⁵ ⁶ ⁷ ⁸ ⁹
  * Fractional exponents: write as ^(1/2), ^(1/3), ^(2/3), etc. (e.g. (1681)^(1/2) + (4094)^(1/3) = ?)
  * NEVER drop fractional powers or carets! (1681)^(1/2) must NEVER become (1681)^.
  * If the raw text contains a dangling caret like (1681)^ or (4094)^ due to PDF OCR artifact, deduce and restore the mathematical power: 1681 is 41² so power is (1/2), 4096 is 16³ so power is (1/3).
- PRESERVE ALL FRACTIONS PRECISELY:
  * Mixed fractions: use vulgar fractions where possible (e.g. 22 ⅓ % of 435.1) or write as 22 1/3 %. NEVER omit the fraction!
  * Vertical/standalone fractions: write as 11/7, 3/4, etc. (e.g. - 11/7 of 1734.68). NEVER drop "11/7" to leave just "- of 1734.68"!
- PRESERVE OPERATORS: use × for multiplication, ÷ for division, √ for square root, ∛ for cube root.

STEP-BY-STEP SOLUTION & DIAGRAM MANDATE:
- For the "explanation" field of EVERY question, you MUST provide a detailed step-by-step solution:
  * Reasoning Puzzles & Seating Arrangements: Provide step-by-step deductive logic AND include the complete final solved markdown table (e.g. | Person | Floor / Position | Attribute | ...) so students see the complete solved matrix!
  * Direction Sense: Detail each step of the journey with exact distances and cardinal directions (e.g. "Starts at Point A, walks 10m North to Point B, turns right and walks 5m East to Point C...") so the diagram generator can draw the exact path.
  * Syllogisms: Explicitly list the statements ("Statements: All A are B. Some B are C.") and conclusions ("Conclusions: I. Some A are C. II. No A is C.") with step-by-step Venn circle analysis and deduction.
  * Quantitative Aptitude (Simplification, Approximation, Series, DI):
    Show:
    Step 1: Conversion of mixed fractions and fractional powers (e.g. 22 ⅓% = 67/300, (1681)^(1/2) = 41, (4094)^(1/3) ≈ 16)
    Step 2: Step-by-step arithmetic computation with intermediate values
    Step 3: Clear statement of the correct option and final value.
  * English Language: State the grammatical rule, error correction, or context-based justification.

BANK EXAM 3-SECTION MANDATE:
Categorize each question into one of the 3 standard Bank sections:
- If question number is between 1 and 35: "Quantitative Aptitude" (Data Interpretation, Simplification, Approximation, Number Series, Quadratic Equations, Arithmetic)
- If question number is between 36 and 65: "English Language" (Reading Comprehension, Para Jumbles, Cloze Test, Error Spotting, Fillers, Sentence Improvement)
- If question number is between 66 and 100: "Reasoning Ability" (Puzzles, Seating Arrangements, Syllogisms, Inequalities, Coding-Decoding, Blood Relations, Direction Sense, Scheduling)

FORMAT:
{
  "questions": [
    {
      "question_number": ${startQ || 1},
      "section": "English Language" | "Reasoning Ability" | "Quantitative Aptitude",
      "topic": "short topic name or empty string",
      "passage": "Shared directions/passage only. Copy it exactly; do not solve it.",
      "question": "Only the specific question being asked (e.g. '(1681)^(1/2) + (4094)^(1/3) = ?'). Include all mathematical symbols, powers, fractions accurately.",
      "options": ["Option text A", "Option text B", "Option text C", "Option text D", "Option text E"],
      "correctAnswerIndex": 0,
      "source_answer": "A or empty string when no answer is printed in this chunk",
      "explanation": "Detailed step-by-step solution showing all calculations and intermediate steps.",
      "chart_page_number": null
    }
  ]
}

RULES:
- options must contain the source options in A-to-E order. Do not invent placeholder options.
- correctAnswerIndex must be 0 through 4.
- If source_answer is missing in text, calculate the verified answer and set correctAnswerIndex and source_answer.
- For charts, set chart_page_number to the source page number when present.

TEXT:
${pdfChunk}
`;

const buildVerificationPrompt = (questionJson) => `You are an expert Indian Competitive Exam analyzer.
Your job is to independently verify this extracted question and compare your answer with the source answer.

## BACKGROUND VERIFICATION
1. Read the source answer from the provided JSON.
2. Independently solve the question.

## NEVER TRUST THE PDF ANSWER KEY
If source_answer = B and AI independently calculates ai_verified_answer = C, DO NOT automatically replace B with C. Keep both values.
Set answer_status = "MISMATCH", needs_review = true.

Return ONLY structured JSON in this format (no markdown fences):
{
  "source_answer": "B",
  "ai_verified_answer": "C",
  "answer_status": "MISMATCH",
  "verification_explanation": "25% of 240 is 60, which is option C.",
  "needs_review": true
}

Allowed statuses: VERIFIED, MISMATCH, NEEDS_REVIEW, NO_SOURCE_ANSWER

QUESTION DATA:
"""
${JSON.stringify(questionJson, null, 2)}
"""`;

async function callGroq(apiKey, prompt) {
  const models = [
    getEnvKey("VITE_GROQ_MODEL"),
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b"
  ].filter(Boolean);
  let lastErr = null;
  for (const model of models) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 3500,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        if (response.status === 401) {
          throw new Error(`Groq Auth Error (401): ${errText}`);
        }
        console.warn(`[AI] Groq model ${model} returned ${response.status}, trying next model...`);
        lastErr = new Error(`Groq API Error (${response.status}): ${errText || response.statusText}`);
        continue;
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      const text = choice?.message?.content || choice?.message?.reasoning_content || "{}";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonStart = cleaned.indexOf("[");
      const jsonEnd = cleaned.lastIndexOf("]");
      
      let parsed;
      try {
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
        } else {
          parsed = JSON.parse(cleaned);
        }
      } catch (parseErr) {
        const lastBrace = cleaned.lastIndexOf("}");
        if (lastBrace !== -1 && jsonStart !== -1 && lastBrace > jsonStart) {
          try {
            parsed = JSON.parse(cleaned.substring(jsonStart, lastBrace + 1) + "]");
          } catch {
            throw parseErr;
          }
        } else {
          throw parseErr;
        }
      }
      
      return Array.isArray(parsed) ? parsed : parsed.questions || parsed.mockTest || parsed || [];
    } catch (err) {
      console.warn(`[AI] Groq model ${model} failed:`, err.message);
      lastErr = err;
      if (err.message.includes("401") || err.message.includes("Invalid API Key")) {
        break; // Bad API key
      }
    }
  }
  throw lastErr || new Error("All Groq models failed.");
}



async function callLLMChain(prompt) {
  const nvidiaKey = getEnvKey("VITE_NVIDIA_API_KEY") || getEnvKey("NVIDIA_API_KEY");
  const geminiKey = getEnvKey("VITE_GEMINI_API_KEY") || getEnvKey("GEMINI_API_KEY");
  const groqKey = getEnvKey("VITE_GROQ_API_KEY") || getEnvKey("GROQ_API_KEY");
  
  const providers = [];
  if (nvidiaKey) providers.push({ name: "NVIDIA", fn: () => callNvidia(nvidiaKey, prompt) });
  if (geminiKey) providers.push({ name: "Gemini", fn: () => callGemini(geminiKey, prompt) });
  if (groqKey)   providers.push({ name: "Groq",   fn: () => callGroq(groqKey, prompt) });

  if (providers.length === 0) {
    throw new Error("No API key configured. Add at least one of: VITE_NVIDIA_API_KEY, VITE_GEMINI_API_KEY, or VITE_GROQ_API_KEY in your .env file.");
  }

  let lastError = null;
  for (let i = 0; i < providers.length; i++) {
    const { name, fn } = providers[i];
    try {
      const result = await fn();
      if (i > 0) console.log(`[AI] ✅ ${name} succeeded as fallback.`);
      return result;
    } catch (err) {
      lastError = err;
      const nextProvider = providers[i + 1]?.name;
      if (nextProvider) {
        console.warn(`[AI] ${name} failed: ${err.message}. Falling back to ${nextProvider}...`);
      } else {
        console.error(`[AI] ${name} failed: ${err.message}. No more providers to try.`);
      }
    }
  }

  throw lastError || new Error("All AI providers failed.");
}

/**
 * Splits text into chunks of approx 3000-4000 characters without breaking words.
 */
function chunkText(text, maxLen = 12000) {
  const chunks = [];
  let currentIndex = 0;
  while (currentIndex < text.length) {
    let nextIndex = currentIndex + maxLen;
    if (nextIndex < text.length) {
      // Try to find a newline or period to break at
      const lastNewline = text.lastIndexOf('\n', nextIndex);
      const lastPeriod = text.lastIndexOf('. ', nextIndex);
      if (lastNewline > currentIndex + 1000) nextIndex = lastNewline;
      else if (lastPeriod > currentIndex + 1000) nextIndex = lastPeriod + 1;
    }
    chunks.push(text.slice(currentIndex, nextIndex));
    currentIndex = nextIndex;
  }
  return chunks;
}

// Keep each LLM request aligned to complete questions. Character-only chunks can
// split a question from its options, which was the main reason questions vanished.
function chunkQuestions(text, maxQuestions = 6, maxChars = 5000) {
  // First, find true sequential question positions (1 to N) to avoid splitting on sub-numbered
  // puzzle clues like (1)-(13) or table ratios like "3 : 2"
  const qSplitRegex = /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[\.\)]\s*(?!\d)/g;
  const rawQPositions = [];
  let qm;
  while ((qm = qSplitRegex.exec(text)) !== null) {
    rawQPositions.push({
      num: parseInt(qm[1], 10),
      index: qm.index,
      matchLen: qm[0].length
    });
  }

  const qPositions = [];
  let expected = 1;
  for (let i = 0; i < rawQPositions.length; i++) {
    const cur = rawQPositions[i];
    if (cur.num === expected) {
      qPositions.push(cur);
      expected++;
    } else if (cur.num > expected && cur.num <= expected + 2) {
      qPositions.push(cur);
      expected = cur.num + 1;
    }
  }

  // If sequential parser found at least 5 questions, chunk strictly along true question boundaries!
  if (qPositions.length >= 5) {
    const prefix = text.slice(0, qPositions[0].index).trim();
    const blocks = qPositions.map((pos, index) => {
      const nextIndex = index + 1 < qPositions.length ? qPositions[index + 1].index : text.length;
      return text.slice(pos.index, nextIndex).trim();
    });

    const chunks = [];
    let current = prefix;
    let count = 0;
    let startQ = qPositions[0].num;
    let endQ = qPositions[0].num;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const qNum = qPositions[i].num;
      const wouldExceed = count > 0 && (count >= maxQuestions || current.length + block.length > maxChars);
      if (wouldExceed) {
        chunks.push({ text: current.trim(), expectedCount: count, startQ, endQ });
        current = "";
        count = 0;
        startQ = qNum;
      }
      current += `${current ? "\n\n" : ""}${block}`;
      endQ = qNum;
      count++;
    }
    if (count > 0) chunks.push({ text: current.trim(), expectedCount: count, startQ, endQ });
    return chunks;
  }

  // Fallback for non-standard formats
  const marker = /(^|\n)\s*(?:(?:question|ques|q)\s*[\.:\-]?\s*)?(?:\(?\s*\d{1,3}\s*[\.\)\:\-]\s*|\(\d{1,3}\)\s*)(?=\s*\S)/gim;
  const starts = [];
  let match;
  while ((match = marker.exec(text)) !== null) starts.push(match.index + match[1].length);

  if (starts.length === 0) {
    return chunkText(text, maxChars).map(chunk => ({ text: chunk, expectedCount: 1 }));
  }

  // If the entire text contains <= maxQuestions and fits within character limits, keep it as 1 single chunk
  if (starts.length <= maxQuestions && text.length <= maxChars) {
    return [{ text: text.trim(), expectedCount: starts.length }];
  }

  const prefix = text.slice(0, starts[0]).trim();
  const blocks = starts.map((start, index) => text.slice(start, starts[index + 1] || text.length).trim());
  const chunks = [];
  let current = prefix;
  let count = 0;

  for (const block of blocks) {
    const wouldExceed = count > 0 && (count >= maxQuestions || current.length + block.length > maxChars);
    if (wouldExceed) {
      chunks.push({ text: current.trim(), expectedCount: count });
      current = "";
      count = 0;
    }
    current += `${current ? "\n\n" : ""}${block}`;
    count++;
  }
  if (count > 0) chunks.push({ text: current.trim(), expectedCount: count });
  return chunks;
}

function regexExtractQuestions(pdfText, category) {
  const { questionsText, solutionsMap, leadingPassage, passageRanges } = isolateQuestionsAndSolutions(pdfText);
  const cleanText = questionsText.replace(/\r\n/g, "\n");
  const qRegex = /(?:^|\s)(?:Ques|Question|Q)[\s\.]*\d+\s*[\.\)]\s+|(?:^|\s)\d+\s*[\.\)]\s+(?=[A-Z])/i;
  const rawBlocks = cleanText.split(qRegex).filter(b => b.trim().length > 10);
  const uniqueQuestions = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    let qText = block;
    let options = ["Option A", "Option B", "Option C", "Option D", "Option E"];
    const optRegex = /(?:\s|^)\(([a-eA-E])\)\s+|(?:\s|^)([a-eA-E])\)\s+|(?:\s|^)([a-eA-E])\.\s+/g;
    const matches = [...block.matchAll(optRegex)];

    if (matches.length >= 2) {
      const firstOptIndex = matches[0].index;
      qText = block.substring(0, firstOptIndex).trim();
      const optValues = [];
      for (let j = 0; j < matches.length; j++) {
        const start = matches[j].index + matches[j][0].length;
        const end = j + 1 < matches.length ? matches[j + 1].index : block.length;
        optValues.push(block.substring(start, end).replace(/\n/g, ' ').trim());
      }
      options = [];
      for (let k = 0; k < Math.min(optValues.length, 5); k++) {
        options.push(optValues[k] || `Option ${String.fromCharCode(65 + k)}`);
      }
      while (options.length < 5) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }
    }
    qText = qText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (qText.length > 10 && matches.length > 0) {
      const qNum = uniqueQuestions.length + 1;
      const matchedRange = passageRanges.find(r => qNum >= r.startNum && qNum <= r.endNum);
      const qPassage = matchedRange?.passage || (qNum <= 5 ? leadingPassage : "");
      const solEntry = solutionsMap[qNum];
      const correctLetter = solEntry?.answerLetter || "A";
      const correctIdx = Math.max(0, correctLetter.charCodeAt(0) - 65);

      uniqueQuestions.push({
        id: `pdf_q_${Date.now()}_${uniqueQuestions.length}`,
        questionNumber: qNum,
        question: qText,
        question_text: qText,
        options: options,
        correctAnswerIndex: correctIdx < 5 ? correctIdx : 0,
        source_answer: correctLetter,
        passage: qPassage,
        section: category || "General",
        explanation: solEntry?.explanation || "",
        solutionText: solEntry?.explanation || "",
        imageUrl: ""
      });
    }
  }
  return uniqueQuestions;
}

/**
 * Ensures that for Caselet / Paragraph-based DI questions, the original text
 * story / paragraph remains in `passage` for students to solve, while any
 * generated solved table/matrix is moved to `explanation` (Solution section).
 */
export function sanitizeDIPassageAndExplanation(passage, explanation, question = "") {
  if (!passage || typeof passage !== "string") {
    return { 
      passage: passage || "", 
      cleanPassage: passage || "", 
      explanation: explanation || "", 
      cleanExplanation: explanation || "" 
    };
  }

  const lines = passage.split(/\r?\n/);
  const tableLines = [];
  const textLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|", 1)) {
      tableLines.push(trimmed);
    } else {
      textLines.push(line);
    }
  }

  // If there's no table in passage, return as is
  if (tableLines.length === 0) {
    const trimmedPassage = passage.trim();
    return { 
      passage: trimmedPassage, 
      cleanPassage: trimmedPassage, 
      explanation: explanation || "", 
      cleanExplanation: explanation || "" 
    };
  }

  const tableMarkdown = tableLines.join("\n");
  const pureParagraph = textLines
    .join("\n")
    .replace(/###\s*(?:Table|Data|Solved|Arrangement|Matrix)[^\n]*/gi, "")
    .trim();

  // If there is an explicitly marked solved table/matrix (solution section), move it to explanation
  const isExplicitlySolvedTable = /###\s*(?:Solved|Solution|Final Arrangement|Answer Matrix)/i.test(passage) ||
                                  /solved|arrangement/i.test(tableLines[0]);
  if (isExplicitlySolvedTable && pureParagraph.length >= 20) {
    const cleanPassage = pureParagraph;

    // Move the solved table into the explanation (solution section)
    let cleanExplanation = (explanation || "").trim();
    if (!cleanExplanation.includes(tableLines[0])) {
      cleanExplanation = `### Solved Data Matrix / Table\n${tableMarkdown}\n\n${cleanExplanation}`.trim();
    }

    return {
      passage: cleanPassage,
      cleanPassage,
      explanation: cleanExplanation,
      cleanExplanation
    };
  }

  // Standard DI table belongs IN the passage for students to see and solve!
  const trimmedPassage = passage.trim();
  return { 
    passage: trimmedPassage, 
    cleanPassage: trimmedPassage, 
    explanation: explanation || "", 
    cleanExplanation: explanation || "" 
  };
}

export function isDIQuestion(q) {
  if (!q) return false;
  const passage = (q.passage || "").toLowerCase();
  const qText = (q.question || q.question_text || "").toLowerCase();
  const section = (q.section || q.subject || "").toLowerCase();
  const content = `${passage} ${qText}`;

  // 1. Strict Exclusions: English verbal tests or Reasoning Puzzles MUST NEVER be marked as DI or have chart diagrams attached!
  if (section.includes("english") || /(?:antonym|synonym|cloze test|para[\s-]?jumble|grammatical|spelt|sentence rearrangement)/i.test(content)) {
    return false;
  }
  const isReasoningPuzzle = /(?:sitting around|seated around|circular table|facing north|facing south|facing inside|facing outside|facing the centre|facing center|parallel rows|floor puzzle|box puzzle|blood relation|syllogism|statement and conclusion|direction sense|coding[\s-]?decoding|order and ranking)/i.test(content);
  if (isReasoningPuzzle) {
    return false;
  }

  // Exclude standard Arithmetic & Speed Math mini questions that never have diagrams
  if (/(?:simplification|approximation|quadratic equation|number series|missing number|wrong number)/i.test(content)) {
    return false;
  }

  // 2. Passage contains a markdown table (| ... |) -> Genuine Tabular DI
  if (/\|.*\|/.test(q.passage || "") && /---/.test(q.passage || "")) {
    return true;
  }

  // 3. Strict DI indicators: Must explicitly reference a visual chart, graph, or tabular DI set
  const hasDIIndicators = /(?:pie[\s-]?chart|bar[\s-]?graph|bar[\s-]?chart|line[\s-]?graph|line[\s-]?chart|histogram|radar[\s-]?graph|radar[\s-]?chart|tabular[\s-]?di|data interpretation|\bdi\b|caselet di|study the (?:following|given) (?:table|bar|pie|line|chart|graph)|refer to the (?:table|chart|graph|data given)|given (?:table|bar|pie|line|chart|graph) shows|the (?:following|given) (?:table|bar|pie|line|chart|graph) (?:shows|represents|depicts)|direction[s]?\s*(?:\([^\)]+\))?[\:\s]*(?:study|the following|read the following) (?:table|graph|chart))/i.test(content);

  const isQuants = /(?:quantitative|quants|math|aptitude)/i.test(section) ||
    (!section.includes("reasoning") && !section.includes("english"));

  return isQuants && hasDIIndicators;
}

export function findBestMatchingChartPage(q, pageImages) {
  if (!pageImages || pageImages.length === 0) return null;

  // Strict check: ONLY attach charts to genuine Quantitative Aptitude DI questions, NEVER to mini questions!
  if (!isDIQuestion(q)) return null;

  // 1. Direct chart_page_number or page_number check if provided and valid
  const targetPageNum = q.chart_page_number || q.page_number;
  if (targetPageNum) {
    const found = pageImages.find(p => p.pageNum === targetPageNum);
    if (found && !found.isPromo) return found;
  }

  const passage = (q.passage || "").trim();
  const qText = (q.question || q.question_text || "").trim();
  const fullQ = `${passage} ${qText}`.trim();

  const normalizeText = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
  const normPassage = normalizeText(passage);
  const normQ = normalizeText(qText);
  const normFull = `${normPassage} ${normQ}`.trim();

  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'is', 'in', 'of', 'to', 'from', 'with', 'that', 'this',
    'below', 'given', 'study', 'following', 'carefully', 'answer', 'questions', 'beside',
    'each', 'which', 'what', 'find', 'calculate', 'then', 'when', 'will', 'have', 'has', 'were', 'was'
  ]);

  const promoRegex = /(?:1\s*lakh\+|aspirants|achievers|download app|join us|testzone|smartkeeda|toppers|subscribe now|install app|coupon|discount|50%\s*off|test series|selected aspirants)/i;

  let bestPage = null;
  let highestScore = 0;

  for (const page of pageImages) {
    const pageText = page.text || "";
    const normPage = normalizeText(pageText);

    // Skip advertisement cover pages
    if (page.isPromo || (promoRegex.test(pageText) && !normPage.includes("expenditure") && !normPage.includes("question") && !normPage.includes("options"))) {
      continue;
    }

    let score = 0;

    // Check sliding window substring matches of the passage
    if (normPassage.length >= 25) {
      for (let offset = 0; offset <= Math.min(normPassage.length - 25, 120); offset += 20) {
        const windowSlice = normPassage.slice(offset, offset + 35);
        if (normPage.includes(windowSlice)) {
          score += 500;
          break;
        }
      }
    }

    // Token overlap of meaningful domain words
    const words = normFull.split(" ").filter(w => w.length >= 4 && !stopWords.has(w));
    if (words.length > 0) {
      let matched = 0;
      for (const w of words) {
        if (normPage.includes(w)) matched++;
      }
      score += (matched / words.length) * 100;
    }

    // Bonus for explicit chart indicators on page
    if (/(?:pie[\s-]?chart|bar[\s-]?graph|bar[\s-]?chart|line[\s-]?graph|tabular|table)/i.test(pageText)) {
      score += 25;
    }

    if (score > highestScore) {
      highestScore = score;
      bestPage = page;
    }
  }

  // Only attach if there is strong, confident evidence this page contains the DI chart
  if (highestScore >= 30) {
    return bestPage;
  }

  return null;
}

export async function generateMockTestFromPDF({ pdfText, category, timeLimit = "60 min", title, onProgress, signal, pageImages = [] }) {
  if (!pdfText || pdfText.trim().length < 50) {
    throw new Error("PDF text content is too short or empty. Please upload a valid question paper PDF.");
  }

  // Use NVIDIA Nemotron Parse / Vision as Primary for page OCR, with Google Gemini
  // Vision as Secondary fallback for chart/table pages.
  const nvidiaKey = getEnvKey("VITE_NVIDIA_API_KEY") || getEnvKey("NVIDIA_API_KEY");
  const geminiKey = getEnvKey("VITE_GEMINI_API_KEY") || getEnvKey("GEMINI_API_KEY");
  let enrichedText = pdfText;

  if (pageImages.length > 0 && (nvidiaKey || geminiKey)) {
    // Selectively enrich only DI chart / table pages (max 4) rather than bombarding all 19 pages
    const diPages = pageImages.filter(p => !p.isPromo && (p.hasDI || /(?:directions?|chart|graph|table|breakup|ratio|sold by|percentage)/i.test(p.text || ""))).slice(0, 4);
    if (diPages.length > 0) {
      console.log(`[AI Vision] 🖼️ Enriching ${diPages.length} DI chart page(s) with NVIDIA Nemotron Parse (Primary) & Gemini (Secondary)...`);
      if (onProgress) onProgress(0, diPages.length);
      const visionResults = [];
      const BATCH_SIZE = 2;
      for (let i = 0; i < diPages.length; i += BATCH_SIZE) {
        if (signal?.aborted) throw new Error("Extraction cancelled by user.");
        const batch = diPages.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (pageImg, bIdx) => {
          const pageNum = pageImg.pageNum || (i + bIdx + 1);
          try {
            console.log(`[AI Vision] Scanning page ${pageNum} with NVIDIA Nemotron Parse (Primary)...`);
            let visionText = null;
            if (nvidiaKey) {
              visionText = await callNvidiaVisionPage(nvidiaKey, pageImg.base64, pageImg.mimeType || "image/jpeg");
            }
            if (!visionText && geminiKey) {
              console.log(`[AI Vision] NVIDIA unavailable; using Gemini Vision (Secondary) for page ${pageNum}.`);
              visionText = await callGeminiVisionPage(geminiKey, pageImg.base64, pageImg.mimeType || "image/jpeg");
            }
            if (visionText && visionText.length > 30) {
              // Strip accidental re-extracted questions from vision to avoid duplicating questions into enrichedText
              let cleanVisionText = visionText;
              const qOptIdx = cleanVisionText.indexOf("=== QUESTIONS & OPTIONS ===");
              if (qOptIdx !== -1) {
                cleanVisionText = cleanVisionText.substring(0, qOptIdx).trim();
              }
              if (cleanVisionText.length > 25) {
                console.log(`[AI Vision] ✅ Page ${pageNum}: Extracted ${cleanVisionText.length} chars (charts/tables detected)`);
                return `\n\n=== [Page ${pageNum} Vision Extract] ===\n${cleanVisionText}`;
              }
            }
          } catch (err) {
            console.warn(`[AI Vision] Page ${pageNum} vision skipped:`, err.message);
          }
          return null;
        });
        const batchResults = await Promise.all(batchPromises);
        batchResults.filter(Boolean).forEach(res => visionResults.push(res));
        if (onProgress) onProgress(Math.min(i + BATCH_SIZE, diPages.length), diPages.length);
      }
      if (visionResults.length > 0) {
        enrichedText = pdfText + "\n\n" + visionResults.join("\n");
        console.log(`[AI Vision] 📊 Enriched text: ${enrichedText.length} chars (added ${enrichedText.length - pdfText.length} chars of chart/table data)`);
      }
    }
  }

  // Separate questions from solutions and answer keys before chunking
  const { 
    questionsText: questionsOnlyText, 
    solutionsText, 
    solutionsMap, 
    leadingPassage, 
    passageRanges 
  } = isolateQuestionsAndSolutions(enrichedText);

  // Compact, question-aligned batches keep every response below provider limits.
  const chunks = chunkQuestions(questionsOnlyText, 6, 5000);
  let allQuestions = [];
  let completedChunks = 0;

  if (onProgress) onProgress(0, chunks.length);

  const groqKey = getEnvKey("VITE_GROQ_API_KEY") || getEnvKey("GROQ_API_KEY");
  // Build dedicated caller functions for parallel workers
  function makeDirectCaller(name, fn) {
    return async (prompt) => {
      try {
        return await fn(prompt);
      } catch (err) {
        console.warn(`[AI] ${name} direct call failed: ${err.message}`);
        throw err;
      }
    };
  }

  // Create an array of available provider callers: NVIDIA (Primary), Gemini (Secondary), Groq (Fallback)
  const providerCallers = [];
  if (nvidiaKey) providerCallers.push({ name: "NVIDIA", call: (prompt) => callNvidia(nvidiaKey, prompt) });
  if (geminiKey) providerCallers.push({ name: "Gemini", call: (prompt) => callGemini(geminiKey, prompt) });
  if (groqKey)   providerCallers.push({ name: "Groq",   call: (prompt) => callGroq(groqKey, prompt) });

  // How many parallel workers = min(number of providers, 3)
  const CONCURRENCY = Math.min(providerCallers.length, 3) || 1;
  console.log(`[AI] 🚀 Fast extraction active with ${CONCURRENCY} worker(s) (${providerCallers.map(p => p.name).join(" + ") || "Fallback Chain"})`);

  // Each worker gets a preferred provider, with the full chain as fallback
  async function callWithPreferredProvider(prompt, workerIndex) {
    const preferred = providerCallers[workerIndex % providerCallers.length];
    try {
      return await preferred.call(prompt);
    } catch (err) {
      console.warn(`[AI] Worker ${workerIndex} preferred (${preferred.name}) failed: ${err.message}. Trying fallback chain...`);
      for (const provider of providerCallers) {
        if (provider.name === preferred.name) continue;
        try {
          const result = await provider.call(prompt);
          console.log(`[AI] ✅ ${provider.name} succeeded as fallback for Worker ${workerIndex}.`);
          return result;
        } catch (fallbackErr) {
          console.warn(`[AI] ${provider.name} fallback also failed: ${fallbackErr.message}`);
        }
      }
      throw err; // All providers failed
    }
  }

  async function processChunk(chunkInfo, index, workerIndex) {
    if (signal?.aborted) throw new Error("Extraction cancelled by user.");
    const { text: chunk, expectedCount, startQ, endQ } = chunkInfo;

    // Fast-skip non-question chunks (promo, instruction pages, copyright notices) in 0ms
    const hasQMarkers = /(?:[1-9]\d*[\.\)]|\b(?:Q|Question)[\s\.]*\d+|[A-Ea-e][\.\)]\s*\w+)/i.test(chunk);
    if (!hasQMarkers && chunk.length < 2500) {
      console.log(`[AI] ⚡ Chunk ${index + 1}: Skipping non-question segment instantly (0ms)`);
      completedChunks++;
      if (onProgress) onProgress(completedChunks, chunks.length);
      return;
    }

    let chunkQuestions = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[AI] Chunk ${index + 1}: Requesting ${expectedCount} questions ${startQ && endQ ? `(Q${startQ}-Q${endQ})` : ""} (Worker ${workerIndex}, attempt ${attempt + 1})...`);
        const prompt = buildExtractionPrompt(chunk, expectedCount, startQ, endQ);
        let response = await callWithPreferredProvider(prompt, workerIndex);
        
        let parsedQuestions = Array.isArray(response) ? response : (response.questions || []);
        
        // Normalize each question so no questions are silently dropped due to minor format deviations
        parsedQuestions = parsedQuestions.map((q, qIndex) => {
          if (!q) return null;
          const qText = (q.question || q.question_text || "").trim();
          if (!qText) return null;
          const assignedNum = q.question_number || (startQ ? (startQ + qIndex) : null);

          // Normalize options to an array of 5 options
          let opts = [];
          if (Array.isArray(q.options)) {
            opts = q.options.map(o => String(o || "").trim()).filter(Boolean);
          } else if (q.options && typeof q.options === "object") {
            const keys = Object.keys(q.options).sort();
            opts = keys.map(k => String(q.options[k] || "").trim()).filter(Boolean);
          }
          while (opts.length < 5) {
            opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
          }
          if (opts.length > 5) opts = opts.slice(0, 5);

          // Normalize correctAnswerIndex
          let ansIdx = q.correctAnswerIndex;
          if (typeof ansIdx === "string") {
            if (/^[0-4]$/.test(ansIdx.trim())) ansIdx = parseInt(ansIdx.trim(), 10);
            else if (/^[A-Ea-e]$/.test(ansIdx.trim())) ansIdx = ansIdx.trim().toUpperCase().charCodeAt(0) - 65;
            else ansIdx = 0;
          }
          if (typeof ansIdx !== "number" || isNaN(ansIdx) || ansIdx < 0 || ansIdx > 4) {
            if (typeof q.source_answer === "string" && /^[A-Ea-e]$/.test(q.source_answer.trim())) {
              ansIdx = q.source_answer.trim().toUpperCase().charCodeAt(0) - 65;
            } else {
              ansIdx = 0;
            }
          }

          return {
            ...q,
            questionNumber: assignedNum,
            question: qText,
            question_text: qText,
            options: opts,
            correctAnswerIndex: ansIdx,
            passage: q.passage || ""
          };
        }).filter(Boolean);

        if (parsedQuestions.length >= expectedCount || (parsedQuestions.length >= expectedCount - 1 && attempt > 0)) {
          console.log(`[AI] ✅ Success: ${parsedQuestions.length} questions from Chunk ${index + 1}`);
          chunkQuestions = parsedQuestions;
          break;
        } else if (attempt === 0 && expectedCount > 1 && parsedQuestions.length < expectedCount - 1) {
          console.warn(`[AI] Chunk ${index + 1} returned ${parsedQuestions.length}/${expectedCount}; retrying instead of silently dropping questions.`);
        } else {
          console.warn(`[AI] Chunk ${index + 1} extracted: ${parsedQuestions.length} questions.`);
          chunkQuestions = parsedQuestions;
          break;
        }
      } catch (err) {
        if (attempt === 0) {
          console.log(`[AI] Chunk ${index + 1} failed on its first attempt; retrying...`);
        } else {
          console.warn(`[AI] Chunk ${index + 1} extraction failed:`, err.message);
          if (err.message.includes("401") || err.message.includes("API Key")) {
            throw err;
          }
          break;
        }
      }
    }

    if (chunkQuestions.length > 0) {
      allQuestions.push(...chunkQuestions);
    } else {
      console.log(`[AI] Chunk ${index + 1} produced 0 questions.`);
    }

    completedChunks++;
    if (onProgress) onProgress(completedChunks, chunks.length);
  }

  let extractionError = null;

  // Parallel worker pool
  let currentIndex = 0;
  async function worker(workerIndex) {
    while (currentIndex < chunks.length) {
      if (extractionError) break;
      if (signal?.aborted) {
        extractionError = new Error("Extraction cancelled by user.");
        break;
      }
      const idx = currentIndex++;
      try {
        await processChunk(chunks[idx], idx, workerIndex);
      } catch (err) {
        extractionError = err;
        break;
      }
      // Minimal yield to let UI re-render smoothly without artificial delay
      if (currentIndex < chunks.length && !extractionError) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i));
  await Promise.all(workers);

  if (extractionError) {
    throw extractionError; // Bubble up the reason to the UI popup
  }

  let uniqueQuestions = [];
  const seen = new Set();

  for (let i = 0; i < allQuestions.length; i++) {
    const q = allQuestions[i];
    const qText = (q.question || q.question_text || "").trim();
    if (!qText) continue;

    // Filter out accidental extracted solutions (e.g. "Hence option B is correct", "Ans: (b) ...")
    if (/^(?:ans(?:wer)?[\:\s\.\-]|hence\s+option|correct\s+option|solution[\:\s\.\-]|explanation[\:\s\.\-]|according\s+to\s+the\s+given\s+information)/i.test(qText)) {
      continue;
    }
    const isDefaultOptions = Array.isArray(q.options) && 
      q.options.every((opt, idx) => opt === `Option ${String.fromCharCode(65 + idx)}`);
    if (isDefaultOptions && !/\?|which|what|find|how\s+many|who|calculate|arrange|simplify|approximate/i.test(qText)) {
      continue;
    }

    // Normalized question stem (strip leading question numbering, punctuation, extra whitespace)
    const cleanStem = qText
      .toLowerCase()
      .replace(/^(?:(?:question|ques|q)\s*[\.:\-]?\s*)?(?:\(?\s*\d{1,3}\s*[\.\)\:\-]\s*|\(\d{1,3}\)\s*)/i, "")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const optSignature = Array.isArray(q.options) 
      ? q.options.slice(0, 2).map(o => (o || "").toLowerCase().replace(/^\(?[a-ea-e]\)?[\.\:\-\s]*/, "").replace(/[^\w\s]/g, "").trim()).join("::") 
      : "";

    const dedupeKey = cleanStem.length > 20 ? cleanStem : `${cleanStem}:::${optSignature}`;

    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      
      // Automatically detect and attach chart / table images for Quantitative Aptitude DI questions ONLY
      let attachedChartImg = "";
      if (isDIQuestion(q)) {
        const matchedPage = findBestMatchingChartPage(q, pageImages);
        if (matchedPage) {
          attachedChartImg = "data:" + (matchedPage.mimeType || "image/jpeg") + ";base64," + matchedPage.base64;
        }
      }

      // Ensure paragraph-based DI has only the raw text paragraph in passage, and solved table in explanation
      const sanitized = sanitizeDIPassageAndExplanation(q.passage, q.explanation, qText);
      const finalPassage = (q.passage || sanitized.passage || "").trim();

      uniqueQuestions.push({
        id: q.id || `pdf_q_${Date.now()}_${uniqueQuestions.length}`,
        questionNumber: q.questionNumber || (uniqueQuestions.length + 1),
        question: qText,
        question_text: qText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        source_answer: String.fromCharCode(65 + q.correctAnswerIndex),
        passage: finalPassage,
        section: q.section || inferSectionFromContent(qText, finalPassage, q.questionNumber || (uniqueQuestions.length + 1)) || (category?.includes("Bank") ? "Reasoning Ability" : (category || "General")),
        topic: q.topic || "",
        explanation: sanitized.explanation || q.explanation || "",
        imageUrl: attachedChartImg || "",
        chartImageUrl: attachedChartImg || "",
        chartImageUrls: attachedChartImg ? [attachedChartImg] : []
      });
    }
  }

  // 1. Assign passage and accurate section
  for (let i = 0; i < uniqueQuestions.length; i++) {
    const q = uniqueQuestions[i];
    const qNum = q.questionNumber || (i + 1);
    q.questionNumber = qNum;

    // Standard Bank 100-Question section assignment
    const correctSection = inferSectionFromContent(q.question, q.passage, qNum);
    if (correctSection && correctSection !== "General") {
      q.section = correctSection;
    }

    const curP = (q.passage || "").trim();
    if (!curP || curP.length < 25) {
      const matchedRange = passageRanges.find(r => qNum >= r.startNum && qNum <= r.endNum);
      if (matchedRange && matchedRange.passage) {
        q.passage = matchedRange.passage;
      } else if (leadingPassage && i < 5) {
        q.passage = leadingPassage;
      }
    }

    // 2. Map solutions and verified answers from solutionsMap if available
    const solEntry = solutionsMap[qNum];
    if (solEntry) {
      if (!q.explanation || q.explanation.length < 20 || q.explanation.includes("Verification pending")) {
        q.explanation = solEntry.explanation;
        q.solutionText = solEntry.explanation;
      }
      if (solEntry.answerLetter && /^[A-E]$/i.test(solEntry.answerLetter)) {
        q.source_answer = solEntry.answerLetter.toUpperCase();
        q.correctAnswerIndex = solEntry.answerLetter.toUpperCase().charCodeAt(0) - 65;
      }
    }
  }

  // Cap to 100 questions if paper was a standard 100-question paper
  if (uniqueQuestions.length > 100) {
    uniqueQuestions = uniqueQuestions.slice(0, 100);
  }

  // 3. Robust group propagation: propagate shared passage across sets of 5 questions (e.g. Puzzle / RC / DI)
  let currentGroupPassage = "";
  let currentGroupCount = 0;
  for (let i = 0; i < uniqueQuestions.length; i++) {
    const q = uniqueQuestions[i];
    const rawPassage = (q.passage || "").trim();
    if (rawPassage && rawPassage.length > 25) {
      if (rawPassage !== currentGroupPassage) {
        currentGroupPassage = rawPassage;
        currentGroupCount = 1;
      } else {
        currentGroupCount++;
      }
    } else if (currentGroupPassage && currentGroupCount < 5) {
      q.passage = currentGroupPassage;
      currentGroupCount++;
    } else {
      currentGroupPassage = "";
      currentGroupCount = 0;
    }
  }

  if (uniqueQuestions.length === 0) {
    console.warn("AI extraction returned 0 questions. Falling back to regex extraction...");
    uniqueQuestions = regexExtractQuestions(pdfText, category);
  }

  if (uniqueQuestions.length === 0) {
    throw new Error("Extraction failed. No valid questions were found in the PDF by both AI and fallback engines.");
  }

  return {
    id: `mock_${Date.now()}`,
    title: title || `${category} PYQ Test`,
    category,
    questions: uniqueQuestions.length,
    time: timeLimit,
    durationMinutes: parseInt(timeLimit) || 60,
    taken: 0,
    rawExtractedQuestions: uniqueQuestions,
    createdAt: new Date().toISOString(),
  };
}

/**
 * PHASE 3: Background Verification.
 * Iterates through raw extracted questions and verifies them against the AI independently.
 */
export async function verifyQuestionsBackground(questions, onProgress) {
  const verifiedQuestions = [...questions];
  const CONCURRENCY = 3;
  let activePromises = [];
  let completed = 0;

  for (let i = 0; i < questions.length; i++) {
    const p = (async () => {
      let q = { ...questions[i] };
      // If it's already verified (e.g. via local rules or previously), skip.
      if (!q.answer_status) {
        try {
          const prompt = buildVerificationPrompt(q);
          const result = await callLLMChain(prompt);

          // Result might be array of 1 or object
          const v = Array.isArray(result) ? result[0] : result;
          if (v && v.answer_status) {
            q.ai_verified_answer = v.ai_verified_answer;
            q.answer_status = v.answer_status;
            q.verification_explanation = v.verification_explanation;
            q.needs_review = v.needs_review;
            if (v.verification_explanation && (!q.explanation || q.explanation.length < 25 || q.explanation.includes("Verification pending") || q.explanation.startsWith("Verified correct answer"))) {
              q.explanation = v.verification_explanation;
              q.solutionText = v.verification_explanation;
            }
          } else {
            q.answer_status = q.source_answer ? "NEEDS_REVIEW" : "NO_SOURCE_ANSWER";
            q.review_reason = q.source_answer
              ? "Source answer retained. Automated verification did not return a result; review when convenient."
              : "No answer key was found in the uploaded PDF.";
          }
        } catch (err) {
          // Do not block publishing a usable mock when the optional background
          // verifier is offline. The extracted PDF answer is retained.
          q.answer_status = q.source_answer ? "NEEDS_REVIEW" : "NO_SOURCE_ANSWER";
          q.review_reason = q.source_answer
            ? "Source answer retained. Automated verification is currently unavailable."
            : "No answer key was found in the uploaded PDF.";
        }
      }
      verifiedQuestions[i] = q; // Preserve order
      completed++;
      if (onProgress) onProgress(completed, questions.length, verifiedQuestions);
    })();

    activePromises.push(p);
    if (activePromises.length >= CONCURRENCY) {
      await Promise.all(activePromises);
      activePromises = [];
    }
  }

  if (activePromises.length > 0) {
    await Promise.all(activePromises);
  }

  return verifiedQuestions;
}

export async function generateChatbotMockTest(userPrompt) {
  const prompt = `You are an expert exam setter.
The user wants to generate a mock test based on the following request:
"${userPrompt}"

Generate the mock test. Ensure the questions are accurate and difficult enough for the requested exam.
If the user didn't specify the number of questions, default to 10 questions.
If the user didn't specify the time limit, default to 15 min.

Return ONLY valid JSON in the following exact format, with no other text:
{
  "title": "Test Title",
  "category": "Bank Exams", 
  "subject": "Subject Name",
  "topic": "Topic Name",
  "timeLimit": "15 min",
  "questionsCount": 10,
  "questions": [
    {
      "question": "Question text here...",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation..."
    }
  ]
}
`;
  
  const result = await callLLMChain(prompt);
  
  if (!result || (!result.questions && !Array.isArray(result))) {
     throw new Error("AI could not generate questions from your prompt. Try being more specific.");
  }

  const generatedQuestions = result.questions || result;
  
  if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
     throw new Error("AI could not generate valid questions. Please try again.");
  }
  
  return {
    id: `mock_ai_${Date.now()}`,
    title: result.title || "AI Generated Test",
    category: result.category || "General",
    subject: result.subject || "General",
    topic: result.topic || "",
    questions: generatedQuestions.length,
    time: result.timeLimit || "15 min",
    durationMinutes: parseInt(result.timeLimit) || 15,
    taken: 0,
    isFree: false,
    questionsList: generatedQuestions.map((q, i) => {
      let opts = q.options;
      if (!Array.isArray(opts)) {
        if (typeof opts === 'object') {
          opts = Object.values(opts);
        } else {
          opts = ["A", "B", "C", "D"];
        }
      }
      return {
        ...q,
        id: `q_ai_${Date.now()}_${i}`,
        section: q.section || result.subject || "General",
        options: opts,
        correctAnswerIndex: typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
        explanation: q.explanation || "No explanation provided."
      };
    }),
    createdAt: new Date().toISOString(),
  };
}

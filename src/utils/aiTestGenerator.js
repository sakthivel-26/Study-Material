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
export async function callGeminiVisionPage(apiKey, base64Image, mimeType = "image/jpeg") {
  if (!apiKey || typeof apiKey !== "string") return null;
  const cleanKey = apiKey.trim();
  const candidateModels = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.8-flash"];

  const prompt = `You are an expert at reading Indian competitive exam question papers (IBPS, SBI, SSC, TNPSC etc.).
Look at this PDF page image carefully.

Your task: Extract ALL data from any charts, tables, graphs, or diagrams on this page.
Return a structured text description of each chart/table/graph found, followed by the extracted numerical data.

For PIE CHARTS: List each segment label and its percentage value.
For BAR CHARTS: List each bar's category and its value/height.
For LINE CHARTS: List each point's x and y values.
For TABLES: Reproduce the table data in a readable format with column headers and rows.
For DATA INTERPRETATION sets: Include the full directions text AND all chart/table data.

Then, extract all visible text questions and answer options from the page.

Output format:
=== CHART/TABLE DATA ===
[Describe each chart/table with its full data here]

=== QUESTIONS & OPTIONS ===
[All question text and options visible on the page]

If no charts/tables/graphs are present, just output the text content of the page.`;

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
  const model = getEnvKey("VITE_NVIDIA_MODEL") || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 45000); // 45-second timeout

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
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`NVIDIA API error (${response.status}): ${errBody || response.statusText}`);
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";

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
    throw err;
  }
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

const buildExtractionPrompt = (pdfChunk, limit) => `You are a strict data extractor for Indian competitive exam question papers. Extract up to ${limit} questions from this text.
Output a JSON object. No markdown, no extra text outside the JSON block.

FORMAT:
{
  "questions": [
    {
      "passage": "If the question is part of a Reading Comprehension, Puzzle, Seating Arrangement, Data Interpretation (DI), or any group of questions sharing a common paragraph/directions, you MUST copy the ENTIRE shared paragraph verbatim here. Do NOT leave this empty for such questions. For standalone questions, leave as empty string.",
      "question": "Only the specific question being asked (e.g. 'Who sits immediate left of E?'). Do NOT put the puzzle/passage text here.",
      "options": ["option text A", "option text B", "option text C", "option text D"],
      "correctAnswerIndex": 0,
      "explanation": "Provide beginner-friendly step-by-step explanation. For PUZZLE/SEATING ARRANGEMENTS: You MUST include the final solved arrangement as a Markdown table (e.g. | Person | Department | Sport |) followed by Step 1, Step 2 logical deductions.",
      "chart_page_number": null
    }
  ]
}

!!! PUZZLE & SEATING ARRANGEMENT MANDATORY RULE (MANDATORY) !!!
For any Reasoning Puzzle (Floor puzzle, Day/Month scheduling, Box puzzle, Departments & Sports, Circular/Square/Linear Seating Arrangement, Blood Relations):
In the "explanation" field, you MUST generate the complete FINAL SOLVED MATRIX / ARRANGEMENT AS A CLEAN MARKDOWN TABLE (| Person | Department | Sport | or | Floor | Person | Item | etc.) with all entities completely solved!
Followed by:
Step 1: Given Conditions: ...
Step 2: Step-by-Step Logical Working & Elimination: ...
Step 3: Final Answer & Conclusion: ...
DO NOT provide plain words only without the solved table grid! Students require the solved table column to understand the puzzle!

!!! DIRECTION & DISTANCE SENSE QUESTIONS MANDATORY RULE (MANDATORY) !!!
For any Direction & Distance Sense question (walking North/South/East/West, turns, Point A to Point B distances, displacement):
In the "explanation" field, you MUST include a structured Direction Path line at the very top of explanation in this exact format:
[Direction Path: A --(10m North)--> B --(15m East)--> C --(10m South)--> D]
Followed by:
Step 1: Movement & Coordinate Mapping: ...
Step 2: Distance & Direction Calculations (apply Pythagoras theorem if required): ...
Step 3: Final Answer & Conclusion: ...

!!! DATA INTERPRETATION (DI), CHARTS, & TABLES RULE (MANDATORY) !!!
1. ANY question that belongs to a set (Puzzle, Seating Arrangement, Reading Comprehension, Data Interpretation DI):
   - You MUST copy the entire problem description, directions, and shared context into the "passage" field for EVERY question in that set.
   - For TABULAR DATA: You MUST format the table as a clean Markdown table with column headers and rows:
     | Header 1 | Header 2 | Header 3 |
     | Value 1  | Value 2  | Value 3  |
   - For PIE CHARTS, BAR CHARTS, LINE GRAPHS: If numerical values or percentages are mentioned in the directions or in "=== [Page X Vision Extract] ===", list the full breakdown in the "passage" field.
   - Set "chart_page_number" to the integer page number (e.g. 1, 2, 3) where the chart/table appears in the PDF.
   - Do NOT omit table/chart data! Without it, students cannot answer the questions.

OTHER RULES:
- options must be EXACTLY 4 or 5 strings (no labels like 'A)', '(a)', '1.' prefix in the option text itself).
- correctAnswerIndex must be 0, 1, 2, 3, or 4.
- Provide detailed explanation in the "explanation" field.

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
  const models = ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"];
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
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        if (response.status === 429 || response.status === 401) {
          throw new Error(`Groq Rate Limit or Auth Error (${response.status}): ${errText}`); // Fast fail to next provider
        }
        throw new Error(`Groq API Error (${response.status}): ${errText || response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      const text = choice?.message?.content || "{}";
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
      if (err.message.includes("Rate Limit or Auth Error")) {
        break; // Break the model loop and fallback to Gemini/NVIDIA
      }
    }
  }
  throw lastErr || new Error("All Groq models failed.");
}



async function callLLMChain(prompt) {
  const groqKey = getEnvKey("VITE_GROQ_API_KEY") || getEnvKey("GROQ_API_KEY");
  const geminiKey = getEnvKey("VITE_GEMINI_API_KEY") || getEnvKey("GEMINI_API_KEY");
  const nvidiaKey = getEnvKey("VITE_NVIDIA_API_KEY") || getEnvKey("NVIDIA_API_KEY");
  
  const providers = [];
  if (geminiKey) providers.push({ name: "Gemini", fn: () => callGemini(geminiKey, prompt) });
  if (groqKey)   providers.push({ name: "Groq",   fn: () => callGroq(groqKey, prompt) });
  if (nvidiaKey) providers.push({ name: "NVIDIA", fn: () => callNvidia(nvidiaKey, prompt) });

  if (providers.length === 0) {
    throw new Error("No API key configured. Add at least one of: VITE_GROQ_API_KEY, VITE_GEMINI_API_KEY, or VITE_NVIDIA_API_KEY in your .env file.");
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

function regexExtractQuestions(pdfText, category) {
  const cleanText = pdfText.replace(/\r\n/g, '\n');
  const qRegex = /(?:^|\s)(?:Ques|Question|Q)[\s\.]*\d+\s*[\.\)]\s+|(?:^|\s)\d+\s*[\.\)]\s+(?=[A-Z])/i;
  const rawBlocks = cleanText.split(qRegex).filter(b => b.trim().length > 10);
  const uniqueQuestions = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    let qText = block;
    let options = ["Option A", "Option B", "Option C", "Option D"];
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
      while (options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }
    }
    qText = qText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (qText.length > 10 && matches.length > 0) {
      uniqueQuestions.push({
        id: `pdf_q_${Date.now()}_${uniqueQuestions.length}`,
        question: qText,
        question_text: qText,
        options: options,
        correctAnswerIndex: 0,
        source_answer: "A",
        passage: "", // Fallback passage
        section: category || "General",
        explanation: "",
        imageUrl: ""
      });
    }
  }
  return uniqueQuestions;
}

export function isDIQuestion(q) {
  if (!q) return false;
  const passage = (q.passage || "").toLowerCase();
  const qText = (q.question || q.question_text || "").toLowerCase();
  const section = (q.section || q.subject || "").toLowerCase();
  const fullText = `${section} ${passage} ${qText}`;

  // 1. Strict Exclusions: Reasoning & Puzzle questions MUST NEVER be marked as DI or have diagrams attached!
  const isPuzzleOrReasoning = /(?:puzzle|sitting around|seated around|circular table|linear row|facing north|facing south|facing inside|facing outside|facing the centre|facing center|parallel rows|floor puzzle|box puzzle|blood relation|syllogism|statement and conclusion|direction sense|coding[\s-]?decoding|order and ranking|reasoning ability|logical reasoning)/i.test(fullText);
  if (isPuzzleOrReasoning) {
    return false;
  }

  // 2. Strict Inclusions: Must be actual Quantitative Aptitude Data Interpretation (chart/graph/tabular DI)
  const hasDIIndicators = /(?:pie[\s-]?chart|bar[\s-]?graph|bar[\s-]?chart|line[\s-]?graph|line[\s-]?chart|histogram|radar[\s-]?graph|tabular[\s-]?di|given below shows the (?:number|percentage|production|sales|distribution|ratio)|data interpretation|production of|sales of|study the following (?:bar|pie|line|table|chart|graph))/i.test(fullText);

  const isQuants = /(?:quantitative|quants|math|aptitude)/i.test(section) || (!section.includes("reasoning") && !section.includes("english"));

  return isQuants && hasDIIndicators;
}

export function findBestMatchingChartPage(q, pageImages) {
  if (!pageImages || pageImages.length === 0) return null;

  // Strict check: ONLY attach charts to Quantitative Aptitude DI questions, NEVER to puzzles or reasoning!
  if (!isDIQuestion(q)) return null;

  // 1. Direct chart_page_number check if provided and valid
  if (q.chart_page_number) {
    const found = pageImages.find(p => p.pageNum === q.chart_page_number) || pageImages[q.chart_page_number - 1];
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

  if (highestScore >= 35) {
    return bestPage;
  }

  return null;
}

export async function generateMockTestFromPDF({ pdfText, category, timeLimit = "60 min", title, onProgress, signal, pageImages = [] }) {
  if (!pdfText || pdfText.trim().length < 50) {
    throw new Error("PDF text content is too short or empty. Please upload a valid question paper PDF.");
  }

  // If we have page images and a Gemini key, enrich pdfText with vision-extracted chart/table data
  const geminiKey = getEnvKey("VITE_GEMINI_API_KEY") || getEnvKey("GEMINI_API_KEY");
  let enrichedText = pdfText;

  if (pageImages.length > 0 && geminiKey) {
    // Selectively enrich only DI chart / table pages (max 4) rather than bombarding all 19 pages
    const diPages = pageImages.filter(p => !p.isPromo && (p.hasDI || /(?:directions?|chart|graph|table|breakup|ratio|sold by|percentage)/i.test(p.text || ""))).slice(0, 4);
    if (diPages.length > 0) {
      console.log(`[AI Vision] 🖼️ Enriching ${diPages.length} DI chart page(s) with Gemini Vision...`);
      if (onProgress) onProgress(0, diPages.length);
      const visionResults = [];
      const BATCH_SIZE = 2;
      for (let i = 0; i < diPages.length; i += BATCH_SIZE) {
        if (signal?.aborted) throw new Error("Extraction cancelled by user.");
        const batch = diPages.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (pageImg, bIdx) => {
          const pageNum = pageImg.pageNum || (i + bIdx + 1);
          try {
            console.log(`[AI Vision] Scanning page ${pageNum} for charts/tables/graphs...`);
            const visionText = await callGeminiVisionPage(geminiKey, pageImg.base64, pageImg.mimeType || "image/jpeg");
            if (visionText && visionText.length > 50) {
              console.log(`[AI Vision] ✅ Page ${pageNum}: Extracted ${visionText.length} chars (charts/tables detected)`);
              return `\n\n=== [Page ${pageNum} Vision Extract] ===\n${visionText}`;
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

  // Adaptive chunk size: Gemini 3.6 Flash handles large context with thinkingBudget: 0 in < 3s!
  // Use 22,000 characters so typical 5-15 page exam papers process in a SINGLE lightning-fast call.
  const chunkSize = geminiKey ? 22000 : 8000;
  const chunks = chunkText(enrichedText, chunkSize);
  let allQuestions = [];
  let completedChunks = 0;

  if (onProgress) onProgress(0, chunks.length);

  const groqKey = getEnvKey("VITE_GROQ_API_KEY") || getEnvKey("GROQ_API_KEY");
  const nvidiaKey = getEnvKey("VITE_NVIDIA_API_KEY") || getEnvKey("NVIDIA_API_KEY");

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

  // Create an array of available provider callers
  const providerCallers = [];
  if (geminiKey) providerCallers.push({ name: "Gemini", call: (prompt) => callGemini(geminiKey, prompt) });
  if (groqKey)   providerCallers.push({ name: "Groq",   call: (prompt) => callGroq(groqKey, prompt) });
  if (nvidiaKey) providerCallers.push({ name: "NVIDIA", call: (prompt) => callNvidia(nvidiaKey, prompt) });

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

  async function processChunk(chunk, index, workerIndex) {
    if (signal?.aborted) throw new Error("Extraction cancelled by user.");

    // Fast-skip non-question chunks (promo, instruction pages, copyright notices) in 0ms
    const hasQMarkers = /(?:[1-9]\d*[\.\)]|\b(?:Q|Question)[\s\.]*\d+|[A-Ea-e][\.\)]\s*\w+)/i.test(chunk);
    if (!hasQMarkers && chunk.length < 2500) {
      console.log(`[AI] ⚡ Chunk ${index + 1}: Skipping non-question segment instantly (0ms)`);
      completedChunks++;
      if (onProgress) onProgress(completedChunks, chunks.length);
      return;
    }

    let chunkQuestions = [];
    const limits = chunkSize >= 15000 ? [35, 15] : [12, 8];
    let currentLimitIndex = 0;

    while (currentLimitIndex < limits.length) {
      const limit = limits[currentLimitIndex];
      try {
        console.log(`[AI] Chunk ${index + 1}: Requesting up to ${limit} questions (Worker ${workerIndex})...`);
        const prompt = buildExtractionPrompt(chunk, limit);
        let response = await callWithPreferredProvider(prompt, workerIndex);
        
        let parsedQuestions = Array.isArray(response) ? response : (response.questions || []);
        
        // Strict Validation
        parsedQuestions = parsedQuestions.filter(q => {
          return q && 
                 typeof q.question === "string" && 
                 q.question.trim() !== "" &&
                 Array.isArray(q.options) && 
                 (q.options.length === 4 || q.options.length === 5) &&
                 typeof q.correctAnswerIndex === "number" && 
                 q.correctAnswerIndex >= 0 && 
                 q.correctAnswerIndex <= 4;
        });

        if (parsedQuestions.length > 0) {
          console.log(`[AI] ✅ Success: ${parsedQuestions.length} questions from Chunk ${index + 1}`);
          chunkQuestions = parsedQuestions;
          break;
        } else {
          // LLM legitimately parsed the segment and found 0 questions; do not waste time retrying
          console.log(`[AI] Chunk ${index + 1}: Model parsed clean output with 0 questions in this segment.`);
          break;
        }
      } catch (err) {
        if (err.message.includes("max_tokens reached") || err.message.includes("json_validate_failed") || err.message.includes("Failed to validate JSON")) {
          console.log(`[AI] Response truncated or JSON invalid on Chunk ${index + 1} with limit ${limit}. Reducing...`);
        } else {
          console.warn(`[AI] Chunk ${index + 1} extraction failed:`, err.message);
          if (err.message.includes("401") || err.message.includes("API Key")) {
            throw err;
          }
          break;
        }
      }
      currentLimitIndex++;
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

  for (const q of allQuestions) {
    const qText = q.question || q.question_text || "";
    const cleanQ = qText.trim().toLowerCase();
    const optSignature = Array.isArray(q.options) ? q.options.slice(0, 3).join("|").toLowerCase() : "";
    const dedupeKey = `${cleanQ}:::${optSignature}`;
    if (cleanQ && !seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      
      // Automatically detect and attach chart / table images for Quantitative Aptitude DI questions ONLY
      let attachedChartImg = "";
      if (isDIQuestion(q)) {
        const matchedPage = findBestMatchingChartPage(q, pageImages);
        if (matchedPage) {
          attachedChartImg = "data:" + (matchedPage.mimeType || "image/jpeg") + ";base64," + matchedPage.base64;
        }
      }

      uniqueQuestions.push({
        id: q.id || `pdf_q_${Date.now()}_${uniqueQuestions.length}`,
        question: qText,
        question_text: qText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        source_answer: String.fromCharCode(65 + q.correctAnswerIndex),
        passage: q.passage || "",
        section: category || "General",
        explanation: q.explanation || "",
        imageUrl: attachedChartImg || "",
        chartImageUrl: attachedChartImg || "",
        chartImageUrls: attachedChartImg ? [attachedChartImg] : []
      });
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

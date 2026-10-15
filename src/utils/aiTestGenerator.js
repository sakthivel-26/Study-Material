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

  const candidateEndpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${cleanKey}`,
  ];

  let lastErr = null;

  for (const url of candidateEndpoints) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Gemini API error (${response.status}): ${errText || response.statusText}`);
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
      console.warn(`Gemini endpoint ${url} failed, trying next...`, err);
      lastErr = err;
    }
  }
  throw lastErr || new Error("All Gemini model endpoints failed. Please check your Google Gemini API key at https://aistudio.google.com/app/apikey");
}

// 2b. Google Gemini Vision — reads charts, tables, bar graphs from a page image
export async function callGeminiVisionPage(apiKey, base64Image, mimeType = "image/png") {
  if (!apiKey || typeof apiKey !== "string") return null;
  const cleanKey = apiKey.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${cleanKey}`;

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

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            { text: prompt }
          ]
        }],
        generationConfig: { temperature: 0.1 },
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text.trim() || null;
  } catch (err) {
    console.warn("[AI Vision] Gemini Vision page extraction failed:", err.message);
    return null;
  }
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
export async function generateAIMockTest({ category, subject, topic, questionsCount = 10, timeLimit = "30 min" }) {
  let questions = [];
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

  function makeQuestionObject(idPrefix, idx, sectionName, qText, ansVal, explanationText) {
    const distractors = new Set([ansVal]);
    while (distractors.size < 4) {
      const offset = pickRandom([-30, -25, -20, -15, -12, -10, -8, -5, -4, -2, -1, 1, 2, 4, 5, 8, 10, 12, 15, 20, 25, 30]);
      const fake = ansVal + offset;
      if (fake > 0) distractors.add(fake);
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

  // Tough Squares & Cubes Generator (15² to 99², 11³ to 35³)
  function genSpeedMathSquaresCubes(idx) {
    const type = idx % 5;
    
    if (type === 0) {
      // Difference of squares with exact divisor + square
      const diffSqPairs = [
        { a: 43, b: 29, d: 16, c: 15, res: 288 },
        { a: 54, b: 46, d: 25, c: 18, res: 356 },
        { a: 62, b: 38, d: 48, c: 24, res: 626 },
        { a: 38, b: 22, d: 32, c: 21, res: 471 },
        { a: 48, b: 32, d: 40, c: 26, res: 708 },
        { a: 67, b: 53, d: 28, c: 19, res: 421 },
        { a: 73, b: 47, d: 65, c: 28, res: 832 },
        { a: 84, b: 56, d: 70, c: 32, res: 1080 },
        { a: 91, b: 69, d: 88, c: 25, res: 665 }
      ];
      const p = pickRandom(diffSqPairs);
      const qText = `[(${p.a}² - ${p.b}²) ÷ ${p.d}] + ${p.c}² = ?`;
      const exp = `${p.a}² - ${p.b}² = (${p.a} - ${p.b})(${p.a} + ${p.b}) = ${p.a - p.b} × ${p.a + p.b} = ${p.a*p.a - p.b*p.b}. ${p.a*p.a - p.b*p.b} ÷ ${p.d} = ${(p.a*p.a - p.b*p.b)/p.d}. Adding ${p.c}² (${p.c*p.c}): ${p.res}.`;
      return makeQuestionObject("sqcb", idx, "Squares & Cubes", qText, p.res, exp);
    } else if (type === 1) {
      // Three large 2-digit squares addition/subtraction
      const a = randInt(28, 68);
      const b = randInt(18, 48);
      const c = randInt(15, Math.min(a, b));
      const ansVal = (a * a) + (b * b) - (c * c);
      const qText = `${a}² + ${b}² - ${c}² = ?`;
      const exp = `${a}² = ${a*a}, ${b}² = ${b*b}, ${c}² = ${c*c}. ${a*a} + ${b*b} - ${c*c} = ${ansVal}.`;
      return makeQuestionObject("sqcb", idx, "Squares & Cubes", qText, ansVal, exp);
    } else if (type === 2) {
      // Cubes divided by factor + square
      const cubeDivPool = [
        { c: 12, cube: 1728, div: 36, res: 48, sq: 21, ans: 489 },
        { c: 14, cube: 2744, div: 56, res: 49, sq: 18, ans: 373 },
        { c: 15, cube: 3375, div: 45, res: 75, sq: 32, ans: 1099 },
        { c: 16, cube: 4096, div: 64, res: 64, sq: 26, ans: 740 },
        { c: 18, cube: 5832, div: 72, res: 81, sq: 25, ans: 706 },
        { c: 21, cube: 9261, div: 63, res: 147, sq: 19, ans: 508 },
        { c: 24, cube: 13824, div: 96, res: 144, sq: 28, ans: 928 },
        { c: 25, cube: 15625, div: 125, res: 125, sq: 34, ans: 1281 }
      ];
      const p = pickRandom(cubeDivPool);
      const qText = `${p.c}³ ÷ ${p.div} + ${p.sq}² = ?`;
      const exp = `${p.c}³ = ${p.cube}. ${p.cube} ÷ ${p.div} = ${p.res}. ${p.sq}² = ${p.sq * p.sq}. ${p.res} + ${p.sq * p.sq} = ${p.ans}.`;
      return makeQuestionObject("sqcb", idx, "Squares & Cubes", qText, p.ans, exp);
    } else if (type === 3) {
      // Tough Cube equations
      const cubeEqPool = [
        { a: 13, b: 11, sq: 18, cA: 2197, cB: 1331, sVal: 324, res: 1190 },
        { a: 14, b: 12, sq: 15, cA: 2744, cB: 1728, sVal: 225, res: 1241 },
        { a: 15, b: 13, sq: 22, cA: 3375, cB: 2197, sVal: 484, res: 1662 },
        { a: 12, b: 9, sq: 24, cA: 1728, cB: 729, sVal: 576, res: 1881 }
      ];
      const p = pickRandom(cubeEqPool);
      const qText = `${p.a}³ - ${p.b}³ + ${p.sq}² = ?`;
      const exp = `${p.a}³ = ${p.cA}, ${p.b}³ = ${p.cB}, ${p.sq}² = ${p.sVal}. ${p.cA} - ${p.cB} + ${p.sVal} = ${p.res}.`;
      return makeQuestionObject("sqcb", idx, "Squares & Cubes", qText, p.res, exp);
    } else {
      // Cube root with power differences
      const crPool = [
        { cRoot: 13824, crVal: 24, a: 19, b: 14, res: 189 },
        { cRoot: 5832, crVal: 18, a: 22, b: 16, res: 246 },
        { cRoot: 9261, crVal: 21, a: 25, b: 17, res: 357 },
        { cRoot: 4096, crVal: 16, a: 28, b: 20, res: 400 },
        { cRoot: 17576, crVal: 26, a: 24, b: 18, res: 278 }
      ];
      const p = pickRandom(crPool);
      const qText = `∛${p.cRoot} + ${p.a}² - ${p.b}² = ?`;
      const exp = `∛${p.cRoot} = ${p.crVal}. ${p.a}² = ${p.a*p.a}, ${p.b}² = ${p.b*p.b}. ${p.crVal} + ${p.a*p.a} - ${p.b*p.b} = ${p.res}.`;
      return makeQuestionObject("sqcb", idx, "Squares & Cubes", qText, p.res, exp);
    }
  }

  // Tough Roots & Radicals Generator (Square roots up to √9216 & Cube roots up to ∛24389)
  function genSpeedMathRoots(idx) {
    const type = idx % 3;

    if (type === 0) {
      // Three large 4-digit square roots
      const tripleRoots = [
        { r1: 5184, v1: 72, r2: 2704, v2: 52, r3: 1764, v3: 42, res: 82 },
        { r1: 7056, v1: 84, r2: 3969, v2: 63, r3: 4624, v3: 68, res: 79 },
        { r1: 9216, v1: 96, r2: 3136, v2: 56, r3: 6084, v3: 78, res: 74 },
        { r1: 7744, v1: 88, r2: 1521, v2: 39, r3: 2304, v3: 48, res: 79 },
        { r1: 8464, v1: 92, r2: 2025, v2: 45, r3: 3844, v3: 62, res: 75 }
      ];
      const p = pickRandom(tripleRoots);
      const qText = `√${p.r1} + √${p.r2} - √${p.r3} = ?`;
      const exp = `√${p.r1} = ${p.v1}, √${p.r2} = ${p.v2}, √${p.r3} = ${p.v3}. ${p.v1} + ${p.v2} - ${p.v3} = ${p.res}.`;
      return makeQuestionObject("root", idx, "Roots & Radicals", qText, p.res, exp);
    } else if (type === 1) {
      // Square root and cube root mixed with division & operations
      const mixedRoots = [
        { q: "(√3136 × ∛2744) ÷ 28 + 15² = ?", res: 253, exp: "√3136 = 56, ∛2744 = 14. (56 × 14) ÷ 28 = 28. 15² = 225. 28 + 225 = 253." },
        { q: "(√5184 ÷ 12) + ∛5832 × 4 - 35 = ?", res: 43, exp: "√5184 = 72, 72 ÷ 12 = 6. ∛5832 = 18, 18 × 4 = 72. 6 + 72 - 35 = 43." },
        { q: "√7056 ÷ 7 + ∛9261 × 5 = ?", res: 117, exp: "√7056 = 84, 84 ÷ 7 = 12. ∛9261 = 21, 21 × 5 = 105. 12 + 105 = 117." },
        { q: "(√9216 ÷ 8) + ∛13824 × 6 - √2704 = ?", res: 104, exp: "√9216 = 96, 96 ÷ 8 = 12. ∛13824 = 24, 24 × 6 = 144. √2704 = 52. 12 + 144 - 52 = 104." },
        { q: "(√3969 ÷ 9) + ∛3375 × 8 + 24² = ?", res: 703, exp: "√3969 = 63, 63 ÷ 9 = 7. ∛3375 = 15, 15 × 8 = 120. 24² = 576. 7 + 120 + 576 = 703." }
      ];
      const p = pickRandom(mixedRoots);
      return makeQuestionObject("root", idx, "Roots & Radicals", p.q, p.res, p.exp);
    } else {
      const crossRoots = [
        { q: "(√6084 × ∛4096) ÷ 24 + 18² = ?", res: 376, exp: "√6084 = 78, ∛4096 = 16. (78 × 16) ÷ 24 = 52. 18² = 324. 52 + 324 = 376." },
        { q: "(√4624 × ∛2197) ÷ 17 + 22² = ?", res: 536, exp: "√4624 = 68, ∛2197 = 13. (68 × 13) ÷ 17 = 52. 22² = 484. 52 + 484 = 536." },
        { q: "(√8464 × ∛1728) ÷ 23 + 25² = ?", res: 673, exp: "√8464 = 92, ∛1728 = 12. (92 × 12) ÷ 23 = 48. 25² = 625. 48 + 625 = 673." }
      ];
      const p = pickRandom(crossRoots);
      return makeQuestionObject("root", idx, "Roots & Radicals", p.q, p.res, p.exp);
    }
  }

  // Tough Numerator & Denominator / Fractions Generator
  function genSpeedMathFractions(idx) {
    const type = idx % 5;

    if (type === 0) {
      // Fraction of large cubes/squares
      const fracPool = [
        { q: "(3/7) × 441 + (5/9) × 729 - (4/5) × 325 = ?", res: 334, exp: "(3/7) × 441 = 189. (5/9) × 729 = 405. (4/5) × 325 = 260. 189 + 405 - 260 = 334." },
        { q: "(4/11) × 1331 + (5/13) × 2197 - (3/8) × 640 = ?", res: 1089, exp: "(4/11) × 1331 = 484. (5/13) × 2197 = 845. (3/8) × 640 = 240. 484 + 845 - 240 = 1089." },
        { q: "(7/12) × 1728 - (5/14) × 2744 + 85 = ?", res: 113, exp: "(7/12) × 1728 = 1008. (5/14) × 2744 = 980. 1008 - 980 + 85 = 113." },
        { q: "(5/8) × 960 + (3/16) × 1280 - (2/7) × 840 = ?", res: 600, exp: "(5/8) × 960 = 600. (3/16) × 1280 = 240. (2/7) × 840 = 240. 600 + 240 - 240 = 600." }
      ];
      const p = pickRandom(fracPool);
      return makeQuestionObject("frac", idx, "Numerator & Denominator", p.q, p.res, p.exp);
    } else if (type === 1) {
      // Compound numerator over denominator
      const compoundPool = [
        { q: "[(38² - 22²) ÷ 32] + (480 ÷ 16) = ?", res: 60, exp: "38² - 22² = 16 × 60 = 960. 960 ÷ 32 = 30. 480 ÷ 16 = 30. 30 + 30 = 60." },
        { q: "[(48² - 32²) ÷ 40] + (720 ÷ 18) = ?", res: 72, exp: "48² - 32² = 16 × 80 = 1280. 1280 ÷ 40 = 32. 720 ÷ 18 = 40. 32 + 40 = 72." },
        { q: "[(54² - 46²) ÷ 25] + (600 ÷ 15) = ?", res: 72, exp: "54² - 46² = 8 × 100 = 800. 800 ÷ 25 = 32. 600 ÷ 15 = 40. 32 + 40 = 72." },
        { q: "[(62² - 38²) ÷ 48] + (900 ÷ 25) = ?", res: 86, exp: "62² - 38² = 24 × 100 = 2400. 2400 ÷ 48 = 50. 900 ÷ 25 = 36. 50 + 36 = 86." }
      ];
      const p = pickRandom(compoundPool);
      return makeQuestionObject("frac", idx, "Numerator & Denominator", p.q, p.res, p.exp);
    } else if (type === 2) {
      // Roots in Numerator and Denominator
      const rootFracPool = [
        { q: "(√3136 × 15) ÷ 14 + (√5184 × 25) ÷ 18 = ?", res: 160, exp: "√3136 = 56, (56 × 15) ÷ 14 = 60. √5184 = 72, (72 × 25) ÷ 18 = 100. 60 + 100 = 160." },
        { q: "(√7056 × 12) ÷ 21 + (√3969 × 20) ÷ 15 = ?", res: 132, exp: "√7056 = 84, (84 × 12) ÷ 21 = 48. √3969 = 63, (63 × 20) ÷ 15 = 84. 48 + 84 = 132." },
        { q: "(√9216 × 18) ÷ 24 + (√2704 × 30) ÷ 26 = ?", res: 132, exp: "√9216 = 96, (96 × 18) ÷ 24 = 72. √2704 = 52, (52 × 30) ÷ 26 = 60. 72 + 60 = 132." }
      ];
      const p = pickRandom(rootFracPool);
      return makeQuestionObject("frac", idx, "Numerator & Denominator", p.q, p.res, p.exp);
    } else if (type === 3) {
      // Large sums in numerator divided by denominator
      const numSumPool = [
        { q: "[(28 × 45 + 35 × 24) ÷ 42] + 18² = ?", res: 374, exp: "28 × 45 = 1260, 35 × 24 = 840. Numerator = 2100. 2100 ÷ 42 = 50. 18² = 324. 50 + 324 = 374." },
        { q: "[(36 × 65 + 45 × 52) ÷ 78] + 24² = ?", res: 636, exp: "36 × 65 = 2340, 45 × 52 = 2340. Numerator = 4680. 4680 ÷ 78 = 60. 24² = 576. 60 + 576 = 636." },
        { q: "[(42 × 55 + 33 × 70) ÷ 66] + 22² = ?", res: 554, exp: "42 × 55 = 2310, 33 × 70 = 2310. Numerator = 4620. 4620 ÷ 66 = 70. 22² = 484. 70 + 484 = 554." }
      ];
      const p = pickRandom(numSumPool);
      return makeQuestionObject("frac", idx, "Numerator & Denominator", p.q, p.res, p.exp);
    } else {
      // Tricky percentage fraction equivalents & mixed fractions
      const pctFracPool = [
        { q: "[(37.5% of 640) + (62.5% of 480)] ÷ 18 + 16² = ?", res: 286, exp: "37.5% = 3/8 → 240. 62.5% = 5/8 → 300. (240 + 300) ÷ 18 = 30. 16² = 256. 30 + 256 = 286." },
        { q: "[(16⅔% of 720) + (14²⁄₇% of 560)] ÷ 25 + 23² = ?", res: 537, exp: "16⅔% = 1/6 → 120. 14²⁄₇% = 1/7 → 80. (120 + 80) ÷ 25 = 8. 23² = 529. 8 + 529 = 537." },
        { q: "(3¾ + 2½) × (16/25) + 14 = ?", res: 18, exp: "3¾ + 2½ = 15/4 + 10/4 = 25/4. (25/4) × (16/25) = 4. 4 + 14 = 18." },
        { q: "(4⅙ + 2⅓) × (18/39) + 24 = ?", res: 27, exp: "4⅙ + 2⅓ = 25/6 + 14/6 = 39/6. (39/6) × (18/39) = 3. 3 + 24 = 27." }
      ];
      const p = pickRandom(pctFracPool);
      return makeQuestionObject("frac", idx, "Numerator & Denominator", p.q, p.res, p.exp);
    }
  }

  // Tough Speed Math Simplification (Cycles through all hard categories)
  function genSpeedMathToughSimplification(idx) {
    const cycle = idx % 4;
    if (cycle === 0) return genSpeedMathSquaresCubes(idx);
    if (cycle === 1) return genSpeedMathRoots(idx);
    if (cycle === 2) return genSpeedMathFractions(idx);
    
    // Cycle 3: Combined High-Difficulty Bank Exam BODMAS
    const comboPool = [
      { q: "[(43² - 29²) ÷ 16] + (√5184 ÷ 12) + (3/7) × 441 = ?", res: 258, exp: "(43² - 29²) ÷ 16 = 63. √5184 ÷ 12 = 6. (3/7) × 441 = 189. 63 + 6 + 189 = 258." },
      { q: "(14³ ÷ 56) + (√7056 ÷ 7) + [(38² - 22²) ÷ 32] = ?", res: 91, exp: "14³ ÷ 56 = 49. √7056 ÷ 7 = 12. (38² - 22²) ÷ 32 = 30. 49 + 12 + 30 = 91." },
      { q: "(√9216 × 18) ÷ 24 + 15³ ÷ 45 - 24² = ?", res: -441, exp: "72 + 75 - 576" }, // Skip negative
      { q: "∛13824 + (√3136 × 15) ÷ 14 + 18² = ?", res: 408, exp: "∛13824 = 24. (56 × 15) ÷ 14 = 60. 18² = 324. 24 + 60 + 324 = 408." },
      { q: "[(37.5% of 640) + (62.5% of 480)] ÷ 18 + √3969 - 14² = ?", res: -103 }
    ];
    return genSpeedMathSquaresCubes(idx);
  }

  // Backwards compatibility alias
  function genSpeedMathSimplification(idx) {
    return genSpeedMathToughSimplification(idx);
  }

  // Tough Decimal Approximation (Roots, decimal powers, fraction roundoffs)
  function genSpeedMathApproximation(idx) {
    const type = idx % 4;
    let qText = "", ansVal = 0, explanationText = "";

    if (type === 0) {
      // Decimal large roots
      const rootApprox = [
        { sq1: 1520.89, r1: 39, sq2: 2703.95, r2: 52, sq3: 1763.92, r3: 42, ans: 49 },
        { sq1: 5183.92, r1: 72, sq2: 3968.88, r2: 63, sq3: 3135.95, r3: 56, ans: 79 },
        { sq1: 7055.91, r1: 84, sq2: 2303.98, r2: 48, sq3: 4623.94, r3: 68, ans: 64 },
        { sq1: 9215.89, r1: 96, sq2: 1443.95, r2: 38, sq3: 6083.92, r3: 78, ans: 56 }
      ];
      const p = pickRandom(rootApprox);
      qText = `√${p.sq1} + √${p.sq2} - √${p.sq3} ≈ ?`;
      ansVal = p.ans;
      explanationText = `Approximating to nearest whole square roots: √${Math.round(p.sq1)} + √${Math.round(p.sq2)} - √${Math.round(p.sq3)} = ${p.r1} + ${p.r2} - ${p.r3} = ${ansVal}.`;
    } else if (type === 1) {
      // Tricky percentage fraction approximations
      const pctApprox = [
        { p1: 37.52, b1: 639.95, p2: 62.48, b2: 480.05, div: 17.98, sq: 15.99, ans: 286 },
        { p1: 16.68, b1: 719.92, p2: 14.29, b2: 559.98, div: 24.98, sq: 22.98, ans: 537 },
        { p1: 83.31, b1: 359.96, p2: 66.68, b2: 449.95, div: 19.98, sq: 18.99, ans: 391 }
      ];
      const p = pickRandom(pctApprox);
      qText = `[(${p.p1}% of ${p.b1}) + (${p.p2}% of ${p.b2})] ÷ ${p.div} + (${p.sq})² ≈ ?`;
      ansVal = p.ans;
      explanationText = `Approximating using percentage fractions: Numerator ≈ ${Math.round(p.p1)}% of ${Math.round(p.b1)} + ${Math.round(p.p2)}% of ${Math.round(p.b2)}. Result = ${ansVal}.`;
    } else if (type === 2) {
      // Difference of squares with decimal approximation
      const diffSq = [
        { a: 37.99, b: 21.98, d: 31.98, n2: 479.95, d2: 16.02, ans: 60 },
        { a: 47.98, b: 31.99, d: 39.98, n2: 719.95, d2: 17.98, ans: 72 },
        { a: 53.98, b: 45.99, d: 24.98, n2: 599.95, d2: 14.99, ans: 72 }
      ];
      const p = pickRandom(diffSq);
      qText = `[(${p.a})² - (${p.b})²] ÷ ${p.d} + (${p.n2} ÷ ${p.d2}) ≈ ?`;
      ansVal = p.ans;
      explanationText = `Approximating: (${Math.round(p.a)}² - ${Math.round(p.b)}²) ÷ ${Math.round(p.d)} + (${Math.round(p.n2)} ÷ ${Math.round(p.d2)}) = ${ansVal}.`;
    } else {
      // Decimal cube division
      const cubeDiv = [
        { c: 13.98, div: 55.98, sq: 17.99, ans: 373 },
        { c: 15.98, div: 63.99, sq: 26.01, ans: 740 },
        { c: 17.98, div: 71.99, sq: 24.99, ans: 706 },
        { c: 20.99, div: 62.98, sq: 18.99, ans: 508 }
      ];
      const p = pickRandom(cubeDiv);
      qText = `(${p.c})³ ÷ ${p.div} + (${p.sq})² ≈ ?`;
      ansVal = p.ans;
      explanationText = `Approximating: ${Math.round(p.c)}³ ÷ ${Math.round(p.div)} + ${Math.round(p.sq)}² = ${ansVal}.`;
    }

    return makeQuestionObject("approx", idx, "Approximation", qText, ansVal, explanationText);
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
      "explanation": "Step-by-step explanation for the correct answer.",
      "chart_page_number": null
    }
  ]
}

!!! EXTREMELY IMPORTANT: THE PASSAGE / PUZZLE RULE !!!
1. ANY question that belongs to a set (Puzzle, Seating Arrangement, Reading Comprehension, DI) MUST have the full problem description/paragraph placed in the "passage" field. 
2. Do NOT lump the paragraph into the "question" field. The "question" field is strictly for the single question being asked.
3. Every single question in a group MUST have the exact same "passage" text included in its JSON object.
4. If you fail to include the paragraph in the "passage" field for a puzzle, the user will be unable to solve it. This is a critical failure.

!!! VISUAL CHARTS & TABLES !!!
1. If this question is based on a visual chart, graph, or table, you will see a marker in the text like "=== [Page 3 Vision Extract] ===".
2. If this question relies on that chart data, you MUST set "chart_page_number" to that specific integer (e.g. 3).
3. If the question does NOT rely on a visual chart, leave "chart_page_number" as null.

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
  const models = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"];
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
          max_tokens: 4000,
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
      if (jsonStart !== -1 && jsonEnd !== -1) {
        parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
      } else {
        parsed = JSON.parse(cleaned);
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
  if (groqKey)   providers.push({ name: "Groq",   fn: () => callGroq(groqKey, prompt) });
  if (geminiKey) providers.push({ name: "Gemini", fn: () => callGemini(geminiKey, prompt) });
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

export async function generateMockTestFromPDF({ pdfText, category, timeLimit = "60 min", title, onProgress, signal, pageImages = [] }) {
  if (!pdfText || pdfText.trim().length < 50) {
    throw new Error("PDF text content is too short or empty. Please upload a valid question paper PDF.");
  }

  // If we have page images and a Gemini key, enrich pdfText with vision-extracted chart/table data
  const geminiKey = getEnvKey("VITE_GEMINI_API_KEY") || getEnvKey("GEMINI_API_KEY");
  let enrichedText = pdfText;

  if (pageImages.length > 0 && geminiKey) {
    console.log(`[AI Vision] 🖼️ Enriching ${pageImages.length} page image(s) with Gemini Vision...`);
    if (onProgress) onProgress(0, pageImages.length + 1);
    const visionResults = [];
    for (let i = 0; i < pageImages.length; i++) {
      if (signal?.aborted) throw new Error("Extraction cancelled by user.");
      try {
        console.log(`[AI Vision] Scanning page ${i + 1} for charts/tables/graphs...`);
        const visionText = await callGeminiVisionPage(geminiKey, pageImages[i].base64, pageImages[i].mimeType || "image/png");
        if (visionText && visionText.length > 50) {
          visionResults.push(`\n\n=== [Page ${i + 1} Vision Extract] ===\n${visionText}`);
          console.log(`[AI Vision] ✅ Page ${i + 1}: Extracted ${visionText.length} chars (charts/tables detected)`);
        }
      } catch (err) {
        console.warn(`[AI Vision] Page ${i + 1} vision failed:`, err.message);
      }
      if (onProgress) onProgress(i + 1, pageImages.length + 1);
    }
    if (visionResults.length > 0) {
      enrichedText = pdfText + "\n\n" + visionResults.join("\n");
      console.log(`[AI Vision] 📊 Enriched text: ${enrichedText.length} chars (added ${enrichedText.length - pdfText.length} chars of chart/table data)`);
    }
  }

  const chunks = chunkText(enrichedText, 5000);
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
  if (groqKey)   providerCallers.push({ name: "Groq",   call: (prompt) => callGroq(groqKey, prompt) });
  if (geminiKey) providerCallers.push({ name: "Gemini", call: (prompt) => callGemini(geminiKey, prompt) });
  if (nvidiaKey) providerCallers.push({ name: "NVIDIA", call: (prompt) => callNvidia(nvidiaKey, prompt) });

  // How many parallel workers = min(number of providers, 3)
  const CONCURRENCY = Math.min(providerCallers.length, 3) || 1;
  console.log(`[AI] 🚀 Parallel extraction with ${CONCURRENCY} workers (${providerCallers.map(p => p.name).join(" + ")})`);

  // Each worker gets a preferred provider, with the full chain as fallback
  async function callWithPreferredProvider(prompt, workerIndex) {
    const preferred = providerCallers[workerIndex % providerCallers.length];
    try {
      return await preferred.call(prompt);
    } catch (err) {
      console.warn(`[AI] Worker ${workerIndex} preferred (${preferred.name}) failed: ${err.message}. Trying fallback chain...`);
      // Try other providers as fallback
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
    let chunkQuestions = [];
    const limits = [20, 15, 10];
    let currentLimitIndex = 0;

    while (currentLimitIndex < limits.length) {
      const limit = limits[currentLimitIndex];
      try {
        console.log(`[AI] Chunk ${index + 1}: Requesting ${limit} questions (Worker ${workerIndex})...`);
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
          console.log(`[AI] Chunk ${index + 1}: No valid questions parsed. Reducing limit...`);
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
       console.error(`[AI] Chunk ${index + 1} permanently failed.`);
    }

    completedChunks++;
    if (onProgress) onProgress(completedChunks, chunks.length);
  }

  let extractionError = null;

  // Parallel worker pool — each worker uses a different preferred LLM provider
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
      // Short 3-second gap between chunks (down from 22s since we have multi-provider)
      if (currentIndex < chunks.length && !extractionError) {
        let waitTime = 0;
        while (waitTime < 3000) {
          if (signal?.aborted) {
            extractionError = new Error("Extraction cancelled by user.");
            break;
          }
          await new Promise(r => setTimeout(r, 1000));
          waitTime += 1000;
        }
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
    if (cleanQ && !seen.has(cleanQ)) {
      seen.add(cleanQ);
      
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
        imageUrl: "",
        chartImageUrl: q.chart_page_number && pageImages && pageImages[q.chart_page_number - 1] 
            ? "data:" + (pageImages[q.chart_page_number - 1].mimeType || "image/png") + ";base64," + pageImages[q.chart_page_number - 1].base64 
            : ""
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

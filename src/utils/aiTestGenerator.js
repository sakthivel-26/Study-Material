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
  if (category === "Speed Math (Simplification)") {
    return `You are a strict math problem generator. Generate EXACTLY ${questionsCount} Speed Math Simplification questions.
Questions MUST be raw mathematical equations (e.g. "45% of 600 + 15 = ?", "12² - 8² = ?", "15 × 8 + 40 ÷ 8 = ?").
NO word problems. ONLY numerical equations. Options MUST be mathematically accurate.
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

  if (category === "Speed Math (Approximation)") {
    return `You are a strict math problem generator. Generate EXACTLY ${questionsCount} Speed Math Approximation questions.
Questions MUST involve decimals where the user must approximate to the nearest integer (e.g. "14.98 + 25.02 - 9.99 = ?", "45.01% of 599.98 = ?").
NO word problems. ONLY numerical equations. Options MUST be mathematically accurate.
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`,
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
async function callNvidia(apiKey, prompt, model = "nvidia/nemotron-3-nano-30b-a3b") {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 35000); // 35-second timeout

  try {
    const response = await fetch("/api/nvidia/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
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

  function genSpeedMathSimplification(idx) {
    const type = idx % 5;
    let qText = "", ansVal = 0, explanationText = "";

    if (type === 0) {
      const pct = pickRandom([15, 20, 25, 30, 40, 50, 60, 75]);
      const base = pickRandom([200, 300, 400, 500, 600, 800, 1200]);
      const add = pickRandom([25, 45, 50, 75, 100, 150]);
      ansVal = (pct / 100) * base + add;
      qText = `${pct}% of ${base} + ${add} = ?`;
      explanationText = `${pct}% of ${base} = ${(pct / 100) * base}. Adding ${add}: ${(pct / 100) * base} + ${add} = ${ansVal}.`;
    } else if (type === 1) {
      const a = randInt(12, 25);
      const b = randInt(5, 11);
      const c = randInt(10, 50);
      ansVal = (a * a) - (b * b) + c;
      qText = `${a}² - ${b}² + ${c} = ?`;
      explanationText = `${a}² = ${a * a}, ${b}² = ${b * b}. So ${a * a} - ${b * b} + ${c} = ${ansVal}.`;
    } else if (type === 2) {
      const a = randInt(12, 25);
      const b = randInt(4, 15);
      const d = pickRandom([4, 5, 8, 10]);
      const multD = randInt(4, 20);
      const c = d * multD;
      ansVal = (a * b) + (c / d);
      qText = `${a} × ${b} + ${c} ÷ ${d} = ?`;
      explanationText = `${a} × ${b} = ${a * b}. ${c} ÷ ${d} = ${c / d}. Total = ${a * b} + ${c / d} = ${ansVal}.`;
    } else if (type === 3) {
      const roots = [
        { sq: 400, r: 20 }, { sq: 576, r: 24 }, { sq: 625, r: 25 },
        { sq: 784, r: 28 }, { sq: 900, r: 30 }, { sq: 1024, r: 32 },
        { sq: 1296, r: 36 }, { sq: 1600, r: 40 }, { sq: 2025, r: 45 }
      ];
      const r1 = pickRandom(roots);
      const r2 = pickRandom(roots);
      const r3 = pickRandom([{ sq: 144, r: 12 }, { sq: 196, r: 14 }, { sq: 256, r: 16 }, { sq: 324, r: 18 }]);
      ansVal = r1.r + r2.r - r3.r;
      qText = `√${r1.sq} + √${r2.sq} - √${r3.sq} = ?`;
      explanationText = `√${r1.sq} = ${r1.r}, √${r2.sq} = ${r2.r}, √${r3.sq} = ${r3.r}. ${r1.r} + ${r2.r} - ${r3.r} = ${ansVal}.`;
    } else {
      const b = pickRandom([3, 4, 5, 8]);
      const multB = randInt(4, 15);
      const a = b * multB;
      const c = randInt(5, 12);
      const d = randInt(15, 60);
      ansVal = (a / b) * c + d;
      qText = `(${a} ÷ ${b}) × ${c} + ${d} = ?`;
      explanationText = `${a} ÷ ${b} = ${a / b}. ${(a / b)} × ${c} = ${(a / b) * c}. Adding ${d}: ${ansVal}.`;
    }

    const distractors = new Set([ansVal]);
    while (distractors.size < 4) {
      const offset = pickRandom([-20, -10, -5, -2, 2, 5, 10, 20, 15, 25]);
      const fake = ansVal + offset;
      if (fake > 0) distractors.add(fake);
    }

    const optionsArr = shuffle(Array.from(distractors)).map(String);
    const correctIdx = optionsArr.indexOf(String(ansVal));

    return {
      id: `simp_${idx}_${Date.now()}`,
      section: "Simplification",
      question: qText,
      options: optionsArr,
      correctAnswerIndex: correctIdx >= 0 ? correctIdx : 0,
      explanation: explanationText
    };
  }

  function genSpeedMathApproximation(idx) {
    const type = idx % 4;
    let qText = "", ansVal = 0, explanationText = "";

    if (type === 0) {
      const a = randInt(14, 40) + 0.98;
      const b = randInt(20, 50) + 0.02;
      const c = randInt(5, 15) + 0.99;
      const approxA = Math.round(a);
      const approxB = Math.round(b);
      const approxC = Math.round(c);
      ansVal = approxA + approxB - approxC;
      qText = `${a.toFixed(2)} + ${b.toFixed(2)} - ${c.toFixed(2)} ≈ ?`;
      explanationText = `Approximating terms to integers: ${approxA} + ${approxB} - ${approxC} = ${ansVal}.`;
    } else if (type === 1) {
      const pctApprox = pickRandom([15, 20, 25, 30, 40, 50]);
      const pct = pctApprox - 0.02;
      const baseApprox = pickRandom([200, 300, 400, 500, 600, 800]);
      const base = baseApprox - 0.02;
      const addApprox = pickRandom([10, 15, 20, 30]);
      const add = addApprox + 0.01;

      ansVal = (pctApprox / 100) * baseApprox + addApprox;
      qText = `${pct.toFixed(2)}% of ${base.toFixed(2)} + ${add.toFixed(2)} ≈ ?`;
      explanationText = `Approximating: ${pctApprox}% of ${baseApprox} + ${addApprox} = ${(pctApprox / 100) * baseApprox} + ${addApprox} = ${ansVal}.`;
    } else if (type === 2) {
      const aApprox = randInt(12, 20);
      const bApprox = randInt(4, 9);
      const a = aApprox + 0.01;
      const b = bApprox - 0.01;
      ansVal = (aApprox * aApprox) - (bApprox * bApprox);
      qText = `(${a.toFixed(2)})² - (${b.toFixed(2)})² ≈ ?`;
      explanationText = `Approximating: ${aApprox}² - ${bApprox}² = ${aApprox * aApprox} - ${bApprox * bApprox} = ${ansVal}.`;
    } else {
      const roots = [
        { sq: 399.98, approxSq: 400, r: 20 },
        { sq: 575.95, approxSq: 576, r: 24 },
        { sq: 624.99, approxSq: 625, r: 25 },
        { sq: 783.97, approxSq: 784, r: 28 },
        { sq: 899.96, approxSq: 900, r: 30 },
        { sq: 1023.98, approxSq: 1024, r: 32 }
      ];
      const r1 = pickRandom(roots);
      const r2 = pickRandom(roots);
      ansVal = r1.r + r2.r;
      qText = `√${r1.sq} + √${r2.sq} ≈ ?`;
      explanationText = `Approximating: √${r1.approxSq} + √${r2.approxSq} = ${r1.r} + ${r2.r} = ${ansVal}.`;
    }

    const distractors = new Set([ansVal]);
    while (distractors.size < 4) {
      const offset = pickRandom([-10, -5, -2, -1, 1, 2, 5, 10]);
      const fake = ansVal + offset;
      if (fake > 0) distractors.add(fake);
    }

    const optionsArr = shuffle(Array.from(distractors)).map(String);
    const correctIdx = optionsArr.indexOf(String(ansVal));

    return {
      id: `approx_${idx}_${Date.now()}`,
      section: "Approximation",
      question: qText,
      options: optionsArr,
      correctAnswerIndex: correctIdx >= 0 ? correctIdx : 0,
      explanation: explanationText
    };
  }

  // 5. Fallback Category Generator
  if (!questions || questions.length === 0) {
    const catLower = (category || "").toLowerCase();

    if (catLower.includes("simplification") || (catLower.includes("speed math") && !catLower.includes("approximation"))) {
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

const buildExtractionPrompt = (pdfChunk, limit) => `You are a strict data extractor. Extract exactly ${limit} questions from this text.
Output a JSON object containing the extracted questions. No markdown, no explanations, no original text.

FORMAT:
{
  "questions": [
    {
      "question": "The question text here",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0
    }
  ]
}

RULES:
- options must be exactly 4 strings.
- correctAnswerIndex must be 0, 1, 2, or 3.
- DO NOT generate explanations.
- DO NOT include passage text.

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
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Groq API Error (${response.status}): ${errText || response.statusText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (choice?.finish_reason === "length") {
    throw new Error("Groq API Error: Output truncated due to length (max_tokens reached).");
  }

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
}

async function callLLMChain(prompt) {
  const groqKey = getEnvKey("VITE_GROQ_API_KEY") || getEnvKey("GROQ_API_KEY");
  if (!groqKey) {
    throw new Error("no API key configured");
  }
  return await callGroq(groqKey, prompt);
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
        passage: "",
        section: category || "General",
        explanation: "",
        imageUrl: ""
      });
    }
  }
  return uniqueQuestions;
}

export async function generateMockTestFromPDF({ pdfText, category, timeLimit = "60 min", title, onProgress }) {
  if (!pdfText || pdfText.trim().length < 50) {
    throw new Error("PDF text content is too short or empty. Please upload a valid question paper PDF.");
  }

  const chunks = chunkText(pdfText, 1500);
  let allQuestions = [];
  let completedChunks = 0;

  if (onProgress) onProgress(0, chunks.length);

  const CONCURRENCY = 1;

  async function processChunk(chunk, index) {
    let chunkQuestions = [];
    const limits = [10, 5, 3];
    let currentLimitIndex = 0;

    while (currentLimitIndex < limits.length) {
      const limit = limits[currentLimitIndex];
      try {
        console.log(`[AI] Chunk ${index + 1}: Requesting ${limit} questions...`);
        const prompt = buildExtractionPrompt(chunk, limit);
        let response = await callLLMChain(prompt);
        
        let parsedQuestions = Array.isArray(response) ? response : (response.questions || []);
        
        // Strict Validation
        parsedQuestions = parsedQuestions.filter(q => {
          return q && 
                 typeof q.question === "string" && 
                 q.question.trim() !== "" &&
                 Array.isArray(q.options) && 
                 q.options.length === 4 &&
                 typeof q.correctAnswerIndex === "number" && 
                 q.correctAnswerIndex >= 0 && 
                 q.correctAnswerIndex <= 3;
        });

        if (parsedQuestions.length > 0) {
          console.log(`[AI] Success: ${parsedQuestions.length} questions from Chunk ${index + 1}`);
          chunkQuestions = parsedQuestions;
          break; // success
        } else {
          console.log(`[AI] Chunk ${index + 1}: No valid questions parsed. Retrying...`);
        }
      } catch (err) {
        if (err.message.includes("429") || err.message.includes("rate_limit")) {
          console.warn(`[AI] Rate limit hit on Chunk ${index + 1}. Waiting 15 seconds before retrying...`);
          await new Promise(r => setTimeout(r, 15000));
          continue; // Retry same limit
        } else if (err.message.includes("max_tokens reached") || err.message.includes("json_validate_failed") || err.message.includes("Failed to validate JSON")) {
          console.log(`[AI] Groq response truncated or JSON invalid on Chunk ${index + 1} with limit ${limit}`);
        } else {
          console.warn(`[AI] Chunk ${index + 1} extraction failed:`, err);
          if (err.message.includes("401") || err.message.includes("API Key")) {
            throw err; // Bubble up authentication errors
          }
          break; // only retry on known recoverable errors
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

  // True async worker pool for map-reduce
  let currentIndex = 0;
  async function worker() {
    while (currentIndex < chunks.length) {
      if (extractionError) break; // Abort if critical error occurred
      const idx = currentIndex++;
      try {
        await processChunk(chunks[idx], idx);
      } catch (err) {
        extractionError = err; // Capture critical error
        break;
      }
      if (currentIndex < chunks.length && !extractionError) {
        // Wait 22 seconds between chunks to respect Groq's 8000 TPM limit
        await new Promise(r => setTimeout(r, 22000));
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
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
        passage: "",
        section: category || "General",
        explanation: "",
        imageUrl: ""
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

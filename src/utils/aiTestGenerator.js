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

const getEnvKey = (key) => import.meta.env[key] || localStorage.getItem(key) || "";

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Strict JSON prompt generator for Indian Competitive Exams
const buildPrompt = (category, questionsCount) => {
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

STRICT CATEGORY CONSTRAINTS:
- If Category is 'Banking' or 'SBI PO / Clerk' or 'IBPS PO': Generate ONLY Quantitative Aptitude (Speed/DI/Work/Interest), Logical Reasoning (Puzzles/Coding/Directions), English Language, and Banking Awareness. DO NOT include state GK or general history.
- If Category is 'TNPSC', generate ONLY TNPSC questions.
- If Category is 'TNPSC', generate ONLY Tamil Nadu History, TN Freedom Struggle, TN Administration, and TNPSC Aptitude.
- If Category is 'SSC', generate ONLY SSC Algebra, Reasoning analogies, and Science/General Awareness.

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${cleanKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${cleanKey}`,
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

// 5. OpenRouter API Provider (google/gemma-4-31b-it:free)
async function callOpenRouter(apiKey, prompt, model = "nvidia/nemotron-3.5-lightning:free") {
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
export async function generateAIMockTest({ category, questionsCount = 10, timeLimit = "30 min" }) {
  let questions = [];
  const prompt = buildPrompt(category, questionsCount);

  const openRouterKey = getEnvKey("VITE_OPENROUTER_API_KEY") || getEnvKey("OPENROUTER_API_KEY");
  const openRouterModel = getEnvKey("VITE_OPENROUTER_MODEL") || getEnvKey("OPENROUTER_MODEL") || "google/gemma-4-31b-it:free";
  const nvidiaKey = getEnvKey("VITE_NVIDIA_API_KEY") || getEnvKey("NVIDIA_API_KEY");
  const nvidiaModel = getEnvKey("VITE_NVIDIA_MODEL") || "nvidia/nemotron-ocr-v2";
  const gemmaKey = getEnvKey("VITE_GEMMA_API_KEY") || getEnvKey("GEMMA_API_KEY");
  const gemmaEndpoint = getEnvKey("VITE_GEMMA_ENDPOINT") || getEnvKey("GEMMA_ENDPOINT");
  const geminiKey = getEnvKey("VITE_GEMINI_API_KEY") || getEnvKey("GEMINI_API_KEY");
  const openAIKey = getEnvKey("VITE_OPENAI_API_KEY") || getEnvKey("OPENAI_API_KEY");
  const deepSeekKey = getEnvKey("VITE_DEEPSEEK_API_KEY") || getEnvKey("DEEPSEEK_API_KEY");

  let lastError = null;

  // 0. Try NVIDIA LLM
  if (nvidiaKey) {
    try {
      console.log(`🤖 Generating mock test via NVIDIA (${nvidiaModel})...`);
      questions = await callNvidia(nvidiaKey, prompt, nvidiaModel);
    } catch (err) {
      lastError = err;
      console.warn("Nvidia LLM error:", err);
    }
  }

  // 1. Try OpenRouter (google/gemma-4-31b-it:free)
  if ((!questions || questions.length === 0) && openRouterKey) {
    try {
      console.log(`🤖 Generating mock test via OpenRouter (${openRouterModel})...`);
      questions = await callOpenRouter(openRouterKey, prompt, openRouterModel);
    } catch (err) {
      lastError = err;
      console.warn("OpenRouter LLM error:", err);
    }
  }

  // 2. Try Google Gemma (HuggingFace / Groq / Ollama)
  if ((!questions || questions.length === 0) && (gemmaKey || gemmaEndpoint)) {
    try {
      console.log("🤖 Generating mock test via Google Gemma...");
      questions = await callGemma7B(gemmaKey, prompt, gemmaEndpoint);
    } catch (err) {
      lastError = err;
      console.warn("Gemma LLM error:", err);
    }
  }

  // 2. Try Google Gemini LLM
  if ((!questions || questions.length === 0) && geminiKey) {
    try {
      console.log("🤖 Generating mock test via Google Gemini API...");
      questions = await callGemini(geminiKey, prompt);
    } catch (err) {
      lastError = err;
      console.warn("Gemini LLM error:", err);
    }
  }

  // 3. Try OpenAI LLM
  if ((!questions || questions.length === 0) && openAIKey) {
    try {
      console.log("🤖 Generating mock test via OpenAI ChatGPT API...");
      questions = await callOpenAI(openAIKey, prompt);
    } catch (err) {
      lastError = err;
      console.warn("OpenAI LLM error:", err);
    }
  }

  // 4. Try DeepSeek LLM
  if ((!questions || questions.length === 0) && deepSeekKey) {
    try {
      console.log("🤖 Generating mock test via DeepSeek API...");
      questions = await callDeepSeek(deepSeekKey, prompt);
    } catch (err) {
      lastError = err;
      console.warn("DeepSeek LLM error:", err);
    }
  }

  if ((!questions || questions.length === 0) && lastError) {
    console.error("All AI providers failed. Last error:", lastError);
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
    explanationText = `${a}² = ${a*a}, ${b}² = ${b*b}. So ${a*a} - ${b*b} + ${c} = ${ansVal}.`;
  } else if (type === 2) {
    const a = randInt(12, 25);
    const b = randInt(4, 15);
    const d = pickRandom([4, 5, 8, 10]);
    const multD = randInt(4, 20);
    const c = d * multD;
    ansVal = (a * b) + (c / d);
    qText = `${a} × ${b} + ${c} ÷ ${d} = ?`;
    explanationText = `${a} × ${b} = ${a*b}. ${c} ÷ ${d} = ${c/d}. Total = ${a*b} + ${c/d} = ${ansVal}.`;
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
    explanationText = `${a} ÷ ${b} = ${a/b}. ${(a/b)} × ${c} = ${(a/b)*c}. Adding ${d}: ${ansVal}.`;
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
    explanationText = `Approximating: ${pctApprox}% of ${baseApprox} + ${addApprox} = ${(pctApprox/100)*baseApprox} + ${addApprox} = ${ansVal}.`;
  } else if (type === 2) {
    const aApprox = randInt(12, 20);
    const bApprox = randInt(4, 9);
    const a = aApprox + 0.01;
    const b = bApprox - 0.01;
    ansVal = (aApprox * aApprox) - (bApprox * bApprox);
    qText = `(${a.toFixed(2)})² - (${b.toFixed(2)})² ≈ ?`;
    explanationText = `Approximating: ${aApprox}² - ${bApprox}² = ${aApprox*aApprox} - ${bApprox*bApprox} = ${ansVal}.`;
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

const buildExtractionPrompt = (pdfChunk, category) => `You are a high-accuracy Indian Competitive Exam Question Extractor.
Extract ALL questions from the supplied PDF text with 100% precision.

CRITICAL OCR & FORMATTING RULES:
- The input text may be messy due to PDF OCR. Sentences might be broken across lines.
- YOU MUST reconstruct broken sentences into a single continuous "question_text".
- DO NOT mistake words starting with "A", "B", "C" as option letters unless they are clearly formatted as options (e.g. "A)", "(A)", "a.", "1.").
- IGNORE document titles (e.g. "Chapter 3"), headers, footers, page numbers, and watermarks (e.g. "Ken Academy", "Tg : NextGenBankers").
- ONLY extract actual valid questions that have options. If a block of text is just a title or introduction without options, DO NOT extract it as a question.
- Example of bad parsing: Extracting "Chapter 3: Simple Interest" as a question. This is WRONG!
- Example of bad parsing: Question="Simple interest on", Option A="A certain sum at...". This is WRONG! Reconstruct the full sentence.

INSTRUCTIONS:
1. "section": Subject section e.g. "Quantitative Aptitude", "Reasoning Ability", "English Language", "General Awareness", or "General".
2. "passage": If there is a Reading Comprehension passage, Data Interpretation (DI) table context, or Directions (e.g. "Directions (Q. 1-5)..."), put it in the "passage" field.
3. "question_text": The clean, reconstructed question statement (combine broken lines).
4. "options": Key-value object for options A, B, C, D, E (e.g. {"A": "10", "B": "20", "C": "30", "D": "40"}). Extract exactly what the option says.
5. "source_answer": Correct option letter e.g. "A", "B", "C", "D", "E". Solve the question if no answer key is present.
6. "explanation": Brief step-by-step math solution or reasoning logic.

Return ONLY a raw valid JSON object (no markdown fences):
{
  "questions": [
    {
      "section": "Quantitative Aptitude",
      "passage": "Directions (Q. 1-5): Read the following table...",
      "question_text": "What is the total number of items sold?",
      "options": {
        "A": "150",
        "B": "200",
        "C": "250",
        "D": "300"
      },
      "source_answer": "C",
      "explanation": "Sum = 100 + 150 = 250."
    }
  ]
}

EXAM CATEGORY: ${category}

PDF CHUNK TEXT:
"""
${pdfChunk}
"""`;

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

async function callLLMChain(prompt) {
  const geminiKey = getEnvKey("VITE_GEMINI_API_KEY") || getEnvKey("GEMINI_API_KEY");
  const groqKey = getEnvKey("VITE_GROQ_API_KEY") || getEnvKey("GROQ_API_KEY") || getEnvKey("VITE_GEMMA_API_KEY");
  const openAIKey = getEnvKey("VITE_OPENAI_API_KEY") || getEnvKey("OPENAI_API_KEY");
  const deepSeekKey = getEnvKey("VITE_DEEPSEEK_API_KEY") || getEnvKey("DEEPSEEK_API_KEY");

  const openRouterKey = getEnvKey("VITE_OPENROUTER_API_KEY") || getEnvKey("OPENROUTER_API_KEY");
  const openRouterModel = getEnvKey("VITE_OPENROUTER_MODEL") || "nvidia/nemotron-4-340b-instruct:free";

  // 1. Try OpenRouter if key exists
  if (openRouterKey && openRouterKey !== "sk-or-v1-free") {
    try {
      return await callOpenRouter(openRouterKey, prompt, openRouterModel);
    } catch (e) {
      console.warn("OpenRouter API call failed, falling back...", e);
    }
  }

  // 2. Try Gemini API if key exists
  if (geminiKey) {
    try {
      return await callGemini(geminiKey, prompt);
    } catch (e) {
      console.warn("Gemini API call failed, falling back...", e);
    }
  }

  // 3. Try Groq / Gemma API if key exists
  if (groqKey) {
    try {
      return await callNvidia(groqKey, prompt, "llama-3.3-70b-versatile");
    } catch (e) {
      console.warn("Groq API call failed, falling back...", e);
    }
  }

  // 4. Try OpenAI if key exists
  if (openAIKey) {
    try {
      return await callOpenAI(openAIKey, prompt);
    } catch (e) {
      console.warn("OpenAI API call failed, falling back...", e);
    }
  }

  // 5. Try DeepSeek if key exists
  if (deepSeekKey) {
    try {
      return await callDeepSeek(deepSeekKey, prompt);
    } catch (e) {
      console.warn("DeepSeek API call failed, falling back...", e);
    }
  }

  // 5. Try backend /api/chat
  try {
    const response = await fetch(`/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.text) {
        const text = data.text;
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonStart = cleaned.indexOf("[");
        const jsonEnd = cleaned.lastIndexOf("]");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
        }
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : parsed.questions || parsed.mockTest || parsed;
      }
    }
  } catch (err) {
    console.error("Backend LLMChain error:", err);
  }

  // 6. Try OpenRouter free tier fallback
  try {
    const openRouterKey = getEnvKey("VITE_OPENROUTER_API_KEY") || "sk-or-v1-free";
    return await callOpenRouter(openRouterKey, prompt, "google/gemma-2-9b-it:free");
  } catch (e) {
    console.warn("OpenRouter API call failed...", e);
  }

  return [];
}

/**
 * Splits text into chunks of approx 3000-4000 characters without breaking words.
 */
function chunkText(text, maxLen = 20000) {
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
export async function generateMockTestFromPDF({ pdfText, category, timeLimit = "60 min", title, onProgress }) {
  if (!pdfText || pdfText.trim().length < 50) {
    throw new Error("PDF text content is too short or empty. Please upload a valid question paper PDF.");
  }

  if (onProgress) onProgress(10, 100);

  const cleanText = pdfText.replace(/\r\n/g, '\n');
  
  // Split by Question markers: start of line, optional 'Ques', 'Question', 'Q', optional dot, number, dot or parenthesis
  const qRegex = /(?:^|\n)\s*(?:Ques|Question|Q)?\.?\s*\d+\s*[\.\)]/i;
  const rawBlocks = cleanText.split(qRegex).filter(b => b.trim().length > 10);
  
  const uniqueQuestions = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    let qText = block;
    let options = ["Option A", "Option B", "Option C", "Option D"];
    
    // Look for options like (a), (A), a), A), a. , A.
    // Use a robust regex to capture option markers
    const optRegex = /(?:^|\n|\s)\(([a-eA-E])\)\s+|(?:^|\n|\s)([a-eA-E])\)\s+|(?:^|\n|\s)([a-eA-E])\.\s+/g;
    const matches = [...block.matchAll(optRegex)];
    
    if (matches.length >= 2) {
      const firstOptIndex = matches[0].index;
      qText = block.substring(0, firstOptIndex).trim();
      
      const optValues = [];
      for (let j = 0; j < matches.length; j++) {
        const start = matches[j].index + matches[j][0].length;
        const end = j + 1 < matches.length ? matches[j+1].index : block.length;
        optValues.push(block.substring(start, end).replace(/\n/g, ' ').trim());
      }
      
      // Assign options up to the length found
      options = [];
      for(let k = 0; k < Math.min(optValues.length, 5); k++) {
        options.push(optValues[k] || `Option ${String.fromCharCode(65 + k)}`);
      }
      // Fill missing options up to 4
      while(options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }
    }
    
    // Clean up qText (remove newlines inside sentences, but preserve some structure)
    qText = qText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Ignore blocks that are likely just headers (very short and no options found)
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

  if (onProgress) onProgress(100, 100);

  if (uniqueQuestions.length === 0) {
    throw new Error("Regex extraction failed. No valid questions with options were found in the PDF.");
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
  const verifiedQuestions = [];
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

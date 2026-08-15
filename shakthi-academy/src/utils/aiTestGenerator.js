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
const buildPrompt = (category, questionsCount) => `You are a senior Indian Competitive Exam Paper Setter. Generate an authentic past 5-year PYQ style mock test for '${category}'.

STRICT CATEGORY CONSTRAINTS:
- If Category is 'Banking' or 'SBI PO / Clerk' or 'IBPS PO': Generate ONLY Quantitative Aptitude (Speed/DI/Work/Interest), Logical Reasoning (Puzzles/Coding/Directions), English Language, and Banking Awareness. DO NOT include state GK or general history.
- If Category is 'UPSC', generate ONLY UPSC Civil Services Prelims questions (Polity, Economy, Ancient/Modern History, Environment, CSAT).
- If Category is 'TNPSC', generate ONLY Tamil Nadu History, TN Freedom Struggle, TN Administration, and TNPSC Aptitude.
- If Category is 'SSC', generate ONLY SSC Algebra, Reasoning analogies, and Science/General Awareness.

Generate EXACTLY ${questionsCount} questions.
Return ONLY raw valid JSON array of objects without markdown formatting or backticks:
[
  {
    "section": "Quantitative Aptitude / Logical Reasoning / English / General Awareness",
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
    "correctAnswerIndex": 0,
    "explanation": "Step-by-step solution..."
  }
]`;

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
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
      }),
    }
  );
  if (!response.ok) throw new Error("Gemini API error: " + response.statusText);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
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
  const gemmaKey = getEnvKey("VITE_GEMMA_API_KEY") || getEnvKey("GEMMA_API_KEY");
  const gemmaEndpoint = getEnvKey("VITE_GEMMA_ENDPOINT") || getEnvKey("GEMMA_ENDPOINT");
  const geminiKey = getEnvKey("VITE_GEMINI_API_KEY") || getEnvKey("GEMINI_API_KEY");
  const openAIKey = getEnvKey("VITE_OPENAI_API_KEY") || getEnvKey("OPENAI_API_KEY");
  const deepSeekKey = getEnvKey("VITE_DEEPSEEK_API_KEY") || getEnvKey("DEEPSEEK_API_KEY");

  let lastError = null;

  // 0. Try OpenRouter (google/gemma-4-31b-it:free) — TOP PRIORITY
  if (openRouterKey) {
    try {
      console.log(`🤖 Generating mock test via OpenRouter (${openRouterModel})...`);
      questions = await callOpenRouter(openRouterKey, prompt, openRouterModel);
    } catch (err) {
      lastError = err;
      console.warn("OpenRouter LLM error:", err);
    }
  }

  // 1. Try Google Gemma (HuggingFace / Groq / Ollama)
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

  // 5. Fallback Category Generator
  if (!questions || questions.length === 0) {
    const catLower = (category || "").toLowerCase();

    if (catLower.includes("bank") || catLower.includes("sbi") || catLower.includes("ibps")) {
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
        questions.push({ ...UPSC_POOL[i % UPSC_POOL.length], id: `up_${i + 1}` });
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

const buildExtractionPrompt = (pdfChunk, category) => `Extract the questions exactly from the supplied text. Return only valid JSON.

## INSTRUCTIONS FOR ANSWERS
1. If the PDF provides an answer key, use it for "source_answer".
2. If there is NO answer key in the PDF, you MUST solve the question yourself to determine the correct option (A, B, C, or D) and put it in "source_answer".
3. Provide a brief step-by-step solution in the "explanation" field.

## JSON FORMAT
Every question MUST be a JSON object in this exact format. Do NOT add markdown fences around the JSON array, just output raw JSON:
{
  "questions": [
    {
      "question_number": 1,
      "question_text": "What is 25% of 240?",
      "options": {
        "A": "40",
        "B": "50",
        "C": "60",
        "D": "80"
      },
      "source_answer": "C",
      "explanation": "25% of 240 is (25/100) * 240 = 60.",
      "page_number": 2
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
3. Determine the AI answer.
4. Compare source answer and AI answer.
5. Detect mismatches.

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
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Backend AI Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.detail || "Unknown error");
    }

    const text = data.text;
    
    // Attempt to extract JSON from text
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonStart = cleaned.indexOf("[");
    const jsonEnd = cleaned.lastIndexOf("]");
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
    }
    
    const parsed = JSON.parse(cleaned);
    // Extraction returns { questions: [...] }, while the background verifier
    // returns one verification object. Keep that object instead of converting
    // it to an empty array (which caused "failed to return structured JSON").
    return Array.isArray(parsed) ? parsed : parsed.questions || parsed.mockTest || parsed;
  } catch (err) {
    console.error("Backend LLMChain error:", err);
    return [];
  }
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
    chunks.push(text.slice(currentIndex, nextIndex));
    currentIndex = nextIndex;
  }
  return chunks;
}

/**
 * Generate a mock test by extracting questions from an uploaded PDF.
 * PHASE 1: Fast Extraction via Chunking & Concurrency.
 */
export async function generateMockTestFromPDF({ pdfText, category, timeLimit = "60 min", title, onProgress }) {
  if (!pdfText || pdfText.trim().length < 50) {
    throw new Error("PDF text content is too short or empty. Please upload a valid question paper PDF.");
  }

  const chunks = chunkText(pdfText);
  let allQuestions = [];
  let completedChunks = 0;
  
  if (onProgress) onProgress(0, chunks.length);

  // Process up to 3 chunks concurrently
  const CONCURRENCY = 3;
  let activePromises = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const p = (async () => {
      let chunkQuestions = [];
      let retries = 0;
      while (retries < 1 && (!chunkQuestions || chunkQuestions.length === 0)) {
        try {
          const prompt = buildExtractionPrompt(chunks[i], category);
          chunkQuestions = await callLLMChain(prompt);
          if (!Array.isArray(chunkQuestions)) {
            // Handle if model returned an object with 'questions' key instead of array directly
            if (chunkQuestions.questions) chunkQuestions = chunkQuestions.questions;
            else chunkQuestions = [];
          }
        } catch (err) {
          console.warn(`Chunk ${i+1} extraction failed on try ${retries+1}`, err);
        }
        retries++;
      }
      
      if (chunkQuestions && chunkQuestions.length > 0) {
        allQuestions.push(...chunkQuestions);
      }
      
      completedChunks++;
      if (onProgress) onProgress(completedChunks, chunks.length);
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

  if (allQuestions.length === 0) {
    throw new Error("Failed to extract any valid questions from the PDF.");
  }

  // Deduplicate by question text
  const uniqueQuestions = [];
  const seen = new Set();
  for (const q of allQuestions) {
    const cleanText = (q.question_text || "").trim().toLowerCase();
    if (cleanText && !seen.has(cleanText)) {
      seen.add(cleanText);
      uniqueQuestions.push(q);
    }
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

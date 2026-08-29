import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardPlus, Users, Megaphone, TrendingUp, BookOpen, Plus, Search,
  Trash2, Send, Bell, Sparkles, Loader2, CheckCircle2, Eye, HelpCircle, X,
  FileUp, FileText, Upload, Download, ShieldCheck, Image as ImageIcon, Edit3, Maximize2, Minimize2
} from "lucide-react";
import PageHeader from "../../components/PageHeader.jsx";
import { useApp } from "../../store.jsx";
import { CATEGORIES, COURSE_PROGRESS } from "../../data.js";
import { Badge, ProgressBar } from "../../components/ui.jsx";
import { verifyQuestionsBackground } from "../../utils/aiTestGenerator.js";
import { setStudentAccess } from "../../auth.jsx";
import { fsUpdateUserPurchases, fsRemoveUserPurchase, useRealtimeBackend } from "../../backend.js";

/* ---------------------------- Create Mock Test ---------------------------- */
export function CreateMockTestPage({ isFreeByDefault = false }) {
  const { mockTests = [], addMockTest, updateMockTest, deleteMockTest, pushToast } = useApp();
  const [mode, setMode] = useState("ai"); // "ai" | "manual" | "pdf"
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfStatus, setPdfStatus] = useState(""); // "extracting" | "analyzing" | "done" | ""
  const [pdfPageInfo, setPdfPageInfo] = useState("");
  const pdfInputRef = useRef(null);
  const [f, setF] = useState({ title: "", category: CATEGORIES[0].name, subject: "", topic: "", questions: 10, time: "30 min", isFree: isFreeByDefault, isSectionalTimed: false });
  const [generating, setGenerating] = useState(false);
  const [generatedTest, setGeneratedTest] = useState(null);
  const [approvedQuestions, setApprovedQuestions] = useState({});
  const [extractionProgress, setExtractionProgress] = useState(null);
  const [verificationProgress, setVerificationProgress] = useState(null);
  const [extractionStartTime, setExtractionStartTime] = useState(null);
  const [isFullPreview, setIsFullPreview] = useState(false);

  // Edit Existing Test Modal State
  const [editingTest, setEditingTest] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleStartEditTest = (test) => {
    let qList = [];
    if (Array.isArray(test.questionsList) && test.questionsList.length > 0) {
      qList = test.questionsList;
    } else if (Array.isArray(test.questions)) {
      qList = test.questions;
    } else if (Array.isArray(test.rawExtractedQuestions)) {
      qList = test.rawExtractedQuestions;
    }

    const normalizedQs = qList.map((q, idx) => {
      let opts = q.options;
      if (opts && typeof opts === "object" && !Array.isArray(opts)) {
        const keys = Object.keys(opts).sort();
        opts = keys.map(k => opts[k]);
      }
      if (!Array.isArray(opts) || opts.length === 0) {
        opts = ["Option A", "Option B", "Option C", "Option D"];
      }

      return {
        id: q.id || `q_${Date.now()}_${idx}`,
        question: q.question || q.question_text || "",
        options: opts,
        correctAnswerIndex: typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
        explanation: q.explanation || "",
        section: q.section || "General",
        passage: q.passage || "",
        imageUrl: q.imageUrl || ""
      };
    });

    setEditingTest({
      ...test,
      title: test.title || "Mock Test",
      category: test.category || CATEGORIES[0].name,
      time: test.time || "30 min",
      isSectionalTimed: !!test.isSectionalTimed,
      questionsList: JSON.parse(JSON.stringify(normalizedQs))
    });
  };

  const updateEditingField = (field, value) => {
    setEditingTest(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const updateEditingQuestion = (qIdx, field, value) => {
    setEditingTest(prev => {
      if (!prev) return null;
      const updatedList = [...prev.questionsList];
      updatedList[qIdx] = { ...updatedList[qIdx], [field]: value };
      return { ...prev, questionsList: updatedList };
    });
  };

  const updateEditingOption = (qIdx, optIdx, text) => {
    setEditingTest(prev => {
      if (!prev) return null;
      const updatedList = [...prev.questionsList];
      const updatedOpts = [...updatedList[qIdx].options];
      updatedOpts[optIdx] = text;
      updatedList[qIdx] = { ...updatedList[qIdx], options: updatedOpts };
      return { ...prev, questionsList: updatedList };
    });
  };

  const addEditingQuestion = () => {
    setEditingTest(prev => {
      if (!prev) return null;
      const newQ = {
        id: `q_new_${Date.now()}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswerIndex: 0,
        explanation: "",
        section: "General",
        passage: "",
        imageUrl: ""
      };
      return { ...prev, questionsList: [...prev.questionsList, newQ] };
    });
  };

  const removeEditingQuestion = (qIdx) => {
    setEditingTest(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questionsList: prev.questionsList.filter((_, idx) => idx !== qIdx)
      };
    });
  };

  const saveEditingTest = async () => {
    if (!editingTest) return;
    setIsSavingEdit(true);
    try {
      const finalObject = {
        ...editingTest,
        title: editingTest.title.trim() || "Untitled Mock Test",
        questionsList: editingTest.questionsList,
        questions: editingTest.questionsList.length
      };
      await updateMockTest(editingTest.id, finalObject);
      setEditingTest(null);
      pushToast("✅ Mock test updated & saved to Cloud!");
    } catch (err) {
      console.error(err);
      pushToast("Failed to save mock test edits.");
    } finally {
      setIsSavingEdit(false);
    }
  };
  const [extractionElapsed, setExtractionElapsed] = useState(0);

  // 3-Section Full Mock State
  const [multiPdfFiles, setMultiPdfFiles] = useState({
    quants: { file: null, name: "Quantitative Aptitude", time: "20 min", count: 35 },
    reasoning: { file: null, name: "Reasoning Ability", time: "20 min", count: 35 },
    english: { file: null, name: "English Language", time: "20 min", count: 30 },
  });

  useEffect(() => {
    let interval;
    if (pdfStatus === "analyzing" && extractionStartTime) {
      interval = setInterval(() => {
        setExtractionElapsed(Math.floor((Date.now() - extractionStartTime) / 1000));
      }, 1000);
    } else {
      setExtractionElapsed(0);
    }
    return () => clearInterval(interval);
  }, [pdfStatus, extractionStartTime]);

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keys, setKeys] = useState({
    gemma: localStorage.getItem("GEMMA_API_KEY") || "",
    gemmaEndpoint: localStorage.getItem("GEMMA_ENDPOINT") || "",
    gemini: localStorage.getItem("GEMINI_API_KEY") || "",
    openai: localStorage.getItem("OPENAI_API_KEY") || "",
    deepseek: localStorage.getItem("DEEPSEEK_API_KEY") || "",
  });

  const saveKeys = () => {
    if (keys.gemma) localStorage.setItem("GEMMA_API_KEY", keys.gemma.trim());
    else localStorage.removeItem("GEMMA_API_KEY");

    if (keys.gemmaEndpoint) localStorage.setItem("GEMMA_ENDPOINT", keys.gemmaEndpoint.trim());
    else localStorage.removeItem("GEMMA_ENDPOINT");

    if (keys.gemini) localStorage.setItem("GEMINI_API_KEY", keys.gemini.trim());
    else localStorage.removeItem("GEMINI_API_KEY");

    if (keys.openai) localStorage.setItem("OPENAI_API_KEY", keys.openai.trim());
    else localStorage.removeItem("OPENAI_API_KEY");

    if (keys.deepseek) localStorage.setItem("DEEPSEEK_API_KEY", keys.deepseek.trim());
    else localStorage.removeItem("DEEPSEEK_API_KEY");

    pushToast("LLM API Keys saved successfully! 🤖");
    setShowKeyModal(false);
  };

  useEffect(() => {
    setF(prev => ({ ...prev, isFree: isFreeByDefault }));
  }, [isFreeByDefault]);

  const [manualQuestions, setManualQuestions] = useState([
    {
      section: "Quantitative Aptitude",
      question: "",
      passage: "",
      imageUrl: "",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswerIndex: 0,
      explanation: "",
    },
  ]);

  const addManualQuestion = () => {
    setManualQuestions((prev) => [
      ...prev,
      {
        section: "General Knowledge",
        question: "",
        passage: "",
        imageUrl: "",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswerIndex: 0,
        explanation: "",
      },
    ]);
  };

  const removeManualQuestion = (idx) => {
    if (manualQuestions.length <= 1) return pushToast("Test must have at least 1 question");
    setManualQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateManualQuestion = (idx, field, val) => {
    setManualQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: val } : q))
    );
  };

  const updateManualOption = (qIdx, optIdx, val) => {
    setManualQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[optIdx] = val;
        return { ...q, options: opts };
      })
    );
  };

  const attachImageToManual = (idx, file) => {
    if (!file) {
      updateManualQuestion(idx, "imageUrl", "");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateManualQuestion(idx, "imageUrl", reader.result);
    };
    reader.readAsDataURL(file);
  };

  const set = (k, v) => setF((s) => {
    const newState = { ...s, [k]: v };
    // Auto-update topic if subject changes
    if (k === "subject" && SUBJECT_TOPICS[v]) {
      newState.topic = SUBJECT_TOPICS[v][0];
    }
    return newState;
  });
  const color = CATEGORIES.find((c) => c.name === f.category)?.color || "#1B4F72";

  const [isPublishing, setIsPublishing] = useState(false);

  const handleGenerateAI = async () => {
    setGenerating(true);
    pushToast("✨ AI is analyzing past 5-year PYQs & generating mock test...");
    try {
      const result = await generateAIMockTest({
        category: f.category,
        questionsCount: +f.questions || 10,
        timeLimit: f.time,
      });

      if (f.title.trim()) result.title = f.title.trim();
      result.color = color;
      result.isFree = f.isFree;
      result.subject = f.subject;
      result.topic = f.topic;

      setGeneratedTest(result);
      pushToast("✨ AI Mock Test generated successfully! Review below.");
    } catch (err) {
      console.error(err);
      pushToast("Error generating AI test. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const applyPDFUpdates = async () => {
    if (!generatedTest) return;

    let finalQuestions = [];

    // Process all rawExtractedQuestions (include all by default unless explicitly unapproved with isApproved === false)
    (generatedTest.rawExtractedQuestions || []).forEach((q, idx) => {
      const approvalStatus = approvedQuestions[idx];

      // Skip ONLY if explicitly unchecked / unapproved
      if (approvalStatus && approvalStatus.isApproved === false) {
        return;
      }

      const finalLetter = approvalStatus?.editedAnswer || q.ai_verified_answer || q.source_answer || "A";
      const ansIndex = Math.max(0, finalLetter.toUpperCase().charCodeAt(0) - 65);

      // Merge options (whether array or object)
      let optsArray = [];
      if (approvalStatus?.options) {
        const mergedOptions = { ...q.options, ...approvalStatus.options };
        const optKeys = Object.keys(mergedOptions).sort();
        optsArray = optKeys.map(k => mergedOptions[k]);
      } else if (Array.isArray(q.options)) {
        optsArray = q.options;
      } else if (q.options && typeof q.options === "object") {
        const optKeys = Object.keys(q.options).sort();
        optsArray = optKeys.map(k => q.options[k]);
      }

      if (optsArray.length === 0) {
        optsArray = ["Option A", "Option B", "Option C", "Option D"];
      }

      finalQuestions.push({
        id: `pdf_q_${Date.now()}_${idx}`,
        section: approvalStatus?.section || q.section || "General",
        passage: approvalStatus?.passage ?? (q.passage || ""),
        imageUrl: approvalStatus?.imageUrl ?? (q.imageUrl || ""),
        question: approvalStatus?.questionText ?? (q.question_text || q.question || `Question ${idx + 1}`),
        options: optsArray,
        correctAnswerIndex: ansIndex < optsArray.length ? ansIndex : 0,
        explanation: q.verification_explanation || "Verified by teacher."
      });
    });

    if (finalQuestions.length === 0) {
      pushToast("Cannot publish test with 0 questions. Please approve at least 1 question.");
      return;
    }

    // Update the test metadata from the latest form state (f)
    const testToPublish = { 
       ...generatedTest, 
       title: f.title.trim() || generatedTest.title,
       category: f.category,
       subject: f.subject,
       topic: f.topic,
       time: f.time,
       durationMinutes: Math.max(1, parseInt(f.time) || 30),
       isSectionalTimed: !!f.isSectionalTimed,
       questionsList: finalQuestions, 
       questions: finalQuestions.length
    };
    
    setIsPublishing(true);
    try {
      if (testToPublish.id && testToPublish.id.startsWith("draft_")) {
        delete testToPublish.id;
        await addMockTest(testToPublish);
      } else {
        await updateMockTest(generatedTest.id, { 
          questionsList: finalQuestions, 
          questions: finalQuestions.length,
          title: testToPublish.title,
          category: testToPublish.category,
          subject: testToPublish.subject,
          topic: testToPublish.topic,
          time: testToPublish.time,
          durationMinutes: testToPublish.durationMinutes
        });
      }
      setGeneratedTest(null);
      setPdfFile(null);
      setApprovedQuestions({});
      setF({ title: "", category: CATEGORIES[0].name, subject: "", topic: "", questions: 10, time: "30 min", isFree: isFreeByDefault, isSectionalTimed: false });
      pushToast(`🎉 Test published successfully with ${finalQuestions.length} questions!`);
    } catch (err) {
      console.error("Publishing error:", err);
      pushToast("Error publishing test. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const publish = async () => {
    if (!f.title.trim()) return pushToast("Enter a test title");
    if (isPublishing) return;

    setIsPublishing(true);
    try {
      let testToPublish = generatedTest;

      if (mode === "manual" || !testToPublish) {
        // Validate manual questions
        const validQuestions = manualQuestions.map((q, i) => ({
          id: `q_manual_${Date.now()}_${i + 1}`,
          section: q.section || "General",
          question: q.question.trim() || `Question ${i + 1}`,
          options: q.options.map((o, oi) => o.trim() || `Option ${String.fromCharCode(65 + oi)}`),
          correctAnswerIndex: +q.correctAnswerIndex || 0,
          explanation: q.explanation.trim() || "No explanation provided.",
          ...(q.imageUrl && { imageUrl: q.imageUrl }),
          ...(q.passage && { passage: q.passage })
        })).filter((q, idx) => q.question !== `Question ${idx + 1}`);

        if (validQuestions.length === 0) {
          setIsPublishing(false);
          return pushToast("Add at least one valid question");
        }

        testToPublish = {
          id: `mock_manual_${Date.now()}`,
          title: f.title.trim(),
          category: f.category,
          color,
          questions: validQuestions.length,
          time: f.time,
          durationMinutes: parseInt(f.time) || 30,
          taken: 0,
          isFree: f.isFree,
          subject: f.subject,
          topic: f.topic,
          questionsList: validQuestions,
          createdAt: new Date().toISOString(),
        };
      }

      await addMockTest(testToPublish);
      pushToast("Mock test created & published to all students! 📝");
      setGeneratedTest(null);
      setF({ title: "", category: CATEGORIES[0].name, subject: "", topic: "", questions: 10, time: "30 min", isFree: isFreeByDefault });
    } finally {
      setIsPublishing(false);
    }
  };

  const formatMathText = (str) => {
    if (!str || typeof str !== "string") return str;

    let res = str;

    // 1. Convert caret notation: e.g. 15^2 -> 15², x^3 -> x³
    res = res
      .replace(/\^2/g, "²")
      .replace(/\^3/g, "³")
      .replace(/\^4/g, "⁴")
      .replace(/\^5/g, "⁵");

    // 2. Convert space-separated powers like "15 2" or "12 2" or "(15) 2" -> "15²", "12²"
    res = res.replace(/(\b\d+|\))\s+([23])(?=\s*(?:[\+\-\*\/\=\,\)\?]|$))/g, (match, base, exp) => {
      if (/[²³⁴⁵]$/.test(base)) return match;
      const superscripts = { "2": "²", "3": "³" };
      return `${base}${superscripts[exp] || exp}`;
    });

    // 3. Clean up any duplicate consecutive superscripts (e.g. ²² -> ²) to prevent double superscript bugs
    res = res.replace(/([²³⁴⁵])\1+/g, "$1");

    return res;
  };

  const parseQuestionsFromPDFText = (fullText, sectionName = "General", targetCount = 35) => {
    if (!fullText || !fullText.trim()) return [];

    let questions = [];
    const cleanText = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Flexible Regex Splitter (matches 1., Q1., Q.1, Question 1:, 1), (1), Q1 -, 1 -)
    const qSplitRegex = /(?:^|\n|\s)(?:Q(?:uestion)?[\s\.-]*\d+|\d+[\)\.\:\-]|(?:\(\d+\)))\s+/gi;
    const rawBlocks = cleanText.split(qSplitRegex).map(b => b.trim()).filter(Boolean);

    const parseOptionsFromBlock = (block) => {
      // Lookahead regex to parse single-line or multi-line options (A. 7 B. 12 C. 15 D. 20 E. 25)
      const optRegex = /(?:\b|\s|\(|\[)([A-Ea-e1-5])[\)\.\:\-\]\s]+(.*?)(?=(?:\s*(?:\b|\s|\(|\[)[A-Ea-e1-5][\)\.\:\-\]\s]+)|$|\n)/gi;
      let options = {};
      let questionText = block;
      let firstOptIndex = -1;
      let match;

      while ((match = optRegex.exec(block)) !== null) {
        if (firstOptIndex === -1) firstOptIndex = match.index;
        let key = match[1].toUpperCase();
        if (/^[1-5]$/.test(key)) {
          key = String.fromCharCode(64 + parseInt(key));
        }
        if (!options[key] && match[2].trim()) {
          options[key] = formatMathText(match[2].trim());
        }
      }

      if (firstOptIndex !== -1) {
        questionText = block.substring(0, firstOptIndex).trim();
      }

      return { questionText: formatMathText(questionText), options };
    };

    for (let block of rawBlocks) {
      if (block.length < 5) continue;
      let { questionText, options } = parseOptionsFromBlock(block);

      let finalOptions = { ...options };
      if (Object.keys(finalOptions).length < 2) {
        const inlineOptRegex = /(?:\b|\s|\(|\[)([A-Ea-e])[\)\.\:\-\]\s]+(.*?)(?=(?:\s*(?:\b|\s|\(|\[)[A-Ea-e][\)\.\:\-\]\s]+)|$|\n)/gi;
        let inlineOpts = {};
        let m;
        let inlineFirstIndex = -1;
        while ((m = inlineOptRegex.exec(block)) !== null) {
          if (inlineFirstIndex === -1) inlineFirstIndex = m.index;
          inlineOpts[m[1].toUpperCase()] = formatMathText(m[2].trim());
        }
        if (Object.keys(inlineOpts).length >= 2) {
          finalOptions = inlineOpts;
          if (inlineFirstIndex > 0) {
            questionText = formatMathText(block.substring(0, inlineFirstIndex).trim());
          }
        }
      }

      if (questionText) {
        const keys = ["A", "B", "C", "D", "E"];
        keys.forEach(k => {
          if (!finalOptions[k] || !finalOptions[k].trim()) {
            finalOptions[k] = `Option ${k}`;
          }
        });

        questions.push({
          section: sectionName,
          question_text: questionText,
          options: finalOptions,
          source_answer: "A",
          explanation: "Extracted from PDF. Click option to select correct answer."
        });
      }
    }

    // Fallback paragraph chunker if Strategy 1 yields 0 questions
    if (questions.length === 0) {
      const lineParagraphs = cleanText
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 15);

      lineParagraphs.forEach((para) => {
        const { questionText, options } = parseOptionsFromBlock(para);
        const finalOptions = { ...options };
        ["A", "B", "C", "D", "E"].forEach(k => {
          if (!finalOptions[k] || !finalOptions[k].trim()) {
            finalOptions[k] = `Option ${k}`;
          }
        });

        questions.push({
          section: sectionName,
          question_text: formatMathText(questionText || para),
          options: finalOptions,
          source_answer: "A",
          explanation: "Extracted from PDF paragraph block. Review and edit options as needed."
        });
      });
    }

    return questions.slice(0, 200);
  };

  const handleMultiPDFUpload = async () => {
    const activeSlots = Object.values(multiPdfFiles).filter((s) => s.file);
    if (activeSlots.length === 0) {
      return pushToast("Please upload at least 1 section PDF (Quants, Reasoning, or English).");
    }

    setPdfStatus("extracting");
    setPdfPageInfo("Processing multi-section PDFs...");
    setGeneratedTest(null);
    setApprovedQuestions({});

    try {
      setPdfStatus("analyzing");
      setExtractionStartTime(Date.now());

      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
      }

      let combinedRawQuestions = [];
      let totalTimeMinutes = 0;

      for (const slot of activeSlots) {
        setPdfPageInfo(`Extracting section: ${slot.name}...`);
        const arrayBuffer = await slot.file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => item.str).join(" ") + "\n";
        }

        const sectionQuestions = parseQuestionsFromPDFText(fullText, slot.name, slot.count);
        combinedRawQuestions.push(...sectionQuestions);
        totalTimeMinutes += parseInt(slot.time) || 20;
      }

      if (combinedRawQuestions.length === 0) {
        throw new Error("No questions could be extracted from the uploaded section PDFs.");
      }

      const result = {
        title: f.title.trim() || `${f.category} Full Mock (3-Section)`,
        category: f.category,
        subject: "Full Mock",
        topic: "All 3 Sections",
        time: `${totalTimeMinutes} min`,
        durationMinutes: totalTimeMinutes,
        isSectionalTimed: true,
        questions: combinedRawQuestions.length,
        rawExtractedQuestions: combinedRawQuestions,
        color,
        isFree: f.isFree,
      };

      const finalQuestions = combinedRawQuestions.map((q, idx) => {
        const finalLetter = q.source_answer || "A";
        const ansIndex = Math.max(0, finalLetter.toUpperCase().charCodeAt(0) - 65);
        const optKeys = Object.keys(q.options || {}).sort();
        const optionsArray = optKeys.length > 0 ? optKeys.map(k => q.options[k]) : ["Option A", "Option B", "Option C", "Option D"];

        return {
          id: `pdf_q_${Date.now()}_${idx}`,
          section: q.section || "General",
          passage: q.passage || "",
          question: q.question_text || `Question ${idx + 1}`,
          options: optionsArray,
          correctAnswerIndex: ansIndex < optionsArray.length ? ansIndex : 0,
          explanation: q.explanation || "Verification pending."
        };
      });

      const draftTest = { ...result, questionsList: finalQuestions, id: "draft_" + Date.now() };
      setGeneratedTest(draftTest);
      setPdfStatus("done");
      pushToast(`✅ Multi-Section Mock extracted! ${combinedRawQuestions.length} questions ready to review.`);
    } catch (err) {
      console.error(err);
      setPdfStatus("error");
      setPdfPageInfo(err.message || "Error processing multi-section PDFs.");
      pushToast(err.message || "Error processing multi-section PDFs.");
    }
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return pushToast("Please upload a PDF file only.");
    }
    setPdfFile(file);
    setPdfStatus("extracting");
    setPdfPageInfo("");
    setGeneratedTest(null);
    setApprovedQuestions({});

    try {
      setPdfStatus("analyzing");
      setExtractionStartTime(Date.now());
      setPdfPageInfo("Extracting text from PDF locally...");
      
      // Dynamically load PDF.js to avoid Vite worker bundling issues
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(" ") + "\n";
      }

      const extractedQuestions = parseQuestionsFromPDFText(fullText, f.subject || "General", 200);
      setF(prev => ({ ...prev, questions: extractedQuestions.length }));

      if (extractedQuestions.length === 0) {
        throw new Error("NO_QUESTIONS_FOUND: Could not extract any questions using regex. Make sure the PDF contains standard numbered questions (e.g. '1. Question...') and options (e.g. 'A. Option...').");
      }

      setPdfPageInfo(`Successfully extracted ${extractedQuestions.length} questions`);

      const result = {
        title: f.title.trim() || `${f.category} PYQ - ${file.name.replace(".pdf", "")}`,
        category: f.category,
        subject: f.subject,
        topic: f.topic,
        time: f.time,
        durationMinutes: Math.max(1, parseInt(f.time) || 30),
        questions: extractedQuestions.length,
        rawExtractedQuestions: extractedQuestions,
      };

      result.color = color;
      result.isFree = f.isFree;

      // PHASE 2: Save Immediately
      const finalQuestions = [];
      result.rawExtractedQuestions.forEach((q, idx) => {
          const finalLetter = q.source_answer || "A";
          const ansIndex = Math.max(0, finalLetter.toUpperCase().charCodeAt(0) - 65);
          const optKeys = Object.keys(q.options || {}).sort();
          const optionsArray = optKeys.length > 0 
            ? optKeys.map(k => q.options[k]) 
            : ["Option A", "Option B", "Option C", "Option D"];

          finalQuestions.push({
            id: `pdf_q_${Date.now()}_${idx}`,
            section: q.subject || "General",
            passage: q.passage || "",
            question: q.question_text || `Question ${idx + 1}`,
            options: optionsArray,
            correctAnswerIndex: ansIndex < optionsArray.length ? ansIndex : 0,
            explanation: q.explanation || "Verification pending.",
          });
      });
      const draftTest = { ...result, questionsList: finalQuestions, id: "draft_" + Date.now() };
      
      setGeneratedTest(draftTest);
      setVerificationProgress("");
      setPdfStatus("done");
      pushToast(`✅ Mock test extracted successfully! Background verification started.`);
      
      // PHASE 3: Background Verification. The offline parser has already
      // produced a usable test; do not make dozens of failing AI calls and
      // destabilise the preview when the optional AI service is offline.
      if (responseData.warning) {
        const reviewable = result.rawExtractedQuestions.map((q) => ({
          ...q,
          answer_status: q.source_answer ? "NEEDS_REVIEW" : "NO_SOURCE_ANSWER",
          review_reason: q.source_answer
            ? "Answer retained from the PDF. AI verification was skipped."
            : "No answer key was found in the uploaded PDF.",
        }));
        setGeneratedTest((prev) => prev ? ({ ...prev, rawExtractedQuestions: reviewable }) : prev);
        setVerificationProgress("Offline extraction ready — review answers before publishing");
      } else {
        verifyQuestionsBackground(result.rawExtractedQuestions, (done, total, verifiedQs) => {
          setVerificationProgress(`${done}/${total} verified`);
          setGeneratedTest(prev => prev ? ({ ...prev, rawExtractedQuestions: [...verifiedQs] }) : prev);
        }).then(() => pushToast("Background verification complete!"));
      }
    } catch (err) {
      console.error("PDF processing error:", err);
      setPdfStatus("error");
      setPdfPageInfo(err.message || "Error processing PDF.");
      pushToast(err.message || "Error processing PDF.");
    }
  };

  const toggleApproveQuestion = (idx, isApproved) => {
    setApprovedQuestions(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        isApproved
      }
    }));
  };

  const editCorrectAnswer = (idx, answerLetter) => {
    setApprovedQuestions(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        editedAnswer: answerLetter
      }
    }));
  };

  const editPassage = (idx, passageText) => {
    setApprovedQuestions(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        passage: passageText
      }
    }));
  };

  const editQuestionSection = (idx, sectionName) => {
    setApprovedQuestions(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        section: sectionName
      }
    }));
  };

  const editQuestionText = (idx, text) => {
    setApprovedQuestions(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        questionText: text
      }
    }));
  };

  const editOptionText = (idx, optKey, text) => {
    setApprovedQuestions(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        options: {
          ...(prev[idx]?.options || {}),
          [optKey]: text
        }
      }
    }));
  };

  const attachImageToQuestion = (idx, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setApprovedQuestions(prev => ({
        ...prev,
        [idx]: {
          ...prev[idx],
          imageUrl: reader.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const approveAllVerified = (e) => {
    e?.preventDefault?.();
    if (!generatedTest || !generatedTest.rawExtractedQuestions) return;
    const newApprovals = { ...approvedQuestions };
    generatedTest.rawExtractedQuestions.forEach((q, idx) => {
      if (q.answer_status === "VERIFIED") {
        newApprovals[idx] = { ...newApprovals[idx], isApproved: true };
      }
    });
    setApprovedQuestions(newApprovals);
    pushToast("✅ All verified questions approved!");
  };

  const removeExtractedQuestion = (idx) => {
    if (!generatedTest || !generatedTest.rawExtractedQuestions) return;
    const updatedRaw = generatedTest.rawExtractedQuestions.filter((_, i) => i !== idx);
    setGeneratedTest(prev => ({
      ...prev,
      questions: updatedRaw.length,
      rawExtractedQuestions: updatedRaw
    }));
    pushToast(`Removed Question ${idx + 1}`);
  };

  return (
    <>
      <PageHeader icon={<ClipboardPlus size={22} />} title={isFreeByDefault ? "Create Free Mock Test" : "Create Mock Test"} subtitle="Design a test manually or generate automatically using AI (Past 5-Yr PYQs)" />

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="inline-flex p-1 rounded-2xl bg-black/[0.05]">
          <button
            onClick={() => setMode("ai")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === "ai" ? "bg-white shadow-card text-brand-700" : "text-ink-muted hover:text-ink-soft"}`}
          >
            <Sparkles size={16} className="text-amber-500" /> ✨ AI Mock Test Generator (Past 5-Yr PYQs)
          </button>
          <button
            onClick={() => setMode("pdf")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === "pdf" ? "bg-white shadow-card text-brand-700" : "text-ink-muted hover:text-ink-soft"}`}
          >
            <FileUp size={16} className="text-emerald-600" /> 📄 Single PDF PYQ
          </button>
          <button
            onClick={() => setMode("multipdf")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === "multipdf" ? "bg-white shadow-card text-amber-700 font-bold" : "text-ink-muted hover:text-ink-soft"}`}
          >
            <FileUp size={16} className="text-amber-500" /> 🏆 Full 3-Section Mock (3 PDFs)
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === "manual" ? "bg-white shadow-card text-brand-700" : "text-ink-muted hover:text-ink-soft"}`}
          >
            <Plus size={16} /> Manual Test Setup
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${((mode === "pdf" || mode === "multipdf") && generatedTest) ? "grid-cols-1" : "lg:grid-cols-[1.2fr_1fr]"}`}>
        {/* Left Form */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink">{mode === "ai" ? "AI Generation Settings" : mode === "pdf" ? "📄 Upload Question Paper PDF" : "Test Details"}</h3>
            <Badge color={color}>{f.category}</Badge>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-soft mb-1.5 block">Test Title (Optional for AI)</label>
            <input className="input" placeholder="e.g. IBPS PO Prelims 2024 Full Mock" value={f.title} onChange={(e) => set("title", e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Category / Exam</label>
              <select className="input" value={f.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Subject</label>
              <input type="text" className="input" placeholder="e.g. Quant" value={f.subject} onChange={(e) => set("subject", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Topic</label>
              <input type="text" className="input" placeholder="e.g. Simplification" value={f.topic} onChange={(e) => set("topic", e.target.value)} />
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Questions</label>
              <input className="input" type="number" min="1" max="200" value={f.questions} onChange={(e) => set("questions", e.target.value)} />
              <p className="text-[11px] text-ink-faint mt-1">Set any number from 1 to 200.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Duration (minutes)</label>
              <input className="input" type="number" min="1" max="300" value={String(f.time).replace(/\D/g, "")} onChange={(e) => set("time", `${e.target.value} min`)} />
              <p className="text-[11px] text-ink-faint mt-1">Set any duration from 1 to 300 minutes.</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isFreeMock" checked={f.isFree} onChange={(e) => set("isFree", e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-black/20" />
              <label htmlFor="isFreeMock" className="text-sm font-semibold text-ink-soft select-none cursor-pointer">
                Mark as <span className="text-brand-600 font-bold">Free Mock Test</span> (Shows in Free Mocks section)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isSectionalTimed" checked={f.isSectionalTimed || false} onChange={(e) => set("isSectionalTimed", e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-black/20" />
              <label htmlFor="isSectionalTimed" className="text-sm font-semibold text-ink-soft select-none cursor-pointer">
                Enable <span className="text-amber-600 font-bold">Banking Sectional Timers</span> (English 20m, Reasoning 20m, Quants 20m)
              </label>
            </div>
          </div>

          {/* PDF Upload Zone */}
          {mode === "pdf" && (
            <div className="pt-4 border-t border-black/5 space-y-4">
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handlePDFUpload}
              />

              <div
                onClick={() => pdfInputRef.current?.click()}
                className="group cursor-pointer border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-emerald-50/40 hover:bg-emerald-50/70 transition-all"
              >
                {pdfStatus === "extracting" || pdfStatus === "analyzing" ? (
                  <div className="space-y-3">
                    <Loader2 size={40} className="mx-auto text-emerald-600 animate-spin" />
                    <p className="font-bold text-emerald-900 text-sm">
                      {pdfStatus === "extracting" ? "📄 Extracting text from PDF..." : "🤖 AI is extracting questions..."}
                    </p>
                    {pdfPageInfo && <p className="text-xs text-emerald-700">{pdfPageInfo}</p>}
                    {extractionProgress && (
                      <div className="bg-emerald-100 rounded-full h-1.5 mt-2 overflow-hidden relative">
                        <div className="bg-emerald-500 absolute inset-y-0 left-0 w-full animate-pulse"></div>
                      </div>
                    )}
                    {extractionProgress && <p className="text-xs font-bold text-emerald-700">{extractionProgress}</p>}
                    {extractionElapsed > 0 && (
                      <p className="text-[10px] font-semibold text-emerald-600 mt-1">
                        Time elapsed: {extractionElapsed}s {extractionElapsed > 15 && "(Usually takes 15-30s)"}
                      </p>
                    )}
                  </div>
                ) : pdfStatus === "done" ? (
                  <div className="space-y-2">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
                    <p className="font-bold text-emerald-900 text-sm">✅ {generatedTest?.questions} questions found</p>
                    <p className="text-xs text-emerald-700">Mock ready</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-1">Click to upload a different PDF</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <FileUp size={32} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-ink text-sm">Drop your Previous Year Question Paper PDF here</p>
                      <p className="text-xs text-ink-muted mt-1">or click to browse · Supports IBPS, SBI, TNPSC, SSC question papers</p>
                    </div>
                    {pdfFile && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl text-xs text-ink-soft border border-black/5">
                        <FileText size={14} className="text-emerald-600" />
                        {pdfFile.name}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Removed redundant publish button, PDF auto-publishes and updates via Review Panel */}
            </div>
          )}

          {mode === "multipdf" && (
            <div className="pt-4 border-t border-black/5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
                <p className="font-bold text-amber-950 text-sm mb-1">🏆 3-Section Full Mock Builder</p>
                Upload individual section PDF papers below (e.g. Quants, Reasoning, English). The system will extract and combine them into a single Full Mock test with sectional timers.
              </div>

              <div className="space-y-3">
                {[
                  { key: "quants", title: "1. Quantitative Aptitude PDF", color: "border-blue-200 bg-blue-50/30" },
                  { key: "reasoning", title: "2. Reasoning Ability PDF", color: "border-purple-200 bg-purple-50/30" },
                  { key: "english", title: "3. English Language PDF", color: "border-emerald-200 bg-emerald-50/30" },
                ].map((sec) => (
                  <div key={sec.key} className={`border rounded-2xl p-4 ${sec.color} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink text-xs">{sec.title}</span>
                      {multiPdfFiles[sec.key].file && (
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">✓ Loaded</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-ink-muted block mb-1">Section Time</label>
                        <input
                          type="text"
                          className="input text-xs py-1"
                          value={multiPdfFiles[sec.key].time}
                          onChange={(e) => setMultiPdfFiles(prev => ({
                            ...prev,
                            [sec.key]: { ...prev[sec.key], time: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-ink-muted block mb-1">Target Questions</label>
                        <input
                          type="number"
                          className="input text-xs py-1"
                          value={multiPdfFiles[sec.key].count}
                          onChange={(e) => setMultiPdfFiles(prev => ({
                            ...prev,
                            [sec.key]: { ...prev[sec.key], count: +e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept=".pdf"
                        id={`multi_pdf_${sec.key}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setMultiPdfFiles(prev => ({
                              ...prev,
                              [sec.key]: { ...prev[sec.key], file }
                            }));
                          }
                        }}
                      />
                      <label
                        htmlFor={`multi_pdf_${sec.key}`}
                        className="btn-soft w-full text-xs py-2 cursor-pointer flex items-center justify-center gap-1.5 bg-white border border-black/10 hover:bg-black/5 text-ink-soft font-semibold"
                      >
                        <FileUp size={14} className="text-brand-600" />
                        {multiPdfFiles[sec.key].file ? multiPdfFiles[sec.key].file.name : `Select ${sec.title.split(" ")[1]} PDF`}
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleMultiPDFUpload}
                disabled={pdfStatus === "extracting" || pdfStatus === "analyzing"}
                className="btn-primary w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {pdfStatus === "extracting" || pdfStatus === "analyzing" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Extracting 3-Section Mock...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Process & Build Full 3-Section Mock Test
                  </>
                )}
              </button>
            </div>
          )}

          {mode === "manual" && (
            <div className="pt-4 border-t border-black/5 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-ink flex items-center gap-2">
                  <BookOpen size={16} className="text-brand-600" /> Manual Questions ({manualQuestions.length})
                </h4>
                <button type="button" onClick={addManualQuestion} className="btn-soft text-xs px-3 py-1.5 text-brand-700 bg-brand-50 hover:bg-brand-100 flex items-center gap-1">
                  <Plus size={14} /> Add Question
                </button>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {manualQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-2xl bg-black/[0.02] border border-black/5 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-700">Question {qIdx + 1}</span>
                      <button type="button" onClick={() => removeManualQuestion(qIdx)} className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold">
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[11px] font-semibold text-ink-muted mb-1 block">Paragraph Context (Optional)</label>
                        <textarea
                          className="input text-xs min-h-[60px]"
                          placeholder="e.g. Read the following passage and answer the questions..."
                          value={q.passage}
                          onChange={(e) => updateManualQuestion(qIdx, "passage", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-ink-muted mb-1 block">Image (Optional)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`img-upload-${qIdx}`}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  updateManualQuestion(qIdx, "imageUrl", reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label htmlFor={`img-upload-${qIdx}`} className="btn-soft text-xs px-3 py-1.5 bg-black/[0.03] hover:bg-black/[0.06] border border-black/10 cursor-pointer flex items-center gap-1.5 flex-1 justify-center whitespace-nowrap rounded-lg text-ink-soft font-semibold">
                            <ImageIcon size={14} /> {q.imageUrl ? "Change Image" : "Upload Image"}
                          </label>
                          {q.imageUrl && (
                            <button type="button" onClick={() => updateManualQuestion(qIdx, "imageUrl", "")} className="btn-ghost text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-100" title="Remove Image">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {q.imageUrl && (
                          <div className="mt-2 h-20 w-full rounded-xl border border-black/10 overflow-hidden relative group bg-black/5">
                             <img src={q.imageUrl} className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" alt="Preview" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-ink-muted mb-1 block">Question Statement</label>
                        <input
                          className="input text-xs"
                          placeholder="e.g. A train running at 72 km/h crosses a platform..."
                          value={q.question}
                          onChange={(e) => updateManualQuestion(qIdx, "question", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-ink-muted mb-1 block">Section Tag</label>
                        <input
                          className="input text-xs"
                          placeholder="Quant / Reasoning / GA"
                          value={q.section}
                          onChange={(e) => updateManualQuestion(qIdx, "section", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-black/5 flex items-center justify-center text-[10px] font-bold text-ink-soft shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <input
                            className="input text-xs py-1.5"
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            value={opt}
                            onChange={(e) => updateManualOption(qIdx, optIdx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-ink-muted mb-1 block">Correct Answer Option</label>
                        <select
                          className="input text-xs"
                          value={q.correctAnswerIndex}
                          onChange={(e) => updateManualQuestion(qIdx, "correctAnswerIndex", e.target.value)}
                        >
                          {q.options.map((o, oi) => (
                            <option key={oi} value={oi}>
                              Option {String.fromCharCode(65 + oi)}: {o || `Option ${String.fromCharCode(65 + oi)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-ink-muted mb-1 block">Solution Explanation</label>
                        <input
                          className="input text-xs"
                          placeholder="Step-by-step math shortcut or reason..."
                          value={q.explanation}
                          onChange={(e) => updateManualQuestion(qIdx, "explanation", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-black/5 flex items-center gap-4">
                      {q.imageUrl && (
                        <div className="relative h-12 w-20 rounded overflow-hidden border border-black/10">
                          <img src={q.imageUrl} alt="preview" className="w-full h-full object-cover" />
                          <button onClick={() => attachImageToManual(qIdx, null)} className="absolute top-0 right-0 bg-rose-600 text-white rounded p-0.5"><X size={10}/></button>
                        </div>
                      )}
                      <label className="btn-soft px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center gap-1 font-semibold rounded-lg border border-slate-200">
                        <Upload size={13} /> {q.imageUrl ? "Change Chart/Image" : "Attach Chart/Image"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => attachImageToManual(qIdx, e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            {mode === "ai" ? (
              <button onClick={handleGenerateAI} disabled={generating} className="btn-primary px-6 py-2.5 bg-gradient-to-r from-amber-500 to-purple-600 border-0 text-white font-bold">
                {generating ? <><Loader2 size={16} className="animate-spin" /> Generating PYQ Test...</> : <><Sparkles size={16} /> Generate AI Mock Test</>}
              </button>
            ) : mode === "manual" ? (
              <button onClick={publish} disabled={isPublishing} className="btn-primary px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold"><Plus size={16} /> Save & Publish Test</button>
            ) : null}

            {generatedTest && mode === "ai" && (
              <button onClick={publish} disabled={isPublishing} className="btn-primary px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white">
                <CheckCircle2 size={16} /> Publish Test
              </button>
            )}
          </div>
        </div>

        {/* Right Preview Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <h3 className="font-bold text-ink flex items-center gap-2 text-base">
              <Eye size={20} className="text-brand-600" /> {mode === "manual" ? "Manual Test Preview" : mode === "pdf" ? "📄 Extracted Questions Preview" : "AI Question Bank Preview"}
            </h3>

            {((mode === "pdf" || mode === "multipdf") && generatedTest) && (
              <button
                type="button"
                onClick={() => setIsFullPreview(true)}
                className="btn-soft px-3 py-1.5 text-xs bg-brand-50 text-brand-700 hover:bg-brand-100 flex items-center gap-1.5 font-bold rounded-xl border border-brand-200 shadow-sm transition-all active:scale-95"
              >
                <Maximize2 size={14} /> Fullscreen Maximize View
              </button>
            )}
          </div>

          {((mode === "pdf" || mode === "multipdf") && generatedTest) ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-bold text-emerald-900 text-sm">{generatedTest.title}</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {generatedTest.rawExtractedQuestions?.length || generatedTest.questions} Questions extracted from PDF · {generatedTest.time} · {generatedTest.category}
                  </p>
                  {pdfFile && <p className="text-[11px] text-emerald-600 mt-1 font-medium">📎 Source: {pdfFile.name}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setIsFullPreview(true)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-emerald-700"
                >
                  <Maximize2 size={13} /> Expand 100%
                </button>
              </div>

              <div className="max-h-[75vh] md:max-h-[850px] overflow-y-auto space-y-4 pr-1">
                {generatedTest.rawExtractedQuestions?.map((q, idx) => {
                  const finalAnswer = approvedQuestions[idx]?.editedAnswer || q.ai_verified_answer || q.source_answer || "A";

                  return (
                    <div key={idx} className="p-4 rounded-xl border-2 border-black/10 bg-slate-50/50 space-y-3 relative">
                      
                      {/* Question Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <select
                            className="input text-[11px] py-0.5 px-2 font-bold bg-white border-black/10 rounded"
                            value={approvedQuestions[idx]?.section || q.section || "General"}
                            onChange={(e) => editQuestionSection(idx, e.target.value)}
                          >
                            <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                            <option value="Reasoning Ability">Reasoning Ability</option>
                            <option value="English Language">English Language</option>
                            <option value="General Awareness">General Awareness</option>
                            <option value="General">General</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeExtractedQuestion(idx)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100"
                        >
                          <Trash2 size={13} /> Remove Q{idx + 1}
                        </button>
                      </div>

                      {/* Question Statement */}
                      <div>
                        <label className="text-[11px] font-bold text-ink-muted mb-1 block">Question Statement</label>

                        <div className="flex flex-wrap items-center gap-1 mb-1.5 bg-white p-1.5 rounded-lg border border-black/10">
                          <span className="text-[10px] font-bold text-ink-muted mr-1">Math Insert:</span>
                          {[
                            { label: "⅓", insert: " ⅓ " },
                            { label: "¼", insert: " ¼ " },
                            { label: "½", insert: " ½ " },
                            { label: "¾", insert: " ¾ " },
                            { label: "⅔", insert: " ⅔ " },
                            { label: "²", insert: "²" },
                            { label: "³", insert: "³" },
                            { label: "×", insert: " × " },
                            { label: "÷", insert: " ÷ " },
                            { label: "√", insert: " √" },
                          ].map((sym, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className="px-1.5 py-0.5 text-[11px] font-bold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded transition-colors"
                              onClick={() => {
                                const curText = approvedQuestions[idx]?.questionText ?? q.question_text;
                                editQuestionText(idx, formatMathText(curText + sym.insert));
                              }}
                            >
                              {sym.label}
                            </button>
                          ))}
                        </div>

                        <textarea
                          className="input text-xs font-semibold bg-white min-h-[60px]"
                          placeholder="Enter question statement..."
                          value={approvedQuestions[idx]?.questionText ?? q.question_text}
                          onChange={(e) => editQuestionText(idx, e.target.value)}
                        />
                      </div>

                      {/* Options List & Answer Key Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-ink-muted mb-1 block">
                          Options &amp; Correct Answer Key (Select radio button for correct option):
                        </label>

                        <div className="grid sm:grid-cols-2 gap-2">
                          {Object.entries(q.options || {}).map(([key, opt]) => {
                            const isRight = key === finalAnswer;
                            return (
                              <div
                                key={key}
                                onClick={() => {
                                  editCorrectAnswer(idx, key);
                                  toggleApproveQuestion(idx, true);
                                }}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                                  isRight 
                                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 font-bold' 
                                    : 'bg-white border-black/10 hover:border-emerald-300'
                                }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 transition-transform active:scale-95 ${
                                    isRight ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {key}
                                </span>

                                <input
                                  type="radio"
                                  name={`teacher_review_ans_${idx}`}
                                  checked={isRight}
                                  onChange={() => {
                                    editCorrectAnswer(idx, key);
                                    toggleApproveQuestion(idx, true);
                                  }}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                />

                                <input 
                                  className="input text-xs py-1 bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 flex-1 font-medium cursor-text"
                                  value={approvedQuestions[idx]?.options?.[key] ?? (opt || `Option ${key}`)}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => editOptionText(idx, key, e.target.value)}
                                  placeholder={`Option ${key}`}
                                />

                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                                    isRight ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {isRight ? "✓ Correct" : "Select"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Paragraph Context (Optional) */}
                      <div>
                        <label className="text-[11px] font-bold text-ink-muted mb-1 block">
                          Paragraph / Passage Directions Context (Optional):
                        </label>
                        <textarea
                          className="input text-xs min-h-[60px] bg-white border border-black/10"
                          placeholder="Paragraph Context (Optional) - e.g. Read the following passage..."
                          value={approvedQuestions[idx]?.passage ?? (q.passage || "")}
                          onChange={(e) => editPassage(idx, e.target.value)}
                        />
                      </div>

                      {/* Image Preview & Attachment */}
                      {approvedQuestions[idx]?.imageUrl && (
                        <div className="mt-2 relative max-w-sm rounded-lg overflow-hidden border border-black/10 bg-white">
                          <img src={approvedQuestions[idx].imageUrl} alt="Chart/Data" className="w-full h-auto object-contain" />
                          <button 
                            type="button"
                            className="absolute top-1 right-1 bg-rose-600 text-white rounded p-1 shadow-sm"
                            onClick={() => attachImageToQuestion(idx, null)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <label className="btn-soft px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center gap-1 font-semibold rounded-lg border border-slate-200">
                          <Upload size={13} /> {approvedQuestions[idx]?.imageUrl ? "Change Chart/Image" : "Attach Chart/Image"}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => attachImageToQuestion(idx, e.target.files[0])} />
                        </label>
                      </div>

                    </div>
                  );
                })}
              </div>
              <button onClick={applyPDFUpdates} className="btn-primary w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-emerald-500/20">
                <CheckCircle2 size={18} /> Apply Fixes & Publish Mock Test
              </button>
            </div>
          ) : mode === "pdf" && pdfStatus === "error" ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 text-red-500">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-2">
                <X size={24} />
              </div>
              <h3 className="font-bold text-lg">Extraction Failed</h3>
              <p className="text-sm max-w-sm">{pdfPageInfo}</p>
            </div>
          ) : mode === "pdf" && !generatedTest ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 text-ink-muted">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mb-2">
                <FileUp size={24} />
              </div>
              <h3 className="font-bold text-ink text-lg">Upload a question paper PDF</h3>
              <p className="text-sm max-w-xs">The AI will extract all questions, options, and answers from your PDF and show a preview here.</p>
            </div>
          ) : mode === "manual" ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
                <p className="font-bold text-brand-900 text-sm">{f.title || "Untitled Manual Test"}</p>
                <p className="text-xs text-brand-700 mt-1">{f.category} · {manualQuestions.length} Qs · {f.time}</p>
              </div>

              <div className="max-h-[450px] overflow-y-auto space-y-3 pr-1">
                {manualQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/[0.02] border border-black/5 text-xs space-y-1.5">
                    <p className="font-semibold text-ink">Q{idx + 1}. {q.question || "Enter question statement..."}</p>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-ink-muted">
                      {q.options.map((opt, oi) => (
                        <span key={oi} className={oi === +q.correctAnswerIndex ? "font-bold text-emerald-600" : ""}>
                          {String.fromCharCode(65 + oi)}: {opt || `Option ${String.fromCharCode(65 + oi)}`} {oi === +q.correctAnswerIndex ? "✓" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : generatedTest ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
                <p className="font-bold text-brand-900 text-sm">{generatedTest.title}</p>
                <p className="text-xs text-brand-700 mt-1">{generatedTest.questions} Qs · {generatedTest.time} · Past 5-Yr PYQ Pattern</p>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {generatedTest.questionsList?.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/[0.02] border border-black/5 text-xs space-y-1">
                    <p className="font-semibold text-ink">Q{idx + 1}. {q.question}</p>
                    <p className="text-emerald-700 font-medium">✓ Ans: {q.options?.[q.correctAnswerIndex]}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                 <button onClick={applyPDFUpdates} className="btn-primary w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-emerald-500/20">
                   <CheckCircle2 size={18} /> Apply Fixes & Update Mock Test
                 </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-ink-muted space-y-2">
              <Sparkles size={32} className="mx-auto text-amber-400 opacity-60" />
              <p className="font-semibold text-sm text-ink-soft">No AI test generated yet</p>
              <p className="text-xs">Select an exam category and click "Generate AI Mock Test" to automatically create questions based on past 5 years papers.</p>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN MAXIMIZE PREVIEW OVERLAY */}
      {isFullPreview && generatedTest && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl h-full bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-black/10">
            {/* Top Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                  <Eye size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">📄 Extracted Questions Preview (Full Screen)</h3>
                  <p className="text-xs text-slate-400">
                    {generatedTest.title} · {generatedTest.rawExtractedQuestions?.length || generatedTest.questions} Questions extracted from PDF
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={applyPDFUpdates}
                  className="btn-primary px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <CheckCircle2 size={16} /> Save &amp; Publish Test
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullPreview(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  title="Close Fullscreen View"
                >
                  <Minimize2 size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Questions Container */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
              {generatedTest.rawExtractedQuestions?.map((q, idx) => {
                const finalAnswer = approvedQuestions[idx]?.editedAnswer || q.ai_verified_answer || q.source_answer || "A";

                return (
                  <div key={idx} className="p-5 rounded-2xl border-2 border-black/10 bg-white space-y-4 shadow-sm relative hover:border-brand-200 transition-colors">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-sm font-extrabold shadow-sm">
                          {idx + 1}
                        </span>
                        <select
                          className="input text-xs py-1 px-3 font-bold bg-slate-50 border-black/10 rounded-xl"
                          value={approvedQuestions[idx]?.section || q.section || "General"}
                          onChange={(e) => editQuestionSection(idx, e.target.value)}
                        >
                          <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                          <option value="Reasoning Ability">Reasoning Ability</option>
                          <option value="English Language">English Language</option>
                          <option value="General Awareness">General Awareness</option>
                          <option value="General">General</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeExtractedQuestion(idx)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 transition-colors"
                      >
                        <Trash2 size={14} /> Remove Q{idx + 1}
                      </button>
                    </div>

                    {/* Question Statement */}
                    <div>
                      <label className="text-xs font-bold text-ink-muted mb-1 block">Question Statement</label>

                      <div className="flex flex-wrap items-center gap-1.5 mb-2 bg-slate-50 p-2 rounded-xl border border-black/10">
                        <span className="text-xs font-bold text-ink-muted mr-1">Math Insert:</span>
                        {[
                          { label: "⅓", insert: " ⅓ " },
                          { label: "¼", insert: " ¼ " },
                          { label: "½", insert: " ½ " },
                          { label: "¾", insert: " ¾ " },
                          { label: "⅔", insert: " ⅔ " },
                          { label: "²", insert: "²" },
                          { label: "³", insert: "³" },
                          { label: "×", insert: " × " },
                          { label: "÷", insert: " ÷ " },
                          { label: "√", insert: " √" },
                        ].map((sym, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            className="px-2 py-1 text-xs font-bold bg-white hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-lg transition-colors shadow-xs"
                            onClick={() => {
                              const curText = approvedQuestions[idx]?.questionText ?? q.question_text;
                              editQuestionText(idx, formatMathText(curText + sym.insert));
                            }}
                          >
                            {sym.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        className="input text-sm font-semibold bg-white min-h-[90px] p-3 border-black/10 focus:border-brand-500"
                        placeholder="Enter question statement..."
                        value={approvedQuestions[idx]?.questionText ?? q.question_text}
                        onChange={(e) => editQuestionText(idx, e.target.value)}
                      />
                    </div>

                    {/* Options List */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-ink-muted mb-1 block">
                        Options &amp; Correct Answer Key (Click radio button to mark correct option):
                      </label>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {Object.entries(q.options || {}).map(([key, opt]) => {
                          const isRight = key === finalAnswer;
                          return (
                            <div
                              key={key}
                              onClick={() => {
                                editCorrectAnswer(idx, key);
                                toggleApproveQuestion(idx, true);
                              }}
                              className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                                isRight 
                                  ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 font-bold shadow-sm' 
                                  : 'bg-slate-50 border-black/10 hover:border-emerald-300 hover:bg-white'
                              }`}
                            >
                              <span
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 transition-transform active:scale-95 ${
                                  isRight ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700'
                                }`}
                              >
                                {key}
                              </span>

                              <input
                                type="radio"
                                name={`teacher_review_ans_full_${idx}`}
                                checked={isRight}
                                onChange={() => {
                                  editCorrectAnswer(idx, key);
                                  toggleApproveQuestion(idx, true);
                                }}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                              />

                              <input 
                                className="input text-xs py-1.5 bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 flex-1 font-semibold cursor-text"
                                value={approvedQuestions[idx]?.options?.[key] ?? (opt || `Option ${key}`)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => editOptionText(idx, key, e.target.value)}
                                placeholder={`Option ${key}`}
                              />

                              <span
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                  isRight ? "bg-emerald-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600"
                                }`}
                              >
                                {isRight ? "✓ Correct" : "Select"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Paragraph Context */}
                    <div>
                      <label className="text-xs font-bold text-ink-muted mb-1 block">
                        Paragraph / Passage Directions Context (Optional):
                      </label>
                      <textarea
                        className="input text-xs min-h-[70px] bg-white border border-black/10 p-2.5"
                        placeholder="Paragraph Context (Optional) - e.g. Read the following passage..."
                        value={approvedQuestions[idx]?.passage ?? (q.passage || "")}
                        onChange={(e) => editPassage(idx, e.target.value)}
                      />
                    </div>

                    {/* Image Preview & Attachment */}
                    {approvedQuestions[idx]?.imageUrl && (
                      <div className="mt-2 relative max-w-md rounded-xl overflow-hidden border border-black/10 bg-white">
                        <img src={approvedQuestions[idx].imageUrl} alt="Chart/Data" className="w-full h-auto object-contain max-h-60" />
                        <button 
                          type="button"
                          className="absolute top-2 right-2 bg-rose-600 text-white rounded-lg p-1.5 shadow-md"
                          onClick={() => attachImageToQuestion(idx, null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <label className="btn-soft px-3.5 py-2 text-xs bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center gap-1.5 font-bold rounded-xl border border-slate-200">
                        <Upload size={14} /> {approvedQuestions[idx]?.imageUrl ? "Change Chart/Image" : "Attach Chart/Image"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => attachImageToQuestion(idx, e.target.files[0])} />
                      </label>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Bottom Modal Footer */}
            <div className="p-4 bg-white border-t border-black/10 flex items-center justify-between shrink-0">
              <span className="text-xs text-ink-muted font-medium">Reviewing {generatedTest.rawExtractedQuestions?.length || 0} extracted questions in full screen.</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFullPreview(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Exit Fullscreen
                </button>
                <button
                  type="button"
                  onClick={applyPDFUpdates}
                  className="btn-primary px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 size={16} /> Save &amp; Publish Test
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* LLM Key Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setShowKeyModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-lift space-y-5 border border-black/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h3 className="font-extrabold text-lg text-ink flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" /> Connect LLM Models for AI Mock Tests
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="text-ink-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-ink-muted">
              Configure your API key for Google Gemma-7B, Google Gemini, OpenAI, or DeepSeek below.
            </p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" /> 1. Google Gemma-7B Open Model (HuggingFace / Groq / Ollama / NVIDIA NIM)
                </label>
                <input
                  type="password"
                  className="input font-mono text-xs bg-white"
                  placeholder="HuggingFace / Groq API Key (hf_... / gsk_...)"
                  value={keys.gemma}
                  onChange={(e) => setKeys({ ...keys, gemma: e.target.value })}
                />
                <input
                  type="text"
                  className="input font-mono text-xs bg-white"
                  placeholder="Custom Endpoint URL (e.g. http://localhost:11434/v1/chat/completions)"
                  value={keys.gemmaEndpoint}
                  onChange={(e) => setKeys({ ...keys, gemmaEndpoint: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-soft mb-1 block">2. Google Gemini API Key (Recommended - Free)</label>
                <input
                  type="password"
                  className="input font-mono text-xs"
                  placeholder="AIzaSy..."
                  value={keys.gemini}
                  onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-soft mb-1 block">3. OpenAI API Key (GPT-4o / GPT-4o-mini)</label>
                <input
                  type="password"
                  className="input font-mono text-xs"
                  placeholder="sk-proj-..."
                  value={keys.openai}
                  onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-soft mb-1 block">4. DeepSeek API Key (DeepSeek-R1 / DeepSeek-Chat)</label>
                <input
                  type="password"
                  className="input font-mono text-xs"
                  placeholder="sk-..."
                  value={keys.deepseek}
                  onChange={(e) => setKeys({ ...keys, deepseek: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setShowKeyModal(false)} className="btn-ghost text-xs px-4 py-2">
                Cancel
              </button>
              <button onClick={saveKeys} className="btn-primary text-xs px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold">
                Save API Keys
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Existing Mock Tests */}
      <div className="mt-10 card p-6">
        <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
          <Trash2 size={18} className="text-rose-500" /> Manage Existing {isFreeByDefault ? "Free" : "Premium"} Mock Tests
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {mockTests.filter(t => !!t.isFree === isFreeByDefault).length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-4">No tests found.</p>
          ) : (
            mockTests
              .filter(t => !!t.isFree === isFreeByDefault)
              .map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 rounded-xl border border-black/5 bg-black/[0.02]">
                  <div>
                    <h4 className="font-bold text-sm text-ink">{test.title}</h4>
                    <p className="text-xs text-ink-muted mt-1">{test.category} · {test.questions} Qs · {test.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEditTest(test)}
                      className="btn-soft px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-brand-200"
                    >
                      <Edit3 size={14} /> Edit / Modify Test
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this mock test? This action cannot be undone.")) {
                          deleteMockTest(test.id);
                        }
                      }}
                      className="btn-soft px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold"
                    >
                      Delete Test
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Edit Test Modal */}
      {editingTest && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-black/10">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={20} className="text-amber-400" />
                <h3 className="font-bold text-base">Edit &amp; Modify Mock Test</h3>
              </div>
              <button onClick={() => setEditingTest(null)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Test Basic Controls */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-bold text-xs text-ink uppercase tracking-wider">Test Settings</h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-ink-muted mb-1 block">Test Title</label>
                    <input
                      className="input text-xs font-bold"
                      value={editingTest.title}
                      onChange={(e) => updateEditingField("title", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-ink-muted mb-1 block">Time Limit</label>
                    <input
                      className="input text-xs"
                      value={editingTest.time}
                      onChange={(e) => updateEditingField("time", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-ink-muted mb-1 block">Category</label>
                    <select
                      className="input text-xs font-semibold bg-white"
                      value={editingTest.category}
                      onChange={(e) => updateEditingField("category", e.target.value)}
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        checked={!!editingTest.isSectionalTimed}
                        onChange={(e) => updateEditingField("isSectionalTimed", e.target.checked)}
                      />
                      Banking Sectional Timer Enabled (20 min/Section)
                    </label>
                  </div>
                </div>
              </div>

              {/* Questions Manager */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-ink flex items-center gap-2">
                    <BookOpen size={16} className="text-brand-600" /> Test Questions ({editingTest.questionsList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addEditingQuestion}
                    className="btn-soft text-xs px-3 py-1.5 text-brand-700 bg-brand-50 hover:bg-brand-100 flex items-center gap-1 border border-brand-200 font-bold"
                  >
                    <Plus size={14} /> Add New Question
                  </button>
                </div>

                {editingTest.questionsList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-xs text-ink-muted">No questions in this test yet. Click "+ Add New Question" to add one.</p>
                  </div>
                ) : (
                  editingTest.questionsList.map((q, qIdx) => (
                    <div key={q.id || qIdx} className="p-4 rounded-xl border-2 border-black/10 bg-slate-50/50 space-y-3 relative">
                      
                      {/* Question Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                            {qIdx + 1}
                          </span>
                          <select
                            className="input text-[11px] py-0.5 px-2 font-bold bg-white border-black/10 rounded"
                            value={q.section || "General"}
                            onChange={(e) => updateEditingQuestion(qIdx, "section", e.target.value)}
                          >
                            <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                            <option value="Reasoning Ability">Reasoning Ability</option>
                            <option value="English Language">English Language</option>
                            <option value="General Awareness">General Awareness</option>
                            <option value="General">General</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeEditingQuestion(qIdx)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100"
                        >
                          <Trash2 size={13} /> Remove Q{qIdx + 1}
                        </button>
                      </div>

                      {/* Question Statement */}
                      <div>
                        <label className="text-[11px] font-bold text-ink-muted mb-1 block">Question Statement</label>

                        <div className="flex flex-wrap items-center gap-1 mb-1.5 bg-white p-1.5 rounded-lg border border-black/10">
                          <span className="text-[10px] font-bold text-ink-muted mr-1">Math Insert:</span>
                          {[
                            { label: "⅓", insert: " ⅓ " },
                            { label: "¼", insert: " ¼ " },
                            { label: "½", insert: " ½ " },
                            { label: "¾", insert: " ¾ " },
                            { label: "⅔", insert: " ⅔ " },
                            { label: "²", insert: "²" },
                            { label: "³", insert: "³" },
                            { label: "×", insert: " × " },
                            { label: "÷", insert: " ÷ " },
                            { label: "√", insert: " √" },
                          ].map((sym, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className="px-1.5 py-0.5 text-[11px] font-bold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded transition-colors"
                              onClick={() => {
                                updateEditingQuestion(qIdx, "question", (q.question || "") + sym.insert);
                              }}
                            >
                              {sym.label}
                            </button>
                          ))}
                        </div>

                        <textarea
                          className="input text-xs font-semibold bg-white min-h-[60px]"
                          placeholder="Enter question text..."
                          value={q.question || ""}
                          onChange={(e) => updateEditingQuestion(qIdx, "question", e.target.value)}
                        />
                      </div>

                      {/* Options List & Answer Key Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-ink-muted mb-1 block">
                          Options &amp; Correct Answer Key (Select radio button for correct option):
                        </label>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {q.options?.map((opt, optIdx) => {
                            const isCorrect = (q.correctAnswerIndex ?? 0) === optIdx;
                            const letter = String.fromCharCode(65 + optIdx);
                            return (
                              <div
                                key={optIdx}
                                onClick={() => updateEditingQuestion(qIdx, "correctAnswerIndex", optIdx)}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                                  isCorrect ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 font-bold' : 'bg-white border-black/10 hover:border-emerald-300'
                                }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 transition-transform active:scale-95 ${
                                    isCorrect ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {letter}
                                </span>
                                <input
                                  type="radio"
                                  name={`correct_ans_${editingTest.id}_${qIdx}`}
                                  checked={isCorrect}
                                  onChange={() => updateEditingQuestion(qIdx, "correctAnswerIndex", optIdx)}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                />
                                <input
                                  className="input text-xs py-1 bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 flex-1 font-medium cursor-text"
                                  value={opt}
                                  onClick={() => updateEditingQuestion(qIdx, "correctAnswerIndex", optIdx)}
                                  onChange={(e) => updateEditingOption(qIdx, optIdx, e.target.value)}
                                  placeholder={`Option ${letter}`}
                                />
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                                    isCorrect ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {isCorrect ? "✓ Correct" : "Select"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Paragraph Context (Optional) */}
                      <div>
                        <label className="text-[11px] font-bold text-ink-muted mb-1 block">Paragraph / Passage Directions Context (Optional):</label>
                        <textarea
                          className="input text-xs bg-white min-h-[50px]"
                          placeholder="Read the following passage and answer the questions..."
                          value={q.passage || ""}
                          onChange={(e) => updateEditingQuestion(qIdx, "passage", e.target.value)}
                        />
                      </div>

                      {/* Image / Chart Attachment */}
                      <div>
                        <label className="text-[11px] font-bold text-ink-muted mb-1 block">Chart / Image Attachment (Optional):</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`edit-img-upload-${qIdx}`}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  updateEditingQuestion(qIdx, "imageUrl", reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor={`edit-img-upload-${qIdx}`}
                            className="btn-soft text-xs px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer flex items-center gap-1.5 flex-1 justify-center whitespace-nowrap rounded-lg text-ink-soft font-semibold"
                          >
                            <ImageIcon size={14} /> {q.imageUrl ? "Change Image/Chart" : "Attach Chart/Image"}
                          </label>
                          {q.imageUrl && (
                            <button
                              type="button"
                              onClick={() => updateEditingQuestion(qIdx, "imageUrl", "")}
                              className="btn-ghost text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-100"
                              title="Remove Image"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {q.imageUrl && (
                          <div className="mt-2 h-28 w-full max-w-sm rounded-xl border border-black/10 overflow-hidden relative group bg-black/5 p-1">
                             <img src={q.imageUrl} className="w-full h-full object-contain" alt="Attached preview" />
                          </div>
                        )}
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="text-[11px] font-bold text-ink-muted mb-1 block">Step-by-Step Explanation / Solution:</label>
                        <textarea
                          className="input text-xs bg-white min-h-[50px]"
                          placeholder="Provide step-by-step solution..."
                          value={q.explanation || ""}
                          onChange={(e) => updateEditingQuestion(qIdx, "explanation", e.target.value)}
                        />
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setEditingTest(null)}
                className="btn-soft px-4 py-2 text-xs font-bold text-ink-soft bg-white border border-slate-200 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditingTest}
                disabled={isSavingEdit}
                className="btn-primary px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2"
              >
                {isSavingEdit ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Save &amp; Update Test in Cloud
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------ Manage Students ---------------------------- */
export function ManageStudentsPage() {
  const { students = [], pushToast } = useApp();
  const [q, setQ] = useState("");
  const [, refresh] = useState(0);
  
  const EXAMS = [
    { id: "banking", label: "Banking" },
    { id: "tnpsc", label: "TNPSC" },
    { id: "ssc", label: "SSC" },
    { id: "railway", label: "Railway" },
    { id: "navy", label: "Navy" }
  ];

  const list = students.filter((s) => `${s.name || ""} ${s.phone || ""}`.toLowerCase().includes(q.toLowerCase()));
  
  const exportCsv = () => {
    const quote = (value) => `"${String(value || "").replaceAll('"', '""')}"`;
    const rows = ["Student Name,Mobile Number,Joining Date,Access", ...list.map(s => {
      let accessStr = "Payment required";
      if (s.access === "academy") accessStr = "All Academy";
      else if (Array.isArray(s.access) && s.access.length > 0) accessStr = s.access.join(", ");
      return [s.name, s.phone, s.joined, accessStr].map(quote).join(",");
    })];
    const url = URL.createObjectURL(new Blob(["\ufeff" + rows.join("\n")], { type:"text/csv;charset=utf-8" }));
    const a=document.createElement("a"); a.href=url; a.download=`ken-academy-students-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const togglePackage = async (student, packageId) => {
    let currentAccess = student.access;
    if (currentAccess === "academy") currentAccess = EXAMS.map(e => e.id);
    if (!Array.isArray(currentAccess)) currentAccess = [];
    
    const hasAccess = currentAccess.includes(packageId);
    let nextAccess;
    
    if (hasAccess) {
      nextAccess = currentAccess.filter(id => id !== packageId);
    } else {
      nextAccess = [...currentAccess, packageId];
    }
    
    if (nextAccess.length === EXAMS.length) nextAccess = "academy";
    else if (nextAccess.length === 0) nextAccess = "payment_required";

    setStudentAccess(student.id, nextAccess);
    refresh(v => v + 1);

    if (useRealtimeBackend) {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { getFirebaseDb } = await import("../../firebase.js");
        const db = await getFirebaseDb();

        if (hasAccess) {
          await fsRemoveUserPurchase(student.id, packageId);
        } else {
          await fsUpdateUserPurchases(student.id, packageId);
        }

        const isPaid = nextAccess !== "payment_required";
        await setDoc(doc(db, "users", student.id), {
          access: nextAccess,
          paid: isPaid,
          premium: isPaid,
          hasFullAccess: nextAccess === "academy"
        }, { merge: true });
      } catch (err) {
        console.error("Failed to sync access to Firebase", err);
      }
    }
    pushToast(`Access updated for ${student.name || "Student"}`);
  };

  const grantAll = async (student) => {
    setStudentAccess(student.id, "academy");
    refresh(v => v + 1);
    if (useRealtimeBackend) {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { getFirebaseDb } = await import("../../firebase.js");
        const db = await getFirebaseDb();

        for (const e of EXAMS) {
          await fsUpdateUserPurchases(student.id, e.id).catch(()=>{});
        }

        await setDoc(doc(db, "users", student.id), {
          access: "academy",
          paid: true,
          premium: true,
          hasFullAccess: true,
          tuitionFeePaid: true
        }, { merge: true });
      } catch (err) {
        console.error("Failed to sync grantAll to Firebase", err);
      }
    }
    pushToast(`Full Academy access granted to ${student.name || "Student"}`);
  };

  return <><PageHeader icon={<Users size={22}/>} title="Manage Students" subtitle={`${students.length} registered student${students.length === 1 ? "" : "s"}`} action={<button onClick={exportCsv} className="btn-primary text-sm px-4 py-2.5"><Download size={16}/>Download Excel CSV</button>}/>
    <div className="card overflow-hidden"><div className="p-4 border-b border-black/5"><div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"/><input className="input pl-9" placeholder="Search student name or mobile number..." value={q} onChange={e=>setQ(e.target.value)}/></div></div><div className="overflow-x-auto"><table className="w-full text-sm min-w-[690px]"><thead><tr className="text-left text-xs text-ink-muted uppercase tracking-wide border-b border-black/5"><th className="px-5 py-3 font-semibold w-[200px]">Student name</th><th className="px-5 py-3 font-semibold w-[150px]">Mobile number</th><th className="px-5 py-3 font-semibold min-w-[280px]">Category-wise Mock Access</th></tr></thead><tbody className="divide-y divide-black/5">{list.length===0?<tr><td colSpan={3} className="px-5 py-8 text-center text-ink-muted">No registered students found yet.</td></tr>:list.map(s=>{
      const isAll = s.access === "academy";
      const accessArr = Array.isArray(s.access) ? s.access : (isAll ? EXAMS.map(e => e.id) : []);
      
      return <tr key={s.id||s.phone} className="hover:bg-black/[0.02]"><td className="px-5 py-3 font-semibold text-ink">{s.name||"Student"} <span className="block text-xs font-normal text-ink-muted mt-0.5">{s.joined}</span></td><td className="px-5 py-3 text-ink-soft">{s.phone||"Not provided"}</td><td className="px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {EXAMS.map(e => {
            const hasAccess = accessArr.includes(e.id);
            return (
              <button key={e.id} onClick={() => togglePackage(s, e.id)} className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors border ${hasAccess ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-black/5 text-ink-muted border-black/10 hover:bg-black/10"}`}>
                {e.label} {hasAccess && "✓"}
              </button>
            )
          })}
          {!isAll && (
            <button onClick={() => grantAll(s)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 ml-2">
              Grant All
            </button>
          )}
        </div>
      </td></tr>
    })}</tbody></table></div></div><p className="text-xs text-ink-muted mt-3">Select individual exam categories to permit a student to access its full mock package. If you grant all, they receive universal academy access.</p></>;
}

/* -------------------------------- Announcements ---------------------------- */
export function AnnouncementsPage() {
  const { announce, notifications, pushToast } = useApp();
  const [f, setF] = useState({ title: "", body: "" });
  const send = () => {
    if (!f.title || !f.body) return pushToast("Fill both fields");
    announce(f.title, f.body);
    setF({ title: "", body: "" });
  };
  return (
    <>
      <PageHeader icon={<Megaphone size={22} />} title="Notifications" subtitle="Broadcast announcements to all students" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-ink flex items-center gap-2"><Bell size={17} className="text-brand-600"/> New announcement</h3>
          <input className="input" placeholder="Title (e.g. Mock test schedule)" value={f.title} onChange={(e)=>setF({...f,title:e.target.value})} />
          <textarea className="input min-h-[110px] resize-none" placeholder="Message body..." value={f.body} onChange={(e)=>setF({...f,body:e.target.value})} />
          <button onClick={send} className="btn-primary px-5 py-2.5"><Send size={16}/> Send to all students</button>
        </div>
        <div className="card p-6">
          <h3 className="font-bold text-ink mb-4">Recently sent</h3>
          <div className="space-y-3">
            {notifications.map((n)=>(
              <div key={n.id} className="flex gap-3 items-start p-3 rounded-xl hover:bg-black/[0.03]">
                <span className="text-lg">{n.icon}</span>
                <div><p className="text-sm font-semibold text-ink">{n.title}</p><p className="text-xs text-ink-muted">{n.body}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* --------------------------------- Analytics -------------------------------- */
export function AnalyticsPage() {
  const bars = [30, 55, 42, 70, 58, 85, 64, 90, 72, 78, 88, 95];
  return (
    <>
      <PageHeader icon={<TrendingUp size={22} />} title="Analytics" subtitle="Growth and performance insights" />
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-ink mb-5">Monthly Active Students</h3>
          <div className="flex items-end gap-2 h-48">
            {bars.map((v,i)=>(
              <motion.div key={i} initial={{height:0}} animate={{height:`${v}%`}} transition={{delay:i*0.04,duration:0.5}} className="flex-1 rounded-t-lg bg-gradient-to-t from-brand-600 to-fuchsia-400" />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-ink-faint mt-2"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span></div>
        </div>
        <div className="card p-6">
          <h3 className="font-bold text-ink mb-4">Category-wise materials</h3>
          <div className="space-y-4">
            {CATEGORIES.slice(0,5).map((c,i)=>(
              <div key={c.id}>
                <div className="flex justify-between text-sm mb-1.5"><span className="flex items-center gap-2 text-ink-soft">{c.icon} {c.name}</span><span className="font-bold text-ink">{c.materials}</span></div>
                <ProgressBar value={c.materials/210*100} color={c.color}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------ Manage Courses ------------------------------ */
export function ManageCoursesPage() {
  const { pushToast } = useApp();
  return (
    <>
      <PageHeader icon={<BookOpen size={22} />} title="Manage Courses" subtitle="Edit or add new courses" action={<button onClick={()=>pushToast("New course form opened")} className="btn-primary text-sm px-4 py-2.5"><Plus size={16}/> Add Course</button>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COURSE_PROGRESS.map((c,i)=>(
          <div key={c.id} className="card card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl">{c.thumb}</span>
              <Badge color={c.color}>{c.category}</Badge>
            </div>
            <h3 className="font-bold text-ink mb-1">{c.title}</h3>
            <p className="text-xs text-ink-muted mb-3">{c.lessons} lessons · 0 completed</p>
            <ProgressBar value={c.progress} color={c.color}/>
            <div className="flex gap-2 mt-4">
              <button onClick={()=>pushToast(`Editing ${c.title}`)} className="btn-soft flex-1 text-xs py-2">Edit</button>
              <button onClick={()=>pushToast(`${c.title} disabled`)} className="btn-soft flex-1 text-xs py-2">Disable</button>
            </div>
          </div>
        ))}
        <button onClick={()=>pushToast("New course form opened")} className="rounded-card border-2 border-dashed border-black/10 p-5 flex flex-col items-center justify-center text-ink-muted hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/40 transition-colors min-h-[180px]">
          <Plus size={28}/>
          <span className="text-sm font-semibold mt-2">Add new course</span>
        </button>
      </div>
    </>
  );
}

/* -------------------------- Plans & Coupon Codes -------------------------- */
export function PlansPage() {
  const { pushToast } = useApp();
  const defaults = [
    { id: "banking", name: "Banking Full Mock Package", amount: "499", exams: "SBI, IBPS & RRB" },
    { id: "tnpsc", name: "TNPSC Full Mock Package", amount: "599", exams: "Group I, II, IV & VAO" },
    { id: "ssc", name: "SSC Full Mock Package", amount: "499", exams: "CGL, CHSL, MTS & GD" },
    { id: "railway", name: "Railway Full Mock Package", amount: "399", exams: "NTPC, Group D & ALP" },
    { id: "navy", name: "Defence & Navy Mock Package", amount: "399", exams: "Navy, NDA & Agniveer" },
  ];
  const [plans, setPlans] = useState(() => { try { return JSON.parse(localStorage.getItem("ken_plans")) || defaults; } catch { return defaults; } });
  const [coupon, setCoupon] = useState({ code: "", discount: "", description: "" });
  const [coupons, setCoupons] = useState(() => { try { return JSON.parse(localStorage.getItem("ken_coupons")) || []; } catch { return []; } });
  const savePlans = (next) => { setPlans(next); localStorage.setItem("ken_plans", JSON.stringify(next)); pushToast("Plans saved. Students will see the updated prices."); };
  const addCoupon = () => { if (!coupon.code.trim() || !Number(coupon.discount)) return pushToast("Enter a coupon code and discount percentage."); const next=[...coupons,{...coupon,code:coupon.code.trim().toUpperCase()}];setCoupons(next);localStorage.setItem("ken_coupons",JSON.stringify(next));setCoupon({code:"",discount:"",description:""});pushToast("Coupon created successfully."); };
  return <><PageHeader icon={<ClipboardPlus size={22}/>} title="Plans, Pricing & Offers" subtitle="Set full mock-package amounts and promotional coupon codes."/>
    <div className="grid xl:grid-cols-[1.35fr_.85fr] gap-6"><section className="card p-6"><h3 className="font-bold text-ink mb-1">Full mock-test packages</h3><p className="text-sm text-ink-muted mb-5">The first mock remains free. Students see these amounts when a package is locked.</p><div className="space-y-3">{plans.map((plan,i)=><div key={plan.id} className="rounded-xl border border-black/5 p-4 grid sm:grid-cols-[1fr_120px] gap-3"><div><p className="font-semibold text-ink">{plan.name}</p><p className="text-xs text-ink-muted">{plan.exams}</p></div><label className="text-xs font-semibold text-ink-muted">Amount (₹)<input className="input mt-1 py-2" type="number" min="0" value={plan.amount} onChange={e=>savePlans(plans.map((p,x)=>x===i?{...p,amount:e.target.value}:p))}/></label></div>)}</div></section>
    <section className="card p-6"><h3 className="font-bold text-ink">Create offer coupon</h3><p className="text-sm text-ink-muted mt-1 mb-5">Coupons can be applied at payment checkout.</p><div className="space-y-3"><input className="input" placeholder="Code e.g. BANK20" value={coupon.code} onChange={e=>setCoupon({...coupon,code:e.target.value})}/><input className="input" type="number" min="1" max="100" placeholder="Discount %" value={coupon.discount} onChange={e=>setCoupon({...coupon,discount:e.target.value})}/><input className="input" placeholder="Offer description (optional)" value={coupon.description} onChange={e=>setCoupon({...coupon,description:e.target.value})}/><button onClick={addCoupon} className="btn-primary w-full py-2.5"><Plus size={16}/>Create coupon</button></div><div className="mt-6 pt-5 border-t border-black/5 space-y-2">{coupons.length===0?<p className="text-sm text-ink-muted">No coupons created yet.</p>:coupons.map((c,i)=><div key={c.code} className="flex justify-between rounded-lg bg-brand-50 p-3"><span><b>{c.code}</b><small className="block text-ink-muted">{c.description}</small></span><span className="font-bold text-brand-700">{c.discount}% OFF <button onClick={()=>{const n=coupons.filter((_,x)=>x!==i);setCoupons(n);localStorage.setItem("ken_coupons",JSON.stringify(n))}} className="ml-2 text-rose-600">×</button></span></div>)}</div></section></div></>;
}

export function AdmissionsPage() {
  const { admissions = [] } = useApp();

  return (
    <>
      <PageHeader
        icon={<Users size={22} />}
        title="Admission Inquiries"
        subtitle="Manage leads collected from the website popup."
      />
      
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-black/5 text-ink-muted">
              <tr>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">Mobile Number</th>
                <th className="py-3 px-4 font-medium">Email ID</th>
                <th className="py-3 px-4 font-medium">Target Exam</th>
                <th className="py-3 px-4 font-medium">Mode of Learning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-ink-muted">
                    No admission inquiries yet. Leads submitted from website popups & free mocks will appear here live!
                  </td>
                </tr>
              ) : (
                admissions.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-ink-muted text-xs font-semibold">
                      {new Date(lead.createdAt?.toMillis ? lead.createdAt.toMillis() : Date.now()).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-ink">{lead.fullName || lead.name || "Student"}</td>
                    <td className="py-3 px-4 font-bold text-brand-600">
                      <a href={`tel:${lead.mobileNumber}`} className="hover:underline flex items-center gap-1">
                        📞 {lead.mobileNumber}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-ink-muted text-xs">
                      {lead.emailId ? (
                        <a href={`mailto:${lead.emailId}`} className="hover:underline">{lead.emailId}</a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-lg text-xs">
                        {lead.targetExam || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge>{lead.modeOfLearning || "Online"}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

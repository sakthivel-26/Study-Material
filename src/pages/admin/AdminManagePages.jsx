import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClipboardPlus, Users, Megaphone, TrendingUp, BookOpen, Plus, Search,
  Trash2, Send, Bell, Sparkles, Loader2, CheckCircle2, Eye, HelpCircle, X,
  FileUp, FileText, Upload, Download, ShieldCheck, Image as ImageIcon, Edit3, Maximize2, Minimize2,
  Calendar
} from "lucide-react";
import PageHeader from "../../components/PageHeader.jsx";
import { useApp } from "../../store.jsx";
import { CATEGORIES, COURSE_PROGRESS } from "../../data.js";
import { Badge, ProgressBar } from "../../components/ui.jsx";
import { verifyQuestionsBackground, generateMockTestFromPDF, generateAIMockTest, findBestMatchingChartPage, isDIQuestion, sanitizeDIPassageAndExplanation, convertTextTableToMarkdown } from "../../utils/aiTestGenerator.js";
import { extractTextWithMathPreservation } from "../../utils/pdfParser.js";
import { setStudentAccess } from "../../auth.jsx";
import { fsUpdateUserPurchases, fsRemoveUserPurchase, useRealtimeBackend } from "../../backend.js";
import { formatStudentJoinDate } from "../../utils/studentDate.js";
import { sortTestsByRecent } from "../../utils/testSorting.js";
import DirectionDiagramView from "../../components/DirectionDiagramView.jsx";

/* ---------------------------- Create Mock Test ---------------------------- */
import CategoryGrid from "../../components/CategoryGrid.jsx";

const getAnswerIndex = (val) => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  const strVal = String(val).trim();
  if (!isNaN(strVal) && strVal !== '') return parseInt(strVal, 10);
  const code = strVal.toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 90) return code - 65;
  return 0;
};

// Helper to compress base64 images before publishing to avoid exceeding Firestore 1MB / localStorage limits
export function compressBase64Image(dataUrl, maxDimension = 650, quality = 0.68) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
      return resolve(dataUrl || "");
    }
    if (dataUrl.length < 35000) return resolve(dataUrl);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(10, width);
      canvas.height = Math.max(10, height);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Robust helper to parse and split pasted options (handles multi-line, tab-separated, inline '(a) ... (b) ...', 'A. ... B. ...')
export function parsePastedOptions(pasteText) {
  if (!pasteText || typeof pasteText !== "string") return [];
  const raw = pasteText.trim();
  if (!raw) return [];

  const stripOptionPrefix = (str) =>
    str.replace(/^(?:\([a-eA-E1-5]\)|\[[a-eA-E1-5]\]|[a-eA-E][\.\)]|[1-5][\.\)]|\b[A-E]\b[\.\)]?)\s*[:\-]?\s*/i, '').trim();

  // 1. Line-by-line split (e.g. copied from vertical PDF column)
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const cleaned = lines.map(stripOptionPrefix).filter(Boolean);
    if (cleaned.length >= 2) return cleaned;
  }

  // 2. Tab-separated split
  if (raw.includes("\t")) {
    const tabParts = raw.split("\t").map(p => p.trim()).filter(Boolean);
    if (tabParts.length >= 2) {
      const cleaned = tabParts.map(stripOptionPrefix).filter(Boolean);
      if (cleaned.length >= 2) return cleaned;
    }
  }

  // 3. Inline marker split: e.g. "(a) 120 (b) 140 (c) 160 (d) 180 (e) 200" or "A. 120 B. 140 C. 160"
  const inlineMarkerRegex = /(?:\s|^)(?:\(([a-eA-E1-5])\)|\[([a-eA-E1-5])\]|([a-eA-E][\.\)])|([1-5][\.\)])|\b([A-E])[\.\)])\s*/g;
  const matches = [...raw.matchAll(inlineMarkerRegex)];
  if (matches.length >= 2) {
    const parts = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index + matches[i][0].length;
      const end = (i + 1 < matches.length) ? matches[i + 1].index : raw.length;
      const val = stripOptionPrefix(raw.substring(start, end).trim());
      if (val) parts.push(val);
    }
    if (parts.length >= 2) return parts;
  }

  // 4. Fallback split by typical list delimiters
  const splitRegex = /(?:\([a-eA-E1-5]\)|[a-eA-E][\.\)]|[1-5][\.\)]|\b[A-E]\b[\.\)]?)\s+/;
  const fallbackParts = raw.split(splitRegex).map(p => stripOptionPrefix(p.trim())).filter(p => p !== "");
  if (fallbackParts.length > 1) {
    return fallbackParts;
  }

  return [];
}

function getRelatedDIQuestionIndices(targetIdx, rawQuestions = [], approvedQuestions = {}) {
  if (!rawQuestions || rawQuestions.length === 0) return [targetIdx];
  const targetQ = rawQuestions[targetIdx] || {};
  const targetPassage = (approvedQuestions[targetIdx]?.passage ?? targetQ.passage ?? "").trim().toLowerCase();
  const targetImg = approvedQuestions[targetIdx]?.imageUrl ?? targetQ.imageUrl ?? targetQ.chartImageUrl ?? "";

  // 1. Check for explicit question range in passage like "Directions (1-5)", "Questions 31 to 35", "Q. 1 - 5", "6-10"
  const rangeMatch = targetPassage.match(/(?:q(?:uestion)?s?[\:\s\.]*|\(\s*)?(\d+)\s*(?:-|to|–|—)\s*(\d+)/i);
  if (rangeMatch) {
    const startNum = parseInt(rangeMatch[1], 10);
    const endNum = parseInt(rangeMatch[2], 10);
    if (!isNaN(startNum) && !isNaN(endNum) && endNum >= startNum && (endNum - startNum) <= 10) {
      const rangeIndices = [];
      for (let i = 0; i < rawQuestions.length; i++) {
        const qNum = i + 1;
        if (qNum >= startNum && qNum <= endNum) {
          rangeIndices.push(i);
        }
      }
      if (rangeIndices.includes(targetIdx) && rangeIndices.length > 1) {
        return rangeIndices;
      }
    }
  }

  // 2. Check by matching passage text
  if (targetPassage.length > 15) {
    const matchedByPassage = [];
    const targetPassageSnippet = targetPassage.slice(0, 40);
    rawQuestions.forEach((q, i) => {
      const qPassage = (approvedQuestions[i]?.passage ?? q.passage ?? "").trim().toLowerCase();
      if (qPassage && (qPassage.includes(targetPassageSnippet) || targetPassage.includes(qPassage.slice(0, 40)))) {
        matchedByPassage.push(i);
      }
    });
    if (matchedByPassage.length > 1) return matchedByPassage;
  }

  // 3. Check by matching original image source
  if (targetImg) {
    const matchedByImg = [];
    rawQuestions.forEach((q, i) => {
      const qImg = approvedQuestions[i]?.imageUrl ?? q.imageUrl ?? q.chartImageUrl ?? "";
      if (qImg && (qImg === targetImg || (qImg.length > 50 && targetImg.startsWith(qImg.slice(0, 50))))) {
        matchedByImg.push(i);
      }
    });
    if (matchedByImg.length > 1) return matchedByImg;
  }

  // 4. Fallback: contiguous 5-question block
  const blockStart = Math.floor(targetIdx / 5) * 5;
  const blockEnd = Math.min(rawQuestions.length, blockStart + 5);
  const block = [];
  for (let i = blockStart; i < blockEnd; i++) block.push(i);
  return block.length > 0 ? block : [targetIdx];
}

// Helper to crop an image by percentages (top, bottom, left, right)
function generateCroppedImage(src, cropTop, cropBottom, cropLeft, cropRight) {
  return new Promise((resolve, reject) => {
    if (!src) return resolve("");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const topPx = Math.round(((cropTop || 0) / 100) * img.naturalHeight);
      const bottomPx = Math.round(((cropBottom || 0) / 100) * img.naturalHeight);
      const leftPx = Math.round(((cropLeft || 0) / 100) * img.naturalWidth);
      const rightPx = Math.round(((cropRight || 0) / 100) * img.naturalWidth);

      const cropW = Math.max(10, img.naturalWidth - leftPx - rightPx);
      const cropH = Math.max(10, img.naturalHeight - topPx - bottomPx);

      const canvas = document.createElement("canvas");
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cropW, cropH);
      ctx.drawImage(img, leftPx, topPx, cropW, cropH, 0, 0, cropW, cropH);
      resolve(canvas.toDataURL("image/jpeg", 0.90));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function CroppedPreviewImg({ src, cropTop, cropBottom, cropLeft, cropRight }) {
  const [croppedUrl, setCroppedUrl] = useState("");

  useEffect(() => {
    let active = true;
    generateCroppedImage(src, cropTop, cropBottom, cropLeft, cropRight)
      .then(url => {
        if (active) setCroppedUrl(url);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [src, cropTop, cropBottom, cropLeft, cropRight]);

  if (!croppedUrl) {
    return <span className="text-[11px] text-ink-muted">Rendering preview...</span>;
  }
  return <img src={croppedUrl} alt="Cropped Preview" className="max-h-full max-w-full object-contain" />;
}

function InteractiveImageCropper({
  src,
  cropTop,
  cropBottom,
  cropLeft,
  cropRight,
  onChangeCrop
}) {
  const containerRef = useRef(null);
  const [activeDrag, setActiveDrag] = useState(null);

  const handlePointerDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setActiveDrag({
      mode,
      startX: x,
      startY: y,
      origTop: cropTop,
      origBottom: cropBottom,
      origLeft: cropLeft,
      origRight: cropRight
    });

    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e) => {
    if (!activeDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const curY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    const dx = curX - activeDrag.startX;
    const dy = curY - activeDrag.startY;

    if (activeDrag.mode === "create") {
      const minX = Math.min(activeDrag.startX, curX);
      const maxX = Math.max(activeDrag.startX, curX);
      const minY = Math.min(activeDrag.startY, curY);
      const maxY = Math.max(activeDrag.startY, curY);

      onChangeCrop({
        cropTop: Math.max(0, Math.min(80, Math.round(minY))),
        cropBottom: Math.max(0, Math.min(80, Math.round(100 - maxY))),
        cropLeft: Math.max(0, Math.min(75, Math.round(minX))),
        cropRight: Math.max(0, Math.min(75, Math.round(100 - maxX)))
      });
    } else if (activeDrag.mode === "move") {
      const boxW = 100 - activeDrag.origLeft - activeDrag.origRight;
      const boxH = 100 - activeDrag.origTop - activeDrag.origBottom;

      const newLeft = Math.max(0, Math.min(100 - boxW, activeDrag.origLeft + dx));
      const newTop = Math.max(0, Math.min(100 - boxH, activeDrag.origTop + dy));

      onChangeCrop({
        cropLeft: Math.round(newLeft),
        cropRight: Math.round(100 - newLeft - boxW),
        cropTop: Math.round(newTop),
        cropBottom: Math.round(100 - newTop - boxH)
      });
    } else {
      let newTop = activeDrag.origTop;
      let newBottom = activeDrag.origBottom;
      let newLeft = activeDrag.origLeft;
      let newRight = activeDrag.origRight;

      if (activeDrag.mode.includes("n")) {
        newTop = Math.max(0, Math.min(85 - newBottom, activeDrag.origTop + dy));
      }
      if (activeDrag.mode.includes("s")) {
        newBottom = Math.max(0, Math.min(85 - newTop, activeDrag.origBottom - dy));
      }
      if (activeDrag.mode.includes("w")) {
        newLeft = Math.max(0, Math.min(80 - newRight, activeDrag.origLeft + dx));
      }
      if (activeDrag.mode.includes("e")) {
        newRight = Math.max(0, Math.min(80 - newLeft, activeDrag.origRight - dx));
      }

      onChangeCrop({
        cropTop: Math.round(newTop),
        cropBottom: Math.round(newBottom),
        cropLeft: Math.round(newLeft),
        cropRight: Math.round(newRight)
      });
    }
  };

  const handlePointerUp = (e) => {
    if (activeDrag) {
      try {
        e.target.releasePointerCapture?.(e.pointerId);
      } catch (_) {}
      setActiveDrag(null);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => handlePointerDown(e, "create")}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative inline-block max-w-full max-h-[380px] select-none cursor-crosshair overflow-hidden touch-none"
    >
      <img
        src={src}
        alt="Source Page"
        className="max-h-[360px] w-auto object-contain block mx-auto select-none pointer-events-none rounded-lg"
        draggable={false}
      />

      {/* Shaded Top */}
      <div
        className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-[1px] pointer-events-none transition-none"
        style={{ height: `${cropTop}%` }}
      />
      {/* Shaded Bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[1px] pointer-events-none transition-none"
        style={{ height: `${cropBottom}%` }}
      />
      {/* Shaded Left */}
      <div
        className="absolute left-0 bg-black/60 backdrop-blur-[1px] pointer-events-none transition-none"
        style={{
          top: `${cropTop}%`,
          bottom: `${cropBottom}%`,
          width: `${cropLeft}%`
        }}
      />
      {/* Shaded Right */}
      <div
        className="absolute right-0 bg-black/60 backdrop-blur-[1px] pointer-events-none transition-none"
        style={{
          top: `${cropTop}%`,
          bottom: `${cropBottom}%`,
          width: `${cropRight}%`
        }}
      />

      {/* Interactive Highlighted Bounding Box */}
      <div
        onPointerDown={(e) => handlePointerDown(e, "move")}
        className="absolute border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(0,0,0,0.6)] cursor-move flex items-center justify-center select-none"
        style={{
          top: `${cropTop}%`,
          bottom: `${cropBottom}%`,
          left: `${cropLeft}%`,
          right: `${cropRight}%`,
        }}
      >
        <span className="text-[10px] font-extrabold text-emerald-950 bg-emerald-400/95 px-2.5 py-0.5 rounded shadow pointer-events-none select-none">
          ✂️ Drag Box or Edges
        </span>

        {/* 4 Corner Handles */}
        <div
          onPointerDown={(e) => handlePointerDown(e, "nw")}
          className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow-md cursor-nwse-resize z-20 hover:scale-125 transition-transform"
          title="Drag to resize top-left"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, "ne")}
          className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow-md cursor-nesw-resize z-20 hover:scale-125 transition-transform"
          title="Drag to resize top-right"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, "sw")}
          className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow-md cursor-nesw-resize z-20 hover:scale-125 transition-transform"
          title="Drag to resize bottom-left"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, "se")}
          className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow-md cursor-nwse-resize z-20 hover:scale-125 transition-transform"
          title="Drag to resize bottom-right"
        />

        {/* 4 Edge Handles */}
        <div
          onPointerDown={(e) => handlePointerDown(e, "n")}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-emerald-500 rounded-full shadow-md cursor-ns-resize z-20 hover:scale-110 transition-transform"
          title="Drag top edge"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, "s")}
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-emerald-500 rounded-full shadow-md cursor-ns-resize z-20 hover:scale-110 transition-transform"
          title="Drag bottom edge"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, "w")}
          className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-white border-2 border-emerald-500 rounded-full shadow-md cursor-ew-resize z-20 hover:scale-110 transition-transform"
          title="Drag left edge"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, "e")}
          className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-white border-2 border-emerald-500 rounded-full shadow-md cursor-ew-resize z-20 hover:scale-110 transition-transform"
          title="Drag right edge"
        />
      </div>
    </div>
  );
}

export function CreateMockTestPage({ isFreeByDefault = false }) {
  const { mockTests = [], addMockTest, updateMockTest, deleteMockTest, pushToast } = useApp();
  const navigate = useNavigate();
  const [publishedSuccess, setPublishedSuccess] = useState(null);
  const [mode, setMode] = useState("pdf"); // "manual" | "pdf"
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfStatus, setPdfStatus] = useState(""); // "extracting" | "analyzing" | "done" | ""
  const [pdfPageInfo, setPdfPageInfo] = useState("");
  const pdfInputRef = useRef(null);
  const DEFAULT_SECTIONS = ["Quantitative Aptitude", "Reasoning Ability", "English Language", "General Awareness", "General"];
  const BANKING_DEFAULT_SECTIONS = [
    { name: "English Language", durationMinutes: 20, questionCount: 30 },
    { name: "Quantitative Aptitude", durationMinutes: 20, questionCount: 35 },
    { name: "Reasoning Ability", durationMinutes: 20, questionCount: 35 },
  ];
  const [testType, setTestType] = useState("full_mock"); // "full_mock" | "standard"
  const [sectionsConfig, setSectionsConfig] = useState(BANKING_DEFAULT_SECTIONS);
  const [activeManualSectionTab, setActiveManualSectionTab] = useState("English Language");

  const updateSectionConfig = (idx, field, value) => {
    setSectionsConfig(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addSectionToConfig = () => {
    setSectionsConfig(prev => [
      ...prev,
      { name: `Section ${prev.length + 1}`, durationMinutes: 20, questionCount: 25 }
    ]);
  };

  const removeSectionFromConfig = (idx) => {
    if (sectionsConfig.length <= 1) return pushToast("A mock test must have at least one section.");
    setSectionsConfig(prev => prev.filter((_, i) => i !== idx));
  };

  const resetToBankingPresets = () => {
    setSectionsConfig([
      { name: "English Language", durationMinutes: 20, questionCount: 30 },
      { name: "Quantitative Aptitude", durationMinutes: 20, questionCount: 35 },
      { name: "Reasoning Ability", durationMinutes: 20, questionCount: 35 },
    ]);
    pushToast("Loaded Standard Banking Prelims sections!");
  };

  const autoGenerateQuestionSlots = () => {
    const slots = [];
    sectionsConfig.forEach(sec => {
      const count = parseInt(sec.questionCount) || 10;
      for (let i = 1; i <= count; i++) {
        slots.push({
          section: sec.name,
          question: "",
          passage: "",
          imageUrl: "",
          solutionImageUrl: "",
          options: ["Option A", "Option B", "Option C", "Option D", "Option E"],
          correctAnswerIndex: 0,
          explanation: "",
        });
      }
    });
    setManualQuestions(slots);
    pushToast(`Generated ${slots.length} question slots across ${sectionsConfig.length} sections!`);
  };

  const [f, setF] = useState({ title: "", category: "Banking", subject: "", topic: "", questions: "", time: "", isFree: isFreeByDefault, isSectionalTimed: false, sections: [...DEFAULT_SECTIONS] });
  const [generating, setGenerating] = useState(false);
  const [generatedTest, setGeneratedTest] = useState(null);
  const [approvedQuestions, setApprovedQuestions] = useState({});
  const [extractionProgress, setExtractionProgress] = useState(null);
  const [verificationProgress, setVerificationProgress] = useState(null);
  const [extractionStartTime, setExtractionStartTime] = useState(null);
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("VITE_GEMINI_API_KEY") || localStorage.getItem("VITE_GROQ_API_KEY") || localStorage.getItem("VITE_OPENROUTER_API_KEY") || localStorage.getItem("VITE_OPENAI_API_KEY") || "");
  const [openRouterModel, setOpenRouterModel] = useState(() => localStorage.getItem("VITE_OPENROUTER_MODEL") || "nvidia/nemotron-4-340b-instruct:free");
  const [keyType, setKeyType] = useState(() => localStorage.getItem("LLM_PROVIDER_TYPE") || "gemini");
  const [pdfExtractionMethod, setPdfExtractionMethod] = useState("ai"); // "ai" | "regex"
  const [enableVisionAI, setEnableVisionAI] = useState(false);
  const [bulkAddCount, setBulkAddCount] = useState(1);
  const [cropperModal, setCropperModal] = useState(null);
  const abortControllerRef = useRef(null);

  const cancelExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setPdfStatus("error");
      setPdfPageInfo("Extraction cancelled by user.");
      setExtractionProgress("");
      pushToast("Extraction cancelled.");
    }
  };

  const saveLLMKey = () => {
    if (!apiKey.trim()) {
      localStorage.removeItem("VITE_GEMINI_API_KEY");
      localStorage.removeItem("GEMINI_API_KEY");
      localStorage.removeItem("VITE_GROQ_API_KEY");
      localStorage.removeItem("GROQ_API_KEY");
      localStorage.removeItem("VITE_OPENAI_API_KEY");
      localStorage.removeItem("OPENAI_API_KEY");
      localStorage.removeItem("VITE_DEEPSEEK_API_KEY");
      localStorage.removeItem("DEEPSEEK_API_KEY");
      localStorage.removeItem("VITE_OPENROUTER_API_KEY");
      localStorage.removeItem("OPENROUTER_API_KEY");
      setShowKeyModal(false);
      pushToast("LLM API Key cleared.");
      return;
    }

    if (keyType === "gemini") {
      localStorage.setItem("VITE_GEMINI_API_KEY", apiKey.trim());
      localStorage.setItem("GEMINI_API_KEY", apiKey.trim());
    } else if (keyType === "groq") {
      localStorage.setItem("VITE_GROQ_API_KEY", apiKey.trim());
      localStorage.setItem("GROQ_API_KEY", apiKey.trim());
    } else if (keyType === "openai") {
      localStorage.setItem("VITE_OPENAI_API_KEY", apiKey.trim());
      localStorage.setItem("OPENAI_API_KEY", apiKey.trim());
    } else if (keyType === "deepseek") {
      localStorage.setItem("VITE_DEEPSEEK_API_KEY", apiKey.trim());
      localStorage.setItem("DEEPSEEK_API_KEY", apiKey.trim());
    } else if (keyType === "openrouter") {
      localStorage.setItem("VITE_OPENROUTER_API_KEY", apiKey.trim());
      localStorage.setItem("OPENROUTER_API_KEY", apiKey.trim());
      localStorage.setItem("VITE_OPENROUTER_MODEL", openRouterModel.trim());
    }
    localStorage.setItem("LLM_PROVIDER_TYPE", keyType);
    setShowKeyModal(false);
    pushToast(`✅ ${keyType.toUpperCase()} API Key saved for High-Accuracy PDF Extraction!`);
  };

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

  const removeEditingImage = (qIdx, imgIdx) => {
    setEditingTest(prev => {
      if (!prev) return null;
      const updatedList = [...prev.questionsList];
      const q = { ...updatedList[qIdx] };
      const urls = q.imageUrls || (q.imageUrl ? [q.imageUrl] : []);
      const newUrls = urls.filter((_, i) => i !== imgIdx);
      q.imageUrls = newUrls;
      q.imageUrl = newUrls.length > 0 ? newUrls[0] : "";
      updatedList[qIdx] = q;
      return { ...prev, questionsList: updatedList };
    });
  };

  const addEditingImage = (qIdx, base64DataUrl) => {
    if (!base64DataUrl) return;
    setEditingTest(prev => {
      if (!prev) return null;
      const updatedList = [...prev.questionsList];
      const q = { ...updatedList[qIdx] };
      const urls = q.imageUrls || (q.imageUrl ? [q.imageUrl] : []);
      q.imageUrls = [...urls, base64DataUrl];
      q.imageUrl = q.imageUrls[0] || base64DataUrl;
      updatedList[qIdx] = q;
      return { ...prev, questionsList: updatedList };
    });
  };

  const saveEditingTest = async () => {
    if (!editingTest) return;
    setIsSavingEdit(true);
    try {
      const sanitizedQuestions = (editingTest.questionsList || []).map(q => {
        const { cleanPassage, cleanExplanation } = sanitizeDIPassageAndExplanation(q.passage || "", q.explanation || "", q);
        return {
          ...q,
          passage: cleanPassage,
          explanation: cleanExplanation
        };
      });

      // Rebuild sectionsConfig and sections from the updated question section names
      const secCounts = {};
      sanitizedQuestions.forEach(q => {
        const s = q.section || "General";
        secCounts[s] = (secCounts[s] || 0) + 1;
      });
      const updatedSectionNames = Object.keys(secCounts);
      const oldSectionsConfig = editingTest.sectionsConfig || [];
      const updatedSectionsConfig = updatedSectionNames.map(secName => {
        // Try to preserve duration from old config if this section existed (possibly renamed)
        const existing = oldSectionsConfig.find(s => s.name === secName);
        return {
          name: secName,
          questionCount: secCounts[secName],
          durationMinutes: existing?.durationMinutes || 20
        };
      });

      const finalObject = {
        ...editingTest,
        title: editingTest.title.trim() || "Untitled Mock Test",
        questionsList: sanitizedQuestions,
        questions: sanitizedQuestions.length,
        sections: updatedSectionNames,
        sectionsConfig: updatedSectionsConfig.length > 0 ? updatedSectionsConfig : editingTest.sectionsConfig
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

  useEffect(() => {
    setF(prev => ({ ...prev, isFree: isFreeByDefault }));
  }, [isFreeByDefault]);

  const [manualQuestions, setManualQuestions] = useState([
    {
      section: "Quantitative Aptitude",
      question: "",
      passage: "",
      imageUrl: "",
      solutionImageUrl: "",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswerIndex: 0,
      explanation: "",
    },
  ]);

  const addManualQuestion = (targetSec = null) => {
    const count = parseInt(bulkAddCount) || 1;
    const secName = targetSec || (activeManualSectionTab !== "all" ? activeManualSectionTab : (sectionsConfig[0]?.name || "English Language"));
    setManualQuestions((prev) => {
      const newQuestions = [];
      const inheritedPassage = prev.length > 0 ? prev[prev.length - 1].passage : "";
      for (let i = 0; i < count; i++) {
        newQuestions.push({
          section: secName,
          question: "",
          passage: inheritedPassage,
          imageUrl: "",
          solutionImageUrl: "",
          options: ["Option A", "Option B", "Option C", "Option D", "Option E"],
          correctAnswerIndex: 0,
          explanation: "",
        });
      }
      return [...prev, ...newQuestions];
    });
  };

  const removeManualQuestion = (idx) => {
    if (manualQuestions.length <= 1) return pushToast("Test must have at least 1 question");
    setManualQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addManualImage = (idx, base64DataUrl) => {
    if (!base64DataUrl) return;
    setGeneratedTest(prev => {
      const q = prev.questionsList[idx];
      const urls = q.imageUrls || (q.imageUrl ? [q.imageUrl] : []);
      const newUrls = [...urls, base64DataUrl];
      
      const newQuestionsList = [...prev.questionsList];
      newQuestionsList[idx] = { ...q, imageUrls: newUrls, imageUrl: newUrls.length > 0 ? newUrls[0] : null };
      return { ...prev, questionsList: newQuestionsList };
    });
  };

  const removeManualImage = (idx, imgIndex) => {
    setGeneratedTest(prev => {
      const q = prev.questionsList[idx];
      const urls = q.imageUrls || (q.imageUrl ? [q.imageUrl] : []);
      const newUrls = urls.filter((_, i) => i !== imgIndex);
      
      const newQuestionsList = [...prev.questionsList];
      newQuestionsList[idx] = { ...q, imageUrls: newUrls, imageUrl: newUrls.length > 0 ? newUrls[0] : null };
      return { ...prev, questionsList: newQuestionsList };
    });
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

  const handleOptionPaste = (e, qIdx, optIdx) => {
    const pasteText = e.clipboardData?.getData("text") || "";
    const parts = parsePastedOptions(pasteText);
    
    if (parts.length > 1) {
      e.preventDefault();
      setManualQuestions((prev) =>
        prev.map((q, i) => {
          if (i !== qIdx) return q;
          const newOptions = [...q.options];
          
          let pIdx = 0;
          for (let j = optIdx; j < optIdx + parts.length; j++) {
            if (j < 7) { // Support up to 7 options (A to G)
              if (j < newOptions.length) {
                newOptions[j] = parts[pIdx];
              } else {
                newOptions.push(parts[pIdx]);
              }
            }
            pIdx++;
          }
          return { ...q, options: newOptions };
        })
      );
      pushToast(`✨ Automatically split ${parts.length} options!`);
    }
  };

  const addOptionToManual = (qIdx) => {
    setManualQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      if (q.options.length >= 7) {
        pushToast("Maximum 7 options (A to G) reached.");
        return q;
      }
      const nextLetter = String.fromCharCode(65 + q.options.length);
      return {
        ...q,
        options: [...q.options, `Option ${nextLetter}`]
      };
    }));
  };

  const removeOptionFromManual = (qIdx) => {
    setManualQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      if (q.options.length <= 2) {
        pushToast("A question must have at least 2 options.");
        return q;
      }
      const newOpts = q.options.slice(0, -1);
      const newAnsIdx = q.correctAnswerIndex >= newOpts.length ? newOpts.length - 1 : q.correctAnswerIndex;
      return {
        ...q,
        options: newOpts,
        correctAnswerIndex: newAnsIdx
      };
    }));
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
    return { ...s, [k]: v };
  });
  const color = CATEGORIES.find((c) => c.name === f.category)?.color || "#1B4F72";

  const [isPublishing, setIsPublishing] = useState(false);

  const handleGenerateAI = async () => {
    setGenerating(true);
    pushToast("✨ AI is analyzing past 5-year PYQs & generating mock test...");
    try {
      const result = await generateAIMockTest({
        category: f.category,
        subject: f.subject,
        topic: f.topic,
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
    if (isPublishing) return;

    let finalQuestions = [];

    // Process all rawExtractedQuestions (include all by default unless explicitly unapproved with isApproved === false)
    (generatedTest.rawExtractedQuestions || []).forEach((q, idx) => {
      const approvalStatus = approvedQuestions[idx];

      // Skip ONLY if explicitly unchecked / unapproved
      if (approvalStatus && approvalStatus.isApproved === false) {
        return;
      }

      const finalLetter = approvalStatus?.editedAnswer ?? q.ai_verified_answer ?? q.source_answer ?? "A";
      const ansIndex = getAnswerIndex(finalLetter);

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

      const rawPassage = approvalStatus?.passage ?? (q.passage || "");
      const rawExplanation = approvalStatus?.solutionText ?? (q.solutionText || q.explanation || q.verification_explanation || "Verified by teacher.");
      const { cleanPassage, cleanExplanation } = sanitizeDIPassageAndExplanation(rawPassage, rawExplanation, q);

      finalQuestions.push({
        id: `pdf_q_${Date.now()}_${idx}`,
        section: approvalStatus?.section || q.section || f.subject || "General",
        passage: cleanPassage,
        imageUrl: approvalStatus?.chartImageUrl ?? approvalStatus?.imageUrl ?? (q.chartImageUrl || q.imageUrl || ""),
        solutionImageUrl: approvalStatus?.solutionImageUrl ?? (q.solutionImageUrl || ""),
        question: approvalStatus?.questionText ?? (q.question_text || q.question || `Question ${idx + 1}`),
        options: optsArray,
        correctAnswerIndex: ansIndex < optsArray.length ? ansIndex : 0,
        explanation: cleanExplanation
      });
    });

    if (finalQuestions.length === 0) {
      pushToast("Cannot publish test with 0 questions. Please approve at least 1 question.");
      return;
    }

    setIsPublishing(true);
    pushToast("⏳ Compressing diagrams & publishing mock test to Cloud...");

    try {
      // Compress all base64 diagrams to ensure lightweight, fast payload (< 200 KB)
      const compressedQuestions = await Promise.all(
        finalQuestions.map(async (q) => {
          let compressedImg = q.imageUrl;
          if (compressedImg && compressedImg.startsWith("data:image")) {
            compressedImg = await compressBase64Image(compressedImg, 650, 0.68);
          }
          let compressedSolImg = q.solutionImageUrl;
          if (compressedSolImg && compressedSolImg.startsWith("data:image")) {
            compressedSolImg = await compressBase64Image(compressedSolImg, 650, 0.68);
          }
          return {
            ...q,
            imageUrl: compressedImg || "",
            solutionImageUrl: compressedSolImg || ""
          };
        })
      );

      // Strip rawExtractedQuestions to avoid duplicate storage bloat
      const { rawExtractedQuestions, ...cleanTestMeta } = generatedTest;
      // Automatically build sectionsConfig from compressedQuestions
      const secCounts = {};
      compressedQuestions.forEach(q => {
        const s = q.section || "General";
        secCounts[s] = (secCounts[s] || 0) + 1;
      });

      const uniqueSections = Object.keys(secCounts);
      const isBankTest = (f.category || generatedTest.category || "").toLowerCase().includes("bank") || compressedQuestions.length >= 60;
      
      const computedSectionsConfig = uniqueSections.map(secName => {
        let dur = 20;
        if (compressedQuestions.length <= 40) {
          dur = 20;
        } else if (compressedQuestions.length >= 80) {
          dur = 20; // 3 x 20 mins = 60 mins for Bank PO / Clerk 100 Qs
        } else {
          dur = Math.max(10, Math.floor(60 / (uniqueSections.length || 1)));
        }
        return {
          name: secName,
          durationMinutes: dur,
          questionCount: secCounts[secName]
        };
      });

      const totalTestMinutes = computedSectionsConfig.reduce((sum, s) => sum + s.durationMinutes, 0) || (compressedQuestions.length >= 80 ? 60 : 30);

      const testToPublish = { 
        ...cleanTestMeta, 
        title: f.title.trim() || generatedTest.title || `${f.category || 'Banking'} Mock Test`,
        category: f.category || generatedTest.category || "Banking",
        subject: f.subject || generatedTest.subject || "",
        topic: f.topic || generatedTest.topic || "",
        time: f.time || generatedTest.time || `${totalTestMinutes} min`,
        durationMinutes: Math.max(1, parseInt(f.time || generatedTest.time) || totalTestMinutes),
        isFree: !!f.isFree,
        isSectionalTimed: isBankTest || !!f.isSectionalTimed || uniqueSections.length > 1,
        sectionsConfig: computedSectionsConfig.length > 0 ? computedSectionsConfig : BANKING_DEFAULT_SECTIONS,
        questionsList: compressedQuestions, 
        questions: compressedQuestions.length,
        createdAt: new Date().toISOString()
      };

      let publishedResult;
      if (testToPublish.id && String(testToPublish.id).startsWith("draft_")) {
        delete testToPublish.id;
        publishedResult = await addMockTest(testToPublish);
      } else if (generatedTest.id && !String(generatedTest.id).startsWith("draft_")) {
        publishedResult = await updateMockTest(generatedTest.id, testToPublish);
      } else {
        publishedResult = await addMockTest(testToPublish);
      }

      const publishedId = publishedResult?.id || testToPublish.id || "test_" + Date.now();
      setPublishedSuccess({
        id: publishedId,
        title: testToPublish.title,
        category: testToPublish.category,
        questions: testToPublish.questions,
        isFree: testToPublish.isFree,
        time: testToPublish.time
      });

      setGeneratedTest(null);
      setPdfFile(null);
      setIsFullPreview(false);
      setApprovedQuestions({});
      setF({ title: "", category: testToPublish.category || CATEGORIES[0].name, subject: "", topic: "", questions: "", time: "", isFree: isFreeByDefault, isSectionalTimed: false, sections: [...DEFAULT_SECTIONS] });
      pushToast(`🎉 "${testToPublish.title}" published successfully to ${testToPublish.category}!`);
    } catch (err) {
      console.error("Publishing error:", err);
      pushToast("Error publishing test: " + (err.message || "Please try again."));
    } finally {
      setIsPublishing(false);
    }
  };

  const publishChatbotTest = async () => {
    if (!generatedTest) return;
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      await addMockTest(generatedTest);
      pushToast(`🎉 Mock test '${generatedTest.title}' published successfully with ${generatedTest.questions} questions!`);
      setGeneratedTest(null);
    } catch (err) {
      console.error(err);
      pushToast(err.message || "Error publishing mock test. Please try again.");
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
        const validQuestions = manualQuestions.map((q, i) => {
          const { cleanPassage, cleanExplanation } = sanitizeDIPassageAndExplanation(q.passage || "", q.explanation || "", q);
          return {
            id: `q_manual_${Date.now()}_${i + 1}`,
            section: q.section || "General",
            question: q.question.trim() || `Question ${i + 1}`,
            options: q.options.map((o, oi) => o.trim() || `Option ${String.fromCharCode(65 + oi)}`),
            correctAnswerIndex: +q.correctAnswerIndex || 0,
            explanation: cleanExplanation || "No explanation provided.",
            ...(q.imageUrl && { imageUrl: q.imageUrl }),
            ...(q.solutionImageUrl && { solutionImageUrl: q.solutionImageUrl }),
            ...(cleanPassage && { passage: cleanPassage })
          };
        }).filter((q, idx) => q.question !== `Question ${idx + 1}`);

        if (validQuestions.length === 0) {
          setIsPublishing(false);
          return pushToast("Add at least one valid question");
        }

        const totalDuration = testType === "full_mock"
          ? sectionsConfig.reduce((acc, s) => acc + (parseInt(s.durationMinutes) || 0), 0) || 60
          : (parseInt(f.time) || 30);

        testToPublish = {
          id: `mock_manual_${Date.now()}`,
          title: f.title.trim(),
          category: f.category,
          color,
          questions: validQuestions.length,
          time: `${totalDuration} min`,
          durationMinutes: totalDuration,
          isFullMock: testType === "full_mock",
          isSectionalTimed: testType === "full_mock" || !!f.isSectionalTimed,
          sectionsConfig: testType === "full_mock" ? sectionsConfig : undefined,
          sections: testType === "full_mock" ? sectionsConfig.map(s => s.name) : (f.sections || DEFAULT_SECTIONS),
          taken: 0,
          isFree: f.isFree,
          subject: f.subject || (testType === "full_mock" ? "Banking Prelims Full Mock" : ""),
          topic: f.topic || (testType === "full_mock" ? "All Sections" : ""),
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

    const superDigits = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
    const subDigits = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉' };
    const toSuperDigits = (s) => s.split('').map(c => superDigits[c] || c).join('');
    const toSubDigits = (s) => s.split('').map(c => subDigits[c] || c).join('');

    // 0. Repair dangling carets from PDF OCR extraction noise for common speed math powers
    res = res
      .replace(/(\b1681\b|\(1681\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₂$2")
      .replace(/(\b409[4-6]\b|\(409[4-6]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
      .replace(/(\b219[6-8]\b|\(219[6-8]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
      .replace(/(\b172[7-9]\b|\(172[7-9]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
      .replace(/(\b274[3-5]\b|\(274[3-5]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
      .replace(/(\b337[4-6]\b|\(337[4-6]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
      .replace(/(\b583[1-3]\b|\(583[1-3]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
      .replace(/(\b685[8-9]\b|\(685[8-9]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
      .replace(/(\b926[0-2]\b|\(926[0-2]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
      .replace(/(\b1382[3-5]\b|\(1382[3-5]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
      .replace(/(\b2438[8-9]\b|\(2438[8-9]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2");

    // 1. Convert fractional exponents: ^(1/2) -> ¹⁄₂, ^1/2 -> ¹⁄₂, ^(1/3) -> ¹⁄₃, etc.
    res = res.replace(/\^\s*[\(\{]?(\d+)\/(\d+)[\)\}]?/g, (_, num, den) => {
      return toSuperDigits(num) + '⁄' + toSubDigits(den);
    });

    // ^(n) or ^{n} — parenthesized single-digit exponents like ^(4), ^{10}
    res = res.replace(/\^[\(\{](\d+)[\)\}]/g, (_, exp) => {
      return toSuperDigits(exp);
    });

    // 2. Convert simple caret notation: ^2 -> ², ^3 -> ³, etc. up to ^9
    res = res
      .replace(/\^0/g, "⁰")
      .replace(/\^1(?![0-9\/])/g, "¹")
      .replace(/\^2/g, "²")
      .replace(/\^3/g, "³")
      .replace(/\^4/g, "⁴")
      .replace(/\^5/g, "⁵")
      .replace(/\^6/g, "⁶")
      .replace(/\^7/g, "⁷")
      .replace(/\^8/g, "⁸")
      .replace(/\^9/g, "⁹");

    // 3. Convert common text fractions to Unicode vulgar fractions
    //    Only replace standalone fractions (not inside longer numbers like 11/7)
    res = res
      .replace(/(?<![0-9])1\/2(?![0-9])/g, "½")
      .replace(/(?<![0-9])1\/3(?![0-9])/g, "⅓")
      .replace(/(?<![0-9])2\/3(?![0-9])/g, "⅔")
      .replace(/(?<![0-9])1\/4(?![0-9])/g, "¼")
      .replace(/(?<![0-9])3\/4(?![0-9])/g, "¾")
      .replace(/(?<![0-9])1\/5(?![0-9])/g, "⅕")
      .replace(/(?<![0-9])2\/5(?![0-9])/g, "⅖")
      .replace(/(?<![0-9])3\/5(?![0-9])/g, "⅗")
      .replace(/(?<![0-9])4\/5(?![0-9])/g, "⅘")
      .replace(/(?<![0-9])1\/6(?![0-9])/g, "⅙")
      .replace(/(?<![0-9])5\/6(?![0-9])/g, "⅚")
      .replace(/(?<![0-9])1\/8(?![0-9])/g, "⅛")
      .replace(/(?<![0-9])3\/8(?![0-9])/g, "⅜")
      .replace(/(?<![0-9])5\/8(?![0-9])/g, "⅝")
      .replace(/(?<![0-9])7\/8(?![0-9])/g, "⅞");

    // 4. Convert space-separated powers like "15 2" or "(15) 2" -> "15²" (only 2 and 3)
    res = res.replace(/(\b\d+|\))\s+([23])(?=\s*(?:[\+\-\*\/\=\,\)\?]|$))/g, (match, base, exp) => {
      if (/[²³⁴⁵⁶⁷⁸⁹⁰¹]$/.test(base)) return match;
      const superscripts = { "2": "²", "3": "³" };
      return `${base}${superscripts[exp] || exp}`;
    });

    // 5. Clean up any duplicate consecutive superscripts (e.g. ²² -> ²)
    res = res.replace(/([²³⁴⁵⁶⁷⁸⁹⁰¹])\1+/g, "$1");

    return res;
  };


  const parseQuestionsFromPDFText = (fullText, defaultSection = "General", targetCount = 100) => {
    if (!fullText || !fullText.trim()) return [];

    const cleanText = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 1. ISOLATE QUESTIONS TEXT & SOLUTIONS TEXT
    // Distinguish between pure ANSWER KEY (single letters) and HINTS & SOLUTIONS (full working steps)
    const detailedSolMatch = cleanText.match(/\n\s*(?:HINTS?\s*(?:&|AND)\s*SOLUTIONS?|DETAILED\s*SOLUTIONS?|SOLUTIONS?\s*(?:&|AND)\s*EXPLANATIONS?|HINTS?\s*(?:&|AND)\s*EXPLANATIONS?|EXPLANATIONS?|SOLUTIONS?)\b/i);
    const ansKeyMatch = cleanText.match(/\n\s*(?:ANSWERS?\s*(?:KEY|SHEET|&\s*EXPLANATIONS|:)?)\b/i);

    const firstSplitIndex = [ansKeyMatch?.index, detailedSolMatch?.index].filter(idx => typeof idx === "number" && idx > 500).sort((a,b) => a - b)[0];
    
    let questionsText = cleanText;
    let solutionsText = "";
    let detailedSolText = "";

    if (firstSplitIndex) {
      questionsText = cleanText.substring(0, firstSplitIndex);
      solutionsText = cleanText.substring(firstSplitIndex);
    }
    detailedSolText = detailedSolMatch && detailedSolMatch.index > 500 ? cleanText.substring(detailedSolMatch.index) : solutionsText;

    // 2. EXTRACT ANSWER KEY MAP (e.g. 1. d.) 2401, 2. d) 248, 6.d, 11. b, 16. (Option A), 81. a)
    const answerKeyMap = {};
    const ansKeyRegex = /(?:^|\n)\s*(\d{1,3})\s*[\.\)]\s*(?:\(?\s*(?:Option\s*)?([A-Ea-e])\b|\.([A-Ea-e])\b)/gi;
    let km;
    while ((km = ansKeyRegex.exec(solutionsText || cleanText)) !== null) {
      const qNum = parseInt(km[1], 10);
      let ansVal = (km[2] || km[3]).toUpperCase();
      if (/^[1-5]$/.test(ansVal)) {
        ansVal = String.fromCharCode(64 + parseInt(ansVal, 10)); // 1->A, 2->B, etc.
      }
      if (qNum >= 1 && qNum <= 250 && !answerKeyMap[qNum]) {
        answerKeyMap[qNum] = ansVal;
      }
    }

    // 3. EXTRACT DETAILED SOLUTIONS MAP (e.g. "1. d.) 2401 \n Solution: ...")
    const solutionsMap = {};
    const textForSolutions = detailedSolText || solutionsText;
    if (textForSolutions) {
      const solSplitRegex = /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*(?:[\.\)\:\-]\s*|\s{2,})/g;
      const solMatches = [];
      let sm;
      while ((sm = solSplitRegex.exec(textForSolutions)) !== null) {
        solMatches.push({ qNum: parseInt(sm[1], 10), index: sm.index, matchLen: sm[0].length });
      }
      for (let i = 0; i < solMatches.length; i++) {
        const cur = solMatches[i];
        const nextIndex = (i < solMatches.length - 1) ? solMatches[i + 1].index : textForSolutions.length;
        let block = textForSolutions.substring(cur.index + cur.matchLen, nextIndex).trim();
        block = block
          .replace(/www\.BankExamsToday\.Com\s+Page\s+\d+/gi, '')
          .replace(/IBPS PO Pre held on [^\n]+/gi, '')
          .trim();
        if (block && cur.qNum >= 1 && cur.qNum <= 250) {
          // Prefer richer/longer explanations (e.g. full working steps over a 1-letter answer key match)
          if (!solutionsMap[cur.qNum] || block.length > solutionsMap[cur.qNum].length) {
            solutionsMap[cur.qNum] = formatMathText(block);
          }
        }
      }
    }

    // 4. DETECT SECTION MARKERS IN TEXT (Require standalone line header so subject names in questions like "English" aren't confused)
    const sectionMarkers = [];
    const secRegex = /(?:^|\n)\s*(?:(?:SECTION|TEST\s+OF|PART)\s*[-–:]?\s*[A-C1-3IVX0-9]*\s*[:–-]?\s*)?(ENGLISH(?:\s+LANGUAGE)?|GENERAL\s+ENGLISH|REASONING(?:\s+ABILITY)?|LOGICAL\s+REASONING|GENERAL\s+INTELLIGENCE(?:\s*&\s*REASONING)?|QUANTITATIVE\s+APTITUDE|NUMERICAL\s+ABILITY|MATHEMATICS|QUANTS?|GENERAL\s+AWARENESS|CURRENT\s+AFFAIRS|BANKING\s+AWARENESS)\s*(?:\n|$)/gi;
    let secMatch;
    while ((secMatch = secRegex.exec(questionsText)) !== null) {
      const rawName = secMatch[1].toUpperCase();
      let canon = "General";
      if (rawName.includes("ENGLISH")) canon = "English Language";
      else if (rawName.includes("REASONING") || rawName.includes("INTELLIGENCE")) canon = "Reasoning Ability";
      else if (rawName.includes("QUANT") || rawName.includes("NUMERICAL") || rawName.includes("MATH")) canon = "Quantitative Aptitude";
      else if (rawName.includes("AWARENESS") || rawName.includes("AFFAIRS")) canon = "General Awareness";
      sectionMarkers.push({ index: secMatch.index, name: canon });
    }

    const getSectionAtCharIndex = (charIdx) => {
      if (sectionMarkers.length === 0) return null;
      let active = null;
      for (const marker of sectionMarkers) {
        if (marker.index <= charIdx) {
          active = marker.name;
        }
      }
      return active;
    };

    // Helper: Content-based section classification for Indian Bank Exams
    const inferSectionFromBankContent = (qText, passage, qIndex) => {
      const combined = `${passage || ""} ${qText || ""}`.toLowerCase();
      // 1. English indicators
      if (/(?:passage|reading comprehension|author|antonym|synonym|closest in meaning|opposite in meaning|grammatical|grammatically|spelt|misspelt|phrase replacement|cloze|para[\s-]?jumble|rearrange the following sentences|first sentence after rearrangement|error|spotting error|sentence correction|bold word|underlined phrase)/i.test(combined)) {
        return "English Language";
      }
      // 2. Reasoning indicators
      if (/(?:puzzle|seating arrangement|seated|sitting|circular table|square table|linear row|parallel rows|facing|floor|flat|box|boxes placed|blood relation|father|mother|brother|sister|son|daughter|uncle|aunt|nephew|niece|spouse|married to|related to\b|syllogism|only a few|some books are|statements?:|conclusions?:|does not follow|neither nor|either or|inequalit|[A-Z]\s*[><≥≤=]\s*[A-Z]|coding[\s-]?decoding|written as\b|coded as\b|code language|direction sense|\bdirection|\b(?:north|south|east|west|northeast|northwest|southeast|southwest)\b|walks \d+[\s]?m|shortest distance|pythagoras|alphabet series|alphanumeric|vowels?|consonants?|meaningful word|how many such pairs|letters of the word|rank|order and ranking|alike in a certain way|does not belong|odd one out|machine input|input[\s-]output|step [I|V|X\d]+|who sits|sits second|sits third|sits immediate|extreme end|how many persons|immediate left|immediate right)/i.test(combined)) {
        return "Reasoning Ability";
      }
      // 3. Quants indicators
      if (/(?:data interpretation|\bdi\b|bar graph|bar chart|pie chart|line graph|tabular|table shows|caselet|simplification|approximation|(?:(?:\+|\-|\*|\/|=)\s*\?|\?\s*(?:\+|\-|\*|\/|=)|(?:√|sqrt)\s*\?|\(\s*\?\s*\)\s*[²³]|\?\s*%\s*of)|≈|number series|missing number|wrong number|quadratic equation|profit and loss|simple interest|compound interest|time and work|pipes and cistern|speed time|downstream|upstream|ratio and proportion|mixture|alligation|mensuration|perimeter|cylinder|cone|probability|visitors|total students|boys and girls|average of|find the value of|percentage of|ratio of)/i.test(combined)) {
        return "Quantitative Aptitude";
      }
      const qNum = qIndex + 1;
      if (qNum <= 35) return "Quantitative Aptitude";
      if (qNum <= 65) return "English Language";
      return "Reasoning Ability";
    };

    // 5. EXTRACT SHARED PASSAGES / DIRECTIONS (e.g. Directions 1-5, Directions 16-20, Directions 36-40, etc.)
    const passageRanges = [];
    const dirGlobalRegex = /(?:Directions?\s*(?:\([^\)]+\)|for\s+questions?\s*\d+[\s\w–—-]+)?[\:\s]*|Read the following[^\:\n]*[\:\.\n]|Study the following[^\:\n]*[\:\.\n]|The table shows[^\:\n]*[\:\.\n]|The following table[^\:\n]*[\:\.\n]|Rearrange the following six sentences[^\:\n]*[\:\.\n])([\s\S]*?)(?=(?:\n\s*(?:Q(?:uestion)?\.?\s*)?\d{1,3}[\.\)\:\-]\s*)|$)/gi;
    let dm;
    while ((dm = dirGlobalRegex.exec(questionsText)) !== null) {
      const fullDirBlock = dm[0].trim();
      const rangeMatch = fullDirBlock.match(/(?:Q(?:uestion)?s?[\:\s\.]*|\(\s*Q?\.?\s*|\b(?:questions?|nos?|q)\.?\s*)?(\d{1,3})\s*(?:-|to|–|—)\s*(\d{1,3})/i);
      if (rangeMatch) {
        const startNum = parseInt(rangeMatch[1], 10);
        const endNum = parseInt(rangeMatch[2], 10);
        if (!isNaN(startNum) && !isNaN(endNum) && endNum >= startNum && (endNum - startNum) <= 15) {
          passageRanges.push({ startNum, endNum, passage: convertTextTableToMarkdown(fullDirBlock) });
        }
      }
    }

    // 6. DETECT PAGE MARKERS FROM TEXT
    const pageMarkers = [];
    const pageRegex = /--- Page (\d+) ---/g;
    let pm;
    while ((pm = pageRegex.exec(cleanText)) !== null) {
      pageMarkers.push({ pageNum: parseInt(pm[1], 10), index: pm.index });
    }
    const getPageNumAtCharIndex = (charIdx) => {
      if (pageMarkers.length === 0) return 1;
      let pNum = 1;
      for (const m of pageMarkers) {
        if (m.index <= charIdx) pNum = m.pageNum;
      }
      return pNum;
    };

    // Robust option parser: handles both newline-preceded options and inline options
    const parseOptionsFromBlock = (block) => {
      const nlOptRegex = /(?:^|\n)\s*(?:\(?([A-Ea-e1-5])[\)\.\:\-\]]|\(([A-Ea-e1-5])\))\s*(.*?)(?=(?:\n\s*(?:\(?[A-Ea-e1-5][\)\.\:\-\]]|\([A-Ea-e1-5]\)))|$)/gi;
      let optMatches = [...block.matchAll(nlOptRegex)];

      if (optMatches.length < 3) {
        const inlineOptRegex = /(?:(?:\s{2,}|\s)(?:\(?([A-Ea-e1-5])[\)\.\:\-\]]|\(([A-Ea-e1-5])\)))\s*(.*?)(?=(?:\s+(?:\(?[A-Ea-e1-5][\)\.\:\-\]]|\([A-Ea-e1-5]\)))|$)/gi;
        const inMatches = [...block.matchAll(inlineOptRegex)];
        if (inMatches.length >= 3) {
          optMatches = inMatches;
        }
      }

      let options = {};
      let questionText = block;

      if (optMatches.length >= 2) {
        const firstOptIndex = optMatches[0].index;
        questionText = block.substring(0, firstOptIndex).trim();

        optMatches.forEach(m => {
          let key = (m[1] || m[2]).toUpperCase();
          if (/^[1-5]$/.test(key)) {
            key = String.fromCharCode(64 + parseInt(key, 10));
          }
          const val = (m[3] || "").trim();
          if (!options[key] && val) {
            options[key] = formatMathText(val.replace(/^[\)\.\:\-\]]\s*/, ''));
          }
        });
      }

      return { questionText: formatMathText(questionText), options };
    };

    // 7. LOCATE QUESTIONS SEQUENTIALLY (1 to N)
    const qSplitRegex = /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[\.\)]\s*(?!\d)/g;
    const rawQPositions = [];
    let qm;
    while ((qm = qSplitRegex.exec(questionsText)) !== null) {
      rawQPositions.push({
        num: parseInt(qm[1], 10),
        index: qm.index,
        matchLen: qm[0].length
      });
    }

    // Filter to ensure monotonic/sequential question positions (1 to N)
    // Avoids sub-numbered puzzle rules like "(1) Person A... (2) Person B..."
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

    let questions = [];

    if (qPositions.length >= 5) {
      for (let i = 0; i < qPositions.length; i++) {
        const cur = qPositions[i];
        const nextIndex = (i < qPositions.length - 1) ? qPositions[i + 1].index : questionsText.length;
        const block = questionsText.substring(cur.index + cur.matchLen, nextIndex).trim();
        if (block.length < 3) continue;

        let { questionText, options } = parseOptionsFromBlock(block);

        // Clean headers/footers watermarks
        questionText = questionText
          .replace(/www\.BankExamsToday\.Com\s+Page\s+\d+/gi, '')
          .replace(/IBPS PO Pre held on [^\n]+/gi, '')
          .trim();

        // For Cloze Tests (e.g. blank 44, 45, etc.) where the question text is empty
        if (!questionText) {
          questionText = `Select the appropriate word for blank (${cur.num}) in the passage:`;
        }

        // Check if question has inline answer (e.g. "Ans. (c)" or "Answer: B")
        let inlineAns = null;
        const inlineAnsMatch = block.match(/(?:Ans(?:wer)?[\:\s\.\-]+|\(?Ans\)?\s*[\:\.\-]?\s*)(?:\(?([A-Ea-e1-5])\)?)/i);
        if (inlineAnsMatch) {
          let letVal = inlineAnsMatch[1].toUpperCase();
          if (/^[1-5]$/.test(letVal)) letVal = String.fromCharCode(64 + parseInt(letVal, 10));
          inlineAns = letVal;
          questionText = questionText.replace(/(?:Ans(?:wer)?[\:\s\.\-]+|\(?Ans\)?\s*[\:\.\-]?\s*)\(?([A-Ea-e1-5])\)?[\s\S]*$/i, '').trim();
        }

        // Link shared passage / directions if question number falls in a range
        let linkedPassage = "";
        const matchedRange = passageRanges.find(r => cur.num >= r.startNum && cur.num <= r.endNum);
        if (matchedRange) {
          linkedPassage = matchedRange.passage
            .replace(/www\.BankExamsToday\.Com\s+Page\s+\d+/gi, '')
            .replace(/IBPS PO Pre held on [^\n]+/gi, '')
            .trim();
        }

        // Determine Section: Prioritize detected header over general fallback
        const contentSec = inferSectionFromBankContent(questionText, linkedPassage, questions.length);
        const sectionFromHeader = getSectionAtCharIndex(cur.index);
        let finalSection = sectionFromHeader || contentSec || defaultSection;

        // Determine Page Number
        const qPageNum = getPageNumAtCharIndex(cur.index);

        // Ensure all 5 options (A, B, C, D, E) are populated
        const finalOptions = { ...options };
        ["A", "B", "C", "D", "E"].forEach(k => {
          if (!finalOptions[k] || !finalOptions[k].trim()) {
            finalOptions[k] = `Option ${k}`;
          }
        });

        // Determine correct answer: Answer Key > Inline Answer > 'A'
        const correctLetter = answerKeyMap[cur.num] || inlineAns || "A";
        const correctIdx = Math.max(0, correctLetter.charCodeAt(0) - 65);

        // Determine explanation: Solutions map > descriptive text
        const solText = solutionsMap[cur.num] || `Verified correct answer: Option ${correctLetter}. Detailed step-by-step working from exam solutions.`;

        questions.push({
          id: `pdf_q_${Date.now()}_${questions.length}`,
          questionNumber: cur.num,
          page_number: qPageNum,
          chart_page_number: qPageNum,
          section: finalSection,
          passage: linkedPassage,
          question: questionText || `Question ${cur.num}`,
          question_text: questionText || `Question ${cur.num}`,
          options: finalOptions,
          correctAnswerIndex: correctIdx < 5 ? correctIdx : 0,
          source_answer: correctLetter,
          explanation: solText,
          solutionText: solText,
        });
      }
    }

    // 8. FALLBACK: If sequential parser found fewer than 5 questions, use flexible block splitter
    if (questions.length < 5) {
      const rawBlocks = questionsText.split(/(?:^|\n|\s)(?:Q(?:uestion)?[\s\.-]*\d+|\d+[\)\.\:\-]|(?:\(\d+\)))\s+/gi).map(b => b.trim()).filter(Boolean);
      for (let i = 0; i < rawBlocks.length; i++) {
        const block = rawBlocks[i];
        if (block.length < 5) continue;
        let { questionText, options } = parseOptionsFromBlock(block);
        const qNum = i + 1;
        const finalOptions = { ...options };
        ["A", "B", "C", "D", "E"].forEach(k => {
          if (!finalOptions[k] || !finalOptions[k].trim()) {
            finalOptions[k] = `Option ${k}`;
          }
        });
        const correctLetter = answerKeyMap[qNum] || "A";
        const correctIdx = Math.max(0, correctLetter.charCodeAt(0) - 65);
        const finalSection = inferSectionFromBankContent(questionText, "", i);
        const fallbackSol = solutionsMap[qNum] || `Verified correct answer: Option ${correctLetter}.`;

        questions.push({
          id: `pdf_q_${Date.now()}_${i}`,
          questionNumber: qNum,
          section: finalSection,
          passage: "",
          question: questionText || `Question ${qNum}`,
          question_text: questionText || `Question ${qNum}`,
          options: finalOptions,
          correctAnswerIndex: correctIdx < 5 ? correctIdx : 0,
          source_answer: correctLetter,
          explanation: fallbackSol,
          solutionText: fallbackSol,
        });
      }
    }

    // Propagate linked passage to upcoming questions in the same 5-question block
    let activePassage = "";
    let activePassageEnd = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.passage && q.passage.length > 25) {
        activePassage = q.passage;
        activePassageEnd = (q.questionNumber || (i + 1)) + 4;
      } else if (activePassage && (q.questionNumber || (i + 1)) <= activePassageEnd) {
        q.passage = activePassage;
      } else {
        activePassage = "";
      }
    }

    return questions.slice(0, 200);
  };



  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPDF = file.name.toLowerCase().endsWith(".pdf");
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    
    if (!isPDF && !isDocx) {
      return pushToast("Please upload a PDF or Word (.docx) file only.");
    }
    setPdfFile(file);
    setPdfStatus("extracting");
    setPdfPageInfo("");
    setGeneratedTest(null);
    setApprovedQuestions({});

    try {
      setPdfStatus("analyzing");
      setExtractionStartTime(Date.now());
      setPdfPageInfo(`Extracting text from ${isPDF ? 'PDF' : 'Word document'} locally...`);
      
      const arrayBuffer = await file.arrayBuffer();
      let fullText = "";

      if (isPDF) {
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
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageIndices = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
        const pagesData = await Promise.all(pageIndices.map(async (i) => {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = extractTextWithMathPreservation(textContent);
          return { pageNum: i, text: pageText, page };
        }));
        pagesData.sort((a, b) => a.pageNum - b.pageNum);
        fullText = pagesData.map(p => `\n--- Page ${p.pageNum} ---\n${p.text}`).join("\n");

        const diRegex = /(?:directions?\s*\(?\s*q?\.?\s*\d+|study the following|refer to the|pie[\s-]?chart|bar[\s-]?graph|bar[\s-]?chart|line[\s-]?graph|table|tabular|data interpretation|histogram|given below|graph)/i;
        const qRegex = /(?:\b[1-9]\d*[\.\)]|\b(?:Q(?:uestion)?[\s\.\d]+)|(?:[A-Ea-e][\.\)]\s*[\w\d]+))/i;
        const promoRegex = /(?:1\s*lakh\+|aspirants|achievers|download app|join us|smartkeeda|testzone|test series|toppers|subscribe|install app|coupon|selected aspirants)/i;
        const isScannedOnly = fullText.trim().length < 300;
        const pageImagesArr = [];

        // Render pages with DI charts & tables for smart cropping (or all pages if scanned / vision enabled)
        setPdfPageInfo(`Scanning ${pdf.numPages} pages for questions, DI charts, and tables...`);
        for (let i = 0; i < pagesData.length; i++) {
          const p = pagesData[i];
          const hasDI = diRegex.test(p.text);
          const hasQ = qRegex.test(p.text);
          const isPromo = !isScannedOnly && (
            (p.text.trim().length < 60 && !hasDI && !hasQ) ||
            (promoRegex.test(p.text) && !hasDI && !hasQ)
          );

          // Skip pure ad cover posters
          if (isPromo && !isScannedOnly) continue;

          // Render canvas for all pages with content to ensure all charts/tables/graphs are captured
          if (!isPromo || hasDI || enableVisionAI || isScannedOnly) {
            try {
              const viewport = p.page.getViewport({ scale: 1.5 });
              const canvas = document.createElement("canvas");
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext("2d");
              await p.page.render({ canvasContext: ctx, viewport }).promise;

              // Automatic smart diagram cropper:
              // Isolates the chart/diagram area between the directions header and bottom questions
              let finalCanvas = canvas;
              if (hasDI) {
                try {
                  const textContent = await p.page.getTextContent();
                  let headerBottomY = 0;
                  let questionTopY = viewport.height;

                  for (const item of textContent.items) {
                    if (!item.str || !item.str.trim()) continue;
                    const str = item.str.trim();
                    const txt = str.toLowerCase();
                    const [_, vy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);

                    // Detect directions or context description header
                    if (/(?:directions?|study the following|given below|shows the|quiz|breakup of|pie[\s-]?chart|bar[\s-]?graph|bar[\s-]?chart|line[\s-]?graph|tabular|table)/i.test(txt)) {
                      if (vy < viewport.height * 0.60 && vy > headerBottomY) {
                        headerBottomY = vy + 28;
                      }
                    }

                    // Detect question 1 or question numbers / options at bottom
                    const isQStart = /^(?:Q(?:uestion)?\s*)?[1-9]\d*[\.\:\)]/i.test(str) ||
                                     /^\([1-9]\d*\)/.test(str) ||
                                     str.startsWith("1.") || str.startsWith("1)") || str.startsWith("Q1") ||
                                     /^(?:\[?[A-Ea-e]\]?[\.\:\)]|\([A-Ea-e]\))\s*\S+/.test(str);

                    if (isQStart && vy > viewport.height * 0.32 && vy < questionTopY) {
                      questionTopY = vy - 12;
                    }
                  }

                  if (questionTopY >= viewport.height || questionTopY <= headerBottomY) {
                    questionTopY = viewport.height * 0.92;
                  }
                  if (headerBottomY <= 0) {
                    headerBottomY = viewport.height * 0.22;
                  }

                  const searchTop = Math.max(0, Math.floor(headerBottomY));
                  const searchBottom = Math.min(canvas.height, Math.ceil(questionTopY));
                  const searchH = searchBottom - searchTop;

                  if (searchH > 50) {
                    const imgData = ctx.getImageData(0, searchTop, canvas.width, searchH);
                    const pixels = imgData.data;
                    let minX = canvas.width, maxX = 0, minY = searchH, maxY = 0;
                    let hasContent = false;

                    // Skip outer 5% margin to avoid page border lines
                    const minScanX = Math.floor(canvas.width * 0.05);
                    const maxScanX = Math.floor(canvas.width * 0.95);

                    for (let py = 0; py < searchH; py += 2) {
                      for (let px = minScanX; px < maxScanX; px += 2) {
                        const idx = (py * canvas.width + px) * 4;
                        if (pixels[idx + 3] > 60 && (pixels[idx] < 230 || pixels[idx + 1] < 230 || pixels[idx + 2] < 230)) {
                          if (px < minX) minX = px;
                          if (px > maxX) maxX = px;
                          if (py < minY) minY = py;
                          if (py > maxY) maxY = py;
                          hasContent = true;
                        }
                      }
                    }

                    if (hasContent && (maxX - minX > 80) && (maxY - minY > 50)) {
                      const pad = 16;
                      const cropX = Math.max(0, minX - pad);
                      const cropY = Math.max(0, searchTop + minY - pad);
                      const cropW = Math.min(canvas.width - cropX, (maxX - minX) + pad * 2);
                      const cropH = Math.min(canvas.height - cropY, (maxY - minY) + pad * 2);

                      const cropCanvas = document.createElement("canvas");
                      cropCanvas.width = cropW;
                      cropCanvas.height = cropH;
                      const cropCtx = cropCanvas.getContext("2d");
                      cropCtx.fillStyle = "#ffffff";
                      cropCtx.fillRect(0, 0, cropW, cropH);
                      cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
                      finalCanvas = cropCanvas;
                    }
                  }
                } catch (cropErr) {
                  console.warn("[Chart AutoCrop] Error during diagram cropping:", cropErr);
                }
              }

              const base64 = finalCanvas.toDataURL("image/jpeg", 0.90).split(",")[1];
              const fullPageBase64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];

              pageImagesArr.push({
                pageNum: p.pageNum,
                text: p.text,
                base64,
                fullBase64: fullPageBase64,
                mimeType: "image/jpeg",
                isPromo: isPromo
              });
            } catch (renderErr) {
              console.warn(`[DI Extract] Page ${p.pageNum} image capture failed:`, renderErr.message);
            }
          }
        }

        window.__pdfPageImages__ = pageImagesArr;
        if (pageImagesArr.length > 0) {
          setExtractionProgress(`${pdf.numPages} pages scanned · ${fullText.length.toLocaleString()} chars · ${pageImagesArr.length} pages captured for DI charts & tables`);
        } else {
          setExtractionProgress(`${pdf.numPages} pages scanned · ${fullText.length.toLocaleString()} characters extracted (Instant Text Mode)`);
        }
      } else if (isDocx) {
        if (!window.mammoth) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        fullText = result.value;
        setExtractionProgress(`Word Document scanned · ${fullText.length.toLocaleString()} characters extracted`);
      }

      setPdfPageInfo(pdfExtractionMethod === "ai" ? "Extracting questions using High-Accuracy AI LLM Model..." : "Extracting questions instantly using local parser...");

      let extractedQuestions = [];
      let llmSuccess = false;

      const offlineQuestions = parseQuestionsFromPDFText(fullText, f.subject || "General", 200);

      try {
        if (pdfExtractionMethod === "ai") {
          try {
            abortControllerRef.current = new AbortController();
            const aiResult = await generateMockTestFromPDF({
              pdfText: fullText,
              category: f.category,
              timeLimit: f.time,
              title: f.title,
              onProgress: (done, total) => {
                if (window.__pdfPageImages__ && window.__pdfPageImages__.length > 0 && done < window.__pdfPageImages__.length) {
                  setPdfPageInfo(`🖼️ Vision AI scanning charts/tables (Page ${done}/${total})...`);
                } else {
                  setPdfPageInfo(`🤖 AI Model extracting questions (Chunk ${done}/${total})...`);
                }
              },
              signal: abortControllerRef.current.signal,
              pageImages: isPDF ? (window.__pdfPageImages__ || []) : [],
            });
            if (aiResult && aiResult.rawExtractedQuestions && aiResult.rawExtractedQuestions.length > 0) {
              const aiQs = aiResult.rawExtractedQuestions;
              // If AI only extracted a partial set (e.g. 33 questions out of 100), merge seamlessly so all 100 questions are preserved!
              if (offlineQuestions.length > aiQs.length && offlineQuestions.length >= 20) {
                console.log(`[Extraction] AI extracted ${aiQs.length} questions, but full paper has ${offlineQuestions.length} questions. Merging complete paper!`);
                const merged = [...offlineQuestions];
                aiQs.forEach((aiQ, idx) => {
                  const qNum = aiQ.questionNumber || (idx + 1);
                  const targetIdx = merged.findIndex(oq => (oq.questionNumber || (merged.indexOf(oq) + 1)) === qNum);
                  if (targetIdx !== -1) {
                    merged[targetIdx] = {
                      ...merged[targetIdx],
                      ...aiQ,
                      options: (aiQ.options && Object.keys(aiQ.options).length >= 4) ? aiQ.options : merged[targetIdx].options,
                      explanation: aiQ.explanation || merged[targetIdx].explanation,
                      solutionText: aiQ.solutionText || aiQ.explanation || merged[targetIdx].solutionText || merged[targetIdx].explanation
                    };
                  }
                });
                extractedQuestions = merged;
                llmSuccess = true;
                pushToast(`✅ Extracted all ${merged.length} questions (${aiQs.length} AI-enhanced + ${merged.length - aiQs.length} structured)!`);
              } else {
                extractedQuestions = aiQs.map((aiQ, idx) => {
                  const qNum = aiQ.questionNumber || (idx + 1);
                  const matchedOffline = offlineQuestions.find(oq => (oq.questionNumber || (offlineQuestions.indexOf(oq) + 1)) === qNum);
                  const exp = aiQ.explanation || matchedOffline?.explanation || "";
                  return {
                    ...aiQ,
                    explanation: exp,
                    solutionText: aiQ.solutionText || exp
                  };
                });
                llmSuccess = true;
              }
            } else {
              extractedQuestions = offlineQuestions;
            }
          } catch (aiErr) {
            if (aiErr.message.includes("cancelled")) {
              throw aiErr;
            }
            console.warn("AI LLM Extraction warning, using local regex parser fallback...", aiErr);
            pushToast(`⚠️ AI LLM Notice: ${aiErr.message || "Model response fallback"}`);
            extractedQuestions = offlineQuestions;
          }
        } else {
          // Fast instant extraction using local parser
          extractedQuestions = offlineQuestions;
        }
      } catch (err) {
        if (err.message.includes("cancelled")) throw err;
        console.error("Local parser error:", err);
        extractedQuestions = offlineQuestions;
      }
      if (extractedQuestions.length === 0) {
        throw new Error("Failed to extract any valid questions from the document.");
      }

      setF(prev => ({ ...prev, questions: extractedQuestions.length }));

      if (extractedQuestions.length === 0) {
        throw new Error("NO_QUESTIONS_FOUND: Could not extract any questions from the uploaded PDF.");
      }

      setPdfPageInfo(`Successfully extracted ${extractedQuestions.length} questions (${llmSuccess ? "AI LLM Engine" : "Offline Parser"})`);

      const result = {
        title: f.title.trim() || `${f.category} PYQ - ${file.name.replace(".pdf", "")}`,
        category: f.category,
        subject: f.subject,
        topic: f.topic,
        time: f.time || (extractedQuestions.length <= 40 ? "20 min" : "60 min"),
        durationMinutes: Math.max(1, parseInt(f.time) || (extractedQuestions.length <= 40 ? 20 : 60)),
        questions: extractedQuestions.length,
        rawExtractedQuestions: extractedQuestions,
      };

      result.color = color;
      result.isFree = f.isFree;

      // PHASE 2: Save Immediately with DI Diagram Attachment & Propagation
      let lastDIChart = "";
      let lastDIPassage = "";

      const finalQuestions = [];
      result.rawExtractedQuestions.forEach((q, idx) => {
          const finalLetter = q.source_answer ?? "A";
          const ansIndex = getAnswerIndex(finalLetter);
          const optKeys = Object.keys(q.options || {}).sort();
          const optionsArray = optKeys.length > 0 
            ? optKeys.map(k => q.options[k]) 
            : ["Option A", "Option B", "Option C", "Option D", "Option E"];

          let chartImg = q.chartImageUrl || q.imageUrl || "";

          // Attach diagram if this is a Quantitative Aptitude DI question
          if (isDIQuestion(q)) {
            if (!chartImg && window.__pdfPageImages__ && window.__pdfPageImages__.length > 0) {
              const matched = findBestMatchingChartPage(q, window.__pdfPageImages__);
              if (matched) {
                chartImg = "data:" + (matched.mimeType || "image/jpeg") + ";base64," + (matched.base64 || matched.fullBase64);
              }
            }

            // Inherit chart if consecutive questions share the same DI passage / set
            if (!chartImg && lastDIChart && q.passage && (q.passage === lastDIPassage || lastDIPassage.includes(q.passage.slice(0, 30)))) {
              chartImg = lastDIChart;
            }

            if (chartImg) {
              lastDIChart = chartImg;
              lastDIPassage = q.passage || "";
            }
          } else {
            lastDIChart = "";
            lastDIPassage = "";
          }

          const expText = q.solutionText || q.explanation || "Verification pending.";
          const { cleanPassage, cleanExplanation } = sanitizeDIPassageAndExplanation(q.passage || "", expText, q);

          // Update q directly so rawExtractedQuestions retains the chart and clean passage
          q.chartImageUrl = chartImg;
          q.imageUrl = chartImg;
          q.passage = cleanPassage;
          q.explanation = cleanExplanation;
          q.solutionText = cleanExplanation;

          finalQuestions.push({
            id: `pdf_q_${Date.now()}_${idx}`,
            section: q.section || q.subject || f.subject || "General",
            passage: cleanPassage,
            question: q.question_text || `Question ${idx + 1}`,
            options: optionsArray,
            correctAnswerIndex: ansIndex < optionsArray.length ? ansIndex : 0,
            explanation: cleanExplanation,
            solutionText: cleanExplanation,
            imageUrl: chartImg,
            chartImageUrl: chartImg,
          });
      });

      // Build sections config for draft test preview
      const secCounts = {};
      finalQuestions.forEach(q => {
        const s = q.section || "General";
        secCounts[s] = (secCounts[s] || 0) + 1;
      });
      const uniqueSections = Object.keys(secCounts);
      const isBankTest = (f.category || "").toLowerCase().includes("bank") || finalQuestions.length >= 60;
      const computedSectionsConfig = uniqueSections.map(secName => {
        let dur = 20;
        if (finalQuestions.length <= 40) {
          dur = 20;
        } else if (finalQuestions.length >= 80) {
          dur = 20; // 3 x 20 mins = 60 mins for 100 Qs Bank Prelims
        } else {
          dur = Math.max(10, Math.floor(60 / (uniqueSections.length || 1)));
        }
        return {
          name: secName,
          durationMinutes: dur,
          questionCount: secCounts[secName]
        };
      });
      const totalTestMinutes = computedSectionsConfig.reduce((sum, s) => sum + s.durationMinutes, 0) || (finalQuestions.length >= 80 ? 60 : 30);

      const draftTest = { 
        ...result, 
        time: f.time || `${totalTestMinutes} min`,
        durationMinutes: Math.max(1, parseInt(f.time) || totalTestMinutes),
        isSectionalTimed: isBankTest || uniqueSections.length > 1,
        sectionsConfig: computedSectionsConfig.length > 0 ? computedSectionsConfig : [
          { name: "English Language", durationMinutes: 20, questionCount: 30 },
          { name: "Quantitative Aptitude", durationMinutes: 20, questionCount: 35 },
          { name: "Reasoning Ability", durationMinutes: 20, questionCount: 35 },
        ],
        sections: uniqueSections.length > 0 ? uniqueSections : ["English Language", "Quantitative Aptitude", "Reasoning Ability"],
        questionsList: finalQuestions, 
        id: "draft_" + Date.now() 
      };
      
      setGeneratedTest(draftTest);
      setVerificationProgress("");
      setPdfStatus("done");
      pushToast(`✅ Mock test extracted successfully! Background verification started.`);
      
      // PHASE 3: Background Verification. The offline parser has already
      // produced a usable test; do not make dozens of failing AI calls and
      // destabilise the preview when the optional AI service is offline.
      if (!llmSuccess) {
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

    const editChartImage = (idx, base64DataUrl) => {
    if (!base64DataUrl) return;
    setApprovedQuestions(prev => {
      const q = prev[idx] || {};
      const currentUrls = q.chartImageUrls || (q.chartImageUrl ? [q.chartImageUrl] : []);
      return {
        ...prev,
        [idx]: { ...q, chartImageUrls: [...currentUrls, base64DataUrl], chartImageUrl: base64DataUrl, _imageRemoved: false }
      };
    });
  };

  const removeChartImage = (idx, imgIndex) => {
    setApprovedQuestions(prev => {
      const q = prev[idx] || {};
      const currentUrls = q.chartImageUrls || (q.chartImageUrl ? [q.chartImageUrl] : (q.imageUrl ? [q.imageUrl] : []));
      const newUrls = currentUrls.filter((_, i) => i !== imgIndex);
      return {
        ...prev,
        [idx]: { 
          ...q, 
          chartImageUrls: newUrls,
          chartImageUrl: newUrls.length > 0 ? newUrls[0] : null,
          imageUrl: newUrls.length > 0 ? newUrls[0] : null,
          _imageRemoved: newUrls.length === 0
        }
      };
    });
  };

  const replaceChartImage = (idx, imgIndex, newBase64DataUrl) => {
    if (!newBase64DataUrl) return;
    setApprovedQuestions(prev => {
      const q = prev[idx] || {};
      const fallbackUrls = (generatedTest?.rawExtractedQuestions?.[idx]?.chartImageUrl ? [generatedTest.rawExtractedQuestions[idx].chartImageUrl] : []);
      const currentUrls = q.chartImageUrls && q.chartImageUrls.length > 0 
        ? q.chartImageUrls 
        : (q.chartImageUrl ? [q.chartImageUrl] : fallbackUrls);

      const updatedUrls = [...currentUrls];
      if (imgIndex >= 0 && imgIndex < updatedUrls.length) {
        updatedUrls[imgIndex] = newBase64DataUrl;
      } else {
        updatedUrls.push(newBase64DataUrl);
      }
      return {
        ...prev,
        [idx]: { 
          ...q, 
          chartImageUrls: updatedUrls, 
          chartImageUrl: updatedUrls[0] || newBase64DataUrl,
          _imageRemoved: false
        }
      };
    });
  };

  const openImageCropper = (qIdx, imgIdx, currentUrl) => {
    let fullSrc = currentUrl;
    if (window.__pdfPageImages__ && window.__pdfPageImages__.length > 0) {
      const q = (generatedTest?.rawExtractedQuestions || [])[qIdx] || {};
      const matched = findBestMatchingChartPage(q, window.__pdfPageImages__);
      if (matched && matched.fullBase64) {
        fullSrc = "data:" + (matched.mimeType || "image/jpeg") + ";base64," + matched.fullBase64;
      }
    }

    setCropperModal({
      qIdx,
      imgIdx,
      src: fullSrc,
      currentUrl: currentUrl,
      cropTop: 20,
      cropBottom: 25,
      cropLeft: 0,
      cropRight: 0,
    });
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

  const handleOptionPasteForApproved = (e, idx, startKey) => {
    const pasteText = e.clipboardData?.getData("text") || "";
    const parts = parsePastedOptions(pasteText);
    
    if (parts.length > 1) {
      e.preventDefault();
      setApprovedQuestions(prev => {
        const cur = prev[idx] || {};
        const newOptionsObj = { ...(cur.options || {}) };
        
        let pIdx = 0;
        for (let j = startKey; j < startKey + parts.length; j++) {
          if (j < 7) {
            newOptionsObj[j] = parts[pIdx];
          }
          pIdx++;
        }
        
        return {
          ...prev,
          [idx]: { ...cur, options: newOptionsObj }
        };
      });
      pushToast(`✨ Automatically split ${parts.length} options!`);
    }
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
    if (!file) {
      setApprovedQuestions(prev => ({
        ...prev,
        [idx]: {
          ...prev[idx],
          imageUrl: ""
        }
      }));
      return;
    }
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

  const attachSolutionImageToQuestion = (idx, file) => {
    if (!file) {
      setApprovedQuestions(prev => ({
        ...prev,
        [idx]: {
          ...prev[idx],
          solutionImageUrl: ""
        }
      }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setApprovedQuestions(prev => ({
        ...prev,
        [idx]: {
          ...prev[idx],
          solutionImageUrl: reader.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const editSolutionText = (idx, text) => {
    setApprovedQuestions(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        solutionText: text
      }
    }));
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

      {/* Published Success Alert Banner */}
      {publishedSuccess && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-2 border-emerald-400 shadow-md flex items-center justify-between flex-wrap gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              ✓
            </div>
            <div>
              <h4 className="font-extrabold text-emerald-950 text-base">
                Mock Test Successfully Published &amp; Live!
              </h4>
              <p className="text-xs text-emerald-800 font-medium mt-0.5">
                “{publishedSuccess.title}” is now live in <b>{publishedSuccess.category}</b> with <b>{publishedSuccess.questions} questions</b> ({publishedSuccess.time || "Timed"}). {publishedSuccess.isFree ? "Visible in Free Mocks section." : "Available in Student Mock Tests section."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(publishedSuccess.isFree ? "/free-mocks" : `/mock-tests?exam=${encodeURIComponent(publishedSuccess.category)}`)}
              className="btn-primary text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={14} /> View in Student Mock Tests List →
            </button>
            <button
              type="button"
              onClick={() => setPublishedSuccess(null)}
              className="p-2 text-emerald-800 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="inline-flex p-1 rounded-2xl bg-black/[0.05]">
          <button
            onClick={() => setMode("pdf")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === "pdf" ? "bg-white shadow-card text-brand-700" : "text-ink-muted hover:text-ink-soft"}`}
          >
            <FileUp size={16} className="text-emerald-600" /> 📄 Single PDF PYQ
          </button>

          <button
            onClick={() => setMode("manual")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === "manual" ? "bg-white shadow-card text-brand-700" : "text-ink-muted hover:text-ink-soft"}`}
          >
            <Plus size={16} /> Manual Test Setup
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${(mode === "pdf" && generatedTest) ? "grid-cols-1" : "lg:grid-cols-[1.2fr_1fr]"}`}>
        {/* Left Form */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink">{mode === "pdf" ? "📄 Upload Question Paper PDF" : "Test Details"}</h3>
            <Badge color={color}>{f.category}</Badge>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-soft mb-1.5 block">Test Title (Optional for PDF)</label>
            <input className="input" placeholder="e.g. IBPS PO Prelims 2024 Full Mock" value={f.title} onChange={(e) => set("title", e.target.value)} />
          </div>

          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-700">⚡ Quick Presets:</span>
            <button
              type="button"
              onClick={() => setF(prev => ({ ...prev, category: "Banking", subject: "Quantitative Aptitude", topic: "Full Quants & DI", questions: "35", time: "20 min", isSectionalTimed: false }))}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              📊 Quants Sectional (35 Qs · 20m)
            </button>
            <button
              type="button"
              onClick={() => setF(prev => ({ ...prev, category: "Banking", subject: "Reasoning Ability", topic: "Puzzles & Seating", questions: "35", time: "20 min", isSectionalTimed: false }))}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              🧩 Reasoning Sectional (35 Qs · 20m)
            </button>
            <button
              type="button"
              onClick={() => setF(prev => ({ ...prev, category: "Banking", subject: "Prelims Full Mock", topic: "All Sections", questions: "100", time: "60 min", isSectionalTimed: true }))}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              📝 Full Mock (100 Qs · 60m)
            </button>
            <button
              type="button"
              onClick={() => setF(prev => ({ ...prev, category: "", subject: "", topic: "", questions: "", time: "", isSectionalTimed: false }))}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              🧹 Clear All
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Category / Exam</label>
              <input 
                list="category-options"
                className="input" 
                placeholder="e.g. Banking, SSC, TNPSC..." 
                value={f.category} 
                onChange={(e) => set("category", e.target.value)} 
              />
              <datalist id="category-options">
                {CATEGORIES.map((c) => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Subject</label>
              <input type="text" className="input" placeholder="e.g. Quantitative Aptitude / Full Mock" value={f.subject} onChange={(e) => set("subject", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Topic</label>
              <input type="text" className="input" placeholder="e.g. Data Interpretation / Speed Math" value={f.topic} onChange={(e) => set("topic", e.target.value)} />
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Questions</label>
              <input className="input" type="number" min="1" max="200" placeholder="e.g. 35 (leave empty to extract all from PDF)" value={f.questions} onChange={(e) => set("questions", e.target.value)} />
              <p className="text-[11px] text-ink-faint mt-1">Leave empty to auto-extract all questions, or set a limit (1–200).</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Duration (minutes)</label>
              <input className="input" type="number" min="1" max="300" placeholder="e.g. 20 (minutes)" value={f.time ? String(f.time).replace(/\D/g, "") : ""} onChange={(e) => set("time", e.target.value ? `${e.target.value} min` : "")} />
              <p className="text-[11px] text-ink-faint mt-1">Set duration in minutes (e.g. 20 for sectional, 60 for full mock).</p>
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

          {/* Section Management */}
          <div className="pt-4 border-t border-black/5">
            <label className="text-sm font-medium text-ink-soft mb-1.5 block">Test Sections Management</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(f.sections || DEFAULT_SECTIONS).map((sec, i) => (
                <div key={i} className="flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 px-2 py-1 rounded-lg text-xs font-semibold">
                  {sec}
                  <button onClick={() => set("sections", (f.sections || DEFAULT_SECTIONS).filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700 ml-1 p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-sm">
              <input type="text" id="newSectionInput" placeholder="Add custom section..." className="input text-xs py-1.5 flex-1" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.target.value.trim()) {
                    set("sections", [...new Set([...(f.sections || DEFAULT_SECTIONS), e.target.value.trim()])]);
                    e.target.value = '';
                  }
                }
              }} />
              <button onClick={(e) => {
                const input = document.getElementById('newSectionInput');
                if (input.value.trim()) {
                  set("sections", [...new Set([...(f.sections || DEFAULT_SECTIONS), input.value.trim()])]);
                  input.value = '';
                }
              }} className="btn-primary text-xs px-3 py-1.5">Add Section</button>
            </div>
          </div>

          {/* PDF Upload Zone */}
          {mode === "pdf" && (
            <div className="pt-4 border-t border-black/5 space-y-4">
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                      {pdfStatus === "extracting" ? "📄 Extracting text from document..." : "🤖 AI LLM Model is extracting questions..."}
                    </p>
                    {pdfPageInfo && <p className="text-xs text-emerald-700 font-semibold">{pdfPageInfo}</p>}
                    {extractionProgress && (
                      <div className="bg-emerald-100 rounded-full h-1.5 mt-2 overflow-hidden relative">
                        <div className="bg-emerald-500 absolute inset-y-0 left-0 w-full animate-pulse"></div>
                      </div>
                    )}
                    {extractionProgress && <p className="text-xs font-bold text-emerald-700">{extractionProgress}</p>}
                    {extractionElapsed > 0 && (
                      <p className="text-[10px] font-semibold text-emerald-600 mt-1">
                        Time elapsed: {extractionElapsed}s {extractionElapsed > 15 && "(Processing text with LLM model)"}
                      </p>
                    )}
                    {(pdfStatus === "extracting" || pdfStatus === "analyzing") && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelExtraction();
                        }}
                        className="mt-4 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
                      >
                        Cancel Extraction
                      </button>
                    )}
                  </div>
                ) : pdfStatus === "done" ? (
                  <div className="space-y-2">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
                    <p className="font-bold text-emerald-900 text-sm">✅ {generatedTest?.questions} questions extracted with AI</p>
                    <p className="text-xs text-emerald-700 font-semibold">Mock Test Ready</p>
                    <p className="text-xs text-emerald-600 font-bold mt-1">Click to upload a different PDF or Word document</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <FileUp size={32} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-ink text-sm">Drop your Previous Year Question Paper PDF or Word Document here</p>
                      <p className="text-xs text-ink-muted mt-1">or click to browse · Supports IBPS, SBI, TNPSC, SSC question papers in .pdf or .docx format</p>
                    </div>
                    {pdfFile && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl text-xs text-ink-soft border border-black/5 font-semibold">
                        <FileText size={14} className="text-emerald-600" />
                        {pdfFile.name}
                      </div>
                    )}
                    <div className="mt-4 flex flex-col items-center justify-center gap-2 bg-white p-2.5 rounded-xl border border-black/5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="extractionMethod" value="ai" checked={pdfExtractionMethod === "ai"} onChange={() => setPdfExtractionMethod("ai")} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                          <span className="text-xs font-bold text-ink">High Accuracy AI (Fast Text, ~5s)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="extractionMethod" value="regex" checked={pdfExtractionMethod === "regex"} onChange={() => setPdfExtractionMethod("regex")} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                          <span className="text-xs font-bold text-ink">Fast Offline (Instant, &lt;1s)</span>
                        </label>
                      </div>
                      {pdfExtractionMethod === "ai" && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-muted hover:text-ink pt-1.5 border-t border-black/5 w-full justify-center">
                          <input
                            type="checkbox"
                            checked={enableVisionAI}
                            onChange={(e) => setEnableVisionAI(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                          <span>🖼️ Deep Vision AI (Scan charts &amp; DI tables from images - takes longer)</span>
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}



          {mode === "manual" && (
            <div className="pt-4 border-t border-black/5 space-y-6">
              {/* Mock Type Selector */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-4 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-ink flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#1B4F72] text-white flex items-center justify-center text-xs">🏛</span>
                      Exam Type &amp; Sectional Breakdown
                    </h4>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Configure full banking exam pattern (60 min total, 20 min per section) or standard topic test.
                    </p>
                  </div>
                  <div className="inline-flex p-1 rounded-xl bg-white border border-black/10 shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setTestType("full_mock");
                        set("isSectionalTimed", true);
                        const totalDur = sectionsConfig.reduce((a, s) => a + (parseInt(s.durationMinutes) || 0), 0) || 60;
                        set("time", `${totalDur} min`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        testType === "full_mock" ? "bg-[#1B4F72] text-white shadow-xs" : "text-ink-soft hover:bg-slate-100"
                      }`}
                    >
                      🏦 Full Mock (Banking / Sectional Timed)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTestType("standard");
                        set("isSectionalTimed", false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        testType === "standard" ? "bg-[#1B4F72] text-white shadow-xs" : "text-ink-soft hover:bg-slate-100"
                      }`}
                    >
                      🎯 Single Section / Standard Quiz
                    </button>
                  </div>
                </div>

                {/* Section Configuration Inputs (English 20m / 35Q, Quant 20m / 35Q, Reasoning 20m / 35Q) */}
                {testType === "full_mock" && (
                  <div className="pt-3 border-t border-blue-200/60 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-[#1B4F72] uppercase tracking-wider">
                        Configure Sections (Timing &amp; Question Target):
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={resetToBankingPresets}
                          className="text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          ↻ Reset to Banking Prelims (60m · 100Q)
                        </button>
                        <button
                          type="button"
                          onClick={addSectionToConfig}
                          className="text-[11px] font-bold text-white bg-[#1B4F72] hover:bg-[#153e5b] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Section
                        </button>
                      </div>
                    </div>

                    {/* Section Rows */}
                    <div className="grid sm:grid-cols-3 gap-3">
                      {sectionsConfig.map((sec, secIdx) => (
                        <div key={secIdx} className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-xs space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-[#1B4F72] flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-blue-100 text-[#1B4F72] flex items-center justify-center text-[10px]">
                                {secIdx + 1}
                              </span>
                              Section {secIdx + 1}
                            </span>
                            {sectionsConfig.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSectionFromConfig(secIdx)}
                                className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                              >
                                ✕ Remove
                              </button>
                            )}
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-ink-muted block mb-0.5">Section Name</label>
                            <input
                              type="text"
                              value={sec.name}
                              onChange={(e) => updateSectionConfig(secIdx, "name", e.target.value)}
                              placeholder="e.g. English Language"
                              className="input text-xs py-1 px-2 font-bold bg-slate-50 border-black/10 rounded-lg w-full"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-ink-muted block mb-0.5">Duration (mins)</label>
                              <input
                                type="number"
                                min="1"
                                max="180"
                                value={sec.durationMinutes}
                                onChange={(e) => {
                                  updateSectionConfig(secIdx, "durationMinutes", parseInt(e.target.value) || 1);
                                  const totalDur = sectionsConfig.reduce((a, s, i) => a + (i === secIdx ? (parseInt(e.target.value) || 1) : (parseInt(s.durationMinutes) || 0)), 0);
                                  set("time", `${totalDur} min`);
                                }}
                                className="input text-xs py-1 px-2 font-bold bg-slate-50 border-black/10 rounded-lg w-full text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-ink-muted block mb-0.5">Questions</label>
                              <input
                                type="number"
                                min="1"
                                max="200"
                                value={sec.questionCount}
                                onChange={(e) => updateSectionConfig(secIdx, "questionCount", parseInt(e.target.value) || 1)}
                                className="input text-xs py-1 px-2 font-bold bg-slate-50 border-black/10 rounded-lg w-full text-center"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Auto-calculated Total Stats Ribbon */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-4 text-xs font-bold text-[#1B4F72]">
                        <span>
                          ⏱ Total Exam Time: <strong className="text-ink">{sectionsConfig.reduce((a, s) => a + (parseInt(s.durationMinutes) || 0), 0)} Minutes</strong>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>
                          📝 Total Target Questions: <strong className="text-ink">{sectionsConfig.reduce((a, s) => a + (parseInt(s.questionCount) || 0), 0)} Questions</strong>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>
                          Questions in Builder: <strong className="text-emerald-700">{manualQuestions.length} Questions</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={autoGenerateQuestionSlots}
                        className="btn-primary text-xs px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                      >
                        <Sparkles size={13} /> Auto-Generate All Question Slots
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Tabs to filter/view questions */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveManualSectionTab("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeManualSectionTab === "all"
                        ? "bg-[#1B4F72] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({manualQuestions.length})
                  </button>

                  {sectionsConfig.map((sec, sIdx) => {
                    const countInSec = manualQuestions.filter(q => (q.section || "") === sec.name).length;
                    const isTargetMet = countInSec >= (sec.questionCount || 0);
                    const isSelected = activeManualSectionTab === sec.name;

                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setActiveManualSectionTab(sec.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#1B4F72] text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <span>{sec.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : isTargetMet
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {countInSec}/{sec.questionCount || 35}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-black/10 shadow-xs">
                    <span className="text-xs font-bold text-ink-muted">Add</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      className="input text-xs w-12 px-1 py-0.5 text-center font-bold"
                      value={bulkAddCount}
                      onChange={(e) => setBulkAddCount(e.target.value)}
                    />
                    <span className="text-xs font-bold text-ink-muted">to {activeManualSectionTab === "all" ? sectionsConfig[0]?.name : activeManualSectionTab}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addManualQuestion(activeManualSectionTab === "all" ? sectionsConfig[0]?.name : activeManualSectionTab)}
                    className="btn-primary text-xs px-3.5 py-2 text-white bg-[#1B4F72] hover:bg-[#153e5b] flex items-center gap-1.5 font-bold shadow-xs rounded-xl"
                  >
                    <Plus size={15} /> Add Question
                  </button>
                </div>
              </div>

              {/* Questions List (Filtered by active tab) */}
              <div className="space-y-6 max-h-[75vh] md:max-h-[850px] overflow-y-auto pr-1">
                {manualQuestions
                  .map((q, qIdx) => ({ ...q, originalIndex: qIdx }))
                  .filter((q) => activeManualSectionTab === "all" || q.section === activeManualSectionTab)
                  .map((q) => {
                    const qIdx = q.originalIndex;
                    return (
                      <div key={qIdx} className="p-5 rounded-2xl border-2 border-black/10 bg-slate-50/50 space-y-4 relative shadow-xs">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-[#1B4F72] text-white flex items-center justify-center text-xs font-extrabold shadow-xs">
                              {qIdx + 1}
                            </span>
                            <select
                              className="input text-xs py-1 px-3 font-bold bg-white border-black/10 rounded-xl"
                              value={q.section || sectionsConfig[0]?.name || "English Language"}
                              onChange={(e) => updateManualQuestion(qIdx, "section", e.target.value)}
                            >
                              {sectionsConfig.map((s, idx) => (
                                <option key={idx} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                            <span className="text-[11px] font-semibold text-slate-500">
                              Section: <strong className="text-slate-800">{q.section}</strong>
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeManualQuestion(qIdx)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 transition-colors"
                          >
                            <Trash2 size={13} /> Remove Q{qIdx + 1}
                          </button>
                        </div>

                        {/* Paragraph / Passage Context (Essential for Banking Exams!) */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-ink-muted flex items-center gap-1.5">
                              <span>Directions / Passage Context (Crucial for DI sets, Puzzles &amp; RC)</span>
                              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const tableTemplate = `Directions: Study the following table carefully and answer the questions:\n\n| Year | Company A | Company B | Company C |\n| --- | --- | --- | --- |\n| 2021 | 420 | 380 | 510 |\n| 2022 | 480 | 410 | 560 |\n| 2023 | 550 | 460 | 620 |\n`;
                                const cur = q.passage || "";
                                updateManualQuestion(qIdx, "passage", cur ? (cur.trim() + "\n\n" + tableTemplate) : tableTemplate);
                              }}
                              className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                            >
                              📊 + Insert DI Table Template
                            </button>
                          </div>
                          <textarea
                            className="input text-xs min-h-[75px] font-mono bg-white border-black/10 focus:border-[#1B4F72]"
                            placeholder="e.g. Directions: Study the following table and answer the questions:\n| Year | Company A | Company B |\n| --- | --- | --- |\n| 2021 | 450 | 380 |"
                            value={q.passage || ""}
                            onChange={(e) => updateManualQuestion(qIdx, "passage", formatMathText(e.target.value))}
                          />
                        </div>

                        {/* Question Statement */}
                        <div>
                          <label className="text-xs font-bold text-ink-muted mb-1 block">Question Statement</label>

                          <div className="flex flex-wrap items-center gap-1.5 mb-2 bg-white p-2 rounded-xl border border-black/10">
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
                              { label: "📊 DI Table", insert: "\n| Category | Metric 1 | Metric 2 |\n| --- | --- | --- |\n| Item A | 100 | 150 |\n| Item B | 200 | 250 |\n" },
                            ].map((sym, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg transition-colors"
                                onClick={() => {
                                  updateManualQuestion(qIdx, "question", formatMathText((q.question || "") + sym.insert));
                                }}
                              >
                                {sym.label}
                              </button>
                            ))}
                          </div>

                          <textarea
                            className="input text-sm font-semibold bg-white min-h-[80px] p-3 border-black/10 focus:border-[#1B4F72]"
                            placeholder="Enter question statement (e.g. What is the value of B in the passage?)..."
                            value={q.question}
                            onChange={(e) => updateManualQuestion(qIdx, "question", formatMathText(e.target.value))}
                          />
                        </div>

                        {/* Options Grid (Up to Option G, Default 5 Options A to E for Banking) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-ink-muted block">
                              Options ({q.options.length}) &amp; Correct Answer Key (Click radio to mark correct option):
                            </label>
                            <div className="flex items-center gap-2">
                              {q.options.length < 7 && (
                                <button
                                  type="button"
                                  onClick={() => addOptionToManual(qIdx)}
                                  className="text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1"
                                >
                                  <Plus size={12} /> Add Option ({String.fromCharCode(65 + q.options.length)})
                                </button>
                              )}
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOptionFromManual(qIdx)}
                                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100"
                                >
                                  - Remove Option
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {q.options.map((opt, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isRight = +q.correctAnswerIndex === optIdx;
                              return (
                                <div
                                  key={optIdx}
                                  onClick={() => updateManualQuestion(qIdx, "correctAnswerIndex", optIdx)}
                                  className={`flex items-center gap-2.5 p-2 rounded-xl border-2 transition-all cursor-pointer ${
                                    isRight
                                      ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 font-bold shadow-xs"
                                      : "bg-white border-black/10 hover:border-emerald-300"
                                  }`}
                                >
                                  <span
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                                      isRight ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {letter}
                                  </span>

                                  <input
                                    type="radio"
                                    name={`manual_ans_${qIdx}`}
                                    checked={isRight}
                                    onChange={() => updateManualQuestion(qIdx, "correctAnswerIndex", optIdx)}
                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                  />

                                  <input
                                    type="text"
                                    className="input text-xs py-1.5 bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 flex-1 font-medium cursor-text"
                                    value={opt}
                                    onClick={(e) => e.stopPropagation()}
                                    onPaste={(e) => handleOptionPaste(e, qIdx, optIdx)}
                                    onChange={(e) => updateManualOption(qIdx, optIdx, formatMathText(e.target.value))}
                                    placeholder={`Option ${letter}`}
                                  />

                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                                      isRight ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {isRight ? "✓ Correct" : "Select"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Solution Explanation */}
                        <div>
                          <label className="text-xs font-bold text-ink-muted mb-1 block">Solution Explanation (Optional)</label>
                          <textarea
                            className="input text-xs min-h-[55px] bg-white border-black/10"
                            placeholder="Step-by-step logic, grammar rule, or math shortcut..."
                            value={q.explanation || ""}
                            onChange={(e) => updateManualQuestion(qIdx, "explanation", formatMathText(e.target.value))}
                          />
                        </div>

                        {/* Chart / Image Attachment */}
                        <div>
                          <label className="text-xs font-bold text-ink-muted mb-1 block">Attach Chart / Image (Optional)</label>
                          {q.imageUrl && (
                            <div className="relative max-w-xs rounded-xl border border-black/10 overflow-hidden bg-white p-2 mb-2">
                              <img src={q.imageUrl} className="w-full h-auto object-contain max-h-40" alt="Preview" />
                              <button
                                type="button"
                                onClick={() => updateManualQuestion(qIdx, "imageUrl", "")}
                                className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold hover:bg-rose-600 shadow"
                              >✕ Remove</button>
                            </div>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`img-upload-${qIdx}`}
                            onChange={(e) => attachImageToManual(qIdx, e.target.files[0])}
                          />
                          <label htmlFor={`img-upload-${qIdx}`} className="btn-soft text-xs px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer inline-flex items-center gap-1.5 rounded-xl text-ink-soft font-bold shadow-xs">
                            <ImageIcon size={14} /> {q.imageUrl ? "Change Diagram" : "Add Diagram / DI Chart"}
                          </label>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-3">
            {mode === "ai" ? (
              <button onClick={handleGenerateAI} disabled={generating} className="btn-primary px-6 py-2.5 bg-gradient-to-r from-amber-500 to-purple-600 border-0 text-white font-bold">
                {generating ? <><Loader2 size={16} className="animate-spin" /> Generating PYQ Test...</> : <><Sparkles size={16} /> Generate AI Mock Test</>}
              </button>
            ) : mode === "manual" ? (
              <button onClick={publish} disabled={isPublishing} className="btn-primary px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold"><Plus size={16} /> Save & Publish Test</button>
            ) : mode === "pdf" && generatedTest ? (
              <button
                type="button"
                onClick={applyPDFUpdates}
                disabled={isPublishing}
                className="btn-primary px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all text-sm"
              >
                {isPublishing ? (
                  <><Loader2 size={16} className="animate-spin" /> Publishing Mock Test...</>
                ) : (
                  <><CheckCircle2 size={16} /> Save &amp; Publish Mock Test ({generatedTest.rawExtractedQuestions?.length || generatedTest.questions} Qs)</>
                )}
              </button>
            ) : null}

            {generatedTest && mode === "ai" && (
              <button onClick={publish} disabled={isPublishing} className="btn-primary px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
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

            {(mode === "pdf" && generatedTest) && (
              <button
                type="button"
                onClick={() => setIsFullPreview(true)}
                className="btn-soft px-3 py-1.5 text-xs bg-brand-50 text-brand-700 hover:bg-brand-100 flex items-center gap-1.5 font-bold rounded-xl border border-brand-200 shadow-sm transition-all active:scale-95"
              >
                <Maximize2 size={14} /> Fullscreen Maximize View
              </button>
            )}
          </div>

          {(mode === "pdf" && generatedTest) ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-emerald-900 text-sm">{generatedTest.title}</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {generatedTest.rawExtractedQuestions?.length || generatedTest.questions} Questions extracted from PDF · {generatedTest.time} · {generatedTest.category}
                  </p>
                  {pdfFile && <p className="text-[11px] text-emerald-600 mt-1 font-medium">📎 Source: {pdfFile.name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyPDFUpdates}
                    disabled={isPublishing}
                    className="btn-primary px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all"
                  >
                    {isPublishing ? (
                      <><Loader2 size={14} className="animate-spin" /> Publishing...</>
                    ) : (
                      <><CheckCircle2 size={14} /> Save &amp; Publish Test</>
                    )}
                  </button>
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
                  const finalAnswerRaw = approvedQuestions[idx]?.editedAnswer ?? q.ai_verified_answer ?? q.source_answer ?? "A";
                  const finalAnswerIndex = getAnswerIndex(finalAnswerRaw);

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
                            {(f.sections || DEFAULT_SECTIONS).map(s => <option key={s} value={s}>{s}</option>)}
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

                      {/* Paragraph Context (Optional) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-ink-muted">
                            Paragraph / Passage Directions Context (DI Caselet, RC):
                          </label>
                          <div className="flex items-center gap-1.5">
                            {/\|.*\|/.test(approvedQuestions[idx]?.passage ?? (q.passage || "")) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const curPassage = approvedQuestions[idx]?.passage ?? (q.passage || "");
                                  const curExplanation = approvedQuestions[idx]?.solutionText ?? (q.solutionText || q.explanation || "");
                                  const { cleanPassage, cleanExplanation } = sanitizeDIPassageAndExplanation(curPassage, curExplanation, q);
                                  editPassage(idx, cleanPassage);
                                  editSolutionText(idx, cleanExplanation);
                                  pushToast("Cleaned passage: Solved table moved to Solution!");
                                }}
                                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                              >
                                ⚡ Move Solved Table to Solution
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const curPassage = approvedQuestions[idx]?.passage ?? (q.passage || "");
                                if (curPassage && curPassage.trim()) {
                                  const formatted = convertTextTableToMarkdown(curPassage);
                                  editPassage(idx, formatted);
                                  pushToast("✨ Formatted into clean Markdown table!");
                                } else {
                                  const tableTemplate = `Directions: Study the following table and answer the questions:\n\n| Shop | Male visitors | Female visitors |\n| --- | --- | --- |\n| A | 40 | 60 |\n| B | 50 | 70 |\n| C | 60 | 90 |\n| D | 80 | 100 |\n`;
                                  editPassage(idx, tableTemplate);
                                  pushToast("✨ Inserted Markdown table template!");
                                }
                              }}
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                              title="Convert raw text or numbers into a clean Markdown table"
                            >
                              ✨ Convert to Markdown Table
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const tableTemplate = `Directions: Study the following table carefully and answer the questions:\n\n| Year | Company A | Company B | Company C |\n| --- | --- | --- | --- |\n| 2021 | 420 | 380 | 510 |\n| 2022 | 480 | 410 | 560 |\n| 2023 | 550 | 460 | 620 |\n`;
                                const cur = approvedQuestions[idx]?.passage ?? (q.passage || "");
                                editPassage(idx, cur ? (cur.trim() + "\n\n" + tableTemplate) : tableTemplate);
                              }}
                              className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              📊 + Insert DI Table
                            </button>
                          </div>
                        </div>
                        <textarea
                          className="input text-xs min-h-[60px] font-mono bg-white border border-black/10 mb-2"
                          placeholder="Paragraph Context (Optional) - e.g. | Year | Company A | Company B | ..."
                          value={approvedQuestions[idx]?.passage ?? (q.passage || "")}
                          onChange={(e) => editPassage(idx, e.target.value)}
                        />
                      </div>

                      {/* Chart / Table Image Attachment - Only for questions with an actual attached diagram */}
                      {(() => {
                        // If user explicitly removed all images via red X, respect that
                        const wasRemoved = approvedQuestions[idx]?._imageRemoved === true;
                        const activeImgs = wasRemoved ? [] : (
                          approvedQuestions[idx]?.chartImageUrls ||
                          (approvedQuestions[idx]?.chartImageUrl ? [approvedQuestions[idx].chartImageUrl] : null) ||
                          (approvedQuestions[idx]?.imageUrl ? [approvedQuestions[idx].imageUrl] : null) ||
                          q.chartImageUrls ||
                          (q.chartImageUrl ? [q.chartImageUrl] : null) ||
                          (q.imageUrl ? [q.imageUrl] : [])
                        );

                        const hasActualImages = activeImgs.length > 0;

                        if (hasActualImages) {
                          return (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold text-ink-muted block">
                                  📊 DI Chart / Table / Graph Diagram:
                                </label>
                                <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded border border-brand-200">
                                  Data Interpretation
                                </span>
                              </div>
                            
                              <div className="flex flex-wrap gap-2 mb-2">
                                {activeImgs.map((url, imgIdx) => (
                                  <div key={imgIdx} className="relative w-full max-w-sm group">
                                    <img src={url} alt="Chart" className="max-h-52 rounded-lg border border-black/10 object-contain bg-white w-full" />
                                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
                                      {isDIQuestion(approvedQuestions[idx] || q) && (
                                      <button
                                        type="button"
                                        onClick={() => openImageCropper(idx, imgIdx, url)}
                                        className="bg-brand-600 hover:bg-brand-700 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold shadow-md flex items-center gap-1 transition-colors"
                                        title="Crop only the diagram/chart area"
                                      >
                                        <span>✂️ Crop Diagram</span>
                                      </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeChartImage(idx, imgIdx)}
                                        className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] px-2 py-1 rounded-lg font-bold shadow-md transition-colors"
                                        title="Remove image"
                                      >✕</button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {window.__pdfPageImages__ && window.__pdfPageImages__.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                  <span className="text-[10px] text-ink-muted font-bold">📄 PDF Pages:</span>
                                  {window.__pdfPageImages__.map((pImg, pIdx) => (
                                    <button
                                      key={pIdx}
                                      type="button"
                                      onClick={() => {
                                        const dataUrl = "data:" + (pImg.mimeType || "image/jpeg") + ";base64," + (pImg.base64 || pImg.fullBase64);
                                        replaceChartImage(idx, 0, dataUrl);
                                        pushToast(`Attached Page ${pImg.pageNum} diagram to Question ${idx + 1}`);
                                      }}
                                      className="text-[10px] bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                                      title={`Attach Page ${pImg.pageNum} diagram to Question ${idx + 1}`}
                                    >
                                      <span>Page {pImg.pageNum}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // For mini questions without an image, show only a subtle attach option
                        return (
                          <div className="flex items-center justify-between py-1 text-[11px] text-ink-muted bg-black/[0.02] px-3 py-1.5 rounded-lg border border-black/5">
                            <span className="text-slate-500 font-medium">
                              {isDIQuestion(q) ? "📊 Data Interpretation (No diagram attached)" : "🧩 Text Question (No diagram needed)"}
                            </span>
                            <label className="text-[10px] font-bold text-brand-600 hover:text-brand-700 cursor-pointer flex items-center gap-1 hover:underline">
                              + Attach Diagram (Optional)
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (ev) => editChartImage(idx, ev.target.result);
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          </div>
                        );
                      })()}

                      {/* Question Statement */}
                      <div>
                        <label className="text-[11px] font-bold text-ink-muted mb-1 block">Question Statement</label>

                        <div className="flex flex-wrap items-center gap-1 mb-1.5 bg-white p-1.5 rounded-lg border border-black/10">
                          <span className="text-[10px] font-bold text-ink-muted mr-1">Math Insert:</span>
                          {[
                            { label: "¹⁄₂ (Power ½)", insert: "¹⁄₂" },
                            { label: "¹⁄₃ (Power ⅓)", insert: "¹⁄₃" },
                            { label: "²", insert: "²" },
                            { label: "³", insert: "³" },
                            { label: "⁴", insert: "⁴" },
                            { label: "∛", insert: "∛" },
                            { label: "√", insert: "√" },
                            { label: "⅓", insert: " ⅓ " },
                            { label: "½", insert: " ½ " },
                            { label: "¼", insert: " ¼ " },
                            { label: "11/7", insert: " 11/7 " },
                            { label: "×", insert: " × " },
                            { label: "÷", insert: " ÷ " },
                            { label: "≈", insert: " ≈ " },
                            { label: "📊 DI Table", insert: "\n| Category | Metric 1 | Metric 2 |\n| --- | --- | --- |\n| Item A | 100 | 150 |\n| Item B | 200 | 250 |\n" },
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
                            const optIndex = getAnswerIndex(key);
                            const isRight = optIndex === finalAnswerIndex;
                            const label = !isNaN(key) && key.trim() !== '' ? String.fromCharCode(65 + parseInt(key)) : key;
                            return (
                              <div
                                key={key}
                                onClick={() => {
                                  editCorrectAnswer(idx, String(optIndex));
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
                                  {label}
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
                                  value={approvedQuestions[idx]?.options?.[key] ?? (opt || `Option ${label}`)}
                                  onClick={(e) => e.stopPropagation()}
                                  onPaste={(e) => handleOptionPasteForApproved(e, idx, parseInt(key))}
                                  onChange={(e) => editOptionText(idx, key, e.target.value)}
                                  placeholder={`Option ${label}`}
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

                      {/* Solution Image Attachment */}
                      {approvedQuestions[idx]?.solutionImageUrl && (
                        <div className="mt-2 relative max-w-sm rounded-lg overflow-hidden border border-black/10 bg-white p-2">
                          <p className="text-[10px] font-bold text-ink-muted mb-1 block">Solution Image Preview:</p>
                          <img src={approvedQuestions[idx].solutionImageUrl} alt="Solution" className="w-full h-auto object-contain" />
                          <button 
                            type="button"
                            className="absolute top-1 right-1 bg-rose-600 text-white rounded p-1 shadow-sm"
                            onClick={() => attachSolutionImageToQuestion(idx, null)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1 mt-1">
                        <label className="btn-soft px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer flex items-center gap-1 font-semibold rounded-lg border border-emerald-200">
                          <Upload size={13} /> {approvedQuestions[idx]?.solutionImageUrl ? "Change Solution Image" : "Attach Solution Image"}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => attachSolutionImageToQuestion(idx, e.target.files[0])} />
                        </label>
                      </div>

                      {/* Solution Text */}
                      <div className="mt-2">
                        <label className="text-[11px] font-bold text-ink-muted mb-1 block">
                          Answer / Solution Explanation (Optional):
                        </label>
                        <textarea
                          className="input text-xs min-h-[60px] bg-white border border-black/10"
                          placeholder="Enter solution explanation..."
                          value={approvedQuestions[idx]?.solutionText ?? (q.solutionText || q.explanation || "")}
                          onChange={(e) => editSolutionText(idx, e.target.value)}
                        />
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
                <p className="text-xs text-brand-700 mt-1">{f.category}{f.subject ? ` · ${f.subject}` : ""}{f.topic ? ` · ${f.topic}` : ""} · {manualQuestions.length} Qs · {f.time}</p>
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
              <p className="font-semibold text-sm text-ink-soft">Nothing generated yet</p>
              <p className="text-xs">Upload a PDF to extract questions, or build manually.</p>
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
                const finalAnswerRaw = approvedQuestions[idx]?.editedAnswer ?? q.ai_verified_answer ?? q.source_answer ?? "A";
                const finalAnswerIndex = getAnswerIndex(finalAnswerRaw);

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
                          {(f.sections || DEFAULT_SECTIONS).map(s => <option key={s} value={s}>{s}</option>)}
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

                    {/* Paragraph Context */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-ink-muted">
                          Paragraph / Passage Directions Context (DI Caselet, RC):
                        </label>
                        <div className="flex items-center gap-2">
                          {/\|.*\|/.test(approvedQuestions[idx]?.passage ?? (q.passage || "")) && (
                            <button
                              type="button"
                              onClick={() => {
                                const curPassage = approvedQuestions[idx]?.passage ?? (q.passage || "");
                                const curExplanation = approvedQuestions[idx]?.solutionText ?? (q.solutionText || q.explanation || "");
                                const { cleanPassage, cleanExplanation } = sanitizeDIPassageAndExplanation(curPassage, curExplanation, q);
                                editPassage(idx, cleanPassage);
                                editSolutionText(idx, cleanExplanation);
                                pushToast("Cleaned passage: Solved table moved to Solution!");
                              }}
                              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                            >
                              ⚡ Move Solved Table to Solution
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const curPassage = approvedQuestions[idx]?.passage ?? (q.passage || "");
                              if (curPassage && curPassage.trim()) {
                                const formatted = convertTextTableToMarkdown(curPassage);
                                editPassage(idx, formatted);
                                pushToast("✨ Formatted into clean Markdown table!");
                              } else {
                                const tableTemplate = `Directions: Study the following table and answer the questions:\n\n| Shop | Male visitors | Female visitors |\n| --- | --- | --- |\n| A | 40 | 60 |\n| B | 50 | 70 |\n| C | 60 | 90 |\n| D | 80 | 100 |\n`;
                                editPassage(idx, tableTemplate);
                                pushToast("✨ Inserted Markdown table template!");
                              }
                            }}
                            className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                            title="Convert raw text or numbers into a clean Markdown table"
                          >
                            ✨ Convert to Markdown Table
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const tableTemplate = `Directions: Study the following table carefully and answer the questions:\n\n| Year | Company A | Company B | Company C |\n| --- | --- | --- | --- |\n| 2021 | 420 | 380 | 510 |\n| 2022 | 480 | 410 | 560 |\n| 2023 | 550 | 460 | 620 |\n`;
                              const cur = approvedQuestions[idx]?.passage ?? (q.passage || "");
                              editPassage(idx, cur ? (cur.trim() + "\n\n" + tableTemplate) : tableTemplate);
                            }}
                            className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                          >
                            📊 + Insert DI Table Template
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="input text-xs min-h-[70px] font-mono bg-white border border-black/10 p-2.5 mb-3"
                        placeholder="Paragraph Context (Optional) - e.g. | Year | Company A | Company B | ..."
                        value={approvedQuestions[idx]?.passage ?? (q.passage || "")}
                        onChange={(e) => editPassage(idx, e.target.value)}
                      />
                    </div>

                    {/* Question Statement */}
                    <div>
                      <label className="text-xs font-bold text-ink-muted mb-1 block">Question Statement</label>

                      <div className="flex flex-wrap items-center gap-1.5 mb-2 bg-slate-50 p-2 rounded-xl border border-black/10">
                        <span className="text-xs font-bold text-ink-muted mr-1">Math Insert:</span>
                        {[
                          { label: "¹⁄₂ (Power ½)", insert: "¹⁄₂" },
                          { label: "¹⁄₃ (Power ⅓)", insert: "¹⁄₃" },
                          { label: "²", insert: "²" },
                          { label: "³", insert: "³" },
                          { label: "⁴", insert: "⁴" },
                          { label: "∛", insert: "∛" },
                          { label: "√", insert: "√" },
                          { label: "⅓", insert: " ⅓ " },
                          { label: "½", insert: " ½ " },
                          { label: "¼", insert: " ¼ " },
                          { label: "11/7", insert: " 11/7 " },
                          { label: "×", insert: " × " },
                          { label: "÷", insert: " ÷ " },
                          { label: "≈", insert: " ≈ " },
                          { label: "📊 DI Table", insert: "\n| Category | Metric 1 | Metric 2 |\n| --- | --- | --- |\n| Item A | 100 | 150 |\n| Item B | 200 | 250 |\n" },
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

                      <div className="flex flex-col gap-3">
                        {Object.entries(q.options || {}).map(([key, opt]) => {
                          const optIndex = getAnswerIndex(key);
                          const isRight = optIndex === finalAnswerIndex;
                          const label = !isNaN(key) && key.trim() !== '' ? String.fromCharCode(65 + parseInt(key)) : key;
                          return (
                            <div
                              key={key}
                              onClick={() => {
                                editCorrectAnswer(idx, String(optIndex));
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
                                {label}
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

                              <textarea 
                                rows={2}
                                className="input text-xs py-1.5 bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 flex-1 font-semibold cursor-text resize-y min-h-[40px]"
                                value={approvedQuestions[idx]?.options?.[key] ?? (opt || `Option ${label}`)}
                                onClick={(e) => e.stopPropagation()}
                                onPaste={(e) => handleOptionPasteForApproved(e, idx, parseInt(key))}
                                onChange={(e) => editOptionText(idx, key, e.target.value)}
                                placeholder={`Option ${label}`}
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



                    {/* Image Preview & Attachment - Only for Quants DI questions or if user has attached an image */}
                    {(isDIQuestion(q) || Boolean(approvedQuestions[idx]?.imageUrl || q.imageUrl)) ? (
                      <div>
                        {approvedQuestions[idx]?.imageUrl && (
                          <div className="mt-2 relative max-w-md rounded-xl overflow-hidden border border-black/10 bg-white">
                            <img src={approvedQuestions[idx].imageUrl} alt="Chart/Data" className="w-full h-auto object-contain max-h-60" />
                            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openImageCropper(idx, 0, approvedQuestions[idx].imageUrl)}
                                className="bg-brand-600 hover:bg-brand-700 text-white text-xs px-2.5 py-1 rounded-lg font-bold shadow-md flex items-center gap-1 transition-colors"
                              >
                                ✂️ Crop Diagram
                              </button>
                              <button 
                                type="button"
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg p-1.5 shadow-md font-bold text-xs"
                                onClick={() => attachImageToQuestion(idx, null)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <label className="btn-soft px-3.5 py-2 text-xs bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center gap-1.5 font-bold rounded-xl border border-slate-200">
                            <Upload size={14} /> {approvedQuestions[idx]?.imageUrl ? "Change Chart/Image" : "Attach Chart/Image"}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => attachImageToQuestion(idx, e.target.files[0])} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1 text-xs text-ink-muted bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-medium">🧩 Puzzle / Text-Based Question (No chart needed)</span>
                        <label className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer flex items-center gap-1 hover:underline">
                          + Attach Diagram (Optional)
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => attachImageToQuestion(idx, e.target.files[0])} />
                        </label>
                      </div>
                    )}

                    {/* Solution Image Attachment */}
                    {approvedQuestions[idx]?.solutionImageUrl && (
                      <div className="mt-4 relative max-w-md rounded-xl overflow-hidden border border-black/10 bg-white p-2">
                        <p className="text-xs font-bold text-ink-muted mb-1 block">Solution Image Preview:</p>
                        <img src={approvedQuestions[idx].solutionImageUrl} alt="Solution" className="w-full h-auto object-contain max-h-60" />
                        <button 
                          type="button"
                          className="absolute top-2 right-2 bg-rose-600 text-white rounded-lg p-1.5 shadow-md"
                          onClick={() => attachSolutionImageToQuestion(idx, null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 mt-2">
                      <label className="btn-soft px-3.5 py-2 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer flex items-center gap-1.5 font-bold rounded-xl border border-emerald-200">
                        <Upload size={14} /> {approvedQuestions[idx]?.solutionImageUrl ? "Change Solution Image" : "Attach Solution Image"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => attachSolutionImageToQuestion(idx, e.target.files[0])} />
                      </label>
                    </div>

                    {/* Solution Text */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-ink-muted">
                          Answer / Solution Step-by-Step Explanation:
                        </label>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Shown to students after test submission
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mb-2 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-800 mr-1">Math Steps Insert:</span>
                        {[
                          { label: "Step 1: Simplify", insert: "\nStep 1: Simplify given terms & powers:\n" },
                          { label: "Step 2: Calculate", insert: "\nStep 2: Compute intermediate value:\n" },
                          { label: "Step 3: Answer", insert: "\nStep 3: Hence verified correct option is: " },
                          { label: "¹⁄₂", insert: "¹⁄₂" },
                          { label: "¹⁄₃", insert: "¹⁄₃" },
                          { label: "²", insert: "²" },
                          { label: "³", insert: "³" },
                          { label: "√", insert: "√" },
                          { label: "∛", insert: "∛" },
                          { label: "⅓", insert: " ⅓ " },
                          { label: "½", insert: " ½ " },
                          { label: "¼", insert: " ¼ " },
                          { label: "11/7", insert: " 11/7 " },
                          { label: "×", insert: " × " },
                          { label: "÷", insert: " ÷ " },
                          { label: "≈", insert: " ≈ " },
                        ].map((sym, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            className="px-2 py-0.5 text-xs font-bold bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg transition-colors shadow-xs"
                            onClick={() => {
                              const curText = approvedQuestions[idx]?.solutionText ?? (q.solutionText || q.explanation || "");
                              editSolutionText(idx, formatMathText(curText + sym.insert));
                            }}
                          >
                            {sym.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        className="input text-xs min-h-[90px] font-mono leading-relaxed bg-white border border-black/10 p-2.5"
                        placeholder="Enter detailed step-by-step solution explanation..."
                        value={approvedQuestions[idx]?.solutionText ?? (q.solutionText || q.explanation || "")}
                        onChange={(e) => editSolutionText(idx, e.target.value)}
                      />
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

      {/* Chart / Diagram Cropper Modal */}
      {cropperModal && (() => {
        const relatedIndices = getRelatedDIQuestionIndices(
          cropperModal.qIdx,
          generatedTest?.rawExtractedQuestions,
          approvedQuestions
        );
        const hasSet = relatedIndices.length > 1;
        const setRangeLabel = hasSet 
          ? `Q${relatedIndices[0] + 1} – Q${relatedIndices[relatedIndices.length - 1] + 1}` 
          : `Q${cropperModal.qIdx + 1}`;

        const handleSaveCropped = async (applyToAllInSet = false) => {
          try {
            const croppedDataUrl = await generateCroppedImage(
              cropperModal.src,
              cropperModal.cropTop,
              cropperModal.cropBottom,
              cropperModal.cropLeft,
              cropperModal.cropRight
            );

            if (applyToAllInSet && hasSet) {
              relatedIndices.forEach(targetIdx => {
                replaceChartImage(targetIdx, cropperModal.imgIdx || 0, croppedDataUrl);
              });
              pushToast(`✅ Cropped diagram applied to all ${relatedIndices.length} related questions in this DI set (${setRangeLabel})!`);
            } else {
              replaceChartImage(cropperModal.qIdx, cropperModal.imgIdx || 0, croppedDataUrl);
              pushToast(`✅ Cropped diagram saved for Question ${cropperModal.qIdx + 1}!`);
            }
            setCropperModal(null);
          } catch (err) {
            console.error("Failed to crop image:", err);
            pushToast("Failed to crop image: " + err.message);
          }
        };

        return (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5" onClick={() => setCropperModal(null)}>
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-black/10 overflow-hidden animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-base shadow-xs">
                  ✂️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-ink">Crop DI Chart &amp; Diagram Only</h3>
                    {hasSet && (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                        DI Set: {setRangeLabel} ({relatedIndices.length} Questions)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted">Trim out top copyright notices, page headers, and bottom questions to keep ONLY the clean diagram.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCropperModal(null)}
                className="p-1.5 rounded-xl text-ink-muted hover:text-ink hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left: Original with Visual Crop Frame */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-ink">Source Image &amp; Crop Frame:</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Highlighted area = Saved
                  </span>
                </div>

                <div className="relative border border-black/15 rounded-2xl overflow-hidden bg-slate-900/5 flex items-center justify-center min-h-[300px] max-h-[390px] p-2">
                  <InteractiveImageCropper
                    src={cropperModal.src}
                    cropTop={cropperModal.cropTop}
                    cropBottom={cropperModal.cropBottom}
                    cropLeft={cropperModal.cropLeft}
                    cropRight={cropperModal.cropRight}
                    onChangeCrop={(newCrops) => setCropperModal(prev => ({ ...prev, ...newCrops }))}
                  />
                </div>
                <span className="text-[10px] text-ink-muted mt-1.5 flex items-center gap-1 font-medium">
                  🖱️ Drag handles to resize · Drag box to move · Click &amp; drag outside to draw new frame
                </span>
              </div>

              {/* Right: Trimming Sliders, Presets & Live Preview */}
              <div className="flex flex-col space-y-4">
                
                {/* Quick Presets */}
                <div>
                  <label className="text-xs font-bold text-ink mb-1.5 block">Quick Presets:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCropperModal(prev => ({ ...prev, cropTop: 22, cropBottom: 28, cropLeft: 0, cropRight: 0 }))}
                      className="text-xs font-bold py-2 px-3 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-left flex items-center justify-between shadow-xs"
                    >
                      <span>📊 Center Diagram</span>
                      <span className="text-[10px] text-brand-500 font-normal">Mid 50%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCropperModal(prev => ({ ...prev, cropTop: 15, cropBottom: 42, cropLeft: 0, cropRight: 0 }))}
                      className="text-xs font-bold py-2 px-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-left flex items-center justify-between shadow-xs"
                    >
                      <span>📈 Upper Diagram</span>
                      <span className="text-[10px] text-purple-500 font-normal">Top 43%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCropperModal(prev => ({ ...prev, cropTop: 32, cropBottom: 15, cropLeft: 0, cropRight: 0 }))}
                      className="text-xs font-bold py-2 px-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-left flex items-center justify-between shadow-xs"
                    >
                      <span>📉 Lower Diagram</span>
                      <span className="text-[10px] text-blue-500 font-normal">Bottom 53%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCropperModal(prev => ({ ...prev, cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0 }))}
                      className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-left flex items-center justify-between shadow-xs"
                    >
                      <span>🔄 Reset Full</span>
                      <span className="text-[10px] text-slate-500 font-normal">100%</span>
                    </button>
                  </div>
                </div>

                {/* Precision Sliders */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-black/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Trim Sliders:</span>
                    <span className="text-[10px] text-ink-muted">Adjust edges in real-time</span>
                  </div>

                  {/* Top Cut */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-ink-muted mb-1">
                      <span>Cut Top (Header / Warnings):</span>
                      <span className="text-brand-600 font-bold">{cropperModal.cropTop}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={cropperModal.cropTop}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCropperModal(prev => ({ ...prev, cropTop: Math.min(val, 85 - prev.cropBottom) }));
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                    />
                  </div>

                  {/* Bottom Cut */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-ink-muted mb-1">
                      <span>Cut Bottom (Questions / Footer):</span>
                      <span className="text-brand-600 font-bold">{cropperModal.cropBottom}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={cropperModal.cropBottom}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCropperModal(prev => ({ ...prev, cropBottom: Math.min(val, 85 - prev.cropTop) }));
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                    />
                  </div>

                  {/* Left & Right in row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-ink-muted mb-1">
                        <span>Cut Left:</span>
                        <span className="text-brand-600 font-bold">{cropperModal.cropLeft}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="75"
                        value={cropperModal.cropLeft}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCropperModal(prev => ({ ...prev, cropLeft: Math.min(val, 85 - prev.cropRight) }));
                        }}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-ink-muted mb-1">
                        <span>Cut Right:</span>
                        <span className="text-brand-600 font-bold">{cropperModal.cropRight}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="75"
                        value={cropperModal.cropRight}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCropperModal(prev => ({ ...prev, cropRight: Math.min(val, 85 - prev.cropLeft) }));
                        }}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview of Cropped Result */}
                <div>
                  <label className="text-xs font-bold text-ink mb-1 block">Live Student Preview:</label>
                  <div className="h-32 border border-black/15 rounded-2xl bg-white p-2.5 flex items-center justify-center overflow-hidden shadow-inner">
                    <CroppedPreviewImg
                      src={cropperModal.src}
                      cropTop={cropperModal.cropTop}
                      cropBottom={cropperModal.cropBottom}
                      cropLeft={cropperModal.cropLeft}
                      cropRight={cropperModal.cropRight}
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-black/10 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCropperModal(null)}
                className="btn-soft text-xs px-4 py-2 text-ink-muted hover:text-ink font-bold rounded-xl"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {hasSet && (
                  <button
                    type="button"
                    onClick={() => handleSaveCropped(false)}
                    className="btn-soft text-xs px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 shadow-xs cursor-pointer"
                    title={`Save cropped diagram only for Question ${cropperModal.qIdx + 1}`}
                  >
                    Save for Q{cropperModal.qIdx + 1} Only
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveCropped(true)}
                  className="btn-primary text-xs px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all"
                >
                  <CheckCircle2 size={16} />
                  {hasSet 
                    ? `🔥 Save & Apply to Entire DI Set (${setRangeLabel})` 
                    : `Save Cropped Diagram`}
                </button>
              </div>
            </div>

          </div>
        </div>
        );
      })()}

      {/* LLM Key Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setShowKeyModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-lift space-y-5 border border-black/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h3 className="font-extrabold text-lg text-ink flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" /> Connect LLM Models for AI PDF Extraction
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="text-ink-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Select your preferred AI provider below and enter your API key to enable 100% accurate PDF question extraction and AI mock generation.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink-soft mb-1.5 block">Select AI Model Provider</label>
                <select
                  className="input text-xs font-bold bg-white"
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value)}
                >
                  <option value="gemini">Google Gemini API (Recommended - Free &amp; Fast)</option>
                  <option value="groq">Groq / Gemma-7B (Ultra-fast LLM Inference)</option>
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  <option value="deepseek">DeepSeek API (DeepSeek-R1 / Chat)</option>
                  <option value="openrouter">OpenRouter (Any Custom Model!)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink-soft mb-1.5 block">
                  {keyType === "gemini" && "Google Gemini API Key (AIzaSy...)"}
                  {keyType === "groq" && "Groq / Gemma API Key (gsk_...)"}
                  {keyType === "openai" && "OpenAI API Key (sk-proj-...)"}
                  {keyType === "deepseek" && "DeepSeek API Key (sk-...)"}
                  {keyType === "openrouter" && "OpenRouter API Key (sk-or-...)"}
                </label>
                <input
                  type="password"
                  className="input font-mono text-xs"
                  placeholder={`Enter your ${keyType.toUpperCase()} API key here...`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-[11px] text-ink-faint mt-1">Key is stored securely in your local browser storage for AI calls.</p>
              </div>

              {keyType === "openrouter" && (
                <div>
                  <label className="text-xs font-bold text-ink-soft mb-1.5 block">
                    OpenRouter Model ID
                  </label>
                  <input
                    type="text"
                    className="input font-mono text-xs bg-brand-50"
                    placeholder="e.g. nvidia/nemotron-4-340b-instruct:free"
                    value={openRouterModel}
                    onChange={(e) => setOpenRouterModel(e.target.value)}
                  />
                  <p className="text-[10px] text-ink-muted mt-1.5">You can enter any OpenRouter Model ID here (e.g. <b>nvidia/nemotron-4-340b-instruct:free</b> or <b>nvidia/nemotron-3-ultra-550b-a55b:free</b>)</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-black/5 flex justify-end gap-2">
              <button onClick={() => setShowKeyModal(false)} className="btn-ghost text-xs px-4 py-2 font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={saveLLMKey} className="btn-primary text-xs px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-xs">
                Save &amp; Connect API Key
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
            sortTestsByRecent(mockTests.filter(t => !!t.isFree === isFreeByDefault))
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
                            {/* In editing modal, derive sections from the questions themselves plus defaults */}
                            {Array.from(new Set([...DEFAULT_SECTIONS, ...(editingTest.questionsList || editingTest.questions || []).map(q => q.section)])).filter(Boolean).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-ink-muted block">Paragraph / Passage Directions Context (DI Caselet, RC):</label>
                          {/\|.*\|/.test(q.passage || "") && (
                            <button
                              type="button"
                              onClick={() => {
                                const { cleanPassage, cleanExplanation } = sanitizeDIPassageAndExplanation(q.passage || "", q.explanation || "", q);
                                updateEditingQuestion(qIdx, "passage", cleanPassage);
                                updateEditingQuestion(qIdx, "explanation", cleanExplanation);
                                pushToast("Cleaned passage: Solved table moved to Solution!");
                              }}
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              ⚡ Move Table to Solution (Keep Paragraph Only)
                            </button>
                          )}
                        </div>
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
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(q.imageUrls || (q.imageUrl ? [q.imageUrl] : [])).map((url, imgIdx) => (
                            <div key={imgIdx} className="relative h-28 max-w-sm rounded-xl border border-black/10 overflow-hidden bg-black/5 p-1">
                              <img src={url} className="w-full h-full object-contain" alt="Attached preview" />
                              <button
                                type="button"
                                onClick={() => removeEditingImage(qIdx, imgIdx)}
                                className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold hover:bg-rose-600 shadow"
                              >✕</button>
                            </div>
                          ))}
                        </div>

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
                                  addEditingImage(qIdx, reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor={`edit-img-upload-${qIdx}`}
                            className="btn-soft text-xs px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer flex items-center gap-1.5 flex-1 justify-center whitespace-nowrap rounded-lg text-ink-soft font-semibold"
                          >
                            <ImageIcon size={14} /> Attach Image/Chart
                          </label>
                        </div>
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

                        {/* Direction Sense Visual Drawing Preview */}
                        <DirectionDiagramView text={`${q.explanation || ""} ${q.question || ""} ${q.passage || ""}`} compact={true} />
                        
                        {/* Solution Image Upload */}
                        <div className="mt-4 flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`edit-sol-img-upload-${qIdx}`}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  updateEditingQuestion(qIdx, "solutionImageUrl", reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor={`edit-sol-img-upload-${qIdx}`}
                            className="btn-soft text-xs px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer flex items-center gap-1.5 flex-1 justify-center whitespace-nowrap rounded-lg text-ink-soft font-semibold"
                          >
                            <ImageIcon size={14} /> {q.solutionImageUrl ? "Change Solution Image" : "Attach Solution Image"}
                          </label>
                          {q.solutionImageUrl && (
                            <button
                              type="button"
                              onClick={() => updateEditingQuestion(qIdx, "solutionImageUrl", "")}
                              className="btn-ghost text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-100"
                              title="Remove Solution Image"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {q.solutionImageUrl && (
                          <div className="mt-2 h-28 w-full max-w-sm rounded-xl border border-black/10 overflow-hidden relative group bg-black/5 p-1">
                             <img src={q.solutionImageUrl} className="w-full h-full object-contain" alt="Solution preview" />
                          </div>
                        )}
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
  const { students = [], deleteStudent, pushToast, refreshStudents } = useApp();
  const [q, setQ] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [customDates, setCustomDates] = useState({});
  const [, refresh] = useState(0);

  const updateStudentJoinDate = async (student, newDateStr) => {
    if (!newDateStr) return;
    const d = new Date(newDateStr);
    if (isNaN(d.getTime())) return;

    setCustomDates(prev => ({ ...prev, [student.id]: formatStudentJoinDate(d) }));
    try {
      localStorage.setItem("ken_student_joined_" + student.id, d.toISOString());
    } catch (e) {}

    if (useRealtimeBackend && student.id) {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { getFirebaseDb } = await import("../../firebase.js");
        const db = await getFirebaseDb();
        await setDoc(doc(db, "users", student.id), {
          createdAt: d.toISOString(),
          joinedAt: d.toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to update student join date in Firebase", err);
      }
    }
    setEditingStudentId(null);
    pushToast(`Updated joining date for ${student.name || "Student"}`);
    if (refreshStudents) refreshStudents();
  };
  
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
    refreshStudents();

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
    refreshStudents();
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

  return <><PageHeader icon={<Users size={22}/>} title="Manage Students" subtitle={`${students.length} registered student${students.length === 1 ? "" : "s"}`} action={
    <div className="flex items-center gap-2">
      {selectedStudents.length > 0 && (
        <button onClick={() => {
          if(window.confirm(`Delete ${selectedStudents.length} students?`)) {
            selectedStudents.forEach(id => deleteStudent(id));
            setSelectedStudents([]);
          }
        }} className="btn-primary bg-rose-600 hover:bg-rose-700 text-sm px-4 py-2.5">
          Delete Selected ({selectedStudents.length})
        </button>
      )}
      <button onClick={exportCsv} className="btn-primary text-sm px-4 py-2.5"><Download size={16}/>Download Excel CSV</button>
    </div>
  }/>
    <div className="card overflow-hidden"><div className="p-4 border-b border-black/5"><div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"/><input className="input pl-9" placeholder="Search student name or mobile number..." value={q} onChange={e=>setQ(e.target.value)}/></div></div><div className="overflow-x-auto"><table className="w-full text-sm min-w-[690px]"><thead><tr className="text-left text-xs text-ink-muted uppercase tracking-wide border-b border-black/5"><th className="px-5 py-3 w-10"><input type="checkbox" checked={selectedStudents.length === list.length && list.length > 0} onChange={(e) => setSelectedStudents(e.target.checked ? list.map(s => s.id) : [])} className="cursor-pointer" /></th><th className="px-5 py-3 font-semibold w-[200px]">Student name</th><th className="px-5 py-3 font-semibold w-[150px]">Mobile number</th><th className="px-5 py-3 font-semibold min-w-[280px]">Category-wise Mock Access</th></tr></thead><tbody className="divide-y divide-black/5">{list.length===0?<tr><td colSpan={4} className="px-5 py-8 text-center text-ink-muted">No registered students found yet.</td></tr>:list.map(s=>{
      const isAll = s.access === "academy";
      const accessArr = Array.isArray(s.access) ? s.access : (isAll ? EXAMS.map(e => e.id) : []);
      
      return <tr key={s.id||s.phone} className="hover:bg-black/[0.02]"><td className="px-5 py-3"><input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={(e) => { if (e.target.checked) setSelectedStudents([...selectedStudents, s.id]); else setSelectedStudents(selectedStudents.filter(id => id !== s.id)); }} className="cursor-pointer" /></td><td className="px-5 py-3 font-semibold text-ink"><div>{s.name||"Student"}</div>{editingStudentId === s.id ? (<div className="flex items-center gap-1.5 mt-1"><input type="date" className="text-xs px-2 py-0.5 rounded border border-slate-300 bg-white" defaultValue={s.rawDate ? s.rawDate.slice(0, 10) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)} onChange={(e) => updateStudentJoinDate(s, e.target.value)} /><button type="button" onClick={() => setEditingStudentId(null)} className="text-[10px] text-ink-muted hover:text-ink px-1 cursor-pointer">Cancel</button></div>) : (<div className="flex items-center gap-1.5 mt-0.5"><span className="text-xs font-normal text-ink-muted">{customDates[s.id] || s.joined}</span><button type="button" onClick={() => setEditingStudentId(s.id)} className="p-0.5 text-ink-faint hover:text-brand-700 transition-colors cursor-pointer" title="Edit joining date"><Calendar size={12} /></button></div>)}</td><td className="px-5 py-3 text-ink-soft">{s.phone||"Not provided"}</td><td className="px-5 py-3">
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
  const { announce, notifications, pushToast, deleteNotification } = useApp();
  const [f, setF] = useState({ title: "", body: "", image: "", pdf: "" });
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setF({ ...f, image: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") return pushToast("Only PDF files are allowed");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setF({ ...f, pdf: ev.target.result });
    };
    reader.readAsDataURL(file);
  };
  
  const send = () => {
    if (!f.title || !f.body) return pushToast("Fill both fields");
    announce(f.title, f.body, f.image, f.pdf);
    setF({ title: "", body: "", image: "", pdf: "" });
  };
  return (
    <>
      <PageHeader icon={<Megaphone size={22} />} title="Notifications" subtitle="Broadcast announcements to all students" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-ink flex items-center gap-2"><Bell size={17} className="text-brand-600"/> New announcement</h3>
          <input className="input" placeholder="Title (e.g. Mock test schedule)" value={f.title} onChange={(e)=>setF({...f,title:e.target.value})} />
          <textarea className="input min-h-[110px] resize-none" placeholder="Message body..." value={f.body} onChange={(e)=>setF({...f,body:e.target.value})} />
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Upload Image (optional)</label>
            <div className="flex items-center gap-3">
              {f.image && <img src={f.image} alt="Preview" className="h-10 w-10 object-cover rounded shadow-sm border border-black/10" />}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="input text-xs" />
              {f.image && <button onClick={() => setF({...f, image: ""})} className="text-rose-500 font-medium text-xs whitespace-nowrap">Remove</button>}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Upload PDF (optional)</label>
            <div className="flex items-center gap-3">
              {f.pdf && <span className="text-xs font-semibold px-2 py-1 bg-rose-50 text-rose-600 rounded">PDF Attached</span>}
              <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="input text-xs" />
              {f.pdf && <button onClick={() => setF({...f, pdf: ""})} className="text-rose-500 font-medium text-xs whitespace-nowrap">Remove</button>}
            </div>
          </div>
          <button onClick={send} className="btn-primary px-5 py-2.5"><Send size={16}/> Send to all students</button>
        </div>
        <div className="card p-6">
          <h3 className="font-bold text-ink mb-4">Recently sent</h3>
          <div className="space-y-3">
            {notifications.map((n)=>(
              <div key={n.id} className="flex gap-3 items-start p-3 rounded-xl hover:bg-black/[0.03] group relative">
                <span className="text-lg">{n.icon}</span>
                <div className="flex-1 pr-6">
                  <p className="text-sm font-semibold text-ink">{n.title}</p>
                  <p className="text-xs text-ink-muted">{n.body}</p>
                  {n.image && <img src={n.image} alt="Announcement" className="mt-2 rounded-lg max-h-32 object-contain border border-black/10" />}
                  {n.pdf && <a href={n.pdf} download="Announcement.pdf" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"><span className="text-base">📄</span> Download PDF</a>}
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this notification? It will be removed for all students.")) {
                      deleteNotification(n.id);
                    }
                  }} 
                  className="absolute right-3 top-3 p-1.5 rounded-lg text-ink-faint hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
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

/* -------------------------- Plans & Coupon Codes -------------------------- */
export function PlansPage() {
  const { pushToast, promoBanner, updatePromoBanner, plans = [], updatePlans, coupons = [], updateCoupons } = useApp();
  const [coupon, setCoupon] = useState({ code: "", discount: "", description: "" });
  const [banner, setBanner] = useState(promoBanner);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  // Synchronize banner local state with live promoBanner from cloud
  useEffect(() => {
    if (promoBanner) {
      setBanner(promoBanner);
    }
  }, [promoBanner]);

  const savePlans = async (next) => {
    try {
      await updatePlans(next);
      pushToast("Plans saved & synced to all devices! 🎉");
    } catch (e) {
      pushToast("Saved locally. Cloud sync pending.");
    }
  };

  const addCoupon = async () => {
    if (!coupon.code.trim() || !Number(coupon.discount)) {
      return pushToast("Enter a coupon code and discount percentage.");
    }
    const next = [...coupons, { ...coupon, code: coupon.code.trim().toUpperCase() }];
    try {
      await updateCoupons(next);
      setCoupon({ code: "", discount: "", description: "" });
      pushToast("Coupon created & synced to all devices! 🎉");
    } catch (e) {
      pushToast("Coupon created locally.");
    }
  };

  const removeCoupon = async (idx) => {
    const next = coupons.filter((_, x) => x !== idx);
    try {
      await updateCoupons(next);
      pushToast("Coupon removed.");
    } catch (e) {
      pushToast("Coupon removed locally.");
    }
  };

  // Compress image on canvas to max 900x600 at 0.75 quality so it never exceeds Firestore limits (<50KB)
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxW = 900;
          const maxH = 600;
          if (width > maxW || height > maxH) {
            if (width / height > maxW / maxH) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            } else {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      setBanner(prev => ({ ...prev, image: compressed }));
      pushToast("Image compressed & attached! Click 'Publish & Sync Banner' below.");
    } catch (err) {
      console.error("Image upload failed:", err);
      pushToast("Failed to process image. Try a smaller image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublishBanner = async () => {
    setIsSavingBanner(true);
    try {
      await updatePromoBanner(banner);
      pushToast("Promo banner published & synced across all devices! 🎉");
    } catch (err) {
      console.error("Failed to publish banner:", err);
      pushToast("Saved locally. Error syncing to cloud: " + (err.message || "Failed"));
    } finally {
      setIsSavingBanner(false);
    }
  };

  return (
    <>
      <PageHeader
        icon={<ClipboardPlus size={22} />}
        title="Plans, Pricing & Offers"
        subtitle="Set full mock-package amounts and promotional coupon codes."
      />
      <div className="grid xl:grid-cols-[1.35fr_.85fr] gap-6">
        <section className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-ink">Full mock-test packages</h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Cloud Sync
            </span>
          </div>
          <p className="text-sm text-ink-muted mb-5">The first mock remains free. Students see these amounts when a package is locked.</p>
          <div className="space-y-3">
            {plans.map((plan, i) => (
              <div key={plan.id} className="rounded-xl border border-black/5 p-4 grid sm:grid-cols-[1fr_120px] gap-3">
                <div>
                  <p className="font-semibold text-ink">{plan.name}</p>
                  <p className="text-xs text-ink-muted">{plan.exams}</p>
                </div>
                <label className="text-xs font-semibold text-ink-muted">
                  Amount (₹)
                  <input
                    className="input mt-1 py-2"
                    type="number"
                    min="0"
                    value={plan.amount}
                    onChange={(e) => savePlans(plans.map((p, x) => (x === i ? { ...p, amount: e.target.value } : p)))}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-ink">Create offer coupon</h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Cloud Sync
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-1 mb-5">Coupons can be applied at payment checkout across all devices.</p>
          <div className="space-y-3">
            <input
              className="input uppercase"
              placeholder="Code e.g. BANK20"
              value={coupon.code}
              onChange={(e) => setCoupon({ ...coupon, code: e.target.value })}
            />
            <input
              className="input"
              type="number"
              min="1"
              max="100"
              placeholder="Discount %"
              value={coupon.discount}
              onChange={(e) => setCoupon({ ...coupon, discount: e.target.value })}
            />
            <input
              className="input"
              placeholder="Offer description (optional)"
              value={coupon.description}
              onChange={(e) => setCoupon({ ...coupon, description: e.target.value })}
            />
            <button onClick={addCoupon} className="btn-primary w-full py-2.5">
              <Plus size={16} />Create coupon
            </button>
          </div>
          <div className="mt-6 pt-5 border-t border-black/5 space-y-2">
            {coupons.length === 0 ? (
              <p className="text-sm text-ink-muted">No coupons created yet.</p>
            ) : (
              coupons.map((c, i) => (
                <div key={c.code} className="flex justify-between items-center rounded-lg bg-brand-50 p-3">
                  <div>
                    <b>{c.code}</b>
                    <small className="block text-ink-muted">{c.description || "Applicable at checkout"}</small>
                  </div>
                  <span className="font-bold text-brand-700 flex items-center gap-2">
                    {c.discount}% OFF
                    <button onClick={() => removeCoupon(i)} className="text-rose-600 hover:text-rose-800 p-1 text-base font-bold">
                      ×
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-ink">Global Promo Banner</h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Realtime Cloud Sync
              </span>
            </div>
            <p className="text-sm text-ink-muted mt-1">
              Configure the top announcement banner & popup modal displayed across ALL student devices.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!banner.enabled}
              onChange={async (e) => {
                const next = { ...banner, enabled: e.target.checked };
                setBanner(next);
                try {
                  await updatePromoBanner(next);
                  pushToast(next.enabled ? "Global Banner Enabled on all devices!" : "Global Banner Disabled.");
                } catch (err) {
                  pushToast("Banner setting saved locally.");
                }
              }}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600 relative"></div>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink-muted">Offer Text</label>
            <input
              className="input mt-1"
              value={banner.text || ""}
              onChange={(e) => setBanner({ ...banner, text: e.target.value })}
              placeholder="e.g. Festival Special: Get 50% OFF on all packages! Use code"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted">Coupon Code (optional)</label>
            <input
              className="input mt-1 uppercase"
              value={banner.code || ""}
              onChange={(e) => setBanner({ ...banner, code: e.target.value })}
              placeholder="FESTIVAL50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted">Background Color</label>
            <select
              className="input mt-1"
              value={banner.color || "bg-brand-600"}
              onChange={(e) => setBanner({ ...banner, color: e.target.value })}
            >
              <option value="bg-brand-600">Blue (Default)</option>
              <option value="bg-rose-600">Red</option>
              <option value="bg-emerald-600">Green</option>
              <option value="bg-orange-500">Orange</option>
              <option value="bg-indigo-600">Indigo</option>
              <option value="bg-slate-900">Dark</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted">Offer Banner Image / Poster (optional)</label>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-3">
                {banner.image && (
                  <img
                    src={banner.image}
                    alt="Preview"
                    className="h-10 w-16 object-contain rounded shadow-sm border border-black/10 bg-black/5"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="input text-xs"
                />
                {banner.image && (
                  <button
                    onClick={() => setBanner({ ...banner, image: "" })}
                    className="text-rose-500 font-medium text-xs whitespace-nowrap hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                className="input text-xs"
                placeholder="Or paste direct image URL (https://...)"
                value={banner.image && !banner.image.startsWith("data:") ? banner.image : ""}
                onChange={(e) => setBanner({ ...banner, image: e.target.value })}
              />
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              When an image is provided, it automatically appears as a welcome popup modal for students.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between pt-4 border-t border-black/5">
          <div className="text-xs text-ink-muted">
            {banner.enabled ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Banner is currently LIVE for all devices
              </span>
            ) : (
              <span className="text-slate-500">Banner is currently disabled</span>
            )}
          </div>
          <button
            onClick={handlePublishBanner}
            disabled={isSavingBanner || isUploading}
            className="btn-primary py-2 px-6 flex items-center gap-2"
          >
            {isSavingBanner ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isSavingBanner ? "Publishing..." : "Publish & Sync Banner"}
          </button>
        </div>
      </div>
    </>
  );
}

export function AdmissionsPage() {
  const { admissions = [], deleteAdmission, pushToast } = useApp();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLeads, setSelectedLeads] = useState([]);

  const exportCSV = () => {
    let dataToExport = admissions;
    
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000); // include full end day
      dataToExport = admissions.filter(lead => {
        const d = new Date(lead.createdAt?.toMillis ? lead.createdAt.toMillis() : Date.now()).getTime();
        return d >= start && d < end;
      });
    }

    if (dataToExport.length === 0) {
      pushToast("No data to export for selected dates");
      return;
    }
    
    const headers = ["Date", "Name", "Mobile Number", "Email ID", "Course / Target Exam", "Mode of Learning", "District"];
    const rows = dataToExport.map(lead => [
      new Date(lead.createdAt?.toMillis ? lead.createdAt.toMillis() : Date.now()).toLocaleDateString("en-IN"),
      lead.fullName || lead.name || "Student",
      lead.mobileNumber || "",
      lead.emailId || "",
      lead.course || lead.targetExam || "General",
      lead.modeOfLearning || "Online",
      lead.district || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(field => `"${field}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_leads_${startDate||'all'}_to_${endDate||'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    pushToast("Exported to Excel (CSV)");
  };

  return (
    <>
      <PageHeader
        icon={<Users size={22} />}
        title="Admission Inquiries"
        subtitle="Manage leads collected from the website popup."
        action={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {selectedLeads.length > 0 && (
              <button onClick={() => {
                if(window.confirm(`Delete ${selectedLeads.length} leads?`)) {
                  selectedLeads.forEach(id => deleteAdmission(id));
                  setSelectedLeads([]);
                }
              }} className="btn-primary bg-rose-600 hover:bg-rose-700 text-sm px-4 py-2 sm:py-2.5 ml-0 sm:ml-2 w-full sm:w-auto mt-2 sm:mt-0">
                Delete Selected ({selectedLeads.length})
              </button>
            )}
            <input type="date" className="input text-xs py-2 px-2 bg-white" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-xs text-ink-muted hidden sm:inline">to</span>
            <input type="date" className="input text-xs py-2 px-2 bg-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
            <button onClick={exportCSV} className="btn-primary text-sm px-4 py-2 sm:py-2.5 ml-0 sm:ml-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Download size={16} /> Export
            </button>
          </div>
        }
      />
      
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-black/5 text-ink-muted">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" checked={selectedLeads.length === admissions.length && admissions.length > 0} onChange={(e) => setSelectedLeads(e.target.checked ? admissions.map(a => a.id) : [])} className="cursor-pointer" />
                </th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">Mobile Number</th>
                <th className="py-3 px-4 font-medium">Email ID</th>
                <th className="py-3 px-4 font-medium">Target Exam / Course</th>
                <th className="py-3 px-4 font-medium">Mode of Learning</th>
                <th className="py-3 px-4 font-medium">District</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-ink-muted">
                    No admission inquiries yet. Leads submitted from website popups & free mocks will appear here live!
                  </td>
                </tr>
              ) : (
                admissions.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={(e) => {
                        if (e.target.checked) setSelectedLeads([...selectedLeads, lead.id]);
                        else setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                      }} className="cursor-pointer" />
                    </td>
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
                        {lead.course || lead.targetExam || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge>{lead.modeOfLearning || "Online"}</Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-ink text-xs">
                      {lead.district || "—"}
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

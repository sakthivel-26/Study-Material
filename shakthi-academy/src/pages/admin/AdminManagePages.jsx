import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardPlus, Users, Megaphone, TrendingUp, BookOpen, Plus, Search,
  Trash2, Send, Bell, Sparkles, Loader2, CheckCircle2, Eye, HelpCircle, X,
  FileUp, FileText, Upload
} from "lucide-react";
import PageHeader from "../../components/PageHeader.jsx";
import { useApp } from "../../store.jsx";
import { CATEGORIES, COURSE_PROGRESS } from "../../data.js";
import { Badge, ProgressBar } from "../../components/ui.jsx";
import { verifyQuestionsBackground } from "../../utils/aiTestGenerator.js";

/* ---------------------------- Create Mock Test ---------------------------- */
export function CreateMockTestPage() {
  const { addMockTest, updateMockTest, pushToast } = useApp();
  const [mode, setMode] = useState("ai"); // "ai" | "manual" | "pdf"
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfStatus, setPdfStatus] = useState(""); // "extracting" | "analyzing" | "done" | ""
  const [pdfPageInfo, setPdfPageInfo] = useState("");
  const pdfInputRef = useRef(null);
  const [f, setF] = useState({ title: "", category: CATEGORIES[0].name, questions: 10, time: "30 min" });
  const [generating, setGenerating] = useState(false);
  const [generatedTest, setGeneratedTest] = useState(null);
  const [approvedQuestions, setApprovedQuestions] = useState({});
  const [extractionProgress, setExtractionProgress] = useState(null);
  const [verificationProgress, setVerificationProgress] = useState(null);
  const [extractionStartTime, setExtractionStartTime] = useState(null);
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

  const [manualQuestions, setManualQuestions] = useState([
    {
      section: "Quantitative Aptitude",
      question: "",
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

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const color = CATEGORIES.find((c) => c.name === f.category)?.color || "#6D28D9";

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

    // Apply approved fixes to the already created test
    const finalQuestions = generatedTest.questionsList ? [...generatedTest.questionsList] : [];
    
    generatedTest.rawExtractedQuestions.forEach((q, idx) => {
      const approvalStatus = approvedQuestions[idx];
      if (approvalStatus && approvalStatus.isApproved) {
        const finalLetter = approvalStatus.editedAnswer || q.ai_verified_answer || q.source_answer || "A";
        const ansIndex = Math.max(0, finalLetter.toUpperCase().charCodeAt(0) - 65);
        if (finalQuestions[idx]) {
          finalQuestions[idx].correctAnswerIndex = ansIndex;
          finalQuestions[idx].explanation = q.verification_explanation || "Verified by teacher.";
        }
      }
    });

    const testToPublish = { ...generatedTest, questionsList: finalQuestions };
    await updateMockTest(generatedTest.id, { questionsList: finalQuestions });
    
    setGeneratedTest(null);
    setPdfStatus("");
    setApprovedQuestions({});
  };

  const publish = async () => {
    if (!f.title.trim()) return pushToast("Enter a test title");

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
      })).filter(q => q.question !== `Question ${validQuestions.indexOf(q) + 1}`);

      if (validQuestions.length === 0) return pushToast("Add at least one valid question");

      testToPublish = {
        id: `mock_manual_${Date.now()}`,
        title: f.title.trim(),
        category: f.category,
        color,
        questions: validQuestions.length,
        time: f.time,
        durationMinutes: parseInt(f.time) || 30,
        taken: 0,
        questionsList: validQuestions,
        createdAt: new Date().toISOString(),
      };
    }

    await addMockTest(testToPublish);
    pushToast("Mock test created & published to all students! 📝");
    setGeneratedTest(null);
    setF({ title: "", category: CATEGORIES[0].name, questions: 10, time: "30 min" });
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
      setPdfPageInfo("Uploading PDF to AI processing server...");

      // Send to FastAPI Backend
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/extract-questions", {
        method: "POST",
        body: formData
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || "Server failed to process the PDF");
      }

      const extractedQuestions = responseData.questions || [];
      if (extractedQuestions.length === 0) {
        throw new Error("NO_QUESTIONS_FOUND: AI failed to extract any questions.");
      }

      setPdfPageInfo(`Successfully extracted ${extractedQuestions.length} questions`);

      const result = {
        title: f.title.trim() || `${f.category} PYQ - ${file.name.replace(".pdf", "")}`,
        category: f.category,
        timeLimit: f.time,
        rawExtractedQuestions: extractedQuestions,
      };

      result.color = color;

      // PHASE 2: Save Immediately
      const finalQuestions = [];
      result.rawExtractedQuestions.forEach((q, idx) => {
          const finalLetter = q.source_answer || "A";
          const ansIndex = Math.max(0, finalLetter.toUpperCase().charCodeAt(0) - 65);
          const optKeys = Object.keys(q.options || {});
          const optionsArray = optKeys.length > 0 
            ? optKeys.map(k => q.options[k]) 
            : ["Option A", "Option B", "Option C", "Option D"];

          finalQuestions.push({
            id: `pdf_q_${Date.now()}_${idx}`,
            section: q.subject || "General",
            question: q.question_text || `Question ${idx + 1}`,
            options: optionsArray,
            correctAnswerIndex: ansIndex < optionsArray.length ? ansIndex : 0,
            explanation: q.explanation || "Verification pending.",
          });
      });
      const testToPublish = { ...result, questionsList: finalQuestions };
      await addMockTest(testToPublish); // Publish to students immediately
      
      setGeneratedTest(testToPublish);
      setPdfStatus("done");
      pushToast(`✅ Mock test extracted successfully! Background verification started.`);
      
      // PHASE 3: Background Verification
      verifyQuestionsBackground(result.rawExtractedQuestions, (done, total, verifiedQs) => {
        setVerificationProgress(`${done}/${total} verified`);
        setGeneratedTest(prev => prev ? ({ ...prev, rawExtractedQuestions: [...verifiedQs] }) : prev);
      }).then(() => pushToast("Background verification complete!"));
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

  return (
    <>
      <PageHeader icon={<ClipboardPlus size={22} />} title="Create Mock Test" subtitle="Design a test manually or generate automatically using AI (Past 5-Yr PYQs)" />

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
            <FileUp size={16} className="text-emerald-600" /> 📄 Upload PYQ Paper (PDF)
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === "manual" ? "bg-white shadow-card text-brand-700" : "text-ink-muted hover:text-ink-soft"}`}
          >
            <Plus size={16} /> Manual Test Setup
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
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
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Questions</label>
              <select className="input" value={f.questions} onChange={(e) => set("questions", e.target.value)}>
                {[5, 10, 15, 20, 30, 50].map((q) => <option key={q} value={q}>{q} Questions</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Duration</label>
              <select className="input" value={f.time} onChange={(e) => set("time", e.target.value)}>
                {["15 min", "25 min", "30 min", "45 min", "60 min", "90 min"].map((t) => <option key={t}>{t}</option>)}
              </select>
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
                      <p className="text-xs text-ink-muted mt-1">or click to browse · Supports IBPS, SBI, UPSC, TNPSC, SSC question papers</p>
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
              <button onClick={publish} className="btn-primary px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold"><Plus size={16} /> Save & Publish Test</button>
            ) : null}

            {generatedTest && mode === "ai" && (
              <button onClick={publish} className="btn-primary px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white">
                <CheckCircle2 size={16} /> Publish Test
              </button>
            )}
          </div>
        </div>

        {/* Right Preview Card */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-ink flex items-center gap-2">
            <Eye size={18} className="text-brand-600" /> {mode === "manual" ? "Manual Test Preview" : mode === "pdf" ? "📄 Extracted Questions Preview" : "AI Question Bank Preview"}
          </h3>

          {(mode === "pdf" && generatedTest) ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="font-bold text-emerald-900 text-sm">{generatedTest.title}</p>
                <p className="text-xs text-emerald-700 mt-1">
                  {generatedTest.questions} Questions extracted from PDF · {generatedTest.time} · {generatedTest.category}
                </p>
                {pdfFile && <p className="text-[11px] text-emerald-600 mt-1 font-medium">📎 Source: {pdfFile.name}</p>}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink">Teacher Review Required</p>
                <div className="flex items-center gap-2">
                  {verificationProgress && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">Verifying: {verificationProgress}</span>}
                  <button type="button" onClick={approveAllVerified} className="btn-soft px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                    <CheckCircle2 size={14} /> Approve All VERIFIED
                  </button>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1">
                {generatedTest.rawExtractedQuestions?.map((q, idx) => {
                  const isAppr = approvedQuestions[idx]?.isApproved;
                  const finalAnswer = approvedQuestions[idx]?.editedAnswer || q.ai_verified_answer || q.source_answer || "A";

                  return (
                    <div key={idx} className={`p-4 rounded-xl border-2 transition-colors ${isAppr ? 'border-emerald-400 bg-emerald-50/30' : q.answer_status === 'VERIFIED' ? 'border-black/5 bg-black/[0.02]' : q.answer_status === 'MISMATCH' ? 'border-rose-300 bg-rose-50/50' : 'border-amber-300 bg-amber-50/50'}`}>
                      
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-black/10 text-ink-soft text-[10px] font-bold">Q{idx + 1}</span>
                          <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 text-[10px] font-bold">{q.subject} / {q.topic}</span>
                          
                          {q.answer_status === "VERIFIED" && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">VERIFIED</span>}
                          {q.answer_status === "MISMATCH" && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">MISMATCH</span>}
                          {q.answer_status === "NEEDS_REVIEW" && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">NEEDS REVIEW</span>}
                          {q.answer_status === "NO_SOURCE_ANSWER" && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">NO ANSWER KEY</span>}
                        </div>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input type="checkbox" checked={!!isAppr} onChange={(e) => toggleApproveQuestion(idx, e.target.checked)} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-black/20" />
                          <span className={`text-[11px] font-bold ${isAppr ? 'text-emerald-600' : 'text-ink-muted'}`}>Approve</span>
                        </label>
                      </div>

                      <p className="font-semibold text-ink text-xs mb-2 leading-relaxed">{q.question_text}</p>
                      
                      <div className="grid sm:grid-cols-2 gap-1.5 text-[11px] text-ink-muted mb-3">
                        {Object.entries(q.options || {}).map(([key, opt]) => (
                          <span key={key} className={`px-2 py-1 rounded ${key === finalAnswer ? "bg-emerald-100 text-emerald-800 font-bold" : "bg-black/5"}`}>
                            {key}: {opt} {key === finalAnswer ? "✓" : ""}
                          </span>
                        ))}
                      </div>

                      {(q.answer_status === "MISMATCH" || q.answer_status === "NEEDS_REVIEW") && (
                        <div className="mt-3 p-3 rounded-lg bg-white border border-rose-100 shadow-sm space-y-2">
                          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{q.review_reason}</p>
                          <div className="flex gap-4 text-[11px]">
                            <p><strong>PDF Key:</strong> <span className="text-rose-600">{q.source_answer || "None"}</span></p>
                            <p><strong>AI Calc:</strong> <span className="text-emerald-600">{q.ai_verified_answer}</span></p>
                          </div>
                          <p className="text-[11px] text-ink-soft bg-black/5 p-2 rounded italic">" {q.verification_explanation} "</p>
                          
                          <div className="pt-2 flex items-center gap-2">
                            <label className="text-[10px] font-bold text-ink-muted">Set Final Answer:</label>
                            <select 
                              className="input text-xs py-1 px-2 h-auto"
                              value={finalAnswer}
                              onChange={(e) => editCorrectAnswer(idx, e.target.value)}
                            >
                              {Object.keys(q.options || {}).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="pt-2">
                 <button onClick={applyPDFUpdates} className="btn-primary w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-emerald-500/20">
                   <CheckCircle2 size={18} /> Apply Fixes & Publish Mock Test
                 </button>
              </div>
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
    </>
  );
}

/* ------------------------------ Manage Students ---------------------------- */
export function ManageStudentsPage() {
  const { students = [], deleteStudent } = useApp();
  const [q, setQ] = useState("");
  const list = students.filter((s) => (s.name + (s.enrolled || "") + s.email).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader icon={<Users size={22} />} title="Manage Students" subtitle={`${students.length} registered student${students.length === 1 ? "" : "s"}`} />
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-black/5">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input pl-9" placeholder="Search students by name or email..." value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-ink-muted uppercase tracking-wide border-b border-black/5">
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Progress</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-muted">
                    No registered students found. When students create an account or sign in, they will appear here live.
                  </td>
                </tr>
              ) : (
                list.map((s)=>(
                  <tr key={s.email} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-5 py-3"><p className="font-semibold text-ink">{s.name}</p><p className="text-xs text-ink-muted">{s.email}</p></td>
                    <td className="px-5 py-3"><Badge color="#6D28D9">{s.enrolled || "UPSC Civil Services"}</Badge></td>
                    <td className="px-5 py-3 w-40"><div className="flex items-center gap-2"><div className="flex-1"><ProgressBar value={s.progress || 0}/></div><span className="text-xs font-bold text-brand-700">{s.progress || 0}%</span></div></td>
                    <td className="px-5 py-3 text-ink-muted">{s.joined}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={()=>deleteStudent(s.email)} title="Remove student" className="p-2 rounded-lg hover:bg-rose-50 text-ink-faint hover:text-rose-500 transition-colors">
                        <Trash2 size={15}/>
                      </button>
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

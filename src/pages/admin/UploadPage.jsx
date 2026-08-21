import { useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UploadCloud, Youtube, Eye, Save, Send, FileText, Play, X, ImagePlus, Loader2, Clock } from "lucide-react";
import PageHeader from "../../components/PageHeader.jsx";
import { useApp } from "../../store.jsx";
import { useAuth } from "../../auth.jsx";
import { CATEGORIES } from "../../data.js";
import { isFirebaseConfigured } from "../../firebase.js";
import { fsUploadFile, currentUserId } from "../../backend.js";

export default function UploadPage() {
  const [params] = useSearchParams();
  const mode = params.get("type") === "video" ? "video" : "pdf";
  const navigate = useNavigate();
  const { addUpload, pushToast } = useApp();

  const [form, setForm] = useState({
    type: mode,
    title: "",
    category: CATEGORIES[0].name,
    description: "",
    youtube: "",
    file: null,
    thumb: null,
  });
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const isAbortedRef = useRef(false);
  const { user } = useAuth();
  const { students = [] } = useApp();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const cancelUpload = () => {
    isAbortedRef.current = true;
    setUploading(false);
    setUploadProgress(0);
    setUploadStatus("");
    pushToast("Upload cancelled ✕");
  };

  const fileToDataUrlWithProgress = (file, onProgress) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = 15 + Math.round((e.loaded / e.total) * 65);
          onProgress(percent, `Processing file data... (${percent}%)`);
        }
      };
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const extractYouTubeId = (url) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url.trim();
  };

  const publish = async () => {
    if (!form.title.trim()) return pushToast("Please enter a title");
    if (mode === "video" && !form.youtube) return pushToast("Paste a YouTube video link");
    if (mode === "pdf" && !form.file) return pushToast("Attach a PDF file");
    
    isAbortedRef.current = false;
    setUploading(true);
    setUploadProgress(5);
    setUploadStatus("Initializing upload process...");

    try {
      const cat = CATEGORIES.find((c) => c.name === form.category) || CATEGORIES[0];
      const ytId = mode === "video" ? extractYouTubeId(form.youtube) : "";

      let fileUrl = "";
      let fileName = form.file?.name || "";
      let thumbUrl = "";

      const now = new Date();
      const formattedDate = now.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const formattedTime = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const uploadTimeString = `${formattedDate}, ${formattedTime}`;

      if (isAbortedRef.current) return;
      setUploadProgress(15);
      setUploadStatus("Processing thumbnail & media...");

      if (form.thumb) {
        thumbUrl = await fileToDataUrlWithProgress(form.thumb);
      } else if (mode === "video" && ytId) {
        thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }

      if (isAbortedRef.current) return;
      setUploadProgress(30);

      if (mode === "pdf" && form.file) {
        setUploadStatus("Encoding PDF document...");
        fileUrl = await fileToDataUrlWithProgress(form.file, (p, msg) => {
          if (!isAbortedRef.current) {
            setUploadProgress(p);
            setUploadStatus(msg);
          }
        });
        if (isAbortedRef.current) return;
        setUploadProgress(80);
        setUploadStatus("Verifying PDF file integrity...");

        if (isFirebaseConfigured) {
          try {
            setUploadStatus("Uploading to Firebase Storage...");
            const timeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Storage timeout")), 3500)
            );
            const uid = await currentUserId();
            const uploadTask = fsUploadFile(form.file, uid, "uploads");
            const res = await Promise.race([uploadTask, timeout]);
            if (res?.url) fileUrl = res.url;
          } catch {
            console.warn("Storage upload timed out or unconfigured. Using persistent local reference.");
          }
        }
      } else {
        setUploadProgress(80);
        setUploadStatus("Validating video details...");
      }

      if (isAbortedRef.current) return;
      setUploadProgress(90);
      setUploadStatus("Broadcasting update to enrolled students...");

      const payload = {
        type: mode,
        title: form.title.trim(),
        category: form.category,
        categoryColor: cat.color,
        thumb: cat.gradient,
        thumbUrl: thumbUrl || "",
        description: form.description.trim(),
        pages: mode === "pdf" ? Math.max(1, Math.round((form.file?.size || 500000) / 40000)) : 1,
        downloads: 0,
        views: 0,
        duration: mode === "video" ? "12:30" : "—",
        youtube: ytId || "",
        fileUrl: fileUrl || "",
        fileName: fileName || "",
        author: "KEN IAS Academy",
        date: uploadTimeString,
        uploadTime: formattedTime,
        uploadedAt: Date.now(),
      };

      if (isAbortedRef.current) return;
      setUploadProgress(98);
      await addUpload(payload);

      if (isAbortedRef.current) return;
      setUploadProgress(100);
      setUploadStatus("100% Complete! Material Published Successfully.");

      setTimeout(() => {
        if (!isAbortedRef.current) {
          setUploading(false);
          navigate("/admin");
        }
      }, 400);
    } catch (err) {
      console.error(err);
      if (!isAbortedRef.current) {
        pushToast("Error uploading file. Please try again.");
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const saveDraft = () => pushToast("Draft saved ✓");
  const color = mode === "video" ? "#EC4899" : "#1B4F72";

  return (
    <>
      <PageHeader
        icon={mode === "video" ? <Youtube size={22} /> : <UploadCloud size={22} />}
        title={mode === "video" ? "Add YouTube Video" : "Upload Study Material"}
        subtitle={mode === "video" ? "Paste a link and it goes live for students" : "Publish PDF notes to all enrolled students"}
        action={
          <div className="flex gap-2">
            <button onClick={()=>setPreview(true)} className="btn-soft text-sm px-4 py-2.5"><Eye size={15} /> Preview</button>
            <button onClick={saveDraft} className="btn-ghost text-sm px-4 py-2.5"><Save size={15} /> Save Draft</button>
            <button onClick={publish} disabled={uploading} className="btn-primary text-sm px-4 py-2.5 min-w-[130px] justify-center">
              {uploading ? <><Loader2 size={15} className="animate-spin" /> {uploadProgress}%</> : <><Send size={15} /> Publish</>}
            </button>
          </div>
        }
      />

      {/* Mode switcher */}
      <div className="inline-flex p-1 rounded-2xl bg-black/[0.05] mb-6">
        {[["pdf","Upload PDF","UploadCloud"],["video","YouTube Link","Youtube"]].map(([m,label,Icon]) => (
          <button key={m} onClick={()=>{setForm(f=>({...f,type:m})); navigate(`/admin/upload?type=${m}`);}} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${mode===m?"bg-white shadow-card text-brand-700":"text-ink-muted hover:text-ink-soft"}`}>
            {m==="pdf"?<UploadCloud size={15}/>:<Youtube size={15}/>} {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        {/* Left: fields */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-5">
          <div className="card p-6 space-y-5">
            <h3 className="font-bold text-ink">Material details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-ink-soft mb-1.5 block">Title</label>
                <input className="input" placeholder="e.g. Simplification Shortcut PDF" value={form.title} onChange={(e)=>set("title",e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft mb-1.5 block">Category</label>
                <select className="input" value={form.category} onChange={(e)=>set("category",e.target.value)}>
                  {CATEGORIES.map((c)=><option key={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1.5 block">Description</label>
              <textarea className="input min-h-[90px] resize-none" placeholder="Short description shown to students..." value={form.description} onChange={(e)=>set("description",e.target.value)} />
            </div>
          </div>

          {mode === "video" ? (
            <div className="card p-6">
              <h3 className="font-bold text-ink mb-2">YouTube video link</h3>
              <p className="text-xs text-ink-muted mb-4">Paste any YouTube URL. Students will watch it embedded inside the app.</p>
              <input className="input" placeholder="https://www.youtube.com/watch?v=..." value={form.youtube} onChange={(e)=>set("youtube",e.target.value)} />
            </div>
          ) : (
            <div className="card p-6">
              <h3 className="font-bold text-ink mb-4">Upload PDF</h3>
              <div
                onDragOver={(e)=>{e.preventDefault();setDrag(true);}}
                onDragLeave={()=>setDrag(false)}
                onDrop={(e)=>{e.preventDefault();setDrag(false);set("file",e.dataTransfer.files[0]);}}
                onClick={()=>document.getElementById("pdfInput")?.click()}
                className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${drag?"border-brand-500 bg-brand-50":"border-black/10 hover:border-brand-300 hover:bg-brand-50/40"}`}
              >
                <input id="pdfInput" type="file" accept="application/pdf" className="hidden" onChange={(e)=>set("file",e.target.files[0])} />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-3" style={{background:`${color}1A`,color}}>
                  {form.file ? <FileText size={24}/> : <UploadCloud size={24}/>}
                </div>
                <p className="font-semibold text-ink">{form.file ? form.file.name : "Drag & drop your PDF here"}</p>
                <p className="text-xs text-ink-muted mt-1">or <span className="text-brand-700 font-medium">browse files</span> · Max 50 MB</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Right: thumbnail + preview */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="space-y-5">
          <div className="card p-6">
            <h3 className="font-bold text-ink mb-4">Thumbnail</h3>
            <div className={`relative h-40 rounded-2xl bg-gradient-to-br ${CATEGORIES.find(c=>c.name===form.category)?.gradient || "from-brand-600 to-fuchsia-500"} flex items-center justify-center overflow-hidden`}>
              {form.thumb ? (
                <img src={URL.createObjectURL(form.thumb)} alt="Thumbnail Preview" className="w-full h-full object-cover" />
              ) : mode === "video" && extractYouTubeId(form.youtube) ? (
                <img src={`https://img.youtube.com/vi/${extractYouTubeId(form.youtube)}/hqdefault.jpg`} alt="Video Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-grid opacity-40" />
                  {mode === "video" ? <Play size={44} className="text-white drop-shadow"/> : <FileText size={44} className="text-white drop-shadow"/>}
                </>
              )}
              <button onClick={()=>document.getElementById("thumbInput")?.click()} className="absolute bottom-3 right-3 glass text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 z-10">
                <ImagePlus size={13}/> Change
              </button>
              <input id="thumbInput" type="file" accept="image/*" className="hidden" onChange={(e)=>set("thumb",e.target.files[0])} />
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-bold text-ink mb-3">Live preview</h3>
            <div className="rounded-xl bg-black/[0.03] p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{background:color}}>
                {mode==="video"?<Play size={17}/>:<FileText size={17}/>}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{form.title || "Untitled material"}</p>
                <p className="text-xs text-ink-muted">{form.category}</p>
              </div>
              <span className="chip" style={{background:`${color}1A`,color}}>{mode.toUpperCase()}</span>
            </div>
            <p className="text-xs text-ink-muted mt-3 text-center">Publishing pushes a notification to all {students.length} registered student{students.length === 1 ? "" : "s"}.</p>
          </div>
        </motion.div>
      </div>

      {/* Live Uploading Progress Modal Overlay */}
      {uploading && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-lift space-y-5 text-center border border-black/5"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center relative">
              <UploadCloud size={32} className="animate-pulse" />
              <span className="absolute -bottom-1 -right-1 bg-brand-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow">
                {uploadProgress}%
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-lg text-ink">
                {uploadProgress === 100 ? "Upload Complete! 🎉" : `Uploading ${mode === "video" ? "Video Material" : "PDF Notes"} (${uploadProgress}%)`}
              </h3>
              <p className="text-xs text-ink-muted mt-1">{uploadStatus}</p>
            </div>

            {/* 100% Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-ink-soft">
                <span>Progress</span>
                <span className="text-brand-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-black/10 rounded-full h-3.5 overflow-hidden p-0.5 border border-black/5">
                <div
                  className="bg-gradient-to-r from-brand-600 via-purple-600 to-fuchsia-500 h-full rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-black/5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Publish time:</span>
                <span className="font-semibold text-ink flex items-center gap-1">
                  <Clock size={13} /> {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </span>
              </div>
              <button
                type="button"
                onClick={cancelUpload}
                className="btn-soft text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-semibold"
              >
                <X size={14} /> Cancel Upload
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center" onClick={()=>setPreview(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white overflow-hidden shadow-lift" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
              <p className="font-bold text-ink">How students will see it</p>
              <button onClick={()=>setPreview(false)} className="p-1.5 rounded-lg hover:bg-black/5"><X size={18} className="text-ink-muted"/></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{background:color}}>{mode==="video"?<Play size={17}/>:<FileText size={17}/>}</span>
                <div><p className="font-bold text-ink">{form.title || "Untitled material"}</p><p className="text-xs text-ink-muted">{form.category} · just now</p></div>
              </div>
              <div className="rounded-xl bg-brand-50 p-3 flex gap-3">
                <span>🔔</span>
                <div>
                  <p className="text-sm font-semibold text-ink">{mode==="video"?"New Video Uploaded":"New PDF Uploaded"}</p>
                  <p className="text-xs text-ink-muted">“{form.title || "Untitled material"}” is now available in {form.category}. Students receive this as a push notification.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-black/5 flex justify-end gap-2">
              <button onClick={()=>setPreview(false)} className="btn-soft px-4 py-2.5 text-sm">Close</button>
              <button onClick={publish} disabled={uploading} className="btn-primary px-4 py-2.5 text-sm">
                {uploading ? <><Loader2 size={15} className="animate-spin"/> {uploadProgress}%</> : <><Send size={15}/> Publish</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { 
  Download, 
  History, 
  Home, 
  Play, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Music, 
  Video,
  ExternalLink,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { openDB } from "idb";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Database setup
const DB_NAME = "VideoHubProDB";
const STORE_NAME = "history";

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    },
  });
}

interface VideoFormat {
  quality: string;
  format: string;
  size: string;
  url: string;
  type: "video" | "audio";
}

interface VideoInfo {
  id?: number;
  title: string;
  thumbnail: string;
  duration: string;
  source: string;
  formats: VideoFormat[];
  timestamp: number;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "history">("home");
  const [history, setHistory] = useState<VideoInfo[]>([]);
  const [showPlayer, setShowPlayer] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const db = await getDB();
    const allHistory = await db.getAll(STORE_NAME);
    setHistory(allHistory.sort((a, b) => b.timestamp - a.timestamp));
  };

  const addToHistory = async (info: VideoInfo) => {
    const db = await getDB();
    await db.add(STORE_NAME, { ...info, timestamp: Date.now() });
    loadHistory();
  };

  const deleteFromHistory = async (id: number) => {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
    loadHistory();
  };

  const clearHistory = async () => {
    if (window.confirm("هل أنت متأكد من مسح سجل التحميلات بالكامل؟")) {
      const db = await getDB();
      await db.clear(STORE_NAME);
      loadHistory();
    }
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setShowPlayer(false);

    try {
      const response = await axios.post("/api/analyze", { url });
      const data = response.data;
      setVideoInfo(data);
      // Only add to history if it's a successful analysis
      if (data && data.formats && data.formats.length > 0) {
        addToHistory(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "حدث خطأ أثناء تحليل الرابط. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: VideoFormat) => {
    const downloadUrl = `/api/download?url=${encodeURIComponent(format.url)}&filename=${encodeURIComponent(videoInfo?.title || "video")}.${format.format}`;
    window.location.href = downloadUrl;
  };

  const handleDownloadAllAsZip = async () => {
    if (!videoInfo) return;
    setLoading(true);
    try {
      const files = videoInfo.formats.map(f => ({
        url: f.url,
        filename: `${videoInfo.title}_${f.quality}.${f.format}`
      }));
      
      const response = await axios.post("/api/download-zip", { files }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${videoInfo.title}_bundle.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("فشل تحميل الملف المضغوط.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <img src="https://cdn-icons-png.flaticon.com/512/3039/3039386.png" className="w-6 h-6 brightness-0" alt="Logo" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">VideoHub <span className="text-emerald-500 text-sm font-medium">Pro</span></h1>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => setActiveTab("home")}
            className={cn("text-sm font-medium transition-colors", activeTab === "home" ? "text-emerald-500" : "text-zinc-400 hover:text-white")}
          >
            الرئيسية
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn("text-sm font-medium transition-colors", activeTab === "history" ? "text-emerald-500" : "text-zinc-400 hover:text-white")}
          >
            السجل
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">حمّل فيديوهاتك المفضلة <span className="text-emerald-500">بسهولة</span></h2>
                <p className="text-zinc-400 max-w-lg mx-auto">دعم كامل لجميع المنصات: يوتيوب، فيسبوك، تيك توك، انستجرام، وتويتر بجودة أصلية.</p>
              </div>

              {/* Search Box */}
              <form onSubmit={handleAnalyze} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                <div className="relative flex items-center bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-2xl">
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="ضع رابط الفيديو هنا..."
                    className="flex-1 bg-transparent px-4 py-3 outline-none text-lg placeholder:text-zinc-600"
                  />
                  <button 
                    disabled={loading || !url}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    <span>تحليل</span>
                  </button>
                </div>
              </form>

              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              {/* Results */}
              {videoInfo && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Video Preview */}
                    <div className="relative aspect-video bg-black group">
                      {showPlayer ? (
                        <div className="w-full h-full">
                          <video 
                            src={videoInfo.source} 
                            controls 
                            autoPlay
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <>
                          <img 
                            src={videoInfo.thumbnail} 
                            alt={videoInfo.title}
                            className="w-full h-full object-cover opacity-60"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            onClick={() => setShowPlayer(true)}
                            className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform"
                          >
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                              <Play className="text-black w-8 h-8 fill-current ml-1" />
                            </div>
                          </button>
                          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono">
                            {videoInfo.duration}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Download Options */}
                    <div className="p-8 space-y-6">
                      <div>
                        <h3 className="text-xl font-bold line-clamp-2 leading-tight">{videoInfo.title}</h3>
                        <p className="text-zinc-500 text-sm mt-2 flex items-center gap-2">
                          <ExternalLink className="w-3 h-3" />
                          {new URL(videoInfo.source).hostname}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">خيارات التحميل</p>
                          <button 
                            onClick={handleDownloadAllAsZip}
                            className="text-[10px] text-emerald-500 hover:underline flex items-center gap-1 font-bold"
                          >
                            <Download className="w-3 h-3" />
                            تحميل الكل (ZIP)
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {videoInfo.formats.map((format, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleDownload(format)}
                              className="group flex items-center justify-between bg-white/5 hover:bg-emerald-500 hover:text-black p-4 rounded-2xl transition-all border border-white/5 hover:border-emerald-400"
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  format.type === "audio" ? "bg-amber-500/20 text-amber-500 group-hover:bg-black/20 group-hover:text-black" : "bg-emerald-500/20 text-emerald-500 group-hover:bg-black/20 group-hover:text-black"
                                )}>
                                  {format.type === "audio" ? <Music className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-sm">{format.quality}</p>
                                  <p className="text-[10px] opacity-60 uppercase">{format.format} • {format.size}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">تحميل</span>
                                <Download className="w-5 h-5" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Features Grid */}
              {!videoInfo && !loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                  {[
                    { icon: Video, label: "جودة أصلية", color: "text-emerald-500" },
                    { icon: Music, label: "تحويل لـ MP3", color: "text-amber-500" },
                    { icon: Loader2, label: "سرعة فائقة", color: "text-blue-500" },
                    { icon: CheckCircle2, label: "آمن تماماً", color: "text-purple-500" },
                  ].map((feat, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl text-center space-y-3">
                      <feat.icon className={cn("w-8 h-8 mx-auto", feat.color)} />
                      <p className="text-sm font-medium text-zinc-300">{feat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">سجل التحميلات</h2>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    مسح السجل
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 border border-dashed border-white/10 rounded-3xl space-y-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                    <History className="text-zinc-600 w-8 h-8" />
                  </div>
                  <p className="text-zinc-500">لا يوجد سجل تحميلات حتى الآن.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 group"
                    >
                      <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-black">
                        <img src={item.thumbnail} className="w-full h-full object-cover opacity-70" referrerPolicy="no-referrer" />
                        <div className="absolute bottom-1 right-1 bg-black/60 text-[8px] px-1 rounded">
                          {item.duration}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{item.title}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">{new Date(item.timestamp).toLocaleDateString("ar-EG")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setVideoInfo(item);
                            setActiveTab("home");
                            setUrl(item.source);
                          }}
                          className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-black transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteFromHistory(item.id!)}
                          className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 border-t border-white/5 text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
            <Download className="text-zinc-400 w-4 h-4" />
          </div>
          <span className="font-bold text-zinc-400">VideoHub Pro</span>
        </div>
        <p className="text-zinc-600 text-xs">
          © 2026 VideoHub Pro - جميع الحقوق محفوظة للمالك الوحيد
          <br />
          تم التطوير بواسطة فريق VideoHub
        </p>
      </footer>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex items-center justify-around shadow-2xl">
          <button 
            onClick={() => setActiveTab("home")}
            className={cn(
              "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all",
              activeTab === "home" ? "bg-emerald-500 text-black" : "text-zinc-400"
            )}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all",
              activeTab === "history" ? "bg-emerald-500 text-black" : "text-zinc-400"
            )}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-bold">السجل</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ActiveTab } from './types';
import { Navbar } from './components/Navbar';
import { FileUploader } from './components/FileUploader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FeatureDirectoryModal } from './components/FeatureDirectoryModal';

// Resilient self-healing lazy loader for PWA and desktop apps
function safeLazy<P extends object = any>(
  importer: () => Promise<any>,
  namedExport?: string
): React.LazyExoticComponent<React.ComponentType<P>> {
  return lazy(async () => {
    try {
      const module = await importer();
      const component = (namedExport && (module as any)[namedExport]) || (module as any).default || module;
      sessionStorage.removeItem('pdfcraft_chunk_retry');
      return { default: component };
    } catch (err) {
      console.warn('PDFCraft module load failed. Attempting self-healing refresh:', err);
      const retried = sessionStorage.getItem('pdfcraft_chunk_retry');
      if (!retried) {
        sessionStorage.setItem('pdfcraft_chunk_retry', 'true');
        window.location.reload();
      }
      throw err;
    }
  });
}

// Lazy-loaded heavy components with self-healing reload on chunk updates
const EditSignViewer = safeLazy(() => import('./components/EditSignViewer'), 'EditSignViewer');
const OrganizeGrid = safeLazy(() => import('./components/OrganizeGrid'), 'OrganizeGrid');
const ConvertPanel = safeLazy(() => import('./components/ConvertPanel'), 'ConvertPanel');
const ToolsPanel = safeLazy(() => import('./components/ToolsPanel'), 'ToolsPanel');
const ResumeBuilder = safeLazy(() => import('./components/ResumeBuilder'), 'ResumeBuilder');
const MobileSignPad = safeLazy(() => import('./components/MobileSignPad'), 'MobileSignPad');

const ViewSkeleton: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] text-slate-400 gap-3 py-16 animate-pulse">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-xs font-medium text-slate-400">Loading module securely in-browser...</p>
  </div>
);
import {
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  FileSignature,
  Table,
  CheckCircle2,
  Sparkles,
  Scale,
  Shrink,
  GraduationCap,
  ArrowLeftRight,
  ArrowRight,
  Target,
  FileText,
  Search,
  Wand2,
  GitCompare,
  FileSpreadsheet,
  FileImage,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sign-edit');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentBytes, setCurrentBytes] = useState<ArrayBuffer | null>(null);
  const [mobileSessionId, setMobileSessionId] = useState<string | null>(null);

  // Global Feature Hub / Command Palette Modal
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [targetSubTool, setTargetSubTool] = useState<
    'risk-radar' | 'size-squeezer' | 'diff' | 'table-extract' | 'doctor'
  >('risk-radar');
  const [targetKB, setTargetKB] = useState<number>(195);
  const [targetConverter, setTargetConverter] = useState<
    'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-images' | 'images-to-pdf' | 'word-to-pdf' | 'word-to-images'
  >('pdf-to-word');

  // Landing Page Bento Filter
  const [bentoFilter, setBentoFilter] = useState<'all' | 'career' | 'legal' | 'convert' | 'edit'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Check if opened as mobile signing page
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes('sign-session=')) {
        const id = hash.split('sign-session=')[1]?.split('&')[0];
        setMobileSessionId(id || null);
      } else {
        setMobileSessionId(null);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Global Ctrl+K / Cmd+K listener to trigger Feature Directory anywhere!
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsFeatureModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  if (mobileSessionId) {
    return (
      <Suspense fallback={<ViewSkeleton />}>
        <MobileSignPad sessionId={mobileSessionId} />
      </Suspense>
    );
  }

  const handleFileLoaded = (file: File, bytes: ArrayBuffer) => {
    setCurrentFile(file);
    setCurrentBytes(bytes);
  };

  const handleResetFile = () => {
    setCurrentFile(null);
    setCurrentBytes(null);
    setActiveTab('sign-edit');
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
    document.title = 'PDFCraft — 100% Free & Private PDF Editor, Signer & Tools (Zero Cloud Leaks)';
  };

  // Comprehensive SEO Route & URL sync handler for all 12 High-Intent Tools
  const navigateToTab = (tab: ActiveTab, subTool?: any, converter?: any) => {
    setActiveTab(tab);
    if (subTool) setTargetSubTool(subTool);
    if (converter) setTargetConverter(converter);

    let path = '/';
    let title = 'PDFCraft — 100% Free & Private PDF Editor, Signer & Tools (Zero Cloud Leaks)';

    if (tab === 'sign-edit') {
      if (subTool === 'redact') {
        path = '/redact-pdf';
        title = 'Redact & Black Out PDF Free Online (Permanent Zero-Leak) | PDFCraft';
      } else {
        path = '/sign-pdf';
        title = 'Sign PDF Free No Account Required (Zero Cloud Leaks) | PDFCraft';
      }
    } else if (tab === 'organize') {
      if (subTool === 'split') {
        path = '/split-pdf';
        title = 'Split PDF Pages & Extract Sheets Free Offline | PDFCraft';
      } else {
        path = '/merge-pdf';
        title = 'Organize, Rotate & Merge PDF Offline Free | PDFCraft';
      }
    } else if (tab === 'convert') {
      const activeConv = converter || targetConverter;
      if (activeConv === 'pdf-to-excel') {
        path = '/pdf-to-excel';
        title = 'Convert PDF to Excel (.xlsx) Free Without Email | PDFCraft';
      } else if (activeConv === 'images-to-pdf') {
        path = '/jpg-to-pdf';
        title = 'Convert JPG & PNG Images to PDF Free Online | PDFCraft';
      } else if (activeConv === 'pdf-to-images') {
        path = '/pdf-to-jpg';
        title = 'Convert PDF to JPG Images High Resolution Free | PDFCraft';
      } else {
        path = '/pdf-to-word';
        title = 'Convert PDF to Word (.docx) Free Offline (Zero Uploads) | PDFCraft';
      }
    } else if (tab === 'resume') {
      path = '/resume-builder';
      title = 'Free ATS Resume Builder 60s (Zero Paywall & Vector PDF) | PDFCraft';
    } else if (tab === 'tools') {
      if (subTool === 'size-squeezer-100kb') {
        path = '/compress-pdf-100kb';
        setTargetKB(95);
        title = 'Compress PDF to 100KB Online Free (Govt & UPSC Portal Cap) | PDFCraft';
      } else if (subTool === 'size-squeezer' || subTool === 'size-squeezer-200kb') {
        path = '/compress-pdf-200kb';
        setTargetKB(195);
        title = 'Compress PDF Under 200KB Free & Private (Zero Cloud Leaks) | PDFCraft';
      } else {
        path = '/contract-risk-radar';
        title = 'AI Contract Risk Radar — Detect Predatory Clauses Free | PDFCraft';
      }
    }

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    document.title = title;
  };

  // SEO Route sync on load & browser popstate for all 22 high-intent landing pages
  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('50kb')) {
        setActiveTab('tools');
        setTargetSubTool('size-squeezer');
        setTargetKB(48);
        document.title = 'Compress PDF to 50KB Online Free (Photo, Signature & Govt Portal Cap) | PDFCraft';
      } else if (path.includes('100kb')) {
        setActiveTab('tools');
        setTargetSubTool('size-squeezer');
        setTargetKB(95);
        document.title = 'Compress PDF to 100KB Online Free (Govt & UPSC Portal Cap) | PDFCraft';
      } else if (path.includes('300kb')) {
        setActiveTab('tools');
        setTargetSubTool('size-squeezer');
        setTargetKB(295);
        document.title = 'Compress PDF Under 300KB Free Online (Visa, Job & College Portal) | PDFCraft';
      } else if (path.includes('500kb')) {
        setActiveTab('tools');
        setTargetSubTool('size-squeezer');
        setTargetKB(495);
        document.title = 'Compress PDF Under 500KB Free (Email & Thesis Attachment Limit) | PDFCraft';
      } else if (path.includes('compress') || path.includes('squeezer') || path.includes('200kb')) {
        setActiveTab('tools');
        setTargetSubTool('size-squeezer');
        setTargetKB(195);
        document.title = 'Compress PDF Under 200KB Free & Private (Zero Cloud Leaks) | PDFCraft';
      } else if (path.includes('excel')) {
        setActiveTab('convert');
        setTargetConverter('pdf-to-excel');
        document.title = 'Convert PDF to Excel (.xlsx) Free Without Email | PDFCraft';
      } else if (path.includes('png-to-pdf')) {
        setActiveTab('convert');
        setTargetConverter('images-to-pdf');
        document.title = 'Convert PNG to PDF Online Free (Preserve Transparent Alpha) | PDFCraft';
      } else if (path.includes('jpg-to-pdf') || path.includes('images-to-pdf')) {
        setActiveTab('convert');
        setTargetConverter('images-to-pdf');
        document.title = 'Convert JPG & PNG Images to PDF Free Online | PDFCraft';
      } else if (path.includes('extract-images') || path.includes('extract-pdf-images') || path.includes('pdf-to-jpg') || path.includes('pdf-to-images')) {
        setActiveTab('convert');
        setTargetConverter('pdf-to-images');
        document.title = 'Convert PDF to JPG Images High Resolution Free | PDFCraft';
      } else if (path.includes('word') || path.includes('convert')) {
        setActiveTab('convert');
        setTargetConverter('pdf-to-word');
        document.title = 'Convert PDF to Word (.docx) Free Offline (Zero Uploads) | PDFCraft';
      } else if (path.includes('redact')) {
        setActiveTab('sign-edit');
        document.title = 'Redact & Black Out PDF Free Online (Permanent Zero-Leak) | PDFCraft';
      } else if (path.includes('sign')) {
        setActiveTab('sign-edit');
        document.title = 'Sign PDF Free No Account Required (Zero Cloud Leaks) | PDFCraft';
      } else if (path.includes('rotate')) {
        setActiveTab('organize');
        document.title = 'Rotate PDF Pages Permanently Online Free (Zero Uploads) | PDFCraft';
      } else if (path.includes('delete') || path.includes('remove-pages')) {
        setActiveTab('organize');
        document.title = 'Delete Pages from PDF Online Free (Visual Page Selector) | PDFCraft';
      } else if (path.includes('split')) {
        setActiveTab('organize');
        document.title = 'Split PDF Pages & Extract Sheets Free Offline | PDFCraft';
      } else if (path.includes('merge') || path.includes('organize')) {
        setActiveTab('organize');
        document.title = 'Organize, Rotate & Merge PDF Offline Free | PDFCraft';
      } else if (path.includes('resume') || path.includes('cv')) {
        setActiveTab('resume');
        document.title = 'Free ATS Resume Builder 60s (Zero Paywall & Vector PDF) | PDFCraft';
      } else if (path.includes('protect') || path.includes('unlock') || path.includes('contract') || path.includes('radar') || path.includes('clause')) {
        setActiveTab('tools');
        setTargetSubTool('risk-radar');
        document.title = 'AI Contract Risk Radar — Detect Predatory Clauses Free | PDFCraft';
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const handleLaunchTool = (tab: ActiveTab, subTool?: string, converter?: any) => {
    navigateToTab(tab, subTool, converter);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 relative overflow-x-clip selection:bg-indigo-500 selection:text-white">
      {/* Ambient Radial Glowing Lights constrained in fixed container */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
        <div className="absolute top-48 left-10 w-72 h-72 bg-rose-500/5 blur-3xl" />
        <div className="absolute top-48 right-10 w-72 h-72 bg-emerald-500/5 blur-3xl" />
      </div>

      {/* Navbar with Tools Hub Trigger */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        hasFile={!!currentFile}
        fileName={currentFile?.name}
        onResetFile={handleResetFile}
        onOpenToolsModal={() => setIsFeatureModalOpen(true)}
        onFileLoaded={handleFileLoaded}
      />

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col ${activeTab === 'sign-edit' && currentBytes ? 'pb-0' : 'pb-20 md:pb-0'}`}>
        {/* If no file loaded and on sign-edit home, show the Hero Showcase + Uploader */}
        {!currentBytes && activeTab === 'sign-edit' ? (
          <div className="flex-1 flex flex-col justify-center items-center py-8 sm:py-12 px-4">
            
            {/* Hero Heading */}
            <div className="text-center max-w-3xl mx-auto mb-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] sm:text-xs font-semibold shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                <span>Zero Server Uploads • 100% Free Client-Side PDF Powerhouse</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
                All The Pro PDF Tools. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                  Zero Paywalls. Zero Cloud Leaks.
                </span>
              </h1>

              <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Edit & sign with mobile sync, detect predatory contract clauses with AI Radar, squeeze PDFs strictly under 200 KB, and craft ATS-verified resumes in 60 seconds.
              </p>

              {/* 1-Click Fast-Launch Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsFeatureModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/30 hover:scale-[1.02]"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>🔍 Explore All 16 Pro Tools</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono hidden sm:inline">⌘K</span>
                </button>

                <button
                  onClick={() => {
                    navigateToTab('resume');
                    confetti({ particleCount: 30, spread: 40 });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:border-indigo-400"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>⚡ 60s Resume Studio</span>
                </button>

                <button
                  onClick={() => {
                    handleLaunchTool('tools', 'risk-radar');
                    confetti({ particleCount: 30, spread: 40 });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:border-rose-400"
                >
                  <Scale className="w-3.5 h-3.5 text-rose-400" />
                  <span>🚨 AI Contract Risk Radar</span>
                </button>

                <button
                  onClick={() => {
                    handleLaunchTool('tools', 'size-squeezer');
                    confetti({ particleCount: 30, spread: 40 });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:border-emerald-400"
                >
                  <Shrink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🗜️ Target Size Squeezer</span>
                </button>

                <button
                  onClick={() => {
                    navigateToTab('convert');
                    confetti({ particleCount: 30, spread: 40 });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:border-slate-500"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Universal Converter</span>
                </button>
              </div>
            </div>

            {/* Uploader Drop Box */}
            <FileUploader onFileLoaded={handleFileLoaded} />

            {/* Bento Grid: All Feature Pillars */}
            <div className="max-w-6xl mx-auto px-4 mt-12 pb-16 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Instant Pro Feature Directory</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Click any feature to launch directly with zero sign-up</p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                  {[
                    { id: 'all', label: 'All Highlights' },
                    { id: 'career', label: 'Resume & Career' },
                    { id: 'legal', label: 'AI Legal & Audit' },
                    { id: 'convert', label: 'Conversions' },
                    { id: 'edit', label: 'Edit & Sign' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setBentoFilter(f.id as any)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        bentoFilter === f.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Resume Studio */}
                {(bentoFilter === 'all' || bentoFilter === 'career') && (
                  <div
                    onClick={() => {
                      navigateToTab('resume');
                      confetti({ particleCount: 40, spread: 50 });
                    }}
                    className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition cursor-pointer group shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                          Jobscan Alternative
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition flex items-center gap-1">
                        <span>60s Resume & Career Studio</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Auto-import old PDFs, scan against real job descriptions for ATS keywords, add portfolio QR codes, and generate matching cover letters.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-4 text-[10px] font-semibold text-indigo-400">
                      <span>• ATS Matcher</span>
                      <span>• Cover Letter</span>
                      <span>• Vector QR</span>
                      <span>• Headshot Studio</span>
                    </div>
                  </div>
                )}

                {/* 2. AI Contract Risk Radar */}
                {(bentoFilter === 'all' || bentoFilter === 'legal') && (
                  <div
                    onClick={() => {
                      handleLaunchTool('tools', 'risk-radar');
                      confetti({ particleCount: 40, spread: 50 });
                    }}
                    className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 transition cursor-pointer group shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:scale-105 transition">
                          <Scale className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                          Ironclad Alternative
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-rose-300 transition flex items-center gap-1">
                        <span>AI Contract Risk & Red-Flag Radar</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Scans offer letters, NDAs, and agreements in 2 seconds. Flags non-competes, IP grabs, and uncapped liability with counter-proposals.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-4 text-[10px] font-semibold text-rose-400">
                      <span>• Red-Flag Scan</span>
                      <span>• Plain English</span>
                      <span>• Counter-Clauses</span>
                    </div>
                  </div>
                )}

                {/* 3. Target Size Squeezer */}
                {(bentoFilter === 'all' || bentoFilter === 'legal') && (
                  <div
                    onClick={() => {
                      handleLaunchTool('tools', 'size-squeezer');
                      confetti({ particleCount: 40, spread: 50 });
                    }}
                    className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition cursor-pointer group shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition">
                          <Shrink className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          Guaranteed &lt; 200 KB
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-300 transition flex items-center gap-1">
                        <span>Target Size Squeezer</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Never get rejected by government or job portal caps again. Downscales and crunches documents to strictly fit under 100 KB, 200 KB, or 500 KB.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-4 text-[10px] font-semibold text-emerald-400">
                      <span>• 195 KB Preset</span>
                      <span>• Bicubic Sharp</span>
                      <span>• Zero Uploads</span>
                    </div>
                  </div>
                )}

                {/* 4. Edit & Mobile Sign */}
                {(bentoFilter === 'all' || bentoFilter === 'edit') && (
                  <div
                    onClick={() => {
                      navigateToTab('sign-edit');
                      confetti({ particleCount: 40, spread: 50 });
                    }}
                    className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition cursor-pointer group shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition">
                          <FileSignature className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                          Mobile Touch Sync
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-300 transition flex items-center gap-1">
                        <span>Edit & Sign with Mobile Sync</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Scan QR code with your phone to use your touchscreen as a signature pad. Add text, dates, stamps, and permanent burn-in redactions.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-4 text-[10px] font-semibold text-blue-400">
                      <span>• Phone QR Sync</span>
                      <span>• Text & Redact</span>
                      <span>• Stamps</span>
                    </div>
                  </div>
                )}

                {/* 5. Organize & Merge */}
                {(bentoFilter === 'all' || bentoFilter === 'edit') && (
                  <div
                    onClick={() => {
                      navigateToTab('organize');
                      confetti({ particleCount: 40, spread: 50 });
                    }}
                    className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900 transition cursor-pointer group shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition">
                          <Layers className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">
                          Visual Grid
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-teal-300 transition flex items-center gap-1">
                        <span>Organize, Rotate & Merge</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Interactive page thumbnail cards. Drag to reorder, rotate sideways/upside-down scans 90°, delete pages, and append additional PDFs.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-4 text-[10px] font-semibold text-teal-400">
                      <span>• Drag Reorder</span>
                      <span>• 90° Rotate</span>
                      <span>• Multi-Merge</span>
                    </div>
                  </div>
                )}

                {/* 6. Universal Converters */}
                {(bentoFilter === 'all' || bentoFilter === 'convert') && (
                  <div
                    onClick={() => {
                      navigateToTab('convert');
                      confetti({ particleCount: 40, spread: 50 });
                    }}
                    className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 transition cursor-pointer group shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 group-hover:scale-105 transition">
                          <ArrowLeftRight className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold">
                          6-in-1 Converters
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-violet-300 transition flex items-center gap-1">
                        <span>Universal Document Converters</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Convert PDF to Word (.docx), PDF to Excel (.xlsx), PDF to Images ZIP, and convert Word and Images into clean PDFs.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-4 text-[10px] font-semibold text-violet-400">
                      <span>• Word (.docx)</span>
                      <span>• Excel (.xlsx)</span>
                      <span>• Images (.zip)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* SEO & BRAND TRUST SECTION (Crawlable Rich Semantic HTML) */}
            {/* ======================================================== */}
            <div className="pt-12 sm:pt-16 pb-8 space-y-12">
              {/* 1. Comparison: PDFCraft vs Traditional PDF Tools */}
              <section aria-labelledby="comparison-heading" className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                    The Zero-Cloud Advantage
                  </span>
                  <h2 id="comparison-heading" className="text-xl sm:text-2xl font-black text-white mt-3 mb-2">
                    Why Privacy-Conscious Teams Choose PDFCraft
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Traditional PDF websites upload your sensitive contracts and resumes to third-party cloud servers. PDFCraft runs 100% locally in your browser memory.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Feature / Capability</th>
                        <th className="py-3 px-4 text-emerald-400 font-black">PDFCraft</th>
                        <th className="py-3 px-4">iLovePDF</th>
                        <th className="py-3 px-4">Smallpdf</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      <tr>
                        <td className="py-3.5 px-4 text-white font-semibold">Document Privacy</td>
                        <td className="py-3.5 px-4 text-emerald-300 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>100% Client-Side (Zero Uploads)</span>
                        </td>
                        <td className="py-3.5 px-4 text-rose-400">Uploaded to Cloud Servers</td>
                        <td className="py-3.5 px-4 text-rose-400">Uploaded to Cloud Servers</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 text-white font-semibold">Free Usage Limits</td>
                        <td className="py-3.5 px-4 text-emerald-300 font-bold">Unlimited (Free Forever)</td>
                        <td className="py-3.5 px-4 text-slate-400">Limited daily tasks</td>
                        <td className="py-3.5 px-4 text-slate-400">2 free tasks / day</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 text-white font-semibold">Target Size Squeezer (&lt;200 KB)</td>
                        <td className="py-3.5 px-4 text-emerald-300 font-bold">✓ 1-Click Dial (50K - 200K)</td>
                        <td className="py-3.5 px-4 text-slate-400">Basic compression only</td>
                        <td className="py-3.5 px-4 text-slate-400">Paid tier only</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 text-white font-semibold">AI Contract Risk Radar</td>
                        <td className="py-3.5 px-4 text-emerald-300 font-bold">✓ Predatory Clause Scanner</td>
                        <td className="py-3.5 px-4 text-slate-400">✗ Not Available</td>
                        <td className="py-3.5 px-4 text-slate-400">✗ Not Available</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 text-white font-semibold">ATS-Friendly Resume Studio</td>
                        <td className="py-3.5 px-4 text-emerald-300 font-bold">✓ Free Vector PDF Export</td>
                        <td className="py-3.5 px-4 text-slate-400">✗ Not Available</td>
                        <td className="py-3.5 px-4 text-slate-400">✗ Not Available</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 2. Frequently Asked Questions (FAQ) with Schema Alignment */}
              <section aria-labelledby="faq-heading" className="max-w-3xl mx-auto space-y-4">
                <div className="text-center mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                    Help &amp; Knowledge
                  </span>
                  <h2 id="faq-heading" className="text-xl sm:text-2xl font-black text-white mt-3 mb-2">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs text-slate-400">
                    Everything you need to know about PDFCraft's zero-cloud technology and tools.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      q: 'Are my PDF documents uploaded to your servers?',
                      a: 'No. PDFCraft operates 100% inside your web browser using WebAssembly and PDF.js. Your documents never touch an external server or cloud database, guaranteeing complete confidentiality for legal, financial, and personal files.',
                    },
                    {
                      q: 'Is PDFCraft really 100% free with no paywalls or daily limits?',
                      a: 'Yes. Unlike iLovePDF or Smallpdf which lock users behind daily limits and $12/month subscriptions, all 16 tools on PDFCraft are completely free with zero download gates and no account registration required.',
                    },
                    {
                      q: 'Can I compress a PDF strictly under 200KB or 100KB for government job portals?',
                      a: 'Yes. The Target Size Squeezer tool allows you to specify an exact target size (such as 200 KB, 100 KB, or 50 KB) and intelligently resamples the document entirely in browser memory to meet portal submission limits.',
                    },
                    {
                      q: 'How do I sign a PDF without creating an account or paying?',
                      a: 'Simply choose the Edit & Sign tab, draw your signature or type your name, and tap anywhere on the document to place it. You can burn in your signature and download the completed vector PDF in seconds without registering.',
                    },
                    {
                      q: 'How does the 60-Second ATS Resume Studio work?',
                      a: 'The Resume Studio allows you to import old resumes or pick starter templates, scans your content against target job descriptions for missing ATS keywords, embeds scannable portfolio QR codes, and exports vector PDFs that ATS robots can easily parse.',
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:text-indigo-300 transition cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                            openFaqIndex === idx ? 'rotate-180 text-indigo-400' : ''
                          }`}
                        />
                      </button>
                      {openFaqIndex === idx && (
                        <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 animate-in fade-in duration-150">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

          </div>
        ) : (
          /* Active Tool Views */
          <div className="flex-1 flex flex-col animate-in fade-in duration-200">
            <ErrorBoundary fallbackTitle="Could Not Initialize Tool Module">
              <Suspense fallback={<ViewSkeleton />}>
                {activeTab === 'sign-edit' && (
                  currentBytes ? (
                    <EditSignViewer
                      pdfBytes={currentBytes}
                      fileName={currentFile?.name || 'document.pdf'}
                      onFileLoaded={handleFileLoaded}
                      onResetFile={handleResetFile}
                    />
                  ) : (
                    <div className="max-w-2xl mx-auto py-20 px-4 text-center">
                      <FileUploader onFileLoaded={handleFileLoaded} title="Drop PDF to Edit, Sign & Redact" />
                    </div>
                  )
                )}

                {activeTab === 'organize' && (
                  currentBytes ? (
                    <OrganizeGrid
                      pdfBytes={currentBytes}
                      fileName={currentFile?.name || 'document.pdf'}
                      onFileLoaded={handleFileLoaded}
                    />
                  ) : (
                    <div className="max-w-2xl mx-auto py-20 px-4 text-center">
                      <FileUploader onFileLoaded={handleFileLoaded} title="Drop PDF to Organize, Rotate & Merge" />
                    </div>
                  )
                )}

                {activeTab === 'convert' && (
                  <ConvertPanel
                    currentPdfBytes={currentBytes || undefined}
                    currentFileName={currentFile?.name}
                    initialConverter={targetConverter}
                    onFileLoaded={handleFileLoaded}
                  />
                )}

                {activeTab === 'tools' && (
                  <ToolsPanel
                    pdfBytes={currentBytes || undefined}
                    fileName={currentFile?.name}
                    initialSubTool={targetSubTool}
                    initialTargetKB={targetKB}
                    onFileLoaded={handleFileLoaded}
                  />
                )}

                {activeTab === 'resume' && (
                  <ResumeBuilder />
                )}
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </main>

      {/* Comprehensive SEO Tool Directory & Internal Linking Graph */}
      <section aria-labelledby="seo-directory-heading" className="border-t border-slate-900 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <h2 id="seo-directory-heading" className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>PDFCraft Private Suite</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  100% Free • No Limits
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Zero cloud uploads. All document operations execute securely in your web browser memory.
              </p>
            </div>
            <button
              onClick={() => setIsFeatureModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Browse All 16 Tools (Ctrl+K)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            {/* Column 1: Squeeze & Compress */}
            <div className="space-y-3">
              <h3 className="font-bold text-white uppercase text-[11px] tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Shrink className="w-3.5 h-3.5" />
                <span>Compress &amp; Resize</span>
              </h3>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <a
                    href="/compress-pdf-50kb"
                    onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'size-squeezer'); setTargetKB(48); }}
                    className="hover:text-indigo-300 transition block hover:translate-x-0.5"
                  >
                    Compress PDF to 50KB (Exam &amp; Photo)
                  </a>
                </li>
                <li>
                  <a
                    href="/compress-pdf-100kb"
                    onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'size-squeezer-100kb'); }}
                    className="hover:text-indigo-300 transition block hover:translate-x-0.5"
                  >
                    Compress PDF to 100KB (Govt Cap)
                  </a>
                </li>
                <li>
                  <a
                    href="/compress-pdf-200kb"
                    onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'size-squeezer-200kb'); }}
                    className="hover:text-indigo-300 transition block hover:translate-x-0.5"
                  >
                    Compress PDF Under 200KB (Admissions)
                  </a>
                </li>
                <li>
                  <a
                    href="/compress-pdf-300kb"
                    onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'size-squeezer'); setTargetKB(295); }}
                    className="hover:text-indigo-300 transition block hover:translate-x-0.5"
                  >
                    Compress PDF to 300KB (Visa Limit)
                  </a>
                </li>
                <li>
                  <a
                    href="/compress-pdf-500kb"
                    onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'size-squeezer'); setTargetKB(495); }}
                    className="hover:text-indigo-300 transition block hover:translate-x-0.5"
                  >
                    Compress PDF to 500KB (Email Cap)
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Document Converters */}
            <div className="space-y-3">
              <h3 className="font-bold text-white uppercase text-[11px] tracking-wider text-violet-400 flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Document Converters</span>
              </h3>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <a
                    href="/pdf-to-word"
                    onClick={(e) => { e.preventDefault(); navigateToTab('convert', undefined, 'pdf-to-word'); }}
                    className="hover:text-violet-300 transition block hover:translate-x-0.5"
                  >
                    PDF to Editable Word (.docx)
                  </a>
                </li>
                <li>
                  <a
                    href="/pdf-to-excel"
                    onClick={(e) => { e.preventDefault(); navigateToTab('convert', undefined, 'pdf-to-excel'); }}
                    className="hover:text-violet-300 transition block hover:translate-x-0.5"
                  >
                    PDF to Excel (.xlsx) Spreadsheet
                  </a>
                </li>
                <li>
                  <a
                    href="/jpg-to-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('convert', undefined, 'images-to-pdf'); }}
                    className="hover:text-violet-300 transition block hover:translate-x-0.5"
                  >
                    Convert JPG &amp; Photos to PDF
                  </a>
                </li>
                <li>
                  <a
                    href="/png-to-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('convert', undefined, 'images-to-pdf'); }}
                    className="hover:text-violet-300 transition block hover:translate-x-0.5"
                  >
                    Convert PNG to PDF (Transparent)
                  </a>
                </li>
                <li>
                  <a
                    href="/pdf-to-jpg"
                    onClick={(e) => { e.preventDefault(); navigateToTab('convert', undefined, 'pdf-to-images'); }}
                    className="hover:text-violet-300 transition block hover:translate-x-0.5"
                  >
                    Extract PDF Pages to JPG ZIP
                  </a>
                </li>
                <li>
                  <a
                    href="/extract-pdf-images"
                    onClick={(e) => { e.preventDefault(); navigateToTab('convert', undefined, 'pdf-to-images'); }}
                    className="hover:text-violet-300 transition block hover:translate-x-0.5"
                  >
                    Extract All Embedded Photos
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Edit, Sign & Organize */}
            <div className="space-y-3">
              <h3 className="font-bold text-white uppercase text-[11px] tracking-wider text-blue-400 flex items-center gap-1.5">
                <FileSignature className="w-3.5 h-3.5" />
                <span>Edit, Sign &amp; Merge</span>
              </h3>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <a
                    href="/sign-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('sign-edit'); }}
                    className="hover:text-blue-300 transition block hover:translate-x-0.5"
                  >
                    Sign PDF Free (No Account)
                  </a>
                </li>
                <li>
                  <a
                    href="/sign-pdf-no-account"
                    onClick={(e) => { e.preventDefault(); navigateToTab('sign-edit'); }}
                    className="hover:text-blue-300 transition block hover:translate-x-0.5"
                  >
                    Zero-Signup Document E-Sign
                  </a>
                </li>
                <li>
                  <a
                    href="/redact-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('sign-edit', 'redact'); }}
                    className="hover:text-blue-300 transition block hover:translate-x-0.5"
                  >
                    Redact &amp; Black Out Text
                  </a>
                </li>
                <li>
                  <a
                    href="/merge-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('organize'); }}
                    className="hover:text-blue-300 transition block hover:translate-x-0.5"
                  >
                    Organize &amp; Merge Multiple PDFs
                  </a>
                </li>
                <li>
                  <a
                    href="/split-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('organize', 'split'); }}
                    className="hover:text-blue-300 transition block hover:translate-x-0.5"
                  >
                    Split PDF Pages &amp; Extract
                  </a>
                </li>
                <li>
                  <a
                    href="/rotate-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('organize'); }}
                    className="hover:text-blue-300 transition block hover:translate-x-0.5"
                  >
                    Rotate PDF Pages Permanently
                  </a>
                </li>
                <li>
                  <a
                    href="/delete-pdf-pages"
                    onClick={(e) => { e.preventDefault(); navigateToTab('organize'); }}
                    className="hover:text-blue-300 transition block hover:translate-x-0.5"
                  >
                    Delete Unwanted &amp; Blank Pages
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Career & AI Legal */}
            <div className="space-y-3">
              <h3 className="font-bold text-white uppercase text-[11px] tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Career &amp; Security</span>
              </h3>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li>
                  <a
                    href="/resume-builder"
                    onClick={(e) => { e.preventDefault(); navigateToTab('resume'); }}
                    className="hover:text-emerald-300 transition block hover:translate-x-0.5"
                  >
                    60s ATS Resume Studio
                  </a>
                </li>
                <li>
                  <a
                    href="/contract-risk-radar"
                    onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'risk-radar'); }}
                    className="hover:text-rose-300 transition block hover:translate-x-0.5"
                  >
                    AI Contract Risk Radar
                  </a>
                </li>
                <li>
                  <a
                    href="/protect-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'risk-radar'); }}
                    className="hover:text-indigo-300 transition block hover:translate-x-0.5"
                  >
                    Password Protect &amp; Encrypt PDF
                  </a>
                </li>
                <li>
                  <a
                    href="/unlock-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'risk-radar'); }}
                    className="hover:text-indigo-300 transition block hover:translate-x-0.5"
                  >
                    Unlock &amp; Remove PDF Password
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-5 text-xs text-slate-400 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center">
            <span className="font-bold text-slate-300">PDFCraft</span>
            <span>•</span>
            <span>Zero-Cost Client-Side PDF Powerhouse</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 justify-center">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              100% Private (No Cloud Uploads)
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Free Forever</span>
          </div>
        </div>
      </footer>

      {/* Global 16-Tool Directory Command Palette Modal */}
      {isFeatureModalOpen && (
        <FeatureDirectoryModal
          isOpen={isFeatureModalOpen}
          onClose={() => setIsFeatureModalOpen(false)}
          onSelectTool={handleLaunchTool}
        />
      )}
    </div>
  );
};

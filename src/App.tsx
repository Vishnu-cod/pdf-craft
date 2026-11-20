import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ActiveTab } from './types';
import { Navbar } from './components/Navbar';
import { FileUploader } from './components/FileUploader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FeatureDirectoryModal } from './components/FeatureDirectoryModal';
import { PrivacyModal } from './components/PrivacyModal';
import { matchRoute } from './routes';

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
const SplitPanel = safeLazy(() => import('./components/SplitPanel'), 'SplitPanel');
const SecurityPanel = safeLazy(() => import('./components/SecurityPanel'), 'SecurityPanel');
const SecurityPrivacyStudio = safeLazy(() => import('./components/SecurityPrivacyStudio'), 'SecurityPrivacyStudio');
const PosterCraft = safeLazy(() => import('./components/PosterCraft'), 'PosterCraft');
const WhatsAppStudio = safeLazy(() => import('./components/WhatsAppStudio'), 'WhatsAppStudio');
const PhotoCraftStudio = safeLazy(() => import('./features/photocraft/components/PhotoCraftStudio'), 'PhotoCraftStudio');

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
  Scissors,
  KeyRound,
  EyeOff,
  FileCheck2,
  Unlock,
  Play,
  Video,
  DownloadCloud,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sign-edit');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentBytes, setCurrentBytes] = useState<ArrayBuffer | null>(null);
  const [mobileSessionId, setMobileSessionId] = useState<string | null>(null);

  // Global Feature Hub / Command Palette Modal
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [securityMode, setSecurityMode] = useState<'protect' | 'unlock'>('protect');
  const [securityStudioSubTab, setSecurityStudioSubTab] = useState<'pii_masker' | 'signature_validator'>('pii_masker');
  const [targetSubTool, setTargetSubTool] = useState<
    'risk-radar' | 'size-squeezer' | 'diff' | 'table-extract' | 'doctor'
  >('risk-radar');
  const [targetKB, setTargetKB] = useState<number>(195);
  const [targetConverter, setTargetConverter] = useState<
    'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-images' | 'images-to-pdf' | 'word-to-pdf' | 'word-to-images'
  >('pdf-to-word');

  // Landing Page Feature Filter
  const [bentoFilter, setBentoFilter] = useState<'all' | 'popular' | 'security' | 'convert' | 'edit'>('all');
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

  // Comprehensive SEO Route & URL sync handler for all canonical tools
  const navigateToTab = (
    tab: ActiveTab,
    subTool?: any,
    converter?: any,
    targetSize?: number,
    security?: 'protect' | 'unlock',
    studioTab?: 'pii_masker' | 'signature_validator'
  ) => {
    setActiveTab(tab);
    if (subTool) setTargetSubTool(subTool);
    if (converter) setTargetConverter(converter);
    if (targetSize) setTargetKB(targetSize);
    if (security) setSecurityMode(security);
    if (studioTab) setSecurityStudioSubTab(studioTab);

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
    } else if (tab === 'split') {
      path = '/split-pdf';
      title = 'Split PDF Pages & Extract Sheets Free Offline | PDFCraft';
    } else if (tab === 'security-studio') {
      const activeStudio = studioTab || securityStudioSubTab;
      if (activeStudio === 'signature_validator') {
        path = '/verify-signature';
        title = 'Verify PDF Digital Signature Free (CCA India & Adobe AATL PKI) | PDFCraft';
      } else {
        path = '/mask-aadhaar';
        title = 'Mask Aadhaar Card PDF Free (1-Click Client-Side Auto-Redact) | PDFCraft';
      }
    } else if (tab === 'security') {
      if (security === 'unlock') {
        path = '/unlock-pdf';
        title = 'Unlock & Remove PDF Password Online Free | PDFCraft';
      } else {
        path = '/protect-pdf';
        title = 'Password Protect PDF Online Free (Military-Grade AES-256) | PDFCraft';
      }
    } else if (tab === 'organize') {
      if (subTool === 'rotate') {
        path = '/rotate-pdf';
        title = 'Rotate PDF Pages Permanently Online Free (Zero Uploads) | PDFCraft';
      } else if (subTool === 'delete') {
        path = '/delete-pdf-pages';
        title = 'Delete Pages from PDF Online Free (Visual Page Selector) | PDFCraft';
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
      if (subTool === 'size-squeezer-100kb' || targetSize === 95 || targetSize === 100) {
        path = '/compress-pdf-100kb';
        setTargetKB(95);
        title = 'Compress PDF to 100KB Online Free (Govt & UPSC Portal Cap) | PDFCraft';
      } else if (subTool === 'size-squeezer-50kb' || targetSize === 48 || targetSize === 50) {
        path = '/compress-pdf-50kb';
        setTargetKB(48);
        title = 'Compress PDF to 50KB Online Free (Photo, Signature & Govt Portal Cap) | PDFCraft';
      } else if (subTool === 'size-squeezer-300kb' || targetSize === 295 || targetSize === 300) {
        path = '/compress-pdf-300kb';
        setTargetKB(295);
        title = 'Compress PDF Under 300KB Free Online (Visa, Job & College Portal) | PDFCraft';
      } else if (subTool === 'size-squeezer-500kb' || targetSize === 495 || targetSize === 500) {
        path = '/compress-pdf-500kb';
        setTargetKB(495);
        title = 'Compress PDF Under 500KB Free (Email & Thesis Attachment Limit) | PDFCraft';
      } else if (subTool === 'size-squeezer' || subTool === 'size-squeezer-200kb') {
        path = '/compress-pdf-200kb';
        setTargetKB(targetSize || 195);
        title = 'Compress PDF Under 200KB Free & Private (Zero Cloud Leaks) | PDFCraft';
      } else {
        path = '/contract-risk-radar';
        title = 'AI Contract Risk Radar — Detect Predatory Clauses Free | PDFCraft';
      }
    } else if (tab === 'photocraft') {
      path = '/photo-editor';
      title = 'PhotoCraft — Free Canva-Inspired Online Photo Editor & AI Studio (Zero Watermark) | PDFCraft';
    } else if (tab === 'postercraft') {
      path = '/postercraft';
      title = 'PosterCraft — Free Pinterest Aesthetic Editorial Poster Studio (Zero Watermark) | PDFCraft';
    } else if (tab === 'whatsapp-studio') {
      path = '/whatsapp-hd';
      title = 'WhatsApp 15-Minute HD Video Booster & 30s Status Slicer | PDFCraft';
    }

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    document.title = title;
  };

  // Centralized Route Sync with matchRoute for initial load & browser popstate
  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      if (path.toLowerCase() === '/privacy') {
        setIsPrivacyModalOpen(true);
      }
      const route = matchRoute(path);
      setActiveTab(route.tab);
      if (route.subTool) setTargetSubTool(route.subTool);
      if (route.converter) setTargetConverter(route.converter);
      if (route.targetKB) setTargetKB(route.targetKB);
      if (route.securityMode) setSecurityMode(route.securityMode);
      if (route.securityStudioSubTab) setSecurityStudioSubTab(route.securityStudioSubTab);
      document.title = route.title;
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const handleLaunchTool = (
    tab: ActiveTab,
    subTool?: string,
    converter?: any,
    securityMode?: 'protect' | 'unlock',
    targetKB?: number,
    securityStudioSubTab?: 'pii_masker' | 'signature_validator'
  ) => {
    if (securityStudioSubTab) setSecurityStudioSubTab(securityStudioSubTab);
    navigateToTab(tab, subTool, converter, targetKB, securityMode, securityStudioSubTab);
  };

  const homeTools = [
    {
      id: 'photocraft',
      name: 'PhotoCraft (Canva Studio)',
      badge: 'Free Canva Alternative',
      icon: Wand2,
      bg: 'from-fuchsia-600 to-indigo-600',
      desc: 'Free Canva-inspired photo editor & graphic design studio. Magic Eraser, AI Background Remover, Magic Grab, and templates.',
      category: ['all', 'popular', 'edit'],
      action: () => navigateToTab('photocraft'),
    },
    {
      id: 'postercraft',
      name: 'PosterCraft (Pinterest)',
      badge: 'Brand Ambassador',
      icon: Sparkles,
      bg: 'from-purple-600 to-indigo-600',
      desc: '1-Click Pinterest aesthetic editorial poster creator with 3D text behind subjects & 35mm grain.',
      category: ['all', 'popular', 'edit'],
      action: () => navigateToTab('postercraft'),
    },
    {
      id: 'whatsapp-hd',
      name: 'WhatsApp 15m HD Sizer',
      badge: '15-Min Ready',
      icon: Video,
      bg: 'from-emerald-600 to-teal-600',
      desc: 'Compress up to 15-minute videos into under 16MB/64MB without blur + 30s status slicer.',
      category: ['all', 'popular'],
      action: () => navigateToTab('whatsapp-studio'),
    },
    {
      id: 'edit-sign',
      name: 'Edit & Sign PDF',
      badge: 'Touch Sync',
      icon: FileSignature,
      bg: 'from-blue-600 to-indigo-600',
      desc: 'Sign with mobile phone sync, add text notes, dates & stamps.',
      category: ['all', 'popular', 'edit'],
      action: () => navigateToTab('sign-edit'),
    },
    {
      id: 'mask-aadhaar',
      name: 'Mask Aadhaar & IDs',
      badge: '1-Click Auto',
      icon: EyeOff,
      bg: 'from-rose-600 to-red-600',
      desc: 'Auto-detect and black out 12-digit Aadhaar & PAN numbers before sharing.',
      category: ['all', 'popular', 'security'],
      action: () => handleLaunchTool('security-studio', undefined, undefined, undefined, undefined, 'pii_masker'),
    },
    {
      id: 'size-squeezer',
      name: 'Compress to Exact Size',
      badge: '50KB / 100KB',
      icon: Shrink,
      bg: 'from-emerald-600 to-teal-600',
      desc: 'Shrink strictly under 50KB, 100KB, or 200KB for exam & govt portals.',
      category: ['all', 'popular', 'edit'],
      action: () => handleLaunchTool('tools', 'size-squeezer'),
    },
    {
      id: 'organize-merge',
      name: 'Merge & Reorder Pages',
      badge: 'Multi-PDF',
      icon: Layers,
      bg: 'from-teal-600 to-emerald-600',
      desc: 'Combine multiple PDFs into one and arrange custom page order.',
      category: ['all', 'popular', 'edit'],
      action: () => navigateToTab('organize'),
    },
    {
      id: 'split-pdf',
      name: 'Split PDF Pages',
      badge: 'Extract Pages',
      icon: Scissors,
      bg: 'from-amber-600 to-orange-600',
      desc: 'Extract custom page ranges or split into individual sheets in a ZIP.',
      category: ['all', 'edit'],
      action: () => navigateToTab('split'),
    },
    {
      id: 'pdf-to-word',
      name: 'PDF to Word (.docx)',
      badge: 'Editable DOCX',
      icon: FileText,
      bg: 'from-blue-600 to-sky-600',
      desc: 'Convert PDF documents into formatted, editable Microsoft Word files.',
      category: ['all', 'popular', 'convert'],
      action: () => handleLaunchTool('convert', undefined, 'pdf-to-word'),
    },
    {
      id: 'pdf-to-excel',
      name: 'PDF to Excel (.xlsx)',
      badge: 'Spreadsheet',
      icon: FileSpreadsheet,
      bg: 'from-emerald-600 to-green-600',
      desc: 'Extract tables and numbers from invoices into Excel workbooks.',
      category: ['all', 'convert'],
      action: () => handleLaunchTool('convert', undefined, 'pdf-to-excel'),
    },
    {
      id: 'verify-signature',
      name: 'Verify Digital Signature',
      badge: 'CCA India / Adobe',
      icon: FileCheck2,
      bg: 'from-emerald-600 to-teal-600',
      desc: 'Validate eSignatures from eMudhra, Capricorn, DigiLocker & Adobe.',
      category: ['all', 'popular', 'security'],
      action: () => handleLaunchTool('security-studio', undefined, undefined, undefined, undefined, 'signature_validator'),
    },
    {
      id: 'resume-builder',
      name: 'ATS Resume Builder',
      badge: '60s Vector PDF',
      icon: GraduationCap,
      bg: 'from-indigo-600 to-violet-600',
      desc: 'Build job-ready resumes & matching cover letters in 60 seconds.',
      category: ['all', 'popular'],
      action: () => navigateToTab('resume'),
    },
    {
      id: 'risk-radar',
      name: 'Check Contract Risks',
      badge: 'AI Clause Audit',
      icon: Scale,
      bg: 'from-rose-600 to-amber-600',
      desc: 'Spot sneaky non-competes, IP grabs, and unfair contract terms.',
      category: ['all', 'security'],
      action: () => handleLaunchTool('tools', 'risk-radar'),
    },
    {
      id: 'contract-diff',
      name: 'Compare Two PDFs',
      badge: 'Side-by-Side',
      icon: GitCompare,
      bg: 'from-indigo-600 to-blue-600',
      desc: 'Highlight visual and text differences between two contract drafts.',
      category: ['all', 'edit'],
      action: () => handleLaunchTool('tools', 'diff'),
    },
    {
      id: 'protect-pdf',
      name: 'Lock with Password',
      badge: 'AES-256',
      icon: Lock,
      bg: 'from-purple-600 to-indigo-600',
      desc: 'Protect confidential PDFs with user and owner passwords.',
      category: ['all', 'security'],
      action: () => handleLaunchTool('security', undefined, undefined, 'protect'),
    },
    {
      id: 'unlock-pdf',
      name: 'Remove Password',
      badge: 'Instant Unlock',
      icon: Unlock,
      bg: 'from-cyan-600 to-teal-600',
      desc: 'Remove password restrictions and export clean, unlocked PDFs.',
      category: ['all', 'security'],
      action: () => handleLaunchTool('security', undefined, undefined, 'unlock'),
    },
    {
      id: 'document-doctor',
      name: 'Clean & Brighten Scans',
      badge: 'Scan Enhancer',
      icon: Wand2,
      bg: 'from-fuchsia-600 to-purple-600',
      desc: 'Whiten dark scanned paper and boost faded photocopy ink.',
      category: ['all', 'edit'],
      action: () => handleLaunchTool('tools', 'doctor'),
    },
    {
      id: 'pdf-to-images',
      name: 'PDF to Images (ZIP)',
      badge: 'High-Res PNG',
      icon: FileImage,
      bg: 'from-amber-600 to-yellow-600',
      desc: 'Save every page as crisp high-resolution PNG or JPG images in a ZIP.',
      category: ['all', 'convert'],
      action: () => handleLaunchTool('convert', undefined, 'pdf-to-images'),
    },
    {
      id: 'images-to-pdf',
      name: 'Images to Single PDF',
      badge: 'Photos to PDF',
      icon: Zap,
      bg: 'from-violet-600 to-fuchsia-600',
      desc: 'Combine photos, receipts, and scans into a single PDF document.',
      category: ['all', 'convert'],
      action: () => handleLaunchTool('convert', undefined, 'images-to-pdf'),
    },
  ];

  if (mobileSessionId) {
    return (
      <Suspense fallback={<ViewSkeleton />}>
        <MobileSignPad sessionId={mobileSessionId} />
      </Suspense>
    );
  }

  if (activeTab === 'photocraft') {
    return (
      <ErrorBoundary fallbackTitle="Could Not Initialize PhotoCraft Studio">
        <Suspense fallback={<ViewSkeleton />}>
          <PhotoCraftStudio onBackToHome={handleResetFile} />
        </Suspense>
      </ErrorBoundary>
    );
  }

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
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        onFileLoaded={handleFileLoaded}
      />

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col ${activeTab === 'sign-edit' && currentBytes ? 'pb-0' : 'pb-20 md:pb-0'}`}>
        {/* If no file loaded and on sign-edit home, show the Stripe-Inspired Hero Showcase + Uploader */}
        {!currentBytes && activeTab === 'sign-edit' ? (
          <div className="flex-1 flex flex-col justify-center items-center py-6 sm:py-10 px-4">
            
            {/* Stripe-Style Flowing Hero Banner */}
            <div className="w-full max-w-6xl mx-auto stripe-hero-mesh p-6 sm:p-12 rounded-3xl border border-slate-200/90 shadow-xl mb-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200 text-[#111439] text-[11px] sm:text-xs font-bold shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse shrink-0" />
                      <span>Zero Cloud Uploads • Hardware GPU Accelerated</span>
                    </div>
                    <a
                      href="/commercial.html"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] sm:text-xs font-bold transition shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-amber-600 text-amber-600" />
                      <span>🎬 Watch 30s Video</span>
                    </a>
                  </div>

                  <h1 className="text-4xl sm:text-6xl font-black text-[#111439] tracking-tight leading-[1.08]">
                    Creative suite <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111439] via-purple-700 to-pink-600">
                      to elevate your media.
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-[#425466] leading-relaxed max-w-xl font-normal">
                    Generate high-fashion Pinterest aesthetic posters with 3D text behind subjects, optimize 15-minute WhatsApp video stories in full HD, and sign private PDFs with zero server uploads.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => navigateToTab('postercraft')}
                      className="bg-[#111439] hover:bg-[#0A2540] text-white font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                      <span>🌟 Open PosterCraft (Pinterest)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigateToTab('whatsapp-studio')}
                      className="bg-white hover:bg-slate-50 text-[#111439] border border-slate-200 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-sm transition-all flex items-center gap-2"
                    >
                      <Video className="w-4 h-4 text-emerald-600" />
                      <span>🎬 WhatsApp 15m Sizer</span>
                    </button>
                  </div>
                </div>

                {/* Floating Stripe-Style Mockup Showcase */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-sm">
                    <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-black text-[#111439]">FEATURE SPOTLIGHT</span>
                        <span className="text-[10px] font-mono bg-purple-50 text-purple-700 font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                          BRAND AMBASSADOR
                        </span>
                      </div>

                      <div className="relative aspect-[3/4] rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-700 p-4 text-white flex flex-col justify-between overflow-hidden shadow-inner">
                        <div className="flex justify-between items-center text-[10px] font-mono text-white/80">
                          <span>VOL. 04 // 2026</span>
                          <span>LAT: 34.0522° N</span>
                        </div>
                        <div className="text-center my-auto">
                          <span className="text-xs font-serif italic tracking-widest block text-white/90">AESTHETIC</span>
                          <span className="text-2xl font-black tracking-tight leading-none">HEAVEN</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-mono border-t border-white/20 pt-1.5">
                          <span>|||| | |||| ||</span>
                          <span className="bg-white text-black px-1.5 py-0.5 rounded font-extrabold text-[8px]">Pinterest Pin</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className="font-semibold">✦ 3D Text Behind Subject</span>
                        <span className="text-purple-600 font-bold">1-Click 4K</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Universal Uploader Drop Box */}
            <FileUploader onFileLoaded={handleFileLoaded} title="Drop any PDF or Image here to edit immediately, or select a tool below" />

            {/* All Tools Open Visual Grid (Stripe Style) */}
            <div className="max-w-6xl mx-auto px-4 mt-10 pb-16 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#111439] flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span>All Creative &amp; PDF Tools</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                      100% Free
                    </span>
                  </h2>
                  <p className="text-xs text-[#425466] mt-0.5">Click any tool to launch instantly in your browser — zero accounts required</p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                  {[
                    { id: 'all', label: 'All Tools' },
                    { id: 'popular', label: '⭐ Popular' },
                    { id: 'security', label: '🛡️ Protect & Mask' },
                    { id: 'convert', label: '🔄 Converters' },
                    { id: 'edit', label: '✍️ Edit & Creative' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setBentoFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        bentoFilter === f.id
                          ? 'bg-[#111439] text-white shadow-md'
                          : 'bg-white hover:bg-slate-100 text-[#425466] border border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsive 4-Column Grid (Stripe Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {homeTools
                  .filter((t) => bentoFilter === 'all' || t.category.includes(bentoFilter))
                  .map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.id}
                        onClick={() => {
                          tool.action();
                          confetti({ particleCount: 35, spread: 50 });
                        }}
                        className="stripe-card p-4 rounded-2xl cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${tool.bg} flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                              {tool.badge}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-[#111439] group-hover:text-purple-700 transition flex items-center gap-1">
                            <span>{tool.name}</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0 text-purple-600" />
                          </h3>
                          <p className="text-xs text-[#425466] mt-1.5 leading-relaxed">
                            {tool.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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

                {activeTab === 'split' && (
                  <SplitPanel
                    pdfBytes={currentBytes || undefined}
                    fileName={currentFile?.name}
                    onFileLoaded={handleFileLoaded}
                  />
                )}

                {activeTab === 'security-studio' && (
                  <SecurityPrivacyStudio
                    initialFile={currentFile}
                    initialPdfBytes={currentBytes || undefined}
                    initialSubTab={securityStudioSubTab}
                    onFileLoaded={handleFileLoaded}
                  />
                )}

                {activeTab === 'security' && (
                  <SecurityPanel
                    pdfBytes={currentBytes || undefined}
                    fileName={currentFile?.name}
                    initialMode={securityMode}
                    onFileLoaded={handleFileLoaded}
                  />
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

                {activeTab === 'postercraft' && (
                  <PosterCraft />
                )}

                {activeTab === 'whatsapp-studio' && (
                  <WhatsAppStudio />
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
                    onClick={(e) => { e.preventDefault(); navigateToTab('split'); }}
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
                    href="/mask-aadhaar"
                    onClick={(e) => { e.preventDefault(); navigateToTab('security-studio', undefined, undefined, undefined, undefined, 'pii_masker'); }}
                    className="hover:text-emerald-300 transition block hover:translate-x-0.5 text-emerald-400 font-semibold"
                  >
                    🛡️ Mask Aadhaar &amp; PAN Card
                  </a>
                </li>
                <li>
                  <a
                    href="/verify-signature"
                    onClick={(e) => { e.preventDefault(); navigateToTab('security-studio', undefined, undefined, undefined, undefined, 'signature_validator'); }}
                    className="hover:text-emerald-300 transition block hover:translate-x-0.5 text-emerald-400 font-semibold"
                  >
                    ✓ Verify Digital Signature (CCA India)
                  </a>
                </li>
                <li>
                  <a
                    href="/protect-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('security', undefined, undefined, undefined, 'protect'); }}
                    className="hover:text-indigo-300 transition block hover:translate-x-0.5"
                  >
                    Password Protect &amp; Encrypt PDF
                  </a>
                </li>
                <li>
                  <a
                    href="/unlock-pdf"
                    onClick={(e) => { e.preventDefault(); navigateToTab('security', undefined, undefined, undefined, 'unlock'); }}
                    className="hover:text-indigo-300 transition block hover:translate-x-0.5"
                  >
                    Unlock &amp; Remove PDF Password
                  </a>
                </li>
                <li>
                  <a
                    href="/ilovepdf-alternative"
                    onClick={(e) => { e.preventDefault(); navigateToTab('tools'); }}
                    className="hover:text-rose-300 transition block hover:translate-x-0.5 text-slate-300"
                  >
                    ⚡ Free iLovePDF Alternative
                  </a>
                </li>
                <li>
                  <a
                    href="/smallpdf-alternative"
                    onClick={(e) => { e.preventDefault(); navigateToTab('tools'); }}
                    className="hover:text-amber-300 transition block hover:translate-x-0.5 text-slate-300"
                  >
                    ⚡ Free Smallpdf Alternative
                  </a>
                </li>
                <li>
                  <a
                    href="/docusign-alternative"
                    onClick={(e) => { e.preventDefault(); navigateToTab('sign-edit'); }}
                    className="hover:text-blue-300 transition block hover:translate-x-0.5 text-slate-300"
                  >
                    ⚡ Free DocuSign Alternative
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-6 text-xs text-slate-400 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5 justify-center">
            <img src="/icon.png" alt="PDFCraft Logo" className="w-5 h-5 object-contain" />
            <span className="font-black text-white tracking-tight">PDF<span className="text-[#ED8C2A]">CRAFT</span></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-medium tracking-wide text-[11px]">CREATE. CONVERT. CUSTOMIZE.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 justify-center">
            <button
              onClick={() => {
                window.history.pushState(null, '', '/privacy');
                setIsPrivacyModalOpen(true);
              }}
              className="flex items-center gap-1 hover:text-emerald-400 transition cursor-pointer"
            >
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>100% Private (No Cloud Uploads)</span>
            </button>
            <span>•</span>
            <button
              onClick={() => {
                window.history.pushState(null, '', '/privacy');
                setIsPrivacyModalOpen(true);
              }}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              Privacy Policy
            </button>
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

      {/* Zero-Cloud Architecture & Privacy Guarantee Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => {
          setIsPrivacyModalOpen(false);
          if (window.location.pathname === '/privacy') {
            window.history.pushState(null, '', '/');
          }
        }}
      />
    </div>
  );
};

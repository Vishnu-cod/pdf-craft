import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ActiveTab } from './types';
import { Navbar } from './components/Navbar';
import { FileUploader } from './components/FileUploader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FeatureDirectoryModal } from './components/FeatureDirectoryModal';
import { PrivacyModal } from './components/PrivacyModal';
import { ComparisonModal, CompetitorId } from './components/ComparisonModal';
import { SeoFooter } from './components/SeoFooter';
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
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [comparisonCompetitor, setComparisonCompetitor] = useState<CompetitorId>('ilovepdf');
  const [securityMode, setSecurityMode] = useState<'protect' | 'unlock'>('protect');
  const [securityStudioSubTab, setSecurityStudioSubTab] = useState<'pii_masker' | 'signature_validator' | 'leak_checker'>('pii_masker');
  const [targetSubTool, setTargetSubTool] = useState<
    'risk-radar' | 'size-squeezer' | 'diff' | 'table-extract' | 'doctor'
  >('risk-radar');
  const [targetKB, setTargetKB] = useState<number>(195);
  const [targetConverter, setTargetConverter] = useState<
    'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-images' | 'images-to-pdf' | 'word-to-pdf' | 'word-to-images'
  >('pdf-to-word');

  // Landing Page Feature Filter & Route View State
  const [bentoFilter, setBentoFilter] = useState<'all' | 'popular' | 'security' | 'convert' | 'edit'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [isDirectToolView, setIsDirectToolView] = useState<boolean>(false);
  const [activeRouteTitle, setActiveRouteTitle] = useState<string>('');
  const [activeRouteDescription, setActiveRouteDescription] = useState<string>('');

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setScrollPercent(0);
        return;
      }
      const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / docHeight) * 100)));
      setScrollPercent(pct);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFile = () => {
    setCurrentFile(null);
    setCurrentBytes(null);
    setActiveTab('sign-edit');
    setIsDirectToolView(false);
    setActiveRouteTitle('');
    setActiveRouteDescription('');
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
    studioTab?: 'pii_masker' | 'signature_validator' | 'leak_checker'
  ) => {
    setActiveTab(tab);
    if (subTool) setTargetSubTool(subTool);
    if (converter) setTargetConverter(converter);
    if (targetSize) setTargetKB(targetSize);
    if (security) setSecurityMode(security);
    if (studioTab) setSecurityStudioSubTab(studioTab);

    let path = '/';
    let title = 'Free Online PDF Editor — Edit, Sign & Compress PDFs Privately | PDFCraft';

    if (tab === 'sign-edit') {
      if (subTool === 'redact') {
        path = '/redact-pdf';
        title = 'Redact & Black Out Sensitive Text in PDF Online | PDFCraft';
      } else {
        path = '/sign-pdf';
        title = 'Sign PDF Free Online — No Account Required | PDFCraft';
      }
    } else if (tab === 'split') {
      path = '/split-pdf';
      title = 'Split PDF Pages & Extract Sheets Free Offline | PDFCraft';
    } else if (tab === 'security-studio') {
      const activeStudio = studioTab || securityStudioSubTab;
      if (activeStudio === 'signature_validator') {
        path = '/verify-signature';
        title = 'Verify PDF Digital Signature Free (CCA India & Adobe AATL PKI) | PDFCraft';
      } else if (activeStudio === 'leak_checker') {
        path = '/pdf-leak-checker';
        title = 'PDF Privacy & Metadata Leak Checker — Audit Hidden Tracking Data Free | PDFCraft';
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
        title = 'Password Protect PDF Online Free (AES-256) | PDFCraft';
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
      if (subTool === 'upsc' || subTool === 'upsc-pdf-compressor') {
        path = '/upsc-pdf-compressor';
        setTargetKB(195);
        title = 'UPSC PDF Compressor Under 200KB Free (Civil Services Portal Safe) | PDFCraft';
      } else if (subTool === 'ssc' || subTool === 'ssc-cgl-signature-photo-compressor') {
        path = '/ssc-cgl-signature-photo-compressor';
        setTargetKB(48);
        title = 'SSC CGL Signature & Photo PDF Compressor Under 50KB | PDFCraft';
      } else if (subTool === 'gate' || subTool === 'gate-exam-pdf-compressor') {
        path = '/gate-exam-pdf-compressor';
        setTargetKB(195);
        title = 'GATE Exam PDF Compressor Under 200KB (IIT GOAPS Portal Safe) | PDFCraft';
      } else if (subTool === 'uscis' || subTool === 'uscis-visa-pdf-compressor') {
        path = '/uscis-visa-pdf-compressor';
        setTargetKB(495);
        title = 'USCIS Visa PDF Compressor Under 500KB / 2MB Free (Zero Uploads) | PDFCraft';
      } else if (subTool === 'neet' || subTool === 'neet-application-pdf-compressor') {
        path = '/neet-application-pdf-compressor';
        setTargetKB(195);
        title = 'NEET Application PDF Compressor Under 200KB (NTA Compliant) | PDFCraft';
      } else if (subTool === 'size-squeezer-100kb' || targetSize === 95 || targetSize === 100) {
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
    }

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    document.title = title;
    setIsDirectToolView(path !== '/');
    setActiveRouteTitle(title.replace(/\s*\|\s*PDFCraft$/i, ''));
    const matchedMeta = matchRoute(path);
    setActiveRouteDescription(matchedMeta.description);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Centralized Route Sync with matchRoute for initial load & browser popstate
  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      if (path.toLowerCase() === '/privacy') {
        setIsPrivacyModalOpen(true);
      }
      if (path.toLowerCase().includes('/compare/')) {
        if (path.toLowerCase().includes('smallpdf')) {
          setComparisonCompetitor('smallpdf');
        } else if (path.toLowerCase().includes('adobe')) {
          setComparisonCompetitor('adobe');
        } else {
          setComparisonCompetitor('ilovepdf');
        }
        setIsComparisonModalOpen(true);
      }
      const route = matchRoute(path);
      setActiveTab(route.tab);
      if (route.subTool) setTargetSubTool(route.subTool);
      if (route.converter) setTargetConverter(route.converter);
      if (route.targetKB) setTargetKB(route.targetKB);
      if (route.securityMode) setSecurityMode(route.securityMode);
      if (route.securityStudioSubTab) setSecurityStudioSubTab(route.securityStudioSubTab);
      const isDirect =
        route.path !== '/' &&
        route.path !== '/privacy' &&
        !route.path.startsWith('/compare/');
      setIsDirectToolView(isDirect);
      setActiveRouteTitle(route.title.replace(/\s*\|\s*PDFCraft$/i, ''));
      setActiveRouteDescription(route.description);
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
    securityStudioSubTab?: 'pii_masker' | 'signature_validator' | 'leak_checker'
  ) => {
    if (securityStudioSubTab) setSecurityStudioSubTab(securityStudioSubTab);
    navigateToTab(tab, subTool, converter, targetKB, securityMode, securityStudioSubTab);
  };

  const homeTools = [
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

  return (
    <div className="min-h-screen bg-bg flex flex-col text-ink relative overflow-x-clip font-sans">
      {/* Right-Side Fixed Scroll Ruler & Section Jump Rail (ArtCraft Architectural HUD) */}
      {!currentBytes && activeTab === 'sign-edit' && (
        <aside
          aria-label="Scroll progress and section navigation"
          className="fixed inset-y-0 right-0 z-40 w-[60px] hidden min-[1420px]:flex flex-col justify-between border-l border-line bg-bg/85 backdrop-blur-sm py-16 pointer-events-none select-none"
        >
          {/* Top Ruler Percentage */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="w-full flex flex-col items-end pr-2 gap-2.5 opacity-60">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  {idx % 3 === 0 && (
                    <span className="ruler-digits text-[9px] text-faint">
                      {String(idx * 10).padStart(2, '0')}
                    </span>
                  )}
                  <span className={`h-px bg-line-strong ${idx % 3 === 0 ? 'w-3' : 'w-1.5'}`} />
                </div>
              ))}
            </div>
            <div className="w-full border-y border-app/60 py-1 text-center">
              <span className="ruler-digits text-[10px] font-bold text-app-ink">
                {String(scrollPercent).padStart(3, '0')}%
              </span>
            </div>
          </div>

          {/* Vertical Rotated Active Tag */}
          <div className="flex items-center justify-center">
            <span
              className="hud-label text-faint whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              PDFCRAFT · WASM
            </span>
          </div>

          {/* Bottom Section Jump Links */}
          <nav className="pointer-events-auto flex flex-col items-end pr-2.5 gap-1.5">
            {[
              { id: 'pdfcraft', label: 'PDFCRAFT' },
              { id: 'highlights', label: 'HIGHLIGHTS' },
              { id: 'tools', label: 'TOOLS' },
              { id: 'compare', label: 'SPECS' },
              { id: 'faq', label: 'FAQ' },
              { id: 'directory', label: 'DIRECTORY' },
            ].map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="font-mono text-[9px] tracking-[0.14em] text-faint hover:text-app-ink transition-colors"
              >
                {sec.label}
              </a>
            ))}
          </nav>
        </aside>
      )}

      {/* Navbar */}
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
      <main className={`flex-1 flex flex-col ${activeTab === 'sign-edit' && currentBytes ? 'pb-0' : 'pb-24 lg:pb-0'}`}>
        {!currentBytes && activeTab === 'sign-edit' && !isDirectToolView ? (
          <div className="flex-1 flex flex-col">
            {/* ============================================================ */}
            {/* SECTION 01: #pdfcraft — HERO & INTERACTIVE WORKBENCH         */}
            {/* ============================================================ */}
            <section id="pdfcraft" className="w-full border-b border-line bg-bg">
              {/* Sticky Section Eyebrow */}
              <div className="sticky top-12 z-30 border-b border-line bg-bg/95 backdrop-blur-md">
                <div className="max-w-[1280px] mx-auto border-x border-line px-4 sm:px-6 h-10 flex items-center justify-between gap-2">
                  <span className="hud-label text-[9px] sm:text-[11px] tracking-[0.08em] sm:tracking-[0.15em] text-muted shrink-0">01 / PDFCRAFT</span>
                  <span className="hud-label text-[9px] sm:text-[11px] tracking-[0.06em] sm:tracking-[0.15em] text-faint truncate">CLIENT-SIDE WASM WORKBENCH</span>
                </div>
              </div>

              <div className="max-w-[1280px] mx-auto border-x border-line relative">
                <span className="tick absolute -top-[6px] -left-[6px] hidden xl:block" />
                <span className="tick absolute -top-[6px] -right-[6px] hidden xl:block" />

                {/* Centered Hero Editorial Stack */}
                <div className="px-4 py-8 sm:px-6 md:px-10 sm:py-16 md:py-20 text-center flex flex-col items-center scanlines">
                  {/* App Icon Square + 05 Badge */}
                  <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 bg-app flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.28)] border border-line-strong">
                      <img
                        src="/icon.png"
                        alt="PDFCraft Workbench Emblem"
                        className="w-14 h-14 sm:w-20 sm:h-20 object-contain drop-shadow"
                      />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-app text-white font-mono text-[11px] font-bold tracking-widest">
                        05
                      </span>
                      <span className="font-display text-xl sm:text-2xl text-app-ink tracking-tight">
                        PdfCraft
                      </span>
                    </div>
                  </div>

                  {/* Display Hero Headline (Archivo Stretch 118%) */}
                  <h1 className="max-w-4xl font-display text-4xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.035em] text-ink-strong">
                    The <span className="text-app-ink">zero-cloud</span> PDF workbench.
                  </h1>

                  {/* Lead Subhead */}
                  <p className="font-sans text-base sm:text-lg leading-relaxed text-muted max-w-xl mt-6">
                    Read, edit, sign, compress under 200KB, mask Aadhaar &amp; PII, and convert documents inside browser memory. No account, no telemetry, no cloud.
                  </p>

                  {/* 4-Button Rectangular CTA Row */}
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <label className="h-12 px-6 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-80 transition-opacity flex items-center gap-2 cursor-pointer">
                      <FileSignature className="w-4 h-4" />
                      <span>Open PDF Document</span>
                      <input
                        type="file"
                        accept=".pdf"
                        aria-label="Open PDF Document"
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const bytes = await file.arrayBuffer();
                            handleFileLoaded(file, bytes);
                          }
                        }}
                      />
                    </label>
                    <a
                      href="/upsc-pdf-compressor"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToTab('tools', 'upsc-pdf-compressor', undefined, 195);
                      }}
                      className="h-12 px-6 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] flex items-center gap-2 cursor-pointer"
                    >
                      <Shrink className="w-3.5 h-3.5 text-app-ink" />
                      <span>200KB Squeezer</span>
                    </a>
                    <a
                      href="/mask-aadhaar"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToTab('security-studio', undefined, undefined, undefined, undefined, 'pii_masker');
                      }}
                      className="h-12 px-6 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Mask Aadhaar / PII</span>
                    </a>
                    <button
                      onClick={() => setIsFeatureModalOpen(true)}
                      className="h-12 px-6 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>All 16 Tools (⌘K)</span>
                    </button>
                  </div>

                  {/* Platform Metadata Subline */}
                  <div className="mt-7 flex flex-col items-center gap-2">
                    <p className="hud-label text-faint">
                      CHROME · SAFARI · FIREFOX · EDGE · OFFLINE PWA · FREE AND OPEN SOURCE
                    </p>
                  </div>

                  {/* 6-Cell Hairline Action / Share Strip */}
                  <div className="mt-8 grid grid-cols-2 sm:flex sm:w-fit gap-px border border-line bg-line">
                    <button
                      onClick={() => document.getElementById('workbench-dropzone')?.scrollIntoView({ behavior: 'smooth' })}
                      className="h-9 px-3.5 bg-bg text-muted hover:text-ink hover:bg-bg-raised font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors cursor-pointer"
                    >
                      Dropzone ↓
                    </button>
                    <button
                      onClick={() => setIsPrivacyModalOpen(true)}
                      className="h-9 px-3.5 bg-bg text-muted hover:text-ink hover:bg-bg-raised font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors cursor-pointer"
                    >
                      Zero-Cloud Spec
                    </button>
                    <button
                      onClick={() => {
                        setComparisonCompetitor('ilovepdf');
                        setIsComparisonModalOpen(true);
                      }}
                      className="h-9 px-3.5 bg-bg text-muted hover:text-ink hover:bg-bg-raised font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors cursor-pointer"
                    >
                      vs iLovePDF
                    </button>
                    <button
                      onClick={() => {
                        setComparisonCompetitor('smallpdf');
                        setIsComparisonModalOpen(true);
                      }}
                      className="h-9 px-3.5 bg-bg text-muted hover:text-ink hover:bg-bg-raised font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors cursor-pointer"
                    >
                      vs Smallpdf
                    </button>
                    <a
                      href="/resume-builder"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToTab('resume');
                      }}
                      className="h-9 px-3.5 bg-bg text-muted hover:text-ink hover:bg-bg-raised font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors flex items-center justify-center"
                    >
                      ATS Resume
                    </a>
                    <a
                      href="https://github.com/Vishnu-cod/pdf-craft"
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-3.5 bg-bg text-muted hover:text-ink hover:bg-bg-raised font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors flex items-center justify-center"
                    >
                      GitHub
                    </a>
                  </div>
                </div>

                {/* Full-Width Interactive Dropzone Container */}
                <div id="workbench-dropzone" className="border-t border-line bg-bg-sunken">
                  <FileUploader
                    onFileLoaded={handleFileLoaded}
                    title="Drop any PDF here to launch the workbench"
                    subtitle="Edit, sign, redact, compress strictly under 50KB–200KB, or split pages completely offline."
                  />
                  <div className="px-4 py-2.5 border-t border-line bg-bg flex items-center justify-between">
                    <span className="hud-label text-faint">IN-MEMORY WEBASSEMBLY WORKBENCH</span>
                    <span className="hud-label text-app-ink">READY FOR INPUT</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 02: #highlights — WHAT'S INSIDE (3x2 HAIRLINE GRID)  */}
            {/* ============================================================ */}
            <section id="highlights" className="w-full border-b border-line bg-bg">
              <div className="sticky top-12 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
                <div className="max-w-[1280px] mx-auto border-x border-line px-4 sm:px-6 h-10 flex items-center justify-between">
                  <span className="hud-label text-muted">02 / HIGHLIGHTS</span>
                  <span className="hud-label text-faint">PDF WORKBENCH</span>
                </div>
              </div>

              <div className="max-w-[1280px] mx-auto border-x border-line relative">
                <span className="tick absolute -top-[6px] -left-[6px] hidden xl:block" />
                <span className="tick absolute -top-[6px] -right-[6px] hidden xl:block" />

                <div className="px-6 py-12 md:px-10 md:py-16 border-b border-line">
                  <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.02] tracking-[-0.035em] text-ink-strong">
                    What&apos;s <span className="text-app-ink">inside</span>.
                  </h2>
                </div>

                {/* 3x2 Hairline Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line">
                  {[
                    {
                      num: '01',
                      title: 'Zero-cloud rendering',
                      desc: 'Every byte is parsed, rendered, and exported in browser memory via WebAssembly and PDF.js. Zero packets hit any backend server.',
                    },
                    {
                      num: '02',
                      title: 'Strict KB target dialing',
                      desc: 'Dial exact file limits (48KB, 95KB, 195KB) for UPSC, SSC CGL, NEET, GATE, and USCIS portals while keeping document fonts sharp.',
                    },
                    {
                      num: '03',
                      title: 'Organize like cards',
                      desc: 'Rotate, delete, split, insert, and reorder PDF pages across multiple documents visually with zero upload wait times.',
                    },
                    {
                      num: '04',
                      title: 'Irreversible redaction & PII',
                      desc: 'True rasterization purges underlying XMP metadata and OCR text streams when masking 12-digit Aadhaar or PAN numbers.',
                    },
                    {
                      num: '05',
                      title: 'Convert without limits',
                      desc: 'Transform PDFs to editable Word (.docx), Excel spreadsheets, or high-resolution image ZIPs without 2-task daily paywalls.',
                    },
                    {
                      num: '06',
                      title: 'Contract & leak audits',
                      desc: 'Built-in Clause Risk Radar, digital signature verifier (CCA India / AATL), and privacy leak checker keep sensitive files safe.',
                    },
                  ].map((item) => (
                    <div
                      key={item.num}
                      className="bg-bg p-6 md:p-8 flex flex-col justify-between min-h-[210px] hover:bg-bg-raised transition-colors"
                    >
                      <div className="flex justify-end">
                        <span className="hud-label text-faint">{item.num}</span>
                      </div>
                      <div className="mt-8">
                        <h3 className="font-display text-2xl tracking-[-0.02em] text-ink-strong mb-2">
                          {item.title}
                        </h3>
                        <p className="font-sans text-sm text-muted leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 03: #tools — ALL 16 TOOLS HAIRLINE MATRIX            */}
            {/* ============================================================ */}
            <section id="tools" className="w-full border-b border-line bg-bg">
              <div className="sticky top-12 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
                <div className="max-w-[1280px] mx-auto border-x border-line px-4 sm:px-6 h-10 flex items-center justify-between">
                  <span className="hud-label text-muted">03 / WORKBENCH TOOLS</span>
                  <span className="hud-label text-faint">16 CORE UTILITIES · UNLIMITED</span>
                </div>
              </div>

              <div className="max-w-[1280px] mx-auto border-x border-line relative">
                <span className="tick absolute -top-[6px] -left-[6px] hidden xl:block" />
                <span className="tick absolute -top-[6px] -right-[6px] hidden xl:block" />

                {/* Header + Filter Strip */}
                <div className="px-6 py-10 md:px-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-line">
                  <div>
                    <h2 className="font-display text-3xl sm:text-5xl tracking-[-0.035em] text-ink-strong">
                      Built for <span className="text-app-ink">every</span> PDF workflow.
                    </h2>
                    <p className="font-sans text-sm text-muted mt-2 max-w-xl">
                      Select any tool below to launch directly inside your browser — zero accounts or paywalls.
                    </p>
                  </div>

                  {/* Filter Hairline Tabs */}
                  <div className="flex items-center gap-px bg-line border border-line overflow-x-auto scrollbar-none shrink-0">
                    {[
                      { id: 'all', label: 'All Tools' },
                      { id: 'popular', label: 'Popular' },
                      { id: 'security', label: 'Protect & Mask' },
                      { id: 'convert', label: 'Converters' },
                      { id: 'edit', label: 'Edit & Sign' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setBentoFilter(f.id as any)}
                        className={`px-3.5 min-h-[44px] flex items-center hud-label whitespace-nowrap transition-colors cursor-pointer ${
                          bentoFilter === f.id
                            ? 'bg-invert-bg text-invert-fg font-bold'
                            : 'bg-bg text-muted hover:text-ink hover:bg-bg-raised'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4-Column Hairline Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
                  {homeTools
                    .filter((t) => bentoFilter === 'all' || t.category.includes(bentoFilter))
                    .map((tool, index) => {
                      const Icon = tool.icon;
                      return (
                        <div
                          key={tool.id}
                          onClick={() => {
                            tool.action();
                            confetti({ particleCount: 35, spread: 50 });
                          }}
                          className="bg-bg hover:bg-bg-raised p-6 cursor-pointer group flex flex-col justify-between min-h-[220px] transition-colors"
                        >
                          <div className="flex items-center justify-between mb-6">
                            <span className="hud-label text-faint">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="hud-label text-[9px] text-app-ink border border-line px-1.5 py-0.5">
                              {tool.badge}
                            </span>
                          </div>

                          <div>
                            <div className="w-9 h-9 border border-line bg-bg-raised flex items-center justify-center text-ink-strong group-hover:bg-app group-hover:text-white group-hover:border-app transition-colors mb-4">
                              <Icon className="w-4 h-4" />
                            </div>
                            <h3 className="font-display text-lg text-ink-strong group-hover:text-app-ink transition-colors flex items-center justify-between gap-2">
                              <span>{tool.name}</span>
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-app-ink shrink-0" />
                            </h3>
                            <p className="font-sans text-xs text-muted mt-2 leading-relaxed">
                              {tool.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 04: #compare — ARCHITECTURAL COMPARISON MATRIX       */}
            {/* ============================================================ */}
            <section id="compare" className="w-full border-b border-line bg-bg">
              <div className="sticky top-12 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
                <div className="max-w-[1280px] mx-auto border-x border-line px-4 sm:px-6 h-10 flex items-center justify-between">
                  <span className="hud-label text-muted">04 / ARCHITECTURE &amp; SPECS</span>
                  <span className="hud-label text-faint">CLIENT WASM VS CLOUD SAAS</span>
                </div>
              </div>

              <div className="max-w-[1280px] mx-auto border-x border-line relative">
                <span className="tick absolute -top-[6px] -left-[6px] hidden xl:block" />
                <span className="tick absolute -top-[6px] -right-[6px] hidden xl:block" />

                <div className="px-6 py-10 md:px-10 border-b border-line flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-3xl sm:text-5xl tracking-[-0.035em] text-ink-strong">
                      Zero server uploads. <span className="text-app-ink">Verified</span>.
                    </h2>
                    <p className="font-sans text-sm text-muted mt-2 max-w-2xl">
                      Cloud editors force confidential tax returns, contracts, and KYC documents onto remote servers and lock limits behind paywalls. PDFCraft runs locally.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setComparisonCompetitor('ilovepdf');
                      setIsComparisonModalOpen(true);
                    }}
                    className="h-10 px-5 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] shrink-0 cursor-pointer"
                  >
                    Full Spec Comparison
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-line bg-bg-raised hud-label text-muted">
                        <th className="py-4 px-6">Capability</th>
                        <th className="py-4 px-6 text-app-ink font-bold">PdfCraft (Browser Wasm)</th>
                        <th className="py-4 px-6">iLovePDF</th>
                        <th className="py-4 px-6">Smallpdf</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      <tr className="hover:bg-bg-raised transition-colors">
                        <td className="py-4 px-6 font-medium text-ink-strong">Document Privacy</td>
                        <td className="py-4 px-6 text-ink-strong font-medium">
                          ✓ 100% Client-Side Memory (Zero Uploads)
                        </td>
                        <td className="py-4 px-6 text-muted">Uploaded to Remote Servers</td>
                        <td className="py-4 px-6 text-muted">Uploaded to Remote Servers</td>
                      </tr>
                      <tr className="hover:bg-bg-raised transition-colors">
                        <td className="py-4 px-6 font-medium text-ink-strong">Daily Free Quotas</td>
                        <td className="py-4 px-6 text-ink-strong font-medium">✓ Unlimited Forever</td>
                        <td className="py-4 px-6 text-muted">Capped free tasks</td>
                        <td className="py-4 px-6 text-muted">2 free tasks / day</td>
                      </tr>
                      <tr className="hover:bg-bg-raised transition-colors">
                        <td className="py-4 px-6 font-medium text-ink-strong">Strict KB Squeezer (&lt;200KB / 50KB)</td>
                        <td className="py-4 px-6 text-ink-strong font-medium">
                          ✓ Exact Target Dial (UPSC / SSC / USCIS)
                        </td>
                        <td className="py-4 px-6 text-muted">Generic presets only</td>
                        <td className="py-4 px-6 text-muted">Pro subscription required</td>
                      </tr>
                      <tr className="hover:bg-bg-raised transition-colors">
                        <td className="py-4 px-6 font-medium text-ink-strong">Aadhaar / PII Redaction</td>
                        <td className="py-4 px-6 text-ink-strong font-medium">✓ 1-Click Auto-Mask + Purge</td>
                        <td className="py-4 px-6 text-muted">Not Available</td>
                        <td className="py-4 px-6 text-muted">Not Available</td>
                      </tr>
                      <tr className="hover:bg-bg-raised transition-colors">
                        <td className="py-4 px-6 font-medium text-ink-strong">ATS Resume Studio</td>
                        <td className="py-4 px-6 text-ink-strong font-medium">✓ Free Vector PDF Export</td>
                        <td className="py-4 px-6 text-muted">Not Available</td>
                        <td className="py-4 px-6 text-muted">Not Available</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 05: #faq — FREQUENTLY ASKED QUESTIONS                */}
            {/* ============================================================ */}
            <section id="faq" className="w-full border-b border-line bg-bg">
              <div className="sticky top-12 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
                <div className="max-w-[1280px] mx-auto border-x border-line px-4 sm:px-6 h-10 flex items-center justify-between">
                  <span className="hud-label text-muted">05 / FAQ &amp; VERIFICATION</span>
                  <span className="hud-label text-faint">OPEN SPECIFICATIONS</span>
                </div>
              </div>

              <div className="max-w-[1280px] mx-auto border-x border-line relative">
                <span className="tick absolute -top-[6px] -left-[6px] hidden xl:block" />
                <span className="tick absolute -top-[6px] -right-[6px] hidden xl:block" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-line">
                  <div className="lg:col-span-4 bg-bg p-6 md:p-10 flex flex-col justify-between">
                    <div>
                      <span className="hud-label text-app-ink">TRANSPARENCY</span>
                      <h2 className="font-display text-3xl sm:text-4xl tracking-[-0.03em] text-ink-strong mt-3">
                        Questions answered cleanly.
                      </h2>
                      <p className="font-sans text-sm text-muted mt-3 leading-relaxed">
                        Verify our WebAssembly architecture in DevTools or offline airplane mode anytime.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsPrivacyModalOpen(true)}
                      className="mt-8 h-10 px-5 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] w-fit cursor-pointer"
                    >
                      Read Security Audit
                    </button>
                  </div>

                  <div className="lg:col-span-8 bg-line flex flex-col gap-px">
                    {[
                      {
                        q: 'Are my PDF documents uploaded to external servers?',
                        a: 'No. PDFCraft executes 100% inside browser memory using WebAssembly and PDF.js. Your files never leave your machine—open Chrome DevTools Network tab to confirm zero outbound file packets.',
                      },
                      {
                        q: 'Is PDFCraft really free with no daily limits or paywalls?',
                        a: 'Yes. Because all processing runs locally on your own CPU/GPU instead of remote cloud servers, we have zero server compute bills to recover. All tools are 100% free and unlimited.',
                      },
                      {
                        q: 'How do I compress a PDF strictly under 200KB or 50KB for UPSC / SSC?',
                        a: 'Launch the Target Size Squeezer (/upsc-pdf-compressor or /compress-pdf-50kb), drop your PDF, select the safe ceiling (195KB or 48KB), and export with high-contrast bicubic font preservation.',
                      },
                      {
                        q: 'Does PDFCraft actually destroy masked Aadhaar or redacted text?',
                        a: 'Yes. Rather than drawing a cosmetic black box on top of readable text, our redactor flattens pages cleanly and purges underlying XMP metadata and hidden text streams.',
                      },
                      {
                        q: 'Does it work offline after the page loads?',
                        a: 'Yes. As a Progressive Web App, you can install PDFCraft locally or disconnect Wi-Fi completely and run merges, splits, signatures, and compressions offline.',
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-bg">
                        <button
                          onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                          className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-bg-raised transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <span className="hud-label text-faint">0{idx + 1}</span>
                            <span className="font-display text-base sm:text-lg text-ink-strong">
                              {item.q}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-muted shrink-0 transition-transform duration-200 ${
                              openFaqIndex === idx ? 'rotate-180 text-app-ink' : ''
                            }`}
                          />
                        </button>
                        {openFaqIndex === idx && (
                          <div className="px-6 pb-5 pt-1 pl-14 font-sans text-sm text-muted leading-relaxed">
                            {item.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* SECTION 06: CANONICAL DIRECTORY & COMMUNITY CTA              */}
            {/* ============================================================ */}
            <SeoFooter />

            {/* Final Pre-Footer Centered CTA (ArtCraft Signature Block) */}
            <section id="start" className="w-full border-b border-line bg-bg">
              <div className="max-w-[1280px] mx-auto border-x border-line px-6 py-20 md:py-28 text-center flex flex-col items-center relative">
                <span className="tick absolute -top-[6px] -left-[6px] hidden xl:block" />
                <span className="tick absolute -top-[6px] -right-[6px] hidden xl:block" />
                <p className="hud-label text-app-ink mb-4">OPEN SOURCE · FREE FOREVER</p>
                <h2 className="font-display text-4xl sm:text-6xl md:text-7xl leading-[0.98] tracking-[-0.04em] text-ink-strong max-w-3xl">
                  Built for <span className="text-app-ink">privacy</span> first.
                </h2>
                <p className="font-sans text-base text-muted max-w-lg mt-5">
                  Star the open-source repository on GitHub, audit every line of WebAssembly PDF code, or start editing right now in your browser.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => document.getElementById('workbench-dropzone')?.scrollIntoView({ behavior: 'smooth' })}
                    className="h-12 px-7 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    Launch Workbench
                  </button>
                  <a
                    href="https://github.com/Vishnu-cod/pdf-craft"
                    target="_blank"
                    rel="noreferrer"
                    className="h-12 px-7 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] flex items-center"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* Active Tool Views wrapped in ArtCraft Workspace Harmonizer */
          <div className="flex-1 flex flex-col artcraft-workspace max-w-[1280px] w-full min-w-0 overflow-x-hidden mx-auto border-x border-line bg-bg animate-in fade-in duration-150">
            <div className="border-b border-line bg-bg-raised px-4 sm:px-6 min-h-[44px] flex items-center justify-between gap-2">
              <span className="hud-label text-[9px] sm:text-[11px] text-app-ink truncate">
                ACTIVE WORKBENCH · {activeTab.toUpperCase()}
              </span>
              <button
                onClick={handleResetFile}
                className="hud-label text-[9px] sm:text-[11px] text-muted hover:text-ink cursor-pointer shrink-0 min-h-[44px] flex items-center px-1"
              >
                ← Return Home
              </button>
            </div>
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
                    <div className="max-w-3xl mx-auto py-8 sm:py-14 px-4 w-full space-y-6">
                      <div className="border-b border-line pb-5">
                        <p className="hud-label text-app-ink mb-2">ZERO-ACCOUNT VECTOR SIGNER &amp; REDACTOR</p>
                        <h1 className="font-display text-2xl sm:text-4xl tracking-[-0.03em] text-ink-strong">
                          {activeRouteTitle || 'Sign PDF Free Online — No Account Required'}
                        </h1>
                        <p className="font-sans text-xs sm:text-sm text-muted mt-1.5 leading-relaxed">
                          {activeRouteDescription ||
                            'Draw or type crisp vector signatures, place dates, or redact confidential text directly inside your browser memory.'}
                        </p>
                      </div>
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
                    <div className="max-w-3xl mx-auto py-16 px-4 w-full">
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
                    routeTitle={activeRouteTitle}
                    routeSubtitle={activeRouteDescription}
                    onFileLoaded={handleFileLoaded}
                  />
                )}

                {activeTab === 'resume' && <ResumeBuilder />}
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </main>

      {/* ArtCraft 5-Column Hairline Footer */}
      <footer className="w-full border-t border-line bg-bg text-xs text-muted mb-12 lg:mb-0">
        <div className="max-w-[1280px] mx-auto border-x border-line">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-px bg-line">
            {/* Brand Column */}
            <div className="bg-bg p-6 md:p-8 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 bg-app flex items-center justify-center">
                    <img src="/icon.png" alt="PDFCraft" className="w-5 h-5 object-contain" />
                  </div>
                  <span className="font-display text-lg text-ink-strong">
                    Pdf<span className="text-app-ink">Craft</span>
                  </span>
                </div>
                <p className="font-sans text-xs text-muted leading-relaxed max-w-xs">
                  Open-source client-side PDF workbench. Read, organize, sign, mask PII, and compress inside browser memory without cloud uploads or paywalls.
                </p>
              </div>
              <p className="hud-label text-faint">ZERO TELEMETRY · 100% LOCAL</p>
            </div>

            {/* Col 2: Compression */}
            <div className="bg-bg p-6 md:p-8 space-y-3">
              <p className="hud-label text-ink-strong mb-3">Compression</p>
              <ul className="space-y-2">
                <li><a href="/compress-pdf-50kb" onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'size-squeezer-50kb', undefined, 48); }} className="hover:text-app-ink transition-colors">Compress 50KB</a></li>
                <li><a href="/compress-pdf-100kb" onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'size-squeezer-100kb', undefined, 95); }} className="hover:text-app-ink transition-colors">Compress 100KB</a></li>
                <li><a href="/compress-pdf-200kb" onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'size-squeezer-200kb', undefined, 195); }} className="hover:text-app-ink transition-colors">Compress 200KB</a></li>
                <li><a href="/upsc-pdf-compressor" onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'upsc-pdf-compressor', undefined, 195); }} className="hover:text-app-ink transition-colors">UPSC Exam PDF</a></li>
                <li><a href="/ssc-cgl-signature-photo-compressor" onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'ssc-cgl-signature-photo-compressor', undefined, 48); }} className="hover:text-app-ink transition-colors">SSC Signature 50KB</a></li>
              </ul>
            </div>

            {/* Col 3: Workbench */}
            <div className="bg-bg p-6 md:p-8 space-y-3">
              <p className="hud-label text-ink-strong mb-3">Workbench</p>
              <ul className="space-y-2">
                <li><a href="/sign-pdf" onClick={(e) => { e.preventDefault(); navigateToTab('sign-edit'); }} className="hover:text-app-ink transition-colors">Edit &amp; Sign PDF</a></li>
                <li><a href="/merge-pdf" onClick={(e) => { e.preventDefault(); navigateToTab('organize'); }} className="hover:text-app-ink transition-colors">Merge &amp; Organize</a></li>
                <li><a href="/split-pdf" onClick={(e) => { e.preventDefault(); navigateToTab('split'); }} className="hover:text-app-ink transition-colors">Split PDF Pages</a></li>
                <li><a href="/redact-pdf" onClick={(e) => { e.preventDefault(); navigateToTab('sign-edit', 'redact'); }} className="hover:text-app-ink transition-colors">Redact Document</a></li>
                <li><a href="/pdf-to-word" onClick={(e) => { e.preventDefault(); navigateToTab('convert', undefined, 'pdf-to-word'); }} className="hover:text-app-ink transition-colors">PDF to Word</a></li>
              </ul>
            </div>

            {/* Col 4: Security */}
            <div className="bg-bg p-6 md:p-8 space-y-3">
              <p className="hud-label text-ink-strong mb-3">Security</p>
              <ul className="space-y-2">
                <li><a href="/mask-aadhaar" onClick={(e) => { e.preventDefault(); navigateToTab('security-studio', undefined, undefined, undefined, undefined, 'pii_masker'); }} className="hover:text-app-ink transition-colors">Mask Aadhaar Card</a></li>
                <li><a href="/pdf-leak-checker" onClick={(e) => { e.preventDefault(); navigateToTab('security-studio', undefined, undefined, undefined, undefined, 'leak_checker'); }} className="hover:text-app-ink transition-colors">Privacy Leak Check</a></li>
                <li><a href="/verify-signature" onClick={(e) => { e.preventDefault(); navigateToTab('security-studio', undefined, undefined, undefined, undefined, 'signature_validator'); }} className="hover:text-app-ink transition-colors">Verify eSignature</a></li>
                <li><a href="/contract-risk-radar" onClick={(e) => { e.preventDefault(); navigateToTab('tools', 'risk-radar'); }} className="hover:text-app-ink transition-colors">Contract Risk Radar</a></li>
                <li><a href="/protect-pdf" onClick={(e) => { e.preventDefault(); navigateToTab('security', undefined, undefined, undefined, 'protect'); }} className="hover:text-app-ink transition-colors">AES-256 Encrypt</a></li>
              </ul>
            </div>

            {/* Col 5: Resources */}
            <div className="bg-bg p-6 md:p-8 space-y-3">
              <p className="hud-label text-ink-strong mb-3">Resources</p>
              <ul className="space-y-2">
                <li><a href="/resume-builder" onClick={(e) => { e.preventDefault(); navigateToTab('resume'); }} className="hover:text-app-ink transition-colors">ATS Resume Studio</a></li>
                <li><a href="/compare/pdfcraft-vs-ilovepdf" onClick={(e) => { e.preventDefault(); setComparisonCompetitor('ilovepdf'); setIsComparisonModalOpen(true); }} className="hover:text-app-ink transition-colors">vs iLovePDF</a></li>
                <li><a href="/compare/pdfcraft-vs-smallpdf" onClick={(e) => { e.preventDefault(); setComparisonCompetitor('smallpdf'); setIsComparisonModalOpen(true); }} className="hover:text-app-ink transition-colors">vs Smallpdf</a></li>
                <li><a href="/portfolio.html" className="hover:text-app-ink transition-colors">SEO Portfolio</a></li>
                <li><button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-app-ink transition-colors text-left cursor-pointer">Privacy Architecture</button></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="border-t border-line px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="hud-label text-faint">© 2026 PDFCraft · Free and Open Source</span>
            <span className="hud-label text-muted">100% Client-Side WebAssembly</span>
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

      {/* Contrarian Competitor Comparison Modal */}
      <ComparisonModal
        isOpen={isComparisonModalOpen}
        initialCompetitor={comparisonCompetitor}
        onClose={() => {
          setIsComparisonModalOpen(false);
          if (window.location.pathname.startsWith('/compare/')) {
            window.history.pushState(null, '', '/');
          }
        }}
        onSelectTool={(tab) => navigateToTab(tab as ActiveTab)}
      />
    </div>
  );
};

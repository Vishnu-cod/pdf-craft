import React, { useState, useMemo } from 'react';
import { ActiveTab } from '../types';
import {
  Search,
  X,
  Sparkles,
  GraduationCap,
  Target,
  Mail,
  QrCode,
  Camera,
  Scale,
  Shrink,
  GitCompare,
  Table2,
  Wand2,
  FileSignature,
  Layers,
  ArrowLeftRight,
  FileText,
  FileSpreadsheet,
  FileImage,
  ArrowRight,
  Zap,
  Lock,
  Unlock,
  Scissors,
  RotateCw,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type DirectoryCategory =
  | 'all'
  | 'edit'
  | 'organize'
  | 'convert'
  | 'compress'
  | 'security'
  | 'productivity'
  | 'resume';

export interface ToolItem {
  id: string;
  name: string;
  category: DirectoryCategory;
  badge: string;
  badgeColor: string;
  icon: any;
  iconBg: string;
  description: string;
  targetTab: ActiveTab;
  subTool?: 'risk-radar' | 'size-squeezer' | 'diff' | 'table-extract' | 'doctor';
  converter?: 'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-images' | 'images-to-pdf' | 'word-to-pdf' | 'word-to-images';
  targetKB?: number;
  securityMode?: 'protect' | 'unlock';
  securityStudioSubTab?: 'pii_masker' | 'signature_validator' | 'leak_checker';
  hotkey?: string;
}

interface FeatureDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (
    tab: ActiveTab,
    subTool?: string,
    converter?: any,
    securityMode?: 'protect' | 'unlock',
    targetKB?: number,
    securityStudioSubTab?: 'pii_masker' | 'signature_validator' | 'leak_checker'
  ) => void;
}

export const FeatureDirectoryModal: React.FC<FeatureDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DirectoryCategory>('all');

  const tools: ToolItem[] = [
    // 1. Edit & Sign
    {
      id: 'edit-sign',
      name: 'Edit & Sign with Mobile Sync',
      category: 'edit',
      badge: 'QR Touch Pad',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: FileSignature,
      iconBg: 'from-blue-600 to-indigo-600',
      description: 'Sign with your touchscreen via QR sync, add text notes, dates, and official verification stamps.',
      targetTab: 'sign-edit',
    },
    {
      id: 'redact-pdf',
      name: 'Black Out Text (Permanent)',
      category: 'edit',
      badge: 'Permanent Redaction',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: Eye,
      iconBg: 'from-rose-600 to-red-600',
      description: 'Permanently black out sensitive numbers, text, emails, and account details directly in browser.',
      targetTab: 'sign-edit',
      subTool: 'risk-radar', // marker handled in routing
    },

    // 2. Organize & Split
    {
      id: 'organize-merge',
      name: 'Merge & Reorder Pages',
      category: 'organize',
      badge: 'Multi-PDF Joiner',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      icon: Layers,
      iconBg: 'from-teal-600 to-emerald-600',
      description: 'Drag to reorder page sequence, append multiple PDF documents, and export in exact user-defined order.',
      targetTab: 'organize',
    },
    {
      id: 'split-pdf',
      name: 'Split PDF & Extract Pages',
      category: 'organize',
      badge: 'ZIP Archive',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      icon: Scissors,
      iconBg: 'from-indigo-600 to-purple-600',
      description: 'Break documents into individual pages, extract custom ranges (e.g. 1-3, 4-6), or split every N pages into a ZIP.',
      targetTab: 'split',
    },
    {
      id: 'rotate-pdf',
      name: 'Rotate PDF Pages',
      category: 'organize',
      badge: '90° / 180° / 270°',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      icon: RotateCw,
      iconBg: 'from-cyan-600 to-blue-600',
      description: 'Fix upside-down and sideways scanned sheets permanently with 1-click rotation.',
      targetTab: 'organize',
    },
    {
      id: 'delete-pages',
      name: 'Delete Unwanted Pages',
      category: 'organize',
      badge: 'Visual Trimmer',
      badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      icon: Trash2,
      iconBg: 'from-slate-600 to-slate-800',
      description: 'Visually select and remove unwanted blank pages or outdated appendix sheets.',
      targetTab: 'organize',
    },

    // 3. Document Converters
    {
      id: 'pdf-to-word',
      name: 'PDF ➔ Word (.docx)',
      category: 'convert',
      badge: 'Editable DOCX',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: FileText,
      iconBg: 'from-blue-600 to-sky-600',
      description: 'Converts PDF documents into formatted Microsoft Word files ready for editing.',
      targetTab: 'convert',
      converter: 'pdf-to-word',
    },
    {
      id: 'pdf-to-excel',
      name: 'PDF ➔ Excel (.xlsx)',
      category: 'convert',
      badge: 'Multi-Sheet Workbook',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: FileSpreadsheet,
      iconBg: 'from-emerald-600 to-green-600',
      description: 'Extracts numbers and columnar data from multi-page PDFs into formatted spreadsheets.',
      targetTab: 'convert',
      converter: 'pdf-to-excel',
    },
    {
      id: 'pdf-to-images',
      name: 'PDF ➔ Images (.zip)',
      category: 'convert',
      badge: 'High-Res PNG',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: FileImage,
      iconBg: 'from-amber-600 to-yellow-600',
      description: 'Renders crisp high-resolution pages into a single downloadable .ZIP archive.',
      targetTab: 'convert',
      converter: 'pdf-to-images',
    },
    {
      id: 'images-to-pdf',
      name: 'Images ➔ Single PDF',
      category: 'convert',
      badge: 'JPG / PNG / WebP',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      icon: Zap,
      iconBg: 'from-violet-600 to-fuchsia-600',
      description: 'Combines multiple photos, receipts, or screenshots into one clean document.',
      targetTab: 'convert',
      converter: 'images-to-pdf',
    },

    // 4. Compress
    {
      id: 'size-squeezer-50kb',
      name: 'Compress PDF to 50KB',
      category: 'compress',
      badge: 'Exam Portal Cap',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Shrink,
      iconBg: 'from-emerald-600 to-teal-600',
      description: 'Strictly downscales document under 50KB for Indian exam photos, signatures, and certificates.',
      targetTab: 'tools',
      subTool: 'size-squeezer',
      targetKB: 48,
    },
    {
      id: 'size-squeezer-100kb',
      name: 'Compress PDF to 100KB',
      category: 'compress',
      badge: 'UPSC / SSC Cap',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Shrink,
      iconBg: 'from-emerald-600 to-cyan-600',
      description: 'Compresses PDF files strictly under 100KB for government job portals and bank exams.',
      targetTab: 'tools',
      subTool: 'size-squeezer',
      targetKB: 95,
    },
    {
      id: 'size-squeezer-200kb',
      name: 'Compress PDF Under 200KB',
      category: 'compress',
      badge: 'Admissions Limit',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Shrink,
      iconBg: 'from-emerald-600 to-cyan-600',
      description: 'Compresses PDFs strictly under 200KB for college admissions and hiring portal uploads.',
      targetTab: 'tools',
      subTool: 'size-squeezer',
      targetKB: 195,
    },
    {
      id: 'upsc-pdf-compressor',
      name: 'UPSC Exam PDF Squeezer (200KB)',
      category: 'compress',
      badge: 'UPSC Portal Safe',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: Shrink,
      iconBg: 'from-blue-600 to-indigo-600',
      description: 'Compress certificates and ID scans strictly under 200KB for UPSC online applications.',
      targetTab: 'tools',
      subTool: 'size-squeezer',
      targetKB: 195,
    },
    {
      id: 'uscis-visa-pdf-compressor',
      name: 'USCIS Visa PDF Squeezer (500KB)',
      category: 'compress',
      badge: 'Visa / CEAC Limit',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      icon: Shrink,
      iconBg: 'from-teal-600 to-emerald-600',
      description: 'Compress multi-page tax forms (1040) and passport scans for CEAC, DS-160, and USCIS portals.',
      targetTab: 'tools',
      subTool: 'size-squeezer',
      targetKB: 495,
    },

    // 5. Security & Privacy
    {
      id: 'pdf-leak-checker',
      name: 'PDF Privacy & Metadata Leak Checker',
      category: 'security',
      badge: 'Zero Telemetry',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: Search,
      iconBg: 'from-amber-600 to-orange-600',
      description: 'Audit PDFs for hidden author info, machine paths, raw XMP GUID tracking telemetry, and embedded links.',
      targetTab: 'security-studio',
      securityStudioSubTab: 'leak_checker',
    },
    {
      id: 'mask-pii-aadhaar',
      name: 'Mask Aadhaar & IDs',
      category: 'security',
      badge: 'Auto Hide',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: EyeOff,
      iconBg: 'from-rose-600 to-red-600',
      description: 'Auto-detect and black out 12-digit Aadhaar, PAN card, SSN, credit cards & phone numbers before sharing.',
      targetTab: 'security-studio',
      securityStudioSubTab: 'pii_masker',
    },
    {
      id: 'verify-digital-signature',
      name: 'Verify Digital Signature',
      category: 'security',
      badge: 'CCA India & Adobe',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: FileCheck2,
      iconBg: 'from-emerald-600 to-teal-600',
      description: 'Validate eSignatures from eMudhra, Capricorn, VSign, DigiLocker & Adobe to verify documents are untampered.',
      targetTab: 'security-studio',
      securityStudioSubTab: 'signature_validator',
    },
    {
      id: 'protect-pdf',
      name: 'Lock with Password',
      category: 'security',
      badge: 'AES-256 Military Grade',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      icon: Lock,
      iconBg: 'from-indigo-600 to-violet-600',
      description: 'Encrypt documents with user and owner passwords. Set permissions for printing, copying, and editing.',
      targetTab: 'security',
      securityMode: 'protect',
    },
    {
      id: 'unlock-pdf',
      name: 'Remove Password',
      category: 'security',
      badge: 'Owner Decryption',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Unlock,
      iconBg: 'from-emerald-600 to-teal-600',
      description: 'Accepts your password and exports a clean, permanent unencrypted PDF copy with zero restrictions.',
      targetTab: 'security',
      securityMode: 'unlock',
    },

    // 6. Productivity & Legal
    {
      id: 'risk-radar',
      name: 'Check Contract Risks',
      category: 'productivity',
      badge: 'Clause Auditing',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: Scale,
      iconBg: 'from-rose-600 to-amber-600',
      description: 'Detects predatory IP traps, non-competes, and unlimited liability clauses with 1-click counter-proposals.',
      targetTab: 'tools',
      subTool: 'risk-radar',
    },
    {
      id: 'contract-diff',
      name: 'Compare Two PDFs',
      category: 'productivity',
      badge: 'Side-by-Side',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      icon: GitCompare,
      iconBg: 'from-indigo-600 to-blue-600',
      description: 'Compare two PDF contracts side-by-side or in overlay mode to catch sneaky clause changes.',
      targetTab: 'tools',
      subTool: 'diff',
    },
    {
      id: 'table-extract',
      name: 'Extract Tables to Excel',
      category: 'productivity',
      badge: 'Instant .xlsx',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: Table2,
      iconBg: 'from-amber-600 to-orange-600',
      description: 'Extracts numbers and tables from invoices and bank statements into formatted Excel spreadsheets.',
      targetTab: 'tools',
      subTool: 'table-extract',
    },
    {
      id: 'document-doctor',
      name: 'Clean & Brighten Scans',
      category: 'productivity',
      badge: 'Scan Restorer',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: Wand2,
      iconBg: 'from-purple-600 to-indigo-600',
      description: 'Removes shadows, whitens yellowed scanned backgrounds, and sharpens faded photocopy text.',
      targetTab: 'tools',
      subTool: 'doctor',
    },

    // 7. Resume Tools
    {
      id: 'resume-builder',
      name: 'ATS Resume Builder',
      category: 'resume',
      badge: '60s Vector PDF',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: GraduationCap,
      iconBg: 'from-indigo-600 to-violet-600',
      description: 'Import old PDF resumes, edit directly on canvas, and export vector A4/Letter PDFs.',
      targetTab: 'resume',
    },
    {
      id: 'ats-matcher',
      name: 'ATS Keyword Matcher',
      category: 'resume',
      badge: 'Jobscan Alternative',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      icon: Target,
      iconBg: 'from-emerald-600 to-teal-600',
      description: 'Compare resume against job posting, check recruiter keyword match %, and add missing skills in 1 click.',
      targetTab: 'resume',
    },
    {
      id: 'cover-letter',
      name: 'Matching Cover Letter',
      category: 'resume',
      badge: 'Auto-Synced',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      icon: Mail,
      iconBg: 'from-violet-600 to-purple-600',
      description: 'Auto-generates a synchronized 1-page cover letter matching your resume typography, colors, and achievements.',
      targetTab: 'resume',
    },
    {
      id: 'qr-portfolio',
      name: 'Vector QR Code Generator',
      category: 'resume',
      badge: 'Scannable Vector',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      icon: QrCode,
      iconBg: 'from-sky-600 to-indigo-600',
      description: 'Embeds a high-precision QR code linking recruiters straight to your LinkedIn or portfolio.',
      targetTab: 'resume',
    },
    {
      id: 'headshot-studio',
      name: 'Headshot & Avatar Studio',
      category: 'resume',
      badge: 'Crop & Backdrop',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      icon: Camera,
      iconBg: 'from-pink-600 to-rose-600',
      description: 'Crop, zoom, shape into circle/squircle, and apply studio backdrops and matching theme rings.',
      targetTab: 'resume',
    },
  ];

  const categories: { id: DirectoryCategory; label: string }[] = [
    { id: 'all', label: 'All Tools (22)' },
    { id: 'edit', label: 'Edit & Sign' },
    { id: 'organize', label: 'Organize & Split' },
    { id: 'convert', label: 'Convert' },
    { id: 'compress', label: 'Compress' },
    { id: 'security', label: 'Security' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'resume', label: 'Resume Suite' },
  ];

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.badge.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [tools, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-bg border border-line-strong overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Input */}
        <div className="p-5 border-b border-line bg-bg-raised flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-app flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-lg text-ink-strong tracking-tight">
                  Command Palette · All Tools
                </h2>
                <p className="hud-label text-faint">
                  Launch any utility in browser memory · Zero server uploads
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close command palette"
              className="p-2 border border-line text-muted hover:text-ink hover:border-line-strong transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search tools, formats (e.g. '200kb', 'aadhaar', 'docx', 'split', 'redact')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-bg border border-line-strong text-xs font-mono text-ink placeholder-faint focus:outline-none focus:border-app-ink"
            />
          </div>

          {/* Category Filter Hairline Rail */}
          <div className="flex items-center gap-px bg-line border border-line overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 hud-label whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-invert-bg text-invert-fg font-bold'
                    : 'bg-bg text-muted hover:text-ink hover:bg-bg-raised'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Hairline Grid */}
        <div className="overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-line">
          {filteredTools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => {
                  onSelectTool(
                    tool.targetTab,
                    tool.subTool,
                    tool.converter,
                    tool.securityMode,
                    tool.targetKB,
                    tool.securityStudioSubTab
                  );
                  confetti({ particleCount: 30, spread: 40 });
                  onClose();
                }}
                className="p-5 bg-bg hover:bg-bg-raised transition-colors cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="hud-label text-faint">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <Icon className="w-4 h-4 text-ink-strong group-hover:text-app-ink transition-colors" />
                    </div>
                    <span className="hud-label text-[9px] text-app-ink border border-line px-1.5 py-0.5">
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-sm text-ink-strong group-hover:text-app-ink transition-colors flex items-center justify-between gap-2">
                    <span>{tool.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-app-ink shrink-0" />
                  </h3>

                  <p className="font-sans text-xs text-muted mt-1.5 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            );
          })}

          {filteredTools.length === 0 && (
            <div className="col-span-2 py-12 bg-bg text-center text-muted font-mono text-xs">
              No tools found matching &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-bg-raised border-t border-line flex items-center justify-between">
          <span className="hud-label text-faint">
            TIP: PRESS <kbd className="border border-line px-1 text-ink-strong">⌘K</kbd> ANYWHERE
          </span>
          <span className="hud-label text-app-ink">100% FREE · NO SIGN-UP</span>
        </div>
      </div>
    </div>
  );
};

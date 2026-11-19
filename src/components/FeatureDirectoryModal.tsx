import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ToolItem {
  id: string;
  name: string;
  category: 'resume' | 'legal' | 'convert' | 'edit';
  badge: string;
  badgeColor: string;
  icon: any;
  iconBg: string;
  description: string;
  targetTab: ActiveTab;
  subTool?: string;
  hotkey?: string;
}

interface FeatureDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tab: ActiveTab, subTool?: string) => void;
}

export const FeatureDirectoryModal: React.FC<FeatureDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const tools: ToolItem[] = [
    // Resume & Career
    {
      id: 'resume-builder',
      name: '60-Second Resume Studio',
      category: 'resume',
      badge: 'Zero Dummy Data',
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

    // AI & Legal Pro Tools
    {
      id: 'risk-radar',
      name: 'AI Contract Risk Radar',
      category: 'legal',
      badge: 'Ironclad Alt',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: Scale,
      iconBg: 'from-rose-600 to-amber-600',
      description: 'Detects predatory IP traps, non-competes, and unlimited liability clauses with 1-click counter-proposals.',
      targetTab: 'tools',
      subTool: 'risk-radar',
    },
    {
      id: 'size-squeezer',
      name: 'Target Size Squeezer',
      category: 'legal',
      badge: 'Portal Cap Cruncher',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Shrink,
      iconBg: 'from-emerald-600 to-cyan-600',
      description: 'Compresses and downscales PDFs strictly under 100 KB, 195 KB (200 KB cap), or 490 KB (500 KB cap).',
      targetTab: 'tools',
      subTool: 'size-squeezer',
    },
    {
      id: 'contract-diff',
      name: 'Visual Contract Diff',
      category: 'legal',
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
      name: 'Table to Excel Extractor',
      category: 'legal',
      badge: 'Instant .xlsx',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: Table2,
      iconBg: 'from-amber-600 to-orange-600',
      description: 'Extracts tabular coordinates from invoices and bank statements into formatted Excel spreadsheets.',
      targetTab: 'tools',
      subTool: 'table-extract',
    },
    {
      id: 'document-doctor',
      name: 'Document Doctor',
      category: 'legal',
      badge: 'Scan Restorer',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: Wand2,
      iconBg: 'from-purple-600 to-indigo-600',
      description: 'Removes yellowing, whitens scanned backgrounds, and sharpens faded photocopy text.',
      targetTab: 'tools',
      subTool: 'doctor',
    },

    // Edit & Sign
    {
      id: 'edit-sign',
      name: 'Edit & Sign with Mobile Sync',
      category: 'edit',
      badge: 'QR Mobile Signature',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: FileSignature,
      iconBg: 'from-blue-600 to-indigo-600',
      description: 'Sign via touchscreen on phone, add dates, stamps, text notes, and permanent burn-in redactions.',
      targetTab: 'sign-edit',
    },
    {
      id: 'organize-merge',
      name: 'Organize, Reorder & Merge',
      category: 'edit',
      badge: 'Visual Page Cards',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      icon: Layers,
      iconBg: 'from-teal-600 to-emerald-600',
      description: 'Drag to reorder sheets, fix upside-down scanned pages (90° rotation), and combine multiple PDFs.',
      targetTab: 'organize',
    },

    // Conversions
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
    },
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

  // Handle keyboard ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 id="modal-title" className="text-base sm:text-lg font-black text-white">All PDFCraft Pro Super-Tools</h2>
                <p className="text-xs text-slate-400">
                  100% Free • Unlimited Client-Side Power • Zero Cloud Uploads
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close feature directory"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search all 16 PDF tools"
              placeholder="Search features (e.g. ATS, Cover Letter, Squeezer, Word, Redact, Sign)..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            {[
              { id: 'all', label: `All Tools (${tools.length})` },
              { id: 'resume', label: 'Resume & Career (5)' },
              { id: 'legal', label: 'AI & Legal Pro (5)' },
              { id: 'convert', label: 'Converters (4)' },
              { id: 'edit', label: 'Edit & Sign (2)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.targetTab, tool.subTool);
                  onClose();
                  confetti({ particleCount: 30, spread: 40 });
                }}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-md hover:shadow-indigo-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${tool.iconBg} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${tool.badgeColor}`}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition flex items-center gap-1.5">
                    <span>{tool.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 text-indigo-400" />
                  </h4>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Local & Private</span>
                  </span>
                  <span className="font-semibold text-indigo-400 group-hover:underline">
                    Launch Tool ➔
                  </span>
                </div>
              </div>
            );
          })}

          {filteredTools.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <p className="text-sm">No tools found matching &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-indigo-400 hover:underline font-semibold"
              >
                Clear search query
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">K</kbd> anywhere to open this directory</span>
          <span className="text-emerald-400 font-semibold">16 Free Features Available</span>
        </div>
      </div>
    </div>
  );
};

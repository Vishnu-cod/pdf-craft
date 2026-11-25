import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowRight,
  Info,
  Scale,
} from 'lucide-react';

export type CompetitorId = 'ilovepdf' | 'smallpdf' | 'adobe';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCompetitor?: CompetitorId;
  onSelectTool?: (toolTab: string) => void;
}

interface CompetitorData {
  id: CompetitorId;
  name: string;
  tagline: string;
  pricing: string;
  architecture: string;
  specs: {
    feature: string;
    pdfcraft: string;
    pdfcraftGood: boolean;
    competitor: string;
    competitorGood: boolean;
  }[];
  verdict: {
    choosePdfcraft: string;
    chooseCompetitor: string;
  };
}

const COMPARISONS: Record<CompetitorId, CompetitorData> = {
  ilovepdf: {
    id: 'ilovepdf',
    name: 'iLovePDF',
    tagline: 'Client-Side In-Browser Memory vs Cloud Server Upload Processing',
    pricing: '$48 - $84 / year or limited free tier with cloud storage',
    architecture: 'Remote Cloud File Server Upload',
    specs: [
      {
        feature: 'Document Processing Location',
        pdfcraft: '100% In-Browser Memory (WebAssembly / Local Device)',
        pdfcraftGood: true,
        competitor: 'Uploaded to Remote Cloud Servers (AWS / EU)',
        competitorGood: false,
      },
      {
        feature: 'Cloud Privacy & Server Leaks',
        pdfcraft: 'Zero packets sent. Guaranteed 0 server leaks.',
        pdfcraftGood: true,
        competitor: 'Stored 1-2 hours on server before scheduled deletion.',
        competitorGood: false,
      },
      {
        feature: 'Daily Task Limits',
        pdfcraft: 'Unlimited free usage. Zero daily counters.',
        pdfcraftGood: true,
        competitor: 'Restricted free batching & frequent cooldowns.',
        competitorGood: false,
      },
      {
        feature: 'Target File Size Squeezer (Strict KB)',
        pdfcraft: 'Custom KB presets (48KB, 95KB, 195KB) for govt portals.',
        pdfcraftGood: true,
        competitor: 'Generic high/medium/low presets without strict KB ceiling.',
        competitorGood: false,
      },
      {
        feature: 'Offline Operation (PWA)',
        pdfcraft: 'Full offline editing once loaded. Works in airplane mode.',
        pdfcraftGood: true,
        competitor: 'Fails immediately without active internet access.',
        competitorGood: false,
      },
      {
        feature: 'Account & Sign-up Friction',
        pdfcraft: 'Zero account creation. No email or tracking required.',
        pdfcraftGood: true,
        competitor: 'Prompts for sign-up to unlock advanced features.',
        competitorGood: false,
      },
      {
        feature: 'Price & Licensing',
        pdfcraft: '100% Free Forever (Open Source Indie Tool)',
        pdfcraftGood: true,
        competitor: 'Free tier with ads, or $48 - $84/yr subscription',
        competitorGood: false,
      },
    ],
    verdict: {
      choosePdfcraft:
        'Choose PDFCraft when editing sensitive legal, tax, Aadhaar/PAN, or academic files where zero server uploads and exact KB targets matter.',
      chooseCompetitor:
        'Choose iLovePDF if your workflow relies on multi-gigabyte batch OCR jobs processed on remote server farms.',
    },
  },
  smallpdf: {
    id: 'smallpdf',
    name: 'Smallpdf',
    tagline: 'Unlimited In-Browser Utilities vs 2-Task Daily Cloud Paywalls',
    pricing: '$108 / year ($12/mo) after 2 free daily tasks',
    architecture: 'Cloud Compute + Paywalled API',
    specs: [
      {
        feature: 'Free Daily Limits',
        pdfcraft: 'Zero daily task limits. Unlimited edits & merges.',
        pdfcraftGood: true,
        competitor: 'Hard cap of 2 tasks per day before paywall lock.',
        competitorGood: false,
      },
      {
        feature: 'Data Privacy Guarantee',
        pdfcraft: '100% local execution. Zero bytes leave your device.',
        pdfcraftGood: true,
        competitor: 'Uploads documents to external AWS infrastructure.',
        competitorGood: false,
      },
      {
        feature: 'Exam & Visa KB Compression',
        pdfcraft: 'Exact presets (50KB, 100KB, 200KB) for UPSC/SSC/USCIS.',
        pdfcraftGood: true,
        competitor: 'Strong compression locked behind Pro subscription.',
        competitorGood: false,
      },
      {
        feature: 'Smart PII Auto-Masker',
        pdfcraft: 'Built-in 1-click Aadhaar & PAN redaction engine.',
        pdfcraftGood: true,
        competitor: 'No automated regional PII detection.',
        competitorGood: false,
      },
      {
        feature: 'Price',
        pdfcraft: '$0 Forever (Open Source)',
        pdfcraftGood: true,
        competitor: '$12 / month Pro Tier',
        competitorGood: false,
      },
    ],
    verdict: {
      choosePdfcraft:
        'Choose PDFCraft for unlimited daily tasks, offline capability, and strict client-side confidentiality without paying $108/year.',
      chooseCompetitor:
        'Choose Smallpdf if your organization already pays for team workspace cloud storage integration.',
    },
  },
  adobe: {
    id: 'adobe',
    name: 'Adobe Acrobat',
    tagline: 'Instant Open-Source Web Workbench vs Heavy Paid Desktop Suite',
    pricing: '$239.88 / year ($19.99/mo subscription)',
    architecture: 'Proprietary Desktop & Cloud Subscription',
    specs: [
      {
        feature: 'Startup & Launch Speed',
        pdfcraft: 'Opens instantly in browser memory (~2s).',
        pdfcraftGood: true,
        competitor: 'Requires 1GB+ installer, login, and cloud sync daemon.',
        competitorGood: false,
      },
      {
        feature: 'Annual Subscription Cost',
        pdfcraft: '$0 Free Forever (Zero lock-in).',
        pdfcraftGood: true,
        competitor: '$239.88 / year with early cancellation fees.',
        competitorGood: false,
      },
      {
        feature: 'Telemetry & Account Tracking',
        pdfcraft: 'Zero accounts, zero tracking telemetry.',
        pdfcraftGood: true,
        competitor: 'Mandatory Adobe ID sign-in and background updater.',
        competitorGood: false,
      },
      {
        feature: 'Smart PII Auto-Masker (Aadhaar & PAN)',
        pdfcraft: '1-Click automatic Aadhaar & PAN detection and raster blackout.',
        pdfcraftGood: true,
        competitor: 'Requires manual search-and-redact keyword configuration.',
        competitorGood: false,
      },
      {
        feature: 'Print Industry Preflight & eIDAS Tokens',
        pdfcraft: 'Standard web & document workflows (Sign, Merge, Redact).',
        pdfcraftGood: false,
        competitor: 'Full CMYK Preflight, PDF/X-1a, and USB hardware token support.',
        competitorGood: true,
      },
    ],
    verdict: {
      choosePdfcraft:
        'Choose PDFCraft if you need fast, daily PDF editing, signing, compression, merging, or redacting without paying $240/year or dealing with bloated desktop installers.',
      chooseCompetitor:
        'Choose Adobe Acrobat Pro if you are a commercial print house preparing press-ready CMYK offset files, or an enterprise requiring physical USB smart-card cryptographic eIDAS signers.',
    },
  },
};

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  initialCompetitor = 'ilovepdf',
  onSelectTool,
}) => {
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorId>(initialCompetitor);

  if (!isOpen) return null;

  const comp = COMPARISONS[selectedCompetitor];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg border border-line-strong max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-line flex items-center justify-between bg-bg-raised">
          <div>
            <div className="flex items-center gap-2 hud-label text-app-ink mb-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>Architectural Benchmark</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-ink-strong tracking-tight">
              PdfCraft <span className="text-muted">vs</span> {comp.name}
            </h2>
            <p className="font-sans text-xs text-muted mt-1">{comp.tagline}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close comparison modal"
            className="p-2 border border-line text-muted hover:text-ink hover:border-line-strong transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Competitor Selector Bar */}
        <div className="grid grid-cols-3 gap-px bg-line border-b border-line">
          {(['ilovepdf', 'smallpdf', 'adobe'] as CompetitorId[]).map((id) => (
            <button
              key={id}
              onClick={() => setSelectedCompetitor(id)}
              className={`py-3 px-4 hud-label transition-colors cursor-pointer text-center ${
                selectedCompetitor === id
                  ? 'bg-invert-bg text-invert-fg font-bold'
                  : 'bg-bg text-muted hover:text-ink hover:bg-bg-raised'
              }`}
            >
              vs {id === 'ilovepdf' ? 'iLovePDF' : id === 'smallpdf' ? 'Smallpdf' : 'Adobe Acrobat'}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line">
            <div className="p-5 bg-bg-raised space-y-2">
              <div className="flex items-center gap-2 hud-label text-app-ink">
                <ShieldCheck className="w-4 h-4" />
                <span>PdfCraft (Client-Side)</span>
              </div>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Files execute locally inside browser memory via WebAssembly. Zero uploads, unlimited usage, and zero accounts.
              </p>
              <div className="font-mono text-xs font-bold text-ink-strong pt-1">$0.00 FREE FOREVER</div>
            </div>

            <div className="p-5 bg-bg space-y-2">
              <div className="flex items-center gap-2 hud-label text-muted">
                <Info className="w-4 h-4" />
                <span>{comp.name}</span>
              </div>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Requires remote server transmission, cloud storage retention, and paid tiers for unrestricted limits.
              </p>
              <div className="font-mono text-xs font-bold text-app-ink pt-1">{comp.pricing}</div>
            </div>
          </div>

          {/* Spec Matrix */}
          <div className="border border-line overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-bg-raised border-b border-line hud-label text-muted">
                  <th className="p-4 w-1/3">Capability</th>
                  <th className="p-4 w-1/3 text-app-ink">PdfCraft</th>
                  <th className="p-4 w-1/3">{comp.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {comp.specs.map((spec, i) => (
                  <tr key={i} className="hover:bg-bg-raised transition-colors">
                    <td className="p-4 font-medium text-ink-strong">{spec.feature}</td>
                    <td className="p-4 text-ink">
                      <div className="flex items-start gap-2">
                        {spec.pdfcraftGood ? (
                          <CheckCircle2 className="w-4 h-4 text-app-ink shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                        )}
                        <span>{spec.pdfcraft}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted">
                      <div className="flex items-start gap-2">
                        {spec.competitorGood ? (
                          <CheckCircle2 className="w-4 h-4 text-ink shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                        )}
                        <span>{spec.competitor}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Verdict Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line">
            <div className="p-4 bg-bg-raised text-xs space-y-1.5">
              <span className="hud-label text-app-ink">Choose PdfCraft If</span>
              <p className="text-ink leading-relaxed">{comp.verdict.choosePdfcraft}</p>
            </div>
            <div className="p-4 bg-bg text-xs space-y-1.5">
              <span className="hud-label text-muted">Choose {comp.name} If</span>
              <p className="text-muted leading-relaxed">{comp.verdict.chooseCompetitor}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-line bg-bg-raised flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="hud-label text-faint">OPEN SOURCE · ZERO CLOUD UPLOADS</p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="h-10 px-5 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onSelectTool?.('sign-edit');
              }}
              className="h-10 px-6 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-80 transition-opacity flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

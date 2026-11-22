import React from 'react';

interface LinkItem {
  name: string;
  href: string;
  badge?: string;
}

interface LinkCategory {
  title: string;
  links: LinkItem[];
}

const CATEGORIES: LinkCategory[] = [
  {
    title: 'Target PDF Compression',
    links: [
      { name: 'Compress PDF under 50KB', href: '/compress-pdf-50kb', badge: 'Fast' },
      { name: 'Compress PDF under 100KB', href: '/compress-pdf-100kb' },
      { name: 'Compress PDF under 200KB', href: '/compress-pdf-200kb', badge: 'Popular' },
      { name: 'Compress PDF under 300KB', href: '/compress-pdf-300kb' },
      { name: 'Compress PDF under 500KB', href: '/compress-pdf-500kb' },
      { name: 'UPSC Exam PDF Squeezer', href: '/upsc-pdf-compressor', badge: 'Govt' },
      { name: 'SSC CGL Photo & Signature', href: '/ssc-cgl-signature-photo-compressor' },
      { name: 'GATE Application Compressor', href: '/gate-exam-pdf-compressor' },
      { name: 'NEET Portal PDF Compressor', href: '/neet-application-pdf-compressor' },
      { name: 'USCIS Visa PDF Squeezer', href: '/uscis-visa-pdf-compressor' },
    ],
  },
  {
    title: 'Core PDF Tools',
    links: [
      { name: 'Merge PDF Online', href: '/merge-pdf', badge: 'Instant' },
      { name: 'Split PDF Pages', href: '/split-pdf' },
      { name: 'Rotate PDF Free', href: '/rotate-pdf' },
      { name: 'Delete PDF Pages', href: '/delete-pdf-pages' },
      { name: 'Extract Images from PDF', href: '/extract-pdf-images' },
      { name: 'Sign PDF Online', href: '/sign-pdf', badge: 'No Account' },
      { name: 'Electronic Signature Free', href: '/sign-pdf-no-account' },
      { name: 'Blackout & Redact PDF', href: '/redact-pdf', badge: 'Private' },
      { name: 'Protect & Encrypt PDF', href: '/protect-pdf' },
      { name: 'Unlock Password PDF', href: '/unlock-pdf' },
    ],
  },
  {
    title: 'Security & Conversions',
    links: [
      { name: 'PDF Privacy Leak Checker', href: '/pdf-leak-checker', badge: 'Zero Cloud' },
      { name: 'Check PDF Metadata Privacy', href: '/check-pdf-privacy' },
      { name: 'Mask Aadhaar Card Number', href: '/mask-aadhaar', badge: 'PII' },
      { name: 'Mask PAN Card Number', href: '/mask-pan-card' },
      { name: 'Verify Digital Signatures', href: '/verify-signature' },
      { name: 'Security & Privacy Studio', href: '/security-studio' },
      { name: 'Contract Risk Radar', href: '/contract-risk-radar', badge: 'AI' },
      { name: 'PDF to Word (.docx)', href: '/pdf-to-word' },
      { name: 'PDF to Excel (.xlsx)', href: '/pdf-to-excel' },
      { name: 'PDF to JPG & PNG to PDF', href: '/jpg-to-pdf' },
    ],
  },
  {
    title: 'Comparisons & Authority',
    links: [
      { name: 'PDFCraft vs iLovePDF', href: '/compare/pdfcraft-vs-ilovepdf', badge: 'Free' },
      { name: 'PDFCraft vs Smallpdf', href: '/compare/pdfcraft-vs-smallpdf' },
      { name: 'PDFCraft vs Adobe Acrobat', href: '/compare/pdfcraft-vs-adobe' },
      { name: 'iLovePDF Alternative', href: '/ilovepdf-alternative' },
      { name: 'Smallpdf Alternative', href: '/smallpdf-alternative' },
      { name: 'DocuSign Alternative', href: '/docusign-alternative' },
      { name: 'ATS Resume Builder & Scanner', href: '/resume-builder', badge: 'ATS' },
      { name: 'Brand Gallery & Assets', href: '/brand-gallery.html' },
      { name: 'Developer & SEO Portfolio', href: '/portfolio.html', badge: 'Live' },
    ],
  },
];

export const SeoFooter: React.FC = () => {
  return (
    <section
      aria-label="PDFCraft Tools Directory"
      className="border-t border-slate-900 bg-slate-950/90 py-12 px-4 sm:px-6 lg:px-8 text-slate-400"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>All 100% Free &amp; Private PDF Tools</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Zero Cloud Uploads
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Every document is parsed, compressed, and signed locally in your browser memory via WebAssembly. No files are ever sent to external cloud servers.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>40 Free Utilities Indexed</span>
          </div>
        </div>

        <nav className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
          {CATEGORIES.map((cat, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] text-slate-300">
                {cat.title}
              </h3>
              <ul className="space-y-2">
                {cat.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <a
                      href={link.href}
                      className="group flex items-center justify-between text-slate-400 hover:text-white transition-colors duration-150 py-0.5"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150 truncate">
                        {link.name}
                      </span>
                      {link.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50 group-hover:border-indigo-500/50 group-hover:text-indigo-300 transition-colors flex-shrink-0 ml-1.5">
                          {link.badge}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
};

export default SeoFooter;

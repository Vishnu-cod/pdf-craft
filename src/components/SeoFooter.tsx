import React from 'react';

interface LinkItem {
  name: string;
  href: string;
  badge?: string;
}

interface LinkCategory {
  index: string;
  title: string;
  links: LinkItem[];
}

const CATEGORIES: LinkCategory[] = [
  {
    index: '01',
    title: 'Target PDF Compression',
    links: [
      { name: 'Compress PDF under 50KB', href: '/compress-pdf-50kb', badge: '50K' },
      { name: 'Compress PDF under 100KB', href: '/compress-pdf-100kb', badge: '100K' },
      { name: 'Compress PDF under 200KB', href: '/compress-pdf-200kb', badge: '200K' },
      { name: 'Compress PDF under 300KB', href: '/compress-pdf-300kb' },
      { name: 'Compress PDF under 500KB', href: '/compress-pdf-500kb' },
      { name: 'UPSC Exam PDF Squeezer', href: '/upsc-pdf-compressor', badge: 'GOVT' },
      { name: 'SSC CGL Photo & Signature', href: '/ssc-cgl-signature-photo-compressor' },
      { name: 'GATE Application Compressor', href: '/gate-exam-pdf-compressor' },
      { name: 'NEET Portal PDF Compressor', href: '/neet-application-pdf-compressor' },
      { name: 'USCIS Visa PDF Squeezer', href: '/uscis-visa-pdf-compressor' },
    ],
  },
  {
    index: '02',
    title: 'Core PDF Workbench',
    links: [
      { name: 'Merge PDF Online', href: '/merge-pdf', badge: 'MULTI' },
      { name: 'Split PDF Pages', href: '/split-pdf' },
      { name: 'Rotate PDF Free', href: '/rotate-pdf' },
      { name: 'Delete PDF Pages', href: '/delete-pdf-pages' },
      { name: 'Extract Images from PDF', href: '/extract-pdf-images' },
      { name: 'Sign PDF Online', href: '/sign-pdf', badge: 'SIGN' },
      { name: 'Electronic Signature Free', href: '/sign-pdf-no-account' },
      { name: 'Blackout & Redact PDF', href: '/redact-pdf', badge: 'OCR' },
      { name: 'Protect & Encrypt PDF', href: '/protect-pdf' },
      { name: 'Unlock Password PDF', href: '/unlock-pdf' },
    ],
  },
  {
    index: '03',
    title: 'Security & Conversions',
    links: [
      { name: 'PDF Privacy Leak Checker', href: '/pdf-leak-checker', badge: 'AUDIT' },
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
    index: '04',
    title: 'Benchmarks & Authority',
    links: [
      { name: 'PDFCraft vs iLovePDF', href: '/compare/pdfcraft-vs-ilovepdf', badge: 'SPEC' },
      { name: 'PDFCraft vs Smallpdf', href: '/compare/pdfcraft-vs-smallpdf' },
      { name: 'PDFCraft vs Adobe Acrobat', href: '/compare/pdfcraft-vs-adobe' },
      { name: 'iLovePDF Alternative', href: '/ilovepdf-alternative' },
      { name: 'Smallpdf Alternative', href: '/smallpdf-alternative' },
      { name: 'DocuSign Alternative', href: '/docusign-alternative' },
      { name: 'ATS Resume Studio', href: '/resume-builder', badge: 'ATS' },
      { name: 'Brand Gallery & Assets', href: '/brand-gallery.html' },
      { name: 'Developer & SEO Portfolio', href: '/portfolio.html', badge: 'LIVE' },
    ],
  },
];

export const SeoFooter: React.FC = () => {
  return (
    <section
      id="directory"
      aria-label="PDFCraft Canonical Tools Directory"
      className="w-full border-b border-line bg-bg"
    >
      {/* Sticky Eyebrow */}
      <div className="sticky top-12 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto border-x border-line px-4 sm:px-6 h-10 flex items-center justify-between">
          <span className="hud-label text-muted">06 / CANONICAL DIRECTORY</span>
          <span className="hud-label text-faint">40 FREE UTILITIES INDEXED</span>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto border-x border-line relative">
        <span className="tick absolute -top-[6px] -left-[6px] hidden xl:block" />
        <span className="tick absolute -top-[6px] -right-[6px] hidden xl:block" />

        <div className="px-6 py-10 md:px-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl tracking-[-0.03em] text-ink-strong">
              Every tool, <span className="text-app-ink">indexed</span>.
            </h2>
            <p className="font-sans text-sm text-muted mt-2 max-w-2xl">
              All 40 canonical PDF utilities execute inside browser memory with WebAssembly. Zero files leave your machine.
            </p>
          </div>
          <div className="flex items-center gap-2 hud-label text-app-ink shrink-0">
            <span className="w-2 h-2 bg-app" />
            <span>CLIENT-SIDE WASM · ACTIVE</span>
          </div>
        </div>

        <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
          {CATEGORIES.map((cat, idx) => (
            <div key={idx} className="bg-bg p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="hud-label text-faint">{cat.index}</span>
                  <span className="hud-label text-app-ink">{cat.links.length} ROUTES</span>
                </div>
                <h3 className="font-display text-lg text-ink-strong mb-4">{cat.title}</h3>
                <ul className="space-y-2.5 text-xs">
                  {cat.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <a
                        href={link.href}
                        className="group flex items-center justify-between text-muted hover:text-ink-strong transition-colors py-0.5"
                      >
                        <span className="truncate group-hover:text-app-ink transition-colors">
                          {link.name}
                        </span>
                        {link.badge && (
                          <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-line text-faint group-hover:border-line-strong group-hover:text-ink shrink-0 ml-2">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
};

export default SeoFooter;

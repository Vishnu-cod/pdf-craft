import { ActiveTab } from './types';

export interface RouteConfig {
  path: string;
  tab: ActiveTab;
  subTool?: 'risk-radar' | 'size-squeezer' | 'diff' | 'table-extract' | 'doctor';
  converter?: 'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-images' | 'images-to-pdf' | 'word-to-pdf' | 'word-to-images';
  targetKB?: number;
  securityMode?: 'protect' | 'unlock';
  title: string;
  description: string;
}

export const APP_ROUTES: RouteConfig[] = [
  // 1. Home / Sign & Edit
  {
    path: '/',
    tab: 'sign-edit',
    title: 'PDFCraft — 100% Free & Private PDF Editor, Signer & Tools (Zero Cloud Leaks)',
    description: 'Free private PDF tools in your browser. Edit, sign, compress under 200KB, merge, split, and convert with 100% client-side privacy.',
  },
  {
    path: '/sign-pdf',
    tab: 'sign-edit',
    title: 'Sign PDF Free No Account Required (Zero Cloud Leaks) | PDFCraft',
    description: 'Sign PDF documents online for free without creating an account. Add smooth vector signatures with touch sync from your phone.',
  },
  {
    path: '/sign-pdf-no-account',
    tab: 'sign-edit',
    title: 'Sign PDF Free No Account Required (Zero Cloud Leaks) | PDFCraft',
    description: 'Sign PDF documents online for free without creating an account. Add smooth vector signatures with touch sync from your phone.',
  },
  {
    path: '/redact-pdf',
    tab: 'sign-edit',
    title: 'Redact & Black Out PDF Free Online (Permanent Zero-Leak) | PDFCraft',
    description: 'Permanently redact sensitive text, emails, and SSNs from PDFs. Purges underlying text streams and metadata.',
  },
  {
    path: '/docusign-alternative',
    tab: 'sign-edit',
    title: 'Free DocuSign Alternative — Zero-Account Vector Document E-Signing | PDFCraft',
    description: 'Free DocuSign alternative for signing documents in-browser without expensive enterprise subscription fees or accounts.',
  },

  // 2. Organize, Merge, Split, Rotate, Delete
  {
    path: '/merge-pdf',
    tab: 'organize',
    title: 'Organize, Rotate & Merge PDF Offline Free | PDFCraft',
    description: 'Combine multiple PDFs into one document. Drag to reorder, rotate 90°, and delete pages in browser memory.',
  },
  {
    path: '/rotate-pdf',
    tab: 'organize',
    title: 'Rotate PDF Pages Permanently Online Free (Zero Uploads) | PDFCraft',
    description: 'Rotate sideways or upside-down scanned PDF pages 90°, 180°, or 270° permanently with zero server leaks.',
  },
  {
    path: '/delete-pdf-pages',
    tab: 'organize',
    title: 'Delete Pages from PDF Online Free (Visual Page Selector) | PDFCraft',
    description: 'Remove unwanted pages or blank sheets from PDF files with an interactive visual thumbnail manager.',
  },
  {
    path: '/split-pdf',
    tab: 'split',
    title: 'Split PDF Pages & Extract Sheets Free Offline | PDFCraft',
    description: 'Split PDF into individual pages, extract custom page ranges (e.g. 1-3, 4-6), or split every N pages into a ZIP archive.',
  },

  // 3. Document Converters
  {
    path: '/pdf-to-word',
    tab: 'convert',
    converter: 'pdf-to-word',
    title: 'Convert PDF to Word (.docx) Free Offline (Zero Uploads) | PDFCraft',
    description: 'Convert PDF documents into formatted Microsoft Word (.docx) documents with extractable paragraphs and tables.',
  },
  {
    path: '/pdf-to-excel',
    tab: 'convert',
    converter: 'pdf-to-excel',
    title: 'Convert PDF to Excel (.xlsx) Free Without Email | PDFCraft',
    description: 'Extract multi-page tabular data from invoices and bank statements into formatted Excel (.xlsx) spreadsheets.',
  },
  {
    path: '/jpg-to-pdf',
    tab: 'convert',
    converter: 'images-to-pdf',
    title: 'Convert JPG & PNG Images to PDF Free Online | PDFCraft',
    description: 'Combine photos, receipts, and images into a single clean PDF document completely offline.',
  },
  {
    path: '/png-to-pdf',
    tab: 'convert',
    converter: 'images-to-pdf',
    title: 'Convert PNG to PDF Online Free (Preserve Transparent Alpha) | PDFCraft',
    description: 'Convert PNG images with transparent backgrounds into a clean PDF document directly in your browser.',
  },
  {
    path: '/pdf-to-jpg',
    tab: 'convert',
    converter: 'pdf-to-images',
    title: 'Convert PDF to JPG Images High Resolution Free | PDFCraft',
    description: 'Render crisp high-resolution images from PDF pages and download as a ZIP archive.',
  },
  {
    path: '/extract-pdf-images',
    tab: 'convert',
    converter: 'pdf-to-images',
    title: 'Extract PDF Images & Render High-Res JPG/PNG Free | PDFCraft',
    description: 'Extract pages as crisp 300 DPI image files with 1-click batch ZIP download.',
  },

  // 4. Target Size Squeezer & Compression
  {
    path: '/compress-pdf-50kb',
    tab: 'tools',
    subTool: 'size-squeezer',
    targetKB: 48,
    title: 'Compress PDF to 50KB Online Free (Photo, Signature & Govt Portal Cap) | PDFCraft',
    description: 'Compress PDF strictly under 50KB for UPSC, SSC, state PSC, exam portal uploads, and passport signatures.',
  },
  {
    path: '/compress-pdf-100kb',
    tab: 'tools',
    subTool: 'size-squeezer',
    targetKB: 95,
    title: 'Compress PDF to 100KB Online Free (Govt & UPSC Portal Cap) | PDFCraft',
    description: 'Compress PDF strictly under 100KB online for Indian government job portals, UPSC, SSC, and bank exams.',
  },
  {
    path: '/compress-pdf-200kb',
    tab: 'tools',
    subTool: 'size-squeezer',
    targetKB: 195,
    title: 'Compress PDF Under 200KB Free & Private (Zero Cloud Leaks) | PDFCraft',
    description: 'Compress PDF files under 200KB for college admissions, job applications, and government portal ceilings.',
  },
  {
    path: '/compress-pdf-300kb',
    tab: 'tools',
    subTool: 'size-squeezer',
    targetKB: 295,
    title: 'Compress PDF Under 300KB Free Online (Visa, Job & College Portal) | PDFCraft',
    description: 'Compress PDF under 300KB for visa documents, embassy filings, and scholarship application portals.',
  },
  {
    path: '/compress-pdf-500kb',
    tab: 'tools',
    subTool: 'size-squeezer',
    targetKB: 495,
    title: 'Compress PDF Under 500KB Free (Email & Thesis Attachment Limit) | PDFCraft',
    description: 'Compress PDF under 500KB to fit email attachments, academic portals, and corporate upload limits.',
  },
  {
    path: '/smallpdf-alternative',
    tab: 'tools',
    subTool: 'size-squeezer',
    targetKB: 195,
    title: 'Free Smallpdf Alternative — Unlimited Files & Zero Paywalls | PDFCraft',
    description: 'Free Smallpdf alternative without the 2-document daily task limit or expensive subscription paywalls.',
  },

  // 5. Security: Password Protection & Unlocking
  {
    path: '/protect-pdf',
    tab: 'security',
    securityMode: 'protect',
    title: 'Password Protect PDF Online Free (Military-Grade AES-256) | PDFCraft',
    description: 'Encrypt your PDF with standard AES-256 military-grade password protection. 100% in-browser security.',
  },
  {
    path: '/unlock-pdf',
    tab: 'security',
    securityMode: 'unlock',
    title: 'Unlock & Remove PDF Password Online Free | PDFCraft',
    description: 'Remove password encryption from PDFs you legitimately own. Decrypts and exports clean unencrypted files.',
  },

  // 6. Special AI & Productivity Tools
  {
    path: '/contract-risk-radar',
    tab: 'tools',
    subTool: 'risk-radar',
    title: 'AI Contract Risk Radar — Detect Predatory Clauses Free | PDFCraft',
    description: 'Detect predatory clauses, non-competes, and unlimited liability traps in contracts with 100% private client-side heuristics.',
  },
  {
    path: '/ilovepdf-alternative',
    tab: 'tools',
    subTool: 'risk-radar',
    title: 'Free iLovePDF Alternative — 100% Client-Side With Zero Server Leaks | PDFCraft',
    description: '100% client-side iLovePDF alternative. Edit, sign, compress, and organize documents with zero server uploads.',
  },
  {
    path: '/resume-builder',
    tab: 'resume',
    title: 'Free ATS Resume Builder 60s (Zero Paywall & Vector PDF) | PDFCraft',
    description: 'Craft ATS-verified resumes and matching cover letters in 60 seconds. Vector PDF export with zero dummy data.',
  },
  {
    path: '/privacy',
    tab: 'sign-edit',
    title: 'Zero-Cloud Privacy Policy & Security Guarantee | PDFCraft',
    description: '100% in-browser client-side privacy architecture. Your PDF documents never leave your local device.',
  },
];

/**
 * Match the current URL path against our route registry
 */
export function matchRoute(pathname: string): RouteConfig {
  const normalized = pathname.toLowerCase().replace(/\/$/, '') || '/';
  
  // Exact match
  const exact = APP_ROUTES.find((r) => r.path === normalized);
  if (exact) return exact;

  // Fuzzy prefix matching
  if (normalized.includes('50kb')) return APP_ROUTES.find((r) => r.path === '/compress-pdf-50kb')!;
  if (normalized.includes('100kb')) return APP_ROUTES.find((r) => r.path === '/compress-pdf-100kb')!;
  if (normalized.includes('300kb')) return APP_ROUTES.find((r) => r.path === '/compress-pdf-300kb')!;
  if (normalized.includes('500kb')) return APP_ROUTES.find((r) => r.path === '/compress-pdf-500kb')!;
  if (normalized.includes('compress') || normalized.includes('squeezer') || normalized.includes('200kb')) {
    return APP_ROUTES.find((r) => r.path === '/compress-pdf-200kb')!;
  }
  if (normalized.includes('protect')) return APP_ROUTES.find((r) => r.path === '/protect-pdf')!;
  if (normalized.includes('unlock')) return APP_ROUTES.find((r) => r.path === '/unlock-pdf')!;
  if (normalized.includes('split')) return APP_ROUTES.find((r) => r.path === '/split-pdf')!;
  if (normalized.includes('rotate')) return APP_ROUTES.find((r) => r.path === '/rotate-pdf')!;
  if (normalized.includes('delete') || normalized.includes('remove-pages')) return APP_ROUTES.find((r) => r.path === '/delete-pdf-pages')!;
  if (normalized.includes('merge') || normalized.includes('organize')) return APP_ROUTES.find((r) => r.path === '/merge-pdf')!;
  if (normalized.includes('excel')) return APP_ROUTES.find((r) => r.path === '/pdf-to-excel')!;
  if (normalized.includes('png-to-pdf')) return APP_ROUTES.find((r) => r.path === '/png-to-pdf')!;
  if (normalized.includes('jpg-to-pdf') || normalized.includes('images-to-pdf')) return APP_ROUTES.find((r) => r.path === '/jpg-to-pdf')!;
  if (normalized.includes('extract-images') || normalized.includes('pdf-to-jpg') || normalized.includes('pdf-to-images')) {
    return APP_ROUTES.find((r) => r.path === '/pdf-to-jpg')!;
  }
  if (normalized.includes('word') || normalized.includes('convert')) return APP_ROUTES.find((r) => r.path === '/pdf-to-word')!;
  if (normalized.includes('redact')) return APP_ROUTES.find((r) => r.path === '/redact-pdf')!;
  if (normalized.includes('sign')) return APP_ROUTES.find((r) => r.path === '/sign-pdf')!;
  if (normalized.includes('resume') || normalized.includes('cv')) return APP_ROUTES.find((r) => r.path === '/resume-builder')!;
  if (normalized.includes('ilovepdf')) return APP_ROUTES.find((r) => r.path === '/ilovepdf-alternative')!;
  if (normalized.includes('smallpdf')) return APP_ROUTES.find((r) => r.path === '/smallpdf-alternative')!;
  if (normalized.includes('docusign')) return APP_ROUTES.find((r) => r.path === '/docusign-alternative')!;
  if (normalized.includes('contract') || normalized.includes('radar')) return APP_ROUTES.find((r) => r.path === '/contract-risk-radar')!;
  if (normalized.includes('privacy')) return APP_ROUTES.find((r) => r.path === '/privacy')!;

  // Fallback to Home
  return APP_ROUTES[0];
}

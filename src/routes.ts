import { ActiveTab } from './types';

export interface RouteConfig {
  path: string;
  tab: ActiveTab;
  subTool?: 'risk-radar' | 'size-squeezer' | 'diff' | 'table-extract' | 'doctor';
  converter?: 'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-images' | 'images-to-pdf' | 'word-to-pdf' | 'word-to-images';
  targetKB?: number;
  securityMode?: 'protect' | 'unlock';
  securityStudioSubTab?: 'pii_masker' | 'signature_validator';
  title: string;
  description: string;
}

export const APP_ROUTES: RouteConfig[] = [
  // 0. Creative Studio (PosterCraft & WhatsApp HD)
  {
    path: '/postercraft',
    tab: 'postercraft',
    title: 'PosterCraft — Free Pinterest Aesthetic Editorial Poster Studio (Zero Watermark) | PDFCraft',
    description: '1-Click Pinterest aesthetic editorial poster creator. Add 3D typography behind subjects, 35mm grain, and folded paper textures in 4K.',
  },
  {
    path: '/whatsapp-hd',
    tab: 'whatsapp-studio',
    title: 'WhatsApp 15-Minute HD Video Booster & 30s Status Slicer | PDFCraft',
    description: 'Compress up to 15-minute videos under 16MB or 64MB without WhatsApp blurry re-compression, plus auto 30s status slicer.',
  },

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

  // 8. Security & Privacy Studio (Aadhaar & PAN Masking + PKI Digital Signature Validation)
  {
    path: '/security-studio',
    tab: 'security-studio',
    title: 'Security & Privacy Studio — Aadhaar & PAN Masker, Digital Signature PKI Validator | PDFCraft',
    description: '100% in-browser identity protection. Automatically mask sensitive Aadhaar & PAN numbers with irreversible raster burn-in, or verify CCA India & Adobe AATL digital signatures.',
  },
  {
    path: '/mask-aadhaar',
    tab: 'security-studio',
    securityStudioSubTab: 'pii_masker',
    title: 'Mask Aadhaar Card PDF Free (1-Click Client-Side Auto-Redact) | PDFCraft',
    description: 'Legally compliant Masked Aadhaar creator. Automatically detects 12-digit Aadhaar numbers and irreversibly blackouts the first 8 digits directly in your browser with zero server uploads.',
  },
  {
    path: '/mask-pan-card',
    tab: 'security-studio',
    securityStudioSubTab: 'pii_masker',
    title: 'Mask PAN Card PDF Free Online (Zero Server Leaks) | PDFCraft',
    description: 'Safely mask PAN numbers on bank statements and tax returns before sharing. Irreversible client-side redaction purges underlying text.',
  },
  {
    path: '/verify-signature',
    tab: 'security-studio',
    securityStudioSubTab: 'signature_validator',
    title: 'Verify PDF Digital Signature Free (CCA India & Adobe AATL PKI) | PDFCraft',
    description: 'Validate digital signatures on government PDFs, eMudhra, Capricorn, VSign, DigiLocker, and Adobe AATL certificates with byte-range cryptographic integrity checks.',
  },
  {
    path: '/validate-dsc',
    tab: 'security-studio',
    securityStudioSubTab: 'signature_validator',
    title: 'Validate Digital Signature Certificate (DSC) Online Free | PDFCraft',
    description: 'Free in-browser Digital Signature Certificate validator for India and global PKI. Check certificate validity and document tampering without uploading.',
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
  if (normalized.includes('aadhaar') || normalized.includes('mask-pan') || normalized.includes('mask-pii')) {
    return APP_ROUTES.find((r) => r.path === '/mask-aadhaar') || APP_ROUTES.find((r) => r.path === '/security-studio')!;
  }
  if (normalized.includes('verify-signature') || normalized.includes('validate-dsc') || normalized.includes('dsc') || normalized.includes('signature-validator')) {
    return APP_ROUTES.find((r) => r.path === '/verify-signature') || APP_ROUTES.find((r) => r.path === '/security-studio')!;
  }
  if (normalized.includes('security-studio') || normalized.includes('privacy-studio')) {
    return APP_ROUTES.find((r) => r.path === '/security-studio')!;
  }
  if (normalized.includes('privacy')) return APP_ROUTES.find((r) => r.path === '/privacy')!;

  // Fallback to Home
  return APP_ROUTES[0];
}

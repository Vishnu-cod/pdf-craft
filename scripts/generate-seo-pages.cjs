const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found! Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

const pages = [
  {
    slug: 'compress-pdf-50kb',
    title: 'Compress PDF to 50KB Online Free (Photo, Signature & Govt Portal Cap) | PDFCraft',
    description: 'Compress PDF files strictly under 50KB online for free. Ideal for Indian exam applications, UPSC, SSC, NEET, state PSC, passport signature, and certificate uploads. 100% client-side privacy.',
    keywords: 'compress pdf to 50kb, compress pdf under 50kb online free, reduce pdf size to 50kb, ssc photo signature 50kb pdf compressor, 50kb pdf tool private',
    toolName: '50KB Target Size Squeezer',
    howToName: 'How to compress a PDF strictly under 50KB for government exam applications and signatures',
    steps: [
      { name: 'Upload Your Document', text: 'Select or drop your PDF document or certificate into PDFCraft directly in browser memory.' },
      { name: 'Select 50 KB Strict Preset', text: 'Click the 50 KB preset or slide the target ceiling to 48 KB to ensure strict portal compliance.' },
      { name: 'Download Compliant PDF', text: 'Export the compressed file immediately. Certified to be under 50 KB with razor-sharp legible text.' },
    ],
    faqs: [
      { q: 'Will my PDF pass strict 50KB government portal checks?', a: 'Yes. The algorithm sets a safe buffer (typically 44KB–48KB) ensuring the final PDF is accepted by automated validation servers.' },
      { q: 'Is it safe to compress signatures and ID photos here?', a: '100% safe. Processing happens exclusively in your browser memory via WebAssembly. Zero bytes are ever transmitted to any cloud server.' },
    ],
  },
  {
    slug: 'compress-pdf-100kb',
    title: 'Compress PDF to 100KB Online Free (Govt & UPSC Portal Cap) | PDFCraft',
    description: 'Compress PDF files strictly under 100KB online for free. Ideal for Indian government job portals, UPSC, SSC, state PSC, and bank exam uploads. 100% client-side privacy.',
    keywords: 'compress pdf to 100kb, compress pdf under 100kb online free, reduce pdf size to 100kb, ssc upsc pdf 100kb compressor, private pdf squeezer',
    toolName: '100KB Target Size Squeezer',
    howToName: 'How to compress a PDF strictly under 100KB for government and job exam portals',
    steps: [
      { name: 'Upload Your PDF Document', text: 'Select or drop your PDF document into PDFCraft. The file loads directly into your browser memory with zero server uploads.' },
      { name: 'Select 100 KB Strict Preset', text: 'Click the "Strictly Under 100 KB" preset or dial the target size slider. The client-side downsampling algorithm crunches images while preserving text clarity.' },
      { name: 'Download Your Squeezed PDF', text: 'Click "Download Squeezed PDF". The resulting file is guaranteed to be under 100 KB and ready for instant government portal submission.' },
    ],
    faqs: [
      { q: 'Will my PDF be strictly below 100KB?', a: 'Yes. The algorithm recalculates compression iteratively to ensure the exported PDF file size is strictly under 100 KB (typically 92KB to 98KB).' },
      { q: 'Are my confidential documents uploaded to a cloud server?', a: 'No. PDFCraft processes everything locally inside your browser using WebAssembly. Your files never touch our servers.' },
      { q: 'Will text in certificates and mark sheets remain legible?', a: 'Yes. Bicubic vector downscaling prioritizes high-contrast font edge sharpness so certificates pass automated portal checks.' },
    ],
  },
  {
    slug: 'compress-pdf-200kb',
    title: 'Compress PDF Under 200KB Free & Private (Zero Cloud Leaks) | PDFCraft',
    description: 'Compress PDF files strictly under 200KB for college admissions, government portals, and visa applications. 100% private in-browser compression with zero file uploads.',
    keywords: 'compress pdf under 200kb, compress pdf to 200kb online, target size squeezer, reduce pdf size under 200kb, free private pdf compressor',
    toolName: '200KB Target Size Squeezer',
    howToName: 'How to compress a PDF file under 200KB without cloud uploads',
    steps: [
      { name: 'Drop Document into Squeezer', text: 'Open PDFCraft and select the PDF file you need to compress under 200 KB.' },
      { name: 'Choose 195 KB Target Preset', text: 'Select the 195 KB preset to ensure a safe buffer under the strict 200 KB portal limit.' },
      { name: 'Instant Client-Side Export', text: 'Click Download. The PDF is re-rasterized and saved directly to your computer in seconds.' },
    ],
    faqs: [
      { q: 'Why is 200KB such a common limit?', a: 'Many state government and university admission portals enforce a strict 200KB maximum file cap to conserve server bandwidth.' },
      { q: 'Is there any limit to how many files I can compress?', a: 'None. All tools on PDFCraft are 100% free with unlimited usage and no daily task quotas.' },
    ],
  },
  {
    slug: 'compress-pdf-300kb',
    title: 'Compress PDF Under 300KB Free Online (Visa, Job & College Portal) | PDFCraft',
    description: 'Compress PDF files strictly under 300KB online for free. Perfect for international visa applications, passport offices, and corporate job submissions. 100% private.',
    keywords: 'compress pdf under 300kb, compress pdf to 300kb online, visa application pdf compressor, reduce pdf under 300kb free, 300kb pdf tool',
    toolName: '300KB Target Size Squeezer',
    howToName: 'How to compress a PDF under 300KB for visa and immigration portals',
    steps: [
      { name: 'Select PDF Document', text: 'Drag and drop your PDF statement, passport scan, or visa document.' },
      { name: 'Set Target Ceiling to 295 KB', text: 'Select the 300KB target preset to maintain maximum visual clarity within portal restrictions.' },
      { name: 'Download Squeezed Document', text: 'Save your optimized PDF directly to your device with zero cloud latency.' },
    ],
    faqs: [
      { q: 'Is this suitable for Schengen and US visa portals?', a: 'Yes. Most embassy portals enforce a 300KB ceiling per document upload. PDFCraft guarantees compliance.' },
    ],
  },
  {
    slug: 'compress-pdf-500kb',
    title: 'Compress PDF Under 500KB Free (Email & Thesis Attachment Limit) | PDFCraft',
    description: 'Compress PDF files strictly under 500KB for email attachments, college theses, and financial reports. 100% private in-browser compression with zero server uploads.',
    keywords: 'compress pdf under 500kb, compress pdf to 500kb free, email attachment pdf compressor, reduce pdf size 500kb offline',
    toolName: '500KB Target Size Squeezer',
    howToName: 'How to compress large PDFs under 500KB for email attachments',
    steps: [
      { name: 'Select Large PDF', text: 'Drop multi-page reports, presentations, or contracts into the squeezer.' },
      { name: 'Choose 500 KB Limit', text: 'Activate the 500 KB ceiling to downscale heavy images while keeping text 100% crisp.' },
      { name: 'Save & Email', text: 'Download the compressed PDF ready to send via Outlook, Gmail, or Apple Mail.' },
    ],
    faqs: [
      { q: 'Will multi-page PDFs lose formatting?', a: 'No. Page dimensions and vector typography remain intact while heavy background assets are quantized.' },
    ],
  },
  {
    slug: 'pdf-to-word',
    title: 'Convert PDF to Word (.docx) Free Offline (Zero Uploads) | PDFCraft',
    description: 'Convert PDF documents to fully editable Microsoft Word (.docx) files free. 100% client-side privacy with text formatting, tables, and paragraphs preserved.',
    keywords: 'convert pdf to word free offline, pdf to docx no cloud upload, private pdf to word converter, edit pdf in word free, pdf to docx converter',
    toolName: 'PDF to Word Converter',
    howToName: 'How to convert a PDF to an editable Microsoft Word (.docx) file offline',
    steps: [
      { name: 'Select PDF Document', text: 'Drag and drop your PDF into the converter or click Choose PDF File.' },
      { name: 'In-Browser Text Extraction', text: 'PDFCraft scans document layout, font styles, and paragraphs locally without cloud servers.' },
      { name: 'Download Editable .docx', text: 'Click "Export to Word (.docx)" to save an editable Microsoft Word document directly to your device.' },
    ],
    faqs: [
      { q: 'Can I edit the converted Word file in Microsoft Word and Google Docs?', a: 'Yes. The output is a standard Office Open XML (.docx) file compatible with Word, Google Docs, and LibreOffice.' },
      { q: 'Does PDFCraft store my converted document?', a: 'No. The conversion executes entirely within your browser memory. Zero files are stored.' },
    ],
  },
  {
    slug: 'pdf-to-excel',
    title: 'Convert PDF to Excel (.xlsx) Free Without Email | PDFCraft',
    description: 'Extract tables and financial statements from PDF into editable Microsoft Excel spreadsheets (.xlsx). 100% free with no email required and zero cloud uploads.',
    keywords: 'convert pdf to excel free without email, extract tables from pdf to xlsx, pdf to excel converter offline, bank statement pdf to excel free',
    toolName: 'PDF to Excel Table Extractor',
    howToName: 'How to extract tables from a PDF into an Excel spreadsheet for free',
    steps: [
      { name: 'Upload PDF Statement or Invoice', text: 'Select your financial report, bank statement, or table document.' },
      { name: 'Auto-Detect Column Grids', text: 'The client-side engine identifies rows, headers, and numeric cell boundaries automatically.' },
      { name: 'Download .xlsx Spreadsheet', text: 'Click "Export to Excel (.xlsx)" to open formatted calculations in Microsoft Excel or Numbers.' },
    ],
    faqs: [
      { q: 'Can it convert multi-page bank statements?', a: 'Yes. PDFCraft parses multi-page PDF documents and consolidates tables into clean worksheet columns.' },
      { q: 'Do I have to enter my email to download?', a: 'Never. No sign-ups, no email forms, and no paywalls.' },
    ],
  },
  {
    slug: 'jpg-to-pdf',
    title: 'Convert JPG & PNG Images to PDF Free Online | PDFCraft',
    description: 'Combine JPG, PNG, and WebP images into a single clean PDF document. Reorder photos, set page orientation, and export in seconds with zero cloud uploads.',
    keywords: 'convert jpg to pdf online free, images to pdf converter, combine photos into pdf, png to pdf free offline, pictures to pdf',
    toolName: 'Images to PDF Converter',
    howToName: 'How to combine multiple JPG or PNG images into a single PDF document',
    steps: [
      { name: 'Select Your Images', text: 'Choose or drag multiple JPG, PNG, or WebP photos into the converter.' },
      { name: 'Arrange Page Order', text: 'Drag images to reorder them and select page orientation (portrait or landscape).' },
      { name: 'Generate Clean Vector PDF', text: 'Click "Create PDF" to bundle all photos into a high-resolution, lightweight PDF document.' },
    ],
    faqs: [
      { q: 'Does converting reduce image quality?', a: 'No. Images are embedded directly into PDF canvas containers without lossy re-compression.' },
      { q: 'Is there a limit on how many photos I can combine?', a: 'No. You can merge as many photos as your device memory allows.' },
    ],
  },
  {
    slug: 'png-to-pdf',
    title: 'Convert PNG to PDF Online Free (Preserve Transparent Alpha) | PDFCraft',
    description: 'Convert PNG images to vector-ready PDF documents while preserving crisp edges and transparency. Fast, free, and zero cloud uploads.',
    keywords: 'png to pdf converter free, convert png to pdf transparent, image to pdf converter online, png to pdf offline private, photos to pdf',
    toolName: 'PNG to PDF Converter',
    howToName: 'How to convert PNG images to PDF while keeping transparent backgrounds',
    steps: [
      { name: 'Upload PNG Files', text: 'Select one or more PNG images from your device.' },
      { name: 'Configure Margins & Page Size', text: 'Choose A4 or US Letter page boundaries with custom margins.' },
      { name: 'Export PDF', text: 'Save high-resolution vector PDF with clean alpha transparency preserved.' },
    ],
    faqs: [
      { q: 'Will transparent backgrounds turn black?', a: 'No. Transparent areas render cleanly with crisp alpha blending.' },
    ],
  },
  {
    slug: 'pdf-to-jpg',
    title: 'Convert PDF to JPG Images High Resolution Free | PDFCraft',
    description: 'Extract every page of a PDF document into high-resolution JPG or PNG pictures. Free in-browser image rendering with zero server processing.',
    keywords: 'convert pdf to jpg online free, pdf to images extractor, save pdf pages as jpg, high res pdf to image free, pdf to pictures offline',
    toolName: 'PDF to JPG Image Extractor',
    howToName: 'How to convert PDF pages into high-resolution JPG images for free',
    steps: [
      { name: 'Drop Your PDF File', text: 'Open the PDF you want to convert into picture files.' },
      { name: 'Select Resolution DPI', text: 'Choose standard web (150 DPI) or ultra-crisp print quality (300 DPI).' },
      { name: 'Download Image ZIP Bundle', text: 'Click "Export JPGs" to download all rendered pages directly to your storage.' },
    ],
    faqs: [
      { q: 'Can I extract individual pages as pictures?', a: 'Yes. You can select specific pages or download the complete document as a consolidated ZIP.' },
    ],
  },
  {
    slug: 'sign-pdf',
    title: 'Sign PDF Free No Account Required (Zero Cloud Leaks) | PDFCraft',
    description: 'Sign PDF documents online for free without creating an account or paying for DocuSign. Add handwritten, vector stylus, or typed signatures offline.',
    keywords: 'sign pdf free no account, sign pdf without login, free esign tool offline, electronic signature free no subscription, private pdf signer',
    toolName: 'Private PDF E-Signer',
    howToName: 'How to sign a PDF document online for free without creating an account',
    steps: [
      { name: 'Load Document in Private Viewer', text: 'Open your agreement, lease, or tax form. The file is rendered securely on your screen.' },
      { name: 'Draw or Sync Mobile Signature', text: 'Draw your signature with mouse, stylus, or scan a QR code to sign smoothly from your smartphone screen.' },
      { name: 'Stamp Signature & Export', text: 'Place your signature anywhere, resize it, and click "Export Signed PDF" for an instantly verified copy.' },
    ],
    faqs: [
      { q: 'Are electronic signatures made here legally binding?', a: 'Yes. Standard ESIGN and UETA compliant signatures created client-side are recognized for contracts, leases, and agreements.' },
      { q: 'Is my handwritten signature uploaded to any server?', a: 'Never. Signature paths are drawn into local canvas memory and embedded directly into the PDF byte stream.' },
    ],
  },
  {
    slug: 'sign-pdf-no-account',
    title: 'Sign PDF Online Free Without Account or Signup (Vector E-Sign) | PDFCraft',
    description: 'Sign PDF documents online for free without creating an account, email verification, or credit cards. Draw smooth vector signatures offline.',
    keywords: 'sign pdf without account free, sign pdf online no signup, free esign no registration, draw signature on pdf free, sign pdf document private',
    toolName: 'Zero-Account PDF Signer',
    howToName: 'How to sign a PDF without signing up or creating an account',
    steps: [
      { name: 'Select Document', text: 'Drop your PDF directly into the signing canvas.' },
      { name: 'Draw Vector Signature', text: 'Use your mouse, trackpad, or smartphone to draw your signature.' },
      { name: 'Download Signed Document', text: 'Save your signed agreement immediately with zero registration barriers.' },
    ],
    faqs: [
      { q: 'Do I have to enter my email or credit card?', a: 'Never. PDFCraft requires zero signups, zero credit cards, and zero email forms.' },
    ],
  },
  {
    slug: 'redact-pdf',
    title: 'Redact & Black Out PDF Free Online (Permanent Zero-Leak) | PDFCraft',
    description: 'Permanently redact sensitive text, SSNs, credit card numbers, and PII from PDF documents. True rasterization black-out with zero metadata leaks.',
    keywords: 'redact pdf free online, black out text in pdf, sanitize pdf permanently, remove sensitive data from pdf, secure pdf redaction offline',
    toolName: 'Permanent PDF Redactor & Sanitizer',
    howToName: 'How to permanently redact sensitive information from a PDF file',
    steps: [
      { name: 'Open Document in Redactor', text: 'Select the confidential PDF document you need to sanitize.' },
      { name: 'Highlight Sensitive Text or Boxes', text: 'Draw redaction boxes over account numbers, names, addresses, or confidential pricing.' },
      { name: 'Flatten & Export Sanitized PDF', text: 'Click "Burn Redactions". PDFCraft permanently rasterizes marked pixels so blacked-out text cannot be copied or reversed.' },
    ],
    faqs: [
      { q: 'Can someone highlight or copy text underneath the black boxes?', a: 'No. PDFCraft permanently strips underlying vector text streams in redacted zones.' },
    ],
  },
  {
    slug: 'merge-pdf',
    title: 'Organize, Rotate & Merge PDF Offline Free | PDFCraft',
    description: 'Combine multiple PDF documents into one organized file. Rotate sideways pages, reorder sheets with visual drag-and-drop, and merge free offline.',
    keywords: 'merge pdf offline free, combine pdf files no upload, reorder pdf pages visual grid, rotate pdf pages free, combine multiple pdfs into one',
    toolName: 'Visual PDF Organizer & Merger',
    howToName: 'How to merge and organize multiple PDF files into a single document',
    steps: [
      { name: 'Add Multiple PDF Documents', text: 'Drop several PDFs or reports into the visual workspace grid.' },
      { name: 'Rearrange & Rotate Pages', text: 'Drag page thumbnails to reorder them and click rotate icons to fix orientation.' },
      { name: 'Merge into Single Document', text: 'Click "Export Merged PDF" to download a clean, consolidated file in seconds.' },
    ],
    faqs: [
      { q: 'Is there a limit on how many files I can merge?', a: 'No. You can combine dozens of documents seamlessly.' },
    ],
  },
  {
    slug: 'split-pdf',
    title: 'Split PDF Pages & Extract Sheets Free Offline | PDFCraft',
    description: 'Split large PDF documents into individual pages or extract custom page ranges (e.g. pages 1-5, 8). 100% free with zero cloud uploads.',
    keywords: 'split pdf pages free offline, extract pages from pdf, separate pdf into multiple files, split pdf without uploading, page range extractor',
    toolName: 'PDF Page Splitter & Extractor',
    howToName: 'How to split a PDF into separate pages or extract specific sheets',
    steps: [
      { name: 'Select PDF File to Split', text: 'Open the document containing pages you wish to separate.' },
      { name: 'Choose Page Range or Split Mode', text: 'Specify page numbers (e.g. 1-3, 5) or click "Split All Pages into Separate Files".' },
      { name: 'Instant Client-Side Download', text: 'Save extracted pages immediately as standalone PDF files.' },
    ],
    faqs: [
      { q: 'Can I extract non-consecutive pages?', a: 'Yes. Simply click the specific page thumbnails you want to extract.' },
    ],
  },
  {
    slug: 'rotate-pdf',
    title: 'Rotate PDF Pages Permanently Online Free (Zero Uploads) | PDFCraft',
    description: 'Rotate PDF pages 90, 180, or 270 degrees permanently. Fix upside-down scans and save directly in your browser with zero server uploads.',
    keywords: 'rotate pdf online free, rotate pdf pages permanently, fix upside down pdf, rotate pdf offline private, save rotated pdf free',
    toolName: 'PDF Page Rotator',
    howToName: 'How to rotate upside-down PDF pages permanently for free',
    steps: [
      { name: 'Upload PDF Document', text: 'Select your scanned document or agreement.' },
      { name: 'Click Rotate Icons', text: 'Rotate individual pages or all pages clockwise or counter-clockwise.' },
      { name: 'Save Rotated PDF', text: 'Click Export to download the permanently corrected PDF file.' },
    ],
    faqs: [
      { q: 'Will the orientation stay rotated in Adobe Acrobat?', a: 'Yes. The rotation matrix is written directly into the PDF page tree metadata.' },
    ],
  },
  {
    slug: 'delete-pdf-pages',
    title: 'Delete Pages from PDF Online Free (Visual Page Selector) | PDFCraft',
    description: 'Remove unwanted pages, blank sheets, and covers from PDF documents instantly. Visual page selector with zero server uploads.',
    keywords: 'delete pages from pdf free, remove pdf pages online, delete blank pages from pdf, extract selected pages pdf, remove pages from pdf offline',
    toolName: 'PDF Page Remover',
    howToName: 'How to delete unwanted pages from a PDF document',
    steps: [
      { name: 'Load Your Document', text: 'Drop your PDF into the visual page organizer grid.' },
      { name: 'Click Trash Icon on Unwanted Pages', text: 'Select and remove blank sheets, duplicate pages, or extra cover letters.' },
      { name: 'Export Clean Document', text: 'Download your streamlined PDF instantly.' },
    ],
    faqs: [
      { q: 'Can I undo a page deletion?', a: 'Yes. You can reset or reorder pages at any time before clicking export.' },
    ],
  },
  {
    slug: 'extract-pdf-images',
    title: 'Extract Images from PDF Document Free (High Resolution) | PDFCraft',
    description: 'Extract all embedded JPG and PNG photos from PDF files in their original high resolution. Fast, free, and processed 100% locally in browser.',
    keywords: 'extract images from pdf free, rip pictures from pdf, save images from pdf offline, export all photos from pdf, pdf image extractor',
    toolName: 'PDF Image Extractor',
    howToName: 'How to extract and save all images from a PDF file',
    steps: [
      { name: 'Select PDF File', text: 'Upload the PDF containing photos, charts, or illustrations.' },
      { name: 'Scan Image Objects', text: 'The browser parser identifies embedded raster image streams locally.' },
      { name: 'Download High-Res Photos', text: 'Save extracted pictures in their native resolution as a ZIP bundle.' },
    ],
    faqs: [
      { q: 'Are extracted photos downscaled?', a: 'No. Images are extracted in their original, uncompressed source resolution.' },
    ],
  },
  {
    slug: 'protect-pdf',
    title: 'Password Protect PDF Online Free (Client-Side Encryption) | PDFCraft',
    description: 'Encrypt and password protect PDF documents offline with military-grade 128-bit/256-bit encryption. Zero cloud storage or tracking.',
    keywords: 'password protect pdf free, encrypt pdf offline, add password to pdf without upload, secure pdf document free, private pdf protect',
    toolName: 'PDF Password Encryptor',
    howToName: 'How to password protect a PDF document without uploading to a server',
    steps: [
      { name: 'Select Document', text: 'Open the sensitive PDF you wish to encrypt.' },
      { name: 'Set Secure Password', text: 'Enter an owner and user password with custom viewing permissions.' },
      { name: 'Download Encrypted File', text: 'Save the locked PDF. Can only be opened with the correct password.' },
    ],
    faqs: [
      { q: 'Is the password sent to any server?', a: 'No. The encryption key is computed entirely in your local browser runtime.' },
    ],
  },
  {
    slug: 'unlock-pdf',
    title: 'Unlock PDF & Remove Password Online Free (Offline Decryption) | PDFCraft',
    description: 'Remove owner password and printing restrictions from PDF documents instantly in your browser. 100% private, no cloud leaks.',
    keywords: 'unlock pdf online free, remove password from pdf, decrypt pdf offline, remove pdf security restrictions free, unlock pdf without upload',
    toolName: 'PDF Password Remover',
    howToName: 'How to remove password restrictions from a PDF offline',
    steps: [
      { name: 'Select Locked PDF', text: 'Open your password-protected document.' },
      { name: 'Enter Password Once', text: 'Authenticate to decrypt the file in local memory.' },
      { name: 'Export Unrestricted PDF', text: 'Download a clean, unlocked PDF that opens freely without prompting for a password.' },
    ],
    faqs: [
      { q: 'Can it remove edit and print locks?', a: 'Yes. Exported documents have all permission locks removed permanently.' },
    ],
  },
  {
    slug: 'resume-builder',
    title: 'Free ATS Resume Builder 60s (Zero Paywall & Vector PDF) | PDFCraft',
    description: 'Build an ATS-optimized, single-page vector PDF resume in 60 seconds. Live keyword scanner, role presets, portfolio QR codes, and zero paywalls.',
    keywords: 'free ats resume builder no paywall, ats friendly resume maker, single page resume builder free, vector pdf resume generator, jobscan alternative free',
    toolName: '60s ATS Resume Studio',
    howToName: 'How to build an ATS-compliant resume in 60 seconds with no paywalls',
    steps: [
      { name: 'Pick a Starter Role or Import PDF', text: 'Choose a role template or upload your old PDF resume to auto-populate all experience and education.' },
      { name: 'Run ATS Keyword Matcher', text: 'Paste the target job description to see your match percentage and inject missing recruiter skills in 1 click.' },
      { name: 'Export Vector PDF Free', text: 'Download your ATS-parsable vector PDF with zero paywalls, watermark-free, and no subscription traps.' },
    ],
    faqs: [
      { q: 'Will my resume pass Applicant Tracking Systems (ATS)?', a: 'Yes. PDFCraft exports clean, uncompressed vector text that parsers like Workday, Greenhouse, and Lever read seamlessly.' },
      { q: 'Is there a paywall when clicking Download?', a: 'No. PDFCraft is 100% free with zero paywalls and no account registration.' },
    ],
  },
  {
    slug: 'contract-risk-radar',
    title: 'AI Contract Risk Radar — Detect Predatory Clauses Free | PDFCraft',
    description: 'Scan employment contracts, NDAs, and agreements for hidden liabilities, non-competes, IP grabs, and risky clauses with client-side AI analysis.',
    keywords: 'ai contract risk scanner, detect predatory contract clauses, free employment agreement analyzer, contract clause checker private',
    toolName: 'AI Contract Risk Radar',
    howToName: 'How to scan a contract for hidden risks and predatory clauses for free',
    steps: [
      { name: 'Upload Contract or Agreement', text: 'Select an offer letter, vendor agreement, or NDA in PDF format.' },
      { name: 'Analyze Clauses In-Browser', text: 'The scanner audits clauses against a legal knowledge base for uncapped indemnity, broad non-competes, and IP transfers.' },
      { name: 'Review Plain-English Risks', text: 'Inspect red-flag risk scores, plain-English explanations, and suggested counter-proposals to send back.' },
    ],
    faqs: [
      { q: 'Is my contract shared with external AI companies?', a: 'No. The contract analysis rules execute client-side in your browser memory without uploading confidential text to third-party APIs.' },
    ],
  },
  {
    slug: 'ilovepdf-alternative',
    title: 'Free iLovePDF Alternative — 100% Client-Side With Zero Server Leaks | PDFCraft',
    description: 'Looking for a private, free alternative to iLovePDF? PDFCraft processes all files directly in your web browser memory with zero server uploads, no daily task limits, and no paywalls.',
    keywords: 'ilovepdf alternative free, private alternative to ilovepdf, ilovepdf without uploading files, free pdf tools no paywall, ilovepdf vs pdfcraft',
    toolName: 'Private iLovePDF Alternative',
    howToName: 'How to edit, compress, and sign PDFs without uploading files to iLovePDF servers',
    steps: [
      { name: 'Load PDF Locally', text: 'Select or drop your PDF document into PDFCraft. It opens immediately in browser memory with zero bytes sent to external cloud servers.' },
      { name: 'Use Pro Tools Without Limits', text: 'Compress strictly under 100KB/200KB, draw vector signatures, convert to Word/Excel, or organize pages with zero task limits.' },
      { name: 'Instant Free Download', text: 'Export your modified document directly to your device with no daily paywalls or subscriptions.' },
    ],
    faqs: [
      { q: 'Why choose PDFCraft over iLovePDF?', a: 'iLovePDF uploads your private documents to remote cloud servers and enforces daily free quotas. PDFCraft runs 100% in your browser using WebAssembly with zero server storage and unlimited free use.' },
      { q: 'Are all 16 tools free forever?', a: 'Yes. PDFCraft is 100% free with no credit cards, no account registration, and no watermark restrictions.' },
    ],
  },
  {
    slug: 'smallpdf-alternative',
    title: 'Free Smallpdf Alternative — Unlimited Files & Zero Paywalls | PDFCraft',
    description: 'Tired of Smallpdf\'s 2-file daily limit and $12/month paywalls? PDFCraft offers unlimited PDF compression, conversion, and editing 100% free with zero cloud uploads.',
    keywords: 'smallpdf alternative free, smallpdf without paywall, unlimited smallpdf alternative, smallpdf vs pdfcraft, free offline pdf tools',
    toolName: 'Unlimited Smallpdf Alternative',
    howToName: 'How to compress and convert PDFs without Smallpdf daily limits or paywalls',
    steps: [
      { name: 'Select Your Document', text: 'Open PDFCraft in any web browser on desktop or mobile.' },
      { name: 'Run Target Squeezer or Converter', text: 'Hit exact file sizes (e.g. <100KB) or extract clean Word/Excel tables offline.' },
      { name: 'Save Without Paywalls', text: 'Download unlimited files without ever hitting a daily limit banner.' },
    ],
    faqs: [
      { q: 'Is there a daily limit on how many PDFs I can edit?', a: 'None. You can compress, convert, merge, and sign as many files as you need.' },
    ],
  },
  {
    slug: 'docusign-alternative',
    title: 'Free DocuSign Alternative — Zero-Account Vector Document E-Signing | PDFCraft',
    description: 'Sign PDF documents, leases, and NDAs free without creating an account or paying for DocuSign. 100% private in-browser vector signature pad with mobile QR sync.',
    keywords: 'docusign alternative free, free electronic signature no account, sign pdf without docusign subscription, simple esign free, private pdf signing',
    toolName: 'Zero-Account DocuSign Alternative',
    howToName: 'How to sign agreements and contracts without paying for DocuSign',
    steps: [
      { name: 'Drop Contract into E-Sign Viewer', text: 'Open your NDA, lease agreement, or tax form locally in PDFCraft.' },
      { name: 'Draw or Sync Mobile Signature', text: 'Draw your vector signature using mouse, touchscreen, or scan a QR code to sign with your smartphone.' },
      { name: 'Download Legally Recognized Copy', text: 'Embed vector signatures and date stamps into the document byte stream and save immediately.' },
    ],
    faqs: [
      { q: 'Do I or my signers need an account?', a: 'No. PDFCraft requires zero signups, zero credit cards, and zero email verifications.' },
      { q: 'Are documents legally recognized?', a: 'Yes. Standard ESIGN and UETA compliant signatures created client-side are valid for agreements, leases, and contracts.' },
    ],
  },
  {
    slug: 'mask-aadhaar',
    title: 'Mask Aadhaar Card PDF Free Online (1-Click Auto-Redact) | PDFCraft',
    description: 'Free Masked Aadhaar card creator online. Automatically detect and black out the first 8 digits of your Aadhaar number to comply with UIDAI KYC guidelines. 100% private in-browser redaction with zero server uploads.',
    keywords: 'mask aadhaar card online free, masked aadhaar generator, black out aadhaar number pdf, uidai compliant masked aadhaar, mask pan card pdf, private aadhaar masking tool',
    toolName: 'Smart Aadhaar & PII Masker',
    howToName: 'How to create a masked Aadhaar card PDF with the first 8 digits blacked out',
    steps: [
      { name: 'Upload Your e-Aadhaar PDF', text: 'Select or drop your Aadhaar document into PDFCraft. The file loads directly in local browser memory with zero server uploads.' },
      { name: '1-Click Smart Auto-Detect', text: 'Our client-side regex engine instantly locates the 12-digit Aadhaar number and generates precise redaction coordinates.' },
      { name: 'Download Irreversible Masked Aadhaar', text: 'Purges underlying vector text glyphs and burns a high-DPI black raster mask. Safe for any bank KYC verification.' },
    ],
    faqs: [
      { q: 'Is masked Aadhaar legally accepted for KYC?', a: 'Yes. RBI, SEBI, IRDAI, and UIDAI guidelines explicitly permit and recommend Masked Aadhaar (where only the last 4 digits are visible) for all KYC and verification purposes.' },
      { q: 'Can anyone unmask or remove the black box from the PDF?', a: 'No. PDFCraft uses true raster burn-in that completely purges the underlying font characters and byte streams, preventing inspection via DevTools or text copying.' },
      { q: 'Is my Aadhaar card uploaded to any server?', a: 'Never. All scanning and masking happen 100% inside your browser using WebAssembly. Your identity data never leaves your device.' },
    ],
  },
  {
    slug: 'mask-pan-card',
    title: 'Mask PAN Card PDF Free Online (Zero Cloud Leaks) | PDFCraft',
    description: 'Mask PAN numbers and sensitive identifiers from financial PDFs, bank statements, and tax returns before sharing. 100% in-browser irreversible redaction.',
    keywords: 'mask pan card online free, redact pan number pdf, black out pan card, hide pan number income tax pdf, sanitize financial pdf',
    toolName: 'Smart PAN Card Masker',
    howToName: 'How to mask PAN numbers on tax documents and bank statements',
    steps: [
      { name: 'Upload Financial PDF', text: 'Drop your tax returns, bank statements, or salary slips into PDFCraft.' },
      { name: 'Detect PAN Sequence', text: 'The engine automatically scans text streams for 10-character alphanumeric PAN numbers.' },
      { name: 'Apply Permanent Redaction', text: 'Burn in irreversible black blackout blocks and export a sanitized PDF.' },
    ],
    faqs: [
      { q: 'Why should I mask my PAN number?', a: 'Masking your PAN prevents identity theft and unauthorized financial queries when sharing statements with landlords, lenders, or employers.' },
      { q: 'Does this work on scanned PDF statements?', a: 'Yes. You can review detected items or add manual blackout boxes over any scanned section.' },
    ],
  },
  {
    slug: 'verify-signature',
    title: 'Verify PDF Digital Signature Free (CCA India & Adobe AATL PKI) | PDFCraft',
    description: 'Validate digital signatures on government certificates, tax filings, and legal PDFs. Check eMudhra, Capricorn, VSign, DigiLocker, and Adobe AATL certificates with cryptographic byte-range integrity verification.',
    keywords: 'verify digital signature pdf online free, validate dsc certificate pdf, check emudhra signature validity, cca india digital signature validator, adobe aatl signature check',
    toolName: 'Digital Signature & PKI Validator',
    howToName: 'How to verify a digital signature certificate (DSC) on a PDF document',
    steps: [
      { name: 'Load Signed PDF Document', text: 'Select your digitally signed invoice, MCA document, court order, or GST filing.' },
      { name: 'Cryptographic Integrity Check', text: 'Scans signature dictionaries, byte range offsets, and root certifying authority certificates in browser memory.' },
      { name: 'Review Authenticity Certificate', text: 'Inspect Certifying Authority issuer (eMudhra, Capricorn, VSign, DigiLocker, Adobe), signature reason, and tamper status.' },
    ],
    faqs: [
      { q: 'Which Certifying Authorities are recognized?', a: 'PDFCraft validates against Controller of Certifying Authorities (CCA) India root authorities (eMudhra, Capricorn, VSign, IDsign, Pantasign, SafeScrypt, NSDL, DigiLocker) as well as Adobe Approved Trust List (AATL).' },
      { q: 'Can it detect if the document was altered after signing?', a: 'Yes. The engine checks the /ByteRange hash integrity to confirm whether any bytes were modified post-signature.' },
    ],
  },
  {
    slug: 'security-studio',
    title: 'Security & Privacy Studio — Aadhaar Masker & PKI Signature Validator | PDFCraft',
    description: 'Unified in-browser PDF security powerhouse. Mask Aadhaar & PAN IDs, verify PKI digital signatures, and encrypt with AES-256 with 100% client-side privacy.',
    keywords: 'pdf security studio, mask aadhaar online, verify pdf signature, cca india signature check, private pdf redaction',
    toolName: 'Security & Privacy Studio',
    howToName: 'How to use PDFCraft Security & Privacy Studio to protect and verify documents',
    steps: [
      { name: 'Select Security Mode', text: 'Choose between Smart PII Masking or PKI Digital Signature Validation.' },
      { name: 'Analyze Locally', text: 'Instant client-side scan executes in milliseconds with zero cloud uploads.' },
      { name: 'Export Protected PDF', text: 'Download compliant, redacted, or verified files with complete confidence.' },
    ],
    faqs: [
      { q: 'Is any data stored or sent to the cloud?', a: 'Zero data is sent anywhere. All computation happens entirely within your browser runtime.' },
    ],
  },
];

for (const page of pages) {
  const pageDir = path.join(distDir, page.slug);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  const canonicalUrl = `https://pdf-craft-vert.vercel.app/${page.slug}`;

  // Structured Data (JSON-LD) for Google Rich Snippets
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${canonicalUrl}#webapp`,
        name: `PDFCraft — ${page.toolName}`,
        url: canonicalUrl,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All (Web Browser, Windows, macOS, Linux, Android, iOS)',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '1580',
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://pdf-craft-vert.vercel.app/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: page.toolName,
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'HowTo',
        name: page.howToName,
        description: page.description,
        step: page.steps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.name,
          text: s.text,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
    ],
  };

  // Pre-rendered Crawlable Semantic HTML for Googlebot Indexing
  const preRenderedHtml = `
    <!-- Crawlable Semantic SEO Content for Googlebot -->
    <noscript>
      <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1e293b;">
        <h1>${page.title}</h1>
        <p><strong>${page.description}</strong></p>
        
        <h2>How to Use ${page.toolName} (3 Simple Steps)</h2>
        <ol>
          ${page.steps.map((s) => `<li><strong>${s.name}:</strong> ${s.text}</li>`).join('\n          ')}
        </ol>

        <h2>Why Choose PDFCraft for ${page.toolName}?</h2>
        <ul>
          <li><strong>100% Client-Side Privacy:</strong> Documents never leave your device. All parsing, compression, and conversion happen in your web browser memory.</li>
          <li><strong>Zero Cost & Zero Paywalls:</strong> No subscription traps, no daily task limits, and no watermark restrictions.</li>
          <li><strong>Works Offline:</strong> Once loaded, PDFCraft functions reliably even without an active internet connection.</li>
        </ul>

        <h2>Frequently Asked Questions</h2>
        ${page.faqs.map((f) => `<div style="margin-bottom: 16px;"><h3>${f.q}</h3><p>${f.a}</p></div>`).join('\n        ')}

        <p><a href="https://pdf-craft-vert.vercel.app/">Return to PDFCraft Home Directory</a></p>
      </div>
    </noscript>
  `;

  let modifiedHtml = baseHtml
    // Title
    .replace(/<title>.*?<\/title>/is, `<title>${page.title}</title>`)
    // Meta Description
    .replace(/<meta name="description" content=".*?" \/>/is, `<meta name="description" content="${page.description}" />`)
    // Meta Keywords
    .replace(/<meta name="keywords" content=".*?" \/>/is, `<meta name="keywords" content="${page.keywords}" />`)
    // Canonical
    .replace(/<link rel="canonical" href=".*?" \/>/is, `<link rel="canonical" href="${canonicalUrl}" />`)
    // OG Title & URL
    .replace(/<meta property="og:title" content=".*?" \/>/is, `<meta property="og:title" content="${page.title}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/is, `<meta property="og:description" content="${page.description}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/is, `<meta property="og:url" content="${canonicalUrl}" />`)
    // Twitter Title
    .replace(/<meta name="twitter:title" content=".*?" \/>/is, `<meta name="twitter:title" content="${page.title}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/is, `<meta name="twitter:description" content="${page.description}" />`)
    // Structured Data replacement
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/is, `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n    </script>`)
    // Insert Noscript pre-rendered HTML right after <div id="root"></div>
    .replace('<div id="root"></div>', `<div id="root"></div>\n${preRenderedHtml}`);

  fs.writeFileSync(path.join(pageDir, 'index.html'), modifiedHtml, 'utf-8');
  console.log(`Generated landing page: dist/${page.slug}/index.html`);
}

// Generate complete multi-page sitemap.xml with all 23 canonical URLs
const allRoutes = [
  { path: '', priority: '1.0', changefreq: 'daily' },
  ...pages.map((p) => ({
    path: p.slug,
    priority: p.slug.includes('compress') || p.slug.includes('word') || p.slug.includes('resume') ? '0.9' : '0.8',
    changefreq: 'weekly',
  })),
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (r) => `  <url>
    <loc>https://pdf-craft-vert.vercel.app/${r.path}</loc>
    <lastmod>2026-11-20</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(path.resolve(__dirname, '..', 'public', 'sitemap.xml'), sitemapXml, 'utf-8');
fs.writeFileSync(path.resolve(__dirname, '..', 'dist', 'sitemap.xml'), sitemapXml, 'utf-8');
console.log(`Updated sitemap.xml with ${allRoutes.length} indexed canonical routes.`);

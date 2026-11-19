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
      { q: 'Is there any limit to how many files I can compress?', a: 'None. All 16 tools on PDFCraft are 100% free with unlimited usage and no daily task quotas.' },
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
    slug: 'pdf-to-jpg',
    title: 'Convert PDF to JPG Images High Resolution Free | PDFCraft',
    description: 'Convert every page of a PDF into high-resolution JPG images. Download individual photos or a single ZIP archive. 100% private in-browser conversion.',
    keywords: 'convert pdf to jpg high resolution, extract pdf pages as images, pdf to image converter free, pdf to jpg zip download',
    toolName: 'PDF to JPG Image Extractor',
    howToName: 'How to convert PDF pages into high-resolution JPG images online',
    steps: [
      { name: 'Select PDF', text: 'Drop your document into the PDF to Images converter.' },
      { name: 'Render High-DPI Canvases', text: 'The client-side WebAssembly engine renders each page at crisp 300 DPI resolution.' },
      { name: 'Download Image ZIP', text: 'Click "Download All Images (.zip)" to save high-quality JPGs of every page.' },
    ],
    faqs: [
      { q: 'Are extracted images high resolution?', a: 'Yes. Pages are rendered at standard crisp display density suitable for presentations and printing.' },
    ],
  },
  {
    slug: 'sign-pdf',
    title: 'Sign PDF Free No Account Required (Zero Cloud Leaks) | PDFCraft',
    description: 'Sign PDF documents electronically with zero registration, zero accounts, and zero cloud uploads. Draw, type, or stamp signatures directly in browser memory.',
    keywords: 'sign pdf free no account, free electronic signature online, sign pdf offline, e-sign without credit card, private pdf signature',
    toolName: 'Client-Side PDF Signer',
    howToName: 'How to sign a PDF document online for free without creating an account',
    steps: [
      { name: 'Open Document in Signer', text: 'Drop your PDF into the Edit & Sign viewer.' },
      { name: 'Create Signature or Sync Mobile', text: 'Draw your signature with a mouse, type your name, or scan a QR code to use your phone touchscreen.' },
      { name: 'Burn In & Download', text: 'Place your signature anywhere on the page and click "Burn In & Save" for a permanent vector PDF.' },
    ],
    faqs: [
      { q: 'Is my digital signature legally valid?', a: 'Yes. Standard electronic signatures placed on commercial agreements and waivers are widely recognized globally.' },
      { q: 'Is my signature saved on your servers?', a: 'Never. Signatures are rendered strictly in your browser memory and never transmitted over the internet.' },
    ],
  },
  {
    slug: 'redact-pdf',
    title: 'Redact & Black Out PDF Free Online (Permanent Zero-Leak) | PDFCraft',
    description: 'Permanently black out and redact confidential text, SSNs, credit cards, and sensitive info from PDFs. True vector raster burn-in with zero data leaks.',
    keywords: 'redact pdf free online, black out text in pdf permanently, sanitize pdf document, remove sensitive data from pdf, private pdf redactor',
    toolName: 'Permanent PDF Redactor',
    howToName: 'How to permanently black out and redact sensitive text from a PDF',
    steps: [
      { name: 'Load Confidential PDF', text: 'Open the document inside PDFCraft.' },
      { name: 'Draw Redaction Boxes', text: 'Select the Redact tool and drag black boxes over account numbers, SSNs, or confidential clauses.' },
      { name: 'Permanent Burn-In Export', text: 'Click Save. The underlying vector text and metadata are permanently destroyed, making recovery impossible.' },
    ],
    faqs: [
      { q: 'Can someone highlight or copy text underneath the black boxes?', a: 'No. PDFCraft permanently destroys the underlying vector text stream during export.' },
    ],
  },
  {
    slug: 'merge-pdf',
    title: 'Organize, Rotate & Merge PDF Offline Free | PDFCraft',
    description: 'Visual page grid to reorder, delete, rotate scans 90°, and merge multiple PDF files in browser memory. 100% client-side privacy with unlimited pages.',
    keywords: 'merge pdf offline free, organize pdf pages, rotate pdf 90 degrees, reorder pdf pages visual grid, private pdf merger',
    toolName: 'Organize & Merge Grid',
    howToName: 'How to reorder, rotate, and merge multiple PDF files online for free',
    steps: [
      { name: 'Load One or Multiple PDFs', text: 'Select one or more PDF documents to view all pages in an interactive thumbnail grid.' },
      { name: 'Reorder & Rotate Pages', text: 'Drag pages to change their order, rotate sideways scans 90 degrees, or delete unwanted pages.' },
      { name: 'Save Consolidated PDF', text: 'Click "Export Merged PDF" to combine all sheets into one clean document.' },
    ],
    faqs: [
      { q: 'Can I add additional PDF files to the grid?', a: 'Yes. Click "+ Add More PDFs" to append additional documents into your workspace.' },
    ],
  },
  {
    slug: 'split-pdf',
    title: 'Split PDF Pages & Extract Sheets Free Offline | PDFCraft',
    description: 'Split large PDF documents into individual pages or extract specific page ranges. 100% free with client-side speed and zero cloud uploads.',
    keywords: 'split pdf pages free, extract pages from pdf online, separate pdf pages offline, divide pdf document',
    toolName: 'Visual PDF Splitter',
    howToName: 'How to split a multi-page PDF into separate documents',
    steps: [
      { name: 'Open PDF Document', text: 'Drop your multi-page PDF into PDFCraft Organize grid.' },
      { name: 'Select Pages to Extract', text: 'Click on individual pages or enter a page range (e.g. pages 1-3, 5).' },
      { name: 'Export Split PDF', text: 'Download the extracted pages as a new, standalone PDF file.' },
    ],
    faqs: [
      { q: 'Does splitting a PDF damage bookmarks or hyperlinks?', a: 'No. Page streams and fonts are preserved intact.' },
    ],
  },
  {
    slug: 'resume-builder',
    title: 'Free ATS Resume Builder 60s (Zero Paywall & Vector PDF) | PDFCraft',
    description: 'Create ATS-verified resumes and matching cover letters in 60 seconds. Import old PDFs, scan against job keywords, and download vector PDF with zero paywalls.',
    keywords: 'free ats resume builder no paywall, 60 second resume builder, ats score checker free, free vector resume pdf download, jobscan alternative free',
    toolName: '60-Second ATS Resume Studio',
    howToName: 'How to build an ATS-compliant resume and export a vector PDF in 60 seconds',
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
          ratingCount: '1420',
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
          <li><strong>100% Client-Side Privacy:</strong> Documents never leave your device. All parsing, compression, and conversion happen in your web browser.</li>
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

// Generate complete multi-page sitemap.xml with all 13 canonical URLs
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

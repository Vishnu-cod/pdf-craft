# PDFCraft — Free In-Browser PDF Editor & Utilities

[![Live Demo](https://img.shields.io/badge/Live%20Demo-usepdfcraft.xyz-6366f1?style=for-the-badge&logo=vercel)](https://usepdfcraft.xyz/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-10b981?style=for-the-badge&logo=shield)](https://usepdfcraft.xyz/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge)](LICENSE)
[![Free](https://img.shields.io/badge/Free-No%20Account%20Required-f59e0b?style=for-the-badge)](https://usepdfcraft.xyz/)

> Fast, client-side document utilities that run entirely in your browser using `pdf-lib`, `pdf.js`, and HTML5 Canvas. Your documents process locally in browser memory and never leave your machine.

---

## Why PDFCraft?

Most online PDF utilities (like Smallpdf, iLovePDF, or Adobe Acrobat Web) require uploading confidential documents to remote cloud servers, enforce daily task limits, and lock essential tools behind subscriptions.

**PDFCraft is an open-source, client-side alternative:**
* **100% Client-Side Processing**: Every byte of your PDF is parsed, rendered, compressed, or signed directly in your browser's local memory using WebAssembly and Web Workers.
* **No Server Uploads**: No backend storage, no data retention, and zero external tracking.
* **Target Size Presets**: Compress PDFs to under **200KB**, **100KB**, or **50KB** for exam portals, college admissions, and government applications.
* **Works Offline**: Fully equipped PWA (Progressive Web App) that operates without an internet connection once loaded.
* **Genuinely Free**: No accounts, no subscriptions, and no paywalls.

---

## Suite of Tools

| Tool | Capability | Engine |
| :--- | :--- | :--- |
| **Target Size Squeezer** | Compress PDFs down to exact file ceilings (`< 50 KB`, `< 100 KB`, `< 200 KB`). | Client-side Canvas & binary quantization |
| **Digital Signature (E-Sign)** | Add vector signatures, initials, dates, and stamps offline with touch-sync. | `pdf-lib` vector injection |
| **Visual Page Grid** | Reorder, rotate, delete, split, and merge multiple documents in a visual workspace. | In-browser PDF page tree manipulation |
| **Universal Converters** | Convert PDF to Word (.docx), PDF to Excel (.xlsx), JPG to PDF, and PDF to JPG. | Local binary extraction |
| **Contract Risk Radar** | Client-side heuristic clause detector identifying liability traps and auto-renewals. | Local regex & pattern analysis |
| **ATS Resume Studio** | Fast vector-crisp, ATS-compliant resume builder with zero paywalls. | Dynamic vector layout engine |
| **Permanent Redaction** | Black out sensitive PII, social security numbers, and bank details permanently. | Irreversible pixel rasterization |

---

## Architecture & Privacy

```
User Device (Browser)
├── File Input (Drag & Drop)
│    └── Stored temporarily in browser TypedArray / Blob memory
├── Local Processing Engines
│    ├── pdf-lib (PDF stream manipulation & assembly)
│    ├── pdf.js (Mozilla's client-side rendering engine)
│    ├── HTML5 Canvas (Resolution scaling & quantization)
│    └── Web Workers (Off-main-thread compute)
└── Instant Download
     └── Direct browser Blob download (0 bytes sent to external servers)
```

---

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **Document Processing**: `pdf-lib`, `pdfjs-dist`, HTML5 Canvas API
- **Deployment**: Vercel Serverless Hosting with high-performance caching headers
- **PWA**: Custom Service Worker architecture

---

## Local Development

```bash
# 1. Clone repository
git clone https://github.com/Vishnu-cod/pdf-craft.git
cd pdf-craft

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Build for production (compiles TS, bundles with Vite, and generates SEO landing pages)
npm run build
```

---

## Honest Caveats

- **Compression Trade-offs**: Browser-side compression performs binary re-serialization and canvas quantization. While effective, it cannot achieve the aggressive compression ratios of dedicated server-side tools like Ghostscript.
- **Large Files**: Because processing happens in browser RAM, very large PDFs (>100MB) may be slower depending on available device memory.

---

## License

Distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See `LICENSE` for details.

---

<p align="center">
  Crafted for document privacy. <br/>
  <b><a href="https://usepdfcraft.xyz">Launch PDFCraft Live →</a></b>
</p>

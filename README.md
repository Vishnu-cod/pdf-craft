# 🛠️ PDFCraft — The Zero-Cloud PDF Powerhouse

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pdf--craft--vert.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://pdf-craft-vert.vercel.app/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-10b981?style=for-the-badge&logo=shield)](https://pdf-craft-vert.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![No Paywalls](https://img.shields.io/badge/Paywalls-Zero%20%2F%20Free-f59e0b?style=for-the-badge)](https://pdf-craft-vert.vercel.app/)

> **All The Pro PDF Tools. Zero Paywalls. Zero Cloud Leaks.**  
> Fast, client-side document utilities that run entirely in your browser using WebAssembly, Canvas, and Web Workers. Your sensitive documents never leave your device.

---

## ⚡ Why PDFCraft?

Most online PDF utilities (like Smallpdf, iLovePDF, or Adobe Acrobat Web) require you to **upload confidential documents to their remote cloud servers**, track your IP, enforce harsh daily limits, and lock essential features behind expensive monthly subscriptions.

**PDFCraft is fundamentally different:**
* 🛡️ **100% Client-Side Processing**: Every byte of your PDF is parsed, rendered, compressed, or signed directly in your browser's local memory.
* 🚫 **Zero Server Uploads**: No backend storage, no data retention, no third-party API exposure.
* 🎯 **Strict Target File Sizes**: Need a file compressed to under **200KB** or **100KB** for government job portals or university applications? PDFCraft hits the exact ceiling without trial-and-error.
* ⚡ **Instant & Offline Capable**: Fully equipped PWA (Progressive Web App) that works without internet connectivity once loaded.
* 💎 **Forever Free**: No accounts, no subscriptions, no paywalled downloads.

---

## 🚀 Suite of Tools

| Tool | Capability | Engine |
| :--- | :--- | :--- |
| **Target Size Squeezer** | Compress PDFs down to exact file sizes (e.g., `< 100 KB`, `< 200 KB`, `< 500 KB`). | Client-side Canvas & binary quantization |
| **Digital Signature (E-Sign)** | Add vector signatures, initials, dates, and text stamps offline. | `pdf-lib` vector injection |
| **Visual Page Grid** | Reorder, rotate, delete, split, and merge multiple documents in a visual workspace. | In-browser PDF page tree manipulation |
| **Universal Converters** | Convert PDF to Word (.docx), PDF to Excel (.xlsx), JPG to PDF, and PDF to JPG. | Local binary extraction |
| **Contract Risk Radar** | Client-side heuristic clause detector identifying liability traps and auto-renewals. | Local pattern analysis |
| **ATS Resume Studio** | 60-second vector-crisp, ATS-compliant resume builder with zero paywalls. | Dynamic vector layout engine |
| **Redaction & Privacy** | Black out sensitive PII, social security numbers, and bank details permanently. | Irreversible pixel rasterization |

---

## 🔒 Privacy & Architecture

```
User Device (Browser)
├── File Input (Drag & Drop)
│    └── Stored temporarily in browser TypedArray / Blob memory
├── Local Processing Engines
│    ├── pdf-lib (PDF stream manipulation & assembly)
│    ├── HTML5 Canvas (Resolution scaling & JPEG/WebP quantization)
│    ├── Web Workers (Off-main-thread compute)
│    └── Service Worker Cache (Network-first offline asset delivery)
└── Instant Download
     └── Direct browser Blob download (0 bytes sent to external servers)
```

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons + Framer Motion
- **Document Processing**: `pdf-lib`, HTML5 Canvas API, Web Workers
- **Deployment & Edge**: Vercel Serverless Hosting with high-performance caching headers
- **PWA & Offline**: Custom Service Worker architecture

---

## 💻 Local Development

Clone the repository and spin up the development server:

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/pdf-craft.git
cd pdf-craft

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Build for production
npm run build
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Crafted with care for document privacy. <br/>
  <b><a href="https://pdf-craft-vert.vercel.app">Launch PDFCraft Live →</a></b>
</p>

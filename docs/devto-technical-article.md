---
title: How I Built a 100% Client-Side PDF Powerhouse with WebAssembly and React (Zero Cloud Uploads)
published: true
tags: webdev, javascript, react, opensource
canonical_url: https://pdf-craft-vert.vercel.app/
cover_image: https://pdf-craft-vert.vercel.app/og-image.png
description: How we engineered PDFCraft to compress PDFs strictly under 100KB, e-sign documents, and parse ATS resumes entirely in local browser memory without server uploads.
---

# Why Does Every Online PDF Tool Want Your Credit Card and Your Tax Returns?

Earlier this month, I had to upload a signed certificate to a government application portal. The portal had one strict requirement:

> **"Uploaded PDF must be strictly below 100 KB."**

I did what everyone does: searched *"compress PDF under 100kb"* on Google. 

Every single top result was a multi-million-dollar SaaS product that:
1. Forced me to upload a sensitive personal document to an undisclosed remote server.
2. Compressed it to 125 KB (still rejected by the portal!).
3. Locked the "Extreme Compression" slider behind a **$12/month subscription**.
4. Or hit me with: *"You have reached your free daily quota of 2 files. Enter your credit card."*

I got frustrated enough that I decided to see how far we could push modern web browser primitives—**WebAssembly, HTML5 Canvas, Web Workers, and `pdf-lib`**—to build a completely private, zero-server alternative.

That experiment became [PDFCraft](https://pdf-craft-vert.vercel.app/) ([Source on GitHub](https://github.com/Vishnu-cod/pdf-craft)).

Here is the technical breakdown of how we achieved 100% client-side PDF manipulation with zero cloud leaks.

---

## 1. The Core Architecture: Zero-Cloud Processing

Traditional PDF websites use server-side Python/C++ pipelines (e.g., Poppler, Ghostscript, or LibreOffice in Docker containers). That architecture has major drawbacks:
* **Massive Server Costs**: Running headless PDF engines across millions of files costs thousands in server bills.
* **Privacy Risks**: Uploading legal contracts, tax documents, and medical scans creates massive GDPR and compliance liabilities.

Instead, PDFCraft operates entirely on the client device:

```
User Device (Local Memory)
├── File Input (Drag & Drop)
│    └── ArrayBuffer / Blob in Local Memory
├── Local Processing Engines
│    ├── pdf-lib (Vector streams, page tree manipulation, e-signatures)
│    ├── HTML5 Canvas (Quantization, resolution scaling, image crunching)
│    └── Web Workers (Off-main-thread compute without freezing the UI)
└── Instant Download
     └── Direct Blob URL (0 bytes transmitted to any backend)
```

---

## 2. The Target Size Squeezer: Hitting Exact 100KB/200KB Ceilings

Standard compressors just say *"Low, Medium, High"*. But portal upload bots don't care about "High"—they care about **≤ 95 KB** or **≤ 195 KB**.

To guarantee that a PDF always comes in under the portal limit:
1. **Binary Stream Extraction**: We extract embedded page streams and rasterize page canvases at high DPI.
2. **Dynamic Binary Search Quantization**: Instead of guessing a single JPEG quality factor, our algorithm runs an in-memory binary search across resolution scale and quantization factors:
   * It tests quality brackets (e.g. 0.85 -> 0.65 -> 0.45) in milliseconds.
   * If the generated PDF stream exceeds the target ceiling (say, 95 KB), it immediately downscales background image coordinates while preserving vector text edge sharpness.
3. **Iterative Verification**: The final byte buffer is measured before download. If it's 94.2 KB, it is delivered immediately.

---

## 3. Zero-Account E-Signing (ESIGN Compliant)

Instead of forcing users to sign up for DocuSign or Adobe Sign just to put an initials stamp on a 2-page lease, we implemented an in-browser vector signature pad:
* Signatures are captured via HTML5 Canvas with cubic Bézier curve smoothing for natural pen strokes.
* The vector paths are converted directly into clean PNG byte streams and embedded into the PDF page tree using `pdf-lib`'s `drawImage` and `drawText`.
* The entire signing session happens offline—even with airplane mode turned on!

---

## 4. 60-Second ATS Resume Studio

Most online resume builders let you design your resume for 30 minutes, only to hit you with a **paywall modal at the download step**.

PDFCraft includes a built-in ATS Resume Studio that:
* Formats single-page vector PDF resumes compatible with applicant tracking systems (Workday, Greenhouse, Lever).
* Includes a local keyword scanner that compares your resume against any job description in real-time.
* Exports directly as clean, uncompressed vector text that machine parsers can read with 100% accuracy.

---

## 5. What We Learned

Modern browser engines (V8, WebAssembly, Web Workers) are powerful enough to replace 90% of cloud utilities. You don't need a heavy backend server to compress a PDF, sign an agreement, or extract spreadsheet tables.

* 🌐 **Live Web App**: [https://pdf-craft-vert.vercel.app/](https://pdf-craft-vert.vercel.app/)
* 📦 **Open Source Repository**: [https://github.com/Vishnu-cod/pdf-craft](https://github.com/Vishnu-cod/pdf-craft)

I'd love to hear feedback from the developer community! What utilities would you like to see built into the client-side suite next?

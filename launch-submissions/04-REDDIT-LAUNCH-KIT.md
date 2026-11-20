# Reddit Launch Kit for PDFCraft

> **Rule for Reddit:** Never post promotional hype or spam links across all subs simultaneously. Share the technical architecture, why you built it, the challenges you faced with WebAssembly/Canvas/WebRTC, and invite code review.

---

## 1. r/webdev Post

**Title:** How I built a 100% client-side PDF utility suite with zero server uploads (React, Web Workers, WebRTC)

**Body:**
Hey r/webdev,

Earlier this month, I had to compress a PDF under 100KB for an official portal. Every single site on page 1 of Google was a SaaS that either uploaded my file to an unknown server, stopped at 120KB, or demanded $12/month.

I wondered: *With modern browsers supporting WebAssembly, Web Workers, and WebRTC, why do we still need cloud servers to manipulate PDFs?*

Over the past few weeks, I built and open-sourced **PDFCraft**: a privacy-first web app that handles document operations entirely in browser memory.

### Technical Challenges & Solutions:
1. **The "Under 100KB" Problem:** Standard compressors give vague "Low/Medium/High" presets. We implemented an in-memory binary-search quantization loop that scales canvas resolution and JPEG quality factors until the byte buffer strictly meets the target ceiling (50KB, 100KB, 200KB, etc.) without freezing the main thread.
2. **True Irreversible Redaction:** Most web tools draw a black rectangle overlay on the PDF. That is a security hazard because the underlying text stream is still selectable and extractable. We implemented high-DPI canvas flattening with text operator eradication, `/Annots` deletion, and metadata purges.
3. **Cross-Device Touch Signing without a Server:** People hate drawing signatures with a laptop mouse. We built a QR workflow powered by **WebRTC DataChannels** (using PeerJS + public STUN). Your laptop displays a QR code, your phone scans it and connects directly peer-to-peer, captures your stylus/finger strokes, and sends them directly to the laptop. Zero cloud intermediary.
4. **AES-256 Web Crypto:** Encrypting and decrypting PDFs with `@cantoo/pdf-lib` directly in local RAM.

Everything is free and MIT licensed. You can inspect the DevTools Network tab while using it—zero document bytes leave your machine.

* **Live Demo:** https://pdf-craft-vert.vercel.app/
* **GitHub (MIT):** https://github.com/Vishnu-cod/pdf-craft

Would love feedback on the architecture and canvas/pdfjs performance optimizations!

---

## 2. r/opensource Post

**Title:** I built an open-source, zero-cloud alternative to iLovePDF and DocuSign (PDFCraft)

**Body:**
Hey everyone!

Most online PDF utilities are proprietary SaaS applications that process sensitive user documents (contracts, tax filings, resumes) on remote servers, monetize through subscriptions, or enforce strict daily limits.

I wanted a free, open-source tool that I could trust with my own sensitive files, so I built **PDFCraft**:
* **100% Client-Side:** Everything runs in RAM via Web Workers and HTML5 Canvas.
* **No Telemetry / No File Tracking:** Nothing is saved, logged, or uploaded.
* **Key Features:**
  - True irreversible redaction (purges underlying text streams and metadata)
  - Target compression (strictly ≤ 100KB, 200KB, etc.)
  - Multi-document merge & split with ZIP downloads
  - WebRTC P2P mobile touch signing
  - AES-256 PDF encryption & owner unlocking
  - ATS resume builder with local keyword matching

* **GitHub:** https://github.com/Vishnu-cod/pdf-craft
* **Live App:** https://pdf-craft-vert.vercel.app/

Code contributions, bug reports, and PRs are very welcome!

---

## 3. r/SideProject Post

**Title:** Frustrated by paywalled PDF tools, I spent the last few weeks building a free, client-side alternative

**Body:**
Hey r/SideProject,

We've all been there: you need to sign a 1-page agreement or compress a scanned receipt to under 200KB, only to be forced to create an account, upload your sensitive document to someone else's server, and find a paywall at the download button.

I built **PDFCraft** as a fast, free, and private alternative:
* It runs entirely inside your browser (zero cloud uploads).
* It includes an exact target squeezer (e.g. 50KB, 100KB, 200KB) for government and visa portals.
* It lets you sign documents using your phone touchscreen via a direct WebRTC QR link.
* It's completely free, open source, and has zero daily quotas.

Check it out here: https://pdf-craft-vert.vercel.app/
GitHub: https://github.com/Vishnu-cod/pdf-craft

Let me know what you think or if there's any feature you'd find useful!

---

## 4. r/privacy Post

**Title:** PDFCraft: A 100% client-side PDF utility that processes documents entirely in browser RAM (Zero Cloud Storage)

**Body:**
Hello r/privacy,

Every time you use an online tool to merge, compress, or sign a PDF, you are trusting a third party with private financial, medical, or legal documents. Even when services claim they delete files within 2 hours, the risk of data leakage, unauthorized logging, or scraping remains.

I built **PDFCraft** specifically for privacy-conscious users:
* **Zero Backend Storage:** All processing occurs client-side using JavaScript, WebAssembly, and Canvas.
* **Verify Yourself:** Turn on Airplane Mode after loading the page, or check the Network tab in browser DevTools—no file payloads are ever transmitted.
* **Irreversible Redaction:** Rather than masking text with an opaque vector box, PDFCraft flattens and purges the underlying text streams, annotations, and metadata so hidden data cannot be recovered.
* **Direct WebRTC P2P:** Mobile touch signing transfers data over a direct device-to-device DataChannel without routing your signature through an external server.
* **Open Source:** Full source code is available on GitHub under the MIT license.

* **Live App:** https://pdf-craft-vert.vercel.app/
* **Repository:** https://github.com/Vishnu-cod/pdf-craft

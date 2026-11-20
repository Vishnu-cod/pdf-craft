# Show HN Submission Package for Hacker News

## Submission Metadata

* **Title:** Show HN: PDFCraft – Free, 100% client-side PDF utilities with zero cloud uploads
* **URL:** https://pdf-craft-vert.vercel.app/
* **Link to post:** https://news.ycombinator.com/submit

---

## First Comment by Author (Post immediately after submitting)

Hi HN,

I built PDFCraft (https://pdf-craft-vert.vercel.app/) out of frustration with online PDF tools that upload sensitive documents (contracts, tax returns, resumes) to remote servers, charge $12/month for basic features, and fail at simple tasks like compressing a file strictly below a 100 KB government portal limit.

Modern browsers have robust primitives: WebAssembly, HTML5 Canvas, Web Workers, and Web Crypto. PDFCraft pushes these to run entirely client-side:

1. **Zero-Server Processing:** Files are read into local ArrayBuffers and processed in browser memory via `@cantoo/pdf-lib` and `pdfjs-dist`. You can verify this in your DevTools Network tab or run the app in Airplane mode.
2. **Guaranteed Target Compression:** Instead of subjective "quality" sliders, an in-memory binary-search quantization loop scales resolution and compression until the byte buffer strictly meets exact ceilings (50KB, 100KB, 200KB, 300KB, 500KB).
3. **Irreversible Redaction:** Vector black boxes are a notorious vulnerability because underlying text streams remain selectable. PDFCraft flattens high-DPI canvas layers, purges text operators, `/Annots` dictionaries, and metadata.
4. **Cross-Device Signing without a Relay:** Laptop displays a QR code; your mobile phone connects directly via WebRTC DataChannel (PeerJS + STUN) to transmit touch strokes peer-to-peer.
5. **AES-256 Web Crypto:** Encrypts and decrypts password-protected PDFs locally using standard Adobe-compatible security handlers.

Source code is available under the MIT license on GitHub:
https://github.com/Vishnu-cod/pdf-craft

Feedback, criticism, and code review are very welcome!

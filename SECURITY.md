# Security Policy

## Client-Side Zero-Upload Guarantee

PDFCraft Studio executes all PDF parsing, target-size compression, Aadhaar/PAN redaction burn-in, cryptographic signature inspection, and document conversion locally in the browser using WebAssembly and HTML5 Canvas. No document bytes are uploaded to any server.

## Supported Versions

Security fixes apply directly to the latest `main` branch deployed at `https://pdf-craft-vert.vercel.app/`.

## Reporting a Vulnerability

If you discover a security issue, unintended data exposure, or redaction/sanitization bypass:

1. **Do not** open a public issue with exploitable details if it affects active user safety.
2. Email **vishnu.starks65@gmail.com** with `[PDFCraft Security]` in the subject line and clear reproduction steps (sample non-confidential PDF or test snippet).
3. You will receive an acknowledgement within 48 hours and a verified fix committed directly to `main`.

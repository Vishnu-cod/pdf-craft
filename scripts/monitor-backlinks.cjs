const https = require('https');

const CANONICAL_URLS = [
  'https://pdf-craft-vert.vercel.app/',
  'https://pdf-craft-vert.vercel.app/compress-pdf-50kb',
  'https://pdf-craft-vert.vercel.app/compress-pdf-100kb',
  'https://pdf-craft-vert.vercel.app/compress-pdf-200kb',
  'https://pdf-craft-vert.vercel.app/compress-pdf-300kb',
  'https://pdf-craft-vert.vercel.app/compress-pdf-500kb',
  'https://pdf-craft-vert.vercel.app/pdf-to-word',
  'https://pdf-craft-vert.vercel.app/pdf-to-excel',
  'https://pdf-craft-vert.vercel.app/jpg-to-pdf',
  'https://pdf-craft-vert.vercel.app/png-to-pdf',
  'https://pdf-craft-vert.vercel.app/pdf-to-jpg',
  'https://pdf-craft-vert.vercel.app/sign-pdf',
  'https://pdf-craft-vert.vercel.app/sign-pdf-no-account',
  'https://pdf-craft-vert.vercel.app/redact-pdf',
  'https://pdf-craft-vert.vercel.app/merge-pdf',
  'https://pdf-craft-vert.vercel.app/split-pdf',
  'https://pdf-craft-vert.vercel.app/rotate-pdf',
  'https://pdf-craft-vert.vercel.app/delete-pdf-pages',
  'https://pdf-craft-vert.vercel.app/extract-pdf-images',
  'https://pdf-craft-vert.vercel.app/protect-pdf',
  'https://pdf-craft-vert.vercel.app/unlock-pdf',
  'https://pdf-craft-vert.vercel.app/resume-builder',
  'https://pdf-craft-vert.vercel.app/contract-risk-radar',
  'https://pdf-craft-vert.vercel.app/ilovepdf-alternative',
  'https://pdf-craft-vert.vercel.app/smallpdf-alternative',
  'https://pdf-craft-vert.vercel.app/docusign-alternative',
];

function checkUrl(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        resolve({ url, status: res.statusCode, ok: res.statusCode === 200 });
      })
      .on('error', (err) => {
        resolve({ url, status: err.message, ok: false });
      });
  });
}

async function run() {
  console.log(`Checking ${CANONICAL_URLS.length} canonical landing pages on live production...`);
  const results = await Promise.all(CANONICAL_URLS.map(checkUrl));
  const passed = results.filter((r) => r.ok).length;
  console.log(`Results: ${passed} / ${CANONICAL_URLS.length} URLs returned HTTP 200 OK.`);
  if (passed === CANONICAL_URLS.length) {
    console.log('✅ All canonical SEO routes are live and healthy!');
    process.exit(0);
  } else {
    console.warn('⚠️ Some URLs failed:', results.filter((r) => !r.ok));
    process.exit(1);
  }
}

run();

const https = require('https');

const CANONICAL_URLS = [
  'https://usepdfcraft.xyz/',
  'https://usepdfcraft.xyz/compress-pdf-50kb',
  'https://usepdfcraft.xyz/compress-pdf-100kb',
  'https://usepdfcraft.xyz/compress-pdf-200kb',
  'https://usepdfcraft.xyz/compress-pdf-300kb',
  'https://usepdfcraft.xyz/compress-pdf-500kb',
  'https://usepdfcraft.xyz/pdf-to-word',
  'https://usepdfcraft.xyz/pdf-to-excel',
  'https://usepdfcraft.xyz/jpg-to-pdf',
  'https://usepdfcraft.xyz/png-to-pdf',
  'https://usepdfcraft.xyz/pdf-to-jpg',
  'https://usepdfcraft.xyz/sign-pdf',
  'https://usepdfcraft.xyz/sign-pdf-no-account',
  'https://usepdfcraft.xyz/redact-pdf',
  'https://usepdfcraft.xyz/merge-pdf',
  'https://usepdfcraft.xyz/split-pdf',
  'https://usepdfcraft.xyz/rotate-pdf',
  'https://usepdfcraft.xyz/delete-pdf-pages',
  'https://usepdfcraft.xyz/extract-pdf-images',
  'https://usepdfcraft.xyz/protect-pdf',
  'https://usepdfcraft.xyz/unlock-pdf',
  'https://usepdfcraft.xyz/resume-builder',
  'https://usepdfcraft.xyz/contract-risk-radar',
  'https://usepdfcraft.xyz/ilovepdf-alternative',
  'https://usepdfcraft.xyz/smallpdf-alternative',
  'https://usepdfcraft.xyz/docusign-alternative',
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

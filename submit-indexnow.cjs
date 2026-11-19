const https = require('https');

const urls = [
  "https://pdf-craft-vert.vercel.app/",
  "https://pdf-craft-vert.vercel.app/compress-pdf-50kb",
  "https://pdf-craft-vert.vercel.app/compress-pdf-100kb",
  "https://pdf-craft-vert.vercel.app/compress-pdf-200kb",
  "https://pdf-craft-vert.vercel.app/compress-pdf-300kb",
  "https://pdf-craft-vert.vercel.app/compress-pdf-500kb",
  "https://pdf-craft-vert.vercel.app/pdf-to-word",
  "https://pdf-craft-vert.vercel.app/pdf-to-excel",
  "https://pdf-craft-vert.vercel.app/jpg-to-pdf",
  "https://pdf-craft-vert.vercel.app/png-to-pdf",
  "https://pdf-craft-vert.vercel.app/pdf-to-jpg",
  "https://pdf-craft-vert.vercel.app/extract-pdf-images",
  "https://pdf-craft-vert.vercel.app/sign-pdf",
  "https://pdf-craft-vert.vercel.app/sign-pdf-no-account",
  "https://pdf-craft-vert.vercel.app/redact-pdf",
  "https://pdf-craft-vert.vercel.app/merge-pdf",
  "https://pdf-craft-vert.vercel.app/split-pdf",
  "https://pdf-craft-vert.vercel.app/rotate-pdf",
  "https://pdf-craft-vert.vercel.app/delete-pdf-pages",
  "https://pdf-craft-vert.vercel.app/protect-pdf",
  "https://pdf-craft-vert.vercel.app/unlock-pdf",
  "https://pdf-craft-vert.vercel.app/resume-builder",
  "https://pdf-craft-vert.vercel.app/contract-risk-radar",
  "https://pdf-craft-vert.vercel.app/ilovepdf-alternative",
  "https://pdf-craft-vert.vercel.app/smallpdf-alternative",
  "https://pdf-craft-vert.vercel.app/docusign-alternative"
];

const data = JSON.stringify({
  host: "pdf-craft-vert.vercel.app",
  key: "b91f045ce7284f3eb54c2598383a54d1",
  keyLocation: "https://pdf-craft-vert.vercel.app/b91f045ce7284f3eb54c2598383a54d1.txt",
  urlList: urls
});

function submit(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ endpoint, statusCode: res.statusCode, body });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log(`Submitting ${urls.length} canonical URLs to IndexNow network...`);
  
  try {
    const res1 = await submit("https://api.indexnow.org/indexnow");
    console.log(`api.indexnow.org status: ${res1.statusCode} (${res1.statusCode === 200 || res1.statusCode === 202 ? 'OK' : 'Error'})`);
  } catch (err) {
    console.error("api.indexnow.org error:", err.message);
  }

  try {
    const res2 = await submit("https://www.bing.com/indexnow");
    console.log(`bing.com status: ${res2.statusCode} (${res2.statusCode === 200 || res2.statusCode === 202 ? 'OK' : 'Error'})`);
  } catch (err) {
    console.error("bing.com error:", err.message);
  }
}

run();

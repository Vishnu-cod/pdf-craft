const fs = require('fs');
const path = require('path');
const https = require('https');

// Dynamically read all canonical <loc> URLs from public/sitemap.xml
const sitemapPath = path.resolve(__dirname, 'public', 'sitemap.xml');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
const urls = Array.from(sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g), (m) => m[1].trim()).filter(Boolean);

const data = JSON.stringify({
  host: "usepdfcraft.xyz",
  key: "b91f045ce7284f3eb54c2598383a54d1",
  keyLocation: "https://usepdfcraft.xyz/b91f045ce7284f3eb54c2598383a54d1.txt",
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

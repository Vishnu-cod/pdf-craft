// PDFCraft WhatsApp Web Status Downloader Content Script
(function () {
  console.log('[PDFCraft] WhatsApp Web Status Downloader Active');

  const BUTTON_ID = 'pdfcraft-status-download-btn';

  function findActiveStatusMedia() {
    // Check for open status viewer elements
    const videos = document.querySelectorAll('video');
    for (let i = videos.length - 1; i >= 0; i--) {
      const v = videos[i];
      if (v.src && v.offsetParent !== null) {
        return { type: 'video', element: v, src: v.src };
      }
    }

    const imgs = document.querySelectorAll('img');
    for (let i = imgs.length - 1; i >= 0; i--) {
      const img = imgs[i];
      if (img.src && img.offsetParent !== null && (img.src.startsWith('blob:') || img.src.includes('whatsapp.net') || img.src.includes('pps.whatsapp.net'))) {
        return { type: 'image', element: img, src: img.src };
      }
    }

    return null;
  }

  function downloadMedia(src, filename) {
    if (src.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = src;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Fetch and download
      fetch(src)
        .then((res) => res.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        })
        .catch((err) => {
          console.error('[PDFCraft] Failed to download media:', err);
          window.open(src, '_blank');
        });
    }
  }

  function injectDownloadButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const media = findActiveStatusMedia();
    if (!media) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Download HD Status</span>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const currentMedia = findActiveStatusMedia();
      if (!currentMedia) {
        alert('Could not find active status media. Please ensure the status is playing.');
        return;
      }
      const ext = currentMedia.type === 'video' ? 'mp4' : 'jpg';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadMedia(currentMedia.src, `WhatsApp_Status_${timestamp}.${ext}`);

      // Visual feedback
      btn.style.backgroundColor = '#16a34a';
      btn.querySelector('span').innerText = 'Downloaded!';
      setTimeout(() => {
        btn.style.backgroundColor = '#25D366';
        btn.querySelector('span').innerText = 'Download HD Status';
      }, 2000);
    });

    document.body.appendChild(btn);
  }

  // Monitor DOM changes for status viewer
  const observer = new MutationObserver(() => {
    const existing = document.getElementById(BUTTON_ID);
    const media = findActiveStatusMedia();

    if (media && !existing) {
      injectDownloadButton();
    } else if (!media && existing) {
      existing.remove();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();

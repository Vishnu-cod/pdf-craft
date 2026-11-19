/**
 * Document Doctor: Client-side image processing for cleaning up scanned PDFs and phone photos
 */

export interface DoctorSettings {
  brightness: number; // -100 to 100 (default: 15)
  contrast: number;   // -100 to 100 (default: 30)
  whitenBackground: boolean; // Cleans gray/shadowy paper to pure white
  grayscale: boolean;
  threshold: number;  // 0 to 255 (for binarization mode)
}

export function enhanceCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  settings: DoctorSettings
) {
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  targetCanvas.width = sourceCanvas.width;
  targetCanvas.height = sourceCanvas.height;
  ctx.drawImage(sourceCanvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
  const data = imgData.data;

  const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Grayscale if enabled
    if (settings.grayscale) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    // 2. Brightness
    r += settings.brightness;
    g += settings.brightness;
    b += settings.brightness;

    // 3. Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // 4. Background Paper Whitener (if pixel is grayish/off-white, push to pure white)
    if (settings.whitenBackground) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 185) {
        r = 255;
        g = 255;
        b = 255;
      }
    }

    // Clamp values
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imgData, 0, 0);
}

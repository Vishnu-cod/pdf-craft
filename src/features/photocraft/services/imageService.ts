import { ImageAdjustments, ImageFilterPreset, CropRect } from '../types';

export class ImageService {
  /**
   * Load an image safely into an HTMLImageElement with CORS enabled
   */
  static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
      img.src = src;
    });
  }

  /**
   * Safe image downsampling for large photos (e.g. 24MP phone photos) to prevent browser crashing
   */
  static downsampleImageIfNeeded(
    img: HTMLImageElement,
    maxDimension = 2560
  ): { canvas: HTMLCanvasElement; width: number; height: number } {
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
    }

    return { canvas, width, height };
  }

  /**
   * Real Canvas Filter and Adjustment Processor
   * Combines hardware-accelerated Canvas filters and custom pixel shader passes
   */
  static processImage(
    img: HTMLImageElement | HTMLCanvasElement,
    adjustments: ImageAdjustments,
    filterPreset: ImageFilterPreset = 'none',
    crop?: CropRect
  ): HTMLCanvasElement {
    const sw = crop ? crop.width : img.width;
    const sh = crop ? crop.height : img.height;
    const sx = crop ? crop.x : 0;
    const sy = crop ? crop.y : 0;

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // 1. Build Canvas filter string for hardware acceleration
    const filterParts: string[] = [];

    // Brightness (100 is default 100%)
    const brightVal = 100 + adjustments.brightness;
    if (brightVal !== 100) filterParts.push(`brightness(${Math.max(0, brightVal)}%)`);

    // Contrast
    const contrastVal = 100 + adjustments.contrast;
    if (contrastVal !== 100) filterParts.push(`contrast(${Math.max(0, contrastVal)}%)`);

    // Saturation
    const satVal = 100 + adjustments.saturation;
    if (satVal !== 100) filterParts.push(`saturate(${Math.max(0, satVal)}%)`);

    // Grayscale & Sepia
    if (adjustments.grayscale > 0) filterParts.push(`grayscale(${adjustments.grayscale}%)`);
    if (adjustments.sepia > 0) filterParts.push(`sepia(${adjustments.sepia}%)`);

    // Blur
    if (adjustments.blur > 0) filterParts.push(`blur(${adjustments.blur * 0.4}px)`);

    // Apply Filter Preset CSS modifiers
    switch (filterPreset) {
      case 'natural':
        filterParts.push('contrast(105%) saturate(110%)');
        break;
      case 'vintage':
        filterParts.push('sepia(35%) contrast(110%) brightness(95%)');
        break;
      case 'cinematic':
        filterParts.push('contrast(125%) saturate(85%) brightness(92%)');
        break;
      case 'warm':
        filterParts.push('sepia(20%) saturate(125%) brightness(102%)');
        break;
      case 'cool':
        filterParts.push('hue-rotate(185deg) saturate(90%)');
        break;
      case 'noir':
        filterParts.push('grayscale(100%) contrast(140%) brightness(90%)');
        break;
      case 'glam':
        filterParts.push('contrast(108%) saturate(120%) brightness(105%)');
        break;
      case 'dramatic':
        filterParts.push('contrast(150%) saturate(115%) brightness(85%)');
        break;
      case 'fade':
        filterParts.push('contrast(85%) brightness(110%) saturate(80%)');
        break;
      case 'retro':
        filterParts.push('sepia(45%) contrast(115%) saturate(130%)');
        break;
      case 'high_contrast':
        filterParts.push('contrast(165%) saturate(110%)');
        break;
      default:
        break;
    }

    if (filterParts.length > 0) {
      ctx.filter = filterParts.join(' ');
    }

    // Draw base cropped image
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    ctx.filter = 'none'; // reset filter for subsequent overlays

    // 2. Custom Color Temperature (Warmth) & Tint Overlay
    if (adjustments.temperature !== 0 || adjustments.tint !== 0) {
      ctx.save();
      if (adjustments.temperature > 0) {
        // Warm: Amber overlay
        ctx.fillStyle = `rgba(255, 147, 41, ${Math.min(0.35, adjustments.temperature / 250)})`;
        ctx.globalCompositeOperation = 'color';
        ctx.fillRect(0, 0, sw, sh);
      } else if (adjustments.temperature < 0) {
        // Cool: Cyan / Blue overlay
        ctx.fillStyle = `rgba(0, 162, 255, ${Math.min(0.35, Math.abs(adjustments.temperature) / 250)})`;
        ctx.globalCompositeOperation = 'color';
        ctx.fillRect(0, 0, sw, sh);
      }

      if (adjustments.tint !== 0) {
        ctx.fillStyle = adjustments.tint > 0
          ? `rgba(255, 0, 128, ${Math.min(0.25, adjustments.tint / 300)})`
          : `rgba(0, 255, 128, ${Math.min(0.25, Math.abs(adjustments.tint) / 300)})`;
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillRect(0, 0, sw, sh);
      }
      ctx.restore();
    }

    // 3. Vignette Pass
    if (adjustments.vignette > 0) {
      ctx.save();
      const radius = Math.sqrt(Math.pow(sw / 2, 2) + Math.pow(sh / 2, 2));
      const gradient = ctx.createRadialGradient(sw / 2, sh / 2, radius * 0.35, sw / 2, sh / 2, radius);
      const intensity = adjustments.vignette / 100;
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.7, `rgba(0,0,0,${0.25 * intensity})`);
      gradient.addColorStop(1, `rgba(0,0,0,${0.85 * intensity})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, sw, sh);
      ctx.restore();
    }

    return canvas;
  }

  /**
   * Generate lightweight thumbnail data URL for projects and layers
   */
  static getThumbnail(canvas: HTMLCanvasElement, maxDim = 160): string {
    const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height);
    const tw = Math.round(canvas.width * scale);
    const th = Math.round(canvas.height * scale);

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = tw;
    thumbCanvas.height = th;
    const ctx = thumbCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, tw, th);
    }
    return thumbCanvas.toDataURL('image/jpeg', 0.8);
  }
}

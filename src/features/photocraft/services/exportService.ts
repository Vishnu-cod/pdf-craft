import { CanvasBackground, CanvasElement } from '../types';
import { ImageService } from './imageService';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0.1 to 1.0
  scale: number; // 1, 2, 4 (for 4K)
  transparentBg?: boolean;
}

export class ExportService {
  /**
   * Render the complete composition of background + all elements to a high-res canvas
   */
  static async renderToCanvas(
    width: number,
    height: number,
    background: CanvasBackground,
    elements: CanvasElement[],
    scale = 1,
    transparentBg = false
  ): Promise<HTMLCanvasElement> {
    const exportWidth = Math.round(width * scale);
    const exportHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.scale(scale, scale);

    // 1. Draw Background
    if (!transparentBg) {
      if (background.type === 'color') {
        ctx.fillStyle = background.color;
        ctx.fillRect(0, 0, width, height);
      } else if (background.type === 'gradient' && background.gradient) {
        let grad: CanvasGradient;
        if (background.gradient.type === 'radial') {
          grad = ctx.createRadialGradient(
            width / 2,
            height / 2,
            10,
            width / 2,
            height / 2,
            Math.max(width, height) / 1.5
          );
        } else {
          const angleRad = (background.gradient.angle * Math.PI) / 180;
          const x1 = width / 2 - (Math.cos(angleRad) * width) / 2;
          const y1 = height / 2 - (Math.sin(angleRad) * height) / 2;
          const x2 = width / 2 + (Math.cos(angleRad) * width) / 2;
          const y2 = height / 2 + (Math.sin(angleRad) * height) / 2;
          grad = ctx.createLinearGradient(x1, y1, x2, y2);
        }

        background.gradient.stops.forEach((stop) => {
          grad.addColorStop(stop.offset, stop.color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (background.type === 'image' && background.imageSrc) {
        try {
          const bgImg = await ImageService.loadImage(background.imageSrc);
          ctx.drawImage(bgImg, 0, 0, width, height);
        } catch (e) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }
      } else if (background.type === 'transparent') {
        // Leave clear
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }
    }

    // 2. Sort elements by zIndex (lowest to highest)
    const sortedElements = [...elements]
      .filter((el) => el.isVisible)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // 3. Render each element
    for (const el of sortedElements) {
      ctx.save();

      // Transform origin at element center
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;

      ctx.translate(cx, cy);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      if (el.flipX || el.flipY) ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
      ctx.globalAlpha = Math.max(0, Math.min(1, (el.opacity ?? 100) / 100));

      const drawX = -el.width / 2;
      const drawY = -el.height / 2;

      // Render based on element type
      switch (el.type) {
        case 'image': {
          if (el.src) {
            try {
              const img = await ImageService.loadImage(el.src);
              let processed: HTMLCanvasElement | HTMLImageElement = img;

              if (el.adjustments || el.filter) {
                processed = ImageService.processImage(
                  img,
                  el.adjustments || {
                    brightness: 0,
                    contrast: 0,
                    saturation: 0,
                    exposure: 0,
                    temperature: 0,
                    tint: 0,
                    blur: 0,
                    sepia: 0,
                    grayscale: 0,
                    vignette: 0,
                    opacity: 100,
                  },
                  el.filter || 'none',
                  el.crop
                );
              }

              // Corner radius / clipping
              if (el.borderRadius && el.borderRadius > 0) {
                ctx.beginPath();
                const r = el.borderRadius;
                ctx.roundRect(drawX, drawY, el.width, el.height, r);
                ctx.clip();
              }

              ctx.drawImage(processed, drawX, drawY, el.width, el.height);

              // Border
              if (el.borderWidth && el.borderWidth > 0 && el.borderColor) {
                ctx.lineWidth = el.borderWidth;
                ctx.strokeStyle = el.borderColor;
                ctx.strokeRect(drawX, drawY, el.width, el.height);
              }
            } catch (err) {
              console.warn('Export image error:', err);
            }
          }
          break;
        }

        case 'text': {
          const fontSize = el.fontSize || 36;
          const fontWeight = el.fontWeight || 'normal';
          const fontStyle = el.fontStyle || 'normal';
          const fontFamily = el.fontFamily || 'Plus Jakarta Sans, sans-serif';

          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
          ctx.textAlign = (el.textAlign === 'justify' ? 'left' : (el.textAlign || 'left')) as CanvasTextAlign;
          ctx.textBaseline = 'top';

          // Text shadow
          if (el.shadow) {
            ctx.shadowColor = el.shadow.color;
            ctx.shadowBlur = el.shadow.blur;
            ctx.shadowOffsetX = el.shadow.offsetX;
            ctx.shadowOffsetY = el.shadow.offsetY;
          }

          // Background highlight
          if (el.bgColor && el.bgColor !== 'transparent') {
            ctx.fillStyle = el.bgColor;
            ctx.fillRect(drawX, drawY, el.width, el.height);
          }

          // Text Outline / Stroke
          if (el.outline && el.outline.width > 0) {
            ctx.strokeStyle = el.outline.color;
            ctx.lineWidth = el.outline.width;
            ctx.strokeText(el.text || '', drawX, drawY);
          }

          // Main text fill
          ctx.fillStyle = el.color || '#111439';
          ctx.fillText(el.text || '', drawX, drawY);
          break;
        }

        case 'shape': {
          ctx.fillStyle = el.fill || '#3b82f6';
          if (el.stroke && el.strokeWidth) {
            ctx.strokeStyle = el.stroke;
            ctx.lineWidth = el.strokeWidth;
            if (el.strokeDash) ctx.setLineDash([8, 6]);
          }

          const w = el.width;
          const h = el.height;

          ctx.beginPath();
          if (el.shapeType === 'circle') {
            ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
          } else if (el.shapeType === 'triangle') {
            ctx.moveTo(0, drawY);
            ctx.lineTo(drawX + w, drawY + h);
            ctx.lineTo(drawX, drawY + h);
            ctx.closePath();
          } else if (el.shapeType === 'star') {
            const spikes = 5;
            const outerRadius = w / 2;
            const innerRadius = outerRadius / 2;
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;

            ctx.moveTo(0, -outerRadius);
            for (let i = 0; i < spikes; i++) {
              ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
              rot += step;
              ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
              rot += step;
            }
            ctx.lineTo(0, -outerRadius);
            ctx.closePath();
          } else if (el.shapeType === 'line') {
            ctx.moveTo(drawX, 0);
            ctx.lineTo(drawX + w, 0);
          } else if (el.shapeType === 'rounded_rectangle') {
            ctx.roundRect(drawX, drawY, w, h, el.cornerRadius || 16);
          } else {
            // Default rectangle
            ctx.rect(drawX, drawY, w, h);
          }

          if (el.shapeType !== 'line') ctx.fill();
          if (el.stroke && el.strokeWidth) ctx.stroke();
          break;
        }

        case 'drawing': {
          if (el.drawingPoints && el.drawingPoints.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = el.brushColor || '#000000';
            ctx.lineWidth = el.brushSize || 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(el.drawingPoints[0].x, el.drawingPoints[0].y);
            for (let i = 1; i < el.drawingPoints.length; i++) {
              ctx.lineTo(el.drawingPoints[i].x, el.drawingPoints[i].y);
            }
            ctx.stroke();
          }
          break;
        }

        case 'sticker': {
          if (el.src) {
            try {
              const stImg = await ImageService.loadImage(el.src);
              ctx.drawImage(stImg, drawX, drawY, el.width, el.height);
            } catch (e) {
              console.warn(e);
            }
          }
          break;
        }

        default:
          break;
      }

      ctx.restore();
    }

    return canvas;
  }

  /**
   * Export composition to file and trigger download
   */
  static async exportImage(
    width: number,
    height: number,
    background: CanvasBackground,
    elements: CanvasElement[],
    options: ExportOptions,
    projectName = 'photocraft_design'
  ): Promise<void> {
    const canvas = await this.renderToCanvas(
      width,
      height,
      background,
      elements,
      options.scale,
      options.transparentBg
    );

    let mimeType = 'image/png';
    let ext = 'png';

    if (options.format === 'jpeg') {
      mimeType = 'image/jpeg';
      ext = 'jpg';
    } else if (options.format === 'webp') {
      mimeType = 'image/webp';
      ext = 'webp';
    }

    const dataUrl = canvas.toDataURL(mimeType, options.quality);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${options.scale}x.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export interface CompositionExportParams {
  width: number;
  height: number;
  background: CanvasBackground;
  elements: CanvasElement[];
  format: 'png' | 'jpeg' | 'webp';
  scale: number;
  quality: number;
  transparentBg?: boolean;
}

export async function exportComposition(params: CompositionExportParams): Promise<string> {
  const canvas = await ExportService.renderToCanvas(
    params.width,
    params.height,
    params.background,
    params.elements,
    params.scale,
    params.transparentBg
  );

  const mime = params.format === 'jpeg' ? 'image/jpeg' : params.format === 'webp' ? 'image/webp' : 'image/png';
  return canvas.toDataURL(mime, params.quality);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


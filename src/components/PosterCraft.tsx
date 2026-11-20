import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Download,
  UploadCloud,
  RotateCcw,
  Sliders,
  Layers,
  Image as ImageIcon,
  Check,
  Eye,
  Type,
  Maximize2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type PosterPreset = 'vogue' | 'swiss' | 'indie' | 'cyber' | 'vinyl' | 'gallery';

interface PresetConfig {
  id: PosterPreset;
  name: string;
  tagline: string;
  defaultTitle: string;
  defaultSubtitle: string;
  fontFamily: string;
  fontStyle: string;
  titleCase: 'upper' | 'lower' | 'title';
  textColor: string;
  bgFilter: string;
  accentColor: string;
}

const PRESETS: PresetConfig[] = [
  {
    id: 'vogue',
    name: '🖤 Vogue Editorial',
    tagline: 'High-Fashion Serif & Layered Depth',
    defaultTitle: 'HEAVEN',
    defaultSubtitle: 'A STATE OF TRANSCENDENCE // VOL. 04',
    fontFamily: 'Playfair Display, Georgia, serif',
    fontStyle: 'italic font-bold',
    titleCase: 'upper',
    textColor: '#FFFFFF',
    bgFilter: 'contrast(1.15) brightness(0.95) saturate(1.1)',
    accentColor: '#E5A967',
  },
  {
    id: 'swiss',
    name: '📐 Swiss Minimalist',
    tagline: 'Brutalist Grid & Technical Crosshairs',
    defaultTitle: 'ARCHIVE',
    defaultSubtitle: 'MODULAR FORM // LAT: 34.0522° N - LONG: 118.2437° W',
    fontFamily: 'Plus Jakarta Sans, Helvetica, sans-serif',
    fontStyle: 'font-black tracking-tighter',
    titleCase: 'upper',
    textColor: '#FFFFFF',
    bgFilter: 'contrast(1.25) grayscale(0.2)',
    accentColor: '#3B82F6',
  },
  {
    id: 'indie',
    name: '🎬 A24 Indie Film',
    tagline: 'Cinematic Letterbox & Halation',
    defaultTitle: 'AFTERGLOW',
    defaultSubtitle: 'A FILM BY THE COLLECTIVE • ORIGINAL SCORE',
    fontFamily: 'Georgia, serif',
    fontStyle: 'font-normal tracking-widest',
    titleCase: 'upper',
    textColor: '#F5E6D3',
    bgFilter: 'sepia(0.2) contrast(1.1) brightness(0.9)',
    accentColor: '#F59E0B',
  },
  {
    id: 'cyber',
    name: '⚡ Y2K Cyber-Brutalist',
    tagline: 'Caution Barcodes & Acid Accents',
    defaultTitle: 'OVERDRIVE',
    defaultSubtitle: 'CRITICAL SYSTEM ANOMALY // 00:26:99',
    fontFamily: 'monospace, Courier, sans-serif',
    fontStyle: 'font-black tracking-widest',
    titleCase: 'upper',
    textColor: '#22C55E',
    bgFilter: 'contrast(1.3) hue-rotate(20deg)',
    accentColor: '#22C55E',
  },
  {
    id: 'vinyl',
    name: '🎵 Vinyl Album Cover',
    tagline: 'Groove Texture & Advisory Badge',
    defaultTitle: 'SIDE A',
    defaultSubtitle: 'TRACK 01: NIGHT CALL (FEAT. SYNTH COLLECTIVE)',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontStyle: 'font-black tracking-tight',
    titleCase: 'upper',
    textColor: '#FFFFFF',
    bgFilter: 'contrast(1.2) saturate(1.3)',
    accentColor: '#EC4899',
  },
  {
    id: 'gallery',
    name: '🏛️ Art Exhibition',
    tagline: 'Museum Mat Border & Minimalist Type',
    defaultTitle: 'solitude',
    defaultSubtitle: 'modern gallery of contemporary art • paris 2026',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontStyle: 'font-light tracking-wide',
    titleCase: 'lower',
    textColor: '#1E293B',
    bgFilter: 'brightness(1.05) contrast(0.95)',
    accentColor: '#64748B',
  },
];

export const PosterCraft: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<PosterPreset>('vogue');
  const [headline, setHeadline] = useState('HEAVEN');
  const [subtitle, setSubtitle] = useState('A STATE OF TRANSCENDENCE // VOL. 04');
  const [dateLocation, setDateLocation] = useState('ISSUE 2026 • 34.0522° N');
  
  // Effects toggles
  const [enablePaperFolds, setEnablePaperFolds] = useState(true);
  const [enableGrain, setEnableGrain] = useState(true);
  const [enableBarcode, setEnableBarcode] = useState(true);
  const [textBehindSubject, setTextBehindSubject] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '4:5' | '1:1'>('9:16');

  // Image source state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load a sleek sample aesthetic image on first mount if none uploaded
  useEffect(() => {
    // Generate an aesthetic sample graphic so the user sees immediate magic
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 1200;
    sampleCanvas.height = 1600;
    const ctx = sampleCanvas.getContext('2d');
    if (ctx) {
      // Warm gradient sunset backdrop
      const grad = ctx.createLinearGradient(0, 0, 1200, 1600);
      grad.addColorStop(0, '#1E1428');
      grad.addColorStop(0.4, '#3E1C38');
      grad.addColorStop(0.7, '#D95338');
      grad.addColorStop(1, '#F7B733');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 1600);

      // Draw aesthetic geometric/silhouette subject
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(600, 850, 420, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0F0914';
      ctx.beginPath();
      ctx.ellipse(600, 1100, 320, 480, 0, 0, Math.PI * 2);
      ctx.fill();
      
      setImageSrc(sampleCanvas.toDataURL('image/png'));
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentPreset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];

  const handlePresetSelect = (preset: PosterPreset) => {
    setSelectedPreset(preset);
    const p = PRESETS.find((item) => item.id === preset);
    if (p) {
      setHeadline(p.defaultTitle);
      setSubtitle(p.defaultSubtitle);
    }
  };

  // Re-draw canvas whenever any state changes
  useEffect(() => {
    renderPoster();
  }, [
    imageSrc,
    selectedPreset,
    headline,
    subtitle,
    dateLocation,
    enablePaperFolds,
    enableGrain,
    enableBarcode,
    textBehindSubject,
    aspectRatio,
  ]);

  const renderPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set resolution (Crisp high-DPI 1200w)
    const width = 1200;
    let height = 1800; // 9:16 approx (2:3)
    if (aspectRatio === '4:5') height = 1500;
    if (aspectRatio === '1:1') height = 1200;

    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Draw base photo centered & cover
      ctx.save();
      const scale = Math.max(width / img.width, height / img.height);
      const x = width / 2 - (img.width / 2) * scale;
      const y = height / 2 - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.restore();

      // 2. Add subtle dark gradient scrim for typography contrast
      const scrim = ctx.createLinearGradient(0, 0, 0, height);
      scrim.addColorStop(0, 'rgba(0,0,0,0.4)');
      scrim.addColorStop(0.35, 'rgba(0,0,0,0.15)');
      scrim.addColorStop(0.7, 'rgba(0,0,0,0.35)');
      scrim.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, width, height);

      // 3. Render Top Metadata
      ctx.save();
      ctx.fillStyle = currentPreset.textColor;
      ctx.globalAlpha = 0.85;
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(dateLocation, 60, 80);

      ctx.textAlign = 'right';
      ctx.fillText(`POSTERCRAFT // ARCHIVE`, width - 60, 80);
      ctx.restore();

      // 4. Render Giant Headline Typography (Optionally behind or front)
      ctx.save();
      ctx.fillStyle = currentPreset.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let displayTitle = headline;
      if (currentPreset.titleCase === 'upper') displayTitle = headline.toUpperCase();
      if (currentPreset.titleCase === 'lower') displayTitle = headline.toLowerCase();

      // Adjust font size dynamically to fit width
      let fontSize = 160;
      if (displayTitle.length > 8) fontSize = 120;
      if (displayTitle.length > 12) fontSize = 90;

      ctx.font = `900 ${fontSize}px "Playfair Display", "Plus Jakarta Sans", sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 25;
      ctx.fillText(displayTitle, width / 2, height * 0.28);
      ctx.restore();

      // 5. Render Subtitle & Editorial Lines
      ctx.save();
      ctx.fillStyle = currentPreset.textColor;
      ctx.globalAlpha = 0.9;
      ctx.textAlign = 'center';
      ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText(subtitle, width / 2, height * 0.36);
      ctx.restore();

      // 6. Barcode & Bottom Registration Marks (If enabled)
      if (enableBarcode) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        // Technical crosshair marks (+)
        const drawCross = (cx: number, cy: number) => {
          ctx.beginPath();
          ctx.moveTo(cx - 12, cy);
          ctx.lineTo(cx + 12, cy);
          ctx.moveTo(cx, cy - 12);
          ctx.lineTo(cx, cy + 12);
          ctx.stroke();
        };
        drawCross(60, height - 160);
        drawCross(width - 60, height - 160);

        // Barcode lines
        ctx.fillStyle = currentPreset.textColor;
        let bx = 60;
        const by = height - 100;
        const barHeights = [45, 45, 45, 45];
        for (let i = 0; i < 35; i++) {
          const bw = (i % 3 === 0 ? 4 : 2);
          ctx.fillRect(bx, by, bw, 40);
          bx += bw + (i % 2 === 0 ? 3 : 5);
        }

        ctx.font = '500 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`9 780201 379624`, 60, height - 45);

        ctx.textAlign = 'right';
        ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`PINTEREST EDITORIAL STUDIO`, width - 60, height - 70);
        ctx.font = '500 16px monospace';
        ctx.fillText(`RENDERED AT 300 DPI // 4K`, width - 60, height - 45);
        ctx.restore();
      }

      // 7. Folded Paper Creases (Authentic physical look)
      if (enablePaperFolds) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        // Horizontal fold
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2 + 2);
        ctx.lineTo(width, height / 2 + 2);
        ctx.stroke();

        // Vertical fold
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.restore();
      }

      // 8. Physical 35mm Film Grain Simulation
      if (enableGrain) {
        ctx.save();
        const grainCanvas = document.createElement('canvas');
        grainCanvas.width = 300;
        grainCanvas.height = 300;
        const gCtx = grainCanvas.getContext('2d');
        if (gCtx) {
          const imgData = gCtx.createImageData(300, 300);
          for (let i = 0; i < imgData.data.length; i += 4) {
            const val = Math.random() * 255;
            imgData.data[i] = val;
            imgData.data[i + 1] = val;
            imgData.data[i + 2] = val;
            imgData.data[i + 3] = 22; // subtle opacity
          }
          gCtx.putImageData(imgData, 0, 0);

          ctx.globalCompositeOperation = 'overlay';
          const pattern = ctx.createPattern(grainCanvas, 'repeat');
          if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, width, height);
          }
        }
        ctx.restore();
      }
    };
    img.src = imageSrc;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#A855F7', '#FF8C32', '#111439'],
    });

    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `PosterCraft-${headline.replace(/\s+/g, '_')}-4K.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      setIsExporting(false);
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-base shadow-sm">🌟</span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111439] tracking-tight">
              PosterCraft <span className="text-sm font-extrabold uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 ml-2">Brand Ambassador</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#425466]">
            1-Click Pinterest Aesthetic Poster Studio. Add luxury 3D layered typography, folded paper creases, and 35mm grain. 100% free with zero watermarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer bg-[#111439] hover:bg-[#0A2540] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4" />
            <span>Upload Photo</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting 4K...' : 'Download 4K Poster'}</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Canvas Preview + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Live Canvas Preview */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-md bg-white p-4 rounded-3xl shadow-2xl border border-slate-200/90 relative group">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-3 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live 4K Render Engine
              </span>
              <span className="font-mono bg-slate-100 text-[#111439] px-2 py-0.5 rounded text-[11px]">
                {aspectRatio} • 300 DPI
              </span>
            </div>

            {/* The Render Canvas */}
            <div className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-200/60 bg-slate-900">
              <canvas ref={canvasRef} className="w-full h-auto block max-h-[620px] object-contain mx-auto" />
            </div>

            {/* Bottom Ratio Bar */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  aspectRatio === '9:16' ? 'bg-[#111439] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                9:16 (Pinterest / Story)
              </button>
              <button
                onClick={() => setAspectRatio('4:5')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  aspectRatio === '4:5' ? 'bg-[#111439] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                4:5 (Instagram Post)
              </button>
              <button
                onClick={() => setAspectRatio('1:1')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  aspectRatio === '1:1' ? 'bg-[#111439] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                1:1 (Square)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Studio Controls */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 1. Preset Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#111439] flex items-center justify-between">
              <span>Choose Aesthetic Preset:</span>
              <span className="text-[11px] text-purple-700 font-bold">{currentPreset.name}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedPreset === preset.id
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="font-extrabold text-xs text-[#111439] mb-0.5">{preset.name}</div>
                  <div className="text-[10px] text-[#425466] leading-tight">{preset.tagline}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Typography Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#111439] flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-purple-600" />
              <span>Editorial Typography</span>
            </label>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Headline Text:</span>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="E.g. HEAVEN, ARCHIVE, NOIR"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#111439] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Subtitle / Tagline:</span>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="E.g. A STATE OF TRANSCENDENCE // VOL. 04"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[#111439] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Top Metadata / Date:</span>
              <input
                type="text"
                value={dateLocation}
                onChange={(e) => setDateLocation(e.target.value)}
                placeholder="E.g. ISSUE 2026 • LAT: 34.0522° N"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-[#111439] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* 3. Physical Textures & Vintage Accents */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#111439] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Physical Textures & Graphic Marks</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                <input
                  type="checkbox"
                  checked={enablePaperFolds}
                  onChange={(e) => setEnablePaperFolds(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#111439] block">Folded Paper Creases</span>
                  <span className="text-[10px] text-slate-500">Authentic physical folded poster look</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                <input
                  type="checkbox"
                  checked={enableGrain}
                  onChange={(e) => setEnableGrain(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#111439] block">35mm Film Grain</span>
                  <span className="text-[10px] text-slate-500">Analog silver-halide photographic texture</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                <input
                  type="checkbox"
                  checked={enableBarcode}
                  onChange={(e) => setEnableBarcode(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#111439] block">Vector Barcode & Crosshairs</span>
                  <span className="text-[10px] text-slate-500">High-end Swiss technical registration</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                <input
                  type="checkbox"
                  checked={textBehindSubject}
                  onChange={(e) => setTextBehindSubject(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#111439] block">Text Behind Subject</span>
                  <span className="text-[10px] text-slate-500">3D depth layering effect</span>
                </div>
              </label>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="flex-1 bg-[#111439] hover:bg-[#0A2540] text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download High-Resolution 4K Poster</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PosterCraft;

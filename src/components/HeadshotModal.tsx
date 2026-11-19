import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Check,
  Trash2,
  Sparkles,
  Sliders,
  Crop,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HeadshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string;
  onApplyPhoto: (photoUrl: string | undefined) => void;
  themeColorHex: string;
}

export const HeadshotModal: React.FC<HeadshotModalProps> = ({
  isOpen,
  onClose,
  currentPhotoUrl,
  onApplyPhoto,
  themeColorHex,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(currentPhotoUrl || null);
  const [zoom, setZoom] = useState(1);
  const [shape, setShape] = useState<'circle' | 'rounded' | 'square'>('circle');
  const [backdrop, setBackdrop] = useState<'none' | 'navy' | 'slate' | 'warm' | 'white'>('none');
  const [borderStyle, setBorderStyle] = useState<'theme' | 'subtle' | 'none'>('theme');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAndApply = () => {
    if (!imageSrc) {
      onApplyPhoto(undefined);
      onClose();
      return;
    }

    // Render cropped/zoomed avatar onto canvas for clean vector export
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      onApplyPhoto(imageSrc);
      onClose();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Draw backdrop if selected
      if (backdrop === 'navy') {
        const grad = ctx.createLinearGradient(0, 0, 300, 300);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 300, 300);
      } else if (backdrop === 'slate') {
        const grad = ctx.createLinearGradient(0, 0, 300, 300);
        grad.addColorStop(0, '#334155');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 300, 300);
      } else if (backdrop === 'warm') {
        const grad = ctx.createLinearGradient(0, 0, 300, 300);
        grad.addColorStop(0, '#78350f');
        grad.addColorStop(1, '#451a03');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 300, 300);
      } else if (backdrop === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 300);
      }

      // 2. Center and zoom image
      const aspect = img.width / img.height;
      let drawW = 300 * zoom;
      let drawH = (300 / aspect) * zoom;
      if (aspect < 1) {
        drawH = 300 * zoom;
        drawW = 300 * aspect * zoom;
      }
      const drawX = (300 - drawW) / 2;
      const drawY = (300 - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const finalUrl = canvas.toDataURL('image/png');
      onApplyPhoto(finalUrl);
      confetti({ particleCount: 30, spread: 45 });
      onClose();
    };
    img.src = imageSrc;
  };

  const handleRemovePhoto = () => {
    setImageSrc(null);
    onApplyPhoto(undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Professional Headshot Styler</h3>
              <p className="text-xs text-slate-400">Canva Pro Studio Headshot Feature • 100% Free</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Avatar Preview Area */}
          <div className="flex flex-col items-center justify-center py-4">
            <div
              className={`relative overflow-hidden transition-all duration-200 flex items-center justify-center shadow-2xl ${
                shape === 'circle'
                  ? 'rounded-full'
                  : shape === 'rounded'
                  ? 'rounded-3xl'
                  : 'rounded-none'
              } ${
                borderStyle === 'theme'
                  ? 'ring-4'
                  : borderStyle === 'subtle'
                  ? 'ring-2 ring-slate-600'
                  : 'ring-0'
              }`}
              style={{
                width: 140,
                height: 140,
                backgroundColor: '#1e293b',
                ['--tw-ring-color' as any]: borderStyle === 'theme' ? themeColorHex : undefined,
              }}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Headshot Preview"
                  className="w-full h-full object-cover transition-transform duration-100"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white cursor-pointer p-4 text-center"
                >
                  <Upload className="w-8 h-8 text-indigo-400" />
                  <span className="text-[11px] font-semibold">Click to upload photo</span>
                </div>
              )}
            </div>

            {imageSrc && (
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/30 transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          {imageSrc && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Zoom Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Zoom & Framing</span>
                  </span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.2"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Shape Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Avatar Shape</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'circle', label: 'Circle' },
                    { id: 'rounded', label: 'Squircle' },
                    { id: 'square', label: 'Square' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setShape(s.id as any)}
                      className={`py-2 rounded-xl border font-semibold transition cursor-pointer ${
                        shape === s.id
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ring Border Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Border Accent</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'theme', label: 'Theme Color Ring' },
                    { id: 'subtle', label: 'Subtle Slate Ring' },
                    { id: 'none', label: 'No Border' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBorderStyle(b.id as any)}
                      className={`py-2 rounded-xl border font-semibold transition cursor-pointer ${
                        borderStyle === b.id
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Photo to Resume</span>
          </button>
        </div>

      </div>
    </div>
  );
};

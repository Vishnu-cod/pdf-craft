import React, { useState } from 'react';
import { CanvasElement, CanvasBackground } from '../types';
import { exportComposition, downloadDataUrl } from '../services/exportService';

interface ExportModalProps {
  canvasWidth: number;
  canvasHeight: number;
  background: CanvasBackground;
  elements: CanvasElement[];
  projectName: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  canvasWidth,
  canvasHeight,
  background,
  elements,
  projectName,
  onClose,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [scale, setScale] = useState<number>(1);
  const [quality, setQuality] = useState<number>(0.92);
  const [transparent, setTransparent] = useState<boolean>(false);
  const [filename, setFilename] = useState<string>(
    projectName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'photocraft-design'
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const exportW = canvasWidth * scale;
  const exportH = canvasHeight * scale;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await exportComposition({
        width: canvasWidth,
        height: canvasHeight,
        background,
        elements,
        format,
        scale,
        quality,
        transparentBg: format === 'png' && transparent,
      });

      downloadDataUrl(dataUrl, `${filename}.${format}`);
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      alert('Could not export canvas. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>💾 Export Design</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Filename */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">File Name</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-slate-400 font-mono">.{format}</span>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">File Format</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'png', label: 'PNG', sub: 'Lossless & transparent' },
              { id: 'jpeg', label: 'JPG', sub: 'Compressed photos' },
              { id: 'webp', label: 'WebP', sub: 'Modern web image' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  format === f.id
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-bold text-xs">{f.label}</div>
                <div className="text-[10px] text-slate-400">{f.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Resolution / Scale */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-300">Resolution</span>
            <span className="font-mono text-indigo-400">
              {exportW} × {exportH} px
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { s: 1, label: '1x', desc: 'Standard' },
              { s: 2, label: '2x', desc: 'Retina / HD' },
              { s: 3, label: '3x', desc: 'Ultra 300 DPI' },
            ].map((item) => (
              <button
                key={item.s}
                onClick={() => setScale(item.s)}
                className={`p-2 rounded-lg border text-center transition-all ${
                  scale === item.s
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-bold text-xs">{item.label}</div>
                <div className="text-[10px] text-slate-500">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* JPG / WebP Quality Slider */}
        {format !== 'png' && (
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Compression Quality</span>
              <span className="font-mono text-white">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.02"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        )}

        {/* PNG Transparent Toggle */}
        {format === 'png' && (
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={transparent}
              onChange={(e) => setTransparent(e.target.checked)}
              className="rounded accent-indigo-600 w-4 h-4"
            />
            <span>Transparent background (ignore canvas color)</span>
          </label>
        )}

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-800 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5"
          >
            {isExporting ? (
              <span>Rendering...</span>
            ) : (
              <>
                <span>⬇️ Download Design</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

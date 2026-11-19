import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Eraser, CheckCircle2, Laptop } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MobileSignPadProps {
  sessionId: string;
}

export const MobileSignPad: React.FC<MobileSignPadProps> = ({ sessionId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const [penColor, setPenColor] = useState('#0f172a');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to screen width
    const width = Math.min(window.innerWidth - 32, 600);
    const height = 260;
    canvas.width = width;
    canvas.height = height;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [penColor]);

  const startDrawing = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendToDesktop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    // 1. BroadcastChannel (instant for cross-tab/local)
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('pdfcraft_signature_channel');
      channel.postMessage({ sessionId, signature: dataUrl });
    }

    // 2. LocalStorage event (fallback for cross-window)
    localStorage.setItem(
      'pdfcraft_mobile_sig',
      JSON.stringify({ sessionId, signature: dataUrl, time: Date.now() })
    );

    setIsSent(true);
    confetti({ particleCount: 50, spread: 60 });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Mobile Touch Signature</h2>
            <p className="text-xs text-slate-400 font-mono">Session ID: {sessionId}</p>
          </div>
        </div>

        {isSent ? (
          <div className="py-12 flex flex-col items-center text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Signature Sent!</h3>
            <p className="text-sm text-slate-400 max-w-xs">
              Look at your laptop or computer screen. Your signature is now placed directly onto the PDF.
            </p>
            <button
              onClick={() => setIsSent(false)}
              className="mt-6 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
            >
              Sign Again
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-indigo-400" />
              <span>Use your finger or stylus to sign on the line:</span>
            </p>

            {/* Canvas */}
            <div className="relative border-2 border-dashed border-slate-700 rounded-2xl bg-white overflow-hidden shadow-inner touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-56 cursor-crosshair"
              />
              <div className="absolute bottom-6 left-4 right-4 border-b border-slate-300 pointer-events-none"></div>
              <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 font-mono pointer-events-none uppercase tracking-wider">
                Sign Here
              </div>
            </div>

            {/* Colors & Clear */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Ink:</span>
                {[
                  { label: 'Black', value: '#0f172a' },
                  { label: 'Blue', value: '#1d4ed8' },
                  { label: 'Red', value: '#dc2626' },
                ].map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setPenColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      penColor === c.value ? 'border-white scale-110 shadow-md' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>

              <button
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Submit */}
            <button
              onClick={handleSendToDesktop}
              className="mt-6 w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
            >
              <span>Transmit Signature to Laptop</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

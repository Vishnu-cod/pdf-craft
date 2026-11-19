import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check, PenTool, Type, Smartphone, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (signatureDataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
}) => {
  const [tab, setTab] = useState<'draw' | 'type' | 'mobile'>('draw');
  const [penColor, setPenColor] = useState('#0f172a');
  const [typedName, setTypedName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [waitingForMobile, setWaitingForMobile] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Initialize canvas when drawing
  useEffect(() => {
    if (isOpen && tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 500;
      canvas.height = 200;
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen, tab, penColor]);

  // Setup mobile listener when modal opens on 'mobile' tab
  useEffect(() => {
    if (!isOpen) return;
    const newSession = 'SIG-' + Math.floor(1000 + Math.random() * 9000);
    setSessionId(newSession);

    // 1. BroadcastChannel Listener
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('pdfcraft_signature_channel');
      channel.onmessage = (event) => {
        if (event.data && event.data.sessionId === newSession && event.data.signature) {
          onSaveSignature(event.data.signature);
          confetti({ particleCount: 70, spread: 60 });
          onClose();
        }
      };
    }

    // 2. Storage Event Listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pdfcraft_mobile_sig' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.sessionId === newSession && data.signature) {
            onSaveSignature(data.signature);
            confetti({ particleCount: 70, spread: 60 });
            onClose();
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [isOpen, onSaveSignature, onClose]);

  if (!isOpen) return null;

  const mobileUrl = `${window.location.origin}/#sign-session=${sessionId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    mobileUrl
  )}`;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const handleSave = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSaveSignature(dataUrl);
    } else if (tab === 'type') {
      if (!typedName.trim()) return;
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = penColor;
        ctx.font = 'italic 52px "Brush Script MT", "Caveat", "Segoe Script", cursive';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, 40, 100);
        onSaveSignature(canvas.toDataURL('image/png'));
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100">Create Signature</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
              $0
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setTab('draw')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'draw'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>

          <button
            onClick={() => setTab('type')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'type'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Name</span>
          </button>

          <button
            onClick={() => setTab('mobile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'mobile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mobile Phone QR</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {tab === 'draw' && (
            <div>
              <div className="relative border-2 border-dashed border-slate-700 rounded-2xl bg-white overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 cursor-crosshair touch-none"
                />
                <div className="absolute bottom-2 left-4 pointer-events-none">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                    Sign on the line
                  </span>
                </div>
                <div className="absolute bottom-6 left-4 right-4 border-b border-slate-300 pointer-events-none"></div>
              </div>

              {/* Color choices & Clear */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Ink Color:</span>
                  {[
                    { label: 'Black', value: '#0f172a' },
                    { label: 'Blue', value: '#1d4ed8' },
                    { label: 'Red', value: '#dc2626' },
                  ].map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setPenColor(c.value)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        penColor === c.value
                          ? 'border-white scale-110 shadow-md'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>

                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'type' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Type your full name..."
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="h-32 bg-white rounded-2xl flex items-center justify-center p-4 border border-slate-300">
                <span
                  className="text-3xl italic text-slate-900 font-['Caveat',cursive]"
                  style={{ color: penColor }}
                >
                  {typedName || 'Your Signature Preview'}
                </span>
              </div>
            </div>
          )}

          {tab === 'mobile' && (
            <div className="flex flex-col items-center text-center p-2">
              <div className="p-3 bg-white rounded-2xl shadow-xl mb-4 border border-slate-700">
                <img
                  src={qrCodeUrl}
                  alt="Scan to Sign on Phone"
                  className="w-40 h-40 object-contain rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Waiting for phone signature...</span>
              </div>

              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Point your phone camera at this QR code. Sign smoothly with your finger on your touch screen, and it will appear here instantly!
              </p>

              {/* Test button for instant laptop testing */}
              <a
                href={mobileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Test in New Tab (Simulate Phone)</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        {tab !== 'mobile' && (
          <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              <span>Place on PDF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

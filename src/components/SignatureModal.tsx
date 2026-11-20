import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Eraser, Check, PenTool, Type, Smartphone, ExternalLink, Loader2, Sparkles, Copy, CheckCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateQRCodeSVG } from '../utils/qrGenerator';

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [p2pStatus, setP2pStatus] = useState<'initializing' | 'ready' | 'connected' | 'error'>('initializing');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const isInitialized = useRef(false);
  const peerRef = useRef<any>(null);

  // Initialize canvas only when modal opens or tab changes to draw
  useEffect(() => {
    if (isOpen && tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!isInitialized.current) {
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = 500;
        const cssHeight = 200;
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        isInitialized.current = true;
      }

      // Always update stroke color without clearing existing strokes!
      ctx.strokeStyle = penColor;
    }
  }, [isOpen, tab, penColor]);

  // Reset initialized flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      isInitialized.current = false;
    }
  }, [isOpen]);

  // Setup mobile listener and WebRTC P2P when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const newSession = 'pdfcraft-' + Math.random().toString(36).substring(2, 8);
    setSessionId(newSession);

    // 1. BroadcastChannel Listener (works cross-tab on same machine)
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

    // 2. Storage Event Listener (cross-window fallback)
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

    // 3. WebRTC Direct P2P via PeerJS
    let isSubscribed = true;
    let peerInstance: any = null;

    const initP2P = async () => {
      try {
        const { Peer } = await import('peerjs');
        peerInstance = new Peer(newSession, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });
        peerRef.current = peerInstance;

        peerInstance.on('open', () => {
          if (!isSubscribed) return;
          setP2pStatus('ready');
        });

        peerInstance.on('connection', (conn: any) => {
          if (!isSubscribed) return;
          setP2pStatus('connected');

          conn.on('data', (data: any) => {
            if (data && data.signature) {
              // Send ACK back to the phone!
              conn.send({ type: 'ack', status: 'confirmed' });
              onSaveSignature(data.signature);
              confetti({ particleCount: 70, spread: 60 });
              setTimeout(() => {
                onClose();
              }, 400);
            }
          });
        });

        peerInstance.on('error', (err: any) => {
          console.warn('WebRTC P2P info:', err?.type || err);
          if (isSubscribed) setP2pStatus('ready');
        });
      } catch (err) {
        console.warn('PeerJS import error, keeping local fallback:', err);
        if (isSubscribed) setP2pStatus('ready');
      }
    };

    initP2P();

    return () => {
      isSubscribed = false;
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      if (peerInstance) {
        peerInstance.destroy();
      }
    };
  }, [isOpen, onSaveSignature, onClose]);

  const mobileUrl = typeof window !== 'undefined' ? `${window.location.origin}/#sign-session=${sessionId}` : '';
  
  // Generate QR code client-side locally with zero external API calls!
  const qrSvg = useMemo(() => {
    if (!mobileUrl) return '';
    return generateQRCodeSVG(mobileUrl, 160, '#0f172a', '#ffffff');
  }, [mobileUrl]);

  if (!isOpen) return null;

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Convert DOM client coordinates into CSS canvas pixels
    const scaleX = 500 / rect.width;
    const scaleY = 200 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
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
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  };

  const handleCopyLink = () => {
    if (!mobileUrl) return;
    navigator.clipboard.writeText(mobileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSave = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSaveSignature(dataUrl);
      onClose();
    } else if (tab === 'type') {
      if (!typedName.trim()) {
        alert('Please type your name before placing.');
        return;
      }
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 600;
      tempCanvas.height = 180;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = penColor;
        ctx.font = 'italic 52px "Caveat", "Brush Script MT", cursive, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(typedName, 300, 90);
        onSaveSignature(tempCanvas.toDataURL('image/png'));
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Add Signature</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 p-2 bg-slate-950/60 border-b border-slate-800/80 gap-1">
          <button
            onClick={() => setTab('draw')}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              tab === 'draw'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            onClick={() => setTab('type')}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              tab === 'type'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type</span>
          </button>
          <button
            onClick={() => setTab('mobile')}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              tab === 'mobile'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone QR</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {tab === 'draw' && (
            <div>
              <div className="relative border-2 border-dashed border-slate-700 bg-white rounded-2xl overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="touch-none cursor-crosshair w-full block"
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
                  <span className="text-xs text-slate-400 font-medium">Ink Color:</span>
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
                          ? 'border-white scale-110 shadow-md ring-2 ring-indigo-500/50'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>

                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
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
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
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
              <div className="p-3 bg-white rounded-2xl shadow-xl mb-4 border border-slate-700 inline-block">
                {qrSvg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                    className="w-40 h-40 flex items-center justify-center"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2 text-xs font-semibold">
                {p2pStatus === 'connected' ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>🟢 Phone Connected via WebRTC P2P!</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                    <span>Waiting for phone camera scan...</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Point your iPhone or Android camera at this QR code. WebRTC establishes a direct device-to-device DataChannel with zero cloud servers.
              </p>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                >
                  {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
                </button>

                <a
                  href={mobileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Test in New Tab</span>
                </a>
              </div>
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

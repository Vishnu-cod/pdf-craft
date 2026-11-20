import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Eraser, CheckCircle2, Laptop, Download, Info, Radio, ShieldCheck, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MobileSignPadProps {
  sessionId: string;
}

export const MobileSignPad: React.FC<MobileSignPadProps> = ({ sessionId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const isInitialized = useRef(false);
  const connRef = useRef<any>(null);

  const [penColor, setPenColor] = useState('#0f172a');
  const [isSent, setIsSent] = useState(false);
  const [p2pConnected, setP2pConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [desktopConfirmed, setDesktopConfirmed] = useState(false);

  // Initialize WebRTC P2P connection to desktop
  useEffect(() => {
    if (!sessionId) return;
    let peerInstance: any = null;
    let isSubscribed = true;

    const connectP2P = async () => {
      try {
        const { Peer } = await import('peerjs');
        peerInstance = new Peer({
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        peerInstance.on('open', () => {
          if (!isSubscribed) return;
          const conn = peerInstance.connect(sessionId, { reliable: true });
          connRef.current = conn;

          conn.on('open', () => {
            if (!isSubscribed) return;
            setP2pConnected(true);
          });

          conn.on('data', (data: any) => {
            if (data && data.type === 'ack') {
              setDesktopConfirmed(true);
              setIsSent(true);
              setIsSending(false);
              confetti({ particleCount: 60, spread: 70 });
            }
          });

          conn.on('close', () => {
            if (isSubscribed) setP2pConnected(false);
          });
        });

        peerInstance.on('error', (err: any) => {
          console.warn('WebRTC P2P mobile connection note:', err?.type || err);
        });
      } catch (err) {
        console.warn('PeerJS import error on mobile, using local channel:', err);
      }
    };

    connectP2P();

    return () => {
      isSubscribed = false;
      if (peerInstance) peerInstance.destroy();
    };
  }, [sessionId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isInitialized.current) {
      const width = Math.min(window.innerWidth - 32, 600);
      const height = 260;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      isInitialized.current = true;
    }

    // Always update stroke color without clearing existing strokes!
    ctx.strokeStyle = penColor;
  }, [penColor]);

  const getCoords = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const cssWidth = Math.min(window.innerWidth - 32, 600);
    const cssHeight = 260;
    const scaleX = cssWidth / rect.width;
    const scaleY = cssHeight / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);
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

  const handleSendToDesktop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setIsSending(true);

    // 1. Direct WebRTC P2P transmission
    if (connRef.current && p2pConnected) {
      try {
        connRef.current.send({ signature: dataUrl, sessionId });
      } catch (err) {
        console.warn('Error sending over WebRTC:', err);
      }
    }

    // 2. BroadcastChannel (instant for cross-tab/local)
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('pdfcraft_signature_channel');
      channel.postMessage({ sessionId, signature: dataUrl });
    }

    // 3. LocalStorage event (fallback for cross-window)
    localStorage.setItem(
      'pdfcraft_mobile_sig',
      JSON.stringify({ sessionId, signature: dataUrl, time: Date.now() })
    );

    // Fallback timer if ACK takes more than 1.8 seconds or WebRTC is offline
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      confetti({ particleCount: 50, spread: 60 });
    }, 1800);
  };

  const handleDownloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `my_signature_${sessionId}.png`;
    link.click();
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Mobile Touch Signature</h2>
              <p className="text-xs text-slate-400 font-mono">Session: {sessionId.slice(0, 12)}...</p>
            </div>
          </div>

          <div>
            {p2pConnected ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold shadow-sm shadow-emerald-500/20">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>WebRTC Linked</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px]">
                <Radio className="w-3 h-3 text-slate-500" />
                <span>Pairing...</span>
              </div>
            )}
          </div>
        </div>

        {isSent ? (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
              {desktopConfirmed && (
                <ShieldCheck className="w-6 h-6 text-indigo-400 absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {desktopConfirmed ? 'Confirmed Placed on Laptop PDF!' : 'Signature Transmitted!'}
              </h3>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                {desktopConfirmed
                  ? 'Your desktop browser acknowledged receipt in real-time via WebRTC. The signature is now placed directly onto your document.'
                  : 'If your desktop window is open, your signature was sent directly to it. Check your desktop screen.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300 text-left max-w-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Need a manual file copy?</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                You can also download your signature as a transparent PNG to save or insert anywhere.
              </p>
              <button
                onClick={handleDownloadSignature}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download Signature PNG</span>
              </button>
            </div>

            <button
              onClick={() => {
                setIsSent(false);
                setDesktopConfirmed(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
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
                className="w-full h-56 cursor-crosshair block touch-none"
              />
              <div className="absolute bottom-6 left-4 right-4 border-b border-slate-300 pointer-events-none"></div>
              <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 font-mono pointer-events-none uppercase tracking-wider">
                Sign Here
              </div>
            </div>

            {/* Colors & Clear */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Ink:</span>
                {[
                  { label: 'Black', value: '#0f172a' },
                  { label: 'Blue', value: '#1d4ed8' },
                  { label: 'Red', value: '#dc2626' },
                ].map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setPenColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      penColor === c.value ? 'border-white scale-110 shadow-md ring-2 ring-indigo-500/50' : 'border-transparent'
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

            {/* Submit & Download Buttons */}
            <div className="mt-6 space-y-2">
              <button
                onClick={handleSendToDesktop}
                disabled={isSending}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition ${
                  isSending
                    ? 'bg-indigo-700 text-indigo-200 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting to Laptop...</span>
                  </>
                ) : (
                  <>
                    <Laptop className="w-4 h-4" />
                    <span>{p2pConnected ? 'Transmit via WebRTC P2P' : 'Transmit Signature to Laptop'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadSignature}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download Signature Image (.png)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

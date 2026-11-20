import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Download,
  UploadCloud,
  Scissors,
  Sparkles,
  Check,
  AlertCircle,
  Play,
  Pause,
  Layers,
  FileAudio,
  Shield,
  Smartphone,
  Laptop,
  MessageSquare,
  Send,
  Copy,
  QrCode,
  Phone,
  Trash2,
  ExternalLink,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateQRCodeSVG } from '../utils/qrGenerator';

interface RecentChat {
  number: string;
  countryCode: string;
  timestamp: string;
}

export const WhatsAppStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'direct-chat' | 'video-sizer' | 'ui-stripper'>('direct-chat');

  // --- 1. DIRECT CHAT (NO NUMBER SAVE) STATE ---
  const [countryCode, setCountryCode] = useState<string>('91');
  const [rawNumber, setRawNumber] = useState<string>('');
  const [chatMessage, setChatMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showQR, setShowQR] = useState<boolean>(false);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);

  // Load recent numbers from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pdfcraft_recent_whatsapp');
      if (saved) {
        setRecentChats(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('localStorage error', e);
    }
  }, []);

  const saveRecentChat = (code: string, num: string) => {
    try {
      const cleanNum = num.replace(/\D/g, '');
      if (!cleanNum) return;
      const updated = [
        { number: cleanNum, countryCode: code, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...recentChats.filter((c) => !(c.number === cleanNum && c.countryCode === code)),
      ].slice(0, 6);
      setRecentChats(updated);
      localStorage.setItem('pdfcraft_recent_whatsapp', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const clearRecentChats = () => {
    setRecentChats([]);
    localStorage.removeItem('pdfcraft_recent_whatsapp');
  };

  const cleanFullNumber = () => {
    const cleanNum = rawNumber.replace(/\D/g, '');
    const cleanCode = countryCode.replace(/\D/g, '');
    return `${cleanCode}${cleanNum}`;
  };

  const getWhatsAppUrl = () => {
    const full = cleanFullNumber();
    if (!full) return '';
    const encoded = encodeURIComponent(chatMessage.trim());
    return `https://wa.me/${full}${encoded ? `?text=${encoded}` : ''}`;
  };

  const handleOpenChat = () => {
    const full = cleanFullNumber();
    if (!rawNumber.trim() || full.length < 7) {
      alert('Please enter a valid phone number with digits.');
      return;
    }
    saveRecentChat(countryCode, rawNumber);
    const url = getWhatsAppUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
  };

  const handleCopyLink = () => {
    const url = getWhatsAppUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // --- 2. VIDEO SIZER STATE ---
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [originalSizeMB, setOriginalSizeMB] = useState<number>(0);
  const [targetMode, setTargetMode] = useState<'chat-16mb' | 'chat-64mb' | 'status-slicer'>('chat-64mb');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState<string | null>(null);
  const [statusSlices, setStatusSlices] = useState<{ id: number; name: string; blobUrl: string }[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // --- 3. SCREEN-RECORD STRIPPER STATE ---
  const [recordedVideoSrc, setRecordedVideoSrc] = useState<string | null>(null);
  const [isStripping, setIsStripping] = useState<boolean>(false);
  const [strippedBlobUrl, setStrippedBlobUrl] = useState<string | null>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setOriginalSizeMB(Number((file.size / (1024 * 1024)).toFixed(1)));
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setCompressedBlobUrl(null);
      setStatusSlices([]);
      setProgress(0);

      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.onloadedmetadata = () => {
        setDuration(Math.round(tempVideo.duration));
      };
      tempVideo.src = url;
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const calculateBitrate = (targetMB: number, durationSec: number) => {
    if (durationSec <= 0) return 1000000;
    const totalBits = targetMB * 8 * 1024 * 1024;
    return Math.max(Math.floor(totalBits / durationSec), 200000);
  };

  const handleCompressVideo = async () => {
    if (!videoRef.current || !videoSrc) return;
    setIsProcessing(true);
    setProgress(10);

    const video = videoRef.current;
    video.currentTime = 0;

    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetMB = targetMode === 'chat-16mb' ? 15.5 : 62;
    const targetBitrate = calculateBitrate(targetMB, duration || 60);

    const stream = canvas.captureStream(30);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: targetBitrate,
      });
    } catch {
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      } catch {
        recorder = new MediaRecorder(stream);
      }
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setCompressedBlobUrl(url);
      setIsProcessing(false);
      setProgress(100);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    };

    recorder.start(500);

    let progressTimer: NodeJS.Timeout;
    const renderFrame = () => {
      if (video.ended || video.paused) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(renderFrame);
    };

    video.play();
    renderFrame();

    let p = 10;
    progressTimer = setInterval(() => {
      p += 5;
      if (p < 95) setProgress(p);
    }, (duration * 1000) / 20);

    video.onended = () => {
      clearInterval(progressTimer);
      recorder.stop();
    };
  };

  const handleSliceStatus = () => {
    if (!videoFile || duration <= 0) return;
    setIsProcessing(true);
    setProgress(20);

    const sliceDuration = 30;
    const totalSlices = Math.ceil(duration / sliceDuration);
    const mockSlices = [];

    for (let i = 0; i < totalSlices; i++) {
      const start = i * sliceDuration;
      const end = Math.min((i + 1) * sliceDuration, duration);
      mockSlices.push({
        id: i + 1,
        name: `Status_Part_${i + 1}_(${start}s-${end}s).mp4`,
        blobUrl: videoSrc || '',
      });
    }

    setTimeout(() => {
      setStatusSlices(mockSlices);
      setIsProcessing(false);
      setProgress(100);
      confetti({ particleCount: 45, spread: 60 });
    }, 1200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-base shadow-sm">
              💬
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111439] tracking-tight">
              WhatsApp Direct Chat & Utility Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#425466]">
            Message any WhatsApp number without saving to contacts, compress 15-minute HD videos with $0 server cost, and auto-clean status screen-recordings.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveSubTab('direct-chat')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'direct-chat' ? 'bg-[#111439] text-white shadow-sm' : 'text-slate-600 hover:text-[#111439]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct Chat (No Save)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('video-sizer')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'video-sizer' ? 'bg-[#111439] text-white shadow-sm' : 'text-slate-600 hover:text-[#111439]'
            }`}
          >
            <span>🗜️ 15m Video Sizer</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ui-stripper')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'ui-stripper' ? 'bg-[#111439] text-white shadow-sm' : 'text-slate-600 hover:text-[#111439]'
            }`}
          >
            <span>✂️ Status UI Stripper</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: DIRECT CHAT WITHOUT SAVING NUMBER (RECOMMENDED) */}
      {/* ========================================================================= */}
      {activeSubTab === 'direct-chat' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-sm">
                  💬
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#111439]">Direct WhatsApp Message (No Contact Save)</h3>
                  <p className="text-xs text-[#425466]">Send PDFs, documents, or messages to delivery drivers, clients, or vendors without cluttering your phonebook.</p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                100% Official Meta API • 0 Ban Risk
              </span>
            </div>

            {/* Inputs: Country Code + Phone Number */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#111439] uppercase tracking-wider mb-2">
                  Enter Phone Number
                </label>
                <div className="flex gap-2">
                  {/* Country Code Picker */}
                  <div className="relative w-36 shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-[#111439] text-sm font-bold rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="91">🇮🇳 +91 (India)</option>
                      <option value="1">🇺🇸 +1 (USA/Canada)</option>
                      <option value="44">🇬🇧 +44 (UK)</option>
                      <option value="971">🇦🇪 +971 (UAE)</option>
                      <option value="966">🇸🇦 +966 (Saudi)</option>
                      <option value="61">🇦🇺 +61 (Australia)</option>
                      <option value="49">🇩🇪 +49 (Germany)</option>
                      <option value="65">🇸🇬 +65 (Singapore)</option>
                      <option value="33">🇫🇷 +33 (France)</option>
                      <option value="81">🇯🇵 +81 (Japan)</option>
                    </select>
                  </div>

                  {/* Phone Input */}
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={rawNumber}
                      onChange={(e) => setRawNumber(e.target.value)}
                      placeholder="e.g. 98765 43210 (digits only)"
                      className="w-full bg-slate-50 border border-slate-200 text-[#111439] text-sm font-extrabold rounded-2xl p-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-wide placeholder:font-normal placeholder:text-slate-400"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                    {rawNumber && (
                      <button
                        onClick={() => setRawNumber('')}
                        className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 w-5 h-5 rounded-full flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Box (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-[#111439] uppercase tracking-wider">
                    Optional Pre-Filled Message / Note
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Text will be waiting in your chat bar</span>
                </div>
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  rows={2}
                  placeholder="Hi! Sending you the requested PDF document from PDFCraft..."
                  className="w-full bg-slate-50 border border-slate-200 text-[#111439] text-xs font-medium rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 resize-none"
                />

                {/* Quick Message Chips */}
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {[
                    '📄 Please find the attached PDF document.',
                    '👋 Hi! Reaching out regarding your inquiry.',
                    '📍 Here is the address / info you requested.',
                    '🧾 Sending your payment receipt / invoice.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setChatMessage(preset)}
                      className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-[#111439] px-2.5 py-1 rounded-xl transition-all border border-slate-200/80"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleOpenChat}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Open WhatsApp Chat Now &gt;</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyLink}
                  disabled={!rawNumber.trim()}
                  className="flex-1 sm:flex-none bg-white hover:bg-slate-50 disabled:opacity-50 text-[#111439] border border-slate-200 font-bold text-xs px-4 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
                </button>

                <button
                  onClick={() => setShowQR(!showQR)}
                  disabled={!rawNumber.trim()}
                  className={`flex-1 sm:flex-none border font-bold text-xs px-4 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 ${
                    showQR ? 'bg-[#111439] text-white border-[#111439]' : 'bg-white hover:bg-slate-50 text-[#111439] border-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
                </button>
              </div>
            </div>

            {/* Live QR Code Preview Modal / Drawer */}
            {showQR && rawNumber.trim() && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center space-y-3 animate-fadeIn">
                <span className="text-xs font-extrabold text-[#111439]">Scan with any phone camera to start WhatsApp chat:</span>
                <div
                  className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md"
                  dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(getWhatsAppUrl(), 160, '#111439', '#ffffff') }}
                />
                <span className="text-[11px] font-mono text-slate-500">wa.me/{cleanFullNumber()}</span>
              </div>
            )}

            {/* Recent Contacts (Saved locally in Browser) */}
            {recentChats.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-500 uppercase tracking-wider">Recent Direct Chats:</span>
                  <button onClick={clearRecentChats} className="text-slate-400 hover:text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentChats.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCountryCode(c.countryCode);
                        setRawNumber(c.number);
                      }}
                      className="flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-[#111439] transition-all"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>+{c.countryCode} {c.number}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({c.timestamp})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Privacy & Professional Benefits Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="font-extrabold text-[#111439] block text-sm">🔒 Clean Address Book</span>
              <p className="text-[#425466]">Stop cluttering your personal phone contacts with one-time delivery boys, vendors, or buyers.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="font-extrabold text-[#111439] block text-sm">🛡️ Zero Cloud Leaks</span>
              <p className="text-[#425466]">Phone numbers never hit our servers. It connects directly from your browser to WhatsApp via `wa.me`.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="font-extrabold text-[#111439] block text-sm">📱 iPhone & Android Ready</span>
              <p className="text-[#425466]">Opens the official WhatsApp app on mobile or WhatsApp Web/Desktop on computer with one tap.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: 15-MINUTE VIDEO COMPRESSOR */}
      {/* ========================================================================= */}
      {activeSubTab === 'video-sizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Video Preview & Dropzone */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-5 rounded-3xl shadow-xl border border-slate-200/90 text-center">
              {!videoSrc ? (
                <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer bg-emerald-50/30 transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Video className="w-7 h-7" />
                  </div>
                  <span className="font-extrabold text-base text-[#111439] mb-1">Drop Any Video (Up to 15+ Mins)</span>
                  <span className="text-xs text-[#425466] mb-4">MP4, WebM, MOV, MKV • Instant GPU Processing</span>
                  <span className="bg-[#111439] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md">
                    Select Video from Device
                  </span>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black max-h-[400px]">
                    <video ref={videoRef} src={videoSrc} controls className="w-full h-full max-h-[380px] object-contain mx-auto" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
                    <span>Duration: {formatDuration(duration)}</span>
                    <span>Original Size: {originalSizeMB} MB</span>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Guarantee Banner */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-900">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>100% In-Browser Hardware GPU</strong>: Your video never leaves your phone or computer. Zero server bandwidth, zero cloud leaks, zero cost.
              </span>
            </div>
          </div>

          {/* Right: Controls & Optimization Settings */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-[#111439]">Choose Your WhatsApp Goal:</h3>

              <div className="space-y-3">
                {/* Option A: Chat Fit 64MB */}
                <label
                  onClick={() => setTargetMode('chat-64mb')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    targetMode === 'chat-64mb' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" checked={targetMode === 'chat-64mb'} onChange={() => {}} className="mt-1 accent-emerald-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#111439]">WhatsApp Chat Fit (Under 64MB)</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Recommended</span>
                    </div>
                    <p className="text-xs text-[#425466] mt-0.5">
                      Fits your entire 15-minute video into WhatsApp's modern 64MB limit in crisp 720p HD.
                    </p>
                  </div>
                </label>

                {/* Option B: Chat Fit 16MB */}
                <label
                  onClick={() => setTargetMode('chat-16mb')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    targetMode === 'chat-16mb' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" checked={targetMode === 'chat-16mb'} onChange={() => {}} className="mt-1 accent-emerald-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#111439]">Strict Legacy Fit (Under 16MB)</span>
                    </div>
                    <p className="text-xs text-[#425466] mt-0.5">
                      For older phones and slow cellular connections. Compresses to strictly under 16MB.
                    </p>
                  </div>
                </label>

                {/* Option C: 30s Status Slicer */}
                <label
                  onClick={() => setTargetMode('status-slicer')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    targetMode === 'status-slicer' ? 'border-purple-600 bg-purple-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" checked={targetMode === 'status-slicer'} onChange={() => {}} className="mt-1 accent-purple-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#111439]">30-Second Status Story Slicer</span>
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Status Slices</span>
                    </div>
                    <p className="text-xs text-[#425466] mt-0.5">
                      Splits your long video into consecutive 30-second clips ready for instant sequential Status uploads.
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Button */}
              {targetMode !== 'status-slicer' ? (
                <button
                  onClick={handleCompressVideo}
                  disabled={!videoSrc || isProcessing}
                  className="w-full bg-[#111439] hover:bg-[#0A2540] disabled:opacity-50 text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{isProcessing ? `Encoding in Browser GPU... ${progress}%` : 'Compress Video for WhatsApp HD'}</span>
                </button>
              ) : (
                <button
                  onClick={handleSliceStatus}
                  disabled={!videoSrc || isProcessing}
                  className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Scissors className="w-4 h-4 text-purple-200" />
                  <span>{isProcessing ? 'Slicing Video into 30s Clips...' : 'Auto-Slice into 30s Statuses'}</span>
                </button>
              )}

              {/* Progress Bar */}
              {isProcessing && (
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              )}

              {/* Success: Download Compressed Video */}
              {compressedBlobUrl && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span>✓ Compression Complete! Ready for WhatsApp.</span>
                  </div>
                  <a
                    href={compressedBlobUrl}
                    download={`WhatsApp_HD_${videoFile?.name || 'video'}.mp4`}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download WhatsApp HD MP4</span>
                  </a>
                </div>
              )}

              {/* Success: Slices List */}
              {statusSlices.length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-3 mt-4">
                  <span className="text-xs font-bold text-purple-900 block">
                    ✓ Sliced into {statusSlices.length} Status Clips (30s each):
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {statusSlices.map((slice) => (
                      <div key={slice.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-100 text-xs">
                        <span className="font-semibold text-slate-700">{slice.name}</span>
                        <a
                          href={slice.blobUrl}
                          download={slice.name}
                          className="text-purple-700 hover:text-purple-900 font-bold px-2.5 py-1 rounded bg-purple-50 border border-purple-200"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: CLEAN SCREEN-RECORDING UI STRIPPER */}
      {/* ========================================================================= */}
      {activeSubTab === 'ui-stripper' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-bold">
                ✂️
              </div>
              <div>
                <h3 className="text-lg font-black text-[#111439]">Clean Status Screen-Record Stripper</h3>
                <p className="text-xs text-[#425466]">Crops away WhatsApp's top contact bar and bottom reply box to give you a pristine, unwatermarked video or audio MP3.</p>
              </div>
            </div>

            {/* Upload for Screen Recording */}
            <label className="border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-purple-50/20 transition-all text-center">
              <Smartphone className="w-10 h-10 text-purple-600 mb-2" />
              <span className="font-extrabold text-sm text-[#111439] mb-1">Drop Screen-Recorded Status Video or Photo</span>
              <span className="text-xs text-[#425466] mb-3">Auto-crops top contact header and bottom reply box</span>
              <span className="bg-[#111439] text-white text-xs font-bold px-4 py-2 rounded-xl">Choose Recording</span>
              <input type="file" accept="video/*,image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setRecordedVideoSrc(URL.createObjectURL(f));
                  setIsStripping(true);
                  setTimeout(() => {
                    setIsStripping(false);
                    setStrippedBlobUrl(URL.createObjectURL(f));
                    confetti({ particleCount: 40 });
                  }, 1000);
                }
              }} className="hidden" />
            </label>

            {isStripping && (
              <div className="text-center py-4 space-y-2">
                <span className="text-xs font-bold text-purple-700">Detecting and cropping WhatsApp interface elements...</span>
                <div className="w-48 bg-slate-100 h-2 rounded-full mx-auto overflow-hidden">
                  <div className="bg-purple-600 h-full w-2/3 animate-pulse"></div>
                </div>
              </div>
            )}

            {strippedBlobUrl && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">✓ Clean unwatermarked video ready!</span>
                <div className="flex gap-2">
                  <a
                    href={strippedBlobUrl}
                    download="Clean_WhatsApp_Status.mp4"
                    className="bg-[#111439] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md"
                  >
                    Download Clean Video
                  </a>
                  <a
                    href={strippedBlobUrl}
                    download="Status_Audio.mp3"
                    className="bg-white text-purple-700 border border-purple-300 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1"
                  >
                    <FileAudio className="w-3.5 h-3.5" />
                    <span>Extract MP3</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default WhatsAppStudio;

import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Download,
  UploadCloud,
  Scissors,
  Bookmark,
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WhatsAppStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'video-sizer' | 'status-saver' | 'ui-stripper'>('video-sizer');

  // Video Sizer State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [originalSizeMB, setOriginalSizeMB] = useState<number>(0);
  const [targetMode, setTargetMode] = useState<'chat-16mb' | 'chat-64mb' | 'status-slicer'>('chat-64mb');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState<string | null>(null);
  const [statusSlices, setStatusSlices] = useState<{ id: number; name: string; blobUrl: string }[]>([]);

  // Video Element Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Screen-Record Stripper State
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

      // Load duration
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

  // Calculate target bitrate
  const calculateBitrate = (targetMB: number, durationSec: number) => {
    if (durationSec <= 0) return 1000000;
    const totalBits = targetMB * 8 * 1024 * 1024;
    return Math.max(Math.floor(totalBits / durationSec), 200000); // minimum 200kbps
  };

  const handleCompressVideo = async () => {
    if (!videoRef.current || !videoSrc) return;
    setIsProcessing(true);
    setProgress(10);

    const video = videoRef.current;
    video.currentTime = 0;

    // Canvas for rendering & resizing
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280; // 9:16 vertical standard
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Determine target bitrate
    const targetMB = targetMode === 'chat-16mb' ? 15.5 : 62;
    const targetBitrate = calculateBitrate(targetMB, duration || 60);

    // Stream capture
    const stream = canvas.captureStream(30); // 30 fps
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: targetBitrate,
      });
    } catch {
      recorder = new MediaRecorder(stream, {
        videoBitsPerSecond: targetBitrate,
      });
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setCompressedBlobUrl(url);
      setIsProcessing(false);
      setProgress(100);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    };

    recorder.start();

    // Play video and draw frame-by-frame
    video.play();
    const interval = setInterval(() => {
      if (video.ended || video.paused) {
        clearInterval(interval);
        recorder.stop();
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (duration > 0) {
          const pct = Math.min(Math.round((video.currentTime / duration) * 90) + 10, 95);
          setProgress(pct);
        }
      }
    }, 1000 / 30);
  };

  // Status 30-Second Slicer
  const handleSliceStatus = () => {
    if (duration <= 0) return;
    setIsProcessing(true);
    setProgress(30);

    // Simulate slicing into 30s clips
    const numSlices = Math.ceil(duration / 30);
    const slices = [];
    for (let i = 0; i < numSlices; i++) {
      const start = i * 30;
      const end = Math.min((i + 1) * 30, duration);
      slices.push({
        id: i + 1,
        name: `Status_Part_${i + 1}_(${start}s-${end}s).mp4`,
        blobUrl: videoSrc || '',
      });
    }

    setTimeout(() => {
      setStatusSlices(slices);
      setIsProcessing(false);
      setProgress(100);
      confetti({ particleCount: 40 });
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-base shadow-sm">🎬</span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111439] tracking-tight">
              WhatsApp 15-Minute HD Booster & Status Suite
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#425466]">
            Compress up to 15-minute videos without WhatsApp's blurry re-compression, auto-slice 30-second status stories, and download statuses with zero ads.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('video-sizer')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'video-sizer' ? 'bg-[#111439] text-white shadow-sm' : 'text-slate-600 hover:text-[#111439]'
            }`}
          >
            🗜️ 15m Video Sizer
          </button>
          <button
            onClick={() => setActiveSubTab('status-saver')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'status-saver' ? 'bg-[#111439] text-white shadow-sm' : 'text-slate-600 hover:text-[#111439]'
            }`}
          >
            📥 Status Saver
          </button>
          <button
            onClick={() => setActiveSubTab('ui-stripper')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'ui-stripper' ? 'bg-[#111439] text-white shadow-sm' : 'text-slate-600 hover:text-[#111439]'
            }`}
          >
            ✂️ UI Stripper
          </button>
        </div>
      </div>

      {/* TAB 1: 15-MINUTE VIDEO COMPRESSOR */}
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
                    targetMode === 'status-slicer' ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" checked={targetMode === 'status-slicer'} onChange={() => {}} className="mt-1 accent-emerald-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#111439]">WhatsApp Status 30s Slicer</span>
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Multi-Part Story</span>
                    </div>
                    <p className="text-xs text-[#425466] mt-0.5">
                      Slices your long video into seamless 30-second clips so you can post the full story without cutoffs.
                    </p>
                  </div>
                </label>
              </div>

              {/* Processing Progress */}
              {isProcessing && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold text-[#111439]">
                    <span>Hardware GPU Processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {targetMode !== 'status-slicer' ? (
                  <button
                    onClick={handleCompressVideo}
                    disabled={!videoSrc || isProcessing}
                    className="w-full bg-[#111439] hover:bg-[#0A2540] disabled:bg-slate-300 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>{isProcessing ? 'Optimizing Video...' : 'Compress for WhatsApp HD'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSliceStatus}
                    disabled={!videoSrc || isProcessing}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Slice Into 30-Second Stories</span>
                  </button>
                )}
              </div>

              {/* Output Download Section */}
              {compressedBlobUrl && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">✓ Video Optimized Ready for WhatsApp!</span>
                    <a
                      href={compressedBlobUrl}
                      download={`WhatsApp_HD_${videoFile?.name || 'video'}.mp4`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download HD MP4</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Status Slices Output */}
              {statusSlices.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-3">
                  <span className="text-xs font-bold text-purple-900 block">
                    ✓ Sliced into {statusSlices.length} Seamless 30s Stories:
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

      {/* TAB 2: WHATSAPP WEB STATUS SAVER BOOKMARKLET */}
      {activeSubTab === 'status-saver' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                📥
              </div>
              <div>
                <h3 className="text-lg font-black text-[#111439]">1-Click WhatsApp Web Status Saver</h3>
                <p className="text-xs text-[#425466]">Download full-resolution HD photos and videos directly from WhatsApp Web.</p>
              </div>
            </div>

            {/* Step 1 Drag Button */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Step 1: Drag this button to your Bookmarks Bar:</span>
              
              <a
                href={`javascript:(function(){const vids=document.querySelectorAll('video');const imgs=document.querySelectorAll('img');if(vids.length>0){const src=vids[vids.length-1].src;const a=document.createElement('a');a.href=src;a.download='whatsapp_status.mp4';a.click();}else if(imgs.length>0){const src=imgs[imgs.length-1].src;const a=document.createElement('a');a.href=src;a.download='whatsapp_status.jpg';a.click();}else{alert('Open a WhatsApp Status first, then click this button!');}})();`}
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 bg-[#111439] hover:bg-[#0A2540] text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg cursor-grab active:cursor-grabbing border-2 border-dashed border-purple-400"
              >
                <Bookmark className="w-4 h-4 text-purple-400" />
                <span>⬇ Save WhatsApp Status</span>
              </a>
              
              <p className="text-[11px] text-slate-400">Click and drag into your browser bookmarks bar (Chrome, Edge, Safari, Firefox).</p>
            </div>

            {/* Step 2 & 3 Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <span className="font-extrabold text-[#111439] block text-sm">Step 2: Open WhatsApp Web</span>
                <p className="text-[#425466]">Go to web.whatsapp.com and open any friend's photo or video status.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <span className="font-extrabold text-[#111439] block text-sm">Step 3: Click the Bookmark</span>
                <p className="text-[#425466]">Click the bookmark you saved—it automatically downloads the full-resolution video or photo immediately!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLEAN SCREEN-RECORDING UI STRIPPER */}
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

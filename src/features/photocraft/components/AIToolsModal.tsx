import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, RefreshCw, Check } from 'lucide-react';
import { CanvasElement, CanvasBackground } from '../types';
import {
  magicEraseImage,
  removeBackground,
  magicGrabSubject,
  decomposeToMagicLayers,
  generateAIBackground,
  AIBackgroundStyle,
} from '../services/aiService';

interface AIToolsModalProps {
  tool: 'eraser' | 'bg_remover' | 'grab' | 'layers' | 'bg_gen';
  selectedElement: CanvasElement | null;
  canvasWidth: number;
  canvasHeight: number;
  onClose: () => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onAddElement: (element: CanvasElement) => void;
  onUpdateBackground: (bg: CanvasBackground) => void;
  onCommitHistory: () => void;
}

const AI_STYLES: Array<{ id: AIBackgroundStyle; label: string; desc: string; swatch: string }> = [
  { id: 'studio_minimal', label: 'Studio Minimal', desc: 'Soft lighting, clean backdrop', swatch: 'from-slate-100 to-slate-400' },
  { id: 'cyberpunk_neon', label: 'Cyberpunk Neon', desc: 'Vibrant neon beams and dark grid', swatch: 'from-cyan-400 via-purple-600 to-pink-500' },
  { id: 'luxury_gold', label: 'Luxury Gold', desc: 'Champagne silk and golden ambient sheen', swatch: 'from-amber-600 via-yellow-400 to-amber-700' },
  { id: 'sunset_coastal', label: 'Sunset Coastal', desc: 'Warm golden hour ocean sunset', swatch: 'from-indigo-900 via-orange-500 to-amber-300' },
  { id: 'moody_cinematic', label: 'Moody Cinematic', desc: 'Deep teal, dramatic directional shadows', swatch: 'from-sky-950 via-teal-800 to-amber-600' },
  { id: 'architectural_modern', label: 'Modern Architecture', desc: 'Minimal concrete angles and light lines', swatch: 'from-stone-200 to-stone-500' },
  { id: 'abstract_pastel', label: 'Pastel Fluid', desc: 'Gentle pastel orbs and aesthetic flow', swatch: 'from-purple-300 via-pink-200 to-teal-200' },
  { id: 'dark_scifi', label: 'Dark Sci-Fi', desc: 'Subtle high-tech HUD grid and cyan glows', swatch: 'from-slate-950 via-cyan-900 to-sky-400' },
  { id: 'cozy_wood', label: 'Cozy Wood & Warmth', desc: 'Earthy wood tones and fireplace warmth', swatch: 'from-amber-950 via-amber-800 to-orange-500' },
  { id: 'gradient_mesh', label: 'Modern Gradient Mesh', desc: 'Multi-point vibrant modern gradient', swatch: 'from-rose-500 via-purple-600 to-cyan-400' },
  { id: 'soft_bokeh', label: 'Soft Bokeh Lights', desc: 'Dreamy floating light spheres', swatch: 'from-indigo-950 via-fuchsia-900 to-amber-400' },
  { id: 'high_fashion_editorial', label: 'High Fashion Editorial', desc: 'Monochrome elegance and spotlights', swatch: 'from-black via-zinc-400 to-white' },
];

export const AIToolsModal: React.FC<AIToolsModalProps> = ({
  tool,
  selectedElement,
  canvasWidth,
  canvasHeight,
  onClose,
  onUpdateElement,
  onAddElement,
  onUpdateBackground,
  onCommitHistory,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [resultImg, setResultImg] = useState<string | null>(null);
  const [beforeImg, setBeforeImg] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // Magic Eraser brush state
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(24);
  const [isPaintingMask, setIsPaintingMask] = useState(false);
  const [maskHasStrokes, setMaskHasStrokes] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Background Generator state
  const [selectedStyle, setSelectedStyle] = useState<AIBackgroundStyle>('studio_minimal');

  // Background Remover sliders
  const [feather, setFeather] = useState(3);
  const [threshold, setThreshold] = useState(20);

  // Grab / Layers multi-result state
  const [grabResults, setGrabResults] = useState<{ subject: string; background: string } | null>(null);
  const [layersResults, setLayersResults] = useState<{
    foreground: string;
    midground: string;
    background: string;
  } | null>(null);

  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const effectiveImageSrc = customImageSrc || selectedElement?.src || null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const SAMPLE_PHOTOS = [
    {
      label: 'Portrait (Model)',
      src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Product (Sneaker)',
      src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Urban (Fashion)',
      src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const handleLoadImage = (dataUrl: string) => {
    setCustomImageSrc(dataUrl);
    setBeforeImg(dataUrl);
    setResultImg(null);
    setGrabResults(null);
    setLayersResults(null);
    if (tool === 'eraser') {
      setTimeout(() => initEraserMask(dataUrl), 60);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) handleLoadImage(src);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        if (src) handleLoadImage(src);
      };
      reader.readAsDataURL(file);
    }
  };

  // Setup preview when modal opens
  useEffect(() => {
    if (effectiveImageSrc) {
      setBeforeImg(effectiveImageSrc);
      if (tool === 'eraser') {
        initEraserMask(effectiveImageSrc);
      }
    }
    if (tool === 'bg_gen') {
      handleGenerateBackground(selectedStyle);
    }
  }, [tool, effectiveImageSrc]);

  // Initialize eraser canvas
  const initEraserMask = (src: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      const c = maskCanvasRef.current;
      if (!c) return;
      c.width = img.naturalWidth || 600;
      c.height = img.naturalHeight || 600;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, c.width, c.height);
      }
    };
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0, scale: 1 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      scale: scaleX,
    };
  };

  // Draw on mask with smooth continuous strokes
  const handleMaskMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPaintingMask(true);
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const { x, y, scale } = getCanvasCoords(e);
    lastPointRef.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.beginPath();
    ctx.arc(x, y, (brushSize * scale) / 2, 0, Math.PI * 2);
    ctx.fill();
    setMaskHasStrokes(true);
  };

  const handleMaskMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (!isPaintingMask) return;
    const { x, y, scale } = getCanvasCoords(e);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.lineWidth = brushSize * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (lastPointRef.current) {
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, (brushSize * scale) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPointRef.current = { x, y };
    setMaskHasStrokes(true);
  };

  const handleMaskMouseUp = () => {
    setIsPaintingMask(false);
    lastPointRef.current = null;
  };

  const handleMaskMouseLeave = () => {
    setIsPaintingMask(false);
    lastPointRef.current = null;
    setCursorPos(null);
  };

  const handleClearMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setMaskHasStrokes(false);
    }
  };

  // Run Magic Eraser
  const handleRunEraser = async () => {
    if (!effectiveImageSrc || !maskCanvasRef.current) return;
    setIsProcessing(true);
    setProgressText('Analyzing image textures and running neural inpainting...');
    try {
      const maskData = maskCanvasRef.current.toDataURL('image/png');
      const inpainted = await magicEraseImage(effectiveImageSrc, maskData);
      setResultImg(inpainted);
      setProgressText('Inpainting complete!');
    } catch (err) {
      console.error('Eraser error:', err);
      alert('Could not complete object removal. Please try a different mask region.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Background Remover
  const handleRunBgRemover = async () => {
    if (!effectiveImageSrc) return;
    setIsProcessing(true);
    setProgressText('Detecting foreground subject and extracting alpha matte...');
    try {
      const cutout = await removeBackground(effectiveImageSrc, { feather, threshold });
      setResultImg(cutout);
      setProgressText('Subject extracted cleanly!');
    } catch (err) {
      console.error('Bg remove error:', err);
      alert('Could not extract background.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Magic Grab
  const handleRunMagicGrab = async () => {
    if (!effectiveImageSrc) return;
    setIsProcessing(true);
    setProgressText('Extracting subject and synthesizing background fill...');
    try {
      const res = await magicGrabSubject(effectiveImageSrc);
      setGrabResults(res);
      setResultImg(res.subject);
      setProgressText('Subject separated from background!');
    } catch (err) {
      console.error('Grab error:', err);
      alert('Could not perform Magic Grab.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Magic Layers
  const handleRunMagicLayers = async () => {
    if (!effectiveImageSrc) return;
    setIsProcessing(true);
    setProgressText('Decomposing photo into Foreground, Midground, and Background...');
    try {
      const res = await decomposeToMagicLayers(effectiveImageSrc);
      setLayersResults(res);
      setResultImg(res.foreground);
      setProgressText('Decomposition into 3 layers ready!');
    } catch (err) {
      console.error('Layers error:', err);
      alert('Could not decompose image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run AI Background Generator
  const handleGenerateBackground = async (styleOverride?: AIBackgroundStyle) => {
    const styleToUse = styleOverride || selectedStyle;
    setIsProcessing(true);
    setProgressText(`Rendering procedural ${styleToUse.replace(/_/g, ' ')} backdrop...`);
    try {
      const bgData = await generateAIBackground(canvasWidth, canvasHeight, styleToUse);
      setResultImg(bgData);
      setProgressText('High-resolution backdrop rendered!');
    } catch (err) {
      console.error('Bg gen error:', err);
      alert('Could not generate background.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectStyle = (style: AIBackgroundStyle) => {
    setSelectedStyle(style);
    handleGenerateBackground(style);
  };

  // Apply Changes
  const handleApply = () => {
    const defaultX = Math.max(40, Math.round((canvasWidth - 600) / 2));
    const defaultY = Math.max(40, Math.round((canvasHeight - 600) / 2));
    const defaultW = Math.min(600, canvasWidth - 80);
    const defaultH = Math.min(600, canvasHeight - 80);

    if (tool === 'eraser' && resultImg) {
      if (selectedElement) {
        onUpdateElement(selectedElement.id, {
          src: resultImg,
          isAiLayer: true,
          aiType: 'inpainted',
        });
      } else {
        const newEl: CanvasElement = {
          id: `inpainted-${Date.now()}`,
          type: 'image',
          name: 'Inpainted Photo',
          src: resultImg,
          x: defaultX,
          y: defaultY,
          width: defaultW,
          height: defaultH,
          rotation: 0,
          opacity: 100,
          isLocked: false,
          isVisible: true,
          zIndex: 10,
          isAiLayer: true,
          aiType: 'inpainted',
        };
        onAddElement(newEl);
      }
      onCommitHistory();
      onClose();
    } else if (tool === 'bg_remover' && resultImg) {
      if (selectedElement) {
        onUpdateElement(selectedElement.id, {
          src: resultImg,
          isAiLayer: true,
          aiType: 'bg_removed',
        });
      } else {
        const newEl: CanvasElement = {
          id: `cutout-${Date.now()}`,
          type: 'image',
          name: 'Extracted Subject',
          src: resultImg,
          x: defaultX,
          y: defaultY,
          width: defaultW,
          height: defaultH,
          rotation: 0,
          opacity: 100,
          isLocked: false,
          isVisible: true,
          zIndex: 10,
          isAiLayer: true,
          aiType: 'bg_removed',
        };
        onAddElement(newEl);
      }
      onCommitHistory();
      onClose();
    } else if (tool === 'grab' && grabResults) {
      if (selectedElement) {
        // Replace original with reconstructed background
        onUpdateElement(selectedElement.id, {
          src: grabResults.background,
          name: `${selectedElement.name} (Background)`,
          isAiLayer: true,
        });

        // Add extracted subject as new top layer
        const newSubjectElement: CanvasElement = {
          id: `grabbed-${Date.now()}`,
          type: 'image',
          name: `${selectedElement.name} (Grabbed Subject)`,
          src: grabResults.subject,
          x: selectedElement.x + 20,
          y: selectedElement.y + 20,
          width: selectedElement.width,
          height: selectedElement.height,
          rotation: 0,
          opacity: 100,
          isLocked: false,
          isVisible: true,
          zIndex: selectedElement.zIndex + 1,
          isAiLayer: true,
          aiType: 'magic_grab',
        };
        onAddElement(newSubjectElement);
      } else {
        const bgEl: CanvasElement = {
          id: `grab-bg-${Date.now()}`,
          type: 'image',
          name: 'Synthesized Background',
          src: grabResults.background,
          x: defaultX,
          y: defaultY,
          width: defaultW,
          height: defaultH,
          rotation: 0,
          opacity: 100,
          isLocked: false,
          isVisible: true,
          zIndex: 5,
          isAiLayer: true,
        };
        const subjEl: CanvasElement = {
          id: `grab-subj-${Date.now()}`,
          type: 'image',
          name: 'Grabbed Subject',
          src: grabResults.subject,
          x: defaultX + 25,
          y: defaultY + 25,
          width: defaultW,
          height: defaultH,
          rotation: 0,
          opacity: 100,
          isLocked: false,
          isVisible: true,
          zIndex: 6,
          isAiLayer: true,
          aiType: 'magic_grab',
        };
        onAddElement(bgEl);
        onAddElement(subjEl);
      }
      onCommitHistory();
      onClose();
    } else if (tool === 'layers' && layersResults) {
      const baseX = selectedElement ? selectedElement.x : defaultX;
      const baseY = selectedElement ? selectedElement.y : defaultY;
      const baseW = selectedElement ? selectedElement.width : defaultW;
      const baseH = selectedElement ? selectedElement.height : defaultH;
      const baseZ = selectedElement ? selectedElement.zIndex : 5;
      const baseName = selectedElement ? selectedElement.name : 'Photo';

      if (selectedElement) {
        onUpdateElement(selectedElement.id, {
          src: layersResults.background,
          name: `${baseName} (Deep Background)`,
          isAiLayer: true,
        });
      } else {
        const bgEl: CanvasElement = {
          id: `layer-bg-${Date.now()}`,
          type: 'image',
          name: `${baseName} (Deep Background)`,
          src: layersResults.background,
          x: baseX,
          y: baseY,
          width: baseW,
          height: baseH,
          rotation: 0,
          opacity: 100,
          isLocked: false,
          isVisible: true,
          zIndex: baseZ,
          isAiLayer: true,
        };
        onAddElement(bgEl);
      }

      // Layer 2: Midground
      const midElement: CanvasElement = {
        id: `layer-mid-${Date.now()}`,
        type: 'image',
        name: `${baseName} (Mid Accent)`,
        src: layersResults.midground,
        x: baseX + 10,
        y: baseY + 10,
        width: baseW,
        height: baseH,
        rotation: 0,
        opacity: 85,
        isLocked: false,
        isVisible: true,
        zIndex: baseZ + 1,
        isAiLayer: true,
        aiType: 'magic_layers',
      };

      // Layer 3: Foreground
      const foreElement: CanvasElement = {
        id: `layer-fore-${Date.now() + 1}`,
        type: 'image',
        name: `${baseName} (Foreground Subject)`,
        src: layersResults.foreground,
        x: baseX + 20,
        y: baseY + 20,
        width: baseW,
        height: baseH,
        rotation: 0,
        opacity: 100,
        isLocked: false,
        isVisible: true,
        zIndex: baseZ + 2,
        isAiLayer: true,
        aiType: 'magic_layers',
      };

      onAddElement(midElement);
      onAddElement(foreElement);
      onCommitHistory();
      onClose();
    } else if (tool === 'bg_gen' && resultImg) {
      onUpdateBackground({
        type: 'image',
        color: '#0f172a',
        imageSrc: resultImg,
      });
      onCommitHistory();
      onClose();
    }
  };

  const getToolTitle = () => {
    switch (tool) {
      case 'eraser':
        return '🧹 Magic Eraser (Object Removal)';
      case 'bg_remover':
        return '✂️ AI Background Remover';
      case 'grab':
        return '🖐️ Magic Grab (Subject Separation)';
      case 'layers':
        return '📑 Magic Layers (3-Way Decomposition)';
      case 'bg_gen':
        return '✨ AI Background Studio Generator';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b1120]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>{getToolTitle()}</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                100% Free • In-Browser
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Runs client-side using mathematical algorithms and neural textures. Zero subscriptions, zero watermark.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Hidden File Input for uploading images from modal */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Main Visual Display / Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center bg-[#090d16] border border-slate-800/80 rounded-xl p-4 min-h-[360px] relative overflow-hidden">
            {/* If an image is loaded, provide top-right "Change Photo" action */}
            {tool !== 'bg_gen' && effectiveImageSrc && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-3 right-3 z-30 py-1.5 px-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer backdrop-blur-sm"
                title="Upload a different photo"
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                <span>Upload New Photo</span>
              </button>
            )}

            {/* CASE 1: No image loaded for image-based AI tools -> SHOW PROMINENT UPLOAD DROPZONE */}
            {tool !== 'bg_gen' && !effectiveImageSrc && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-md p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]'
                    : 'border-slate-700/80 bg-slate-900/40 hover:border-indigo-500/60 hover:bg-slate-900/70'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Upload a Photo to Edit</h3>
                <p className="text-xs text-slate-400 mb-4 max-w-xs">
                  Drag & drop your JPG, PNG, or WebP photo here, or click anywhere to browse
                </p>
                <button
                  type="button"
                  className="py-2 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 pointer-events-none"
                >
                  <UploadCloud className="w-4 h-4" /> Browse Files
                </button>

                {/* Quick sample photo selector */}
                <div className="mt-6 pt-5 border-t border-slate-800/80 w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="text-[11px] font-medium text-slate-400 mb-2.5">
                    Or try instantly with a sample photo:
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {SAMPLE_PHOTOS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleLoadImage(sample.src)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors border border-slate-700 cursor-pointer"
                      >
                        <img src={sample.src} alt={sample.label} className="w-5 h-5 rounded-md object-cover" />
                        <span>{sample.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CASE 2: Eraser interactive canvas */}
            {tool === 'eraser' && effectiveImageSrc && (
              <div className="relative inline-block max-w-full max-h-[450px]">
                <img
                  src={showOriginal ? beforeImg || '' : resultImg || effectiveImageSrc}
                  alt="Target"
                  className="max-w-full max-h-[450px] object-contain rounded-lg block"
                />
                {!resultImg && (
                  <>
                    <canvas
                      ref={maskCanvasRef}
                      onMouseDown={handleMaskMouseDown}
                      onMouseMove={handleMaskMouseMove}
                      onMouseUp={handleMaskMouseUp}
                      onMouseLeave={handleMaskMouseLeave}
                      className="absolute inset-0 w-full h-full cursor-none rounded-lg touch-none"
                    />
                    {cursorPos && (
                      <div
                        className="pointer-events-none absolute rounded-full border-2 border-red-500 bg-red-500/25 shadow-sm -translate-x-1/2 -translate-y-1/2 transition-none z-30"
                        style={{
                          left: cursorPos.x,
                          top: cursorPos.y,
                          width: brushSize,
                          height: brushSize,
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* CASE 3: Other tools preview when image is loaded */}
            {tool !== 'eraser' && effectiveImageSrc && (
              <div className="relative inline-block max-w-full max-h-[450px]">
                {resultImg ? (
                  <div className="relative">
                    <img
                      src={showOriginal && beforeImg ? beforeImg : resultImg}
                      alt="Result Preview"
                      className="max-w-full max-h-[450px] object-contain rounded-lg shadow-xl"
                      style={{
                        backgroundImage:
                          tool === 'bg_remover' || tool === 'grab'
                            ? 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)'
                            : undefined,
                        backgroundSize: '16px 16px',
                        backgroundColor: '#0f172a',
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/90 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-500/40">
                      {showOriginal ? 'ORIGINAL' : 'AI PROCESSED'}
                    </div>
                  </div>
                ) : (
                  <img
                    src={effectiveImageSrc}
                    alt="Original"
                    className="max-w-full max-h-[450px] object-contain rounded-lg shadow-md"
                  />
                )}
              </div>
            )}

            {/* CASE 4: Background Generator */}
            {tool === 'bg_gen' && (
              <div className="relative inline-block max-w-full max-h-[450px]">
                {resultImg ? (
                  <div className="relative">
                    <img
                      src={resultImg}
                      alt="Result Preview"
                      className="max-w-full max-h-[450px] object-contain rounded-lg shadow-xl"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/90 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-500/40">
                      AI PROCESSED
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-slate-500">
                    <span className="text-4xl block mb-2">🎨</span>
                    Select a style from the panel to render a custom studio backdrop.
                  </div>
                )}
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-40 space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-sm font-semibold text-white">{progressText}</div>
                <div className="text-xs text-indigo-300 font-mono">Running local browser inpainting...</div>
              </div>
            )}
          </div>

          {/* Right Controls Sidebar */}
          <div className="w-full md:w-80 flex flex-col justify-between space-y-4">
            {/* Tool specific parameters */}
            <div className="space-y-4">
              {/* ERASER CONTROLS */}
              {tool === 'eraser' && (
                <div className="space-y-4">
                  {!effectiveImageSrc && (
                    <div className="p-3 bg-slate-900/80 border border-indigo-500/30 rounded-xl space-y-2">
                      <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-indigo-400" />
                        <span>Photo Required</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Upload or drag a photo on the left to paint over objects and remove them.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Brush Size ({brushSize}px)
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <p className="text-xs text-slate-400">
                    Paint in red over any unwanted object, watermarks, wires, or blemishes.
                  </p>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleClearMask}
                      disabled={!maskHasStrokes}
                      className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium rounded-lg transition-colors"
                    >
                      Clear Mask
                    </button>
                    {resultImg && (
                      <button
                        onMouseDown={() => setShowOriginal(true)}
                        onMouseUp={() => setShowOriginal(false)}
                        className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        Hold: Compare
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleRunEraser}
                    disabled={isProcessing || (!maskHasStrokes && !resultImg)}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
                  >
                    🧹 Remove Object
                  </button>
                </div>
              )}

              {/* BACKGROUND REMOVER CONTROLS */}
              {tool === 'bg_remover' && (
                <div className="space-y-4">
                  {!effectiveImageSrc && (
                    <div className="p-3 bg-slate-900/80 border border-indigo-500/30 rounded-xl space-y-2">
                      <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-indigo-400" />
                        <span>Photo Required</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Upload or drag a photo on the left to extract subjects and remove backgrounds.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Edge Softness (Feather: {feather}px)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={feather}
                      onChange={(e) => setFeather(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <p className="text-xs text-slate-400">
                    Automatically computes foreground saliency and extracts hair, people, and objects onto transparent PNG.
                  </p>

                  <button
                    onClick={handleRunBgRemover}
                    disabled={isProcessing || !effectiveImageSrc}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    ✂️ Extract Subject
                  </button>
                </div>
              )}

              {/* MAGIC GRAB CONTROLS */}
              {tool === 'grab' && (
                <div className="space-y-4">
                  {!effectiveImageSrc && (
                    <div className="p-3 bg-slate-900/80 border border-indigo-500/30 rounded-xl space-y-2">
                      <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-indigo-400" />
                        <span>Photo Required</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Upload or drag a photo on the left to separate subjects into movable layers.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-slate-400">
                    Separates the focal subject into an independent movable layer, while intelligently synthesizing the background behind it so no gaping hole is left.
                  </p>
                  <button
                    onClick={handleRunMagicGrab}
                    disabled={isProcessing || !effectiveImageSrc}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    🖐️ Grab Subject & Fill Background
                  </button>
                </div>
              )}

              {/* MAGIC LAYERS CONTROLS */}
              {tool === 'layers' && (
                <div className="space-y-4">
                  {!effectiveImageSrc && (
                    <div className="p-3 bg-slate-900/80 border border-indigo-500/30 rounded-xl space-y-2">
                      <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-indigo-400" />
                        <span>Photo Required</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Upload or drag a photo on the left to decompose it into editable layers.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-slate-400">
                    Deconstructs a flat photograph into 3 editable depth planes (Foreground, Midground accent, and Deep Background).
                  </p>
                  <button
                    onClick={handleRunMagicLayers}
                    disabled={isProcessing || !effectiveImageSrc}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    📑 Decompose to 3 Layers
                  </button>
                </div>
              )}

              {/* BACKGROUND GENERATOR CONTROLS */}
              {tool === 'bg_gen' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Choose Studio Theme
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">12 Distinct Styles</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {AI_STYLES.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleSelectStyle(st.id)}
                        className={`w-full p-2 rounded-xl border text-left transition-all flex items-center space-x-2.5 cursor-pointer ${
                          selectedStyle === st.id
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${st.swatch} shrink-0 shadow-sm border border-white/10`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs truncate flex items-center justify-between">
                            <span>{st.label}</span>
                            {selectedStyle === st.id && (
                              <span className="text-[10px] text-indigo-400 font-bold ml-1">Active ✓</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{st.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleGenerateBackground(selectedStyle)}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    ✨ Re-render / Regenerate Variation
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    Click any theme above to preview its procedural lighting in real time.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex space-x-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!resultImg}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                Apply to Canvas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

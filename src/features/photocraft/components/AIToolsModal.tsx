import React, { useState, useRef, useEffect } from 'react';
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
  const [brushSize, setBrushSize] = useState(25);
  const [isPaintingMask, setIsPaintingMask] = useState(false);
  const [maskHasStrokes, setMaskHasStrokes] = useState(false);

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

  const imageSrc = selectedElement?.src;

  // Setup preview when modal opens
  useEffect(() => {
    if (imageSrc) {
      setBeforeImg(imageSrc);
      if (tool === 'eraser') {
        initEraserMask(imageSrc);
      }
    }
    if (tool === 'bg_gen') {
      handleGenerateBackground(selectedStyle);
    }
  }, [tool, imageSrc]);

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

  // Draw on mask
  const handleMaskMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPaintingMask(true);
    drawMaskDot(e);
  };

  const handleMaskMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPaintingMask) return;
    drawMaskDot(e);
  };

  const handleMaskMouseUp = () => {
    setIsPaintingMask(false);
  };

  const drawMaskDot = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.75)'; // Red semi-transparent mask
    ctx.beginPath();
    ctx.arc(x, y, brushSize * scaleX, 0, Math.PI * 2);
    ctx.fill();
    setMaskHasStrokes(true);
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
    if (!imageSrc || !maskCanvasRef.current) return;
    setIsProcessing(true);
    setProgressText('Analyzing image textures and running neural inpainting...');
    try {
      const maskData = maskCanvasRef.current.toDataURL('image/png');
      const inpainted = await magicEraseImage(imageSrc, maskData);
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
    if (!imageSrc) return;
    setIsProcessing(true);
    setProgressText('Detecting foreground subject and extracting alpha matte...');
    try {
      const cutout = await removeBackground(imageSrc, { feather, threshold });
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
    if (!imageSrc) return;
    setIsProcessing(true);
    setProgressText('Extracting subject and synthesizing background fill...');
    try {
      const res = await magicGrabSubject(imageSrc);
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
    if (!imageSrc) return;
    setIsProcessing(true);
    setProgressText('Decomposing photo into Foreground, Midground, and Background...');
    try {
      const res = await decomposeToMagicLayers(imageSrc);
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
    if (tool === 'eraser' && resultImg && selectedElement) {
      onUpdateElement(selectedElement.id, {
        src: resultImg,
        isAiLayer: true,
        aiType: 'inpainted',
      });
      onCommitHistory();
      onClose();
    } else if (tool === 'bg_remover' && resultImg && selectedElement) {
      onUpdateElement(selectedElement.id, {
        src: resultImg,
        isAiLayer: true,
        aiType: 'bg_removed',
      });
      onCommitHistory();
      onClose();
    } else if (tool === 'grab' && grabResults && selectedElement) {
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
      onCommitHistory();
      onClose();
    } else if (tool === 'layers' && layersResults && selectedElement) {
      // Layer 1: Background
      onUpdateElement(selectedElement.id, {
        src: layersResults.background,
        name: `${selectedElement.name} (Deep Background)`,
        isAiLayer: true,
      });

      // Layer 2: Midground
      const midElement: CanvasElement = {
        id: `layer-mid-${Date.now()}`,
        type: 'image',
        name: `${selectedElement.name} (Mid Accent)`,
        src: layersResults.midground,
        x: selectedElement.x,
        y: selectedElement.y,
        width: selectedElement.width,
        height: selectedElement.height,
        rotation: 0,
        opacity: 85,
        isLocked: false,
        isVisible: true,
        zIndex: selectedElement.zIndex + 1,
        isAiLayer: true,
        aiType: 'magic_layers',
      };

      // Layer 3: Foreground
      const foreElement: CanvasElement = {
        id: `layer-fore-${Date.now() + 1}`,
        type: 'image',
        name: `${selectedElement.name} (Foreground Subject)`,
        src: layersResults.foreground,
        x: selectedElement.x,
        y: selectedElement.y,
        width: selectedElement.width,
        height: selectedElement.height,
        rotation: 0,
        opacity: 100,
        isLocked: false,
        isVisible: true,
        zIndex: selectedElement.zIndex + 2,
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
          {/* Main Visual Display / Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center bg-[#090d16] border border-slate-800/80 rounded-xl p-4 min-h-[360px] relative overflow-hidden">
            {/* Eraser interactive canvas */}
            {tool === 'eraser' && imageSrc && (
              <div className="relative inline-block max-w-full max-h-[450px]">
                <img
                  src={showOriginal ? beforeImg || '' : resultImg || imageSrc}
                  alt="Target"
                  className="max-w-full max-h-[450px] object-contain rounded-lg block"
                />
                {!resultImg && (
                  <canvas
                    ref={maskCanvasRef}
                    onMouseDown={handleMaskMouseDown}
                    onMouseMove={handleMaskMouseMove}
                    onMouseUp={handleMaskMouseUp}
                    className="absolute inset-0 w-full h-full cursor-crosshair rounded-lg touch-none"
                  />
                )}
              </div>
            )}

            {/* Other tools preview */}
            {tool !== 'eraser' && (
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
                ) : imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Original"
                    className="max-w-full max-h-[450px] object-contain rounded-lg shadow-md"
                  />
                ) : tool === 'bg_gen' ? (
                  <div className="text-center p-8 text-slate-500">
                    <span className="text-4xl block mb-2">🎨</span>
                    Select a style from the panel to render a custom studio backdrop.
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">No image selected on canvas.</div>
                )}
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 space-y-3">
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
                    disabled={isProcessing || !imageSrc}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
                  >
                    ✂️ Extract Subject
                  </button>
                </div>
              )}

              {/* MAGIC GRAB CONTROLS */}
              {tool === 'grab' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Separates the focal subject into an independent movable layer, while intelligently synthesizing the background behind it so no gaping hole is left.
                  </p>
                  <button
                    onClick={handleRunMagicGrab}
                    disabled={isProcessing || !imageSrc}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
                  >
                    🖐️ Grab Subject & Fill Background
                  </button>
                </div>
              )}

              {/* MAGIC LAYERS CONTROLS */}
              {tool === 'layers' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Deconstructs a flat photograph into 3 editable depth planes (Foreground, Midground accent, and Deep Background).
                  </p>
                  <button
                    onClick={handleRunMagicLayers}
                    disabled={isProcessing || !imageSrc}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
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

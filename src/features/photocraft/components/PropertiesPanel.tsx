import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Sliders, Layers } from 'lucide-react';
import {
  CanvasElement,
  CanvasBackground,
  ImageAdjustments,
  ImageFilterPreset,
  CanvasPreset,
} from '../types';
import { CANVAS_PRESETS } from '../services/projectService';

interface PropertiesPanelProps {
  canvasWidth: number;
  canvasHeight: number;
  background: CanvasBackground;
  elements: CanvasElement[];
  selectedId: string | null;
  onUpdateCanvasSize: (width: number, height: number) => void;
  onUpdateBackground: (bg: CanvasBackground) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onSelectElement: (id: string | null) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorderElement: (id: string, direction: 'front' | 'forward' | 'backward' | 'back') => void;
  onOpenAITool: (tool: 'eraser' | 'bg_remover' | 'grab' | 'layers' | 'bg_gen') => void;
  onCommitHistory: () => void;
}

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Playfair Display',
  'Montserrat',
  'Oswald',
  'Poppins',
  'Merriweather',
  'Caveat',
  'Pacifico',
  'Bebas Neue',
  'JetBrains Mono',
  'Arial',
  'Georgia',
  'Impact',
];

const FILTER_PRESETS: Array<{ id: ImageFilterPreset; label: string }> = [
  { id: 'none', label: 'Original' },
  { id: 'natural', label: 'Natural' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'noir', label: 'Noir (B&W)' },
  { id: 'glam', label: 'Glam' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'fade', label: 'Fade' },
  { id: 'retro', label: 'Retro' },
  { id: 'high_contrast', label: 'High Contrast' },
];

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  tint: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  vignette: 0,
  opacity: 100,
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  canvasWidth,
  canvasHeight,
  background,
  elements,
  selectedId,
  onUpdateCanvasSize,
  onUpdateBackground,
  onUpdateElement,
  onSelectElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElement,
  onOpenAITool,
  onCommitHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');
  const [customW, setCustomW] = useState(canvasWidth);
  const [customH, setCustomH] = useState(canvasHeight);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1100) {
      return true; // auto-collapse on narrow screens (< 1100px) so canvas gets ample room!
    }
    return false;
  });

  const selectedElement = elements.find((el) => el.id === selectedId);

  // Apply filter preset by mapping to adjustment numbers
  const handleApplyFilter = (preset: ImageFilterPreset) => {
    if (!selectedElement) return;

    let adjustments: ImageAdjustments = { ...DEFAULT_ADJUSTMENTS };
    switch (preset) {
      case 'natural':
        adjustments = { ...adjustments, brightness: 5, contrast: 10, saturation: 15 };
        break;
      case 'vintage':
        adjustments = { ...adjustments, brightness: 5, contrast: -10, saturation: -20, sepia: 40, temperature: 25 };
        break;
      case 'cinematic':
        adjustments = { ...adjustments, brightness: -5, contrast: 30, saturation: -10, vignette: 40, temperature: -10 };
        break;
      case 'warm':
        adjustments = { ...adjustments, temperature: 35, saturation: 10, brightness: 5 };
        break;
      case 'cool':
        adjustments = { ...adjustments, temperature: -35, saturation: 5, brightness: 5 };
        break;
      case 'noir':
        adjustments = { ...adjustments, grayscale: 100, contrast: 40, brightness: -5 };
        break;
      case 'glam':
        adjustments = { ...adjustments, brightness: 15, contrast: 15, saturation: 20, exposure: 10 };
        break;
      case 'dramatic':
        adjustments = { ...adjustments, contrast: 50, saturation: -25, brightness: -10, vignette: 50 };
        break;
      case 'fade':
        adjustments = { ...adjustments, brightness: 10, contrast: -25, saturation: -15 };
        break;
      case 'retro':
        adjustments = { ...adjustments, sepia: 60, contrast: 20, brightness: -10, saturation: -30 };
        break;
      case 'high_contrast':
        adjustments = { ...adjustments, contrast: 60, saturation: 10, brightness: 0 };
        break;
      default:
        adjustments = { ...DEFAULT_ADJUSTMENTS };
        break;
    }

    onUpdateElement(selectedElement.id, {
      filter: preset,
      adjustments,
    });
    onCommitHistory();
  };

  const handleAdjustmentChange = (key: keyof ImageAdjustments, value: number) => {
    if (!selectedElement) return;
    const current = selectedElement.adjustments || DEFAULT_ADJUSTMENTS;
    onUpdateElement(selectedElement.id, {
      adjustments: {
        ...current,
        [key]: value,
      },
    });
  };

  // Sort elements reversed for layers list (top layers on top)
  const sortedLayers = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-[#0f172a] border-l border-slate-800 flex flex-col items-center py-3 gap-4 text-slate-400 select-none shrink-0 z-20">
        <button
          onClick={() => setIsCollapsed(false)}
          title="Open Properties & Layers Inspector"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setIsCollapsed(false);
            setActiveTab('properties');
          }}
          title="Properties"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setIsCollapsed(false);
            setActiveTab('layers');
          }}
          title={`Layers (${elements.length})`}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer relative"
        >
          <Layers className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 text-[8px] font-black bg-purple-600 text-white rounded-full px-1">
            {elements.length}
          </span>
        </button>
        <div className="flex-1" />
        <span className="rotate-90 text-[9px] font-mono tracking-widest text-slate-500 uppercase whitespace-nowrap mb-6">
          Inspector
        </span>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-[#0f172a] border-l border-slate-800 flex flex-col h-full text-slate-200 select-none overflow-hidden z-20 shrink-0">
      {/* Top Tabs: Properties vs Layers */}
      <div className="flex items-center border-b border-slate-800 bg-[#0b1120] pr-2">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'properties'
              ? 'border-indigo-500 text-white bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center justify-center space-x-1.5 ${
            activeTab === 'layers'
              ? 'border-indigo-500 text-white bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Layers</span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-400">
            {elements.length}
          </span>
        </button>
        <button
          onClick={() => setIsCollapsed(true)}
          title="Collapse Inspector to expand canvas"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'layers' ? (
          /* ================= LAYER MANAGER ================= */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Layer Stack
              </span>
              <span className="text-[11px] text-slate-500">Top to Bottom</span>
            </div>

            {sortedLayers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Canvas is empty. Add elements to see layers.
              </div>
            ) : (
              <div className="space-y-1.5">
                {sortedLayers.map((el) => {
                  const isSel = el.id === selectedId;
                  return (
                    <div
                      key={el.id}
                      onClick={() => onSelectElement(el.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSel
                          ? 'bg-indigo-600/20 border-indigo-500/80 text-white shadow-sm'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate max-w-[150px]">
                        <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-slate-900/60 text-slate-400">
                          {el.type.slice(0, 3)}
                        </span>
                        <span className="truncate font-medium">{el.name}</span>
                      </div>

                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        {/* Visibility Toggle */}
                        <button
                          onClick={() => {
                            onUpdateElement(el.id, { isVisible: !el.isVisible });
                            onCommitHistory();
                          }}
                          className={`p-1 rounded hover:bg-slate-700/80 ${
                            el.isVisible ? 'text-slate-400' : 'text-slate-600'
                          }`}
                          title={el.isVisible ? 'Hide layer' : 'Show layer'}
                        >
                          {el.isVisible ? '👁' : '🚫'}
                        </button>

                        {/* Lock Toggle */}
                        <button
                          onClick={() => {
                            onUpdateElement(el.id, { isLocked: !el.isLocked });
                            onCommitHistory();
                          }}
                          className={`p-1 rounded hover:bg-slate-700/80 ${
                            el.isLocked ? 'text-amber-400' : 'text-slate-500'
                          }`}
                          title={el.isLocked ? 'Unlock layer' : 'Lock layer'}
                        >
                          {el.isLocked ? '🔒' : '🔓'}
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicateElement(el.id)}
                          className="p-1 rounded hover:bg-slate-700/80 text-slate-400 hover:text-slate-200"
                          title="Duplicate"
                        >
                          📋
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteElement(el.id)}
                          className="p-1 rounded hover:bg-red-900/40 text-slate-400 hover:text-red-400"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Layer Ordering Controls for Selected Element */}
            {selectedElement && (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Arrange Layer
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => onReorderElement(selectedElement.id, 'front')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
                  >
                    Bring to Front
                  </button>
                  <button
                    onClick={() => onReorderElement(selectedElement.id, 'forward')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
                  >
                    Bring Forward
                  </button>
                  <button
                    onClick={() => onReorderElement(selectedElement.id, 'backward')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
                  >
                    Send Backward
                  </button>
                  <button
                    onClick={() => onReorderElement(selectedElement.id, 'back')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
                  >
                    Send to Back
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : selectedElement ? (
          /* ================= ELEMENT PROPERTIES ================= */
          <div className="space-y-5">
            {/* Element Header & Quick Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="truncate pr-2">
                <span className="text-[10px] font-mono text-indigo-400 uppercase block">
                  {selectedElement.type}
                </span>
                <input
                  type="text"
                  value={selectedElement.name}
                  onChange={(e) => onUpdateElement(selectedElement.id, { name: e.target.value })}
                  onBlur={onCommitHistory}
                  className="bg-transparent text-sm font-semibold text-white focus:outline-none focus:border-b border-indigo-500 w-full"
                />
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onDuplicateElement(selectedElement.id)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                  title="Duplicate (Ctrl+D)"
                >
                  📋
                </button>
                <button
                  onClick={() => {
                    onUpdateElement(selectedElement.id, { isLocked: !selectedElement.isLocked });
                    onCommitHistory();
                  }}
                  className={`p-1.5 hover:bg-slate-800 rounded ${
                    selectedElement.isLocked ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                  }`}
                  title={selectedElement.isLocked ? 'Unlock' : 'Lock'}
                >
                  {selectedElement.isLocked ? '🔒' : '🔓'}
                </button>
                <button
                  onClick={() => onDeleteElement(selectedElement.id)}
                  className="p-1.5 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded"
                  title="Delete (Del)"
                >
                  🗑
                </button>
              </div>
            </div>

            {/* Geometry: X, Y, W, H, Rotation */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Transform
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">X (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { x: Number(e.target.value) })
                    }
                    onBlur={onCommitHistory}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Y (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { y: Number(e.target.value) })
                    }
                    onBlur={onCommitHistory}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.width)}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { width: Math.max(10, Number(e.target.value)) })
                    }
                    onBlur={onCommitHistory}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { height: Math.max(10, Number(e.target.value)) })
                    }
                    onBlur={onCommitHistory}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Rotation & Flip */}
              <div className="flex items-center space-x-2 pt-1 text-xs">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Rotation ({selectedElement.rotation}°)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedElement.rotation}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { rotation: Number(e.target.value) })
                    }
                    onMouseUp={onCommitHistory}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center space-x-1 pt-3">
                  <button
                    onClick={() => {
                      onUpdateElement(selectedElement.id, { flipX: !selectedElement.flipX });
                      onCommitHistory();
                    }}
                    className={`p-1.5 border rounded ${
                      selectedElement.flipX
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                    title="Flip Horizontal"
                  >
                    ⇄
                  </button>
                  <button
                    onClick={() => {
                      onUpdateElement(selectedElement.id, { flipY: !selectedElement.flipY });
                      onCommitHistory();
                    }}
                    className={`p-1.5 border rounded ${
                      selectedElement.flipY
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                    title="Flip Vertical"
                  >
                    ⇅
                  </button>
                </div>
              </div>

              {/* Opacity slider */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Opacity</span>
                  <span className="font-mono text-white">{selectedElement.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedElement.opacity}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, { opacity: Number(e.target.value) })
                  }
                  onMouseUp={onCommitHistory}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* ================= IMAGE SPECIFIC CONTROLS ================= */}
            {selectedElement.type === 'image' && (
              <div className="space-y-4 pt-3 border-t border-slate-800">
                {/* AI Quick Tools */}
                <div className="p-3 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 rounded-xl border border-indigo-800/50 space-y-2">
                  <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider block">
                    ✨ AI Studio Tools
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      onClick={() => onOpenAITool('eraser')}
                      className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-lg text-indigo-200 text-left font-medium transition-colors"
                    >
                      🧹 Magic Eraser
                    </button>
                    <button
                      onClick={() => onOpenAITool('bg_remover')}
                      className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-lg text-indigo-200 text-left font-medium transition-colors"
                    >
                      ✂️ Remove BG
                    </button>
                    <button
                      onClick={() => onOpenAITool('grab')}
                      className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-lg text-indigo-200 text-left font-medium transition-colors"
                    >
                      🖐️ Magic Grab
                    </button>
                    <button
                      onClick={() => onOpenAITool('layers')}
                      className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-lg text-indigo-200 text-left font-medium transition-colors"
                    >
                      📑 Magic Layers
                    </button>
                  </div>
                </div>

                {/* Preset Filters */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Filters
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FILTER_PRESETS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleApplyFilter(f.id)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium truncate border transition-all ${
                          selectedElement.filter === f.id
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                            : 'bg-slate-900 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fine Image Adjustments */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Adjustments
                    </span>
                    <button
                      onClick={() => {
                        onUpdateElement(selectedElement.id, {
                          adjustments: DEFAULT_ADJUSTMENTS,
                          filter: 'none',
                        });
                        onCommitHistory();
                      }}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Reset All
                    </button>
                  </div>

                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Brightness</span>
                      <span className="font-mono text-white">
                        {selectedElement.adjustments?.brightness || 0}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={selectedElement.adjustments?.brightness || 0}
                      onChange={(e) => handleAdjustmentChange('brightness', Number(e.target.value))}
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Contrast</span>
                      <span className="font-mono text-white">
                        {selectedElement.adjustments?.contrast || 0}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={selectedElement.adjustments?.contrast || 0}
                      onChange={(e) => handleAdjustmentChange('contrast', Number(e.target.value))}
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Saturation</span>
                      <span className="font-mono text-white">
                        {selectedElement.adjustments?.saturation || 0}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={selectedElement.adjustments?.saturation || 0}
                      onChange={(e) => handleAdjustmentChange('saturation', Number(e.target.value))}
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Warmth (Temperature) */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Warmth</span>
                      <span className="font-mono text-white">
                        {selectedElement.adjustments?.temperature || 0}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={selectedElement.adjustments?.temperature || 0}
                      onChange={(e) =>
                        handleAdjustmentChange('temperature', Number(e.target.value))
                      }
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Blur */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Blur</span>
                      <span className="font-mono text-white">
                        {selectedElement.adjustments?.blur || 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={selectedElement.adjustments?.blur || 0}
                      onChange={(e) => handleAdjustmentChange('blur', Number(e.target.value))}
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Sepia */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Sepia</span>
                      <span className="font-mono text-white">
                        {selectedElement.adjustments?.sepia || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedElement.adjustments?.sepia || 0}
                      onChange={(e) => handleAdjustmentChange('sepia', Number(e.target.value))}
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Grayscale */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Grayscale</span>
                      <span className="font-mono text-white">
                        {selectedElement.adjustments?.grayscale || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedElement.adjustments?.grayscale || 0}
                      onChange={(e) => handleAdjustmentChange('grayscale', Number(e.target.value))}
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Border & Corner Radius */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Border & Corners
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Corner Radius</label>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={selectedElement.borderRadius || 0}
                        onChange={(e) =>
                          onUpdateElement(selectedElement.id, {
                            borderRadius: Number(e.target.value),
                          })
                        }
                        onBlur={onCommitHistory}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Border Width</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={selectedElement.borderWidth || 0}
                        onChange={(e) =>
                          onUpdateElement(selectedElement.id, {
                            borderWidth: Number(e.target.value),
                          })
                        }
                        onBlur={onCommitHistory}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1.5 text-white"
                      />
                    </div>
                  </div>
                  {selectedElement.borderWidth && selectedElement.borderWidth > 0 ? (
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Border Color</label>
                      <input
                        type="color"
                        value={selectedElement.borderColor || '#000000'}
                        onChange={(e) =>
                          onUpdateElement(selectedElement.id, { borderColor: e.target.value })
                        }
                        onBlur={onCommitHistory}
                        className="w-full h-8 bg-transparent cursor-pointer rounded"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* ================= TEXT SPECIFIC CONTROLS ================= */}
            {selectedElement.type === 'text' && (
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Typography
                </span>

                {/* Font Family */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Font Family</label>
                  <select
                    value={selectedElement.fontFamily || 'Inter'}
                    onChange={(e) => {
                      onUpdateElement(selectedElement.id, { fontFamily: e.target.value });
                      onCommitHistory();
                    }}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-white"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Weight */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Font Size (px)</label>
                    <input
                      type="number"
                      min="8"
                      max="300"
                      value={selectedElement.fontSize || 32}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })
                      }
                      onBlur={onCommitHistory}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Weight</label>
                    <select
                      value={selectedElement.fontWeight || 'normal'}
                      onChange={(e) => {
                        onUpdateElement(selectedElement.id, { fontWeight: e.target.value });
                        onCommitHistory();
                      }}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1.5 text-white"
                    >
                      <option value="300">Light</option>
                      <option value="400">Regular</option>
                      <option value="600">SemiBold</option>
                      <option value="700">Bold</option>
                      <option value="900">Black</option>
                    </select>
                  </div>
                </div>

                {/* Text Formatting Pills */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      onUpdateElement(selectedElement.id, {
                        fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                      });
                      onCommitHistory();
                    }}
                    className={`flex-1 py-1.5 rounded border text-xs font-serif italic ${
                      selectedElement.fontStyle === 'italic'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    I
                  </button>
                  <button
                    onClick={() => {
                      onUpdateElement(selectedElement.id, {
                        underline: !selectedElement.underline,
                      });
                      onCommitHistory();
                    }}
                    className={`flex-1 py-1.5 rounded border text-xs underline ${
                      selectedElement.underline
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    U
                  </button>
                  <button
                    onClick={() => {
                      onUpdateElement(selectedElement.id, {
                        uppercase: !selectedElement.uppercase,
                      });
                      onCommitHistory();
                    }}
                    className={`flex-1 py-1.5 rounded border text-xs uppercase font-mono ${
                      selectedElement.uppercase
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    TT
                  </button>
                </div>

                {/* Text Alignment */}
                <div className="flex items-center space-x-1">
                  {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => {
                        onUpdateElement(selectedElement.id, { textAlign: align });
                        onCommitHistory();
                      }}
                      className={`flex-1 py-1.5 rounded border text-xs uppercase font-mono ${
                        selectedElement.textAlign === align
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {align[0].toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Text Color & Highlight */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Text Color</label>
                    <input
                      type="color"
                      value={selectedElement.color || '#ffffff'}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { color: e.target.value })
                      }
                      onBlur={onCommitHistory}
                      className="w-full h-8 bg-transparent cursor-pointer rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Highlight Bg</label>
                    <input
                      type="color"
                      value={selectedElement.bgColor || '#000000'}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { bgColor: e.target.value })
                      }
                      onBlur={onCommitHistory}
                      className="w-full h-8 bg-transparent cursor-pointer rounded"
                    />
                  </div>
                </div>

                {/* Letter Spacing & Line Height */}
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Letter Spacing</span>
                      <span className="font-mono text-white">
                        {selectedElement.letterSpacing || 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="20"
                      value={selectedElement.letterSpacing || 0}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { letterSpacing: Number(e.target.value) })
                      }
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Line Height</span>
                      <span className="font-mono text-white">
                        {selectedElement.lineHeight || 1.2}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="2.5"
                      step="0.1"
                      value={selectedElement.lineHeight || 1.2}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { lineHeight: Number(e.target.value) })
                      }
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= SHAPE SPECIFIC CONTROLS ================= */}
            {selectedElement.type === 'shape' && (
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Shape Styles
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Fill Color</label>
                    <input
                      type="color"
                      value={selectedElement.fill || '#6366f1'}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { fill: e.target.value })
                      }
                      onBlur={onCommitHistory}
                      className="w-full h-8 bg-transparent cursor-pointer rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Stroke Color</label>
                    <input
                      type="color"
                      value={selectedElement.stroke || '#ffffff'}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { stroke: e.target.value })
                      }
                      onBlur={onCommitHistory}
                      className="w-full h-8 bg-transparent cursor-pointer rounded"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Stroke Width</span>
                    <span className="font-mono text-white">
                      {selectedElement.strokeWidth || 0}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={selectedElement.strokeWidth || 0}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { strokeWidth: Number(e.target.value) })
                    }
                    onMouseUp={onCommitHistory}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {selectedElement.shapeType === 'rounded_rectangle' && (
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Corner Radius</span>
                      <span className="font-mono text-white">
                        {selectedElement.cornerRadius || 20}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedElement.cornerRadius || 20}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { cornerRadius: Number(e.target.value) })
                      }
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ================= CANVAS / DOCUMENT PROPERTIES ================= */
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                Canvas Dimensions
              </span>

              {/* Presets */}
              <div className="space-y-2 mb-4">
                <label className="text-[10px] text-slate-400 block">Preset Formats</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CANVAS_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onUpdateCanvasSize(preset.width, preset.height);
                        setCustomW(preset.width);
                        setCustomH(preset.height);
                        onCommitHistory();
                      }}
                      className={`p-2 rounded-lg text-left border text-xs transition-colors ${
                        canvasWidth === preset.width && canvasHeight === preset.height
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-medium truncate">{preset.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {preset.width} × {preset.height}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom W / H */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={customW}
                    onChange={(e) => setCustomW(Number(e.target.value))}
                    onBlur={() => onUpdateCanvasSize(customW, customH)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={customH}
                    onChange={(e) => setCustomH(Number(e.target.value))}
                    onBlur={() => onUpdateCanvasSize(customW, customH)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Background Style */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Background
              </span>

              {/* Type pills */}
              <div className="flex items-center space-x-1">
                {(['color', 'gradient', 'transparent'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      if (t === 'color') {
                        onUpdateBackground({ type: 'color', color: '#0f172a' });
                      } else if (t === 'gradient') {
                        onUpdateBackground({
                          type: 'gradient',
                          color: '#0f172a',
                          gradient: {
                            type: 'linear',
                            angle: 135,
                            stops: [
                              { color: '#4f46e5', offset: 0 },
                              { color: '#9333ea', offset: 1 },
                            ],
                          },
                        });
                      } else {
                        onUpdateBackground({ type: 'transparent', color: 'transparent' });
                      }
                      onCommitHistory();
                    }}
                    className={`flex-1 py-1.5 rounded border text-xs capitalize ${
                      background.type === t
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {background.type === 'color' && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Color Picker</label>
                  <input
                    type="color"
                    value={background.color}
                    onChange={(e) =>
                      onUpdateBackground({ type: 'color', color: e.target.value })
                    }
                    onBlur={onCommitHistory}
                    className="w-full h-9 bg-transparent cursor-pointer rounded"
                  />
                </div>
              )}

              {background.type === 'gradient' && (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Color 1</label>
                      <input
                        type="color"
                        value={background.gradient?.stops[0]?.color || '#4f46e5'}
                        onChange={(e) => {
                          const stops = [...(background.gradient?.stops || [])];
                          stops[0] = { color: e.target.value, offset: 0 };
                          onUpdateBackground({
                            ...background,
                            gradient: {
                              type: background.gradient?.type || 'linear',
                              angle: background.gradient?.angle || 135,
                              stops,
                            },
                          });
                        }}
                        onBlur={onCommitHistory}
                        className="w-full h-8 bg-transparent cursor-pointer rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Color 2</label>
                      <input
                        type="color"
                        value={background.gradient?.stops[1]?.color || '#9333ea'}
                        onChange={(e) => {
                          const stops = [...(background.gradient?.stops || [])];
                          stops[1] = { color: e.target.value, offset: 1 };
                          onUpdateBackground({
                            ...background,
                            gradient: {
                              type: background.gradient?.type || 'linear',
                              angle: background.gradient?.angle || 135,
                              stops,
                            },
                          });
                        }}
                        onBlur={onCommitHistory}
                        className="w-full h-8 bg-transparent cursor-pointer rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Angle ({background.gradient?.angle || 135}°)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={background.gradient?.angle || 135}
                      onChange={(e) => {
                        onUpdateBackground({
                          ...background,
                          gradient: {
                            type: background.gradient?.type || 'linear',
                            angle: Number(e.target.value),
                            stops: background.gradient?.stops || [],
                          },
                        });
                      }}
                      onMouseUp={onCommitHistory}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AI Studio Backdrop trigger */}
            <div className="p-3 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 rounded-xl border border-indigo-800/50 space-y-2">
              <span className="text-xs font-semibold text-indigo-300 block">
                ✨ Generate AI Backdrop
              </span>
              <p className="text-[11px] text-slate-400">
                Generate high-resolution procedural 3D studio environments, cinematic lighting, and luxury textures.
              </p>
              <button
                onClick={() => onOpenAITool('bg_gen')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
              >
                Open Background Studio
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

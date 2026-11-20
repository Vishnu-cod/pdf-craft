import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Ruler,
  Save,
  Download,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  Layers,
  Sliders,
  Check,
} from 'lucide-react';

interface TopToolbarProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange?: (z: number) => void;
  onFitScreen?: () => void;
  onFitToScreen?: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid?: boolean;
  onToggleSnapToGrid?: () => void;
  onSave: () => void;
  onOpenExport?: () => void;
  onExport?: () => void;
  onOpenShortcuts?: () => void;
  onShortcuts?: () => void;
  onBackToPDFCraft?: () => void;
  onBackToHome?: () => void;
  isSaved?: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  projectName,
  onUpdateProjectName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onFitScreen,
  onFitToScreen,
  showRulers,
  onToggleRulers,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnapToGrid,
  onSave,
  onOpenExport,
  onExport,
  onOpenShortcuts,
  onShortcuts,
  onBackToPDFCraft,
  onBackToHome,
  isSaved = false,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const handleExport = onExport || onOpenExport || (() => {});
  const handleShortcuts = onShortcuts || onOpenShortcuts || (() => {});
  const handleBack = onBackToHome || onBackToPDFCraft || (() => {});
  const handleFit = onFitToScreen || onFitScreen || (() => {});
  const [tempName, setTempName] = useState(projectName);

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      onUpdateProjectName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-30 select-none shadow-sm">
      {/* Left: Brand & Back to PDFCraft */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={handleBack}
          title="Back to PDFCraft Home"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#111439] hover:bg-slate-100 transition-all border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">PDFCraft</span>
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md">
            ✦
          </div>
          <span className="font-black text-sm tracking-tight text-[#111439]">
            Photo<span className="text-purple-600">Craft</span>
          </span>
          <span className="hidden lg:inline-block text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
            Studio
          </span>
        </div>

        {/* Project Name editable */}
        <div className="hidden sm:flex items-center ml-2">
          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              autoFocus
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              className="text-xs font-bold text-[#111439] bg-slate-100 px-2 py-1 rounded border border-purple-400 focus:outline-none max-w-[180px]"
            />
          ) : (
            <button
              onClick={() => {
                setTempName(projectName);
                setIsEditingName(true);
              }}
              title="Click to rename project"
              className="text-xs font-bold text-slate-700 hover:text-[#111439] hover:bg-slate-100 px-2 py-1 rounded max-w-[180px] truncate text-left transition-colors"
            >
              {projectName}
            </button>
          )}
        </div>
      </div>

      {/* Center: Undo, Redo, Zoom & View Tools */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-50 p-0.5 rounded-xl border border-slate-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-slate-700 hover:text-[#111439] disabled:opacity-30 disabled:hover:text-slate-700 rounded-lg transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 text-slate-700 hover:text-[#111439] disabled:opacity-30 disabled:hover:text-slate-700 rounded-lg transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-50 px-1 py-0.5 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={onZoomOut}
            title="Zoom Out (Ctrl -)"
            className="p-1 text-slate-700 hover:text-[#111439] rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-bold text-[11px] text-slate-700 min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            title="Zoom In (Ctrl +)"
            className="p-1 text-slate-700 hover:text-[#111439] rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFit}
            title="Fit to Screen"
            className="p-1 ml-0.5 text-slate-700 hover:text-[#111439] rounded transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rulers & Grid Toggles */}
        <div className="hidden md:flex items-center bg-slate-50 p-0.5 rounded-xl border border-slate-200">
          <button
            onClick={onToggleRulers}
            title="Toggle Rulers"
            className={`p-1.5 rounded-lg transition-all ${
              showRulers ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-600 hover:text-[#111439]'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleGrid}
            title="Toggle Grid / Snapping"
            className={`p-1.5 rounded-lg transition-all ${
              showGrid ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-600 hover:text-[#111439]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Save, Export & Help */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Save button */}
        <button
          onClick={onSave}
          title="Save Project (Ctrl+S)"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#111439] transition-all border border-slate-200"
        >
          {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5 text-slate-600" />}
          <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#111439] to-purple-900 hover:from-black hover:to-purple-950 text-white shadow-md transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-purple-300" />
          <span>Export</span>
        </button>

        {/* Shortcuts / Help */}
        <button
          onClick={handleShortcuts}
          title="Keyboard Shortcuts"
          className="p-1.5 text-slate-400 hover:text-[#111439] rounded-xl hover:bg-slate-100 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

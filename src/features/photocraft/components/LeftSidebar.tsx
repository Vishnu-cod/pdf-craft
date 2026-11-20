import React, { useState } from 'react';
import {
  LayoutTemplate,
  UploadCloud,
  Image as ImageIcon,
  Component,
  Type,
  Palette,
  Smile,
  Shapes,
  PenTool,
  Wand2,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Search,
  Sparkles,
  Scissors,
  Layers,
  Eraser,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import {
  CanvasElement,
  CanvasBackground,
  Template,
  ShapeType,
  PhotoCraftProject,
} from '../types';
import { DEFAULT_TEMPLATES } from '../templates/defaultTemplates';

export type SidebarTab =
  | 'templates'
  | 'uploads'
  | 'photos'
  | 'elements'
  | 'text'
  | 'backgrounds'
  | 'stickers'
  | 'shapes'
  | 'draw'
  | 'ai_tools'
  | 'projects';

interface LeftSidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  onApplyTemplate: (template: Template) => void;
  onAddImage: (src: string, name?: string) => void;
  onAddText: (preset: 'heading' | 'subheading' | 'body' | 'styled', customText?: string) => void;
  onAddShape: (type: ShapeType) => void;
  onAddSticker: (svg: string, name: string) => void;
  onSetBackground: (bg: CanvasBackground) => void;
  // Drawing props
  isDrawingMode: boolean;
  onToggleDrawingMode: (active: boolean) => void;
  brushColor: string;
  onChangeBrushColor: (c: string) => void;
  brushSize: number;
  onChangeBrushSize: (s: number) => void;
  // AI props
  onOpenAITool: (tool: 'eraser' | 'grab' | 'layers' | 'bg_remove' | 'bg_gen') => void;
  // Project props
  projects: PhotoCraftProject[];
  onLoadProject: (p: PhotoCraftProject) => void;
  onDeleteProject: (id: string) => void;
  onImportProject: (file: File) => void;
}

// Curated royalty-free high-res stock photos
const CURATED_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', name: 'Portrait Fashion' },
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', name: 'Tropical Beach' },
  { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', name: 'Architecture' },
  { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80', name: 'Modern Office' },
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', name: 'Mountain Sunset' },
  { url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80', name: 'Celebration Confetti' },
  { url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', name: 'Retro Tech' },
  { url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80', name: 'Cosmetic Minimal' },
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onSelectTab,
  onApplyTemplate,
  onAddImage,
  onAddText,
  onAddShape,
  onAddSticker,
  onSetBackground,
  isDrawingMode,
  onToggleDrawingMode,
  brushColor,
  onChangeBrushColor,
  brushSize,
  onChangeBrushSize,
  onOpenAITool,
  projects,
  onLoadProject,
  onDeleteProject,
  onImportProject,
}) => {
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [photoSearch, setPhotoSearch] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        setUploadedImages((prev) => [url, ...prev]);
        onAddImage(url, file.name);
      });
    }
  };

  const navItems: Array<{ id: SidebarTab; label: string; icon: any; badge?: string }> = [
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'uploads', label: 'Uploads', icon: UploadCloud },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'elements', label: 'Elements', icon: Component },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'backgrounds', label: 'Background', icon: Palette },
    { id: 'stickers', label: 'Stickers', icon: Smile },
    { id: 'shapes', label: 'Shapes', icon: Shapes },
    { id: 'draw', label: 'Draw', icon: PenTool },
    { id: 'ai_tools', label: 'AI Tools', icon: Wand2, badge: '5 AI' },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
  ];

  const filteredTemplates =
    templateFilter === 'all'
      ? DEFAULT_TEMPLATES
      : DEFAULT_TEMPLATES.filter((t) => t.category === templateFilter);

  return (
    <aside className="flex h-full border-r border-slate-200/90 bg-white select-none z-20 shrink-0">
      {/* 1. Left Icon Navigation Strip */}
      <nav className="w-18 bg-white border-r border-slate-200/80 flex flex-col items-center py-2 gap-1 overflow-y-auto shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (item.id === 'draw' && !isDrawingMode) {
                  onToggleDrawingMode(true);
                } else if (item.id !== 'draw' && isDrawingMode) {
                  onToggleDrawingMode(false);
                }
              }}
              title={item.label}
              className={`w-16 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all relative ${
                isActive
                  ? 'bg-purple-50 text-purple-700 font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-[#111439] hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-1 text-[8px] font-black bg-gradient-to-r from-purple-600 to-pink-500 text-white px-1.5 py-0.2 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 2. Secondary Panel Content (Width ~300px) */}
      <div className="w-72 sm:w-80 h-full bg-[#FAFBFD] overflow-y-auto p-4 flex flex-col gap-4 border-r border-slate-200/80">
        
        {/* TAB 1: TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#111439]">Design Templates</h3>
              <p className="text-xs text-slate-500">12+ professionally designed editable presets</p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['all', 'instagram', 'youtube', 'facebook', 'marketing', 'invitation'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTemplateFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg capitalize text-xs font-bold transition-all ${
                    templateFilter === cat
                      ? 'bg-[#111439] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => onApplyTemplate(tmpl)}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm hover:shadow-md hover:border-purple-400 transition-all flex flex-col justify-between"
                >
                  <div className="aspect-[4/3] rounded-xl bg-slate-100 border border-slate-200/80 flex flex-col items-center justify-center p-2 text-center overflow-hidden relative">
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">
                      {tmpl.title}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 mt-1">
                      {tmpl.width}x{tmpl.height}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#111439] mt-2 block truncate">
                    {tmpl.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: UPLOADS */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#111439]">Your Uploads</h3>
              <p className="text-xs text-slate-500">Upload photos (JPG, PNG, WebP) from device</p>
            </div>

            <label className="border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-purple-50/20 transition-all text-center group">
              <UploadCloud className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-[#111439] mb-1">Click to Upload Media</span>
              <span className="text-[10px] text-slate-400">or drag and drop images here</span>
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {uploadedImages.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">Uploaded Photos:</span>
                <div className="grid grid-cols-2 gap-2">
                  {uploadedImages.map((src, i) => (
                    <div
                      key={i}
                      onClick={() => onAddImage(src)}
                      className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white cursor-pointer hover:border-purple-500 shadow-sm transition-all"
                    >
                      <img src={src} alt="Upload" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PHOTOS */}
        {activeTab === 'photos' && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-black text-[#111439]">Stock Photography</h3>
              <p className="text-xs text-slate-500">Royalty-free high-resolution stock visuals</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {CURATED_PHOTOS.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => onAddImage(p.url, p.name)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:shadow-md hover:border-purple-500 transition-all"
                >
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded truncate">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ELEMENTS */}
        {activeTab === 'elements' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#111439]">Graphic Elements</h3>
              <p className="text-xs text-slate-500">Frames, accents, lines & decorative dividers</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onAddShape('line')}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 hover:border-purple-400 font-bold text-xs text-left flex items-center justify-between"
              >
                <span>Horizontal Accent Line</span>
                <span className="text-slate-400">━</span>
              </button>
              <button
                onClick={() => onAddShape('arrow')}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 hover:border-purple-400 font-bold text-xs text-left flex items-center justify-between"
              >
                <span>Pointer Arrow</span>
                <span className="text-slate-400">➔</span>
              </button>
              <button
                onClick={() => onAddShape('speech_bubble')}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 hover:border-purple-400 font-bold text-xs text-left flex items-center justify-between"
              >
                <span>Speech Bubble</span>
                <span className="text-slate-400">💬</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: TEXT */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#111439]">Add Typography</h3>
              <p className="text-xs text-slate-500">Headlines, body copy & designer pairings</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onAddText('heading')}
                className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 font-black text-xl text-[#111439] text-left shadow-sm transition-all hover:translate-x-1"
              >
                Add a Heading
              </button>
              <button
                onClick={() => onAddText('subheading')}
                className="w-full p-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 font-bold text-sm text-[#111439] text-left shadow-sm transition-all hover:translate-x-1"
              >
                Add a Subheading
              </button>
              <button
                onClick={() => onAddText('body')}
                className="w-full p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 font-medium text-xs text-slate-700 text-left shadow-sm transition-all hover:translate-x-1"
              >
                Add Body Text Paragraph
              </button>
            </div>

            {/* Typography Combos */}
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <span className="text-xs font-bold text-slate-600 block">Styled Typography Combos:</span>
              <button
                onClick={() => onAddText('styled', 'SALE 50% OFF')}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 text-white font-black text-lg text-center tracking-wider rounded-xl shadow-sm"
              >
                FLASH DROP • 50% OFF
              </button>
              <button
                onClick={() => onAddText('styled', 'AESTHETIC VIBES')}
                className="w-full p-3 rounded-xl bg-[#111439] text-purple-300 font-serif italic text-base text-center tracking-widest rounded-xl shadow-sm"
              >
                Aesthetic Editorial Vibe
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: BACKGROUNDS */}
        {activeTab === 'backgrounds' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#111439]">Canvas Background</h3>
              <p className="text-xs text-slate-500">Solid tones, gradients & transparent</p>
            </div>

            {/* Solid Colors */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Solid Palettes:</span>
              <div className="grid grid-cols-5 gap-2">
                {[
                  '#FFFFFF',
                  '#F8F8F9',
                  '#000000',
                  '#111439',
                  '#F4EFEA',
                  '#EF4444',
                  '#F59E0B',
                  '#10B981',
                  '#3B82F6',
                  '#8B5CF6',
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => onSetBackground({ type: 'color', color })}
                    style={{ backgroundColor: color }}
                    className="w-10 h-10 rounded-xl border border-slate-300 shadow-inner hover:scale-110 transition-transform"
                  />
                ))}
              </div>
            </div>

            {/* Gradients */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700 block">Aesthetic Gradients:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onSetBackground({
                      type: 'gradient',
                      color: '#111439',
                      gradient: {
                        type: 'linear',
                        angle: 135,
                        stops: [
                          { color: '#FF8A00', offset: 0 },
                          { color: '#E52E71', offset: 1 },
                        ],
                      },
                    })
                  }
                  className="h-12 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 border border-slate-200 text-white font-bold text-[10px]"
                >
                  Sunset Mesh
                </button>
                <button
                  onClick={() =>
                    onSetBackground({
                      type: 'gradient',
                      color: '#111439',
                      gradient: {
                        type: 'linear',
                        angle: 135,
                        stops: [
                          { color: '#6366F1', offset: 0 },
                          { color: '#A855F7', offset: 1 },
                        ],
                      },
                    })
                  }
                  className="h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 border border-slate-200 text-white font-bold text-[10px]"
                >
                  Purple Neon
                </button>
              </div>
            </div>

            {/* Transparent */}
            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => onSetBackground({ type: 'transparent', color: 'transparent' })}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-400 bg-white hover:bg-slate-50 text-xs font-bold text-[#111439] flex items-center justify-center gap-2"
              >
                <span>Transparent Background (PNG)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: STICKERS */}
        {activeTab === 'stickers' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#111439]">Stickers & Badges</h3>
              <p className="text-xs text-slate-500">Vector badges, icons & decorative marks</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { name: 'Star Sparkle', icon: '✨' },
                { name: 'Fire Promo', icon: '🔥' },
                { name: 'Verified Badge', icon: '✓' },
                { name: 'Rocket Launch', icon: '🚀' },
                { name: 'Heart React', icon: '❤️' },
                { name: 'Flash Bolt', icon: '⚡' },
                { name: '100 Score', icon: '💯' },
                { name: 'Crown VIP', icon: '👑' },
                { name: 'Globe Web', icon: '🌐' },
              ].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onAddText('styled', s.icon)}
                  className="aspect-square rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:scale-105 transition-all flex items-center justify-center text-3xl shadow-sm"
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: SHAPES */}
        {activeTab === 'shapes' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#111439]">Geometric Shapes</h3>
              <p className="text-xs text-slate-500">Click any shape to add to canvas</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { type: 'rectangle' as ShapeType, label: 'Rectangle', icon: '■' },
                { type: 'rounded_rectangle' as ShapeType, label: 'Rounded Box', icon: '▢' },
                { type: 'circle' as ShapeType, label: 'Circle', icon: '●' },
                { type: 'triangle' as ShapeType, label: 'Triangle', icon: '▲' },
                { type: 'star' as ShapeType, label: 'Star', icon: '★' },
                { type: 'heart' as ShapeType, label: 'Heart', icon: '♥' },
              ].map((sh) => (
                <button
                  key={sh.type}
                  onClick={() => onAddShape(sh.type)}
                  className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all flex flex-col items-center justify-center gap-1.5 text-slate-700"
                >
                  <span className="text-2xl text-purple-600">{sh.icon}</span>
                  <span className="text-xs font-bold">{sh.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: DRAW */}
        {activeTab === 'draw' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#111439]">Freehand Drawing</h3>
              <p className="text-xs text-slate-500">Draw directly onto the canvas</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Brush Size:</span>
                <span>{brushSize}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="40"
                value={brushSize}
                onChange={(e) => onChangeBrushSize(Number(e.target.value))}
                className="w-full accent-purple-600"
              />

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-700 block">Brush Color:</span>
                <div className="flex flex-wrap gap-2">
                  {['#000000', '#FFFFFF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'].map((c) => (
                    <button
                      key={c}
                      onClick={() => onChangeBrushColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        brushColor === c ? 'border-purple-600 scale-110 shadow-md' : 'border-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: AI TOOLS (THE 5 REAL ENGINES) */}
        {activeTab === 'ai_tools' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-black text-[#111439]">AI Creative Studio</h3>
              </div>
              <p className="text-xs text-slate-500">100% Free, Browser-Powered AI Engines ($0 Cost)</p>
            </div>

            {/* AI Tool 1: Magic Eraser */}
            <div
              onClick={() => onOpenAITool('eraser')}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-[#111439] flex items-center gap-1.5">
                  <Eraser className="w-3.5 h-3.5 text-purple-600" />
                  Magic Eraser
                </span>
                <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Inpainting
                </span>
              </div>
              <p className="text-[11px] text-[#425466]">
                Paint over unwanted objects, people, or text to reconstruct the scene seamlessly.
              </p>
            </div>

            {/* AI Tool 2: Background Remover */}
            <div
              onClick={() => onOpenAITool('bg_remove')}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-[#111439] flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-emerald-600" />
                  Background Remover
                </span>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  1-Click PNG
                </span>
              </div>
              <p className="text-[11px] text-[#425466]">
                Instant subject extraction producing clean transparent backgrounds in 1 click.
              </p>
            </div>

            {/* AI Tool 3: Magic Grab */}
            <div
              onClick={() => onOpenAITool('grab')}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-[#111439] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Magic Grab
                </span>
                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Layer Cutout
                </span>
              </div>
              <p className="text-[11px] text-[#425466]">
                Extract any person or object from a photo into a moveable independent layer.
              </p>
            </div>

            {/* AI Tool 4: Magic Layers */}
            <div
              onClick={() => onOpenAITool('layers')}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-[#111439] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Magic Layers
                </span>
                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  Multi-Plane
                </span>
              </div>
              <p className="text-[11px] text-[#425466]">
                Decompose a flat photograph into 3 separate editable foreground, midground & background layers.
              </p>
            </div>

            {/* AI Tool 5: Background Generator */}
            <div
              onClick={() => onOpenAITool('bg_gen')}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-[#111439] flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-pink-600" />
                  AI Background Generator
                </span>
                <span className="text-[9px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                  Text-to-Scene
                </span>
              </div>
              <p className="text-[11px] text-[#425466]">
                Generate custom environments (Studio, Luxury, Office, Nature, Cyberpunk) via prompt.
              </p>
            </div>
          </div>
        )}

        {/* TAB 11: MY PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#111439]">My Projects</h3>
                <p className="text-xs text-slate-500">Browser saved project gallery</p>
              </div>
              <label className="cursor-pointer text-purple-700 hover:text-purple-900 font-bold text-xs flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".photocraft,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onImportProject(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No saved projects yet. Click "Save" in the top bar to save your work!
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between hover:border-purple-400 transition-all shadow-sm"
                  >
                    <div
                      onClick={() => onLoadProject(proj)}
                      className="cursor-pointer flex-1 min-w-0 pr-2"
                    >
                      <span className="text-xs font-black text-[#111439] block truncate">
                        {proj.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {proj.width} × {proj.height} • {new Date(proj.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
  );
};

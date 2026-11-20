export type ElementType = 'image' | 'text' | 'shape' | 'sticker' | 'drawing';

export type ShapeType =
  | 'rectangle'
  | 'rounded_rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'polygon'
  | 'line'
  | 'arrow'
  | 'speech_bubble'
  | 'heart';

export type ImageFilterPreset =
  | 'none'
  | 'natural'
  | 'vintage'
  | 'cinematic'
  | 'warm'
  | 'cool'
  | 'noir'
  | 'glam'
  | 'dramatic'
  | 'fade'
  | 'retro'
  | 'high_contrast';

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  exposure: number; // -100 to 100
  temperature: number; // -100 to 100 (warmth)
  tint: number; // -100 to 100
  blur: number; // 0 to 50
  sepia: number; // 0 to 100
  grayscale: number; // 0 to 100
  vignette: number; // 0 to 100
  opacity: number; // 0 to 100
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextShadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface TextOutline {
  color: string;
  width: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  isLocked: boolean;
  isVisible: boolean;
  flipX?: boolean;
  flipY?: boolean;
  zIndex: number;

  // Image specific
  src?: string;
  originalSrc?: string;
  aspectRatio?: number;
  filter?: ImageFilterPreset;
  adjustments?: ImageAdjustments;
  crop?: CropRect;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;

  // Text specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
  uppercase?: boolean;
  color?: string;
  bgColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number;
  lineHeight?: number;
  shadow?: TextShadow;
  outline?: TextOutline;

  // Shape specific
  shapeType?: ShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDash?: boolean;
  cornerRadius?: number;

  // Sticker specific
  stickerCategory?: string;
  svgContent?: string;

  // Drawing specific
  drawingPoints?: Array<{ x: number; y: number }>;
  brushColor?: string;
  brushSize?: number;

  // AI-generated layer metadata
  isAiLayer?: boolean;
  aiType?: 'magic_grab' | 'magic_layers' | 'bg_removed' | 'bg_generated' | 'inpainted';
}

export interface CanvasBackground {
  type: 'color' | 'gradient' | 'image' | 'transparent';
  color: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; offset: number }>;
  };
  imageSrc?: string;
}

export interface CanvasPreset {
  id: string;
  name: string;
  category: 'social' | 'print' | 'digital' | 'custom';
  width: number;
  height: number;
  iconName: string;
}

export interface PhotoCraftProject {
  id: string;
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  width: number;
  height: number;
  background: CanvasBackground;
  elements: CanvasElement[];
  thumbnail?: string;
}

export interface Template {
  id: string;
  title: string;
  category: 'instagram' | 'facebook' | 'youtube' | 'marketing' | 'invitation' | 'minimal';
  width: number;
  height: number;
  background: CanvasBackground;
  elements: CanvasElement[];
  previewUrl?: string;
}

export interface HistorySnapshot {
  width: number;
  height: number;
  background: CanvasBackground;
  elements: CanvasElement[];
  selectedId: string | null;
}

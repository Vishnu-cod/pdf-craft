import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  CanvasElement,
  CanvasBackground,
  ElementType,
  ShapeType,
} from '../types';

interface CanvasWorkspaceProps {
  width: number;
  height: number;
  background: CanvasBackground;
  elements: CanvasElement[];
  selectedId: string | null;
  zoom: number;
  showRulers: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  drawingMode: boolean;
  drawColor: string;
  drawSize: number;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onAddElement: (element: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onCommitHistory: () => void;
  onZoomChange: (newZoom: number) => void;
}

type DragMode = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate' | null;

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  width,
  height,
  background,
  elements,
  selectedId,
  zoom,
  showRulers,
  showGrid,
  snapToGrid,
  drawingMode,
  drawColor,
  drawSize,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onDeleteElement,
  onDuplicateElement,
  onCommitHistory,
  onZoomChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Transform / Drag state
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  } | null>(null);

  // Smart Alignment Guides
  const [smartGuides, setSmartGuides] = useState<{
    xLine: number | null;
    yLine: number | null;
  }>({ xLine: null, yLine: null });

  // Drawing mode live points
  const [activeDrawingPoints, setActiveDrawingPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // In-place text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const selectedElement = elements.find((el) => el.id === selectedId);

  // Track Space bar for pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !editingTextId && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [editingTextId]);

  // Handle Wheel for Zoom or Scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const nextZoom = Math.min(5, Math.max(0.1, Number((zoom * zoomFactor).toFixed(2))));
      onZoomChange(nextZoom);
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Convert mouse screen coordinates to canvas coordinates
  const screenToCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / zoom;
      const y = (clientY - rect.top) / zoom;
      return { x, y };
    },
    [zoom]
  );

  // Pan / Canvas Mouse Down
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (spacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // If click lands directly on container (outside canvas or empty canvas)
    if (e.target === containerRef.current || (canvasRef.current && e.target === canvasRef.current)) {
      if (!drawingMode) {
        onSelectElement(null);
        setEditingTextId(null);
      }
    }
  };

  // Start Drawing
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (drawingMode) {
      e.stopPropagation();
      setIsDrawing(true);
      const coords = screenToCanvasCoords(e.clientX, e.clientY);
      setActiveDrawingPoints([coords]);
    }
  };

  // Container Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    if (drawingMode && isDrawing) {
      const coords = screenToCanvasCoords(e.clientX, e.clientY);
      setActiveDrawingPoints((prev) => [...prev, coords]);
      return;
    }

    if (!dragMode || !selectedElement || !elementStart) return;

    const currentCoords = screenToCanvasCoords(e.clientX, e.clientY);
    const startCoords = screenToCanvasCoords(dragStart.x, dragStart.y);
    const dx = currentCoords.x - startCoords.x;
    const dy = currentCoords.y - startCoords.y;

    if (dragMode === 'move') {
      let newX = elementStart.x + dx;
      let newY = elementStart.y + dy;

      // Smart Guides & Center Snapping
      const snapDist = 6;
      let xSnap: number | null = null;
      let ySnap: number | null = null;

      const elementCenterX = newX + elementStart.width / 2;
      const elementCenterY = newY + elementStart.height / 2;
      const canvasCenterX = width / 2;
      const canvasCenterY = height / 2;

      // Center snap
      if (Math.abs(elementCenterX - canvasCenterX) < snapDist) {
        newX = canvasCenterX - elementStart.width / 2;
        xSnap = canvasCenterX;
      }
      if (Math.abs(elementCenterY - canvasCenterY) < snapDist) {
        newY = canvasCenterY - elementStart.height / 2;
        ySnap = canvasCenterY;
      }

      // Grid snap if active
      if (snapToGrid) {
        const gridSize = 20;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      setSmartGuides({ xLine: xSnap, yLine: ySnap });

      onUpdateElement(selectedElement.id, {
        x: Math.round(newX),
        y: Math.round(newY),
      });
    } else if (dragMode === 'rotate') {
      if (!canvasRef.current) return;
      const centerCanvasX = elementStart.x + elementStart.width / 2;
      const centerCanvasY = elementStart.y + elementStart.height / 2;
      const rad = Math.atan2(currentCoords.y - centerCanvasY, currentCoords.x - centerCanvasX);
      let deg = Math.round((rad * 180) / Math.PI) + 90; // offset so top handle is 0
      if (deg < 0) deg += 360;
      if (deg >= 360) deg -= 360;

      // Snap to 45 deg intervals if close
      if (Math.abs(deg % 45) < 3 || Math.abs((deg % 45) - 45) < 3) {
        deg = Math.round(deg / 45) * 45;
      }

      onUpdateElement(selectedElement.id, { rotation: deg });
    } else {
      // Resize handles
      let newX = elementStart.x;
      let newY = elementStart.y;
      let newW = elementStart.width;
      let newH = elementStart.height;

      const minSize = 20;

      if (dragMode.includes('e')) {
        newW = Math.max(minSize, elementStart.width + dx);
      }
      if (dragMode.includes('s')) {
        newH = Math.max(minSize, elementStart.height + dy);
      }
      if (dragMode.includes('w')) {
        const potentialW = elementStart.width - dx;
        if (potentialW >= minSize) {
          newW = potentialW;
          newX = elementStart.x + dx;
        }
      }
      if (dragMode.includes('n')) {
        const potentialH = elementStart.height - dy;
        if (potentialH >= minSize) {
          newH = potentialH;
          newY = elementStart.y + dy;
        }
      }

      // Preserve aspect ratio for images or if shift pressed
      if (e.shiftKey || selectedElement.type === 'image') {
        const ratio = elementStart.width / elementStart.height;
        if (dragMode === 'se' || dragMode === 'nw' || dragMode === 'ne' || dragMode === 'sw') {
          newH = Math.round(newW / ratio);
        }
      }

      onUpdateElement(selectedElement.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (dragMode) {
      setDragMode(null);
      setElementStart(null);
      setSmartGuides({ xLine: null, yLine: null });
      onCommitHistory();
    }
    if (drawingMode && isDrawing) {
      setIsDrawing(false);
      if (activeDrawingPoints.length > 1) {
        // Find bounding box of drawn points
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        activeDrawingPoints.forEach((pt) => {
          if (pt.x < minX) minX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y > maxY) maxY = pt.y;
        });

        const padding = drawSize;
        const normX = Math.max(0, Math.round(minX - padding));
        const normY = Math.max(0, Math.round(minY - padding));
        const normW = Math.max(20, Math.round(maxX - minX + padding * 2));
        const normH = Math.max(20, Math.round(maxY - minY + padding * 2));

        // Offset points relative to element top-left
        const relativePoints = activeDrawingPoints.map((pt) => ({
          x: Math.round(pt.x - normX),
          y: Math.round(pt.y - normY),
        }));

        const newDrawingElement: CanvasElement = {
          id: `drawing-${Date.now()}`,
          type: 'drawing',
          name: 'Freehand Drawing',
          x: normX,
          y: normY,
          width: normW,
          height: normH,
          rotation: 0,
          opacity: 100,
          isLocked: false,
          isVisible: true,
          zIndex: elements.length + 1,
          drawingPoints: relativePoints,
          brushColor: drawColor,
          brushSize: drawSize,
        };

        onAddElement(newDrawingElement);
        onCommitHistory();
      }
      setActiveDrawingPoints([]);
    }
  };

  // Handle Element Mouse Down
  const handleElementMouseDown = (e: React.MouseEvent, element: CanvasElement) => {
    if (drawingMode) return;
    if (element.isLocked) {
      onSelectElement(element.id);
      return;
    }

    e.stopPropagation();
    onSelectElement(element.id);
    setDragMode('move');
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
    });
  };

  // Start Resize / Rotate Handle
  const handleHandleMouseDown = (e: React.MouseEvent, mode: DragMode) => {
    e.stopPropagation();
    if (!selectedElement || selectedElement.isLocked) return;

    setDragMode(mode);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({
      x: selectedElement.x,
      y: selectedElement.y,
      width: selectedElement.width,
      height: selectedElement.height,
      rotation: selectedElement.rotation,
    });
  };

  // Compute CSS background
  const getCanvasBackgroundStyle = (): React.CSSProperties => {
    if (background.type === 'color') {
      return { backgroundColor: background.color };
    }
    if (background.type === 'gradient' && background.gradient) {
      const g = background.gradient;
      const stopsStr = g.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
      return {
        backgroundImage:
          g.type === 'linear'
            ? `linear-gradient(${g.angle}deg, ${stopsStr})`
            : `radial-gradient(circle, ${stopsStr})`,
      };
    }
    if (background.type === 'image' && background.imageSrc) {
      return {
        backgroundImage: `url(${background.imageSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    // Transparent checkerboard
    return {
      backgroundImage: `
        linear-gradient(45deg, #1e293b 25%, transparent 25%),
        linear-gradient(-45deg, #1e293b 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #1e293b 75%),
        linear-gradient(-45deg, transparent 75%, #1e293b 75%)
      `,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      backgroundColor: '#0f172a',
    };
  };

  // Render SVG Shape
  const renderShape = (element: CanvasElement) => {
    const w = element.width;
    const h = element.height;
    const fill = element.fill || '#6366f1';
    const stroke = element.stroke || 'none';
    const strokeWidth = element.strokeWidth || 0;
    const strokeDasharray = element.strokeDash ? '6 4' : undefined;

    switch (element.shapeType) {
      case 'circle':
        return (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w / 2 - strokeWidth}
            ry={h / 2 - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      case 'triangle':
        return (
          <polygon
            points={`${w / 2},${strokeWidth} ${w - strokeWidth},${h - strokeWidth} ${strokeWidth},${h - strokeWidth}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      case 'star': {
        const points = [];
        const cx = w / 2;
        const cy = h / 2;
        const outerR = Math.min(w, h) / 2 - strokeWidth;
        const innerR = outerR * 0.45;
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return (
          <polygon
            points={points.join(' ')}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      }
      case 'heart':
        return (
          <path
            d={`M ${w / 2} ${h * 0.8}
               C ${w * 0.1} ${h * 0.55}, 0 ${h * 0.25}, ${w * 0.25} ${h * 0.08}
               C ${w * 0.45} ${h * 0.08}, ${w / 2} ${h * 0.3}, ${w / 2} ${h * 0.3}
               C ${w / 2} ${h * 0.3}, ${w * 0.55} ${h * 0.08}, ${w * 0.75} ${h * 0.08}
               C ${w} ${h * 0.25}, ${w * 0.9} ${h * 0.55}, ${w / 2} ${h * 0.8} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      case 'arrow':
        return (
          <polygon
            points={`0,${h * 0.35} ${w * 0.6},${h * 0.35} ${w * 0.6},${h * 0.1} ${w},${h * 0.5} ${w * 0.6},${h * 0.9} ${w * 0.6},${h * 0.65} 0,${h * 0.65}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      case 'speech_bubble':
        return (
          <path
            d={`M 10 10 
               H ${w - 10} 
               A 10 10 0 0 1 ${w} 20 
               V ${h * 0.7} 
               A 10 10 0 0 1 ${w - 10} ${h * 0.7 + 10} 
               H ${w * 0.35} 
               L ${w * 0.2} ${h} 
               L ${w * 0.25} ${h * 0.7 + 10} 
               H 10 
               A 10 10 0 0 1 0 ${h * 0.7} 
               V 20 
               A 10 10 0 0 1 10 10 Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      case 'rounded_rectangle':
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={w - strokeWidth}
            height={h - strokeWidth}
            rx={element.cornerRadius || 20}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      default: // rectangle
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={w - strokeWidth}
            height={h - strokeWidth}
            rx={element.cornerRadius || 0}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
    }
  };

  // Build Image filter string
  const getImageFilterStyle = (element: CanvasElement): string => {
    if (!element.adjustments) return 'none';
    const a = element.adjustments;
    const brightness = 1 + a.brightness / 100;
    const contrast = 1 + a.contrast / 100;
    const saturate = 1 + a.saturation / 100;
    const blur = a.blur > 0 ? `blur(${a.blur}px)` : '';
    const sepia = a.sepia > 0 ? `sepia(${a.sepia}%)` : '';
    const grayscale = a.grayscale > 0 ? `grayscale(${a.grayscale}%)` : '';

    return `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) ${blur} ${sepia} ${grayscale}`.trim();
  };

  // Render Element Content
  const renderElementContent = (element: CanvasElement) => {
    if (!element.isVisible) return null;

    switch (element.type) {
      case 'image':
        return (
          <img
            src={element.src}
            alt={element.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: getImageFilterStyle(element),
              borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
              border:
                element.borderWidth && element.borderWidth > 0
                  ? `${element.borderWidth}px solid ${element.borderColor || '#000'}`
                  : undefined,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            draggable={false}
          />
        );

      case 'text': {
        const isEditing = editingTextId === element.id;
        const textShadow = element.shadow
          ? `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.color}`
          : undefined;
        const textStroke = element.outline
          ? `${element.outline.width}px ${element.outline.color}`
          : undefined;

        if (isEditing) {
          return (
            <textarea
              autoFocus
              value={element.text}
              onChange={(e) => onUpdateElement(element.id, { text: e.target.value })}
              onBlur={() => {
                setEditingTextId(null);
                onCommitHistory();
              }}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: '1px dashed #6366f1',
                outline: 'none',
                resize: 'none',
                fontFamily: element.fontFamily || 'Inter, sans-serif',
                fontSize: `${element.fontSize || 32}px`,
                fontWeight: element.fontWeight || 'normal',
                fontStyle: element.fontStyle || 'normal',
                textDecoration: element.underline ? 'underline' : 'none',
                textTransform: element.uppercase ? 'uppercase' : 'none',
                textAlign: element.textAlign || 'left',
                color: element.color || '#ffffff',
                letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
                lineHeight: element.lineHeight || 1.2,
                padding: '4px',
              }}
            />
          );
        }

        return (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingTextId(element.id);
            }}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                element.textAlign === 'center'
                  ? 'center'
                  : element.textAlign === 'right'
                  ? 'flex-end'
                  : 'flex-start',
              fontFamily: element.fontFamily || 'Inter, sans-serif',
              fontSize: `${element.fontSize || 32}px`,
              fontWeight: element.fontWeight || 'normal',
              fontStyle: element.fontStyle || 'normal',
              textDecoration: element.underline ? 'underline' : 'none',
              textTransform: element.uppercase ? 'uppercase' : 'none',
              textAlign: element.textAlign || 'left',
              color: element.color || '#ffffff',
              backgroundColor: element.bgColor || 'transparent',
              letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
              lineHeight: element.lineHeight || 1.2,
              textShadow,
              WebkitTextStroke: textStroke,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              userSelect: 'none',
              padding: '4px',
            }}
          >
            {element.text}
          </div>
        );
      }

      case 'shape':
        return (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${element.width} ${element.height}`}
            style={{ overflow: 'visible', pointerEvents: 'none' }}
          >
            {renderShape(element)}
          </svg>
        );

      case 'sticker':
        return (
          <div
            style={{ width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none', fill: 'currentColor' }}
            dangerouslySetInnerHTML={
              element.svgContent ? { __html: element.svgContent } : undefined
            }
          />
        );

      case 'drawing':
        if (!element.drawingPoints || element.drawingPoints.length < 2) return null;
        const d = element.drawingPoints
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
          .join(' ');
        return (
          <svg
            width="100%"
            height="100%"
            style={{ overflow: 'visible', pointerEvents: 'none' }}
          >
            <path
              d={d}
              fill="none"
              stroke={element.brushColor || '#6366f1'}
              strokeWidth={element.brushSize || 4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      default:
        return null;
    }
  };

  // Sort elements by zIndex
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`relative flex-1 min-w-0 overflow-hidden select-none bg-[#090d16] flex items-center justify-center ${
        spacePressed || isPanning ? 'cursor-grab active:cursor-grabbing' : drawingMode ? 'cursor-crosshair' : 'cursor-default'
      }`}
    >
      {/* Horizontal & Vertical Rulers */}
      {showRulers && (
        <>
          <div className="absolute top-0 left-0 right-0 h-6 bg-[#0f172a] border-b border-slate-700/60 z-30 flex items-center text-[10px] text-slate-400 font-mono pl-6 overflow-hidden">
            {Array.from({ length: Math.ceil(width / 100) + 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute border-l border-slate-600/80 h-3 flex items-end pl-1"
                style={{
                  left: `${(i * 100 * zoom) + (containerRef.current ? containerRef.current.clientWidth / 2 - (width * zoom) / 2 + pan.x : 0)}px`,
                }}
              >
                {i * 100}
              </div>
            ))}
          </div>
          <div className="absolute top-0 left-0 bottom-0 w-6 bg-[#0f172a] border-r border-slate-700/60 z-30 flex flex-col text-[10px] text-slate-400 font-mono pt-6 overflow-hidden">
            {Array.from({ length: Math.ceil(height / 100) + 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute border-t border-slate-600/80 w-3 flex justify-end pr-1"
                style={{
                  top: `${(i * 100 * zoom) + (containerRef.current ? containerRef.current.clientHeight / 2 - (height * zoom) / 2 + pan.y : 0)}px`,
                }}
              >
                {i * 100}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Main Canvas Viewport Box */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          ...getCanvasBackgroundStyle(),
        }}
        className="relative transition-transform duration-75 shrink-0"
      >
        {/* Grid overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
        )}

        {/* Render All Elements */}
        {sortedElements.map((el) => {
          const isSelected = el.id === selectedId;
          const transformStr = `rotate(${el.rotation}deg) scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`;

          return (
            <div
              key={el.id}
              onMouseDown={(e) => handleElementMouseDown(e, el)}
              style={{
                position: 'absolute',
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                height: `${el.height}px`,
                transform: transformStr,
                transformOrigin: 'center center',
                opacity: el.opacity / 100,
                zIndex: el.zIndex,
                cursor: el.isLocked ? 'not-allowed' : drawingMode ? 'crosshair' : 'move',
              }}
              className="group"
            >
              {renderElementContent(el)}

              {/* Bounding box & Resize Handles if Selected */}
              {isSelected && !el.isLocked && !drawingMode && (
                <div
                  className="absolute inset-0 pointer-events-none border-2 border-indigo-500 ring-2 ring-indigo-500/20"
                  style={{ transformOrigin: 'center center' }}
                >
                  {/* Rotation Stalk and Pin */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown(e, 'rotate')}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full shadow pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-125 transition-transform flex items-center justify-center"
                    title="Rotate"
                  >
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-indigo-500 pointer-events-none" />

                  {/* 8 Resize Handles */}
                  {/* NW */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown(e, 'nw')}
                    className="absolute -top-2 -left-2 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform"
                  />
                  {/* N */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown(e, 'n')}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-2.5 bg-white border-2 border-indigo-600 rounded-sm shadow pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform"
                  />
                  {/* NE */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown(e, 'ne')}
                    className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform"
                  />
                  {/* E */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown(e, 'e')}
                    className="absolute top-1/2 -translate-y-1/2 -right-2 w-2.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform"
                  />
                  {/* SE */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown(e, 'se')}
                    className="absolute -bottom-2 -right-2 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform"
                  />
                  {/* S */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown(e, 's')}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-2.5 bg-white border-2 border-indigo-600 rounded-sm shadow pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform"
                  />
                  {/* SW */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown(e, 'sw')}
                    className="absolute -bottom-2 -left-2 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform"
                  />
                  {/* W */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown(e, 'w')}
                    className="absolute top-1/2 -translate-y-1/2 -left-2 w-2.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform"
                  />

                  {/* Size Indicator Badge */}
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] px-2 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap pointer-events-none">
                    {Math.round(el.width)} × {Math.round(el.height)} px
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Live Active Drawing Stroke */}
        {drawingMode && activeDrawingPoints.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-50">
            <path
              d={activeDrawingPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')}
              fill="none"
              stroke={drawColor}
              strokeWidth={drawSize}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Alignment Smart Guides */}
        {smartGuides.xLine !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)] pointer-events-none z-50"
            style={{ left: `${smartGuides.xLine}px` }}
          />
        )}
        {smartGuides.yLine !== null && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)] pointer-events-none z-50"
            style={{ top: `${smartGuides.yLine}px` }}
          />
        )}
      </div>

      {/* Floating Canvas Quick Controls (Zoom / Recenter) */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-2xl z-40 text-xs text-slate-300">
        <button
          onClick={() => onZoomChange(Math.max(0.1, Number((zoom - 0.1).toFixed(2))))}
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom Out"
        >
          -
        </button>
        <span className="font-mono text-white min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoomChange(Math.min(5, Number((zoom + 0.1).toFixed(2))))}
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <div className="w-px h-3 bg-slate-700 mx-1" />
        <button
          onClick={() => {
            setPan({ x: 0, y: 0 });
            onZoomChange(1);
          }}
          className="px-1.5 py-0.5 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Reset View"
        >
          100%
        </button>
      </div>
    </div>
  );
};

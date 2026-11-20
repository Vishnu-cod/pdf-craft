import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CanvasElement,
  CanvasBackground,
  HistorySnapshot,
  PhotoCraftProject,
  Template,
  ShapeType,
} from '../types';
import { TopToolbar } from './TopToolbar';
import { LeftSidebar, SidebarTab } from './LeftSidebar';
import { CanvasWorkspace } from './CanvasWorkspace';
import { PropertiesPanel } from './PropertiesPanel';
import { AIToolsModal } from './AIToolsModal';
import { ExportModal } from './ExportModal';
import { ShortcutsModal } from './ShortcutsModal';
import {
  saveProjectToStorage,
  getProjectFromStorage,
  listSavedProjects,
  exportProjectFile,
  importProjectFile,
  ProjectService,
} from '../services/projectService';
import { DEFAULT_TEMPLATES } from '../templates/defaultTemplates';

interface PhotoCraftStudioProps {
  onBackToHome?: () => void;
}

export const PhotoCraftStudio: React.FC<PhotoCraftStudioProps> = ({ onBackToHome }) => {
  // Project Info
  const [projectId, setProjectId] = useState<string>(() => `proj-${Date.now()}`);
  const [projectName, setProjectName] = useState<string>('Untitled Design');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('templates');
  const [savedProjectsList, setSavedProjectsList] = useState<PhotoCraftProject[]>(() => listSavedProjects());

  // Canvas Viewport & Layout
  const [canvasWidth, setCanvasWidth] = useState<number>(1080);
  const [canvasHeight, setCanvasHeight] = useState<number>(1080);
  const [background, setBackground] = useState<CanvasBackground>({
    type: 'color',
    color: '#0f172a',
  });
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // View Options
  const [zoom, setZoom] = useState<number>(0.7);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);

  // Freehand Drawing Mode
  const [drawingMode, setDrawingMode] = useState<boolean>(false);
  const [drawColor, setDrawColor] = useState<string>('#6366f1');
  const [drawSize, setDrawSize] = useState<number>(4);

  // Modals
  const [activeAITool, setActiveAITool] = useState<
    'eraser' | 'bg_remover' | 'grab' | 'layers' | 'bg_gen' | null
  >(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // History for Undo / Redo
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isInternalHistoryStep = useRef(false);

  // Load default template on first launch if canvas empty
  useEffect(() => {
    if (elements.length === 0 && DEFAULT_TEMPLATES.length > 0) {
      const initialTemplate = DEFAULT_TEMPLATES[0]; // Instagram Fashion template
      setCanvasWidth(initialTemplate.width);
      setCanvasHeight(initialTemplate.height);
      setBackground(initialTemplate.background);
      setElements(initialTemplate.elements);
      setProjectName(initialTemplate.title);

      // Record first initial snapshot
      const snap: HistorySnapshot = {
        width: initialTemplate.width,
        height: initialTemplate.height,
        background: initialTemplate.background,
        elements: initialTemplate.elements,
        selectedId: null,
      };
      setHistory([snap]);
      setHistoryIndex(0);
    }
  }, []);

  // Snapshot commit function
  const commitHistory = useCallback(() => {
    if (isInternalHistoryStep.current) {
      isInternalHistoryStep.current = false;
      return;
    }

    const currentSnapshot: HistorySnapshot = {
      width: canvasWidth,
      height: canvasHeight,
      background: JSON.parse(JSON.stringify(background)),
      elements: JSON.parse(JSON.stringify(elements)),
      selectedId,
    };

    setHistory((prev) => {
      // Truncate future branch if user made changes after undoing
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, currentSnapshot].slice(-30); // keep last 30 states
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [canvasWidth, canvasHeight, background, elements, selectedId, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetSnap = history[targetIndex];
      isInternalHistoryStep.current = true;
      setCanvasWidth(targetSnap.width);
      setCanvasHeight(targetSnap.height);
      setBackground(targetSnap.background);
      setElements(targetSnap.elements);
      setSelectedId(targetSnap.selectedId);
      setHistoryIndex(targetIndex);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetSnap = history[targetIndex];
      isInternalHistoryStep.current = true;
      setCanvasWidth(targetSnap.width);
      setCanvasHeight(targetSnap.height);
      setBackground(targetSnap.background);
      setElements(targetSnap.elements);
      setSelectedId(targetSnap.selectedId);
      setHistoryIndex(targetIndex);
    }
  }, [history, historyIndex]);

  // Element Actions
  const handleAddElement = useCallback(
    (newEl: CanvasElement) => {
      setElements((prev) => [...prev, newEl]);
      setSelectedId(newEl.id);
      setTimeout(commitHistory, 10);
    },
    [commitHistory]
  );

  const handleUpdateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  const handleDeleteElement = useCallback(
    (id: string) => {
      setElements((prev) => prev.filter((el) => el.id !== id));
      if (selectedId === id) setSelectedId(null);
      setTimeout(commitHistory, 10);
    },
    [selectedId, commitHistory]
  );

  const handleDuplicateElement = useCallback(
    (id: string) => {
      const target = elements.find((el) => el.id === id);
      if (!target) return;
      const cloned: CanvasElement = {
        ...JSON.parse(JSON.stringify(target)),
        id: `el-${Date.now()}`,
        name: `${target.name} Copy`,
        x: target.x + 24,
        y: target.y + 24,
        zIndex: elements.length + 1,
      };
      setElements((prev) => [...prev, cloned]);
      setSelectedId(cloned.id);
      setTimeout(commitHistory, 10);
    },
    [elements, commitHistory]
  );

  // Layer Reordering
  const handleReorderElement = useCallback(
    (id: string, direction: 'front' | 'forward' | 'backward' | 'back') => {
      setElements((prev) => {
        const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
        const idx = sorted.findIndex((el) => el.id === id);
        if (idx === -1) return prev;

        const target = sorted[idx];
        if (direction === 'front') {
          sorted.splice(idx, 1);
          sorted.push(target);
        } else if (direction === 'back') {
          sorted.splice(idx, 1);
          sorted.unshift(target);
        } else if (direction === 'forward' && idx < sorted.length - 1) {
          sorted[idx] = sorted[idx + 1];
          sorted[idx + 1] = target;
        } else if (direction === 'backward' && idx > 0) {
          sorted[idx] = sorted[idx - 1];
          sorted[idx - 1] = target;
        }

        // Reassign normalized zIndex
        return sorted.map((el, i) => ({ ...el, zIndex: i + 1 }));
      });
      setTimeout(commitHistory, 10);
    },
    [commitHistory]
  );

  // Load Template
  const handleSelectTemplate = useCallback(
    (template: Template) => {
      setCanvasWidth(template.width);
      setCanvasHeight(template.height);
      setBackground(template.background);
      setElements(template.elements);
      setSelectedId(null);
      setProjectName(template.title);
      setTimeout(commitHistory, 10);
    },
    [commitHistory]
  );

  // Save Project locally
  const handleSaveProject = useCallback(() => {
    const proj: PhotoCraftProject = {
      id: projectId,
      version: '1.0.0',
      name: projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      width: canvasWidth,
      height: canvasHeight,
      background,
      elements,
    };
    saveProjectToStorage(proj);
    alert(`Project "${projectName}" saved to browser local storage!`);
  }, [projectId, projectName, canvasWidth, canvasHeight, background, elements]);

  // Load Project
  const handleLoadProject = useCallback(
    (proj: PhotoCraftProject) => {
      if (!proj) return;
      setProjectId(proj.id);
      setProjectName(proj.name);
      setCanvasWidth(proj.width);
      setCanvasHeight(proj.height);
      setBackground(proj.background);
      setElements(proj.elements);
      setSelectedId(null);
      setTimeout(commitHistory, 10);
    },
    [commitHistory]
  );

  const handleAddImage = useCallback(
    (src: string, name = 'Image') => {
      const newEl: CanvasElement = {
        id: `img-${Date.now()}`,
        type: 'image',
        name,
        src,
        x: Math.round(canvasWidth / 2 - 200),
        y: Math.round(canvasHeight / 2 - 200),
        width: 400,
        height: 400,
        rotation: 0,
        opacity: 100,
        isLocked: false,
        isVisible: true,
        zIndex: elements.length + 1,
      };
      handleAddElement(newEl);
    },
    [canvasWidth, canvasHeight, elements.length, handleAddElement]
  );

  const handleAddText = useCallback(
    (preset: 'heading' | 'subheading' | 'body' | 'styled', customText?: string) => {
      let fontSize = 36;
      let fontWeight = 'normal';
      let text = customText || 'Add text here';

      if (preset === 'heading') {
        fontSize = 56;
        fontWeight = 'bold';
        text = customText || 'Add a Heading';
      } else if (preset === 'subheading') {
        fontSize = 32;
        fontWeight = '600';
        text = customText || 'Add a subheading';
      } else if (preset === 'body') {
        fontSize = 20;
        fontWeight = 'normal';
        text = customText || 'Add a little bit of body text';
      } else if (preset === 'styled') {
        fontSize = 64;
        fontWeight = 'bold';
        text = customText || 'CREATIVE STUDIO';
      }

      const newEl: CanvasElement = {
        id: `text-${Date.now()}`,
        type: 'text',
        name: text.slice(0, 15),
        text,
        fontFamily: 'Inter',
        fontSize,
        fontWeight,
        color: '#ffffff',
        textAlign: 'center',
        x: Math.round(canvasWidth / 2 - 250),
        y: Math.round(canvasHeight / 2 - 40),
        width: 500,
        height: Math.round(fontSize * 1.5),
        rotation: 0,
        opacity: 100,
        isLocked: false,
        isVisible: true,
        zIndex: elements.length + 1,
      };
      handleAddElement(newEl);
    },
    [canvasWidth, canvasHeight, elements.length, handleAddElement]
  );

  const handleAddShape = useCallback(
    (type: ShapeType) => {
      const size = 180;
      const newEl: CanvasElement = {
        id: `shape-${Date.now()}`,
        type: 'shape',
        shapeType: type,
        name: type.replace('_', ' '),
        fill: '#6366f1',
        stroke: '#ffffff',
        strokeWidth: 0,
        x: Math.round(canvasWidth / 2 - size / 2),
        y: Math.round(canvasHeight / 2 - size / 2),
        width: size,
        height: type === 'line' || type === 'arrow' ? 60 : size,
        rotation: 0,
        opacity: 100,
        isLocked: false,
        isVisible: true,
        zIndex: elements.length + 1,
      };
      handleAddElement(newEl);
    },
    [canvasWidth, canvasHeight, elements.length, handleAddElement]
  );

  const handleAddSticker = useCallback(
    (svg: string, name: string) => {
      const size = 160;
      const newEl: CanvasElement = {
        id: `sticker-${Date.now()}`,
        type: 'sticker',
        name,
        svgContent: svg,
        x: Math.round(canvasWidth / 2 - size / 2),
        y: Math.round(canvasHeight / 2 - size / 2),
        width: size,
        height: size,
        rotation: 0,
        opacity: 100,
        isLocked: false,
        isVisible: true,
        zIndex: elements.length + 1,
      };
      handleAddElement(newEl);
    },
    [canvasWidth, canvasHeight, elements.length, handleAddElement]
  );

  const handleDeleteProject = useCallback((id: string) => {
    ProjectService.deleteProject(id);
    setSavedProjectsList(listSavedProjects());
  }, []);

  const handleImportProject = useCallback(
    async (file: File) => {
      try {
        const imported = await importProjectFile(file);
        handleLoadProject(imported);
        setSavedProjectsList(listSavedProjects());
      } catch (err) {
        alert('Could not import project: ' + err);
      }
    },
    [handleLoadProject]
  );

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Ctrl + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl + Y or Ctrl + Shift + Z (Redo)
      else if (
        ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ')
      ) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl + S (Save)
      else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault();
        handleSaveProject();
      }
      // Ctrl + D (Duplicate)
      else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD' && selectedId) {
        e.preventDefault();
        handleDuplicateElement(selectedId);
      }
      // Delete or Backspace
      else if ((e.code === 'Delete' || e.code === 'Backspace') && selectedId) {
        e.preventDefault();
        handleDeleteElement(selectedId);
      }
      // Escape
      else if (e.code === 'Escape') {
        setSelectedId(null);
        setDrawingMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleSaveProject,
    handleDuplicateElement,
    handleDeleteElement,
    selectedId,
  ]);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 select-none">
      {/* 1. TOP TOOLBAR */}
      <TopToolbar
        projectName={projectName}
        zoom={zoom}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        showRulers={showRulers}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        onUpdateProjectName={setProjectName}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={() => setZoom((z) => Math.min(5, Number((z + 0.1).toFixed(2))))}
        onZoomOut={() => setZoom((z) => Math.max(0.1, Number((z - 0.1).toFixed(2))))}
        onZoomChange={setZoom}
        onFitToScreen={() => setZoom(0.7)}
        onToggleRulers={() => setShowRulers((r) => !r)}
        onToggleGrid={() => setShowGrid((g) => !g)}
        onToggleSnapToGrid={() => setSnapToGrid((s) => !s)}
        onSave={handleSaveProject}
        onExport={() => setShowExportModal(true)}
        onShortcuts={() => setShowShortcutsModal(true)}
        onBackToHome={onBackToHome}
      />

      {/* 2. MAIN WORKSPACE: LEFT SIDEBAR + CENTRAL CANVAS + RIGHT PROPERTIES */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <LeftSidebar
          activeTab={sidebarTab}
          onSelectTab={setSidebarTab}
          onApplyTemplate={handleSelectTemplate}
          onAddImage={handleAddImage}
          onAddText={handleAddText}
          onAddShape={handleAddShape}
          onAddSticker={handleAddSticker}
          onSetBackground={setBackground}
          isDrawingMode={drawingMode}
          onToggleDrawingMode={(active) => setDrawingMode(active)}
          brushColor={drawColor}
          onChangeBrushColor={setDrawColor}
          brushSize={drawSize}
          onChangeBrushSize={setDrawSize}
          onOpenAITool={(tool) => setActiveAITool(tool === 'bg_remove' ? 'bg_remover' : tool)}
          projects={savedProjectsList}
          onLoadProject={handleLoadProject}
          onDeleteProject={handleDeleteProject}
          onImportProject={handleImportProject}
        />

        {/* Central Canvas Viewport */}
        <CanvasWorkspace
          width={canvasWidth}
          height={canvasHeight}
          background={background}
          elements={elements}
          selectedId={selectedId}
          zoom={zoom}
          showRulers={showRulers}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          drawingMode={drawingMode}
          drawColor={drawColor}
          drawSize={drawSize}
          onSelectElement={setSelectedId}
          onUpdateElement={handleUpdateElement}
          onAddElement={handleAddElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onCommitHistory={commitHistory}
          onZoomChange={setZoom}
        />

        {/* Right Properties Panel */}
        <PropertiesPanel
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          background={background}
          elements={elements}
          selectedId={selectedId}
          onUpdateCanvasSize={(w, h) => {
            setCanvasWidth(w);
            setCanvasHeight(h);
            commitHistory();
          }}
          onUpdateBackground={(bg) => {
            setBackground(bg);
            commitHistory();
          }}
          onUpdateElement={handleUpdateElement}
          onSelectElement={setSelectedId}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onReorderElement={handleReorderElement}
          onOpenAITool={(tool) => setActiveAITool(tool)}
          onCommitHistory={commitHistory}
        />
      </div>

      {/* 3. MODALS */}
      {/* AI Tools Modal */}
      {activeAITool && (
        <AIToolsModal
          tool={activeAITool}
          selectedElement={selectedElement}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onClose={() => setActiveAITool(null)}
          onUpdateElement={handleUpdateElement}
          onAddElement={handleAddElement}
          onUpdateBackground={setBackground}
          onCommitHistory={commitHistory}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          background={background}
          elements={elements}
          projectName={projectName}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
};

export default PhotoCraftStudio;

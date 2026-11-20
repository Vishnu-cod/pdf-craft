import React from 'react';

interface ShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Click'], action: 'Select element' },
  { keys: ['Shift', 'Click'], action: 'Select without losing focus' },
  { keys: ['Drag'], action: 'Move selected element' },
  { keys: ['Shift', 'Drag'], action: 'Constrain proportions during resize' },
  { keys: ['Delete', 'Backspace'], action: 'Delete selected element' },
  { keys: ['Ctrl', 'D'], action: 'Duplicate selected element' },
  { keys: ['Ctrl', 'Z'], action: 'Undo last change' },
  { keys: ['Ctrl', 'Y', 'or', 'Ctrl', 'Shift', 'Z'], action: 'Redo change' },
  { keys: ['Ctrl', 'S'], action: 'Save project to browser' },
  { keys: ['Space', 'Drag'], action: 'Pan around canvas' },
  { keys: ['Ctrl', 'Wheel'], action: 'Zoom in / out' },
  { keys: ['Double Click'], action: 'Edit text in-place' },
  { keys: ['Escape'], action: 'Deselect element / Cancel tool' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>⌨️ Keyboard & Mouse Shortcuts</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUTS.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs"
            >
              <span className="text-slate-300">{item.action}</span>
              <div className="flex items-center space-x-1">
                {item.keys.map((k, idx) =>
                  k === 'or' ? (
                    <span key={idx} className="text-[10px] text-slate-500 mx-1">
                      or
                    </span>
                  ) : (
                    <kbd
                      key={idx}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded font-mono text-[11px] shadow-sm"
                    >
                      {k}
                    </kbd>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

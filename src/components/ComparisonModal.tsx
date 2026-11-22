import React from 'react';

export type CompetitorId = 'ilovepdf' | 'smallpdf' | 'adobe';

export interface ComparisonModalProps {
  isOpen: boolean;
  initialCompetitor: CompetitorId;
  onClose: () => void;
  onSelectTool: (tab: any) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg">✕</button>
        <h3 className="text-xl font-bold mb-2">PDFCraft vs Cloud Competitors</h3>
        <p className="text-sm text-slate-300 mb-4">PDFCraft runs 100% locally in your web browser with zero server uploads, no file size caps, and complete privacy.</p>
        <button onClick={onClose} className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition">Continue to Free Tools</button>
      </div>
    </div>
  );
};

export default ComparisonModal;

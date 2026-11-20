import React, { useState, useEffect } from 'react';
import {
  analyzeContractRisks,
  ContractRiskReport,
  ContractRiskIssue,
} from '../utils/contractRiskRadar';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  FileText,
  UploadCloud,
  ChevronRight,
  Info,
  Scale,
  Zap,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ContractRiskRadarProps {
  initialPdfBytes?: ArrayBuffer;
  initialFileName?: string;
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
}

const SAMPLE_PREDATORY_CONTRACT = `EMPLOYMENT & PROPRIETARY RIGHTS AGREEMENT

1. INTELLECTUAL PROPERTY ASSIGNMENT
Employee hereby agrees that all inventions, discoveries, designs, works of authorship, software, and trade secrets, whether or not created during normal working hours or using personal equipment, that are developed by Employee at any time during employment shall be the sole and exclusive property of the Company. Employee irrevocably and unconditionally assigns in perpetuity all rights, title, and moral rights whatsoever to the Company worldwide.

2. NON-COMPETE & NON-SOLICITATION
During employment and for a period of 24 months following termination of employment for any reason, Employee shall not directly or indirectly engage in, perform services for, advise, or invest in any competing business operating worldwide. Furthermore, Employee agrees to a non-solicitation period of 2 years barring any contact with clients, prospective clients, or coworkers.

3. INDEMNIFICATION & LIABILITY
Employee agrees to indemnify, defend and hold harmless the Company, its directors, officers, and agents against any and all claims, damages, liabilities, losses, costs, and attorney's fees without limitation whatsoever arising from Employee's performance of services.

4. TERM & TERMINATION
The Company may terminate Employee at its sole discretion without cause immediately upon written notice. However, Employee must provide at least 90 days prior written notice. If Employee fails to complete the notice period, Employee shall forfeit all accrued salary and pay liquidated damages equal to 6 months of compensation.

5. EVERGREEN RENEWAL & ARBITRATION
This agreement shall automatically renew for successive periods of 12 months unless written notice is given at least 60 days prior to expiration. Any dispute shall be resolved solely through mandatory binding arbitration and Employee waives any right to participate in a class action.`;

export const ContractRiskRadar: React.FC<ContractRiskRadarProps> = ({
  initialPdfBytes,
  initialFileName,
  onFileLoaded,
}) => {
  const [contractText, setContractText] = useState<string>(SAMPLE_PREDATORY_CONTRACT);
  const [report, setReport] = useState<ContractRiskReport | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [docName, setDocName] = useState<string>(initialFileName || 'Sample Predatory Offer Letter.pdf');

  // Extract text if initialPdfBytes is passed
  useEffect(() => {
    if (!initialPdfBytes) {
      setReport(analyzeContractRisks(contractText));
      return;
    }

    const extractFromPdf = async () => {
      setIsExtracting(true);
      try {
        const loadingTask = pdfjsLib.getDocument({ data: initialPdfBytes.slice(0) });
        const pdfDoc = await loadingTask.promise;
        let fullText = '';
        const maxPages = Math.min(pdfDoc.numPages, 10);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((it: any) => it.str).join(' ');
          fullText += pageText + '\n\n';
        }
        if (fullText.trim().length > 100) {
          setContractText(fullText);
          setDocName(initialFileName || 'Uploaded Contract.pdf');
        }
      } catch (err) {
        console.warn('PDF text extraction error:', err);
      } finally {
        setIsExtracting(false);
      }
    };

    extractFromPdf();
  }, [initialPdfBytes, initialFileName]);

  // Re-run analysis on contract text change
  useEffect(() => {
    if (contractText.trim()) {
      setReport(analyzeContractRisks(contractText));
    }
  }, [contractText]);

  const handleCopyCounter = (issue: ContractRiskIssue) => {
    navigator.clipboard.writeText(issue.counterProposal);
    setCopiedId(issue.id);
    confetti({ particleCount: 25, spread: 40 });
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExportFullReport = () => {
    if (!report) return;
    const highRisks = report.issues.filter((i) => i.severity === 'high').length;
    let md = `# Contract Risk Radar Audit Report\n\n`;
    md += `**Document:** ${docName}\n`;
    md += `**Contract Health Score:** ${report.safetyScore}/100 (${report.grade})\n`;
    md += `**Total Words:** ${report.wordCount} | **High Severity Flags:** ${highRisks}\n\n`;
    md += `## Detected Clauses & Counter-Proposals\n\n`;
    report.issues.forEach((iss, idx) => {
      md += `### ${idx + 1}. [${iss.severity.toUpperCase()}] ${iss.title}\n`;
      md += `- **Original Clause Excerpt:** "${iss.excerpt}"\n`;
      md += `- **Plain-English Translation:** ${iss.plainEnglish}\n`;
      md += `- **Recommended Counter-Proposal:**\n> ${iss.counterProposal}\n\n`;
    });
    md += `---\n*Generated 100% client-side in browser memory by PDFCraft Contract Risk Radar. Does not constitute formal legal advice.*\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docName.replace(/\.pdf$/i, '')}_risk_audit.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocName(file.name);
    setIsExtracting(true);

    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        onFileLoaded?.(file, arrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= Math.min(pdfDoc.numPages, 15); i++) {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((it: any) => it.str).join(' ') + '\n';
        }
        setContractText(fullText);
      } else {
        const text = await file.text();
        setContractText(text);
      }
      confetti({ particleCount: 30, spread: 50 });
    } catch (err: any) {
      alert('Could not extract text: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExtracting(false);
    }
  };

  const filteredIssues = report
    ? activeCategory === 'all'
      ? report.issues
      : report.issues.filter((iss) => iss.category === activeCategory)
    : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-400', stroke: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 60) return { text: 'text-amber-400', stroke: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { text: 'text-rose-400', stroke: '#f43f5e', bg: 'bg-rose-500/10 border-rose-500/30' };
  };

  const scoreStyle = report ? getScoreColor(report.safetyScore) : getScoreColor(85);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner Guide */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/30 shrink-0">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white">AI Contract Risk & Red-Flag Radar</h2>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                  Ironclad Alternative • 100% Free
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Scan offer letters, NDAs, and agreements for IP traps, non-competes, and unlimited liability clauses in seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Upload / Reset Controls */}
        <div className="grid grid-cols-1 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <label className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer shadow-md w-full sm:w-auto">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <span>Upload Agreement</span>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setContractText(SAMPLE_PREDATORY_CONTRACT);
              setDocName('Sample Predatory Offer Letter.pdf');
              confetti({ particleCount: 20, spread: 35 });
            }}
            className="px-3.5 py-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer w-full sm:w-auto"
            title="Load sample contract to test"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Sample Agreement</span>
          </button>

          {report && (
            <button
              type="button"
              onClick={handleExportFullReport}
              className="px-3.5 py-2.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-rose-600/30 w-full sm:w-auto"
              title="Download Full Risk Audit Report as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit (.md)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Contract Text (4 cols), Right Risk Radar Dashboard (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Contract Inspector Text */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[200px]">{docName}</span>
            </span>
            <span>{report?.wordCount || 0} words</span>
          </div>

          <textarea
            rows={22}
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="Paste contract or agreement text here to audit..."
            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[11px] text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 transition resize-none shadow-inner"
          />

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Client-Side • No confidential contract data leaves your device.</span>
          </div>
        </div>

        {/* Right Column: Risk Radar Dashboard */}
        <div className="lg:col-span-8 flex flex-col space-y-5">
          {report && (
            <>
              {/* Health Score Hero Card */}
              <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center gap-6 shadow-xl ${scoreStyle.bg}`}>
                {/* Score Radial */}
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-slate-800" strokeWidth="10" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={scoreStyle.stroke}
                      strokeWidth="10"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * report.safetyScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className={`text-2xl font-black ${scoreStyle.text}`}>
                      {report.safetyScore}%
                    </span>
                    <span className="text-[9px] font-bold uppercase text-slate-400">Safety Index</span>
                  </div>
                </div>

                {/* Score Details */}
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contract Rating:</span>
                    <span className={`text-xs font-black px-3 py-0.5 rounded-full border ${scoreStyle.bg} ${scoreStyle.text}`}>
                      {report.grade}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {report.summary}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-semibold pt-1">
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {report.issues.filter((i) => i.severity === 'high').length} High Risks
                    </span>
                    <span>•</span>
                    <span className="text-amber-400">
                      {report.issues.filter((i) => i.severity === 'medium').length} Medium Risks
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: `All Flags (${report.issues.length})` },
                  { id: 'ip_grab', label: `IP Ownership (${report.categoryCounts.ip_grab || 0})` },
                  { id: 'non_compete', label: `Non-Compete (${report.categoryCounts.non_compete || 0})` },
                  { id: 'unlimited_liability', label: `Liability (${report.categoryCounts.unlimited_liability || 0})` },
                  { id: 'one_sided_termination', label: `Termination (${report.categoryCounts.one_sided_termination || 0})` },
                  { id: 'auto_renewal', label: `Auto-Renewal (${report.categoryCounts.auto_renewal || 0})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
                      activeCategory === tab.id
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Issue Cards */}
              <div className="space-y-4">
                {filteredIssues.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-2">
                    <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">No Flagged Clauses in this Category</h4>
                    <p className="text-xs text-slate-400">
                      This category did not trigger any known predatory keywords or high-liability traps.
                    </p>
                  </div>
                ) : (
                  filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3.5 shadow-md"
                    >
                      {/* Issue Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              issue.severity === 'high'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : issue.severity === 'medium'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-700 text-slate-300 border-slate-600'
                            }`}
                          >
                            {issue.severity} Risk
                          </span>
                          <h4 className="text-xs font-bold text-white">{issue.title}</h4>
                        </div>
                      </div>

                      {/* Excerpt */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-300 font-mono italic leading-relaxed border-l-4 border-l-rose-500">
                        "{issue.excerpt}"
                      </div>

                      {/* Plain English Translation */}
                      <div className="text-xs space-y-1">
                        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
                          <Info className="w-3.5 h-3.5" />
                          <span>Plain-English Translation:</span>
                        </span>
                        <p className="text-slate-300 leading-relaxed">{issue.plainEnglish}</p>
                      </div>

                      {/* Counter Proposal Shield */}
                      <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Recommended Counter-Clause (Copy to Negotiate):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCounter(issue)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedId === issue.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-300" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Counter-Clause</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-indigo-100 font-mono leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-indigo-500/20">
                          {issue.counterProposal}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Legal Notice & Technical Methodology */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Scale className="w-4 h-4 text-indigo-400" />
                  <span>Legal Disclaimer &amp; Technical Methodology</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  <strong>Deterministic Heuristics:</strong> Analysis runs 100% in local browser memory using statutory clause matching, identifying unbounded liability, IP forfeiture overreach, non-compete durations, and one-sided termination penalties without sending contract text to any remote server.
                </p>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  <strong>Notice:</strong> This automated utility provides heuristic pattern flags and educational drafting suggestions only. It does not constitute formal legal counsel, representation, or an attorney-client relationship. Review critical contracts with a qualified attorney in your jurisdiction.
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

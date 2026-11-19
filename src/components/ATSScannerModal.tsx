import React, { useState, useEffect } from 'react';
import { ResumeData } from '../types';
import { analyzeATS, ATSReport } from '../utils/atsScanner';
import {
  X,
  Target,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Sparkles,
  Zap,
  TrendingUp,
  FileCheck,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ATSScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  onAddSkill: (skill: string) => void;
}

const SAMPLE_JOB_DESCRIPTION = `Job Title: Senior SEO & Digital Marketing Specialist
Location: Remote / Hybrid
About the Role:
We are seeking a results-driven SEO & Digital Marketing Specialist to lead organic search acquisition, technical audits, and content optimization.

Key Responsibilities:
- Conduct comprehensive keyword research, search intent clustering, and competitor analysis using Semrush, Ahrefs, and Google Search Console.
- Execute technical SEO audits focusing on site crawlability, indexation, Core Web Vitals, page speed, mobile usability, and XML sitemaps.
- Analyze traffic, user journeys, and conversion funnels using Google Analytics 4 (GA4) and Google Tag Manager (GTM).
- Collaborate with content writers to optimize on-page SEO, title tags, meta descriptions, internal linking, and header hierarchies.
- Manage paid media fundamentals across Google Ads and Meta Ads campaigns.
- Provide monthly performance dashboards, ROI reports, and conversion rate optimization (CRO) insights.

Requirements:
- Proven experience in SEO, digital marketing, on-page optimization, and backlink strategies.
- Proficiency in tools: Google Analytics 4 (GA4), Search Console, Screaming Frog, Semrush, Canva, and Excel.
- Strong analytical skills with track record of increasing organic traffic and lead generation.`;

export const ATSScannerModal: React.FC<ATSScannerModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  onAddSkill,
}) => {
  const [jobDescription, setJobDescription] = useState<string>(SAMPLE_JOB_DESCRIPTION);
  const [report, setReport] = useState<ATSReport | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());

  // Run analysis whenever resumeData or jobDescription changes
  useEffect(() => {
    if (jobDescription.trim()) {
      const result = analyzeATS(resumeData, jobDescription);
      setReport(result);
    }
  }, [resumeData, jobDescription]);

  if (!isOpen) return null;

  const handleAddKeyword = (kw: string) => {
    onAddSkill(kw);
    setRecentlyAdded((prev) => new Set(prev).add(kw));
    confetti({ particleCount: 25, spread: 40 });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-400', stroke: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 65) return { text: 'text-amber-400', stroke: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { text: 'text-rose-400', stroke: '#f43f5e', bg: 'bg-rose-500/10 border-rose-500/30' };
  };

  const scoreStyle = report ? getScoreColor(report.overallScore) : getScoreColor(85);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/80 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">ATS Resume Scanner & Matcher</h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                  Jobscan Alt • Free
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Paste any job posting to calculate match rate, uncover missing recruiter keywords, and inject them with 1 click.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Job Description Input (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Job Description</span>
              </label>
              <button
                type="button"
                onClick={() => setJobDescription(SAMPLE_JOB_DESCRIPTION)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Sample JD</span>
              </button>
            </div>

            <textarea
              rows={18}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description from LinkedIn, Indeed, Naukri, or company careers page..."
              className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed focus:outline-none focus:border-indigo-500 transition resize-none font-mono"
            />

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Audits against candidate: <strong className="text-white">{resumeData.fullName || 'Active Resume'}</strong>
              </span>
            </div>
          </div>

          {/* Right Column: Live ATS Dashboard (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-5 overflow-y-auto">
            {report && (
              <>
                {/* Score Hero Card */}
                <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-center gap-6 ${scoreStyle.bg}`}>
                  {/* Gauge */}
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-slate-800"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={scoreStyle.stroke}
                        strokeWidth="10"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * report.overallScore) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-2xl font-black ${scoreStyle.text}`}>
                        {report.overallScore}%
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">ATS Match</span>
                    </div>
                  </div>

                  {/* Summary & Grade */}
                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Grade:</span>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${scoreStyle.bg} ${scoreStyle.text} border`}>
                        {report.grade}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {report.summary}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-400 justify-center sm:justify-start">
                      <span>Keywords: <strong className="text-white">{report.keywordMatchRate}%</strong></span>
                      <span>•</span>
                      <span>Action Verbs: <strong className="text-white">{report.actionVerbScore}%</strong></span>
                      <span>•</span>
                      <span>Structure: <strong className="text-white">{report.readabilityScore}%</strong></span>
                    </div>
                  </div>
                </div>

                {/* Missing Recruiter Keywords (The High Impact Tool) */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Missing Recruiter Keywords ({report.missingKeywords.length})</span>
                    </h4>
                    <span className="text-[10px] text-slate-500">Click to add directly into your resume</span>
                  </div>

                  {report.missingKeywords.length === 0 ? (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5 py-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Incredible! You have covered all major high-frequency job keywords.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
                      {report.missingKeywords.map((kw, i) => {
                        const isAdded = recentlyAdded.has(kw);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleAddKeyword(kw)}
                            disabled={isAdded}
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default'
                                : 'bg-slate-900 hover:bg-indigo-900/40 text-slate-200 border-slate-700/80 hover:border-indigo-500/50'
                            }`}
                          >
                            <span>{kw}</span>
                            {isAdded ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Plus className="w-3 h-3 text-indigo-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Matched Keywords */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Matched Keywords Found on Your Resume ({report.matchedKeywords.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {report.matchedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recruiter Readiness Checklist */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Recruiter & ATS Formatting Checklist</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { ok: report.checklist.hasContactInfo, label: 'Email & Phone Number Included' },
                      { ok: report.checklist.hasClearHeadline, label: 'Prominent Target Headline' },
                      { ok: report.checklist.hasSummary, label: 'Career Summary Paragraph' },
                      { ok: report.checklist.hasMeasurableMetrics, label: 'Quantifiable Metrics (%, Numbers)' },
                      { ok: report.checklist.hasEducation, label: 'Formal Education / Certifications' },
                      { ok: report.checklist.hasSkillsSection, label: 'Key Competencies Section' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-xl border ${
                          item.ok
                            ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                        }`}
                      >
                        {item.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="text-[11px] font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            All analysis is performed 100% locally in your browser with zero data sent to external servers.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ResumeData, ResumeTemplate, ResumeColor } from '../types';
import { Printer, Sparkles, ArrowLeft, RefreshCw, Building, User, Briefcase } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CoverLetterViewProps {
  resumeData: ResumeData;
  template: ResumeTemplate;
  color: ResumeColor;
  currentTheme: {
    primary: string;
    bgPrimary: string;
    borderPrimary: string;
    pillBg: string;
    hex: string;
  };
  onBackToResume: () => void;
}

export const CoverLetterView: React.FC<CoverLetterViewProps> = ({
  resumeData,
  template,
  currentTheme,
  onBackToResume,
}) => {
  const [companyName, setCompanyName] = useState('Zoho Corporation');
  const [recipientName, setRecipientName] = useState('Hiring Team');
  const [targetRole, setTargetRole] = useState(
    resumeData.jobTitle ? resumeData.jobTitle.split('|')[0].trim() : 'Digital Marketing & SEO Specialist'
  );
  const [companyLocation, setCompanyLocation] = useState('Chennai / Remote');
  const [todayDate, setTodayDate] = useState(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  });

  // Letter Body Paragraphs
  const [salutation, setSalutation] = useState('');
  const [opening, setOpening] = useState('');
  const [body1, setBody1] = useState('');
  const [body2, setBody2] = useState('');
  const [closing, setClosing] = useState('');

  // Regenerate content based on candidate's real data
  const generateLetterContent = () => {
    const roleName = targetRole || 'the open position';
    const comp = companyName || 'your organization';

    setSalutation(`Dear ${recipientName || 'Hiring Team'},`);

    setOpening(
      `I am writing to express my strong enthusiasm for the ${roleName} opportunity at ${comp}. With a robust background combining business development, client engagement, and hands-on SEO and digital marketing execution, I am excited to contribute to ${comp}'s organic acquisition and growth initiatives.`
    );

    // Extract real experience snippets
    const topExp = resumeData.experiences[0];
    const expText = topExp
      ? `During my tenure as ${topExp.role} at ${topExp.company}, I drove measurable outcomes, handled high-priority deliverables, and supported strategic conversion pipelines. Additionally, my hands-on portfolio practice includes in-depth GA4 traffic analysis, competitor keyword research, and technical website audits.`
      : `Throughout my professional career, I have consistently focused on data-driven execution, cross-functional collaboration, and delivering tangible performance improvements.`;

    setBody1(expText);

    // Extract skills snippet
    const skillsList = resumeData.skills.slice(0, 5).join(', ');
    setBody2(
      `I bring practical proficiency across essential industry tools and methodologies, including ${skillsList || 'SEO audits, analytics, and content optimization'}. What excites me most about ${comp} is your commitment to excellence, and I am eager to apply my problem-solving mindset and analytical capabilities to help drive continuous value.`
    );

    setClosing(
      `Thank you for your time and consideration. I welcome the opportunity to discuss how my skill set and proactive work ethic align with the goals of ${comp}. I look forward to speaking with you.`
    );
  };

  useEffect(() => {
    generateLetterContent();
  }, [companyName, recipientName, targetRole]);

  const handlePrint = () => {
    confetti({ particleCount: 70, spread: 60 });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={onBackToResume}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Resume</span>
          </button>

          <span className="text-[11px] sm:text-xs text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Matching Cover Letter</span>
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer w-full sm:w-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Download / Print Cover Letter</span>
        </button>
      </div>

      {/* Target Company Quick-Customizer Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-indigo-400" />
            <span>Company Name</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Role</span>
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recipient / Recruiter</span>
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Company Location</label>
          <input
            type="text"
            value={companyLocation}
            onChange={(e) => setCompanyLocation(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Printable Cover Letter Canvas */}
      <div className="w-full overflow-x-auto sm:overflow-visible flex justify-center pb-16">
        <div
          id="printable-cover-letter"
          className={`w-full max-w-3xl bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-200 p-4 sm:p-8 md:p-12 transition-all space-y-6 ${
            template === 'classic' ? 'font-serif' : 'font-sans'
          }`}
          style={{ minHeight: '1050px' }}
        >
          {/* Matching Header */}
          <div className={`pb-5 border-b-2 ${currentTheme.borderPrimary}`}>
            <h1
              className={`text-3xl font-black tracking-tight ${
                template === 'classic' ? 'text-center font-bold tracking-wide uppercase' : ''
              } ${currentTheme.primary}`}
            >
              {resumeData.fullName || 'Candidate Name'}
            </h1>
            <p
              className={`text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider ${
                template === 'classic' ? 'text-center italic font-sans' : ''
              }`}
            >
              {resumeData.jobTitle || 'Professional Title'}
            </p>

            <div
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-3 font-medium ${
                template === 'classic' ? 'justify-center font-sans' : ''
              }`}
            >
              <span>{resumeData.email}</span>
              <span>•</span>
              <span>{resumeData.phone}</span>
              <span>•</span>
              <span>{resumeData.location}</span>
              {resumeData.website && (
                <>
                  <span>•</span>
                  <span>{resumeData.website}</span>
                </>
              )}
            </div>
          </div>

          {/* Date & Recruiter Address Block */}
          <div className="text-xs text-slate-700 space-y-1 pt-2">
            <p className="font-semibold text-slate-500">{todayDate}</p>
            <div className="pt-2">
              <p className="font-bold text-slate-900">{recipientName}</p>
              <p className="font-semibold text-slate-700">{companyName}</p>
              <p className="text-slate-500">{companyLocation}</p>
            </div>
          </div>

          {/* Salutation */}
          <div className="pt-2">
            <input
              type="text"
              value={salutation}
              onChange={(e) => setSalutation(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent hover:bg-slate-50 rounded px-1 outline-none w-full"
            />
          </div>

          {/* Letter Body Paragraphs - Direct Click-to-Edit */}
          <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
            <textarea
              rows={3}
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              className="w-full bg-transparent hover:bg-slate-50 rounded p-1 outline-none resize-none leading-relaxed"
            />
            <textarea
              rows={4}
              value={body1}
              onChange={(e) => setBody1(e.target.value)}
              className="w-full bg-transparent hover:bg-slate-50 rounded p-1 outline-none resize-none leading-relaxed"
            />
            <textarea
              rows={3}
              value={body2}
              onChange={(e) => setBody2(e.target.value)}
              className="w-full bg-transparent hover:bg-slate-50 rounded p-1 outline-none resize-none leading-relaxed"
            />
            <textarea
              rows={3}
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              className="w-full bg-transparent hover:bg-slate-50 rounded p-1 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Sign-off */}
          <div className="pt-6 text-xs text-slate-900 space-y-3">
            <p>Sincerely,</p>
            <div className="pt-2">
              <p className="font-bold text-sm">{resumeData.fullName || 'Candidate Name'}</p>
              <p className="text-slate-500">{resumeData.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

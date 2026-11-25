import React, { useState, useRef, useEffect } from 'react';
import {
  ResumeData,
  ResumeTemplate,
  ResumeColor,
} from '../types';
import { RESUME_PRESETS } from '../utils/resumePresets';
import { parseResumeFile } from '../utils/resumeParser';
import { generateQRCodeSVG } from '../utils/qrGenerator';
import { ResumeReviewDrawer } from './ResumeReviewDrawer';
import { ATSScannerModal } from './ATSScannerModal';
import { CoverLetterView } from './CoverLetterView';
import { HeadshotModal } from './HeadshotModal';
import {
  Sparkles,
  LayoutTemplate,
  Palette,
  Plus,
  Trash2,
  Check,
  Briefcase,
  Printer,
  UploadCloud,
  Loader2,
  Edit3,
  Target,
  Mail,
  QrCode,
  Camera,
  RotateCcw,
  Phone,
  MapPin,
  Globe,
  Sliders,
  X,
  User,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * Auto-expanding textarea that automatically sizes to its exact text height
 * with safety buffer so ANY text length or letter descenders (g, j, p, q, y)
 * are 100% visible without clipping, truncation, or scrollbars!
 */
interface AutoTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

const AutoTextArea: React.FC<AutoTextAreaProps> = ({ value = '', className = '', ...props }) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      // +4px safety buffer ensures descenders (g, j, p, q, y) never get clipped
      ref.current.style.height = `${Math.max(ref.current.scrollHeight + 4, 24)}px`;
    }
  };

  useEffect(() => {
    resize();
    const frame = requestAnimationFrame(resize);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      className={`resize-none overflow-hidden outline-none bg-transparent transition-colors leading-relaxed pb-1 block ${className}`}
      {...props}
    />
  );
};

/**
 * Auto-width inline input that dynamically matches its exact text character length
 * so long emails, URLs, phones, or locations are NEVER clipped or truncated!
 */
interface AutoWidthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

const AutoWidthInput: React.FC<AutoWidthInputProps> = ({
  value = '',
  className = '',
  placeholder = '',
  style = {},
  ...props
}) => {
  const length = Math.max((value || '').length, (placeholder || '').length, 3);
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      style={{
        width: `${length + 2}ch`,
        maxWidth: '100%',
        ...style,
      }}
      className={`outline-none bg-transparent hover:bg-slate-100 rounded px-1.5 py-0.5 transition-all max-w-full ${className}`}
      {...props}
    />
  );
};

export const ResumeBuilder: React.FC = () => {
  // Initialize resume data: check localStorage first so user work is never lost!
  const [data, setData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('pdfcraft_user_resume');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...RESUME_PRESETS.marketing,
          ...parsed,
          experiences: Array.isArray(parsed?.experiences) ? parsed.experiences : RESUME_PRESETS.marketing.experiences,
          education: Array.isArray(parsed?.education) ? parsed.education : RESUME_PRESETS.marketing.education,
          skills: Array.isArray(parsed?.skills) ? parsed.skills : RESUME_PRESETS.marketing.skills,
        };
      }
    } catch {}
    return RESUME_PRESETS.marketing;
  });

  const [savedUserResume, setSavedUserResume] = useState<ResumeData | null>(() => {
    try {
      const saved = localStorage.getItem('pdfcraft_user_resume');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [isUserResumeActive, setIsUserResumeActive] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('pdfcraft_user_resume');
    } catch {
      return false;
    }
  });

  const [template, setTemplate] = useState<ResumeTemplate>('modern');
  const [color, setColor] = useState<ResumeColor>('indigo');
  const [isCompact, setIsCompact] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [activeAccordion, setActiveAccordion] = useState<'personal' | 'experience' | 'education' | 'skills' | 'styles'>('personal');
  const [newSkillText, setNewSkillText] = useState('');
  const [mobileViewMode, setMobileViewMode] = useState<'fit' | 'a4'>('fit');
  const [activeMobileDrawer, setActiveMobileDrawer] = useState<'styles' | 'demos' | 'options' | null>(null);
  const [activeRole, setActiveRole] = useState<string>(() => {
    try {
      return localStorage.getItem('pdfcraft_user_resume') ? 'user_custom' : 'marketing';
    } catch {
      return 'marketing';
    }
  });

  // Modal & Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<ResumeData>(data);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Pro Feature States (ATS, Cover Letter, Headshot)
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [isCoverLetterMode, setIsCoverLetterMode] = useState(false);
  const [isHeadshotModalOpen, setIsHeadshotModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resumeRef = useRef<HTMLDivElement | null>(null);

  // File Upload & PDF Extraction Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setNotification('Extracting text and structure in browser memory (100% private)...');

    try {
      const { data: extracted, message } = await parseResumeFile(file);
      setDrawerData(extracted);
      setUploadedFileName(file.name);
      setIsDrawerOpen(true);
      setNotification(`✅ ${message} - Please review and confirm in the drawer.`);
      confetti({ particleCount: 35, spread: 50 });
    } catch (err: any) {
      alert(err.message || 'Could not parse resume file. Please ensure it is a valid PDF or DOCX.');
      setNotification(null);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Commit data from Review Drawer
  const handleApplyDrawerData = (confirmed: ResumeData) => {
    setData(confirmed);
    setSavedUserResume(confirmed);
    setIsUserResumeActive(true);
    setActiveRole('user_custom');
    try {
      localStorage.setItem('pdfcraft_user_resume', JSON.stringify(confirmed));
    } catch {}
    confetti({ particleCount: 80, spread: 70 });
    setNotification(
      `🎉 "${confirmed.fullName || 'My Resume'}" applied to all 3 templates! Switch between Modern, Executive, and Classic to compare.`
    );
  };

  // Switch to demo preset (non-destructive)
  const handleSelectPreset = (key: string) => {
    if (RESUME_PRESETS[key]) {
      setData({ ...RESUME_PRESETS[key] });
      setActiveRole(key);
      setIsUserResumeActive(false);
      confetti({ particleCount: 30, spread: 45 });
    }
  };

  // Switch back to saved user resume
  const handleRestoreUserResume = () => {
    if (savedUserResume) {
      setData({ ...savedUserResume });
      setIsUserResumeActive(true);
      setActiveRole('user_custom');
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  // Field updater
  const updateField = (field: keyof ResumeData, value: any) => {
    setData((prev) => {
      const updated = { ...prev, [field]: value };
      if (isUserResumeActive) {
        setSavedUserResume(updated);
        try {
          localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // 1-Click Skill Injection (from ATS Modal)
  const handleAddSkillFromAts = (skill: string) => {
    if (!data.skills.includes(skill)) {
      setData((prev) => {
        const updated = { ...prev, skills: [skill, ...prev.skills] };
        if (isUserResumeActive) {
          setSavedUserResume(updated);
          try {
            localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    }
  };

  // Experience handlers
  const updateExperience = (index: number, field: string, value: string) => {
    setData((prev) => {
      const copy = [...prev.experiences];
      copy[index] = { ...copy[index], [field]: value };
      const updated = { ...prev, experiences: copy };
      if (isUserResumeActive) {
        setSavedUserResume(updated);
        try {
          localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const addExperience = () => {
    setData((prev) => {
      const updated = {
        ...prev,
        experiences: [
          ...prev.experiences,
          {
            id: 'exp_' + Date.now(),
            role: 'New Role / Position',
            company: 'Company / Organization',
            duration: '2023 - Present',
            description: '• Delivered key responsibilities and achieved measurable organizational targets.',
          },
        ],
      };
      if (isUserResumeActive) {
        setSavedUserResume(updated);
        try {
          localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const removeExperience = (index: number) => {
    setData((prev) => {
      const updated = {
        ...prev,
        experiences: prev.experiences.filter((_, i) => i !== index),
      };
      if (isUserResumeActive) {
        setSavedUserResume(updated);
        try {
          localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // Education handlers
  const updateEducation = (index: number, field: string, value: string) => {
    setData((prev) => {
      const copy = [...prev.education];
      copy[index] = { ...copy[index], [field]: value };
      const updated = { ...prev, education: copy };
      if (isUserResumeActive) {
        setSavedUserResume(updated);
        try {
          localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const addEducation = () => {
    setData((prev) => {
      const updated = {
        ...prev,
        education: [
          ...prev.education,
          {
            id: 'edu_' + Date.now(),
            degree: 'Degree / Certificate',
            school: 'University / Institution',
            year: '2020 - 2024',
          },
        ],
      };
      if (isUserResumeActive) {
        setSavedUserResume(updated);
        try {
          localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const removeEducation = (index: number) => {
    setData((prev) => {
      const updated = {
        ...prev,
        education: prev.education.filter((_, i) => i !== index),
      };
      if (isUserResumeActive) {
        setSavedUserResume(updated);
        try {
          localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // Skill handlers
  const handleAddSkillCustom = (skillName?: string) => {
    const toAdd = (skillName || newSkillText).trim();
    if (toAdd && !data.skills.includes(toAdd)) {
      setData((prev) => {
        const updated = { ...prev, skills: [...prev.skills, toAdd] };
        if (isUserResumeActive) {
          setSavedUserResume(updated);
          try {
            localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      setNewSkillText('');
      confetti({ particleCount: 15, spread: 35 });
    }
  };

  const addSkill = () => {
    const newSkill = prompt('Enter new skill (e.g., GA4, Technical SEO, Python):');
    if (newSkill && newSkill.trim()) {
      setData((prev) => {
        const updated = { ...prev, skills: [...prev.skills, newSkill.trim()] };
        if (isUserResumeActive) {
          setSavedUserResume(updated);
          try {
            localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    }
  };

  const removeSkill = (index: number) => {
    setData((prev) => {
      const updated = {
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index),
      };
      if (isUserResumeActive) {
        setSavedUserResume(updated);
        try {
          localStorage.setItem('pdfcraft_user_resume', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // Color config mappings
  const colorThemes = {
    indigo: {
      primary: 'text-indigo-600',
      bgPrimary: 'bg-indigo-600',
      borderPrimary: 'border-indigo-600',
      pillBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      hex: '#4f46e5',
    },
    navy: {
      primary: 'text-sky-900',
      bgPrimary: 'bg-sky-900',
      borderPrimary: 'border-sky-900',
      pillBg: 'bg-sky-50 text-sky-800 border-sky-200',
      hex: '#0c4a6e',
    },
    slate: {
      primary: 'text-slate-900',
      bgPrimary: 'bg-slate-900',
      borderPrimary: 'border-slate-900',
      pillBg: 'bg-slate-100 text-slate-800 border-slate-300',
      hex: '#0f172a',
    },
    emerald: {
      primary: 'text-emerald-700',
      bgPrimary: 'bg-emerald-700',
      borderPrimary: 'border-emerald-700',
      pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      hex: '#047857',
    },
    burgundy: {
      primary: 'text-rose-900',
      bgPrimary: 'bg-rose-900',
      borderPrimary: 'border-rose-900',
      pillBg: 'bg-rose-50 text-rose-800 border-rose-200',
      hex: '#881337',
    },
  };

  const currentTheme = colorThemes[color] || colorThemes.indigo;

  // Print & Vector PDF Export
  const handlePrintToPDF = () => {
    confetti({ particleCount: 70, spread: 60 });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10 w-full">
      {/* Top Studio Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pb-6 border-b border-line mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="hud-label text-app-ink">VECTOR ATS ENGINE · ZERO PAYWALL</span>
            <span className="hud-label text-[10px] border border-line px-2 py-0.5 text-ink-strong">
              100% FREE · ATS READY
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl tracking-[-0.03em] text-ink-strong flex items-center gap-2.5">
            <span>60-Second Resume <span className="text-app-ink">Studio</span>.</span>
          </h2>
          <p className="font-sans text-xs sm:text-sm text-muted mt-1.5 max-w-2xl leading-relaxed hidden sm:block">
            Edit directly on the A4 canvas. Import PDFs locally, scan missing job ATS keywords, sync cover letters, and export vector PDFs.
          </p>
        </div>

        {/* Crisp Rectangular Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="h-11 px-4 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            title="Upload old resume to auto-populate all templates"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-app-ink animate-spin" />
                <span className="truncate">Parsing...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5 text-app-ink" />
                <span className="truncate">Import PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrintToPDF}
            className="h-11 px-5 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="truncate">Export Vector PDF</span>
          </button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div className="mb-6 p-4 border border-app bg-bg-raised text-ink-strong text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-app-ink shrink-0" />
            <span className="font-sans">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-muted hover:text-ink-strong font-mono text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Desktop Architectural Control Grid */}
      <div className="hidden sm:block border border-line bg-bg-raised mb-8">
        {/* Row 1: Imported Profile & Starter Role Presets */}
        <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-line">
          <div className="flex items-center gap-2 flex-wrap">
            {savedUserResume && (
              <div className="flex items-center border border-line-strong bg-bg">
                <button
                  onClick={handleRestoreUserResume}
                  className={`h-9 px-3 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isUserResumeActive
                      ? 'bg-invert-bg text-invert-fg'
                      : 'text-ink-strong hover:bg-bg-sunken'
                  }`}
                  title="Switch back to your imported resume"
                >
                  <Sparkles className="w-3.5 h-3.5 text-app-ink" />
                  <span className="truncate max-w-[140px]">{savedUserResume.fullName || 'My Resume'}</span>
                  {isUserResumeActive && <Check className="w-3 h-3 text-app-ink shrink-0" />}
                </button>
                <button
                  onClick={() => {
                    setDrawerData(savedUserResume);
                    setIsDrawerOpen(true);
                  }}
                  className="h-9 px-3 border-l border-line font-mono text-[10px] font-bold uppercase tracking-wider text-muted hover:text-ink-strong hover:bg-bg-sunken transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  title="Open Review Drawer to inspect or tweak your details"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Review Data</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
            <span className="hud-label text-muted flex items-center gap-1.5 shrink-0">
              <Briefcase className="w-3.5 h-3.5 text-app-ink" />
              <span>{savedUserResume ? 'Demos:' : 'Starter Roles:'}</span>
            </span>
            <div className="flex gap-px bg-line border border-line shrink-0">
              {[
                { id: 'marketing', label: 'Marketing Lead' },
                { id: 'engineer', label: 'Software Engineer' },
                { id: 'sales', label: 'Enterprise Sales' },
                { id: 'fresher', label: 'Recent Graduate' },
              ].map((p) => {
                const isSelected = activeRole === p.id && !isUserResumeActive;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    className={`h-9 px-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-invert-bg text-invert-fg'
                        : 'bg-bg text-muted hover:text-ink-strong hover:bg-bg-sunken'
                    }`}
                    title={`Preview ${p.label} sample data`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Super-Tools & Style Bar */}
        <div className="p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Pro Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full xl:w-auto">
            {/* ATS Matcher */}
            <button
              onClick={() => setIsAtsModalOpen(true)}
              className="h-9 px-3.5 bg-bg border border-line-strong hover:border-app-ink text-ink-strong font-mono text-[10px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="Scan resume against target Job Description for ATS match % and missing keywords"
            >
              <Target className="w-3.5 h-3.5 text-app-ink shrink-0" />
              <span>ATS Matcher</span>
              <span className="text-[9px] text-app-ink border border-line px-1 hidden sm:inline">
                AI
              </span>
            </button>

            {/* Cover Letter Toggle */}
            <button
              onClick={() => setIsCoverLetterMode(!isCoverLetterMode)}
              className={`h-9 px-3.5 border font-mono text-[10px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isCoverLetterMode
                  ? 'bg-invert-bg text-invert-fg border-invert-bg'
                  : 'bg-bg border-line-strong hover:border-ink-strong text-ink-strong'
              }`}
              title="Switch between Resume and Matching Cover Letter"
            >
              <Mail className={`w-3.5 h-3.5 shrink-0 ${isCoverLetterMode ? 'text-app' : 'text-app-ink'}`} />
              <span>{isCoverLetterMode ? 'View Resume' : 'Cover Letter'}</span>
              <span className="text-[9px] border border-line px-1 opacity-80 hidden sm:inline">
                SYNCED
              </span>
            </button>

            {/* QR Code Toggle */}
            <button
              onClick={() => {
                const next = !data.qrCodeEnabled;
                updateField('qrCodeEnabled', next);
                confetti({ particleCount: 20, spread: 35 });
              }}
              className={`h-9 px-3.5 border font-mono text-[10px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                data.qrCodeEnabled
                  ? 'bg-invert-bg text-invert-fg border-invert-bg'
                  : 'bg-bg border-line-strong hover:border-ink-strong text-ink-strong'
              }`}
              title="Toggle Portfolio / LinkedIn QR Code"
            >
              <QrCode className="w-3.5 h-3.5 shrink-0 text-app-ink" />
              <span>Portfolio QR:</span>
              <span className="font-mono font-bold">
                {data.qrCodeEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Headshot Styler */}
            <button
              onClick={() => setIsHeadshotModalOpen(true)}
              className={`h-9 px-3.5 border font-mono text-[10px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                data.photoUrl
                  ? 'bg-invert-bg text-invert-fg border-invert-bg'
                  : 'bg-bg border-line-strong hover:border-ink-strong text-ink-strong'
              }`}
              title="Upload or style profile photo"
            >
              <Camera className="w-3.5 h-3.5 shrink-0 text-app-ink" />
              <span>{data.photoUrl ? 'Edit Photo' : '+ Photo'}</span>
            </button>
          </div>

          {/* Template & Accent Swatches */}
          <div className="flex items-center justify-between sm:justify-start gap-4 flex-wrap pt-3 xl:pt-0 border-t border-line xl:border-t-0">
            {/* Template Picker */}
            <div className="flex items-center gap-2">
              <span className="hud-label text-muted hidden sm:flex items-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5 text-app-ink" />
                <span>Layout:</span>
              </span>
              <div className="flex gap-px bg-line border border-line">
                {(['modern', 'executive', 'classic'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`h-9 px-3 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      template === t
                        ? 'bg-invert-bg text-invert-fg'
                        : 'bg-bg text-muted hover:text-ink-strong'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Color Swatches */}
            <div className="flex items-center gap-2">
              <span className="hud-label text-muted hidden sm:flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-app-ink" />
                <span>Ink:</span>
              </span>
              <div className="flex gap-1.5">
                {(['indigo', 'navy', 'slate', 'emerald', 'burgundy'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      color === c ? 'border-app scale-110 ring-1 ring-ink-strong' : 'border-line'
                    }`}
                    style={{ backgroundColor: colorThemes[c].hex }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Auto-Fit Toggle */}
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`h-9 px-3.5 border font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                isCompact
                  ? 'bg-invert-bg border-invert-bg text-invert-fg'
                  : 'bg-bg border-line-strong text-ink-strong hover:bg-bg-sunken'
              }`}
            >
              {isCompact ? '✓ 1-Page Fit' : 'Compact 1-Page'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Cover Letter Mode OR Resume Canvas */}
      {isCoverLetterMode ? (
        <CoverLetterView
          resumeData={data}
          template={template}
          color={color}
          currentTheme={currentTheme}
          onBackToResume={() => setIsCoverLetterMode(false)}
        />
      ) : (
        /* Main Resume Canvas Workspace (Printable & Direct Click-to-Edit) */
        <div className="w-full">
          {/* Mobile Top Segmented Mode Switcher: Card Editor vs A4 Preview */}
          <div className="flex sm:hidden items-center justify-between bg-slate-900 border border-slate-800 p-1.5 rounded-2xl mb-4 shadow-lg">
            <button
              onClick={() => setMobileTab('editor')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'editor'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>📝 Card Editor</span>
            </button>
            <button
              onClick={() => {
                setMobileTab('preview');
                confetti({ particleCount: 25, spread: 45 });
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'preview'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>📄 A4 PDF Preview</span>
            </button>
          </div>

          {/* MOBILE NATIVE CARD EDITOR (Thumb-friendly cards, zero horizontal scroll, native typing!) */}
          {mobileTab === 'editor' && (
            <div className="sm:hidden space-y-3 pb-36">
              {/* Accordion 1: Personal Information */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === 'personal' ? ('' as any) : 'personal')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-slate-850 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Personal Information</h3>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {data.fullName || 'Name'} • {data.jobTitle || 'Role'}
                      </p>
                    </div>
                  </div>
                  {activeAccordion === 'personal' ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {activeAccordion === 'personal' && (
                  <div className="p-4 pt-1 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={data.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Target Job Title / Headline</label>
                      <input
                        type="text"
                        value={data.jobTitle}
                        onChange={(e) => updateField('jobTitle', e.target.value)}
                        placeholder="e.g. Senior Product Marketing Specialist"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={data.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="alex@example.com"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={data.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder="+1 (555) 019-2834"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Location</label>
                        <input
                          type="text"
                          value={data.location}
                          onChange={(e) => updateField('location', e.target.value)}
                          placeholder="San Francisco, CA"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Portfolio / LinkedIn</label>
                        <input
                          type="text"
                          value={data.website || ''}
                          onChange={(e) => updateField('website', e.target.value)}
                          placeholder="alexmorgan.dev"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Professional Executive Summary</label>
                      <textarea
                        value={data.summary}
                        onChange={(e) => updateField('summary', e.target.value)}
                        rows={4}
                        placeholder="Brief summary of your background, career achievements, and impact..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs leading-relaxed outline-none focus:border-indigo-500 resize-none font-sans"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Work Experience */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === 'experience' ? ('' as any) : 'experience')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-slate-850 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Work Experience</h3>
                      <p className="text-[11px] text-slate-400">{data.experiences.length} positions recorded</p>
                    </div>
                  </div>
                  {activeAccordion === 'experience' ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {activeAccordion === 'experience' && (
                  <div className="p-4 pt-1 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-150">
                    {data.experiences.map((exp, idx) => (
                      <div key={exp.id || idx} className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-2.5 relative">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-700/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Position #{idx + 1}</span>
                          <button
                            onClick={() => removeExperience(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/40 cursor-pointer"
                            title="Remove Position"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Role Title</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                            placeholder="e.g. Growth Marketing Lead"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Company</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                              placeholder="e.g. Acme Corp"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Duration</label>
                            <input
                              type="text"
                              value={exp.duration}
                              onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                              placeholder="e.g. 2021 - Present"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Achievements & Bullet Points</label>
                          <textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                            rows={3}
                            placeholder="• Spearheaded user acquisition by 45%..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs leading-relaxed outline-none focus:border-indigo-500 resize-none font-sans"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addExperience}
                      className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/50 hover:border-indigo-500 bg-indigo-950/20 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Work Position</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion 3: Education */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === 'education' ? ('' as any) : 'education')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-slate-850 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Education & Degrees</h3>
                      <p className="text-[11px] text-slate-400">{data.education.length} degrees recorded</p>
                    </div>
                  </div>
                  {activeAccordion === 'education' ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {activeAccordion === 'education' && (
                  <div className="p-4 pt-1 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                    {data.education.map((edu, idx) => (
                      <div key={edu.id || idx} className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 space-y-2 relative">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-700/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Education #{idx + 1}</span>
                          <button
                            onClick={() => removeEducation(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/40 cursor-pointer"
                            title="Remove Education"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Degree / Certificate</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                            placeholder="e.g. B.S. in Computer Science"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">School / University</label>
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                              placeholder="e.g. Stanford University"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Year</label>
                            <input
                              type="text"
                              value={edu.year}
                              onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                              placeholder="e.g. 2018 - 2022"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addEducation}
                      className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/50 hover:border-indigo-500 bg-indigo-950/20 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Education</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion 4: Skills & Keywords */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === 'skills' ? ('' as any) : 'skills')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-slate-850 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Skills & Keywords</h3>
                      <p className="text-[11px] text-slate-400">{data.skills.length} skills listed</p>
                    </div>
                  </div>
                  {activeAccordion === 'skills' ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {activeAccordion === 'skills' && (
                  <div className="p-4 pt-1 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                    {/* Add Skill Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSkillText}
                        onChange={(e) => setNewSkillText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkillCustom()}
                        placeholder="Type skill (e.g. Technical SEO, Python)..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleAddSkillCustom()}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {data.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-xl shadow-sm"
                        >
                          <span>{skill}</span>
                          <button
                            onClick={() => removeSkill(sIdx)}
                            className="text-slate-400 hover:text-rose-400 text-[10px] font-bold p-0.5 rounded cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* ATS Matcher Trigger */}
                    <div className="pt-2">
                      <button
                        onClick={() => setIsAtsModalOpen(true)}
                        className="w-full py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Scan Job Description for Missing ATS Keywords</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 5: Layout & Style Settings */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === 'styles' ? ('' as any) : 'styles')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-slate-850 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Layout & Color Theme</h3>
                      <p className="text-[11px] text-slate-400 capitalize">{template} template • {color} accent</p>
                    </div>
                  </div>
                  {activeAccordion === 'styles' ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {activeAccordion === 'styles' && (
                  <div className="p-4 pt-1 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-150">
                    {/* Template Picker */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-2">Resume Layout Template</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['modern', 'executive', 'classic'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setTemplate(t)}
                            className={`p-2.5 rounded-xl border text-center capitalize transition cursor-pointer ${
                              template === t
                                ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            <div className="text-xs">{t}</div>
                            {template === t && <div className="text-[9px] text-indigo-300 font-bold mt-0.5">✓ Active</div>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-2">Color Accent</label>
                      <div className="grid grid-cols-5 gap-2">
                        {(['indigo', 'navy', 'slate', 'emerald', 'burgundy'] as const).map((c) => (
                          <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                              color === c ? 'bg-slate-800 border-white shadow-md' : 'bg-slate-800/50 border-slate-700'
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-full shadow-inner border border-white/20"
                              style={{ backgroundColor: colorThemes[c].hex }}
                            />
                            <span className="text-[9px] capitalize text-slate-300">{c}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Options Toggles */}
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => setIsCompact(!isCompact)}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          isCompact ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span>Compact 1-Page Layout Fit</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20">{isCompact ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={() => updateField('qrCodeEnabled', !data.qrCodeEnabled)}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          data.qrCodeEnabled ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span>Portfolio / LinkedIn QR Code</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20">{data.qrCodeEnabled ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Bottom Sticky Action Button */}
              <div className="fixed bottom-16 inset-x-3 z-30 sm:hidden">
                <button
                  onClick={() => {
                    setMobileTab('preview');
                    confetti({ particleCount: 35, spread: 50 });
                  }}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-indigo-600/40 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Formatted A4 Document & Export PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* DESKTOP (Always) OR MOBILE (When in Preview mode) */}
          <div className={`${mobileTab === 'editor' ? 'hidden sm:block' : 'block'} w-full`}>
            {/* Mobile Preview Action Bar */}
            <div className="sm:hidden flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-2xl mb-3 text-xs shadow-md">
              <button
                onClick={() => setMobileTab('editor')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-indigo-300 font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>← Edit Details</span>
              </button>
              <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 gap-1 text-[11px]">
                <button
                  onClick={() => setMobileViewMode('fit')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    mobileViewMode === 'fit' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  📱 Fit
                </button>
                <button
                  onClick={() => setMobileViewMode('a4')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    mobileViewMode === 'a4' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  📄 A4
                </button>
              </div>
              <button
                onClick={handlePrintToPDF}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

          <div
            className={`w-full ${
              mobileViewMode === 'a4'
                ? 'overflow-x-auto touch-pan-x overscroll-x-contain pb-28 sm:pb-16'
                : 'overflow-x-hidden pb-28 sm:pb-12'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {mobileViewMode === 'a4' && (
              <div className="sm:hidden text-center text-[11px] text-indigo-300 mb-2 font-medium bg-indigo-950/60 border border-indigo-500/30 py-1.5 px-3 rounded-xl mx-1 shadow-inner">
                ↔️ Swipe left & right to pan across full A4 page
              </div>
            )}
            <div
              className={`w-full flex ${
                mobileViewMode === 'a4' ? 'justify-start' : 'justify-center'
              } px-0 sm:px-1`}
            >
              <div
                ref={resumeRef}
                id="printable-resume"
                className={`${
                  mobileViewMode === 'fit'
                    ? 'w-full max-w-full md:max-w-3xl'
                    : 'w-[794px] min-w-[794px]'
                } bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-200 transition-all ${
                  isCompact ? 'p-3.5 sm:p-6 md:p-8 space-y-3 sm:space-y-4' : 'p-3.5 sm:p-8 md:p-12 space-y-4 sm:space-y-6'
                }`}
                style={{ minHeight: mobileViewMode === 'fit' ? 'auto' : '1050px' }}
              >
            {/* ======================================================== */}
            {/* TEMPLATE 1: MODERN MINIMALIST (Clean Tech Single-Column) */}
            {/* ======================================================== */}
            {template === 'modern' && (
              <div>
                {/* Header */}
                <div className="border-b border-slate-200 pb-5 mb-5 flex flex-col sm:flex-row print:flex-row items-start justify-between gap-4 sm:gap-6">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Headshot Photo if uploaded */}
                    {data.photoUrl && (
                      <div className="relative shrink-0 group">
                        <img
                          src={data.photoUrl}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover shadow-md ring-2 ring-indigo-500/40"
                        />
                        <button
                          onClick={() => setIsHeadshotModalOpen(true)}
                          className="print:hidden absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <AutoTextArea
                        value={data.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        className={`w-full text-3xl font-black tracking-tight ${currentTheme.primary} hover:bg-slate-50 rounded px-1`}
                        placeholder="Your Full Name"
                      />
                      <AutoTextArea
                        value={data.jobTitle}
                        onChange={(e) => updateField('jobTitle', e.target.value)}
                        className="w-full text-sm font-bold text-slate-600 mt-1.5 tracking-wide uppercase hover:bg-slate-50 rounded px-1 leading-relaxed"
                        placeholder="Professional Title / Target Headline"
                      />

                      {/* Contact row with aligned atomic pills */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-3 font-medium">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 py-1 print:bg-transparent print:border-none print:p-0 transition max-w-full">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                          <AutoWidthInput
                            value={data.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="Email"
                            className="max-w-[220px] sm:max-w-none truncate"
                          />
                        </div>

                        <div className="inline-flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 py-1 print:bg-transparent print:border-none print:p-0 transition max-w-full">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                          <AutoWidthInput
                            value={data.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder="Phone"
                            className="max-w-[180px] sm:max-w-none truncate"
                          />
                        </div>

                        <div className="inline-flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 py-1 print:bg-transparent print:border-none print:p-0 transition max-w-full">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                          <AutoWidthInput
                            value={data.location}
                            onChange={(e) => updateField('location', e.target.value)}
                            placeholder="City, Country"
                            className="max-w-[180px] sm:max-w-none truncate"
                          />
                        </div>

                        {data.website && (
                          <div className="inline-flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 py-1 print:bg-transparent print:border-none print:p-0 transition max-w-full">
                            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0 print:hidden" />
                            <AutoWidthInput
                              value={data.website}
                              onChange={(e) => updateField('website', e.target.value)}
                              placeholder="Website / LinkedIn"
                              className="text-indigo-600 font-semibold max-w-[220px] sm:max-w-none truncate"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Portfolio QR Code */}
                  {data.qrCodeEnabled && (
                    <div className="shrink-0 flex flex-col items-center justify-center text-center pl-2">
                      <div
                        className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm cursor-pointer hover:border-indigo-400 transition"
                        dangerouslySetInnerHTML={{
                          __html: generateQRCodeSVG(
                            data.qrCodeUrl || data.website || `mailto:${data.email}`,
                            74,
                            currentTheme.hex
                          ),
                        }}
                        title="Click to change QR URL destination"
                        onClick={() => {
                          const newUrl = prompt('Enter URL for QR code (LinkedIn, GitHub, or Portfolio):', data.qrCodeUrl || data.website || '');
                          if (newUrl !== null) updateField('qrCodeUrl', newUrl.trim());
                        }}
                      />
                      <span className="text-[9px] font-semibold text-slate-400 mt-1 font-mono tracking-tighter">
                        SCAN PORTFOLIO
                      </span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {data.summary && (
                  <div className="mb-6">
                    <h4
                      className={`text-xs font-black uppercase tracking-wider mb-2 ${currentTheme.primary}`}
                    >
                      Professional Summary
                    </h4>
                    <AutoTextArea
                      value={data.summary}
                      onChange={(e) => updateField('summary', e.target.value)}
                      className="w-full text-xs text-slate-700 leading-relaxed hover:bg-slate-50/80 rounded p-1"
                    />
                  </div>
                )}

                {/* Work Experience */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1">
                    <h4
                      className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary}`}
                    >
                      Experience
                    </h4>
                    <button
                      onClick={addExperience}
                      className="print:hidden text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Role</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {data.experiences.map((exp, idx) => (
                      <div key={exp.id || idx} className="relative group">
                        <div className="flex flex-col sm:flex-row print:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 mb-0.5">
                          <AutoTextArea
                            value={exp.role}
                            onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                            className="font-bold text-xs text-slate-900 hover:bg-slate-100 rounded px-1 flex-1 min-w-0"
                            placeholder="Role Title"
                          />
                          <AutoWidthInput
                            value={exp.duration}
                            onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                            className="text-[11px] font-mono text-slate-500 text-left sm:text-right print:text-right shrink-0"
                            placeholder="Dates"
                          />
                        </div>
                        <AutoTextArea
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                          className="w-full text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded px-1 block mb-1"
                          placeholder="Company & Location"
                        />
                        <AutoTextArea
                          value={exp.description}
                          onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                          className="w-full text-xs text-slate-700 leading-relaxed hover:bg-slate-50/80 rounded p-1 whitespace-pre-line"
                          placeholder="Key achievements and responsibilities..."
                        />
                        {data.experiences.length > 1 && (
                          <button
                            onClick={() => removeExperience(idx)}
                            className="print:hidden absolute -top-1 -right-6 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Delete Experience"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education & Skills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  {/* Education */}
                  <div>
                    <h4
                      className={`text-xs font-black uppercase tracking-wider mb-2 border-b border-slate-200 pb-1 ${currentTheme.primary}`}
                    >
                      Education
                    </h4>
                    {data.education.map((edu, idx) => (
                      <div key={edu.id || idx} className="text-xs mb-2">
                        <AutoTextArea
                          value={edu.degree}
                          onChange={(e) => {
                            const copy = [...data.education];
                            copy[idx].degree = e.target.value;
                            setData({ ...data, education: copy });
                          }}
                          className="font-bold text-slate-900 block w-full hover:bg-slate-100 rounded px-1"
                        />
                        <div className="flex flex-col sm:flex-row print:flex-row sm:items-baseline justify-between gap-1 text-[11px] text-slate-500 mt-0.5">
                          <AutoTextArea
                            value={edu.school}
                            onChange={(e) => {
                              const copy = [...data.education];
                              copy[idx].school = e.target.value;
                              setData({ ...data, education: copy });
                            }}
                            className="hover:bg-slate-100 rounded px-1 flex-1 min-w-0"
                          />
                          <input
                            type="text"
                            value={edu.year}
                            onChange={(e) => {
                              const copy = [...data.education];
                              copy[idx].year = e.target.value;
                              setData({ ...data, education: copy });
                            }}
                            className="outline-none bg-transparent hover:bg-slate-100 rounded px-1 text-left sm:text-right print:text-right w-24 shrink-0 font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  <div>
                    <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-1">
                      <h4
                        className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary}`}
                      >
                        Core Competencies
                      </h4>
                      <button
                        onClick={addSkill}
                        className="print:hidden text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Skill</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {data.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 group/skill ${currentTheme.pillBg}`}
                        >
                          <span>{skill}</span>
                          <button
                            onClick={() => removeSkill(idx)}
                            className="print:hidden text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TEMPLATE 2: EXECUTIVE TWO-TONE (Dual-Column Corporate)   */}
            {/* ======================================================== */}
            {template === 'executive' && (
              <div className="space-y-6">
                {/* Header across full width so long headlines fit cleanly! */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <AutoTextArea
                      value={data.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className={`w-full text-3xl font-black tracking-tight leading-tight ${currentTheme.primary} hover:bg-slate-50 rounded px-1`}
                    />
                    <AutoTextArea
                      value={data.jobTitle}
                      onChange={(e) => updateField('jobTitle', e.target.value)}
                      className="w-full text-xs font-bold text-slate-600 mt-1 hover:bg-slate-50 rounded px-1 uppercase tracking-wider leading-relaxed"
                      placeholder="Professional Title / Headline"
                    />
                  </div>

                  {data.qrCodeEnabled && (
                    <div className="shrink-0 flex flex-col items-center justify-center text-center">
                      <div
                        className="p-1.5 bg-white border border-slate-300 rounded-xl shadow-sm cursor-pointer hover:border-indigo-500 transition"
                        dangerouslySetInnerHTML={{
                          __html: generateQRCodeSVG(
                            data.qrCodeUrl || data.website || `mailto:${data.email}`,
                            70,
                            '#0f172a'
                          ),
                        }}
                        title="Scan to view portfolio"
                        onClick={() => {
                          const newUrl = prompt('Enter URL for QR code:', data.qrCodeUrl || data.website || '');
                          if (newUrl !== null) updateField('qrCodeUrl', newUrl.trim());
                        }}
                      />
                      <span className="text-[9px] font-semibold text-slate-500 mt-1 font-mono">
                        PORTFOLIO
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row print:flex-row gap-6 sm:gap-8">
                  {/* Left Sidebar */}
                  <div className="w-full sm:w-1/3 print:w-1/3 border-b sm:border-b-0 sm:border-r print:border-b-0 print:border-r border-slate-200 pb-6 sm:pb-0 sm:pr-6 space-y-6 print:pb-0 print:pr-6">
                    {/* Headshot Photo */}
                    {data.photoUrl && (
                      <div className="flex justify-center pb-2">
                        <div className="relative group">
                          <img
                            src={data.photoUrl}
                            alt="Profile"
                            className="w-24 h-24 rounded-2xl object-cover shadow-lg ring-2 ring-slate-300"
                          />
                          <button
                            onClick={() => setIsHeadshotModalOpen(true)}
                            className="print:hidden absolute inset-0 bg-black/40 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    <div className="space-y-2 text-xs text-slate-600">
                      <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-1">Contact</p>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                        <AutoTextArea
                          value={data.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          className="w-full hover:bg-slate-100 rounded px-1 text-[11px]"
                          placeholder="Email"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                        <AutoTextArea
                          value={data.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          className="w-full hover:bg-slate-100 rounded px-1 text-[11px]"
                          placeholder="Phone"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                        <AutoTextArea
                          value={data.location}
                          onChange={(e) => updateField('location', e.target.value)}
                          className="w-full hover:bg-slate-100 rounded px-1 text-[11px]"
                          placeholder="City, Country"
                        />
                      </div>
                      {data.website && (
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0 print:hidden" />
                          <AutoTextArea
                            value={data.website}
                            onChange={(e) => updateField('website', e.target.value)}
                            className="w-full hover:bg-slate-100 rounded px-1 text-[11px] text-indigo-700 font-medium"
                            placeholder="Website / LinkedIn"
                          />
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">Expertise</p>
                        <button onClick={addSkill} className="print:hidden text-[10px] text-indigo-600 font-bold cursor-pointer">+</button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {data.skills.map((skill, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-slate-700 group">
                            <span>• {skill}</span>
                            <button
                              onClick={() => removeSkill(idx)}
                              className="print:hidden text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 font-bold cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div className="border-t border-slate-200 pt-4">
                      <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-2">Education</p>
                      {data.education.map((edu, idx) => (
                        <div key={edu.id || idx} className="text-xs mb-2">
                          <AutoTextArea
                            value={edu.degree}
                            onChange={(e) => {
                              const copy = [...data.education];
                              copy[idx].degree = e.target.value;
                              setData({ ...data, education: copy });
                            }}
                            className="font-bold text-slate-900 text-[11px] w-full hover:bg-slate-100 rounded px-1"
                          />
                          <AutoTextArea
                            value={edu.school}
                            onChange={(e) => {
                              const copy = [...data.education];
                              copy[idx].school = e.target.value;
                              setData({ ...data, education: copy });
                            }}
                            className="text-slate-500 text-[10px] w-full hover:bg-slate-100 rounded px-1"
                          />
                          <p className="text-slate-400 font-mono text-[9px] px-1">{edu.year}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Main Body */}
                  <div className="w-full sm:w-2/3 print:w-2/3 space-y-6 flex-1 min-w-0">
                    {data.summary && (
                      <div>
                        <h4 className={`text-xs font-black uppercase tracking-wider mb-2 ${currentTheme.primary}`}>
                          Executive Profile
                        </h4>
                        <AutoTextArea
                          value={data.summary}
                          onChange={(e) => updateField('summary', e.target.value)}
                          className="w-full text-xs text-slate-700 leading-relaxed hover:bg-slate-50/80 rounded p-1"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1">
                        <h4 className={`text-xs font-black uppercase tracking-wider ${currentTheme.primary}`}>
                          Career History
                        </h4>
                        <button
                          onClick={addExperience}
                          className="print:hidden text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Role</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {data.experiences.map((exp, idx) => (
                          <div key={exp.id || idx} className="relative group">
                            <div className="flex justify-between items-baseline gap-4">
                              <AutoTextArea
                                value={exp.role}
                                onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                                className="font-bold text-xs text-slate-900 hover:bg-slate-100 rounded px-1 flex-1 min-w-0"
                                placeholder="Role Title"
                              />
                              <AutoWidthInput
                                value={exp.duration}
                                onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                                className="text-[10px] font-mono text-slate-400 text-right shrink-0"
                                placeholder="Dates"
                              />
                            </div>
                            <AutoTextArea
                              value={exp.company}
                              onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                              className="w-full text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded px-1 block mb-1"
                              placeholder="Company & Location"
                            />
                            <AutoTextArea
                              value={exp.description}
                              onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                              className="w-full text-xs text-slate-700 leading-relaxed hover:bg-slate-50/80 rounded p-1 whitespace-pre-line"
                              placeholder="Key achievements..."
                            />
                            {data.experiences.length > 1 && (
                              <button
                                onClick={() => removeExperience(idx)}
                                className="print:hidden absolute -top-1 -right-6 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                title="Delete Experience"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TEMPLATE 3: IVY LEAGUE CLASSIC (Serif Law / Finance Look) */}
            {/* ======================================================== */}
            {template === 'classic' && (
              <div className="font-serif">
                {/* Header */}
                <div className={`text-center border-b-2 pb-4 mb-6 relative ${currentTheme.borderPrimary}`}>
                  {data.photoUrl && (
                    <div className="flex justify-center mb-3">
                      <img
                        src={data.photoUrl}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-slate-300"
                      />
                    </div>
                  )}

                  <AutoTextArea
                    value={data.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className={`w-full text-3xl font-bold tracking-wide text-center uppercase hover:bg-slate-50 rounded ${currentTheme.primary}`}
                  />
                  <AutoTextArea
                    value={data.jobTitle}
                    onChange={(e) => updateField('jobTitle', e.target.value)}
                    className="w-full text-xs italic text-slate-700 text-center mt-1.5 hover:bg-slate-50 rounded tracking-wider uppercase font-sans leading-relaxed"
                    placeholder="PROFESSIONAL TITLE / HEADLINE"
                  />

                  {data.website && (
                    <div className="text-center mt-1.5">
                      <AutoWidthInput
                        value={data.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        className="text-[11px] text-indigo-700 font-semibold text-center hover:underline"
                        placeholder="Portfolio / Website"
                      />
                    </div>
                  )}

                  <div className="flex justify-center items-center flex-wrap gap-2 text-[11px] text-slate-600 mt-2 font-sans">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded print:bg-transparent print:border-none print:p-0">
                      <AutoWidthInput
                        value={data.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="text-center"
                        placeholder="Email"
                      />
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded print:bg-transparent print:border-none print:p-0">
                      <AutoWidthInput
                        value={data.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="text-center"
                        placeholder="Phone"
                      />
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded print:bg-transparent print:border-none print:p-0">
                      <AutoWidthInput
                        value={data.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        className="text-center"
                        placeholder="City, Country"
                      />
                    </span>
                  </div>

                  {data.qrCodeEnabled && (
                    <div className="absolute top-0 right-0 hidden sm:flex flex-col items-center">
                      <div
                        className="p-1 bg-white border border-slate-300 rounded shadow-sm cursor-pointer"
                        dangerouslySetInnerHTML={{
                          __html: generateQRCodeSVG(
                            data.qrCodeUrl || data.website || `mailto:${data.email}`,
                            66,
                            currentTheme.hex
                          ),
                        }}
                        title="Scan to view portfolio"
                        onClick={() => {
                          const newUrl = prompt('Enter URL for QR code:', data.qrCodeUrl || data.website || '');
                          if (newUrl !== null) updateField('qrCodeUrl', newUrl.trim());
                        }}
                      />
                      <span className="text-[8px] font-sans text-slate-500 mt-0.5">SCAN</span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {data.summary && (
                  <div className="mb-6">
                    <h4 className={`text-xs font-bold uppercase tracking-widest border-b-2 pb-1 mb-2 font-sans ${currentTheme.primary} ${currentTheme.borderPrimary}`}>
                      Summary
                    </h4>
                    <AutoTextArea
                      value={data.summary}
                      onChange={(e) => updateField('summary', e.target.value)}
                      className="w-full text-xs text-slate-800 leading-relaxed hover:bg-slate-50 rounded p-1"
                    />
                  </div>
                )}

                {/* Experience */}
                <div className="mb-6">
                  <div className={`flex items-center justify-between border-b-2 pb-1 mb-3 ${currentTheme.borderPrimary}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-widest font-sans ${currentTheme.primary}`}>
                      Professional Experience
                    </h4>
                    <button
                      onClick={addExperience}
                      className={`print:hidden text-[10px] font-sans font-bold hover:opacity-75 cursor-pointer ${currentTheme.primary}`}
                    >
                      + Add Role
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.experiences.map((exp, idx) => (
                      <div key={exp.id || idx} className="relative group">
                        <div className="flex flex-col sm:flex-row print:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 mb-0.5">
                          <AutoTextArea
                            value={exp.role}
                            onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                            className="font-bold text-xs text-slate-900 hover:bg-slate-100 rounded px-1 flex-1 min-w-0"
                          />
                          <AutoWidthInput
                            value={exp.duration}
                            onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                            className="text-[11px] font-sans text-slate-600 text-left sm:text-right print:text-right shrink-0"
                            placeholder="Dates"
                          />
                        </div>
                        <AutoTextArea
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                          className={`w-full text-[11px] italic font-medium hover:bg-slate-100 rounded px-1 block mb-1 ${currentTheme.primary}`}
                        />
                        <AutoTextArea
                          value={exp.description}
                          onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                          className="w-full text-xs text-slate-800 leading-relaxed hover:bg-slate-50 rounded p-1 whitespace-pre-line"
                        />
                        {data.experiences.length > 1 && (
                          <button
                            onClick={() => removeExperience(idx)}
                            className="print:hidden absolute -top-1 -right-6 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Delete Experience"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education & Skills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6">
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-widest border-b-2 pb-1 mb-2 font-sans ${currentTheme.primary} ${currentTheme.borderPrimary}`}>
                      Education
                    </h4>
                    {data.education.map((edu, idx) => (
                      <div key={edu.id || idx} className="text-xs mb-2">
                        <AutoTextArea
                          value={edu.degree}
                          onChange={(e) => {
                            const copy = [...data.education];
                            copy[idx].degree = e.target.value;
                            setData({ ...data, education: copy });
                          }}
                          className="font-bold text-slate-900 w-full hover:bg-slate-100 rounded px-1"
                        />
                        <AutoTextArea
                          value={edu.school}
                          onChange={(e) => {
                            const copy = [...data.education];
                            copy[idx].school = e.target.value;
                            setData({ ...data, education: copy });
                          }}
                          className={`italic w-full hover:bg-slate-100 rounded px-1 ${currentTheme.primary}`}
                        />
                        <p className="font-sans text-[10px] text-slate-500 px-1">{edu.year}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-widest border-b-2 pb-1 mb-2 font-sans ${currentTheme.primary} ${currentTheme.borderPrimary}`}>
                      Skills & Competencies
                    </h4>
                    <p className="text-xs text-slate-800 leading-relaxed font-sans">
                      {data.skills.join(' • ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  )}

      {/* Canva-Style Floating Mobile Studio Dock (Mobile Only, shown when previewing A4) */}
      {mobileTab === 'preview' && (
      <div className="fixed bottom-16 inset-x-3 z-30 sm:hidden">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 flex items-center justify-around">
          {/* Styles & Theme */}
          <button
            onClick={() => setActiveMobileDrawer(activeMobileDrawer === 'styles' ? null : 'styles')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition cursor-pointer min-w-[54px] min-h-[46px] ${
              activeMobileDrawer === 'styles'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Styles & Themes"
          >
            <Palette className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-bold">Styles</span>
          </button>

          {/* ATS Scan */}
          <button
            onClick={() => {
              setActiveMobileDrawer(null);
              setIsAtsModalOpen(true);
            }}
            className="flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition cursor-pointer min-w-[54px] min-h-[46px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
            title="ATS Keyword Scanner"
          >
            <Target className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-bold">ATS Scan</span>
          </button>

          {/* Cover Letter Mode Toggle */}
          <button
            onClick={() => {
              setActiveMobileDrawer(null);
              setIsCoverLetterMode(!isCoverLetterMode);
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition cursor-pointer min-w-[54px] min-h-[46px] ${
              isCoverLetterMode
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40'
            }`}
            title={isCoverLetterMode ? 'Switch to Resume' : 'Switch to Cover Letter'}
          >
            <Mail className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-bold">{isCoverLetterMode ? 'Resume' : 'Letter'}</span>
          </button>

          {/* Demo Roles */}
          <button
            onClick={() => setActiveMobileDrawer(activeMobileDrawer === 'demos' ? null : 'demos')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition cursor-pointer min-w-[54px] min-h-[46px] ${
              activeMobileDrawer === 'demos'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Starter Roles & Demos"
          >
            <Briefcase className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-bold">Roles</span>
          </button>

          {/* Tools & Options */}
          <button
            onClick={() => setActiveMobileDrawer(activeMobileDrawer === 'options' ? null : 'options')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition cursor-pointer min-w-[54px] min-h-[46px] ${
              activeMobileDrawer === 'options'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Resume Options & Tools"
          >
            <Sliders className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-bold">Tools</span>
          </button>
        </div>
      </div>
      )}

      {/* Canva-Style Slide-Up Drawers (Mobile Only) */}
      {activeMobileDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 sm:hidden animate-in fade-in duration-150"
            onClick={() => setActiveMobileDrawer(null)}
          />

          {/* Slide-Up Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden bg-slate-900 border-t border-slate-700/90 rounded-t-3xl p-5 shadow-2xl max-h-[82vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Grab handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

            {/* Drawer 1: Styles & Color Themes */}
            {activeMobileDrawer === 'styles' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Styles & Themes</h3>
                  </div>
                  <button
                    onClick={() => setActiveMobileDrawer(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Templates */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-2.5 block flex items-center gap-1.5">
                    <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select Layout Template</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['modern', 'executive', 'classic'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTemplate(t)}
                        className={`p-3 rounded-2xl border text-center capitalize transition cursor-pointer ${
                          template === t
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs font-bold">{t}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {t === 'modern' ? 'Tech Minimal' : t === 'executive' ? 'Sidebar Pro' : 'Traditional'}
                        </div>
                        {template === t && (
                          <div className="mt-1 text-[10px] text-indigo-300 font-semibold flex items-center justify-center gap-0.5">
                            <Check className="w-3 h-3" /> Active
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Colors */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-2.5 block flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Theme Accent Color</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['indigo', 'navy', 'slate', 'emerald', 'burgundy'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          color === c
                            ? 'bg-slate-800 border-white shadow-lg'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400'
                        }`}
                      >
                        <span
                          className="w-7 h-7 rounded-full shadow-inner border border-white/20"
                          style={{ backgroundColor: colorThemes[c].hex }}
                        />
                        <span className="text-[10px] font-semibold capitalize text-slate-300 truncate w-full text-center">
                          {c}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Density Fit */}
                <div className="pt-2">
                  <button
                    onClick={() => setIsCompact(!isCompact)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-between ${
                      isCompact
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span>Compact 1-Page Layout Fit</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30">
                      {isCompact ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveMobileDrawer(null)}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg transition active:scale-98"
                >
                  Apply & Close
                </button>
              </div>
            )}

            {/* Drawer 2: Starter Roles & Demo Presets */}
            {activeMobileDrawer === 'demos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Starter Roles & Demos</h3>
                  </div>
                  <button
                    onClick={() => setActiveMobileDrawer(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Restore User's Uploaded Resume */}
                {savedUserResume && (
                  <div className="bg-gradient-to-r from-indigo-950 to-violet-950 border border-indigo-500/50 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>My Uploaded Resume</span>
                      </span>
                      {isUserResumeActive && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">
                      {savedUserResume.fullName || 'User Resume'} • {savedUserResume.jobTitle}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          handleRestoreUserResume();
                          setActiveMobileDrawer(null);
                        }}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition"
                      >
                        Restore My Resume
                      </button>
                      <button
                        onClick={() => {
                          setDrawerData(savedUserResume);
                          setIsDrawerOpen(true);
                          setActiveMobileDrawer(null);
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl border border-slate-700"
                      >
                        Review Data
                      </button>
                    </div>
                  </div>
                )}

                {/* 4 Demo Roles */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400">Quick-Load Demo Profiles:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'marketing', label: 'Marketing Lead', icon: '📈' },
                      { id: 'engineer', label: 'Software Engineer', icon: '💻' },
                      { id: 'sales', label: 'Enterprise Sales', icon: '🤝' },
                      { id: 'fresher', label: 'Recent Graduate', icon: '🎓' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          handleSelectPreset(p.id);
                          setActiveMobileDrawer(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          activeRole === p.id && !isUserResumeActive
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-base mb-1">{p.icon}</div>
                        <div className="text-xs font-bold text-white leading-tight">{p.label}</div>
                        {activeRole === p.id && !isUserResumeActive && (
                          <div className="mt-1 text-[10px] text-indigo-300 font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Active
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Drawer 3: Tools & Options */}
            {activeMobileDrawer === 'options' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Resume Tools & Options</h3>
                  </div>
                  <button
                    onClick={() => setActiveMobileDrawer(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* QR Code Toggle */}
                  <button
                    onClick={() => {
                      const next = !data.qrCodeEnabled;
                      updateField('qrCodeEnabled', next);
                      confetti({ particleCount: 20, spread: 35 });
                    }}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
                      data.qrCodeEnabled
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="w-5 h-5 text-indigo-400" />
                      <div className="text-left">
                        <div className="text-xs font-bold">Portfolio / LinkedIn QR Code</div>
                        <div className="text-[10px] text-slate-400">Embeds scannable SVG QR on resume</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded font-mono ${
                        data.qrCodeEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {data.qrCodeEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Profile Photo / Headshot Modal */}
                  <button
                    onClick={() => {
                      setActiveMobileDrawer(null);
                      setIsHeadshotModalOpen(true);
                    }}
                    className="w-full p-3.5 rounded-2xl border border-slate-700 bg-slate-800/80 text-slate-200 flex items-center justify-between transition hover:border-indigo-500 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-indigo-400" />
                      <div className="text-left">
                        <div className="text-xs font-bold">Profile Photo / Headshot</div>
                        <div className="text-[10px] text-slate-400">
                          {data.photoUrl ? 'Custom photo added (Tap to edit)' : 'Add photo to resume header'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-400 font-bold">Open →</span>
                  </button>

                  {/* Import Old Resume */}
                  <button
                    onClick={() => {
                      setActiveMobileDrawer(null);
                      fileInputRef.current?.click();
                    }}
                    className="w-full p-3.5 rounded-2xl border border-slate-700 bg-slate-800/80 text-slate-200 flex items-center justify-between transition hover:border-indigo-500 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <UploadCloud className="w-5 h-5 text-indigo-400" />
                      <div className="text-left">
                        <div className="text-xs font-bold">Import Old Resume (PDF/DOCX)</div>
                        <div className="text-[10px] text-slate-400">Auto-fill all templates in 1 click</div>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-400 font-bold">Import →</span>
                  </button>
                </div>

                {/* Export PDF Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveMobileDrawer(null);
                      handlePrintToPDF();
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Download / Print Vector PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Smart Review Drawer */}
      <ResumeReviewDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialData={drawerData}
        onApply={handleApplyDrawerData}
        fileName={uploadedFileName}
      />

      {/* ATS Scanner Modal */}
      <ATSScannerModal
        isOpen={isAtsModalOpen}
        onClose={() => setIsAtsModalOpen(false)}
        resumeData={data}
        onAddSkill={handleAddSkillFromAts}
      />

      {/* Headshot Styler Modal */}
      <HeadshotModal
        isOpen={isHeadshotModalOpen}
        onClose={() => setIsHeadshotModalOpen(false)}
        currentPhotoUrl={data.photoUrl}
        onApplyPhoto={(photoUrl) => updateField('photoUrl', photoUrl)}
        themeColorHex={currentTheme.hex}
      />
    </div>
  );
};

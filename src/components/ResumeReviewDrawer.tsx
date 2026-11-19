import React, { useState, useEffect } from 'react';
import { ResumeData, ResumeExperience, ResumeEducation } from '../types';
import {
  X,
  Check,
  Sparkles,
  Trash2,
  Plus,
  Briefcase,
  GraduationCap,
  Wrench,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface ResumeReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ResumeData;
  onApply: (confirmedData: ResumeData) => void;
  fileName?: string;
}

export const ResumeReviewDrawer: React.FC<ResumeReviewDrawerProps> = ({
  isOpen,
  onClose,
  initialData,
  onApply,
  fileName,
}) => {
  const [formData, setFormData] = useState<ResumeData>(initialData);
  const [newSkill, setNewSkill] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'contact' | 'experience' | 'education' | 'skills'>('all');

  // Sync when initialData changes
  useEffect(() => {
    setFormData(JSON.parse(JSON.stringify(initialData)));
  }, [initialData]);

  if (!isOpen) return null;

  // Basic field updater
  const updateField = (field: keyof ResumeData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Experience handlers
  const updateExperience = (index: number, field: keyof ResumeExperience, value: string) => {
    setFormData((prev) => {
      const copy = [...prev.experiences];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, experiences: copy };
    });
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [
        {
          id: 'exp_' + Date.now(),
          role: '',
          company: '',
          duration: '',
          description: '',
        },
        ...prev.experiences,
      ],
    }));
  };

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  };

  // Education handlers
  const updateEducation = (index: number, field: keyof ResumeEducation, value: string) => {
    setFormData((prev) => {
      const copy = [...prev.education];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, education: copy };
    });
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        {
          id: 'edu_' + Date.now(),
          degree: '',
          school: '',
          year: '',
        },
        ...prev.education,
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  // Skills handlers
  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleApply = () => {
    onApply(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Slide-in Drawer Container */}
      <div className="relative w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden text-slate-100">
        
        {/* Drawer Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Sparkles className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">Smart Resume Review Drawer</h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                Zero Dummy Data
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {fileName ? (
                <span>Extracted from <strong className="text-indigo-300">{fileName}</strong>. </span>
              ) : null}
              Confirm or edit details before applying to all 3 templates.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-slate-900/90 border-b border-slate-800/80 text-xs overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Sections' },
            { id: 'contact', label: `Profile & Contact` },
            { id: 'experience', label: `Experience (${formData.experiences.length})` },
            { id: 'education', label: `Education (${formData.education.length})` },
            { id: 'skills', label: `Skills (${formData.skills.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* 1. Profile & Contact Card */}
          {(activeTab === 'all' || activeTab === 'contact') && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Profile & Contact Information</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="e.g. Vishnu B"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Professional Headline / Role</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => updateField('jobTitle', e.target.value)}
                    placeholder="e.g. SEO Executive | Digital Marketing"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="e.g. vishnu.starks65@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="e.g. +91 9344949527"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="e.g. Madurai, Tamil Nadu, India"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-500" />
                    <span>Website / Portfolio</span>
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="e.g. View Digital Marketing Projects"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-500" />
                  <span>Professional Summary</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.summary}
                  onChange={(e) => updateField('summary', e.target.value)}
                  placeholder="Paste or refine your career summary..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500 transition resize-y"
                />
              </div>
            </div>
          )}

          {/* 2. Work Experience Card */}
          {(activeTab === 'all' || activeTab === 'experience') && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Work Experience & Projects ({formData.experiences.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={addExperience}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Entry</span>
                </button>
              </div>

              {formData.experiences.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                  No experience entries detected yet. Click "Add Entry" above to add your roles.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.experiences.map((exp, idx) => (
                    <div
                      key={exp.id || idx}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition space-y-2.5 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeExperience(idx)}
                          className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-1"
                          title="Remove Experience"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Role / Project Title</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                            placeholder="e.g. Business Development Associate"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Dates / Period</label>
                          <input
                            type="text"
                            value={exp.duration}
                            onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                            placeholder="e.g. Dec 2022 - Sep 2024"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Company / Organization</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                          placeholder="e.g. Netweave Disruptive Technologies Pvt Ltd"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-medium focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Achievements & Bullets</label>
                        <textarea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                          placeholder="• Key deliverables&#10;• Metrics & outcomes achieved"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed focus:outline-none focus:border-indigo-500 transition resize-y font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Education Card */}
          {(activeTab === 'all' || activeTab === 'education') && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Education & Certifications ({formData.education.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={addEducation}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Degree</span>
                </button>
              </div>

              {formData.education.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                  No education entries detected. Click "Add Degree" to include one.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.education.map((edu, idx) => (
                    <div
                      key={edu.id || idx}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Degree / Course</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                            placeholder="e.g. B.Sc. Electronics & Communication"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Year / Status</label>
                          <input
                            type="text"
                            value={edu.year}
                            onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                            placeholder="e.g. 2014 - 2017"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">School / College / Academy</label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                            placeholder="e.g. Mannar Thirumalai Naicker College"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-1 mt-1"
                        title="Remove Education"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Skills Card */}
          {(activeTab === 'all' || activeTab === 'skills') && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  <span>Skills & Competencies ({formData.skills.length})</span>
                </h4>
              </div>

              {/* Add Skill Bar */}
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Type a skill (e.g. GA4, Semrush, Technical SEO) and press Enter"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              {/* Skill Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium group hover:border-slate-700 transition"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(idx)}
                      className="text-slate-500 hover:text-rose-400 transition cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Fixed Sticky Footer / Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply to All 3 Templates (60s Instant Magic) ✨</span>
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ActiveTab } from '../types';
import {
  FileSignature,
  Layers,
  ArrowLeftRight,
  Sparkles,
  ShieldCheck,
  DownloadCloud,
  GraduationCap,
  Menu,
  X,
  Lock,
  Search,
  UploadCloud,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  hasFile: boolean;
  fileName?: string;
  onResetFile: () => void;
  onOpenToolsModal?: () => void;
  onOpenPrivacyModal?: () => void;
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasFile,
  fileName,
  onResetFile,
  onOpenToolsModal,
  onOpenPrivacyModal,
  onFileLoaded,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const tabs = [
    { id: 'sign-edit', label: 'Edit & Sign', shortLabel: 'Sign & Edit', icon: FileSignature },
    { id: 'organize', label: 'Merge & Organize', shortLabel: 'Merge', icon: Layers },
    { id: 'convert', label: 'Convert', shortLabel: 'Convert', icon: ArrowLeftRight },
    { id: 'security-studio', label: 'Protect & Mask', shortLabel: 'Protect', icon: ShieldCheck, badge: 'New' },
    { id: 'tools', label: 'Pro Tools', shortLabel: 'Tools', icon: Sparkles, badge: 'AI Tools' },
    { id: 'resume', label: 'Resume Builder', shortLabel: 'Resume', icon: GraduationCap, badge: '60s' },
  ];

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div
            role="button"
            tabIndex={0}
            aria-label="PDFCraft Home"
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl p-1"
            onClick={onResetFile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onResetFile();
              }
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-lg sm:text-xl tracking-tighter">P</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight">PDFCraft</span>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">
                  Zero Cost
                </span>
              </div>
              <p
                onClick={onOpenPrivacyModal}
                className="text-[10px] sm:text-[11px] text-slate-400 font-normal hidden sm:block cursor-pointer hover:text-emerald-400 transition"
              >
                100% Client-Side Privacy
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs & Search (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2 min-w-0">
            <nav aria-label="Main Navigation" className="flex items-center gap-0.5 sm:gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id || (tab.id === 'organize' && activeTab === 'split') || (tab.id === 'security-studio' && activeTab === 'security');
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    aria-label={tab.label}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 font-semibold scale-[1.02]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="hidden lg:inline">{tab.label}</span>
                    <span className="lg:hidden">{tab.shortLabel}</span>
                    {tab.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0 ${
                          tab.badge === 'AI Radar'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : tab.badge === 'New'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Explore Tools Command Palette Trigger */}
            {onOpenToolsModal && (
              <button
                onClick={onOpenToolsModal}
                aria-label="Search and launch all 16 tools (Ctrl+K)"
                className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                title="Search and launch all 16 tools (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="whitespace-nowrap hidden lg:inline">Tools Hub</span>
                <span className="whitespace-nowrap lg:hidden">Hub</span>
                <kbd className="hidden xl:inline text-[9px] bg-slate-900 border border-slate-700 px-1 py-0.5 rounded text-slate-400 font-mono">
                  ⌘K
                </kbd>
              </button>
            )}
          </div>

          {/* Desktop / Tablet Privacy Pill & Active File Status (Visible on md and up!) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {deferredPrompt && (
              <button
                onClick={handleInstallPWA}
                aria-label="Install as Desktop App"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition animate-pulse shrink-0 whitespace-nowrap"
                title="Install as Desktop App"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Install App</span>
              </button>
            )}

            {hasFile && fileName ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="text-slate-200 max-w-[100px] lg:max-w-[140px] truncate">{fileName}</span>
                <label className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer pl-1 transition">
                  Change
                  <input
                    type="file"
                    accept=".pdf"
                    aria-label="Change active PDF document"
                    className="hidden"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const bytes = await file.arrayBuffer();
                        onFileLoaded?.(file, bytes);
                      }
                    }}
                  />
                </label>
                <button
                  onClick={onResetFile}
                  aria-label="Close active file"
                  className="text-slate-400 hover:text-rose-400 ml-1 font-bold"
                  title="Close File"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 cursor-pointer transition shrink-0 whitespace-nowrap">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    aria-label="Upload PDF Document"
                    className="hidden"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const bytes = await file.arrayBuffer();
                        onFileLoaded?.(file, bytes);
                      }
                    }}
                  />
                </label>
                <button
                  onClick={onOpenPrivacyModal}
                  aria-label="View Privacy Architecture"
                  className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-950/40 hover:bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap transition cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>100% Client-Side</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Action Bar (Search, Direct Upload, Hamburger & Active File status) */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Quick Mobile Upload button if no file */}
            {!hasFile && (
              <label
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer transition flex items-center justify-center shrink-0"
                title="Upload PDF"
              >
                <UploadCloud className="w-4 h-4" />
                <input
                  type="file"
                  accept=".pdf"
                  aria-label="Upload PDF file"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const bytes = await file.arrayBuffer();
                      onFileLoaded?.(file, bytes);
                    }
                  }}
                />
              </label>
            )}

            {onOpenToolsModal && (
              <button
                onClick={onOpenToolsModal}
                aria-label="Search all features (Ctrl+K)"
                className="p-2 rounded-xl bg-slate-800 text-indigo-400 hover:text-white border border-slate-700 transition"
                title="Search all features"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {hasFile && fileName && (
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg text-[11px] max-w-[110px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span className="text-slate-200 truncate">{fileName}</span>
                <button
                  onClick={onResetFile}
                  aria-label="Close active file"
                  className="text-slate-400 hover:text-rose-400 text-xs font-bold pl-0.5"
                  title="Close File"
                >
                  ×
                </button>
              </div>
            )}

            {deferredPrompt && (
              <button
                onClick={handleInstallPWA}
                aria-label="Install App"
                className="p-2 rounded-xl bg-indigo-600 text-white text-xs"
                title="Install App"
              >
                <DownloadCloud className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/98 px-4 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-150">
            {/* Mobile Direct Upload & File Status */}
            {hasFile && fileName ? (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="text-xs font-mono text-slate-200 truncate">{fileName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer transition">
                    Change
                    <input
                      type="file"
                      accept=".pdf"
                      aria-label="Change PDF document"
                      className="hidden"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const bytes = await file.arrayBuffer();
                          onFileLoaded?.(file, bytes);
                          setMobileMenuOpen(false);
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      onResetFile();
                      setMobileMenuOpen(false);
                    }}
                    aria-label="Close file"
                    className="text-slate-400 hover:text-rose-400 text-sm font-bold px-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              <label className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer transition">
                <UploadCloud className="w-4 h-4" />
                <span>Upload PDF Document</span>
                <input
                  type="file"
                  accept=".pdf"
                  aria-label="Upload PDF document"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const bytes = await file.arrayBuffer();
                      onFileLoaded?.(file, bytes);
                      setMobileMenuOpen(false);
                    }
                  }}
                />
              </label>
            )}

            {/* Quick Tools Hub Launch Banner */}
            {onOpenToolsModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenToolsModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-950 via-violet-950 to-indigo-950 border border-indigo-500/40 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>🔍 Explore All 16 Super-Tools</span>
                </span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                  Free
                </span>
              </button>
            )}

            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as ActiveTab);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          tab.badge === 'AI Radar'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : tab.badge === 'New'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPrivacyModal?.();
                }}
                className="flex items-center gap-1.5 hover:text-emerald-400 transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Client-Side Privacy</span>
              </button>
              {deferredPrompt && (
                <button
                  onClick={handleInstallPWA}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold"
                >
                  Install App
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom Navigation Bar (Thumb Friendly) */}
      <nav aria-label="Mobile Navigation" className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 md:hidden print:hidden px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'organize' && activeTab === 'split') || (tab.id === 'tools' && activeTab === 'security');
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ActiveTab);
                setMobileMenuOpen(false);
              }}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition relative min-w-[56px] min-h-[44px] ${
                isActive
                  ? 'text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Pip */}
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-sm shadow-indigo-500" />
              )}
              
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-indigo-400' : 'text-slate-400'}`} />
                {tab.badge && (
                  <span
                    className={`absolute -top-1 -right-2 w-2 h-2 rounded-full ${
                      tab.badge === 'AI Radar' ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                  />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-[64px] ${isActive ? 'text-white font-bold' : 'text-slate-400'}`}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

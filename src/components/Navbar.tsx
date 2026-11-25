import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Sun,
  Moon,
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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('pdfcraft-theme', next);
    } catch {
      // Ignore storage failures
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const primaryTabs = [
    { id: 'sign-edit', label: 'Edit & Sign', shortLabel: 'Sign', icon: FileSignature },
    { id: 'organize', label: 'Organize', shortLabel: 'Organize', icon: Layers },
    { id: 'convert', label: 'Convert', shortLabel: 'Convert', icon: ArrowLeftRight },
    { id: 'security-studio', label: 'Protect & Mask', shortLabel: 'Protect', icon: ShieldCheck, badge: 'PII' },
  ];

  const secondaryTabs = [
    { id: 'tools', label: 'Pro Tools', shortLabel: 'Tools', icon: Sparkles },
    { id: 'resume', label: 'Resume Studio', shortLabel: 'Resume', icon: GraduationCap, badge: 'Free' },
  ];

  const allTabs = [...primaryTabs, ...secondaryTabs];

  const isSecondaryActive = secondaryTabs.some(
    (t) =>
      activeTab === t.id ||
      (t.id === 'organize' && activeTab === 'split') ||
      (t.id === 'security-studio' && activeTab === 'security')
  );

  return (
    <>
      <header className="sticky top-0 left-0 z-50 w-full border-b border-line bg-bg/95 backdrop-blur-sm">
        <div className="max-w-[1280px] mx-auto border-x border-line min-h-[48px] flex items-stretch justify-between">
          {/* Brand Logo */}
          <div className="flex items-stretch">
            <div
              role="button"
              tabIndex={0}
              aria-label="PDFCraft Home"
              className="flex items-center gap-2.5 px-3 sm:px-4 border-r border-line cursor-pointer shrink-0 hover:bg-bg-raised transition-colors focus:outline-none"
              onClick={onResetFile}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onResetFile();
                }
              }}
            >
              <div className="w-6 h-6 bg-app flex items-center justify-center text-white font-mono text-[10px] font-bold shrink-0">
                <img
                  src="/icon.png"
                  alt="PDFCraft"
                  className="w-4 h-4 object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm tracking-tight text-ink-strong">
                  Pdf<span className="text-app-ink">Craft</span>
                </span>
                <span className="hud-label text-[9px] text-muted border border-line px-1.5 py-0.5 hidden xl:inline-block">
                  WEB WASM
                </span>
              </div>
            </div>

            {/* Desktop Hairline Nav Links */}
            <nav aria-label="Main Navigation" className="hidden lg:flex items-stretch">
              {primaryTabs.map((tab) => {
                const isActive = activeTab === tab.id || (tab.id === 'organize' && activeTab === 'split');
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as ActiveTab);
                      setMoreMenuOpen(false);
                    }}
                    aria-label={tab.label}
                    className={`flex items-center gap-1.5 px-3 xl:px-3.5 hud-label transition-colors whitespace-nowrap cursor-pointer border-r border-line ${
                      isActive
                        ? 'bg-invert-bg text-invert-fg font-bold'
                        : 'text-muted hover:text-ink hover:bg-bg-raised'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              {/* Pro Tools & Resume Dropdown */}
              <div className="relative flex items-stretch" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  aria-expanded={moreMenuOpen}
                  aria-label="More PDF Tools"
                  className={`flex items-center gap-1.5 px-3 xl:px-3.5 hud-label transition-colors whitespace-nowrap cursor-pointer border-r border-line ${
                    isSecondaryActive
                      ? 'bg-invert-bg text-invert-fg font-bold'
                      : 'text-muted hover:text-ink hover:bg-bg-raised'
                  }`}
                >
                  <span>Studio</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {moreMenuOpen && (
                  <div className="absolute left-0 top-full w-64 bg-bg-raised border border-line-strong z-50">
                    <div className="px-3.5 py-2 border-b border-line hud-label text-[10px] text-faint">
                      Additional Workbenches
                    </div>
                    {secondaryTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as ActiveTab);
                            setMoreMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-3 hud-label transition-colors cursor-pointer text-left border-b border-line ${
                            isActive
                              ? 'bg-invert-bg text-invert-fg'
                              : 'text-ink hover:bg-bg'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                          </span>
                          {tab.badge && (
                            <span className="text-[9px] text-app-ink font-bold">{tab.badge}</span>
                          )}
                        </button>
                      );
                    })}
                    {onOpenToolsModal && (
                      <button
                        onClick={() => {
                          setMoreMenuOpen(false);
                          onOpenToolsModal();
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-3 hud-label text-ink hover:bg-invert-bg hover:text-invert-fg transition-colors cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2">
                          <Search className="w-3.5 h-3.5" />
                          <span>All 16 Tools</span>
                        </span>
                        <span className="text-[10px] opacity-70">⌘K</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Desktop Right Rail */}
          <div className="hidden lg:flex items-stretch">
            {onOpenToolsModal && (
              <button
                onClick={onOpenToolsModal}
                aria-label="Command Palette (Ctrl+K)"
                className="flex items-center gap-1.5 px-3 border-l border-line hud-label text-muted hover:text-ink hover:bg-bg-raised transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Tools</span>
                <kbd className="text-[9px] text-faint border border-line px-1">⌘K</kbd>
              </button>
            )}

            {onOpenPrivacyModal && (
              <button
                onClick={onOpenPrivacyModal}
                aria-label="Client-Side Privacy Architecture"
                className="flex items-center gap-1.5 px-3 border-l border-line hud-label text-app-ink hover:text-ink hover:bg-bg-raised transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden xl:inline">Zero Cloud</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="flex items-center justify-center px-3.5 border-l border-line text-muted hover:text-ink hover:bg-bg-raised transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {deferredPrompt && (
              <button
                onClick={handleInstallPWA}
                aria-label="Install App"
                className="flex items-center gap-1.5 px-3 border-l border-line hud-label text-ink hover:bg-bg-raised transition-colors cursor-pointer"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-app-ink" />
                <span className="hidden xl:inline">Install</span>
              </button>
            )}

            {hasFile && fileName ? (
              <div className="flex items-stretch border-l border-line bg-bg-raised">
                <div className="flex items-center gap-2 px-3">
                  <span className="w-1.5 h-1.5 bg-app shrink-0" />
                  <span className="font-mono text-[11px] text-ink max-w-[120px] truncate">{fileName}</span>
                </div>
                <label className="flex items-center px-3 border-l border-line hud-label text-muted hover:text-ink hover:bg-bg cursor-pointer transition-colors">
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
                  className="px-3 border-l border-line font-mono text-sm text-muted hover:text-danger hover:bg-bg transition-colors cursor-pointer"
                  title="Close File"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-5 border-l border-line bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-80 cursor-pointer transition-opacity shrink-0 whitespace-nowrap">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Launch / Open PDF</span>
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
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-stretch">
            {hasFile && fileName ? (
              <div className="flex items-center gap-1.5 px-2.5 border-l border-line">
                <span className="w-1.5 h-1.5 bg-app shrink-0" />
                <span className="font-mono text-[10px] text-ink max-w-[85px] truncate">{fileName}</span>
                <button
                  onClick={onResetFile}
                  aria-label="Close active file"
                  className="text-muted hover:text-danger text-sm font-mono pl-1"
                >
                  ×
                </button>
              </div>
            ) : (
              <label
                className="flex items-center justify-center px-3 border-l border-line bg-invert-bg text-invert-fg cursor-pointer"
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

            <button
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="flex items-center justify-center px-3 border-l border-line text-muted hover:text-ink"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {onOpenToolsModal && (
              <button
                onClick={onOpenToolsModal}
                aria-label="Search tools"
                className="flex items-center justify-center px-3 border-l border-line text-muted hover:text-ink"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center px-3 border-l border-line text-ink"
              aria-label="Open main menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-line bg-bg-raised">
            <div className="grid grid-cols-1 divide-y divide-line">
              {allTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive =
                  activeTab === tab.id ||
                  (tab.id === 'organize' && activeTab === 'split') ||
                  (tab.id === 'security-studio' && activeTab === 'security');
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as ActiveTab);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 hud-label text-left ${
                      isActive ? 'bg-invert-bg text-invert-fg' : 'text-ink hover:bg-bg'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </span>
                    {tab.badge && <span className="text-[10px] text-app-ink font-bold">{tab.badge}</span>}
                  </button>
                );
              })}

              {onOpenToolsModal && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenToolsModal();
                  }}
                  className="w-full flex items-center justify-between px-4 py-3.5 hud-label text-app-ink text-left hover:bg-bg"
                >
                  <span className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4" />
                    <span>Command Palette (All 16 Tools)</span>
                  </span>
                  <span>⌘K</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPrivacyModal?.();
                }}
                className="w-full flex items-center justify-between px-4 py-3.5 hud-label text-muted text-left hover:bg-bg"
              >
                <span className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-app-ink" />
                  <span>Zero-Cloud Privacy Architecture</span>
                </span>
                <span>Verify</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Hairline Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-bg/95 backdrop-blur-md border-t border-line lg:hidden print:hidden grid grid-cols-5 divide-x divide-line safe-area-pb"
      >
        {allTabs.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'organize' && activeTab === 'split') ||
            (tab.id === 'tools' && activeTab === 'security');
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ActiveTab);
                setMobileMenuOpen(false);
              }}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-colors relative min-h-[48px] ${
                isActive ? 'bg-invert-bg text-invert-fg' : 'text-muted hover:text-ink'
              }`}
            >
              {isActive && <span className="absolute top-0 inset-x-0 h-0.5 bg-app" />}
              <Icon className="w-4 h-4" />
              <span className="font-mono text-[9px] uppercase tracking-wider mt-1 truncate max-w-full">
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

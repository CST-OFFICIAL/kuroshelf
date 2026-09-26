import React from 'react';
import { X, Sun, Moon, Laptop, Check, Sliders } from 'lucide-react';
import { ThemeMode } from '../types';

interface AppearanceModalProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  onClose: () => void;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  themeMode,
  onThemeModeChange,
  onClose,
}) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="appearance-settings-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#131620] border border-slate-200 dark:border-[#262c3e] shadow-2xl overflow-hidden transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#202535]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                Appearance & View Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize your screen theme and viewing distance
              </p>
            </div>
          </div>
          <button
            type="button"
            id="appearance-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c2130] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section 1: Screen Theme */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Screen Appearance
              </span>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50">
                {themeMode === 'light' ? 'Light Theme' : themeMode === 'dark' ? 'Dark Theme' : 'Auto System'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Light Mode Option */}
              <button
                type="button"
                id="theme-select-light"
                onClick={() => onThemeModeChange('light')}
                className={`relative flex flex-col items-center gap-2.5 p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-rose-50/50 border-rose-500 ring-2 ring-rose-500/20 shadow-sm text-slate-900'
                    : 'bg-slate-50/80 dark:bg-[#181c28] border-slate-200 dark:border-[#262c3e] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#38425a]'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${
                  themeMode === 'light' 
                    ? 'bg-amber-100 text-amber-600' 
                    : 'bg-slate-200/70 dark:bg-[#202636] text-slate-600 dark:text-slate-400'
                }`}>
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Light</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Crisp Studio Light</div>
                </div>
                {themeMode === 'light' && (
                  <div className="absolute top-2 right-2 p-0.5 rounded-full bg-rose-600 text-white">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                id="theme-select-dark"
                onClick={() => onThemeModeChange('dark')}
                className={`relative flex flex-col items-center gap-2.5 p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-orange-950/20 border-orange-500 ring-2 ring-orange-500/20 shadow-sm text-slate-900 dark:text-slate-100'
                    : 'bg-slate-50/80 dark:bg-[#181c28] border-slate-200 dark:border-[#262c3e] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#38425a]'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${
                  themeMode === 'dark' 
                    ? 'bg-orange-950/60 text-orange-400 border border-orange-500/30' 
                    : 'bg-slate-200/70 dark:bg-[#202636] text-slate-600 dark:text-slate-400'
                }`}>
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">OLED Dark</div>
                  <div className="text-[10px] text-orange-400/90 dark:text-orange-400 mt-0.5">Akane Sunset</div>
                </div>
                {themeMode === 'dark' && (
                  <div className="absolute top-2 right-2 p-0.5 rounded-full bg-orange-500 text-white">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>

              {/* System Option */}
              <button
                type="button"
                id="theme-select-system"
                onClick={() => onThemeModeChange('system')}
                className={`relative flex flex-col items-center gap-2.5 p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  themeMode === 'system'
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 ring-2 ring-rose-500/20 shadow-sm text-slate-900 dark:text-slate-100'
                    : 'bg-slate-50/80 dark:bg-[#181c28] border-slate-200 dark:border-[#262c3e] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#38425a]'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${
                  themeMode === 'system' 
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300' 
                    : 'bg-slate-200/70 dark:bg-[#202636] text-slate-600 dark:text-slate-400'
                }`}>
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">System</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Match OS</div>
                </div>
                {themeMode === 'system' && (
                  <div className="absolute top-2 right-2 p-0.5 rounded-full bg-rose-600 text-white">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#10131a] border-t border-slate-100 dark:border-[#202535] flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Settings are saved locally on this browser.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

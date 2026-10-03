import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Upload, Info } from 'lucide-react';

export interface TermExplanation {
  term: string;
  meaning: string;
}

interface PageExplainerHeaderProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  terms: TermExplanation[];
}

export const PageExplainerHeader: React.FC<PageExplainerHeaderProps> = ({
  stepNumber,
  title,
  subtitle,
  terms,
}) => {
  const [showTerms, setShowTerms] = useState<boolean>(true);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 sm:px-4 sm:py-3 mb-3 sm:mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
              Page {stepNumber} of 6
            </span>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">
              {title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-snug">
            {subtitle}
          </p>
        </div>

        {terms.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTerms(!showTerms)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-slate-200 transition shrink-0 self-start sm:self-center"
          >
            <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>{showTerms ? 'Hide Heading Guide' : 'Show Heading Guide'}</span>
            {showTerms ? (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {showTerms && terms.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Heading Guide</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {terms.map((item) => (
              <div
                key={item.term}
                className="rounded-lg bg-slate-950/70 border border-slate-800/90 px-2.5 py-2"
              >
                <div className="text-xs font-semibold text-white">{item.term}</div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  {item.meaning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface EmptyCsvStateProps {
  pageTitle: string;
  whatYouWillSee: string[];
  onGoToUpload: () => void;
}

export const EmptyCsvState: React.FC<EmptyCsvStateProps> = ({
  pageTitle,
  whatYouWillSee,
  onGoToUpload,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 text-center max-w-2xl mx-auto my-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-3">
        <Upload className="h-6 w-6" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-white">
        Upload a Bank CSV to Unlock &ldquo;{pageTitle}&rdquo;
      </h3>
      <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
        No transactions are loaded yet. Once you upload your bank CSV data on Page 1,
        this page will automatically show:
      </p>
      <ul className="mt-3 text-left space-y-1.5 bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-slate-200">
        {whatYouWillSee.map((point, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onGoToUpload}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition"
      >
        <Upload className="h-4 w-4" />
        <span>Go to Page 1: Upload Your Bank CSV</span>
      </button>
    </div>
  );
};

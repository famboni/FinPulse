import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Upload,
  AlertOctagon,
  Repeat,
  Zap,
  ListFilter,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import {
  AreaOfConcern,
  CategoryId,
  ColumnMapping,
  Transaction,
  UserOverrides,
} from './types/finance';
import { buildTransactionsFromRows, parseCsvToPreview } from './utils/csvParser';
import { analyzeTransactions } from './utils/analyzer';
import { UploadCsvPage } from './components/UploadCsvPage';
import { OverviewTab } from './components/OverviewTab';
import { RecurringTab } from './components/RecurringTab';
import { BehaviorTimingTab } from './components/BehaviorTimingTab';
import { TransactionsTriageTab } from './components/TransactionsTriageTab';
import { SimulatorTab } from './components/SimulatorTab';

const STORAGE_KEY = 'finpulse_90plus_overrides_v3';

const EMPTY_OVERRIDES: UserOverrides = {
  merchantCategoryRules: {},
  txCategoryOverrides: {},
  txOutlierOverrides: {},
  txExcludedOverrides: {},
};

export type PageId =
  | 'upload'
  | 'transactions'
  | 'overview'
  | 'recurring'
  | 'behavior'
  | 'simulator';

interface NavPageMeta {
  id: PageId;
  step: number;
  title: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_PAGES: NavPageMeta[] = [
  {
    id: 'upload',
    step: 1,
    title: '1. Upload CSV',
    shortDesc: 'Load & map your bank file',
    icon: Upload,
  },
  {
    id: 'transactions',
    step: 2,
    title: '2. All Transactions',
    shortDesc: 'Full summary, bar chart & list',
    icon: ListFilter,
  },
  {
    id: 'overview',
    step: 3,
    title: '3. Red Flags & Score',
    shortDesc: 'Areas of concern & how to fix',
    icon: AlertOctagon,
  },
  {
    id: 'recurring',
    step: 4,
    title: '4. Regular Bills',
    shortDesc: 'Subscriptions & price increases',
    icon: Repeat,
  },
  {
    id: 'behavior',
    step: 5,
    title: '5. Spending Habits',
    shortDesc: 'Small buys, paydays & timing',
    icon: Zap,
  },
  {
    id: 'simulator',
    step: 6,
    title: '6. Savings Planner',
    shortDesc: 'Calculate potential savings',
    icon: Sliders,
  },
];

export function App() {
  const [activeTab, setActiveTab] = useState<PageId>('upload');
  const [csvText, setCsvText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);

  const [overrides, setOverrides] = useState<UserOverrides>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return EMPTY_OVERRIDES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // ignore storage errors
    }
  }, [overrides]);

  const [txFilterPreset, setTxFilterPreset] = useState<
    AreaOfConcern['filterPreset'] | null
  >(null);

  const parsedPreview = useMemo(() => {
    if (!csvText.trim()) return null;
    return parseCsvToPreview(csvText);
  }, [csvText]);

  const report = useMemo(() => {
    if (!parsedPreview || !mapping) {
      return analyzeTransactions([], overrides, '$');
    }
    const transactions = buildTransactionsFromRows(
      parsedPreview.rows,
      mapping,
      overrides
    );
    return analyzeTransactions(transactions, overrides, mapping.currencySymbol);
  }, [parsedPreview, mapping, overrides]);

  const hasData = report.transactions.length > 0;
  const c = report.currencySymbol;

  // Syncs CSV data immediately when uploaded or remapped on Page 1 so "Next: 2. All Transactions" works identically to "Save & View All Transactions"
  const handleSyncCsvData = (
    newCsvText: string,
    newMapping: ColumnMapping,
    newFileName: string
  ) => {
    if (newCsvText !== csvText) {
      setOverrides((prev) => ({
        ...EMPTY_OVERRIDES,
        merchantCategoryRules: prev.merchantCategoryRules,
      }));
    }
    setCsvText(newCsvText);
    setMapping(newMapping);
    setFileName(newFileName);
  };

  const handleConfirmImport = (
    newCsvText: string,
    newMapping: ColumnMapping,
    newFileName: string
  ) => {
    handleSyncCsvData(newCsvText, newMapping, newFileName);
    setTxFilterPreset(null);
    setActiveTab('transactions');
  };

  const handleClearData = () => {
    setCsvText('');
    setMapping(null);
    setFileName('');
    setOverrides(EMPTY_OVERRIDES);
  };

  const handleJumpToTransactions = (preset: AreaOfConcern['filterPreset']) => {
    setTxFilterPreset(preset || null);
    setActiveTab('transactions');
  };

  const handleUpdateCategory = (
    tx: Transaction,
    newCat: CategoryId,
    applyToAllMerchant: boolean
  ) => {
    setOverrides((prev) => {
      const next: UserOverrides = {
        ...prev,
        merchantCategoryRules: { ...prev.merchantCategoryRules },
        txCategoryOverrides: { ...prev.txCategoryOverrides },
      };
      if (applyToAllMerchant) {
        next.merchantCategoryRules[tx.normalizedMerchant.toLowerCase()] = newCat;
      } else {
        next.txCategoryOverrides[tx.id] = newCat;
      }
      return next;
    });
  };

  const handleBatchSaveMerchantRules = (newRules: Record<string, CategoryId>) => {
    setOverrides((prev) => ({
      ...prev,
      merchantCategoryRules: {
        ...prev.merchantCategoryRules,
        ...newRules,
      },
    }));
  };

  const handleToggleOutlier = (tx: Transaction) => {
    setOverrides((prev) => ({
      ...prev,
      txOutlierOverrides: {
        ...prev.txOutlierOverrides,
        [tx.id]: !tx.isOutlier,
      },
    }));
  };

  const handleResetOverrides = () => {
    setOverrides(EMPTY_OVERRIDES);
  };

  const currentPageIndex = NAV_PAGES.findIndex((p) => p.id === activeTab);
  const prevPage = currentPageIndex > 0 ? NAV_PAGES[currentPageIndex - 1] : null;
  const nextPage =
    currentPageIndex < NAV_PAGES.length - 1 ? NAV_PAGES[currentPageIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header & Always-Visible 6-Page Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Top Brand & Always-Visible Total Income / Total Outgoings Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
                <Activity className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  FinPulse <span className="text-emerald-400">90+</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Personal Finance &amp; Bank CSV Analyzer
                </p>
              </div>
            </div>

            {/* Active File Status & Persistent Total Income / Total Outgoings */}
            <div className="flex flex-wrap items-center gap-2">
              {hasData ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] sm:text-xs font-mono">
                    <span className="text-slate-400">Total Income:</span>
                    <strong className="text-emerald-400">
                      +{c}
                      {report.totalIncome.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">Total Outgoings:</span>
                    <strong className="text-amber-300">
                      -{c}
                      {report.totalRawSpend.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] sm:text-xs font-medium ${
                      report.meetsMinimumWindow
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-amber-500/40 bg-amber-500/15 text-amber-200'
                    }`}
                  >
                    {report.meetsMinimumWindow ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="truncate max-w-[180px] sm:max-w-none">
                      <strong>{fileName}</strong> • {report.totalDays}d • Score:{' '}
                      <strong>{report.healthScore}/100</strong>
                    </span>
                  </div>
                </>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] sm:text-xs text-slate-300">
                  <span>No CSV loaded yet — Start on Step 1 to upload your file</span>
                </div>
              )}
            </div>
          </div>

          {/* 6-Page Navigation Grid (Responsive for Mobile Phones & Desktops) */}
          <nav
            aria-label="Main Pages"
            className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2.5"
          >
            {NAV_PAGES.map((page) => {
              const Icon = page.icon;
              const isActive = activeTab === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setActiveTab(page.id)}
                  className={`flex flex-col items-start justify-between rounded-xl border p-2.5 sm:p-3 text-left transition ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500/15 shadow-md shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-[11px] sm:text-xs font-bold leading-tight ${
                        isActive ? 'text-emerald-300' : 'text-white'
                      }`}
                    >
                      {page.title}
                    </span>
                    <Icon
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${
                        isActive ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 leading-tight line-clamp-1 sm:line-clamp-none">
                    {page.shortDesc}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'upload' && (
          <UploadCsvPage
            currentCsvText={csvText}
            currentFileName={fileName}
            currentMapping={mapping}
            overrides={overrides}
            onSyncCsvData={handleSyncCsvData}
            onConfirmImport={handleConfirmImport}
            onClearData={handleClearData}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTriageTab
            report={report}
            hasData={hasData}
            onGoToUpload={() => setActiveTab('upload')}
            overrides={overrides}
            initialFilterPreset={txFilterPreset}
            onClearPreset={() => setTxFilterPreset(null)}
            onUpdateCategory={handleUpdateCategory}
            onBatchSaveMerchantRules={handleBatchSaveMerchantRules}
            onToggleOutlier={handleToggleOutlier}
            onResetOverrides={handleResetOverrides}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewTab
            report={report}
            hasData={hasData}
            onGoToUpload={() => setActiveTab('upload')}
            onJumpToTransactions={handleJumpToTransactions}
            onJumpToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringTab
            report={report}
            hasData={hasData}
            onGoToUpload={() => setActiveTab('upload')}
            onJumpToTransactions={handleJumpToTransactions}
            onJumpToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'behavior' && (
          <BehaviorTimingTab
            report={report}
            hasData={hasData}
            onGoToUpload={() => setActiveTab('upload')}
            onJumpToTransactions={handleJumpToTransactions}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorTab
            report={report}
            hasData={hasData}
            onGoToUpload={() => setActiveTab('upload')}
          />
        )}

        {/* Bottom Step-by-Step Page Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto">
            {prevPage ? (
              <button
                type="button"
                onClick={() => setActiveTab(prevPage.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous: {prevPage.title}</span>
              </button>
            ) : (
              <span className="hidden sm:inline text-xs text-slate-500">
                Page 1 of 6
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400">
            Viewing:{' '}
            <strong className="text-white">
              {NAV_PAGES[currentPageIndex]?.title}
            </strong>
          </div>

          <div className="w-full sm:w-auto">
            {nextPage && (
              <button
                type="button"
                onClick={() => setActiveTab(nextPage.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition"
              >
                <span>Next: {nextPage.title}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

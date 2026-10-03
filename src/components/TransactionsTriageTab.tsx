import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Tag,
  ShieldAlert,
  Check,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Sparkles,
  Globe,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaOfConcern,
  CategoryId,
  DiagnosticReport,
  Transaction,
  UserOverrides,
} from '../types/finance';
import {
  ALL_CATEGORIES,
  CATEGORY_META,
  lookupMerchantCategoryOnline,
  normalizeMerchantAndClassify,
} from '../utils/categories';
import { EmptyCsvState, PageExplainerHeader } from './ExplainerUi';

interface TransactionsTriageTabProps {
  report: DiagnosticReport;
  hasData: boolean;
  onGoToUpload: () => void;
  overrides: UserOverrides;
  initialFilterPreset?: AreaOfConcern['filterPreset'] | null;
  onClearPreset: () => void;
  onUpdateCategory: (
    tx: Transaction,
    newCat: CategoryId,
    applyToAllMerchant: boolean
  ) => void;
  onBatchSaveMerchantRules: (newRules: Record<string, CategoryId>) => void;
  onToggleOutlier: (tx: Transaction) => void;
  onResetOverrides: () => void;
}

interface DurationBucket {
  key: string;
  label: string;
  subLabel: string;
  incomings: number;
  everydayOutgoings: number;
  oneOffOutgoings: number;
  totalOutgoings: number;
  net: number;
}

export const TransactionsTriageTab: React.FC<TransactionsTriageTabProps> = ({
  report,
  hasData,
  onGoToUpload,
  overrides,
  initialFilterPreset,
  onClearPreset,
  onUpdateCategory,
  onBatchSaveMerchantRules,
  onToggleOutlier,
  onResetOverrides,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<
    | 'all'
    | 'uncategorized'
    | 'general'
    | 'education'
    | 'credit_cards'
    | 'micro'
    | 'recurring'
    | 'bnpl'
    | 'fees'
    | 'outlier'
    | 'transfer'
  >('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [applyMerchantRuleDefault, setApplyMerchantRuleDefault] = useState<boolean>(true);
  const [chartGranularity, setChartGranularity] = useState<'monthly' | 'weekly'>('monthly');

  // Smart Merchant Lookup state
  const [isLookingUpBatch, setIsLookingUpBatch] = useState<boolean>(false);
  const [lookupStatusMsg, setLookupStatusMsg] = useState<string | null>(null);
  const [testMerchantInput, setTestMerchantInput] = useState<string>('');
  const [isTestingSingle, setIsTestingSingle] = useState<boolean>(false);
  const [singleLookupResult, setSingleLookupResult] = useState<{
    cleanedName: string;
    category: CategoryId;
    reason: string;
  } | null>(null);

  useEffect(() => {
    if (!initialFilterPreset) return;
    if (initialFilterPreset.type === 'micro') {
      setQuickFilter('micro');
      setSelectedCategory('all');
      setSearchQuery('');
    } else if (initialFilterPreset.type === 'bnpl') {
      setQuickFilter('bnpl');
      setSelectedCategory('all');
      setSearchQuery('');
    } else if (initialFilterPreset.type === 'fees') {
      setQuickFilter('fees');
      setSelectedCategory('all');
      setSearchQuery('');
    } else if (initialFilterPreset.type === 'outlier') {
      setQuickFilter('outlier');
      setSelectedCategory('all');
      setSearchQuery('');
    } else if (initialFilterPreset.type === 'recurring') {
      setQuickFilter('recurring');
      setSelectedCategory('all');
      setSearchQuery('');
    } else if (initialFilterPreset.type === 'category' && initialFilterPreset.value) {
      setQuickFilter('all');
      setSelectedCategory(initialFilterPreset.value as CategoryId);
      setSearchQuery('');
    } else if (initialFilterPreset.type === 'merchant' && initialFilterPreset.value) {
      setQuickFilter('all');
      setSelectedCategory('all');
      setSearchQuery(initialFilterPreset.value);
    }
  }, [initialFilterPreset]);

  const terms = [
    {
      term: 'Merchant Auto-Lookup & Categorization',
      meaning:
        'Automatically cleans messy bank codes (like "POS W/D 4821") and assigns each merchant to a category using our built-in brand database, industry keywords, and live online business directory lookup.',
    },
    {
      term: 'General vs. Uncategorized',
      meaning:
        '"General & Everyday Services" is for known general spending (like haircuts, post office, dry cleaning, pet care, or trades). "Uncategorized (Needs Review)" is strictly for unrecognized merchant names that still need a category.',
    },
    {
      term: 'Education, Tuition & Courses',
      meaning:
        'A dedicated category for schools, university/polytechnic tuition, student loans, childcare/kindergarten, tutoring, and online courses.',
    },
    {
      term: 'All Outgoings (Including One-Offs)',
      meaning:
        '100% of your spending across the CSV duration—combining regular bills, everyday spending, AND rare one-off big purchases.',
    },
  ];

  // Uncategorized transactions & unique merchant names
  const uncategorizedTxs = useMemo(
    () => report.transactions.filter((t) => t.category === 'uncategorized'),
    [report.transactions]
  );

  const uniqueUncategorizedMerchants = useMemo(() => {
    const set = new Set<string>();
    for (const t of uncategorizedTxs) {
      set.add(t.normalizedMerchant);
    }
    return Array.from(set);
  }, [uncategorizedTxs]);

  const autoCategorizedCount =
    report.transactions.length - uncategorizedTxs.length;
  const autoCategorizedPct =
    report.transactions.length > 0
      ? Math.round((autoCategorizedCount / report.transactions.length) * 100)
      : 100;

  // Handle batch online lookup of all currently uncategorized merchants
  const handleAutoLookupUncategorized = async () => {
    if (uniqueUncategorizedMerchants.length === 0) return;
    setIsLookingUpBatch(true);
    setLookupStatusMsg(null);

    const discoveredRules: Record<string, CategoryId> = {};
    let matchedCount = 0;

    for (const merch of uniqueUncategorizedMerchants.slice(0, 15)) {
      const onlineHit = await lookupMerchantCategoryOnline(merch);
      if (onlineHit && onlineHit.category !== 'uncategorized') {
        discoveredRules[merch.toLowerCase()] = onlineHit.category;
        matchedCount++;
      }
    }

    setIsLookingUpBatch(false);
    if (matchedCount > 0) {
      onBatchSaveMerchantRules(discoveredRules);
      setLookupStatusMsg(
        `Looked up and auto-assigned ${matchedCount} merchant(s) using the online business directory!`
      );
    } else {
      setLookupStatusMsg(
        `Could not find exact public directory matches for the remaining ${uniqueUncategorizedMerchants.length} merchant(s). Select a category from their dropdown once and we'll remember it forever.`
      );
    }
  };

  // Handle testing/looking up any merchant name typed by the user
  const handleSingleMerchantLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMerchantInput.trim()) return;
    setIsTestingSingle(true);
    setSingleLookupResult(null);

    // First test local brand & keyword engine
    const localResult = normalizeMerchantAndClassify(
      testMerchantInput,
      '',
      '',
      -25,
      overrides.merchantCategoryRules
    );

    if (localResult.category !== 'uncategorized') {
      setSingleLookupResult({
        cleanedName: localResult.normalizedMerchant,
        category: localResult.category,
        reason: localResult.matchReason,
      });
      setIsTestingSingle(false);
      return;
    }

    // Otherwise query online place/business directory
    const onlineHit = await lookupMerchantCategoryOnline(
      localResult.normalizedMerchant
    );
    if (onlineHit) {
      setSingleLookupResult({
        cleanedName: localResult.normalizedMerchant,
        category: onlineHit.category,
        reason: onlineHit.matchedPlaceType,
      });
    } else {
      setSingleLookupResult({
        cleanedName: localResult.normalizedMerchant,
        category: 'uncategorized',
        reason: 'Not found in directory — pick a category below to save as a rule',
      });
    }
    setIsTestingSingle(false);
  };

  // Build duration buckets for the top Bar Chart
  const durationBuckets: DurationBucket[] = useMemo(() => {
    if (report.transactions.length === 0) return [];

    if (chartGranularity === 'monthly') {
      return report.monthlyBreakdowns.map((m) => ({
        key: m.monthKey,
        label: m.label,
        subLabel: m.monthKey,
        incomings: m.income,
        everydayOutgoings: m.totalCoreSpend,
        oneOffOutgoings: m.outlierSpend,
        totalOutgoings: m.totalRawSpend,
        net: m.netCashFlow,
      }));
    }

    const startMs = report.transactions[0].timestamp;
    const bucketsMap = new Map<number, DurationBucket>();

    for (const tx of report.transactions) {
      const weekIdx = Math.floor((tx.timestamp - startMs) / (7 * 86400000));
      if (!bucketsMap.has(weekIdx)) {
        const wStart = new Date(startMs + weekIdx * 7 * 86400000)
          .toISOString()
          .slice(5, 10);
        bucketsMap.set(weekIdx, {
          key: `wk-${weekIdx}`,
          label: `W${weekIdx + 1}`,
          subLabel: wStart,
          incomings: 0,
          everydayOutgoings: 0,
          oneOffOutgoings: 0,
          totalOutgoings: 0,
          net: 0,
        });
      }
      const b = bucketsMap.get(weekIdx)!;
      if (tx.amount > 0) {
        b.incomings += tx.absAmount;
      } else if (tx.amount < 0) {
        if (tx.isOutlier) {
          b.oneOffOutgoings += tx.absAmount;
        } else {
          b.everydayOutgoings += tx.absAmount;
        }
      }
      b.totalOutgoings = b.everydayOutgoings + b.oneOffOutgoings;
      b.net = b.incomings - b.totalOutgoings;
    }

    return Array.from(bucketsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, val]) => val);
  }, [report.transactions, report.monthlyBreakdowns, chartGranularity]);

  const filteredTransactions = useMemo(() => {
    return [...report.transactions]
      .reverse()
      .filter((t) => {
        if (quickFilter === 'uncategorized' && t.category !== 'uncategorized')
          return false;
        if (quickFilter === 'general' && t.category !== 'general') return false;
        if (quickFilter === 'education' && t.category !== 'education') return false;
        if (quickFilter === 'credit_cards' && t.category !== 'credit_cards')
          return false;
        if (quickFilter === 'micro' && !t.isMicroSpend) return false;
        if (quickFilter === 'recurring' && !t.isRecurring) return false;
        if (quickFilter === 'bnpl' && !t.isBNPL) return false;
        if (quickFilter === 'fees' && !t.isFee) return false;
        if (quickFilter === 'outlier' && !t.isOutlier) return false;
        if (quickFilter === 'transfer' && t.category !== 'transfer') return false;

        if (selectedCategory !== 'all' && t.category !== selectedCategory)
          return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const hay =
            `${t.normalizedMerchant} ${t.rawMerchant} ${t.description} ${t.reference} ${t.date}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [report.transactions, quickFilter, selectedCategory, searchQuery]);

  const filteredStats = useMemo(() => {
    let inTotal = 0;
    let outTotal = 0;
    for (const t of filteredTransactions) {
      if (t.amount > 0) inTotal += t.absAmount;
      else if (t.amount < 0) outTotal += t.absAmount;
    }
    return {
      inTotal,
      outTotal,
      net: inTotal - outTotal,
    };
  }, [filteredTransactions]);

  const c = report.currencySymbol;
  const maxBucketVal = Math.max(
    1,
    ...durationBuckets.map((b) => Math.max(b.incomings, b.totalOutgoings))
  );

  const customRuleCount =
    Object.keys(overrides.merchantCategoryRules).length +
    Object.keys(overrides.txCategoryOverrides).length +
    Object.keys(overrides.txOutlierOverrides).length;

  return (
    <div className="space-y-7">
      <PageExplainerHeader
        stepNumber={2}
        title="All Transactions, Summary & Smart Merchant Lookup"
        subtitle={
          hasData
            ? `Complete record of all ${report.transactions.length} transactions from ${report.startDate} to ${report.endDate} (${report.totalDays} days), with automatic merchant lookup and full incomings vs. outgoings bar chart.`
            : 'View your complete financial picture—including all incomings, all outgoings (even one-off big purchases), a full-duration bar chart, and automatic merchant category lookup.'
        }
        terms={terms}
      />

      {/* Interactive Merchant Lookup & Rule Tester (Available even before uploading a CSV!) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-400" />
              <span>Smart Merchant Lookup &amp; Auto-Categorizer</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Our 3-layer engine looks up merchant names using (1) 500+ known brands, (2)
              industry keywords (schools, cafés, medical, trades), and (3) a live online
              business directory.
            </p>
          </div>

          {hasData && (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200">
                Auto-Matched:{' '}
                <strong className="text-emerald-400">
                  {autoCategorizedCount}/{report.transactions.length} ({autoCategorizedPct}%)
                </strong>{' '}
                • Uncategorized:{' '}
                <strong
                  className={
                    uncategorizedTxs.length > 0
                      ? 'text-yellow-300'
                      : 'text-emerald-400'
                  }
                >
                  {uncategorizedTxs.length}
                </strong>
              </span>

              {uniqueUncategorizedMerchants.length > 0 && (
                <button
                  type="button"
                  disabled={isLookingUpBatch}
                  onClick={handleAutoLookupUncategorized}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition"
                >
                  {isLookingUpBatch ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Looking Up Merchants...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>
                        Auto-Lookup {uniqueUncategorizedMerchants.length} Uncategorized
                        Merchant(s)
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {lookupStatusMsg && (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{lookupStatusMsg}</span>
          </div>
        )}

        {/* Test / Look Up Any Merchant Name Bar */}
        <form
          onSubmit={handleSingleMerchantLookup}
          className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <input
            type="text"
            value={testMerchantInput}
            onChange={(e) => setTestMerchantInput(e.target.value)}
            placeholder="Type any merchant name from a bank statement to look up its category (e.g., POS W/D University Bookshop, Vivo Hair, Countdown)..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isTestingSingle || !testMerchantInput.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-semibold text-emerald-300 transition shrink-0"
          >
            {isTestingSingle ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            <span>Look Up Merchant</span>
          </button>
        </form>

        {singleLookupResult && (
          <div className="mt-3 rounded-xl bg-slate-950 border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Cleaned Name:</span>{' '}
              <strong className="text-white">{singleLookupResult.cleanedName}</strong>
              <span className="mx-2 text-slate-600">•</span>
              <span className="text-slate-400">How it matched:</span>{' '}
              <span className="text-emerald-300">{singleLookupResult.reason}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Assigned Category:</span>
              <select
                value={singleLookupResult.category}
                onChange={(e) => {
                  const newCat = e.target.value as CategoryId;
                  setSingleLookupResult({
                    ...singleLookupResult,
                    category: newCat,
                    reason: 'Saved to your custom merchant rules',
                  });
                  onBatchSaveMerchantRules({
                    [singleLookupResult.cleanedName.toLowerCase()]: newCat,
                  });
                }}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold bg-slate-900 ${
                  CATEGORY_META[singleLookupResult.category].bgClass
                } ${CATEGORY_META[singleLookupResult.category].textClass}`}
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    className="bg-slate-900 text-white"
                  >
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {!hasData ? (
        <EmptyCsvState
          pageTitle="All Transactions & Account Summary"
          whatYouWillSee={[
            'A complete summary at the top showing Total Incomings, Total Outgoings (including all one-offs), and Net Difference.',
            'A clear Bar Chart of all Incomings vs. Outgoings across the entire duration of your CSV.',
            'Automatic merchant lookup into 21 categories (including Education, General Services, and Uncategorized).',
          ]}
          onGoToUpload={onGoToUpload}
        />
      ) : (
        <>
          {/* 1. Complete Summary Cards at the Top (Regardless of Category) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 sm:p-5">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>Total Income (All Categories)</span>
                <ArrowDownLeft className="h-4 w-4 text-emerald-400 shrink-0" />
              </div>
              <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-400 font-mono">
                {c}
                {report.totalIncome.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5">
                Avg{' '}
                <strong className="text-white font-mono">
                  {c}
                  {report.monthlyIncomeAvg.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                  /mo
                </strong>{' '}
                (100% of money in).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 sm:p-5">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>Total Outgoings (All Categories)</span>
                <ArrowUpRight className="h-4 w-4 text-amber-400 shrink-0" />
              </div>
              <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-white font-mono">
                {c}
                {report.totalRawSpend.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5">
                Avg{' '}
                <strong className="text-white font-mono">
                  {c}
                  {report.monthlyRawSpendAvg.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                  /mo
                </strong>{' '}
                (100% of money out).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 sm:p-5">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>One-Off Big Purchases</span>
                <ShieldAlert className="h-4 w-4 text-indigo-400 shrink-0" />
              </div>
              <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-indigo-300 font-mono">
                {c}
                {report.totalOutlierSpend.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5">
                {report.outliers.length} one-off{' '}
                {report.outliers.length === 1 ? 'item' : 'items'} (included in Total
                Outgoings).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 sm:p-5">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>Net Left Over (In minus Out)</span>
                <Wallet className="h-4 w-4 text-sky-400 shrink-0" />
              </div>
              <div
                className={`mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono ${
                  report.netCashFlowTotal >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {report.netCashFlowTotal >= 0 ? '+' : ''}
                {c}
                {report.netCashFlowTotal.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5">
                Avg{' '}
                <strong className="text-white font-mono">
                  {report.monthlyNetCashFlowAvg >= 0 ? '+' : ''}
                  {c}
                  {report.monthlyNetCashFlowAvg.toFixed(0)}/mo
                </strong>{' '}
                after all outgoings.
              </p>
            </div>
          </div>

          {/* 2. Prominent Bar Chart of All Incomings and Outgoings Across the Full Duration */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  <span>
                    Incomings vs. Outgoings Bar Chart ({report.startDate} to{' '}
                    {report.endDate})
                  </span>
                </h3>
                <p className="text-sm text-slate-300 mt-0.5">
                  Compares all money coming in against all money going out (including
                  regular bills, everyday spending, and one-off big purchases) across the
                  full duration of your file.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-emerald-500 inline-block" />
                    Incomings (Money In)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-amber-500 inline-block" />
                    Everyday &amp; Bills Out
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-indigo-500 inline-block" />
                    One-Off Big Purchases
                  </span>
                </div>

                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setChartGranularity('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      chartGranularity === 'monthly'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    By Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartGranularity('weekly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      chartGranularity === 'weekly'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    By Week
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-5 overflow-x-auto">
              <div
                className="grid gap-3 items-end min-w-[520px]"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(
                    1,
                    durationBuckets.length
                  )}, minmax(0, 1fr))`,
                }}
              >
                {durationBuckets.map((b) => {
                  const inHeightPct = Math.max(
                    b.incomings > 0 ? 4 : 0,
                    (b.incomings / maxBucketVal) * 100
                  );
                  const totalOutHeightPct = Math.max(
                    b.totalOutgoings > 0 ? 4 : 0,
                    (b.totalOutgoings / maxBucketVal) * 100
                  );
                  const oneOffShareOfOut =
                    b.totalOutgoings > 0
                      ? (b.oneOffOutgoings / b.totalOutgoings) * 100
                      : 0;
                  const everydayShareOfOut = 100 - oneOffShareOfOut;

                  return (
                    <div
                      key={b.key}
                      className="flex flex-col items-center justify-end h-56 group"
                    >
                      <div className="text-[10px] font-mono text-center mb-1.5 leading-tight">
                        <div className="text-emerald-400 font-semibold">
                          +{c}
                          {b.incomings.toFixed(0)}
                        </div>
                        <div className="text-amber-300 font-semibold">
                          -{c}
                          {b.totalOutgoings.toFixed(0)}
                        </div>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1.5 h-36 px-1 border-b border-slate-800">
                        <div
                          className="w-full max-w-[28px] bg-emerald-500 rounded-t-md transition-all"
                          style={{ height: `${inHeightPct}%` }}
                          title={`${b.label} Incomings: ${c}${b.incomings.toFixed(2)}`}
                        />

                        <div
                          className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all"
                          style={{ height: `${totalOutHeightPct}%` }}
                          title={`${b.label} Total Outgoings: ${c}${b.totalOutgoings.toFixed(
                            2
                          )} (Everyday & Bills: ${c}${b.everydayOutgoings.toFixed(
                            2
                          )}, One-Offs: ${c}${b.oneOffOutgoings.toFixed(2)})`}
                        >
                          {b.oneOffOutgoings > 0 && (
                            <div
                              className="w-full bg-indigo-500"
                              style={{ height: `${oneOffShareOfOut}%` }}
                            />
                          )}
                          <div
                            className="w-full bg-amber-500"
                            style={{ height: `${everydayShareOfOut}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 text-center">
                        <div className="text-xs font-bold text-white">{b.label}</div>
                        {chartGranularity === 'weekly' && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {b.subLabel}
                          </div>
                        )}
                        <div
                          className={`text-[10px] font-mono font-semibold mt-0.5 ${
                            b.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {b.net >= 0 ? '+' : ''}
                          {c}
                          {b.net.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Filter & Categorize Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Tag className="h-4 w-4 text-emerald-400" />
                <span>Search, Filter &amp; Categorize Individual Transactions</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyMerchantRuleDefault}
                    onChange={(e) =>
                      setApplyMerchantRuleDefault(e.target.checked)
                    }
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>
                    When I change a category, apply it to all payments from that
                    merchant
                  </span>
                </label>

                {customRuleCount > 0 && (
                  <button
                    onClick={onResetOverrides}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 px-3.5 py-2 text-xs font-semibold text-rose-300 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset {customRuleCount} Custom Change(s)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4 relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    onClearPreset();
                  }}
                  placeholder="Search merchant name or date..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3 flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value as CategoryId | 'all');
                    onClearPreset();
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="all">All Categories</option>
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-5 flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `All (${report.transactions.length})` },
                  {
                    id: 'uncategorized',
                    label: `Uncategorized (${uncategorizedTxs.length})`,
                  },
                  { id: 'credit_cards', label: 'Credit Cards' },
                  { id: 'education', label: 'Education' },
                  { id: 'general', label: 'General' },
                  {
                    id: 'outlier',
                    label: `One-Offs (${report.outliers.length})`,
                  },
                  { id: 'recurring', label: 'Regular Bills' },
                  { id: 'micro', label: `Small Buys ≤${c}18` },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setQuickFilter(p.id as typeof quickFilter);
                      onClearPreset();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      quickFilter === p.id
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Transactions Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 text-xs text-slate-300">
              <span>
                Showing{' '}
                <strong className="text-white">
                  {filteredTransactions.length}
                </strong>{' '}
                of {report.transactions.length} transactions
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] sm:text-xs">
                <span>
                  All Income:{' '}
                  <strong className="text-emerald-400">
                    +{c}
                    {report.totalIncome.toFixed(2)}
                  </strong>
                </span>
                <span>
                  All Outgoings:{' '}
                  <strong className="text-amber-300">
                    -{c}
                    {report.totalRawSpend.toFixed(2)}
                  </strong>
                </span>
                {filteredTransactions.length !== report.transactions.length && (
                  <span className="text-slate-400">
                    (Filtered: +{c}
                    {filteredStats.inTotal.toFixed(2)} / -{c}
                    {filteredStats.outTotal.toFixed(2)})
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Merchant / Description</th>
                    <th className="py-3 px-3">
                      Category &amp; How It Was Matched
                    </th>
                    <th className="py-3 px-3 text-center">
                      One-Off Big Purchase?
                    </th>
                    <th className="py-3 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredTransactions.map((tx) => {
                    const catMeta = CATEGORY_META[tx.category];
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-800/40 transition text-slate-200"
                      >
                        <td className="py-3 px-3 font-mono text-xs whitespace-nowrap text-slate-300">
                          {tx.date}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">
                            {tx.normalizedMerchant}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[300px]">
                            {tx.rawMerchant}
                            {tx.description ? ` • ${tx.description}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={tx.category}
                            onChange={(e) =>
                              onUpdateCategory(
                                tx,
                                e.target.value as CategoryId,
                                applyMerchantRuleDefault
                              )
                            }
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold bg-slate-950 cursor-pointer ${catMeta.bgClass} ${catMeta.textClass}`}
                          >
                            {ALL_CATEGORIES.map((cat) => (
                              <option
                                key={cat.id}
                                value={cat.id}
                                className="bg-slate-900 text-white"
                              >
                                {cat.label}
                              </option>
                            ))}
                          </select>
                          {tx.matchReason && (
                            <div className="text-[11px] text-slate-400 mt-1">
                              {tx.matchReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {tx.type === 'expense' && (
                            <button
                              type="button"
                              onClick={() => onToggleOutlier(tx)}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
                                tx.isOutlier
                                  ? 'bg-indigo-500/25 border-indigo-500/50 text-indigo-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {tx.isOutlier ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-indigo-300" />
                                  <span>Yes (One-Off)</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                  <span>Normal</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${
                            tx.type === 'transfer'
                              ? 'text-slate-400'
                              : tx.amount >= 0
                              ? 'text-emerald-400'
                              : 'text-white'
                          }`}
                        >
                          {tx.amount >= 0 ? '+' : '-'}
                          {c}
                          {tx.absAmount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

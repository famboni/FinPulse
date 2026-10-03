import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Sliders,
  Lightbulb,
} from 'lucide-react';
import { AreaOfConcern, DiagnosticReport } from '../types/finance';
import { EmptyCsvState, PageExplainerHeader } from './ExplainerUi';

interface OverviewTabProps {
  report: DiagnosticReport;
  hasData: boolean;
  onGoToUpload: () => void;
  onJumpToTransactions: (preset: AreaOfConcern['filterPreset']) => void;
  onJumpToSimulator: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  report,
  hasData,
  onGoToUpload,
  onJumpToTransactions,
  onJumpToSimulator,
}) => {
  const [expandedAlertIds, setExpandedAlertIds] = useState<Record<string, boolean>>({});
  const [showScoreMath, setShowScoreMath] = useState<boolean>(false);
  const c = report.currencySymbol;

  const toggleAlertDetails = (id: string) => {
    setExpandedAlertIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const terms = [
    {
      term: 'Money In (Monthly Average)',
      meaning:
        'The average amount of salary, wages, and deposits coming into your account each month.',
    },
    {
      term: 'All Money Out (Monthly Average)',
      meaning:
        'Your complete average monthly spending—including regular bills, everyday spending, AND one-off big purchases—so Money In minus Money Out always equals Left Over.',
    },
    {
      term: 'Left Over Each Month',
      meaning:
        'Money In minus All Money Out. Positive (+) means you saved money on average; negative (-) means you spent more than came in.',
    },
    {
      term: 'Financial Health Score (Out of 100)',
      meaning:
        'A fixed 100-point score calculated from 5 areas: how much you save (25 pts), how manageable your regular bills are (20 pts), subscriptions (20 pts), impulse/bank fees (20 pts), and bill timing (15 pts).',
    },
  ];

  if (!hasData) {
    return (
      <div>
        <PageExplainerHeader
          stepNumber={3}
          title="Red Flags, Areas of Concern & Health Score"
          subtitle="Highlights specific patterns in your bank account that may be costing you extra money, along with simple step-by-step advice on how to fix each one."
          terms={terms}
        />
        <EmptyCsvState
          pageTitle="Red Flags & Areas of Concern"
          whatYouWillSee={[
            'Your Financial Health Score out of 100 (with a clear breakdown of how the points are calculated).',
            'A plain-English list of Red Flags & Areas of Concern found in your CSV.',
            'Simple, step-by-step practical advice on how to fix each concern.',
          ]}
          onGoToUpload={onGoToUpload}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageExplainerHeader
        stepNumber={3}
        title="Red Flags, Areas of Concern & Health Score"
        subtitle="Here is your monthly summary, your Financial Health Score, and the main areas of concern we spotted—with clear, step-by-step suggestions for what to do next."
        terms={terms}
      />

      {/* 4 Consistent Top Summary Cards (Money In - All Money Out = Left Over) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* 1. Money In */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-5">
          <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Income (All Categories)
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-400 font-mono">
            {c}
            {report.totalIncome.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5 leading-relaxed">
            Monthly Avg: {c}
            {report.monthlyIncomeAvg.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            /mo across {report.monthsSpan} months.
          </p>
        </div>

        {/* 2. All Money Out (Including One-Offs so math always adds up) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-5">
          <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Outgoings (All Categories)
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-white font-mono">
            {c}
            {report.totalRawSpend.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5 leading-relaxed">
            Monthly Avg: {c}
            {report.monthlyRawSpendAvg.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            /mo (all spending &amp; bills).
          </p>
        </div>

        {/* 3. Left Over Each Month */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-5">
          <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
            Net Left Over (In minus Out)
          </div>
          <div
            className={`mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono ${
              report.netCashFlowTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {report.netCashFlowTotal >= 0 ? '+' : ''}
            {c}
            {report.netCashFlowTotal.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5 leading-relaxed">
            Monthly Avg: {report.monthlyNetCashFlowAvg >= 0 ? '+' : ''}
            {c}
            {report.monthlyNetCashFlowAvg.toFixed(0)}/mo ({report.savingsRatePercent}%).
          </p>
        </div>

        {/* 4. Financial Health Score with Transparent Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Health Score
            </span>
            <button
              type="button"
              onClick={() => setShowScoreMath(!showScoreMath)}
              className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 hover:underline"
            >
              {showScoreMath ? 'Hide' : 'How scored?'}
            </button>
          </div>
          <div className="mt-1.5 sm:mt-2 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white font-mono">
              {report.healthScore}
            </span>
            <span className="text-xs sm:text-sm text-slate-400">/100</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                report.healthScore >= 75
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : report.healthScore >= 55
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              Grade {report.healthGrade}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5 leading-relaxed">
            Calculated from your uploaded CSV.
          </p>
        </div>
      </div>

      {/* Expandable Financial Health Score Breakdown (so it never feels mysterious) */}
      {showScoreMath && (
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5">
          <h4 className="text-sm font-bold text-white mb-3">
            How Your {report.healthScore}/100 Financial Health Score Is Calculated
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="font-semibold text-emerald-300">
                1. Monthly Savings ({report.scoreBreakdown.cashFlowMargin} / 25 pts)
              </div>
              <p className="text-slate-400 mt-1">
                Based on saving {report.savingsRatePercent}% of your income (saving 20%+
                earns full points).
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="font-semibold text-sky-300">
                2. Regular Bill Load ({report.scoreBreakdown.fixedLoadHealth} / 20 pts)
              </div>
              <p className="text-slate-400 mt-1">
                {report.fixedCostLoadPercent}% of your income goes to fixed essentials
                (keeping this under 50% earns full points).
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="font-semibold text-purple-300">
                3. Subscriptions ({report.scoreBreakdown.subscriptionHygiene} / 20 pts)
              </div>
              <p className="text-slate-400 mt-1">
                Points are deducted for free-trial traps, price hikes, or paying for
                duplicate streaming apps.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="font-semibold text-amber-300">
                4. Fees &amp; Impulse ({report.scoreBreakdown.impulseAndFeeControl} / 20 pts)
              </div>
              <p className="text-slate-400 mt-1">
                Points are deducted for bank overdraft fees, Buy Now Pay Later debt, and
                post-payday spending spikes.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="font-semibold text-teal-300">
                5. Bill Timing ({report.scoreBreakdown.timingStability} / 15 pts)
              </div>
              <p className="text-slate-400 mt-1">
                Full points when bills don&apos;t push your account balance near $0 right
                before payday.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Areas of Concern with Clear, Non-Financial Suggested Fixes */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-white">
            Areas of Concern Found in Your Account ({report.areasOfConcern.length})
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            Each card explains what we noticed in plain English and gives you a practical,
            step-by-step suggestion on how to fix it.
          </p>
        </div>

        {report.areasOfConcern.length === 0 ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-bold text-emerald-200">
              No Major Red Flags Found
            </h4>
            <p className="text-sm text-slate-300 mt-1">
              Your bills, spending pace, and account balance look steady across this period.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {report.areasOfConcern.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const isWarn = alert.severity === 'warning';
              const isExpanded = Boolean(expandedAlertIds[alert.id]);

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-5 transition ${
                    isCrit
                      ? 'border-rose-500/40 bg-rose-950/15'
                      : isWarn
                      ? 'border-amber-500/35 bg-amber-950/10'
                      : 'border-indigo-500/35 bg-indigo-950/10'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isCrit
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isWarn
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          }`}
                        >
                          {isCrit ? (
                            <AlertOctagon className="h-3.5 w-3.5" />
                          ) : isWarn ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <Info className="h-3.5 w-3.5" />
                          )}
                          {isCrit
                            ? 'High Priority'
                            : isWarn
                            ? 'Worth Reviewing'
                            : 'Helpful Planning Tip'}
                        </span>

                        <h4 className="text-base font-bold text-white">{alert.title}</h4>
                      </div>

                      <p className="text-sm text-slate-200 leading-relaxed">
                        {alert.summary}
                      </p>

                      {/* Clear, Plain-English "How to Fix This" Box */}
                      <div className="rounded-xl bg-emerald-950/35 border border-emerald-500/30 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1">
                          <Lightbulb className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>How to Fix This (Step-by-Step):</span>
                        </div>
                        <p className="text-sm text-emerald-100 leading-relaxed">
                          {alert.recommendation}
                        </p>
                      </div>
                    </div>

                    {/* Right Side Impact + Buttons */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-slate-400">Potential Monthly Saving</div>
                        <div className="text-xl font-extrabold text-white font-mono">
                          {c}
                          {alert.impactMonthly.toFixed(0)}/month
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          ({c}
                          {alert.impactAnnual.toFixed(0)}/year)
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAlertDetails(alert.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                        >
                          <span>{isExpanded ? 'Hide Proof' : 'See Proof'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {alert.filterPreset && (
                          <button
                            type="button"
                            onClick={() => onJumpToTransactions(alert.filterPreset)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition"
                          >
                            <Search className="h-3.5 w-3.5" />
                            <span>View Transactions</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Evidence Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/60 rounded-xl p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Transactions From Your CSV That Triggered This:
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        {alert.evidence.map((ev, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={onJumpToSimulator}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:underline"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                          <span>Try fixing this in the Savings Planner →</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

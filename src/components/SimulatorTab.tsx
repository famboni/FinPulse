import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Sparkles,
  CheckSquare,
  Square,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { DiagnosticReport } from '../types/finance';
import { EmptyCsvState, PageExplainerHeader } from './ExplainerUi';

interface SimulatorTabProps {
  report: DiagnosticReport;
  hasData: boolean;
  onGoToUpload: () => void;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  report,
  hasData,
  onGoToUpload,
}) => {
  const c = report.currencySymbol;

  const terms = [
    {
      term: 'Extra Money Saved Each Month',
      meaning:
        'How much additional money you would keep in your bank account each month if you make the changes selected on this page.',
    },
    {
      term: 'New Monthly Left Over',
      meaning:
        'Your current average monthly savings plus the extra savings unlocked by your selected changes.',
    },
    {
      term: 'Subscription Checklist',
      meaning:
        'Tick any subscription on the left to see how much you would save per month and per year by canceling it.',
    },
    {
      term: 'Habit Sliders',
      meaning:
        'Drag the sliders on the right to see what happens if you cut back slightly (for example, by 25% or 50%) on small daily purchases or post-payday spending.',
    },
  ];

  const cancellableSubs = useMemo(
    () =>
      report.recurringSeries.filter(
        (r) =>
          ![
            'housing',
            'utilities',
            'insurance',
            'education',
            'credit_cards',
          ].includes(r.category)
      ),
    [report.recurringSeries]
  );

  const [canceledSubIds, setCanceledSubIds] = useState<Record<string, boolean>>({});
  const [microTrimPercent, setMicroTrimPercent] = useState<number>(50);
  const [paydayCurbPercent, setPaydayCurbPercent] = useState<number>(50);
  const [bnplReductionPercent, setBnplReductionPercent] = useState<number>(100);
  const [eliminateFees, setEliminateFees] = useState<boolean>(true);

  if (!hasData) {
    return (
      <div>
        <PageExplainerHeader
          stepNumber={6}
          title="Savings Planner (What-If Calculator)"
          subtitle="Test how much money you could save each month and year by canceling selected subscriptions or trimming small daily spending habits."
          terms={terms}
        />
        <EmptyCsvState
          pageTitle="Savings Planner"
          whatYouWillSee={[
            'An interactive checklist of your detected subscriptions so you can see how much canceling any of them saves.',
            'Simple sliders to test cutting back on small purchases under $18 or post-payday impulse buys.',
            'A clear Before vs. After comparison of your monthly and yearly savings.',
          ]}
          onGoToUpload={onGoToUpload}
        />
      </div>
    );
  }

  const toggleSub = (id: string) => {
    setCanceledSubIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const applyRecommendedPreset = () => {
    const next: Record<string, boolean> = {};
    for (const s of cancellableSubs) {
      if (s.isTrialConversion || s.hasPriceCreep) next[s.id] = true;
    }
    setCanceledSubIds(next);
    setMicroTrimPercent(50);
    setPaydayCurbPercent(50);
    setBnplReductionPercent(100);
    setEliminateFees(true);
  };

  const resetAll = () => {
    setCanceledSubIds({});
    setMicroTrimPercent(0);
    setPaydayCurbPercent(0);
    setBnplReductionPercent(0);
    setEliminateFees(false);
  };

  const subSavingsMonthly = cancellableSubs.reduce(
    (sum, s) => (canceledSubIds[s.id] ? sum + s.monthlyEquivalent : sum),
    0
  );
  const microSavingsMonthly =
    (report.microSpend.monthlyAverage * microTrimPercent) / 100;
  const paydaySavingsMonthly =
    (report.paydaySpike.estimatedMonthlyExcess * paydayCurbPercent) / 100;
  const bnplSavingsMonthly =
    (report.bnplSummary.monthlyAvg * bnplReductionPercent) / 100;
  const feeSavingsMonthly = eliminateFees ? report.feesSummary.monthlyAvg : 0;

  const totalMonthlySavingsUnlocked = Number(
    (
      subSavingsMonthly +
      microSavingsMonthly +
      paydaySavingsMonthly +
      bnplSavingsMonthly +
      feeSavingsMonthly
    ).toFixed(2)
  );

  const totalAnnualSavingsUnlocked = Number(
    (totalMonthlySavingsUnlocked * 12).toFixed(2)
  );

  const currentMonthlyNet = report.monthlyNetCashFlowAvg;
  const projectedMonthlyNet = Number(
    (currentMonthlyNet + totalMonthlySavingsUnlocked).toFixed(2)
  );

  return (
    <div className="space-y-8">
      <PageExplainerHeader
        stepNumber={6}
        title="Savings Planner (What-If Calculator)"
        subtitle="Use the checkboxes and sliders below to experiment with changes and see how much extra money you would keep each month and year."
        terms={terms}
      />

      {/* Top Summary Banner */}
      <div className="rounded-2xl border border-emerald-500/35 bg-slate-900/90 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Your Simulated Savings Plan
            </div>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              Save an Extra{' '}
              <span className="text-emerald-400 font-mono">
                {c}
                {totalMonthlySavingsUnlocked.toFixed(0)} / month
              </span>{' '}
              ({c}
              {totalAnnualSavingsUnlocked.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{' '}
              / year)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={applyRecommendedPreset}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>Select Suggested Savings</span>
            </button>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset All to Zero</span>
            </button>
          </div>
        </div>

        {/* Simple Before vs After Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
            <div className="text-xs text-slate-400">Current Left Over Per Month</div>
            <div className="text-2xl font-extrabold text-slate-300 font-mono mt-1">
              {currentMonthlyNet >= 0 ? '+' : ''}
              {c}
              {currentMonthlyNet.toFixed(0)} / mo
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
            <div className="text-xs text-emerald-300">Extra Savings From Changes</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
              +{c}
              {totalMonthlySavingsUnlocked.toFixed(0)} / mo
            </div>
          </div>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
            <div className="text-xs text-emerald-200 font-semibold">
              New Left Over Per Month
            </div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-emerald-400" />
              <span>
                {projectedMonthlyNet >= 0 ? '+' : ''}
                {c}
                {projectedMonthlyNet.toFixed(0)} / mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Subscriptions on Left, Sliders on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Subscriptions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                1. Choose Subscriptions to Cancel
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Tick any subscription below to include its cost in your monthly savings.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-lg">
              +{c}
              {subSavingsMonthly.toFixed(2)}/mo
            </span>
          </div>

          {cancellableSubs.length === 0 ? (
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 text-sm text-slate-400">
              No optional subscriptions detected in this CSV.
            </div>
          ) : (
            <div className="space-y-2.5">
              {cancellableSubs.map((sub) => {
                const isChecked = Boolean(canceledSubIds[sub.id]);
                return (
                  <div
                    key={sub.id}
                    onClick={() => toggleSub(sub.id)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition ${
                      isChecked
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckSquare className="h-5 w-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-500 shrink-0" />
                      )}
                      <div>
                        <div className="text-sm font-bold text-white">
                          {sub.merchant}
                        </div>
                        <div className="text-xs text-slate-400">
                          {sub.functionalGroup} • Paid {sub.cadence}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-white">
                        {c}
                        {sub.monthlyEquivalent.toFixed(2)}/mo
                      </div>
                      <div className="text-xs text-slate-400">
                        {c}
                        {sub.annualizedCost.toFixed(0)}/yr
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Habit Sliders */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>2. Adjust Spending Habits</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Move the sliders to see how cutting back slightly affects your savings.
            </p>
          </div>

          {/* Slider 1: Small Daily Purchases */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-white">
                Reduce Small Purchases (Under {c}18) by {microTrimPercent}%
              </span>
              <span className="font-mono font-bold text-emerald-300">
                +{c}
                {microSavingsMonthly.toFixed(0)}/mo
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={microTrimPercent}
              onChange={(e) => setMicroTrimPercent(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1.5">
              <span>
                Currently spending: {c}
                {report.microSpend.monthlyAverage.toFixed(0)}/mo
              </span>
              <span>
                New target: {c}
                {(report.microSpend.monthlyAverage - microSavingsMonthly).toFixed(0)}/mo
              </span>
            </div>
          </div>

          {/* Slider 2: Post-Payday Spending */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-white">
                Reduce Post-Payday Impulse Spending by {paydayCurbPercent}%
              </span>
              <span className="font-mono font-bold text-emerald-300">
                +{c}
                {paydaySavingsMonthly.toFixed(0)}/mo
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={paydayCurbPercent}
              onChange={(e) => setPaydayCurbPercent(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1.5">
              <span>
                Current post-payday extra spend: {c}
                {report.paydaySpike.estimatedMonthlyExcess.toFixed(0)}/mo
              </span>
            </div>
          </div>

          {/* Slider 3: Buy Now, Pay Later */}
          {report.bnplSummary.monthlyAvg > 0 && (
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-white">
                  Reduce Buy Now, Pay Later Spending by {bnplReductionPercent}%
                </span>
                <span className="font-mono font-bold text-emerald-300">
                  +{c}
                  {bnplSavingsMonthly.toFixed(0)}/mo
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={25}
                value={bnplReductionPercent}
                onChange={(e) => setBnplReductionPercent(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          )}

          {/* Checkbox 4: Avoid Bank Fees */}
          {report.feesSummary.monthlyAvg > 0 && (
            <div
              onClick={() => setEliminateFees(!eliminateFees)}
              className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition ${
                eliminateFees
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {eliminateFees ? (
                  <CheckSquare className="h-5 w-5 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="h-5 w-5 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-bold text-white">
                    Eliminate Avoidable Bank &amp; Overdraft Fees
                  </div>
                  <div className="text-xs text-slate-400">
                    By moving bill dates to after payday
                  </div>
                </div>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-300">
                +{c}
                {report.feesSummary.monthlyAvg.toFixed(2)}/mo
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

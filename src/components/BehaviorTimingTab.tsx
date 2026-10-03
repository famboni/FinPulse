import React from 'react';
import {
  Activity,
  Coffee,
  Zap,
  Calendar,
  CreditCard,
  AlertTriangle,
  Search,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { AreaOfConcern, DiagnosticReport } from '../types/finance';
import { EmptyCsvState, PageExplainerHeader } from './ExplainerUi';

interface BehaviorTimingTabProps {
  report: DiagnosticReport;
  hasData: boolean;
  onGoToUpload: () => void;
  onJumpToTransactions: (preset: AreaOfConcern['filterPreset']) => void;
}

export const BehaviorTimingTab: React.FC<BehaviorTimingTabProps> = ({
  report,
  hasData,
  onGoToUpload,
  onJumpToTransactions,
}) => {
  const c = report.currencySymbol;

  const terms = [
    {
      term: 'Small Daily Purchases (Under $18)',
      meaning:
        'Quick, low-cost purchases like morning coffees, snacks, bakeries, or convenience stores. Individually small, they often add up to hundreds of dollars a month.',
    },
    {
      term: 'Post-Payday Spending Spike',
      meaning:
        'Measures whether you spend much faster in the first 3 days right after getting paid compared to the rest of the pay cycle.',
    },
    {
      term: 'Low-Balance Days Before Payday',
      meaning:
        'Days when a big bill comes out just 1 to 4 days before your paycheck arrives, pushing your account balance dangerously close to $0 (or into overdraft).',
    },
    {
      term: 'Weekend vs. Weekday Spending',
      meaning:
        'Compares your average daily flexible spending from Monday–Thursday against Friday–Sunday.',
    },
    {
      term: 'Buy Now, Pay Later (BNPL) & Bank Fees',
      meaning:
        'Tracks split-payment services (like Afterpay, Zip, Klarna) and avoidable bank fees (overdraft, dishonor, or foreign currency fees).',
    },
  ];

  if (!hasData) {
    return (
      <div>
        <PageExplainerHeader
          stepNumber={5}
          title="Spending Habits & Bill Timing"
          subtitle="Looks beyond basic categories to show how your daily habits, paycheck timing, and weekend routines affect your bank balance."
          terms={terms}
        />
        <EmptyCsvState
          pageTitle="Spending Habits & Bill Timing"
          whatYouWillSee={[
            'How much small purchases under $18 (coffees, snacks, convenience stops) cost you each month and year.',
            'Whether your spending spikes in the first 72 hours after payday.',
            'How much more you spend on weekends (Fri–Sun) compared to weekdays (Mon–Thu).',
            'Whether any bills are hitting right before payday and causing low balances or overdraft fees.',
          ]}
          onGoToUpload={onGoToUpload}
        />
      </div>
    );
  }

  const maxDaySpend = Math.max(
    1,
    ...report.dayOfWeekProfile.map((d) => d.avgDailySpend)
  );

  const maxCycleBar = Math.max(
    1,
    report.paydaySpike.postPaydayDailyAvg,
    report.paydaySpike.midCycleDailyAvg,
    report.paydaySpike.prePaydayDailyAvg
  );

  return (
    <div className="space-y-8">
      <PageExplainerHeader
        stepNumber={5}
        title="Spending Habits & Bill Timing"
        subtitle="Understand your daily spending habits, when you spend the most, and whether your bill dates line up safely with your paydays."
        terms={terms}
      />

      {/* Row 1: Small Daily Purchases (Micro-Spend) + Post-Payday Spending Spike */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Small Daily Purchases */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coffee className="h-5 w-5 text-amber-400" />
                <span>
                  Small Daily Purchases (Under {c}
                  {report.microSpend.threshold})
                </span>
              </h3>
              <button
                onClick={() => onJumpToTransactions({ type: 'micro' })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:underline"
              >
                <Search className="h-3.5 w-3.5" />
                <span>See All {report.microSpend.transactionCount} Purchases</span>
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-5">
              Small everyday stops at cafés, bakeries, fast food, and convenience stores
              that often go unnoticed.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                <div className="text-xs text-slate-400">How Often</div>
                <div className="text-xl font-extrabold text-white font-mono mt-1">
                  {report.microSpend.avgPerWeek}x / week
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {report.microSpend.transactionCount} total times
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                <div className="text-xs text-slate-400">Monthly Cost</div>
                <div className="text-xl font-extrabold text-amber-300 font-mono mt-1">
                  {c}
                  {report.microSpend.monthlyAverage.toFixed(0)}/mo
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Average per month
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                <div className="text-xs text-slate-400">Yearly Cost</div>
                <div className="text-xl font-extrabold text-rose-300 font-mono mt-1">
                  {c}
                  {report.microSpend.annualizedCost.toFixed(0)}/yr
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  At current pace
                </div>
              </div>
            </div>

            {report.microSpend.topMerchants.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Most Frequent Small-Purchase Places:
                </div>
                <div className="space-y-2">
                  {report.microSpend.topMerchants.map((m) => (
                    <div
                      key={m.merchant}
                      onClick={() =>
                        onJumpToTransactions({ type: 'merchant', value: m.merchant })
                      }
                      className="flex items-center justify-between rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 px-3.5 py-2.5 text-xs cursor-pointer transition"
                    >
                      <span className="font-semibold text-white">
                        {m.merchant}{' '}
                        <span className="font-normal text-slate-400">
                          ({m.count} visits)
                        </span>
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {c}
                        {m.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Post-Payday Spending Spike */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <span>Spending Right After Payday</span>
              </h3>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {report.paydaySpike.spikeRatio}x Normal Pace
              </span>
            </div>
            <p className="text-sm text-slate-300 mb-5">
              Compares how much you spend per day in the <strong>first 3 days after getting paid</strong>{' '}
              versus the rest of your pay cycle.
            </p>

            <div className="space-y-4">
              {[
                {
                  label: 'First 3 Days After Payday',
                  sub: 'Right after your paycheck lands',
                  val: report.paydaySpike.postPaydayDailyAvg,
                  color: 'bg-rose-500',
                },
                {
                  label: 'Middle of Pay Cycle',
                  sub: 'Days 4 to 10 after payday',
                  val: report.paydaySpike.midCycleDailyAvg,
                  color: 'bg-sky-500',
                },
                {
                  label: 'Last 3 Days Before Next Payday',
                  sub: 'When waiting for the next paycheck',
                  val: report.paydaySpike.prePaydayDailyAvg,
                  color: 'bg-emerald-500',
                },
              ].map((b) => (
                <div
                  key={b.label}
                  className="rounded-xl bg-slate-950/60 border border-slate-800 p-3.5"
                >
                  <div className="flex justify-between items-baseline mb-1.5">
                    <div>
                      <div className="text-sm font-bold text-white">{b.label}</div>
                      <div className="text-xs text-slate-400">{b.sub}</div>
                    </div>
                    <span className="font-mono text-base font-extrabold text-white">
                      {c}
                      {b.val.toFixed(0)} / day
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${b.color}`}
                      style={{ width: `${(b.val / maxCycleBar) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <strong>Takeaway:</strong> Slowing down impulse purchases during the first 3
            days after payday could save roughly{' '}
            <strong className="text-emerald-300">
              {c}
              {report.paydaySpike.estimatedMonthlyExcess.toFixed(0)} per month
            </strong>
            .
          </div>
        </div>
      </div>

      {/* Row 2: Weekend vs. Weekday Spending + Low-Balance Days Before Payday */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekend vs Weekday */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                <span>Weekend vs. Weekday Spending</span>
              </h3>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {report.weekendMultiplier}x Higher on Weekends
              </span>
            </div>
            <p className="text-sm text-slate-300 mb-5">
              On Monday–Thursday you average{' '}
              <strong className="text-white">
                {c}
                {report.weekdayDailyAvg.toFixed(0)}/day
              </strong>
              , compared to{' '}
              <strong className="text-purple-300">
                {c}
                {report.weekendDailyAvg.toFixed(0)}/day
              </strong>{' '}
              on Friday–Sunday (excluding rent and regular bills).
            </p>

            <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4 px-3 rounded-xl bg-slate-950/60 border border-slate-800 p-4">
              {report.dayOfWeekProfile.map((d) => {
                const hPct = Math.max(8, (d.avgDailySpend / maxDaySpend) * 100);
                return (
                  <div
                    key={d.dayName}
                    className="flex flex-col items-center justify-end h-full"
                  >
                    <span className="text-xs font-mono text-slate-200 mb-1.5">
                      {c}
                      {d.avgDailySpend.toFixed(0)}
                    </span>
                    <div className="w-full max-w-[34px] bg-slate-800 rounded-t-lg flex items-end h-24 overflow-hidden">
                      <div
                        className={`w-full rounded-t-lg ${
                          d.isWeekend ? 'bg-purple-500' : 'bg-sky-500/80'
                        }`}
                        style={{ height: `${hPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold mt-2 ${
                        d.isWeekend ? 'text-purple-300' : 'text-slate-400'
                      }`}
                    >
                      {d.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Low-Balance Days Before Payday (Bill Timing) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <span>Low-Balance Days Before Payday</span>
              </h3>
            </div>
            <p className="text-sm text-slate-300 mb-5">
              Checks if any big bills come out right before your paycheck arrives, causing
              your account balance to dip dangerously low.
            </p>

            {report.cashFlowTroughs.length > 0 ? (
              <div className="space-y-3">
                {report.cashFlowTroughs.map((t, idx) => (
                  <div
                    key={`${t.date}-${idx}`}
                    className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        Low Balance on {t.date}
                      </span>
                      <span className="text-xs font-mono font-bold text-white bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-lg">
                        Balance dropped to {c}
                        {t.balance.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                      <strong>{t.triggerMerchant}</strong> ({c}
                      {t.triggerAmount.toFixed(2)}) was charged just{' '}
                      <strong>{t.daysBeforePayday} day(s) before</strong> your{' '}
                      {t.nextPaydayDate} paycheck (+{c}
                      {t.nextPaydayAmount.toFixed(0)}).
                    </p>
                    <p className="text-xs text-emerald-300 mt-2 font-semibold">
                      How to fix: {t.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-3 text-sm text-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Good Bill Timing</div>
                  <p className="text-xs text-slate-200 mt-1">
                    None of your bills pushed your account balance below {c}280 in the days
                    leading up to payday.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Buy Now, Pay Later (BNPL) & Bank Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buy Now, Pay Later */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-rose-400" />
              <span>Buy Now, Pay Later (Afterpay, Zip, Klarna)</span>
            </h3>
            {report.bnplSummary.installmentCount > 0 && (
              <button
                onClick={() => onJumpToTransactions({ type: 'bnpl' })}
                className="text-xs font-semibold text-rose-300 hover:underline"
              >
                View {report.bnplSummary.installmentCount} Payments →
              </button>
            )}
          </div>
          <p className="text-sm text-slate-300 mb-4">
            Tracks split-payment shopping installments so you can see their true combined
            monthly cost.
          </p>

          {report.bnplSummary.installmentCount > 0 ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/15 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-200">
                  Total Paid:{' '}
                  <strong className="text-white font-mono">
                    {c}
                    {report.bnplSummary.totalSpend.toFixed(2)}
                  </strong>{' '}
                  ({c}
                  {report.bnplSummary.monthlyAvg.toFixed(0)}/month avg)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-xs font-bold">
                  Up to {report.bnplSummary.peakConcurrentWeekCount} payments in 1 week
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.bnplSummary.providers.map((p) => (
                  <span
                    key={p.name}
                    className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-200 font-mono"
                  >
                    {p.name}: {p.count} payments = {c}
                    {p.total.toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
              No Buy Now, Pay Later payments found in your CSV.
            </div>
          )}
        </div>

        {/* Bank Fees & Penalties */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <span>Bank Fees, Overdrafts &amp; Penalties</span>
            </h3>
            {report.feesSummary.feeCount > 0 && (
              <button
                onClick={() => onJumpToTransactions({ type: 'fees' })}
                className="text-xs font-semibold text-red-300 hover:underline"
              >
                View {report.feesSummary.feeCount} Fees →
              </button>
            )}
          </div>
          <p className="text-sm text-slate-300 mb-4">
            Automatically spots dishonor fees, unarranged overdraft charges, and foreign
            currency fees.
          </p>

          {report.feesSummary.feeCount > 0 ? (
            <div className="space-y-2">
              {report.feesSummary.items.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-xl bg-red-950/20 border border-red-500/30 px-4 py-2.5 text-xs"
                >
                  <div>
                    <span className="font-mono text-slate-400 mr-2.5">{f.date}</span>
                    <span className="font-bold text-red-200">{f.rawMerchant}</span>
                  </div>
                  <span className="font-mono font-bold text-red-300">
                    -{c}
                    {f.absAmount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
              No bank fees or overdraft penalties found in your CSV!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

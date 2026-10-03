import React, { useState } from 'react';
import {
  Repeat,
  TrendingUp,
  Sparkles,
  Layers,
  CalendarClock,
  Search,
} from 'lucide-react';
import { AreaOfConcern, DiagnosticReport } from '../types/finance';
import { EmptyCsvState, PageExplainerHeader } from './ExplainerUi';

interface RecurringTabProps {
  report: DiagnosticReport;
  hasData: boolean;
  onGoToUpload: () => void;
  onJumpToTransactions: (preset: AreaOfConcern['filterPreset']) => void;
  onJumpToSimulator: () => void;
}

export const RecurringTab: React.FC<RecurringTabProps> = ({
  report,
  hasData,
  onGoToUpload,
  onJumpToTransactions,
  onJumpToSimulator,
}) => {
  const [filter, setFilter] = useState<'all' | 'creep' | 'subscriptions' | 'bills'>('all');
  const c = report.currencySymbol;

  const terms = [
    {
      term: 'Regular Bills & Subscriptions',
      meaning:
        'Payments that repeat on a weekly, fortnightly, or monthly schedule—such as rent, power, internet, streaming apps, and gym memberships.',
    },
    {
      term: 'Price Creep (Silent Price Increase)',
      meaning:
        'When a company charges you more in a recent month than they did in your first month (for example, a bill going up from $20.99 to $25.99).',
    },
    {
      term: 'Free-Trial Conversion',
      meaning:
        'A subscription that started with a $0 or $1 trial check, or began halfway through your statement, and then started charging you every month.',
    },
    {
      term: 'Overlapping Subscriptions',
      meaning:
        'Paying for multiple services that do the same thing at the same time (such as paying for 3 or 4 different video streaming apps every month).',
    },
    {
      term: 'Monthly Cost Equivalent',
      meaning:
        'What a repeating payment costs when converted to a standard monthly figure (so you can easily compare weekly, fortnightly, and monthly bills).',
    },
  ];

  if (!hasData) {
    return (
      <div>
        <PageExplainerHeader
          stepNumber={4}
          title="Regular Bills & Subscriptions"
          subtitle="Automatically finds every repeating payment in your bank CSV, spots bills that quietly went up in price, and highlights overlapping subscriptions."
          terms={terms}
        />
        <EmptyCsvState
          pageTitle="Regular Bills & Subscriptions"
          whatYouWillSee={[
            'Every weekly, fortnightly, and monthly bill or subscription found in your CSV.',
            'Alerts for any bill that increased in price between Month 1 and Month 3.',
            'Groups of overlapping subscriptions (e.g., multiple streaming or music services).',
            'Estimated next payment date and annual cost for each regular bill.',
          ]}
          onGoToUpload={onGoToUpload}
        />
      </div>
    );
  }

  const totalMonthlyRecurring = report.recurringSeries.reduce(
    (s, r) => s + r.monthlyEquivalent,
    0
  );
  const subsOnlyMonthly = report.recurringSeries
    .filter(
      (r) =>
        !['housing', 'utilities', 'insurance', 'education', 'credit_cards'].includes(
          r.category
        )
    )
    .reduce((s, r) => s + r.monthlyEquivalent, 0);

  const creepSeries = report.recurringSeries.filter((r) => r.hasPriceCreep);

  const filteredSeries = report.recurringSeries.filter((r) => {
    if (filter === 'creep') return r.hasPriceCreep || r.isTrialConversion;
    if (filter === 'subscriptions')
      return !['housing', 'utilities', 'insurance', 'education', 'credit_cards'].includes(
        r.category
      );
    if (filter === 'bills')
      return ['housing', 'utilities', 'insurance', 'education', 'credit_cards'].includes(
        r.category
      );
    return true;
  });

  return (
    <div className="space-y-8">
      <PageExplainerHeader
        stepNumber={4}
        title="Regular Bills & Subscriptions"
        subtitle="Here are all the repeating payments we detected across your CSV, including any price increases or duplicate services."
        terms={terms}
      />

      {/* 3 Simple Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>All Regular Bills Combined</span>
            <Repeat className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono">
            {c}
            {totalMonthlyRecurring.toFixed(0)}
            <span className="text-sm font-normal text-slate-400"> / month</span>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Equals {c}
            {(totalMonthlyRecurring * 12).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}{' '}
            per year across {report.recurringSeries.length} repeating payments.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Subscriptions &amp; Memberships</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-purple-300 font-mono">
            {c}
            {subsOnlyMonthly.toFixed(0)}
            <span className="text-sm font-normal text-slate-400"> / month</span>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Optional services like streaming apps, music, cloud storage, and gym
            memberships ({c}
            {(subsOnlyMonthly * 12).toFixed(0)}/year).
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-300">
            <span>Bills That Went Up in Price</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-300 font-mono">
            {creepSeries.length} {creepSeries.length === 1 ? 'bill' : 'bills'}
          </div>
          <p className="text-xs text-slate-200 mt-2 leading-relaxed">
            {creepSeries.length > 0
              ? `Costing an extra +${c}${creepSeries
                  .reduce((s, r) => s + r.priceCreepAmount, 0)
                  .toFixed(2)} per month compared to your first payment.`
              : 'None of your regular bills increased in price during this period.'}
          </p>
        </div>
      </div>

      {/* Overlapping Subscription Groups (if any) */}
      {report.duplicateSubGroups.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-400" />
                <span>Overlapping Subscriptions (Paying for Similar Services)</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                You have multiple active subscriptions in the same category. Canceling or
                rotating even one can save money immediately.
              </p>
            </div>
            <button
              onClick={onJumpToSimulator}
              className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-4 py-2 text-xs font-semibold text-emerald-300 transition self-start"
            >
              Test Canceling in Savings Planner →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.duplicateSubGroups.map((group) => (
              <div
                key={group.groupName}
                className="rounded-xl border border-purple-500/30 bg-purple-950/15 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    {group.groupName} ({group.count} services)
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-200 bg-purple-500/20 px-2.5 py-1 rounded-lg">
                    {c}
                    {group.monthlyTotal.toFixed(2)}/mo ({c}
                    {group.annualTotal.toFixed(0)}/yr)
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.merchants.map((m) => (
                    <span
                      key={m}
                      className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1 text-xs text-slate-200"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clean Repeating Payments Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">
              List of All Repeating Payments ({filteredSeries.length})
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Compare what you paid on the first charge vs. the most recent charge.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Regular Payments' },
              { id: 'creep', label: 'Price Increases & Trials' },
              { id: 'subscriptions', label: 'Subscriptions Only' },
              { id: 'bills', label: 'Housing, Power & Insurance' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setFilter(pill.id as typeof filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filter === pill.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs">
                <th className="py-3 px-3">Who You Pay</th>
                <th className="py-3 px-3">How Often</th>
                <th className="py-3 px-3">First Payment → Latest Payment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Monthly Cost</th>
                <th className="py-3 px-3 text-right">Yearly Cost</th>
                <th className="py-3 px-3">Next Due Date</th>
                <th className="py-3 px-3 text-right">Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredSeries.map((series) => (
                <tr
                  key={series.id}
                  className="hover:bg-slate-800/40 transition text-slate-200"
                >
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-white">{series.merchant}</div>
                    <div className="text-xs text-slate-400">
                      {series.functionalGroup} • Paid {series.occurrences} times
                    </div>
                  </td>
                  <td className="py-3.5 px-3 capitalize text-xs font-medium text-slate-300">
                    {series.cadence}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs">
                    <span className="text-slate-400">
                      {c}
                      {series.firstAmount.toFixed(2)}
                    </span>
                    <span className="mx-1.5 text-slate-500">→</span>
                    <strong
                      className={
                        series.hasPriceCreep ? 'text-amber-300' : 'text-white'
                      }
                    >
                      {c}
                      {series.latestAmount.toFixed(2)}
                    </strong>
                  </td>
                  <td className="py-3.5 px-3 text-xs">
                    {series.isTrialConversion ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold">
                        New / Free-Trial Converted
                      </span>
                    ) : series.hasPriceCreep ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold">
                        Up +{c}
                        {series.priceCreepAmount.toFixed(2)} (+{series.priceCreepPercent}%)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300">
                        Steady Price
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                    {c}
                    {series.monthlyEquivalent.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                    {c}
                    {series.annualizedCost.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                      {series.nextExpectedDate}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() =>
                        onJumpToTransactions({
                          type: 'merchant',
                          value: series.merchant,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

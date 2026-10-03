import {
  AreaOfConcern,
  CategoryId,
  CategoryVelocityItem,
  CashFlowTroughEvent,
  DayOfWeekProfile,
  DiagnosticReport,
  MicroSpendStats,
  MonthlyBreakdown,
  PaydaySpikeStats,
  RecurringCadence,
  RecurringSeries,
  Transaction,
  UserOverrides,
} from '../types/finance';
import { ALL_CATEGORIES, CATEGORY_META } from './categories';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[(m - 1) % 12]} ${y}`;
}

function addDaysIso(isoDate: string, days: number): string {
  const dt = new Date(`${isoDate}T12:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function analyzeTransactions(
  rawTransactions: Transaction[],
  overrides: UserOverrides,
  currencySymbol = '$'
): DiagnosticReport {
  // Clone and sort deterministically so order never fluctuates
  const transactions: Transaction[] = rawTransactions
    .map((t) => ({ ...t }))
    .sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));

  if (transactions.length === 0) {
    return createEmptyReport(currencySymbol);
  }

  const startDate = transactions[0].date;
  const endDate = transactions[transactions.length - 1].date;
  const startMs = transactions[0].timestamp;
  const endMs = transactions[transactions.length - 1].timestamp;
  const totalDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
  const monthsSpan = Math.max(1, Number((totalDays / 30.4375).toFixed(2)));
  const minimumDaysRequired = 85; // ~3 calendar months
  const meetsMinimumWindow = totalDays >= minimumDaysRequired;

  // ---------------------------------------------------------------------------
  // 1. Detect Paydays (Primary Salary / Payroll inflows >= $400)
  // ---------------------------------------------------------------------------
  const paychecks = transactions.filter(
    (t) => t.type === 'income' && t.absAmount >= 400
  );
  const paydayTimestamps = paychecks.map((p) => p.timestamp);
  const paydayDatesSet = new Set(paychecks.map((p) => p.date));

  for (const tx of transactions) {
    let latestPaydayMs: number | null = null;
    for (const pMs of paydayTimestamps) {
      if (pMs <= tx.timestamp) {
        latestPaydayMs = pMs;
      } else {
        break;
      }
    }
    if (latestPaydayMs !== null) {
      tx.daysSincePayday = Math.round((tx.timestamp - latestPaydayMs) / (1000 * 60 * 60 * 24));
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Detect Recurring Series, Price Creep & Trial Conversions
  // ---------------------------------------------------------------------------
  const merchantGroups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    const key = tx.normalizedMerchant;
    if (!merchantGroups.has(key)) {
      merchantGroups.set(key, []);
    }
    merchantGroups.get(key)!.push(tx);
  }

  const recurringSeries: RecurringSeries[] = [];

  merchantGroups.forEach((txs, merchant) => {
    if (txs.length < 2) return;

    const sorted = [...txs].sort(
      (a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id)
    );
    const distinctMonths = new Set(sorted.map((t) => t.monthKey)).size;

    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.round(
        (sorted[i].timestamp - sorted[i - 1].timestamp) / (1000 * 60 * 60 * 24)
      );
      if (diff > 0) intervals.push(diff);
    }

    if (intervals.length === 0) return;

    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const sampleCat = sorted[sorted.length - 1].category;
    const isSubOrBillCat = [
      'subscriptions',
      'utilities',
      'housing',
      'insurance',
      'education',
      'credit_cards',
    ].includes(sampleCat);

    let cadence: RecurringCadence | null = null;

    if (avgInterval >= 24 && avgInterval <= 37 && distinctMonths >= 2) {
      cadence = 'monthly';
    } else if (avgInterval >= 12 && avgInterval <= 16 && sorted.length >= 4) {
      cadence = 'fortnightly';
    } else if (avgInterval >= 6 && avgInterval <= 8 && sorted.length >= 6) {
      const nonZeroAmounts = sorted.map((t) => t.absAmount).filter((a) => a > 0);
      const meanAmt =
        nonZeroAmounts.reduce((s, v) => s + v, 0) / (nonZeroAmounts.length || 1);
      const maxDev = Math.max(...nonZeroAmounts.map((a) => Math.abs(a - meanAmt)));
      if (
        [
          'housing',
          'subscriptions',
          'health_fitness',
          'insurance',
          'education',
          'credit_cards',
        ].includes(sampleCat) ||
        maxDev / (meanAmt || 1) < 0.15
      ) {
        cadence = 'weekly';
      }
    } else if (
      isSubOrBillCat &&
      distinctMonths >= 2 &&
      sorted.length <= Math.ceil(monthsSpan) + 2
    ) {
      cadence = 'monthly';
    }

    if (
      [
        'groceries',
        'coffee_snacks',
        'dining_takeout',
        'transport',
        'shopping',
        'entertainment',
      ].includes(sampleCat)
    ) {
      return;
    }

    if (sampleCat === 'bnpl' || sorted[0].isBNPL) {
      return;
    }

    if (!cadence) return;

    const firstTx = sorted[0];
    const paidTxs = sorted.filter((t) => t.absAmount > 2);
    if (paidTxs.length === 0) return;

    const firstPaidAmount = paidTxs[0].absAmount;
    const latestPaidAmount = paidTxs[paidTxs.length - 1].absAmount;
    const avgPaidAmount =
      paidTxs.reduce((s, t) => s + t.absAmount, 0) / paidTxs.length;

    const isZeroAuthTrial = firstTx.absAmount <= 2.0 && latestPaidAmount >= 9.99;
    const daysAfterWindowStart = Math.round(
      (firstTx.timestamp - startMs) / (1000 * 60 * 60 * 24)
    );
    const isMidWindowNewSub =
      sampleCat === 'subscriptions' && daysAfterWindowStart >= 28 && paidTxs.length >= 2;
    const isTrialConversion = isZeroAuthTrial || isMidWindowNewSub;

    const priceCreepAmount = Number((latestPaidAmount - firstPaidAmount).toFixed(2));
    const priceCreepPercent =
      firstPaidAmount > 0
        ? Number(((priceCreepAmount / firstPaidAmount) * 100).toFixed(1))
        : 0;
    const hasPriceCreep = priceCreepAmount >= 1.0 && priceCreepPercent >= 3.0;

    let monthlyEquivalent = latestPaidAmount;
    if (cadence === 'weekly') monthlyEquivalent = (latestPaidAmount * 52) / 12;
    if (cadence === 'fortnightly') monthlyEquivalent = (latestPaidAmount * 26) / 12;
    const annualizedCost = monthlyEquivalent * 12;

    const lastDate = sorted[sorted.length - 1].date;
    const stepDays = cadence === 'weekly' ? 7 : cadence === 'fortnightly' ? 14 : 30;
    const nextExpectedDate = addDaysIso(lastDate, stepDays);

    const groupId = `rec-${merchant.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    for (const t of sorted) {
      t.isRecurring = true;
      t.recurringGroupId = groupId;
    }

    recurringSeries.push({
      id: groupId,
      merchant,
      category: sampleCat,
      functionalGroup: sorted[0].functionalSubgroup || CATEGORY_META[sampleCat].label,
      cadence,
      occurrences: sorted.length,
      averageAmount: Number(avgPaidAmount.toFixed(2)),
      firstAmount: Number(firstPaidAmount.toFixed(2)),
      latestAmount: Number(latestPaidAmount.toFixed(2)),
      monthlyEquivalent: Number(monthlyEquivalent.toFixed(2)),
      annualizedCost: Number(annualizedCost.toFixed(2)),
      priceCreepAmount,
      priceCreepPercent,
      hasPriceCreep,
      isTrialConversion,
      isVariableUtility: sampleCat === 'utilities',
      typicalDayOfMonth: sorted[sorted.length - 1].dayOfMonth,
      nextExpectedDate,
      transactions: sorted,
    });
  });

  recurringSeries.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);

  // ---------------------------------------------------------------------------
  // 3. Detect One-Off Statistical Outliers (Lumpy Expenses)
  // ---------------------------------------------------------------------------
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;

    if (overrides.txOutlierOverrides[tx.id] !== undefined) {
      tx.isOutlier = overrides.txOutlierOverrides[tx.id];
      continue;
    }

    if (tx.isRecurring || tx.category === 'housing') {
      tx.isOutlier = false;
      continue;
    }

    if (
      (tx.absAmount >= 350 &&
        ['auto_maintenance', 'travel', 'health_fitness'].includes(tx.category)) ||
      tx.absAmount >= 550
    ) {
      tx.isOutlier = true;
    }
  }

  const outliers = transactions.filter((t) => t.type === 'expense' && t.isOutlier);

  // ---------------------------------------------------------------------------
  // 4. Duplicate / Overlapping Subscription Functional Groups
  // ---------------------------------------------------------------------------
  const subFunctionalMap = new Map<string, RecurringSeries[]>();
  for (const series of recurringSeries) {
    if (
      [
        'Housing',
        'Utilities & Energy',
        'Broadband & Telco',
        'Insurance',
        'Education',
        'Credit Cards',
      ].includes(series.functionalGroup) ||
      ['education', 'credit_cards'].includes(series.category)
    ) {
      continue;
    }
    const g = series.functionalGroup;
    if (!subFunctionalMap.has(g)) subFunctionalMap.set(g, []);
    subFunctionalMap.get(g)!.push(series);
  }

  const duplicateSubGroups = Array.from(subFunctionalMap.entries())
    .filter(([, list]) => list.length >= 2)
    .map(([groupName, list]) => {
      const monthlyTotal = list.reduce((s, item) => s + item.monthlyEquivalent, 0);
      return {
        groupName,
        count: list.length,
        monthlyTotal: Number(monthlyTotal.toFixed(2)),
        annualTotal: Number((monthlyTotal * 12).toFixed(2)),
        merchants: list.map(
          (i) => `${i.merchant} (${currencySymbol}${i.latestAmount.toFixed(2)})`
        ),
      };
    })
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

  // ---------------------------------------------------------------------------
  // 5. Micro-Transaction Bleed Analysis (<= $18 impulse transactions)
  // ---------------------------------------------------------------------------
  const microTxs = transactions.filter((t) => t.isMicroSpend && !t.isOutlier);
  const microTotal = microTxs.reduce((s, t) => s + t.absAmount, 0);
  const microMonthlyAvg = microTotal / monthsSpan;
  const microMerchMap = new Map<string, { count: number; total: number }>();
  for (const t of microTxs) {
    const cur = microMerchMap.get(t.normalizedMerchant) || { count: 0, total: 0 };
    cur.count += 1;
    cur.total += t.absAmount;
    microMerchMap.set(t.normalizedMerchant, cur);
  }
  const topMicroMerchants = Array.from(microMerchMap.entries())
    .map(([merchant, stats]) => ({
      merchant,
      count: stats.count,
      total: Number(stats.total.toFixed(2)),
      avg: Number((stats.total / stats.count).toFixed(2)),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const microSpend: MicroSpendStats = {
    threshold: 18,
    totalAmount: Number(microTotal.toFixed(2)),
    monthlyAverage: Number(microMonthlyAvg.toFixed(2)),
    annualizedCost: Number((microMonthlyAvg * 12).toFixed(2)),
    transactionCount: microTxs.length,
    avgPerWeek: Number((microTxs.length / (totalDays / 7)).toFixed(1)),
    topMerchants: topMicroMerchants,
  };

  // ---------------------------------------------------------------------------
  // 6. Payday Lifestyle Inflation ("The 72-Hour Payday Spike")
  // ---------------------------------------------------------------------------
  let avgPayIntervalDays = 14;
  if (paydayTimestamps.length >= 2) {
    const pDiffs: number[] = [];
    for (let i = 1; i < paydayTimestamps.length; i++) {
      const d = Math.round(
        (paydayTimestamps[i] - paydayTimestamps[i - 1]) / (1000 * 60 * 60 * 24)
      );
      if (d >= 5) pDiffs.push(d);
    }
    if (pDiffs.length > 0) {
      avgPayIntervalDays = Math.round(
        pDiffs.reduce((s, v) => s + v, 0) / pDiffs.length
      );
    }
  }
  const payCadenceLabel =
    avgPayIntervalDays <= 9
      ? 'Weekly'
      : avgPayIntervalDays <= 18
      ? 'Fortnightly'
      : 'Monthly';

  const discretionaryExpenses = transactions.filter(
    (t) =>
      t.type === 'expense' &&
      !t.isRecurring &&
      !t.isOutlier &&
      CATEGORY_META[t.category]?.isDiscretionary
  );

  let postPaydaySpend = 0;
  let midCycleSpend = 0;
  let prePaydaySpend = 0;
  const postPaydayMerchMap = new Map<string, { total: number; count: number }>();

  for (const tx of discretionaryExpenses) {
    if (tx.daysSincePayday === null) continue;
    if (tx.daysSincePayday >= 0 && tx.daysSincePayday <= 2) {
      postPaydaySpend += tx.absAmount;
      const cur = postPaydayMerchMap.get(tx.normalizedMerchant) || {
        total: 0,
        count: 0,
      };
      cur.total += tx.absAmount;
      cur.count += 1;
      postPaydayMerchMap.set(tx.normalizedMerchant, cur);
    } else if (
      tx.daysSincePayday >= Math.max(3, avgPayIntervalDays - 3) &&
      tx.daysSincePayday <= avgPayIntervalDays
    ) {
      prePaydaySpend += tx.absAmount;
    } else {
      midCycleSpend += tx.absAmount;
    }
  }

  const cycleCount = Math.max(1, paychecks.length);
  const postPaydayDaysCount = cycleCount * 3;
  const prePaydayDaysCount = cycleCount * 3;
  const midCycleDaysCount = Math.max(
    1,
    totalDays - postPaydayDaysCount - prePaydayDaysCount
  );

  const postPaydayDailyAvg = postPaydaySpend / postPaydayDaysCount;
  const midCycleDailyAvg = midCycleSpend / midCycleDaysCount;
  const prePaydayDailyAvg = Math.max(5, prePaydaySpend / prePaydayDaysCount);
  const baselineDailyDiscretionary =
    (midCycleSpend + prePaydaySpend) / (midCycleDaysCount + prePaydayDaysCount);
  const spikeRatio = Number(
    (postPaydayDailyAvg / Math.max(1, baselineDailyDiscretionary)).toFixed(2)
  );
  const excessPerCycle = Math.max(
    0,
    (postPaydayDailyAvg - baselineDailyDiscretionary) * 3
  );
  const cyclesPerMonth = 30.4375 / avgPayIntervalDays;
  const estimatedMonthlyExcess = Number(
    (excessPerCycle * cyclesPerMonth).toFixed(2)
  );

  const paydaySpike: PaydaySpikeStats = {
    detectedPaycheckCount: paychecks.length,
    averagePaycheck:
      paychecks.length > 0
        ? Number(
            (
              paychecks.reduce((s, p) => s + p.absAmount, 0) / paychecks.length
            ).toFixed(2)
          )
        : 0,
    payCadenceLabel,
    postPaydayDailyAvg: Number(postPaydayDailyAvg.toFixed(2)),
    midCycleDailyAvg: Number(midCycleDailyAvg.toFixed(2)),
    prePaydayDailyAvg: Number(prePaydayDailyAvg.toFixed(2)),
    spikeRatio,
    estimatedMonthlyExcess,
    topPostPaydayMerchants: Array.from(postPaydayMerchMap.entries())
      .map(([merchant, v]) => ({
        merchant,
        total: Number(v.total.toFixed(2)),
        count: v.count,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
  };

  // ---------------------------------------------------------------------------
  // 7. Day-of-Week & Weekend Burn Rate
  // ---------------------------------------------------------------------------
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (let d = 0; d < totalDays; d++) {
    const dt = new Date(startMs + d * 86400000);
    dayCounts[dt.getUTCDay()] += 1;
  }

  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  const dayTxCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const tx of discretionaryExpenses) {
    dayTotals[tx.dayOfWeek] += tx.absAmount;
    dayTxCounts[tx.dayOfWeek] += 1;
  }

  const dayOfWeekProfile: DayOfWeekProfile[] = DAY_NAMES.map((dayName, idx) => {
    const isWeekend = idx === 0 || idx === 5 || idx === 6;
    const c = Math.max(1, dayCounts[idx]);
    return {
      dayIndex: idx,
      dayName,
      avgDailySpend: Number((dayTotals[idx] / c).toFixed(2)),
      totalSpend: Number(dayTotals[idx].toFixed(2)),
      txCount: dayTxCounts[idx],
      isWeekend,
    };
  });

  const weekdayTotal = dayTotals[1] + dayTotals[2] + dayTotals[3] + dayTotals[4];
  const weekdayDays = Math.max(
    1,
    dayCounts[1] + dayCounts[2] + dayCounts[3] + dayCounts[4]
  );
  const weekendTotal = dayTotals[5] + dayTotals[6] + dayTotals[0];
  const weekendDays = Math.max(1, dayCounts[5] + dayCounts[6] + dayCounts[0]);

  const weekdayDailyAvg = Number((weekdayTotal / weekdayDays).toFixed(2));
  const weekendDailyAvg = Number((weekendTotal / weekendDays).toFixed(2));
  const weekendMultiplier = Number(
    (weekendDailyAvg / Math.max(1, weekdayDailyAvg)).toFixed(2)
  );

  // ---------------------------------------------------------------------------
  // 8. BNPL Stacking & Bank Fees Hunter
  // ---------------------------------------------------------------------------
  const bnplTxs = transactions.filter((t) => t.type === 'expense' && t.isBNPL);
  const bnplTotal = bnplTxs.reduce((s, t) => s + t.absAmount, 0);
  const bnplProvMap = new Map<string, { count: number; total: number }>();
  const bnplWeekCounts = new Map<number, number>();

  for (const t of bnplTxs) {
    const p = bnplProvMap.get(t.normalizedMerchant) || { count: 0, total: 0 };
    p.count += 1;
    p.total += t.absAmount;
    bnplProvMap.set(t.normalizedMerchant, p);

    const weekIdx = Math.floor((t.timestamp - startMs) / (7 * 86400000));
    bnplWeekCounts.set(weekIdx, (bnplWeekCounts.get(weekIdx) || 0) + 1);
  }

  const peakConcurrentWeekCount =
    bnplWeekCounts.size > 0
      ? Math.max(...Array.from(bnplWeekCounts.values()))
      : 0;

  const bnplSummary = {
    totalSpend: Number(bnplTotal.toFixed(2)),
    monthlyAvg: Number((bnplTotal / monthsSpan).toFixed(2)),
    installmentCount: bnplTxs.length,
    providers: Array.from(bnplProvMap.entries()).map(([name, v]) => ({
      name,
      count: v.count,
      total: Number(v.total.toFixed(2)),
    })),
    peakConcurrentWeekCount,
  };

  const feeTxs = transactions.filter((t) => t.type === 'expense' && t.isFee);
  const totalFees = feeTxs.reduce((s, t) => s + t.absAmount, 0);
  const feesSummary = {
    totalFees: Number(totalFees.toFixed(2)),
    monthlyAvg: Number((totalFees / monthsSpan).toFixed(2)),
    feeCount: feeTxs.length,
    items: feeTxs,
  };

  // ---------------------------------------------------------------------------
  // 9. Cash Flow Mechanics & Low-Balance Timing Troughs ("Danger Zones")
  // ---------------------------------------------------------------------------
  const dailyBalanceMap = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.balanceAfter !== null) {
      dailyBalanceMap.set(tx.date, tx.balanceAfter);
    }
  }

  const cashFlowTroughs: CashFlowTroughEvent[] = [];
  const troughDatesSet = new Set<string>();

  for (const paycheck of paychecks) {
    const windowStartMs = paycheck.timestamp - 5 * 86400000;
    const prePayTxs = transactions.filter(
      (t) =>
        t.timestamp >= windowStartMs &&
        t.timestamp < paycheck.timestamp &&
        t.type === 'expense' &&
        t.balanceAfter !== null
    );

    if (prePayTxs.length === 0) continue;

    let minTx = prePayTxs[0];
    for (const t of prePayTxs) {
      if ((t.balanceAfter ?? 999999) < (minTx.balanceAfter ?? 999999)) {
        minTx = t;
      }
    }

    if ((minTx.balanceAfter ?? 999999) < 280) {
      const largestTrigger = [...prePayTxs].sort(
        (a, b) => b.absAmount - a.absAmount
      )[0];
      const daysBefore = Math.max(
        1,
        Math.round((paycheck.timestamp - minTx.timestamp) / 86400000)
      );
      troughDatesSet.add(minTx.date);

      cashFlowTroughs.push({
        date: minTx.date,
        balance: Number((minTx.balanceAfter ?? 0).toFixed(2)),
        triggerMerchant: largestTrigger.normalizedMerchant,
        triggerAmount: largestTrigger.absAmount,
        nextPaydayDate: paycheck.date,
        daysBeforePayday: daysBefore,
        nextPaydayAmount: paycheck.absAmount,
        recommendation: `Contact ${largestTrigger.normalizedMerchant} and ask to move your billing date ${
          daysBefore + 2
        } days later in the month so it comes out right after your paycheck arrives.`,
      });
    }
  }

  const dailyBalanceSeries = Array.from(dailyBalanceMap.entries()).map(
    ([date, balance]) => ({
      date,
      balance,
      isPayday: paydayDatesSet.has(date),
      isTrough: troughDatesSet.has(date),
    })
  );

  // ---------------------------------------------------------------------------
  // 10. Monthly Breakdowns & Category Velocity Spikes
  // ---------------------------------------------------------------------------
  const monthMap = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (!monthMap.has(tx.monthKey)) monthMap.set(tx.monthKey, []);
    monthMap.get(tx.monthKey)!.push(tx);
  }

  const sortedMonthKeys = Array.from(monthMap.keys()).sort();
  const monthlyBreakdowns: MonthlyBreakdown[] = sortedMonthKeys.map(
    (monthKey) => {
      const mTxs = monthMap.get(monthKey)!;
      let income = 0;
      let fixedSpend = 0;
      let discretionarySpend = 0;
      let outlierSpend = 0;
      let transfersNet = 0;

      const byCategory = {} as Record<CategoryId, number>;
      for (const c of ALL_CATEGORIES) byCategory[c.id] = 0;

      for (const t of mTxs) {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.absAmount;

        // Every positive amount (> 0) is counted in Total Income regardless of category
        if (t.amount > 0) {
          income += t.absAmount;
          continue;
        }

        // Every negative amount (< 0) is counted in Total Outgoings regardless of category
        if (t.amount < 0) {
          if (t.category === 'transfer') {
            transfersNet += t.absAmount;
          }
          if (t.isOutlier) {
            outlierSpend += t.absAmount;
          } else if (
            CATEGORY_META[t.category]?.isFixedCommitted ||
            t.isRecurring
          ) {
            fixedSpend += t.absAmount;
          } else {
            discretionarySpend += t.absAmount;
          }
        }
      }

      const totalCoreSpend = fixedSpend + discretionarySpend;
      const totalRawSpend = totalCoreSpend + outlierSpend;
      const netCashFlow = income - totalRawSpend;
      const normalizedNetCashFlow = income - totalCoreSpend;
      // Consistent savings rate using totalRawSpend so numbers always add up
      const savingsRate =
        income > 0 ? ((income - totalRawSpend) / income) * 100 : 0;

      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        income: Number(income.toFixed(2)),
        fixedSpend: Number(fixedSpend.toFixed(2)),
        discretionarySpend: Number(discretionarySpend.toFixed(2)),
        outlierSpend: Number(outlierSpend.toFixed(2)),
        totalCoreSpend: Number(totalCoreSpend.toFixed(2)),
        totalRawSpend: Number(totalRawSpend.toFixed(2)),
        transfersNet: Number(transfersNet.toFixed(2)),
        netCashFlow: Number(netCashFlow.toFixed(2)),
        normalizedNetCashFlow: Number(normalizedNetCashFlow.toFixed(2)),
        savingsRate: Number(savingsRate.toFixed(1)),
        byCategory,
      };
    }
  );

  const fullMonths = monthlyBreakdowns.filter((m) => m.totalRawSpend >= 500);
  const categoryVelocity: CategoryVelocityItem[] = [];

  if (fullMonths.length >= 2) {
    const latestMonth = fullMonths[fullMonths.length - 1];
    const priorMonths = fullMonths.slice(0, -1);

    for (const cat of ALL_CATEGORIES) {
      if (['income', 'transfer', 'housing', 'auto_maintenance'].includes(cat.id))
        continue;
      const priorAvg =
        priorMonths.reduce((s, m) => s + (m.byCategory[cat.id] || 0), 0) /
        priorMonths.length;
      const latestVal = latestMonth.byCategory[cat.id] || 0;
      if (priorAvg < 15 && latestVal < 30) continue;

      const deltaAmount = latestVal - priorAvg;
      const deltaPercent =
        priorAvg > 0 ? (deltaAmount / priorAvg) * 100 : latestVal > 0 ? 100 : 0;
      const isSpike = deltaAmount >= 35 && deltaPercent >= 20;

      categoryVelocity.push({
        category: cat.id,
        label: cat.label,
        priorMonthsAvg: Number(priorAvg.toFixed(2)),
        latestMonthSpend: Number(latestVal.toFixed(2)),
        deltaAmount: Number(deltaAmount.toFixed(2)),
        deltaPercent: Number(deltaPercent.toFixed(1)),
        isSpike,
      });
    }
    categoryVelocity.sort((a, b) => b.deltaAmount - a.deltaAmount);
  }

  // ---------------------------------------------------------------------------
  // 11. Overall Totals, Ratios & Deterministic Health Score
  // ---------------------------------------------------------------------------
  const totalIncome = monthlyBreakdowns.reduce((s, m) => s + m.income, 0);
  const totalRawSpend = monthlyBreakdowns.reduce(
    (s, m) => s + m.totalRawSpend,
    0
  );
  const totalCoreSpend = monthlyBreakdowns.reduce(
    (s, m) => s + m.totalCoreSpend,
    0
  );
  const totalOutlierSpend = monthlyBreakdowns.reduce(
    (s, m) => s + m.outlierSpend,
    0
  );
  const totalFixedSpend = monthlyBreakdowns.reduce(
    (s, m) => s + m.fixedSpend,
    0
  );
  const totalDiscretionarySpend = monthlyBreakdowns.reduce(
    (s, m) => s + m.discretionarySpend,
    0
  );
  const totalTransfersOut = monthlyBreakdowns.reduce(
    (s, m) => s + m.transfersNet,
    0
  );

  const monthlyIncomeAvg = totalIncome / monthsSpan;
  const monthlyRawSpendAvg = totalRawSpend / monthsSpan;
  const monthlyCoreSpendAvg = totalCoreSpend / monthsSpan;
  const monthlySinkingFundNeeded = totalOutlierSpend / monthsSpan;
  const netCashFlowTotal = totalIncome - totalRawSpend;
  const monthlyNetCashFlowAvg = netCashFlowTotal / monthsSpan;

  const savingsRatePercent =
    totalIncome > 0
      ? Number((((totalIncome - totalRawSpend) / totalIncome) * 100).toFixed(1))
      : 0;
  const fixedCostLoadPercent =
    totalIncome > 0
      ? Number(((totalFixedSpend / totalIncome) * 100).toFixed(1))
      : 0;
  const discretionaryLoadPercent =
    totalIncome > 0
      ? Number(((totalDiscretionarySpend / totalIncome) * 100).toFixed(1))
      : 0;

  const lastBalanceTx = [...transactions]
    .reverse()
    .find((t) => t.balanceAfter !== null);
  const currentEndingBalance = lastBalanceTx ? lastBalanceTx.balanceAfter : null;

  const burnRateRunwayMonths =
    monthlyNetCashFlowAvg < 0 &&
    currentEndingBalance &&
    currentEndingBalance > 0
      ? Number(
          (currentEndingBalance / Math.abs(monthlyNetCashFlowAvg)).toFixed(1)
        )
      : null;

  // Deterministic 5-pillar Financial Health Score (0-100) based purely on core transaction metrics
  const cashFlowMargin = Math.max(
    0,
    Math.min(25, Math.round(((savingsRatePercent + 5) / 25) * 25))
  );

  const fixedLoadHealth =
    fixedCostLoadPercent <= 50
      ? 20
      : Math.max(
          4,
          Math.round(20 - ((fixedCostLoadPercent - 50) / 25) * 16)
        );

  const creepCount = recurringSeries.filter((r) => r.hasPriceCreep).length;
  const trialCount = recurringSeries.filter((r) => r.isTrialConversion).length;
  const dupCount = duplicateSubGroups.reduce((s, g) => s + (g.count - 1), 0);
  const subscriptionHygiene = Math.max(
    0,
    20 - creepCount * 4 - trialCount * 5 - dupCount * 3
  );

  const feePenalty = Math.min(8, feeTxs.length * 3);
  const bnplPenalty =
    bnplSummary.monthlyAvg > 100 ? 6 : bnplSummary.monthlyAvg > 0 ? 3 : 0;
  const spikePenalty =
    paydaySpike.spikeRatio >= 1.8 ? 5 : paydaySpike.spikeRatio >= 1.4 ? 3 : 0;
  const impulseAndFeeControl = Math.max(
    0,
    20 - feePenalty - bnplPenalty - spikePenalty
  );

  const timingStability = Math.max(0, 15 - cashFlowTroughs.length * 5);

  const healthScore =
    cashFlowMargin +
    fixedLoadHealth +
    subscriptionHygiene +
    impulseAndFeeControl +
    timingStability;

  const healthGrade: DiagnosticReport['healthGrade'] =
    healthScore >= 82
      ? 'A'
      : healthScore >= 68
      ? 'B'
      : healthScore >= 52
      ? 'C'
      : healthScore >= 38
      ? 'D'
      : 'F';

  // ---------------------------------------------------------------------------
  // 12. Build Plain-English Areas of Concern (Simple, Non-Financial Language)
  // ---------------------------------------------------------------------------
  const areasOfConcern: AreaOfConcern[] = [];

  // A. Free-Trial Conversion Trap
  const trialSeries = recurringSeries.filter((r) => r.isTrialConversion);
  if (trialSeries.length > 0) {
    const monthlyImpact = trialSeries.reduce(
      (s, r) => s + r.monthlyEquivalent,
      0
    );
    areasOfConcern.push({
      id: 'alert-trial-conversion',
      severity: 'critical',
      category: 'trial_conversion',
      title: `Free Trial Turned Into a Paid Subscription (${trialSeries.length} found)`,
      summary: `A service that started as a free trial (or a brand-new signup halfway through your statement) is now charging your account automatically every month.`,
      impactMonthly: Number(monthlyImpact.toFixed(2)),
      impactAnnual: Number((monthlyImpact * 12).toFixed(2)),
      metricBadge: `${currencySymbol}${(monthlyImpact * 12).toFixed(0)}/yr`,
      evidence: trialSeries.map(
        (r) =>
          `${r.merchant}: started at ${currencySymbol}${r.transactions[0].absAmount.toFixed(
            2
          )} on ${r.transactions[0].date}, and is now charging ${currencySymbol}${r.latestAmount.toFixed(
            2
          )} (${r.cadence})`
      ),
      recommendation: `Log into ${trialSeries
        .map((r) => r.merchant)
        .join(
          ', '
        )} (or check the Subscriptions section on your phone's App Store / Google Play) and click "Cancel Subscription" so you aren't charged again next month. If you didn't mean to keep it after the free trial, message their customer support—many companies will refund your latest payment if you ask promptly.`,
      relatedMerchantNames: trialSeries.map((r) => r.merchant),
      filterPreset: { type: 'recurring' },
    });
  }

  // B. Subscription & Bill Price Increases
  const creepingSeries = recurringSeries.filter((r) => r.hasPriceCreep);
  if (creepingSeries.length > 0) {
    const creepMonthlyDelta = creepingSeries.reduce(
      (s, r) => s + r.priceCreepAmount,
      0
    );
    areasOfConcern.push({
      id: 'alert-price-creep',
      severity: 'warning',
      category: 'price_creep',
      title: `Regular Bills That Quietly Went Up in Price (${creepingSeries.length} found)`,
      summary: `${creepingSeries.length} of your regular bills or subscriptions charged you more in recent months than they did at the start of your statement.`,
      impactMonthly: Number(creepMonthlyDelta.toFixed(2)),
      impactAnnual: Number((creepMonthlyDelta * 12).toFixed(2)),
      metricBadge: `+${currencySymbol}${creepMonthlyDelta.toFixed(2)}/mo extra`,
      evidence: creepingSeries.map(
        (r) =>
          `${r.merchant}: went up from ${currencySymbol}${r.firstAmount.toFixed(
            2
          )} to ${currencySymbol}${r.latestAmount.toFixed(
            2
          )} (+${r.priceCreepPercent}% increase)`
      ),
      recommendation: `For streaming apps (${creepingSeries
        .map((r) => r.merchant)
        .join(
          ', '
        )}), check your account settings to see if you were moved to a pricier plan and switch back to the basic tier. For internet, phone, or power bills, call your provider and ask: "My bill recently went up—do you have a cheaper plan or a retention discount available?"`,
      relatedMerchantNames: creepingSeries.map((r) => r.merchant),
      filterPreset: { type: 'recurring' },
    });
  }

  // C. Overlapping Subscriptions
  if (duplicateSubGroups.length > 0) {
    const topDup = duplicateSubGroups[0];
    const savableMonthly = duplicateSubGroups.reduce(
      (s, g) => s + g.monthlyTotal * ((g.count - 1) / g.count),
      0
    );
    areasOfConcern.push({
      id: 'alert-duplicate-subs',
      severity: 'warning',
      category: 'duplicate_subs',
      title: `Paying for Multiple Similar Subscriptions at Once`,
      summary: `You are paying for ${topDup.count} different ${topDup.groupName} services at the same time every month.`,
      impactMonthly: Number(savableMonthly.toFixed(2)),
      impactAnnual: Number((savableMonthly * 12).toFixed(2)),
      metricBadge: `${topDup.count} similar apps`,
      evidence: duplicateSubGroups.map(
        (g) =>
          `${g.groupName} (${currencySymbol}${g.monthlyTotal.toFixed(
            2
          )}/month total): ${g.merchants.join(', ')}`
      ),
      recommendation: `Pick the 1 service you use the most right now and pause or cancel the others. You don't lose your account history when you pause a streaming app—you can simply turn one back on for a month whenever a specific show comes out, rather than paying for all ${topDup.count} every single month.`,
      filterPreset: { type: 'category', value: 'subscriptions' },
    });
  }

  // D. Small Daily Purchases (Micro-Spend <= $18)
  if (microSpend.monthlyAverage >= 90) {
    const targetSaving = microSpend.monthlyAverage * 0.5;
    areasOfConcern.push({
      id: 'alert-micro-bleed',
      severity: microSpend.monthlyAverage >= 180 ? 'critical' : 'warning',
      category: 'micro_bleed',
      title: `Small Everyday Purchases Adding Up Fast (${microSpend.transactionCount} buys under ${currencySymbol}${microSpend.threshold})`,
      summary: `Small purchases under ${currencySymbol}${microSpend.threshold} (like coffees, bakery stops, drinks, or snacks) happened about ${microSpend.avgPerWeek} times a week, adding up to ${currencySymbol}${microSpend.monthlyAverage.toFixed(
        0
      )} a month (${currencySymbol}${microSpend.annualizedCost.toFixed(0)} a year).`,
      impactMonthly: Number(targetSaving.toFixed(2)),
      impactAnnual: Number((targetSaving * 12).toFixed(2)),
      metricBadge: `${microSpend.transactionCount} small buys`,
      evidence: microSpend.topMerchants
        .slice(0, 4)
        .map(
          (m) =>
            `${m.merchant}: ${m.count} visits costing ${currencySymbol}${m.total.toFixed(
              2
            )} total (average ${currencySymbol}${m.avg.toFixed(2)} each)`
        ),
      recommendation: `You don't need to stop buying treats altogether. Simply skipping 2 or 3 small stops a week—like making coffee at home a couple of mornings or bringing a snack—cuts this habit in half and puts about ${currencySymbol}${targetSaving.toFixed(
        0
      )}/month (${currencySymbol}${(targetSaving * 12).toFixed(
        0
      )}/year) back in your pocket.`,
      filterPreset: { type: 'micro' },
    });
  }

  // E. Post-Payday 72-Hour Spending Surge
  if (
    paydaySpike.spikeRatio >= 1.45 &&
    paydaySpike.estimatedMonthlyExcess >= 60
  ) {
    areasOfConcern.push({
      id: 'alert-payday-spike',
      severity: paydaySpike.spikeRatio >= 1.9 ? 'critical' : 'warning',
      category: 'payday_spike',
      title: `Heavy Spending Right After Payday (${paydaySpike.spikeRatio}x higher than normal)`,
      summary: `In the first 3 days after getting paid, you spend an average of ${currencySymbol}${paydaySpike.postPaydayDailyAvg.toFixed(
        0
      )} per day on flexible shopping and dining—compared to just ${currencySymbol}${paydaySpike.prePaydayDailyAvg.toFixed(
        0
      )} per day right before your next payday.`,
      impactMonthly: paydaySpike.estimatedMonthlyExcess,
      impactAnnual: Number(
        (paydaySpike.estimatedMonthlyExcess * 12).toFixed(2)
      ),
      metricBadge: `${paydaySpike.spikeRatio}x Payday Spike`,
      evidence: [
        `First 3 days after payday: ${currencySymbol}${paydaySpike.postPaydayDailyAvg.toFixed(
          2
        )} per day`,
        `Middle of pay cycle: ${currencySymbol}${paydaySpike.midCycleDailyAvg.toFixed(
          2
        )} per day`,
        `Most common post-payday spending: ${paydaySpike.topPostPaydayMerchants
          .map((m) => `${m.merchant} (${currencySymbol}${m.total.toFixed(0)})`)
          .join(', ')}`,
      ],
      recommendation: `When your paycheck lands, your bank balance looks full, which makes it easy to overspend in the first weekend. Try two simple habits: (1) Set up an automatic transfer on payday morning to move your savings into a separate account right away, and (2) Wait 48 hours before buying non-essential items online after payday.`,
    });
  }

  // F. Low-Balance Days Before Payday & Bank Fees
  if (cashFlowTroughs.length > 0 || feesSummary.totalFees > 0) {
    const monthlyFeeAndStress = Math.max(feesSummary.monthlyAvg, 25);
    areasOfConcern.push({
      id: 'alert-cashflow-timing',
      severity: 'critical',
      category: 'cashflow_timing',
      title: `Bills Hitting Right Before Payday & Causing Bank Fees`,
      summary: `Large bills came out 1 to 4 days before your paycheck arrived, dropping your balance down to ${currencySymbol}${
        cashFlowTroughs[0]?.balance.toFixed(2) ?? '0.00'
      } and costing you ${currencySymbol}${feesSummary.totalFees.toFixed(
        2
      )} in avoidable bank fees.`,
      impactMonthly: Number(monthlyFeeAndStress.toFixed(2)),
      impactAnnual: Number((monthlyFeeAndStress * 12).toFixed(2)),
      metricBadge: `${feesSummary.feeCount} bank fees`,
      evidence: [
        ...cashFlowTroughs.slice(0, 3).map(
          (t) =>
            `On ${t.date}, your balance dropped to ${currencySymbol}${t.balance.toFixed(
              2
            )} after paying ${t.triggerMerchant} (${currencySymbol}${t.triggerAmount.toFixed(
              2
            )})—just ${t.daysBeforePayday} day(s) before your paycheck!`
        ),
        ...(feesSummary.totalFees > 0
          ? [
              `Total bank/overdraft/penalty fees charged: ${currencySymbol}${feesSummary.totalFees.toFixed(
                2
              )} (${feesSummary.feeCount} separate fee charges).`,
            ]
          : []),
      ],
      recommendation: `Call or go online with ${
        cashFlowTroughs[0]?.triggerMerchant || 'your bill provider'
      } and ask to change your monthly payment date so it comes out 2 days AFTER your payday instead of right before it. That way your paycheck is already in your account when the bill is taken, which stops your balance from dipping below zero and avoids bank overdraft fees.`,
      filterPreset: { type: 'fees' },
    });
  }

  // G. Buy Now, Pay Later (BNPL) Stacking
  if (bnplSummary.installmentCount >= 3) {
    areasOfConcern.push({
      id: 'alert-bnpl-stacking',
      severity: bnplSummary.monthlyAvg >= 150 ? 'critical' : 'warning',
      category: 'bnpl_stacking',
      title: `Multiple "Buy Now, Pay Later" Payments Piling Up (${bnplSummary.installmentCount} payments)`,
      summary: `Fortnightly payments to services like Afterpay, Zip, or Klarna are overlapping, taking an average of ${currencySymbol}${bnplSummary.monthlyAvg.toFixed(
        0
      )} per month out of your account.`,
      impactMonthly: bnplSummary.monthlyAvg,
      impactAnnual: Number((bnplSummary.monthlyAvg * 12).toFixed(2)),
      metricBadge: `${bnplSummary.installmentCount} BNPL payments`,
      evidence: bnplSummary.providers.map(
        (p) =>
          `${p.name}: ${p.count} payments totaling ${currencySymbol}${p.total.toFixed(
            2
          )}`
      ),
      recommendation: `Because Buy Now, Pay Later splits each purchase into 4 smaller payments across different weeks, having several active orders at once quietly eats up your next paycheck before you even receive it. Take a 6-week break from starting any new Afterpay/Zip/Klarna orders until your current payments finish—this will free up ${currencySymbol}${bnplSummary.monthlyAvg.toFixed(
        0
      )} a month.`,
      filterPreset: { type: 'bnpl' },
    });
  }

  // H. Category Spending Jump in Latest Month
  const spikingCats = categoryVelocity.filter((c) => c.isSpike);
  if (spikingCats.length > 0) {
    const topSpike = spikingCats[0];
    areasOfConcern.push({
      id: 'alert-category-velocity',
      severity: 'warning',
      category: 'category_velocity',
      title: `${topSpike.label} Spending Jumped +${topSpike.deltaPercent.toFixed(
        0
      )}% Last Month`,
      summary: `You spent ${currencySymbol}${topSpike.latestMonthSpend.toFixed(
        0
      )} on ${topSpike.label.toLowerCase()} in the most recent full month, compared to an average of ${currencySymbol}${topSpike.priorMonthsAvg.toFixed(
        0
      )} in earlier months.`,
      impactMonthly: topSpike.deltaAmount,
      impactAnnual: Number((topSpike.deltaAmount * 12).toFixed(2)),
      metricBadge: `+${currencySymbol}${topSpike.deltaAmount.toFixed(0)} jump`,
      evidence: spikingCats.map(
        (c) =>
          `${c.label}: ${currencySymbol}${c.latestMonthSpend.toFixed(
            0
          )} last month vs ${currencySymbol}${c.priorMonthsAvg.toFixed(
            0
          )} average in earlier months (+${c.deltaPercent.toFixed(0)}%)`
      ),
      recommendation: `Have a quick look at your recent ${topSpike.label.toLowerCase()} transactions to see what caused the jump. Bringing this category back down to your usual ${currencySymbol}${topSpike.priorMonthsAvg.toFixed(
        0
      )}/month pace would save you ${currencySymbol}${topSpike.deltaAmount.toFixed(
        0
      )} a month.`,
      relatedCategory: topSpike.category,
      filterPreset: { type: 'category', value: topSpike.category },
    });
  }

  // I. One-Off Big Purchases
  if (outliers.length > 0) {
    areasOfConcern.push({
      id: 'alert-outlier-sinking-fund',
      severity: 'info',
      category: 'outlier_lump',
      title: `One-Off Big Purchases Found (${outliers.length} item${
        outliers.length > 1 ? 's' : ''
      } totaling ${currencySymbol}${totalOutlierSpend.toFixed(0)})`,
      summary: `You had ${currencySymbol}${totalOutlierSpend.toFixed(
        0
      )} in rare, large expenses (like car repairs, flights, or annual bills) during this period.`,
      impactMonthly: Number(monthlySinkingFundNeeded.toFixed(2)),
      impactAnnual: Number(totalOutlierSpend.toFixed(2)),
      metricBadge: `${currencySymbol}${totalOutlierSpend.toFixed(0)} one-offs`,
      evidence: outliers.map(
        (o) =>
          `${o.date} — ${o.normalizedMerchant}: ${currencySymbol}${o.absAmount.toFixed(
            2
          )} (${CATEGORY_META[o.category].label})`
      ),
      recommendation: `Big irregular bills (like car repairs, rego, dental visits, or holidays) don't happen every month, so they can catch you off guard when they hit. To prepare for future big bills without stress, try setting up a separate savings account and automatically putting aside about ${currencySymbol}${
        Math.ceil(monthlySinkingFundNeeded / 10) * 10
      } per month into it.`,
      filterPreset: { type: 'outlier' },
    });
  }

  const sevRank: Record<string, number> = { critical: 3, warning: 2, info: 1 };
  areasOfConcern.sort(
    (a, b) =>
      sevRank[b.severity] - sevRank[a.severity] ||
      b.impactMonthly - a.impactMonthly
  );

  return {
    startDate,
    endDate,
    totalDays,
    monthsSpan,
    meetsMinimumWindow,
    minimumDaysRequired,
    currencySymbol,
    totalIncome: Number(totalIncome.toFixed(2)),
    monthlyIncomeAvg: Number(monthlyIncomeAvg.toFixed(2)),
    totalRawSpend: Number(totalRawSpend.toFixed(2)),
    monthlyRawSpendAvg: Number(monthlyRawSpendAvg.toFixed(2)),
    totalCoreSpend: Number(totalCoreSpend.toFixed(2)),
    monthlyCoreSpendAvg: Number(monthlyCoreSpendAvg.toFixed(2)),
    totalOutlierSpend: Number(totalOutlierSpend.toFixed(2)),
    monthlySinkingFundNeeded: Number(monthlySinkingFundNeeded.toFixed(2)),
    totalTransfersOut: Number(totalTransfersOut.toFixed(2)),
    netCashFlowTotal: Number(netCashFlowTotal.toFixed(2)),
    monthlyNetCashFlowAvg: Number(monthlyNetCashFlowAvg.toFixed(2)),
    savingsRatePercent,
    fixedCostLoadPercent,
    discretionaryLoadPercent,
    currentEndingBalance,
    burnRateRunwayMonths,
    healthScore,
    healthGrade,
    scoreBreakdown: {
      cashFlowMargin,
      fixedLoadHealth,
      subscriptionHygiene,
      impulseAndFeeControl,
      timingStability,
    },
    areasOfConcern,
    monthlyBreakdowns,
    categoryVelocity,
    recurringSeries,
    duplicateSubGroups,
    microSpend,
    paydaySpike,
    dayOfWeekProfile,
    weekdayDailyAvg,
    weekendDailyAvg,
    weekendMultiplier,
    bnplSummary,
    feesSummary,
    cashFlowTroughs,
    dailyBalanceSeries,
    outliers,
    transactions,
  };
}

function createEmptyReport(currencySymbol: string): DiagnosticReport {
  return {
    startDate: '-',
    endDate: '-',
    totalDays: 0,
    monthsSpan: 0,
    meetsMinimumWindow: false,
    minimumDaysRequired: 85,
    currencySymbol,
    totalIncome: 0,
    monthlyIncomeAvg: 0,
    totalRawSpend: 0,
    monthlyRawSpendAvg: 0,
    totalCoreSpend: 0,
    monthlyCoreSpendAvg: 0,
    totalOutlierSpend: 0,
    monthlySinkingFundNeeded: 0,
    totalTransfersOut: 0,
    netCashFlowTotal: 0,
    monthlyNetCashFlowAvg: 0,
    savingsRatePercent: 0,
    fixedCostLoadPercent: 0,
    discretionaryLoadPercent: 0,
    currentEndingBalance: null,
    burnRateRunwayMonths: null,
    healthScore: 0,
    healthGrade: 'F',
    scoreBreakdown: {
      cashFlowMargin: 0,
      fixedLoadHealth: 0,
      subscriptionHygiene: 0,
      impulseAndFeeControl: 0,
      timingStability: 0,
    },
    areasOfConcern: [],
    monthlyBreakdowns: [],
    categoryVelocity: [],
    recurringSeries: [],
    duplicateSubGroups: [],
    microSpend: {
      threshold: 18,
      totalAmount: 0,
      monthlyAverage: 0,
      annualizedCost: 0,
      transactionCount: 0,
      avgPerWeek: 0,
      topMerchants: [],
    },
    paydaySpike: {
      detectedPaycheckCount: 0,
      averagePaycheck: 0,
      payCadenceLabel: 'Fortnightly',
      postPaydayDailyAvg: 0,
      midCycleDailyAvg: 0,
      prePaydayDailyAvg: 0,
      spikeRatio: 1,
      estimatedMonthlyExcess: 0,
      topPostPaydayMerchants: [],
    },
    dayOfWeekProfile: [],
    weekdayDailyAvg: 0,
    weekendDailyAvg: 0,
    weekendMultiplier: 1,
    bnplSummary: {
      totalSpend: 0,
      monthlyAvg: 0,
      installmentCount: 0,
      providers: [],
      peakConcurrentWeekCount: 0,
    },
    feesSummary: {
      totalFees: 0,
      monthlyAvg: 0,
      feeCount: 0,
      items: [],
    },
    cashFlowTroughs: [],
    dailyBalanceSeries: [],
    outliers: [],
    transactions: [],
  };
}

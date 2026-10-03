export type CategoryId =
  | 'income'
  | 'housing'
  | 'groceries'
  | 'utilities'
  | 'subscriptions'
  | 'education'
  | 'credit_cards'
  | 'dining_takeout'
  | 'coffee_snacks'
  | 'transport'
  | 'shopping'
  | 'bnpl'
  | 'entertainment'
  | 'health_fitness'
  | 'insurance'
  | 'fees_interest'
  | 'gambling_gaming'
  | 'auto_maintenance'
  | 'travel'
  | 'general'
  | 'transfer'
  | 'uncategorized';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  isFixedCommitted: boolean;
  isDiscretionary: boolean;
}

export type AmountMode = 'single' | 'split';

export interface ColumnMapping {
  dateCol: string;
  amountMode: AmountMode;
  amountCol: string;
  debitCol: string;
  creditCol: string;
  merchantCol: string;
  descriptionCol: string;
  referenceCol: string;
  balanceCol: string;
  invertSign: boolean;
  currencySymbol: string;
}

export type MatchSource =
  | 'user_rule'
  | 'known_brand'
  | 'keyword_heuristic'
  | 'online_lookup'
  | 'unmatched';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  monthKey: string; // YYYY-MM
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  dayOfMonth: number; // 1 - 31
  rawMerchant: string;
  normalizedMerchant: string;
  description: string;
  reference: string;
  amount: number; // negative = outflow, positive = inflow
  absAmount: number;
  balanceAfter: number | null;
  type: 'expense' | 'income' | 'transfer' | 'refund';
  category: CategoryId;
  matchSource: MatchSource;
  matchReason?: string;
  functionalSubgroup?: string;
  isRecurring: boolean;
  recurringGroupId?: string;
  isOutlier: boolean;
  isBNPL: boolean;
  isFee: boolean;
  isMicroSpend: boolean;
  daysSincePayday: number | null;
  userOverriddenCategory?: CategoryId;
  userMarkedOutlier?: boolean;
  userExcluded?: boolean;
}

export type RecurringCadence = 'weekly' | 'fortnightly' | 'monthly' | 'irregular';

export interface RecurringSeries {
  id: string;
  merchant: string;
  category: CategoryId;
  functionalGroup: string;
  cadence: RecurringCadence;
  occurrences: number;
  averageAmount: number;
  firstAmount: number;
  latestAmount: number;
  monthlyEquivalent: number;
  annualizedCost: number;
  priceCreepAmount: number;
  priceCreepPercent: number;
  hasPriceCreep: boolean;
  isTrialConversion: boolean;
  isVariableUtility: boolean;
  typicalDayOfMonth: number;
  nextExpectedDate: string;
  transactions: Transaction[];
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertCategory =
  | 'price_creep'
  | 'duplicate_subs'
  | 'trial_conversion'
  | 'micro_bleed'
  | 'payday_spike'
  | 'bnpl_stacking'
  | 'bank_fees'
  | 'cashflow_timing'
  | 'category_velocity'
  | 'structural_load'
  | 'outlier_lump'
  | 'weekend_burn';

export interface AreaOfConcern {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  summary: string;
  impactMonthly: number;
  impactAnnual: number;
  metricBadge: string;
  evidence: string[];
  recommendation: string;
  relatedMerchantNames?: string[];
  relatedCategory?: CategoryId;
  filterPreset?: {
    type?: 'micro' | 'bnpl' | 'fees' | 'outlier' | 'recurring' | 'category' | 'merchant';
    value?: string;
  };
}

export interface MonthlyBreakdown {
  monthKey: string;
  label: string;
  income: number;
  fixedSpend: number;
  discretionarySpend: number;
  outlierSpend: number;
  totalCoreSpend: number;
  totalRawSpend: number;
  transfersNet: number;
  netCashFlow: number;
  normalizedNetCashFlow: number;
  savingsRate: number;
  byCategory: Record<CategoryId, number>;
}

export interface CategoryVelocityItem {
  category: CategoryId;
  label: string;
  priorMonthsAvg: number;
  latestMonthSpend: number;
  deltaAmount: number;
  deltaPercent: number;
  isSpike: boolean;
}

export interface CashFlowTroughEvent {
  date: string;
  balance: number;
  triggerMerchant: string;
  triggerAmount: number;
  nextPaydayDate: string;
  daysBeforePayday: number;
  nextPaydayAmount: number;
  recommendation: string;
}

export interface PaydaySpikeStats {
  detectedPaycheckCount: number;
  averagePaycheck: number;
  payCadenceLabel: string;
  postPaydayDailyAvg: number;
  midCycleDailyAvg: number;
  prePaydayDailyAvg: number;
  spikeRatio: number;
  estimatedMonthlyExcess: number;
  topPostPaydayMerchants: { merchant: string; total: number; count: number }[];
}

export interface MicroSpendStats {
  threshold: number;
  totalAmount: number;
  monthlyAverage: number;
  annualizedCost: number;
  transactionCount: number;
  avgPerWeek: number;
  topMerchants: { merchant: string; count: number; total: number; avg: number }[];
}

export interface DayOfWeekProfile {
  dayIndex: number;
  dayName: string;
  avgDailySpend: number;
  totalSpend: number;
  txCount: number;
  isWeekend: boolean;
}

export interface DiagnosticReport {
  startDate: string;
  endDate: string;
  totalDays: number;
  monthsSpan: number;
  meetsMinimumWindow: boolean;
  minimumDaysRequired: number;
  currencySymbol: string;

  totalIncome: number;
  monthlyIncomeAvg: number;
  totalRawSpend: number;
  monthlyRawSpendAvg: number;
  totalCoreSpend: number;
  monthlyCoreSpendAvg: number;
  totalOutlierSpend: number;
  monthlySinkingFundNeeded: number;
  totalTransfersOut: number;
  netCashFlowTotal: number;
  monthlyNetCashFlowAvg: number;
  savingsRatePercent: number;
  fixedCostLoadPercent: number;
  discretionaryLoadPercent: number;
  currentEndingBalance: number | null;
  burnRateRunwayMonths: number | null;

  healthScore: number;
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  scoreBreakdown: {
    cashFlowMargin: number;
    fixedLoadHealth: number;
    subscriptionHygiene: number;
    impulseAndFeeControl: number;
    timingStability: number;
  };

  areasOfConcern: AreaOfConcern[];
  monthlyBreakdowns: MonthlyBreakdown[];
  categoryVelocity: CategoryVelocityItem[];
  recurringSeries: RecurringSeries[];
  duplicateSubGroups: {
    groupName: string;
    count: number;
    monthlyTotal: number;
    annualTotal: number;
    merchants: string[];
  }[];
  microSpend: MicroSpendStats;
  paydaySpike: PaydaySpikeStats;
  dayOfWeekProfile: DayOfWeekProfile[];
  weekdayDailyAvg: number;
  weekendDailyAvg: number;
  weekendMultiplier: number;
  bnplSummary: {
    totalSpend: number;
    monthlyAvg: number;
    installmentCount: number;
    providers: { name: string; count: number; total: number }[];
    peakConcurrentWeekCount: number;
  };
  feesSummary: {
    totalFees: number;
    monthlyAvg: number;
    feeCount: number;
    items: Transaction[];
  };
  cashFlowTroughs: CashFlowTroughEvent[];
  dailyBalanceSeries: { date: string; balance: number; isPayday: boolean; isTrough: boolean }[];
  outliers: Transaction[];
  transactions: Transaction[];
}

export interface UserOverrides {
  merchantCategoryRules: Record<string, CategoryId>;
  txCategoryOverrides: Record<string, CategoryId>;
  txOutlierOverrides: Record<string, boolean>;
  txExcludedOverrides: Record<string, boolean>;
}

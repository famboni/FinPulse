import React, { useState, useMemo, useEffect } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
  ShieldCheck,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { ColumnMapping, UserOverrides } from '../types/finance';
import { buildTransactionsFromRows, parseCsvToPreview } from '../utils/csvParser';
import { PageExplainerHeader } from './ExplainerUi';

interface UploadCsvPageProps {
  currentCsvText: string;
  currentFileName: string;
  currentMapping: ColumnMapping | null;
  overrides: UserOverrides;
  onSyncCsvData: (
    csvText: string,
    mapping: ColumnMapping,
    fileName: string
  ) => void;
  onConfirmImport: (
    csvText: string,
    mapping: ColumnMapping,
    fileName: string
  ) => void;
  onClearData: () => void;
}

export const UploadCsvPage: React.FC<UploadCsvPageProps> = ({
  currentCsvText,
  currentFileName,
  currentMapping,
  overrides,
  onSyncCsvData,
  onConfirmImport,
  onClearData,
}) => {
  const [rawCsvText, setRawCsvText] = useState<string>(currentCsvText);
  const [fileName, setFileName] = useState<string>(currentFileName);
  const [mapping, setMapping] = useState<ColumnMapping | null>(currentMapping);
  const [allowShortOverride, setAllowShortOverride] = useState<boolean>(true);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setRawCsvText(currentCsvText);
    setFileName(currentFileName);
    setMapping(currentMapping);
  }, [currentCsvText, currentFileName, currentMapping]);

  const preview = useMemo(() => {
    if (!rawCsvText.trim()) return { headers: [], rows: [], suggestedMapping: null };
    return parseCsvToPreview(rawCsvText);
  }, [rawCsvText]);

  const activeMapping = mapping || preview.suggestedMapping;

  const parsedStats = useMemo(() => {
    if (!rawCsvText.trim() || !activeMapping || preview.rows.length === 0) {
      return {
        txCount: 0,
        startDate: '-',
        endDate: '-',
        totalDays: 0,
        meetsMinimum: false,
        sampleTxs: [],
      };
    }
    const txs = buildTransactionsFromRows(preview.rows, activeMapping, overrides);
    if (txs.length === 0) {
      return {
        txCount: 0,
        startDate: '-',
        endDate: '-',
        totalDays: 0,
        meetsMinimum: false,
        sampleTxs: [],
      };
    }
    const startDate = txs[0].date;
    const endDate = txs[txs.length - 1].date;
    const totalDays =
      Math.round((txs[txs.length - 1].timestamp - txs[0].timestamp) / 86400000) + 1;
    return {
      txCount: txs.length,
      startDate,
      endDate,
      totalDays,
      meetsMinimum: totalDays >= 85,
      sampleTxs: txs.slice(0, 5),
    };
  }, [rawCsvText, preview.rows, activeMapping, overrides]);

  const updateMappingAndSync = (nextMapping: ColumnMapping) => {
    setMapping(nextMapping);
    if (rawCsvText.trim()) {
      onSyncCsvData(rawCsvText, nextMapping, fileName || 'Uploaded CSV');
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || '').trim();
      if (!content) {
        setUploadError('The selected file appears to be empty.');
        return;
      }
      const p = parseCsvToPreview(content);
      if (p.headers.length === 0 || p.rows.length === 0) {
        setUploadError(
          'Could not find valid CSV headers and rows. Please ensure the file is a standard comma-separated (.csv) export from your bank.'
        );
        return;
      }
      setRawCsvText(content);
      setFileName(file.name);
      setMapping(p.suggestedMapping);
      // Immediately sync to parent App so clicking "Next: 2. All Transactions" at the bottom works identically to "Save & View All Transactions"!
      onSyncCsvData(content, p.suggestedMapping, file.name);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const canAnalyze =
    parsedStats.txCount > 0 &&
    activeMapping !== null &&
    (parsedStats.meetsMinimum || allowShortOverride);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageExplainerHeader
        stepNumber={1}
        title="Upload & Map Your Bank CSV"
        subtitle="Export at least 3 months (90+ days) of transaction history from your bank as a .csv file and load it below."
        terms={[
          {
            term: '3-Month Span (90 Days)',
            meaning:
              'At least 3 months of bank data gives a reliable baseline to spot repeating bills and price increases.',
          },
          {
            term: 'Single vs. Split Amount',
            meaning:
              'Use "One Amount Column" if expenses have minus signs (-25.00), or "Separate Debit & Credit" if your bank uses two columns.',
          },
          {
            term: 'Payee vs. Description',
            meaning:
              'Payee is who you paid (e.g., Netflix, Woolworths). Description holds extra notes or reference codes.',
          },
          {
            term: 'Auto-Save Enabled',
            meaning:
              'Once you select a file, it loads automatically—use either "Save & View All Transactions" or the bottom "Next" button.',
          },
        ]}
      />

      {/* Upload Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 sm:mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Step 1: Select Your Bank <code className="text-emerald-400">.csv</code> File
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Drag and drop your file below, or tap to browse from your device.
            </p>
          </div>

          {rawCsvText && (
            <button
              type="button"
              onClick={() => {
                setRawCsvText('');
                setFileName('');
                setMapping(null);
                onClearData();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition self-start"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Loaded File</span>
            </button>
          )}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 sm:p-8 text-center transition ${
            dragActive
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-slate-700 bg-slate-950/70 hover:border-slate-600'
          }`}
        >
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2.5">
            <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <p className="text-sm sm:text-base font-semibold text-white">
            {fileName ? (
              <>
                Loaded file: <span className="text-emerald-400 break-all">{fileName}</span>
              </>
            ) : (
              'Drop your bank CSV file here'
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Works with ANZ, ASB, BNZ, Westpac, Kiwibank, Chase, CommBank, Monzo, Revolut,
            or any CSV with Date, Amount, and Merchant columns.
          </p>

          <label className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer transition">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{fileName ? 'Choose a Different CSV File' : 'Browse CSV File'}</span>
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </label>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Processed privately inside your browser.</span>
          </div>
        </div>

        {uploadError && (
          <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs sm:text-sm text-rose-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Step 2: Column Mapping & Span Check */}
      {rawCsvText && activeMapping && preview.headers.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {/* Date Span Banner */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 ${
              parsedStats.meetsMinimum
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-amber-500/40 bg-amber-500/10'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                {parsedStats.meetsMinimum ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3
                    className={`text-sm sm:text-base font-bold ${
                      parsedStats.meetsMinimum ? 'text-emerald-200' : 'text-amber-200'
                    }`}
                  >
                    {parsedStats.meetsMinimum
                      ? `3-Month Minimum Met: ${parsedStats.totalDays} Days (${parsedStats.startDate} to ${parsedStats.endDate})`
                      : `Shorter Date Range: ${parsedStats.totalDays} Days (${parsedStats.startDate} to ${parsedStats.endDate})`}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                    {parsedStats.meetsMinimum ? (
                      <>
                        Loaded <strong>{parsedStats.txCount} transactions</strong> across{' '}
                        <strong>{(parsedStats.totalDays / 30.44).toFixed(1)} months</strong>.
                        Your file is ready—click{' '}
                        <strong>&ldquo;Save &amp; View All Transactions&rdquo;</strong> or{' '}
                        <strong>&ldquo;Next: 2. All Transactions&rdquo;</strong> below.
                      </>
                    ) : (
                      <>
                        Loaded <strong>{parsedStats.txCount} transactions</strong>. At least 3
                        months (90 days) is recommended for full multi-month bill comparison,
                        but your file is loaded and ready to view.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {!parsedStats.meetsMinimum && parsedStats.txCount > 0 && (
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-amber-100 bg-amber-500/20 border border-amber-500/40 px-3.5 py-2 rounded-xl cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={allowShortOverride}
                    onChange={(e) => setAllowShortOverride(e.target.checked)}
                    className="rounded border-amber-400 text-amber-500 focus:ring-0 h-4 w-4"
                  />
                  <span>Allow Shorter File</span>
                </label>
              )}
            </div>
          </div>

          {/* Column Mapper */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Step 2: Verify Your CSV Column Mapping
                  </h3>
                  <p className="text-xs text-slate-400">
                    Matched automatically from your headers. Adjust any dropdown if needed.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
                <button
                  type="button"
                  onClick={() =>
                    updateMappingAndSync({ ...activeMapping, amountMode: 'single' })
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeMapping.amountMode === 'single'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  One Amount Column
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateMappingAndSync({ ...activeMapping, amountMode: 'split' })
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeMapping.amountMode === 'split'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Separate Debit &amp; Credit
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Date */}
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                <label className="block text-xs font-semibold text-white mb-0.5">
                  Transaction Date Column
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  The date the payment happened
                </p>
                <select
                  value={activeMapping.dateCol}
                  onChange={(e) =>
                    updateMappingAndSync({ ...activeMapping, dateCol: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                >
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount or Split Debit/Credit */}
              {activeMapping.amountMode === 'single' ? (
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                  <label className="block text-xs font-semibold text-white mb-0.5">
                    Amount Column
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">
                    Negative (-25.00) for spending, positive for income
                  </p>
                  <select
                    value={activeMapping.amountCol}
                    onChange={(e) =>
                      updateMappingAndSync({
                        ...activeMapping,
                        amountCol: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                  >
                    {preview.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                    <label className="block text-xs font-semibold text-white mb-0.5">
                      Money Out (Debit) Column
                    </label>
                    <p className="text-[11px] text-slate-400 mb-1.5">
                      Column showing expenses / withdrawals
                    </p>
                    <select
                      value={activeMapping.debitCol}
                      onChange={(e) =>
                        updateMappingAndSync({
                          ...activeMapping,
                          debitCol: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="">-- Select Column --</option>
                      {preview.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                    <label className="block text-xs font-semibold text-white mb-0.5">
                      Money In (Credit) Column
                    </label>
                    <p className="text-[11px] text-slate-400 mb-1.5">
                      Column showing deposits / income
                    </p>
                    <select
                      value={activeMapping.creditCol}
                      onChange={(e) =>
                        updateMappingAndSync({
                          ...activeMapping,
                          creditCol: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="">-- Select Column --</option>
                      {preview.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Merchant / Payee */}
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                <label className="block text-xs font-semibold text-white mb-0.5">
                  Payee / Merchant Name Column
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Who was paid (store or company name)
                </p>
                <select
                  value={activeMapping.merchantCol}
                  onChange={(e) =>
                    updateMappingAndSync({
                      ...activeMapping,
                      merchantCol: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                >
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description / Particulars */}
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                <label className="block text-xs font-semibold text-white mb-0.5">
                  Description / Particulars (Optional)
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Extra transaction details or memo notes
                </p>
                <select
                  value={activeMapping.descriptionCol}
                  onChange={(e) =>
                    updateMappingAndSync({
                      ...activeMapping,
                      descriptionCol: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="">(None)</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Balance */}
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                <label className="block text-xs font-semibold text-white mb-0.5">
                  Account Balance Column (Optional)
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Remaining balance after each transaction
                </p>
                <select
                  value={activeMapping.balanceCol}
                  onChange={(e) =>
                    updateMappingAndSync({
                      ...activeMapping,
                      balanceCol: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="">(Estimate automatically)</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency */}
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                <label className="block text-xs font-semibold text-white mb-0.5">
                  Currency Symbol
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Used for displaying amounts
                </p>
                <select
                  value={activeMapping.currencySymbol}
                  onChange={(e) =>
                    updateMappingAndSync({
                      ...activeMapping,
                      currencySymbol: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="$">$ (Dollar — NZD / AUD / USD)</option>
                  <option value="£">£ (Pound — GBP)</option>
                  <option value="€">€ (Euro — EUR)</option>
                </select>
              </div>
            </div>

            {/* First 5 rows preview */}
            {parsedStats.sampleTxs.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Preview of First 5 Transactions From Your File
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="py-2 px-2.5">Date</th>
                        <th className="py-2 px-2.5">Cleaned Merchant</th>
                        <th className="py-2 px-2.5">Category</th>
                        <th className="py-2 px-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 bg-slate-900/40">
                      {parsedStats.sampleTxs.map((t) => (
                        <tr key={t.id} className="text-slate-200">
                          <td className="py-2 px-2.5 font-mono whitespace-nowrap">
                            {t.date}
                          </td>
                          <td className="py-2 px-2.5 font-medium text-white">
                            {t.normalizedMerchant}
                          </td>
                          <td className="py-2 px-2.5 capitalize">
                            {t.category.replace('_', ' ')}
                          </td>
                          <td
                            className={`py-2 px-2.5 text-right font-mono font-semibold whitespace-nowrap ${
                              t.amount >= 0 ? 'text-emerald-400' : 'text-rose-300'
                            }`}
                          >
                            {t.amount >= 0 ? '+' : '-'}
                            {activeMapping.currencySymbol}
                            {t.absAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Confirm Button */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={!canAnalyze}
                onClick={() => {
                  if (activeMapping) {
                    onConfirmImport(
                      rawCsvText,
                      activeMapping,
                      fileName || 'Uploaded CSV'
                    );
                  }
                }}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition ${
                  canAnalyze
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Save &amp; View All Transactions</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

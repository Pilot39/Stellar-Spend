import { logger } from '@/lib/logger';
import type { Transaction } from './transaction-storage';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeCell(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    // Remove the anchor and revoke the object URL once the download has been
    // kicked off. Revoking synchronously right after click() can cancel the
    // download in some browsers, so defer it to the next tick.
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

// ---------------------------------------------------------------------------
// Large-dataset safeguards
// ---------------------------------------------------------------------------

/**
 * Threshold (in rows) above which exports are generated in chunks to avoid
 * blocking the main thread and building enormous intermediate strings.
 */
export const LARGE_EXPORT_THRESHOLD = 5_000;

/** Number of rows processed per chunk for large exports. */
const EXPORT_CHUNK_SIZE = 1_000;

export function isLargeExport(txs: Transaction[]): boolean {
  return txs.length > LARGE_EXPORT_THRESHOLD;
}

/**
 * Builds a string by processing `items` in chunks, yielding to the event loop
 * between chunks so the UI stays responsive for large datasets.
 */
async function buildChunked(
  items: Transaction[],
  renderRow: (tx: Transaction) => string,
  separator: string,
): Promise<string> {
  const parts: string[] = [];
  for (let i = 0; i < items.length; i += EXPORT_CHUNK_SIZE) {
    const chunk = items.slice(i, i + EXPORT_CHUNK_SIZE);
    parts.push(chunk.map(renderRow).join(separator));
    if (i + EXPORT_CHUNK_SIZE < items.length) {
      // Yield to the event loop between chunks.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return parts.join(separator);
}

function getTimestampedFilename(basename: string, ext: string): string {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  return `${basename}_${timestamp}.${ext}`;
}

// ---------------------------------------------------------------------------
// Date-range filter (reused by both exporters)
// ---------------------------------------------------------------------------

export function filterByDateRange(
  txs: Transaction[],
  dateFrom: string,
  dateTo: string,
): Transaction[] {
  let result = txs;
  if (dateFrom) {
    const from = new Date(dateFrom).getTime();
    result = result.filter((tx) => tx.timestamp >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo).getTime() + 86_400_000 - 1;
    result = result.filter((tx) => tx.timestamp <= to);
  }
  return result;
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

const CSV_HEADERS = [
  'ID',
  'Date',
  'Amount (USDC)',
  'Currency',
  'Stellar Tx Hash',
  'Bridge Status',
  'Payout Order ID',
  'Payout Status',
  'Bank / Institution',
  'Account Name',
  'Account Identifier',
  'Status',
  'Error',
];

function renderCSVRow(tx: Transaction): string {
  return [
    tx.id,
    formatDate(tx.timestamp),
    tx.amount,
    tx.currency,
    tx.stellarTxHash ?? '',
    tx.bridgeStatus ?? '',
    tx.payoutOrderId ?? '',
    tx.payoutStatus ?? '',
    tx.beneficiary.institution,
    tx.beneficiary.accountName,
    tx.beneficiary.accountIdentifier,
    tx.status,
    tx.error ?? '',
  ]
    .map(escapeCell)
    .join(',');
}

export function exportCSV(txs: Transaction[], filename = 'transactions.csv'): void {
  try {
    const header = CSV_HEADERS.map(escapeCell).join(',');
    const body = txs.map(renderCSVRow).join('\n');
    const csv = txs.length > 0 ? `${header}\n${body}` : header;

    triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
  } catch (error) {
    logger.error('CSV export failed:', {}, error);
    throw new Error('Failed to export to CSV');
  }
}

/**
 * Chunked CSV export for large datasets. Yields between chunks to keep the UI
 * responsive. Falls back to the synchronous path for normal-sized exports.
 */
export async function exportCSVAsync(
  txs: Transaction[],
  filename = 'transactions.csv',
): Promise<void> {
  try {
    if (!isLargeExport(txs)) {
      exportCSV(txs, filename);
      return;
    }
    const header = CSV_HEADERS.map(escapeCell).join(',');
    const body = await buildChunked(txs, renderCSVRow, '\n');
    const csv = txs.length > 0 ? `${header}\n${body}` : header;
    triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
  } catch (error) {
    logger.error('CSV export failed:', {}, error);
    throw new Error('Failed to export to CSV');
  }
}

// ---------------------------------------------------------------------------
// PDF export  (no external library — opens a styled print window)
// ---------------------------------------------------------------------------

export function exportPDF(txs: Transaction[], filename = 'transactions'): void {
  const rows = txs
    .map(
      (tx) => `
      <tr>
        <td>${formatDate(tx.timestamp)}</td>
        <td class="mono">${tx.stellarTxHash ?? '—'}</td>
        <td>${tx.amount} USDC</td>
        <td>${tx.currency}</td>
        <td>${tx.beneficiary.institution}</td>
        <td>${tx.beneficiary.accountName}</td>
        <td class="status ${tx.status}">${tx.status.toUpperCase()}</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${filename}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  p.meta { font-size: 10px; color: #666; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #c9a962; color: #000; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
  td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .mono { font-family: monospace; font-size: 10px; word-break: break-all; }
  .status { font-weight: 700; font-size: 10px; }
  .pending { color: #b45309; }
  .completed { color: #15803d; }
  .failed { color: #b91c1c; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>Stellar-Spend — Transaction History</h1>
<p class="meta">Exported ${new Date().toLocaleString()} · ${txs.length} transaction${txs.length !== 1 ? 's' : ''}</p>
<table>
  <thead>
    <tr><th>Date</th><th>Tx Hash</th><th>Amount</th><th>Currency</th><th>Bank</th><th>Account Name</th><th>Status</th></tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
</body>
</html>`;

  try {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      throw new Error('Popup blocked — please allow popups to export PDF');
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    // Small delay so the browser renders before print dialog
    setTimeout(() => {
      win.print();
    }, 400);
  } catch (error) {
    logger.error('PDF export failed:', {}, error);
    throw error instanceof Error ? error : new Error('Failed to export to PDF');
  }
}

// ---------------------------------------------------------------------------
// JSON export
// ---------------------------------------------------------------------------

function serializeJSONTransaction(tx: Transaction) {
  return {
    id: tx.id,
    date: formatDate(tx.timestamp),
    timestamp: tx.timestamp,
    amount: tx.amount,
    currency: tx.currency,
    stellarTxHash: tx.stellarTxHash,
    bridgeStatus: tx.bridgeStatus,
    payoutOrderId: tx.payoutOrderId,
    payoutStatus: tx.payoutStatus,
    beneficiary: tx.beneficiary,
    status: tx.status,
    error: tx.error,
  };
}

export function exportJSON(txs: Transaction[], filename = 'transactions.json'): void {
  try {
    const data = {
      exportedAt: new Date().toISOString(),
      transactionCount: txs.length,
      transactions: txs.map(serializeJSONTransaction),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerDownload(blob, getTimestampedFilename(filename.replace('.json', ''), 'json'));
  } catch (error) {
    logger.error('JSON export failed:', {}, error);
    throw new Error('Failed to export to JSON');
  }
}

/**
 * Chunked JSON export for large datasets. Yields between chunks to keep the UI
 * responsive. Falls back to the synchronous path for normal-sized exports.
 */
export async function exportJSONAsync(
  txs: Transaction[],
  filename = 'transactions.json',
): Promise<void> {
  try {
    if (!isLargeExport(txs)) {
      exportJSON(txs, filename);
      return;
    }
    const body = await buildChunked(
      txs,
      (tx) => JSON.stringify(serializeJSONTransaction(tx), null, 2),
      ',\n',
    );
    const json = `{
  "exportedAt": ${JSON.stringify(new Date().toISOString())},
  "transactionCount": ${txs.length},
  "transactions": [
${body}
  ]
}`;
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, getTimestampedFilename(filename.replace('.json', ''), 'json'));
  } catch (error) {
    logger.error('JSON export failed:', {}, error);
    throw new Error('Failed to export to JSON');
  }
}

// ---------------------------------------------------------------------------
// Excel export (XLSX)
// ---------------------------------------------------------------------------

export async function exportXLSX(
  txs: Transaction[],
  filename = 'transactions.xlsx',
): Promise<void> {
  try {
    const { utils, writeFile } = await import('xlsx');

    const data = txs.map((tx) => ({
      Date: formatDate(tx.timestamp),
      'Amount (USDC)': tx.amount,
      Currency: tx.currency,
      'Stellar Tx Hash': tx.stellarTxHash ?? '',
      'Bridge Status': tx.bridgeStatus ?? '',
      'Payout Order ID': tx.payoutOrderId ?? '',
      'Payout Status': tx.payoutStatus ?? '',
      'Bank / Institution': tx.beneficiary.institution,
      'Account Name': tx.beneficiary.accountName,
      'Account Identifier': tx.beneficiary.accountIdentifier,
      Status: tx.status,
      Error: tx.error ?? '',
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Transactions');

    writeFile(wb, getTimestampedFilename(filename.replace('.xlsx', ''), 'xlsx'));
  } catch (error) {
    logger.error('Excel export failed:', {}, error);
    throw new Error('Failed to export to Excel');
  }
}

// ---------------------------------------------------------------------------
// Unified export dispatcher (used by ExportControls)
// ---------------------------------------------------------------------------

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';

/**
 * Runs an export for the given format, routing large CSV/JSON datasets through
 * the chunked async path. Errors are normalised to `Error` instances so callers
 * (e.g. ExportControls) can surface a consistent message.
 */
export async function runExport(
  format: ExportFormat,
  txs: Transaction[],
  filename?: string,
): Promise<void> {
  try {
    switch (format) {
      case 'csv':
        await exportCSVAsync(txs, filename ?? 'transactions.csv');
        break;
      case 'json':
        await exportJSONAsync(txs, filename ?? 'transactions.json');
        break;
      case 'xlsx':
        await exportXLSX(txs, filename ?? 'transactions.xlsx');
        break;
      case 'pdf':
        exportPDF(txs, filename ?? 'transactions');
        break;
      default:
        throw new Error(`Unsupported export format: ${String(format)}`);
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Export failed');
  }
}

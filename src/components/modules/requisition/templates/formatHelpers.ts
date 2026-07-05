// ─────────────────────────────────────────────────────────────────────────────
// Shared formatting helpers for the 3 Requisition print templates
// (Compact / Standard / Detailed). Extracted here so all three call the
// same implementation instead of each carrying its own copy.
// ─────────────────────────────────────────────────────────────────────────────

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatTaka(value: number): string {
  if (isNaN(value)) return '0.00';
  return value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

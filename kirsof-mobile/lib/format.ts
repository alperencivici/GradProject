export const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Fruits', value: 'fruits' },
  { label: 'Vegetables', value: 'vegetables' },
  { label: 'Dairy', value: 'dairy' },
  { label: 'Honey & Jams', value: 'honey' },
  { label: 'Grains', value: 'grains' },
  { label: 'Oils', value: 'oils' },
  { label: 'Eggs & Poultry', value: 'eggs' },
  { label: 'Other', value: 'other' },
];

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'completed',
  'return_requested',
  'admin_review',
  'returned',
  'canceled',
] as const;

export function money(value: number | string | null | undefined) {
  const n = Number(value || 0);
  return `TL ${n.toFixed(2)}`;
}

export function shortId(id?: string | null) {
  return id ? id.substring(0, 8).toUpperCase() : '--------';
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    return_requested: 'Return Requested',
    admin_review: 'Admin Review',
    returned: 'Returned',
  };
  return labels[status] || status;
}

export function statusColors(status: string) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: '#f5f5f4', text: '#57534e', border: '#e7e5e4' },
    paid: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
    shipped: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
    completed: { bg: '#d1fae5', text: '#047857', border: '#a7f3d0' },
    cancelled: { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
    canceled: { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
    return_requested: { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' },
    admin_review: { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
    returned: { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' },
  };
  return colors[status] || colors.pending;
}

export function roleColors(role: string) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    admin: { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' },
    farmer: { bg: '#d1fae5', text: '#047857', border: '#a7f3d0' },
    consumer: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
  };
  return colors[role] || { bg: '#f5f5f4', text: '#57534e', border: '#e7e5e4' };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatTurkishPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  let clean = digits;
  if (clean.startsWith('90')) clean = clean.slice(2);
  else if (clean.startsWith('0')) clean = clean.slice(1);
  clean = clean.slice(0, 10);

  if (clean.length === 0) return '';
  if (clean.length <= 3) return `+90 (${clean}`;
  if (clean.length <= 6) return `+90 (${clean.slice(0, 3)}) ${clean.slice(3)}`;
  if (clean.length <= 8) {
    return `+90 (${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return `+90 (${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8)}`;
}

export function extractPhoneDigits(formatted: string): string {
  const digits = formatted.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length >= 11) return `+90${digits.slice(1)}`;
  if (digits.length === 10) return `+90${digits}`;
  return digits ? `+90${digits}` : '';
}

export function phoneToDisplay(stored: string | null | undefined): string {
  return stored ? formatTurkishPhone(stored) : '';
}

export function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
